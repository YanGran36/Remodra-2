import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { db } from "../db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
// Importar middleware de autorización
import { verifyResourceOwnership, verifyRelationship, preventCascadeOperations, EntityType } from "./middleware/authorization";
import { 
  projectInsertSchema, 
  estimateItemInsertSchema,
  invoiceInsertSchema,
  materialInsertSchema,
  followUpInsertSchema,
  propertyMeasurementInsertSchema,
  priceConfigurationInsertSchema,
  contractorCreateSchema,
  contractorInsertSchema,
  servicePricing,
  projects,
  aiUsageLog,
  contractors,
  clients,
  agents,
  estimates,
  invoices,
  events
} from "../shared/schema";

import { analyzeProject, generateSharingContent, generateProfessionalJobDescription, generateServiceDescription, generateEstimateDescription } from "./ai-service";
import * as achievementService from "./services/achievement-service";
import { registerTimeclockRoutes } from "./routes/timeclock-routes";
import { registerPricingRoutes } from "./routes/pricing";
import { registerDirectServiceRoutes } from "./routes/direct-service";
import { registerDirectServicesRoutes } from "./routes/direct-services";
import subscriptionRoutes from "./routes/subscription";
import searchRoutes from "./routes/search";
import * as sqliteSchema from "../shared/schema-sqlite";
import * as mainSchema from "../shared/schema";
import { generateServiceDescriptionForEstimate } from './ai-service';

// Use SQLite schemas in development
const isLocalDev = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('sqlite');

// Conditionally use the appropriate schema and tables
const estimateInsertSchema = isLocalDev ? sqliteSchema.estimate_insert_schema : mainSchema.estimateInsertSchema;
const eventInsertSchema = isLocalDev ? sqliteSchema.event_insert_schema : mainSchema.eventInsertSchema;
const clientInsertSchema = isLocalDev ? sqliteSchema.client_insert_schema : mainSchema.clientInsertSchema;
const agentInsertSchema = isLocalDev ? sqliteSchema.agent_insert_schema : mainSchema.agentInsertSchema;
const invoiceItemInsertSchema = isLocalDev ? sqliteSchema.invoice_item_insert_schema : mainSchema.invoiceItemInsertSchema;

// Use the appropriate table references based on environment
const contractorsTable = isLocalDev ? sqliteSchema.contractors : contractors;
const clientsTable = isLocalDev ? sqliteSchema.clients : clients;
const agentsTable = isLocalDev ? sqliteSchema.agents : agents;
const estimatesTable = isLocalDev ? sqliteSchema.estimates : estimates;
const eventsTable = isLocalDev ? sqliteSchema.events : events;
const estimateItemsTable = isLocalDev ? sqliteSchema.estimate_items : mainSchema.estimateItems;

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Registrar las rutas directas para servicios (COMENTADO - conflicto con nuevo endpoint)
  // registerDirectServiceRoutes(app);
  
  // Register new direct services routes for pricing page
  registerDirectServicesRoutes(app);

  // Register pricing routes
  registerPricingRoutes(app);

  // Register timeclock routes
  registerTimeclockRoutes(app);

  // Register subscription routes
  app.use("/api/subscription", subscriptionRoutes);

  // Register search routes
  app.use("/api/search", searchRoutes);

  // Simple service price update endpoint
  app.post('/api/update-service-price', async (req: any, res) => {
    console.log('[UPDATE] Service price update request received');
    console.log('[UPDATE] Request body:', req.body);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { originalServiceType, name, serviceType, unit, laborRate, laborMethod } = req.body;
      
      console.log(`[UPDATE] Updating service ${originalServiceType} for contractor ${req.user.id}`);
      
      const updateData = {
        name: name || 'Updated Service',
        serviceType: serviceType || originalServiceType,
        unit: unit || 'unit',
        laborRate: laborRate.toString(),
        laborCalculationMethod: laborMethod || 'by_area',
        updatedAt: new Date()
      };
      
      console.log('[UPDATE] Update data:', updateData);
      
      const [updatedService] = await db
        .update(servicePricing)
        .set(updateData)
        .where(and(
          eq(servicePricing.serviceType, originalServiceType),
          isLocalDev ? eq(sqliteSchema.service_pricing.contractor_id, req.user.id) : eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      if (!updatedService) {
        console.log('[UPDATE] Service not found');
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log('[UPDATE] Service updated successfully:', updatedService);
      
      res.json({
        id: updatedService.id,
        name: updatedService.name,
        serviceType: updatedService.serviceType,
        unit: updatedService.unit,
        laborRate: parseFloat(updatedService.laborRate),
        laborMethod: updatedService.laborCalculationMethod
      });
    } catch (error) {
      console.error('[UPDATE] Error updating service:', error);
      res.status(500).json({ message: 'Error updating service', error: error.message });
    }
  });
  
  // Language update route
  app.post("/api/protected/language", async (req, res) => {
    try {
      const { language } = req.body;
      
      // Validate language is supported
      if (!["en", "es", "fr", "pt"].includes(language)) {
        return res.status(400).json({ message: "Unsupported language" });
      }
      
      // Update user's language preference
      const updatedUser = await storage.updateContractor(req.user!.id, { language });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating language:", error);
      res.status(500).json({ message: "Failed to update language preference" });
    }
  });

  // Clients routes
  app.get("/api/protected/clients", async (req, res) => {
    try {
      const clients = await storage.getClients(req.user!.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Export/Import routes (separate from client CRUD routes)
  app.get("/api/protected/data/clients/export", async (req, res) => {
    try {
      const { exportClientsToJSON } = await import("./data-export");
      const clientsData = await exportClientsToJSON(req.user!.id);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clients_export_${timestamp}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(clientsData);
    } catch (error) {
      console.error("Error exporting clients:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  app.post("/api/protected/data/clients/import", async (req, res) => {
    try {
      const { importClientsFromJSON } = await import("./data-export");
      const { clientsData } = req.body;
      
      if (!clientsData || !Array.isArray(clientsData)) {
        return res.status(400).json({ message: "Invalid client data provided" });
      }
      
      const result = await importClientsFromJSON(clientsData, req.user!.id);
      res.json({ message: result });
    } catch (error) {
      console.error("Error importing clients:", error);
      res.status(500).json({ message: "Failed to import clients" });
    }
  });

  app.get("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    async (req, res) => {
      try {
        const client = await storage.getClient(Number(req.params.id), req.user!.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
        res.json(client);
      } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Failed to fetch client" });
      }
    }
  );

  // Check client uniqueness before creation
  app.post("/api/protected/clients/check-uniqueness", async (req, res) => {
    try {
      const { email, phone, address } = req.body;
      
      const uniquenessCheck = await storage.checkClientUniqueness(
        req.user!.id,
        email,
        phone,
        address
      );

      if (!uniquenessCheck.isUnique) {
        return res.status(409).json({
          isUnique: false,
          conflictType: uniquenessCheck.conflictType,
          existingClient: uniquenessCheck.existingClient,
          message: `Client already exists with this ${uniquenessCheck.conflictType}`
        });
      }

      res.json({ isUnique: true });
    } catch (error) {
      console.error("Error checking client uniqueness:", error);
      res.status(500).json({ message: "Failed to check client uniqueness" });
    }
  });

  // Find similar clients
  app.post("/api/protected/clients/find-similar", async (req, res) => {
    try {
      const { email, phone, address } = req.body;
      
      const similarClients = await storage.findSimilarClients(
        req.user!.id,
        { email, phone, address }
      );

      res.json(similarClients);
    } catch (error) {
      console.error("Error finding similar clients:", error);
      res.status(500).json({ message: "Failed to find similar clients" });
    }
  });

  app.post("/api/protected/clients", async (req, res) => {
    try {
      console.log("Data received for client creation:", JSON.stringify(req.body, null, 2));
      
      const clientData = {
        contractor_id: req.user!.id,
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        city: req.body.city || null,
        state: req.body.state || null,
        zip: req.body.zip || null,
        notes: req.body.notes || null,
        cancellation_history: req.body.cancellationHistory || null,
        created_at: Date.now()
      };
      
      console.log("Processed client data:", JSON.stringify(clientData, null, 2));
      
      // Validate with the appropriate schema
      const validatedData = clientInsertSchema.parse(clientData);
      
      // Use storage method which includes uniqueness validation
      const newClient = await storage.createClient(validatedData);
      
      res.status(201).json(newClient);
    } catch (error: any) {
      console.error("Error creating client:", error);
      
      // Handle uniqueness validation errors
      if (error.code === 'CLIENT_DUPLICATE') {
        return res.status(409).json({ 
          message: `Client already exists with this ${error.conflictType}`,
          conflictType: error.conflictType,
          existingClient: error.existingClient,
          error: 'DUPLICATE_CLIENT'
        });
      }
      
      res.status(500).json({ message: "Failed to create client", error: error.message });
    }
  });

  app.patch("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    async (req, res) => {
      try {
        const clientId = Number(req.params.id);
        
        const validatedData = clientInsertSchema.partial().parse(req.body);
        
        const client = await storage.updateClient(clientId, req.user!.id, validatedData);
        res.json(client);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  );

  app.delete("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    preventCascadeOperations('client'),
    async (req, res) => {
      try {
        const clientId = Number(req.params.id);
        const success = await storage.deleteClient(clientId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Client not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Failed to delete client" });
      }
    }
  );

  // Client Messages routes
  app.get("/api/protected/client-messages", async (req, res) => {
    try {
      const { clientId } = req.query;
      const messages = await storage.getClientMessages(req.user!.id, clientId ? Number(clientId) : undefined);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/protected/client-messages", async (req, res) => {
    try {
      const validatedData = clientMessageInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const message = await storage.createClientMessage(validatedData);
      
      // Send email notification if requested
      if (req.body.sendEmail) {
        await storage.sendMessageEmail(message);
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch("/api/protected/client-messages/:id/read", async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      await storage.markMessageAsRead(messageId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.post("/api/protected/client-messages/:id/reply", async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      const validatedData = messageReplyInsertSchema.parse({
        ...req.body,
        messageId,
        senderType: "contractor",
        senderId: req.user!.id
      });
      
      const reply = await storage.createMessageReply(validatedData);
      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating message reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Client Portal Token routes
  app.post("/api/protected/client-portal-token", async (req, res) => {
    try {
      const { clientId } = req.body;
      const token = await storage.generateClientPortalToken(clientId, req.user!.id);
      res.json(token);
    } catch (error) {
      console.error("Error generating portal token:", error);
      res.status(500).json({ message: "Failed to generate portal token" });
    }
  });

  // Public invoice endpoints for client access
  app.get("/api/public/invoices/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      // Get invoice with client and contractor info
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get invoice items
      const items = await storage.getInvoiceItemsById(id);
      
      // Get payments for this invoice
      const payments = await storage.getPayments(id, invoice.contractor_id);

      // Get client and contractor info
      const client = await storage.getClientById(invoice.client_id, invoice.contractor_id);
      const contractor = await storage.getContractor(invoice.contractor_id);

      // Get project info if exists
      let project = null;
      if (invoice.project_id) {
        project = await storage.getProjectById(invoice.project_id, invoice.contractor_id);
      }

      const response = {
        ...invoice,
        items: items || [],
        payments: payments || [],
        client: client || {},
        contractor: contractor || {},
        project: project || null
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching public invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/public/invoices/:id/client-action", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { action, signatureData, notes } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      switch (action) {
        case 'sign':
          if (!signatureData) {
            return res.status(400).json({ error: "Signature data is required" });
          }
          
          await storage.updateInvoiceById(id, {
            client_signature: signatureData,
            status: 'signed'
          });
          
          res.json({ message: "Invoice signed successfully" });
          break;

        case 'approve':
          await storage.updateInvoiceById(id, {
            status: 'approved'
          });
          
          res.json({ message: "Invoice approved successfully" });
          break;

        default:
          res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      console.error("Error processing client action:", error);
      res.status(500).json({ error: "Failed to process action" });
    }
  });

  // Get client data for client portal - MUST COME BEFORE THE TOKEN ROUTE
  app.get("/api/client-portal/:clientId/data", async (req, res) => {
    try {
      const { clientId } = req.params;
      const id = parseInt(clientId);

      // Define mapping functions first
      const mapClient = c => c ? {
        id: c.id,
        firstName: c.firstName || c.first_name,
        lastName: c.lastName || c.last_name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip
      } : null;
      const mapProject = p => p ? {
        id: p.id,
        title: p.title,
        status: p.status,
        contractorId: p.contractorId || p.contractor_id,
        clientId: p.clientId || p.client_id,
        description: p.description,
        budget: p.budget,
        startDate: p.startDate || p.start_date,
        endDate: p.endDate || p.end_date,
        notes: p.notes,
        createdAt: p.createdAt || p.created_at
      } : null;

      let client;
      try {
        // Use the correct table reference based on environment
        const clientsTableRef = isLocalDev ? sqliteSchema.clients : clientsTable;
        client = await db.select().from(clientsTableRef).where(eq(clientsTableRef.id, id)).limit(1);
        client = client[0]; // Get the first result
      } catch (err) {
        console.error("[Client Portal] Error fetching client by ID:", err);
        return res.status(500).json({ error: "DB error fetching client" });
      }
      if (!client) {
        console.log('[Client Portal] Client not found for id:', id);
        return res.status(404).json({ error: "Client not found" });
      }
      const contractorId = client.contractor_id;

      let allProjects = [], allEstimates = [], allInvoices = [], allEvents = [], contractor = null, primaryAgent = null;
      try {
        allProjects = await storage.getProjects(contractorId);
      } catch (err) {
        console.error("[Client Portal] Error fetching projects:", err);
      }
      try {
        allEstimates = await storage.getEstimates(contractorId);
      } catch (err) {
        console.error("[Client Portal] Error fetching estimates:", err);
      }
      try {
        allInvoices = await storage.getInvoices(contractorId);
      } catch (err) {
        console.error("[Client Portal] Error fetching invoices:", err);
      }
      try {
        allEvents = await storage.getEvents(contractorId);
      } catch (err) {
        console.error("[Client Portal] Error fetching events:", err);
      }
      try {
        contractor = await storage.getContractor(contractorId);
        if (contractor && contractor.primaryAgentId) {
          primaryAgent = await storage.getAgent(contractor.primaryAgentId, contractorId);
        }
      } catch (err) {
        console.error("[Client Portal] Error fetching contractor/agent:", err);
      }

      const clientProjects = allProjects.filter(p => p.clientId === id);
      // Map estimates to ensure consistent field names and filter by client
      const mappedEstimates = allEstimates.map(e => ({
        ...e,
        clientId: e.clientId || e.client_id,
        contractorId: e.contractorId || e.contractor_id,
        projectId: e.projectId || e.project_id,
        estimateNumber: e.estimateNumber || e.estimate_number,
        issueDate: e.issueDate || e.issue_date,
        expiryDate: e.expiryDate || e.expiry_date,
        createdAt: e.createdAt || e.created_at,
        client: mapClient(e.client),
        project: mapProject(e.project),
        // Add missing fields that the frontend expects
        title: e.notes || `Estimate #${e.estimateNumber || e.estimate_number}`,
        description: e.notes || ''
      }));
      const clientEstimates = mappedEstimates.filter(e => e.clientId === id);
      // Map all invoices to camelCase first
      const mappedInvoices = allInvoices.map(i => ({
        ...i,
        clientId: i.clientId || i.client_id,
        contractorId: i.contractorId || i.contractor_id,
        projectId: i.projectId || i.project_id,
        estimateId: i.estimateId || i.estimate_id,
        invoiceNumber: i.invoiceNumber || i.invoice_number,
        issueDate: i.issueDate || i.issue_date,
        dueDate: i.dueDate || i.due_date,
        status: i.status,
        subtotal: i.subtotal,
        tax: i.tax,
        discount: i.discount,
        total: i.total,
        amountPaid: i.amountPaid || i.amount_paid,
        terms: i.terms,
        notes: i.notes,
        clientSignature: i.clientSignature || i.client_signature,
        contractorSignature: i.contractorSignature || i.contractor_signature,
        createdAt: i.createdAt || i.created_at,
        client: mapClient(i.client),
        project: mapProject(i.project),
        // Add missing fields that the frontend expects
        title: i.notes || `Invoice #${i.invoiceNumber || i.invoice_number}`
      }));
      // Now filter by clientId
      const clientInvoices = mappedInvoices.filter(i => i.clientId === id);
      // Get all events that are related to this client
      const clientEvents = allEvents.filter(e => {
        // Direct client match
        if (e.clientId === id) return true;
        
        // Events related to client's estimates
        if (e.estimateId && clientEstimates.some(est => est.id === e.estimateId)) return true;
        
        // Events related to client's projects
        if (e.projectId && clientProjects.some(proj => proj.id === e.projectId)) return true;
        
        return false;
      });

      // Also include estimates with appointment dates as events
      const estimatesWithAppointments = clientEstimates
        .filter(est => est.appointmentDate || est.appointment_date)
        .map(est => {
          const appointmentDate = est.appointmentDate || est.appointment_date;
          const duration = est.appointmentDuration || est.appointment_duration || 60;
          const endTime = new Date(appointmentDate).getTime() + (duration * 60 * 1000);
          
          return {
            id: `estimate-${est.id}`,
            title: `Estimate Appointment - ${est.estimateNumber || est.estimate_number}`,
            description: est.notes || `Appointment for estimate ${est.estimateNumber || est.estimate_number}`,
            startTime: appointmentDate,
            endTime: endTime,
            address: est.client?.address || client.address,
            city: est.client?.city || client.city,
            state: est.client?.state || client.state,
            zip: est.client?.zip || client.zip,
            type: 'estimate',
            status: est.status === 'accepted' ? 'confirmed' : 'pending',
            clientId: est.clientId || est.client_id,
            projectId: est.projectId || est.project_id,
            agentId: est.agentId || est.agent_id,
            notes: est.notes,
            createdAt: est.createdAt || est.created_at,
            isEstimateAppointment: true,
            estimateId: est.id
          };
        });

      // Combine regular events with estimate appointments
      const allClientEvents = [...clientEvents, ...estimatesWithAppointments];



      // Map client fields to camelCase
      const mappedClient = {
        id: client.id,
        name: `${client.firstName || client.first_name} ${client.lastName || client.last_name}`,
        firstName: client.firstName || client.first_name,
        lastName: client.lastName || client.last_name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        state: client.state,
        zip: client.zip,
        joinDate: client.created_at
      };

      // Estimates are already mapped above

      const response = {
        client: mappedClient,
        projects: clientProjects,
        estimates: clientEstimates,
        invoices: clientInvoices,
        appointments: allClientEvents,
        agent: primaryAgent ? {
          name: `${primaryAgent.firstName} ${primaryAgent.lastName}`,
          email: primaryAgent.email,
          phone: primaryAgent.phone,
          role: primaryAgent.role || 'Field Agent'
        } : null
      };
      res.json(response);
    } catch (error) {
      console.error("[Client Portal] Uncaught error:", error);
      res.status(500).json({ error: "Failed to fetch client data" });
    }
  });

  // Public client portal routes (no authentication required) - MUST COME AFTER THE DATA ROUTE
  app.get("/api/client-portal/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const portalData = await storage.getClientPortalData(token);
      res.json(portalData);
    } catch (error) {
      console.error("Error accessing client portal:", error);
      res.status(404).json({ message: "Invalid or expired portal access" });
    }
  });

  app.post("/api/client-portal/:token/reply/:messageId", async (req, res) => {
    try {
      const { token, messageId } = req.params;
      const { reply } = req.body;
      
      const clientData = await storage.validatePortalToken(token);
      if (!clientData) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      const validatedData = messageReplyInsertSchema.parse({
        messageId: Number(messageId),
        senderType: "client",
        senderId: clientData.clientId,
        reply
      });
      
      const replyData = await storage.createMessageReply(validatedData);
      res.status(201).json(replyData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Projects routes
  app.get("/api/protected/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const project = await storage.getProject(Number(req.params.id), req.user!.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        res.json(project);
      } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Failed to fetch project" });
      }
    }
  );

  app.post("/api/protected/projects", async (req, res) => {
    try {
      // Procesar las fechas del string ISO a objetos Date si están presentes
      const data = {
        ...req.body,
        contractor_id: req.user!.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const validatedData = projectInsertSchema.parse(data);
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Procesar las fechas del string ISO a objetos Date si están presentes
        const data = {
          ...req.body,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          lastAiUpdate: req.body.lastAiUpdate ? new Date(req.body.lastAiUpdate) : (req.body.aiGeneratedDescription ? new Date() : undefined)
        };
        
        const validatedData = projectInsertSchema.partial().parse(data);
        
        const project = await storage.updateProject(projectId, req.user!.id, validatedData);
        res.json(project);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );

  // PUT route for project updates (for compatibility with frontend)
  app.put("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Process ISO string dates to Date objects if present
        const data = {
          ...req.body,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          lastAiUpdate: req.body.lastAiUpdate ? new Date(req.body.lastAiUpdate) : (req.body.aiGeneratedDescription ? new Date() : undefined)
        };
        
        const validatedData = projectInsertSchema.partial().parse(data);
        
        const project = await storage.updateProject(projectId, req.user!.id, validatedData);
        res.json(project);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );

  // Update project positions for drag-and-drop reordering
  app.patch("/api/protected/projects/reorder", 
    async (req, res) => {
      try {
        // Check authentication
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        console.log('Raw request body:', req.body);
        const { projectUpdates } = req.body;
        console.log('Extracted projectUpdates:', projectUpdates);
        
        if (!Array.isArray(projectUpdates)) {
          return res.status(400).json({ message: "Invalid project updates format" });
        }
        
        // Update all projects in a transaction
        for (const update of projectUpdates) {
          console.log('Updating project:', update);
          
          // Validate the update object
          if (!update.id || !update.status || typeof update.position !== 'number') {
            console.error('Invalid update object:', update);
            return res.status(400).json({ 
              message: "Invalid update object", 
              details: update 
            });
          }
          
          await storage.updateProject(update.id, req.user.id, {
            status: update.status,
            position: update.position
          });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating project positions:", error);
        res.status(500).json({ message: "Failed to update project positions" });
      }
    }
  );
  
  // Cancel project
  app.post("/api/protected/projects/:id/cancel", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
      
        // Obtenemos el proyecto
        const existingProject = await storage.getProject(projectId, req.user!.id);
        if (!existingProject) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Verify that the project is not already cancelled
        if (existingProject.status === "cancelled") {
          return res.status(400).json({ message: "Project is already cancelled" });
        }
        
        // Actualizar el estado del proyecto a "cancelled"
        const project = await storage.updateProject(projectId, req.user!.id, { 
          status: "cancelled",
          notes: req.body.notes 
            ? `${existingProject.notes ? existingProject.notes + '\n\n' : ''}Cancelled: ${req.body.notes}`
            : `${existingProject.notes ? existingProject.notes + '\n\n' : ''}Project cancelled`
        });
        
        res.json(project);
      } catch (error) {
        console.error("Error cancelling project:", error);
        res.status(500).json({ message: "Failed to cancel project" });
      }
    }
  );

  app.delete("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        const success = await storage.deleteProject(projectId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Obtener estimados por proyecto
  app.get("/api/protected/projects/:id/estimates", 
    verifyResourceOwnership('project', 'id'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Obtener los estimados que corresponden a este proyecto
        const estimates = await storage.getEstimates(req.user!.id);
        const projectEstimates = estimates.filter(estimate => estimate.projectId === projectId);
        
        res.json(projectEstimates);
      } catch (error) {
        console.error("Error fetching project estimates:", error);
        res.status(500).json({ message: "Failed to fetch project estimates" });
      }
    }
  );

  // Estimates routes
  app.get("/api/protected/estimates", async (req, res) => {
    try {
      const estimates = await storage.getEstimates(req.user!.id);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.get("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
      const estimate = await storage.getEstimate(Number(req.params.id), req.user!.id);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.post("/api/protected/estimates", async (req, res) => {
    try {
      console.log("createEstimate -> Starting creation with data:", JSON.stringify(req.body, null, 2));
      // Convert date strings to timestamps for SQLite compatibility
      const now = Date.now();
      const estimateData = {
        contractor_id: req.user!.id,
        client_id: req.body.clientId || null, // Allow null client_id for internal estimates
        estimate_number: req.body.estimateNumber,
        issue_date: req.body.issueDate ? new Date(req.body.issueDate).getTime() : now,
        status: req.body.status || "draft",
        subtotal: req.body.subtotal,
        tax: req.body.tax || 0,
        discount: req.body.discount || 0,
        total: req.body.total,
        notes: req.body.notes || null,
        terms: req.body.terms || null,
        created_at: now
      };
      
      console.log("createEstimate -> Final data:", JSON.stringify(estimateData, null, 2));
      
      // Validate with the appropriate schema
      const validatedData = estimateInsertSchema.parse(estimateData);
      
      // Insert the estimate
      const [newEstimate] = await db.insert(estimatesTable).values(validatedData).returning();
      
      // Insert estimate items if provided
      if (req.body.items && req.body.items.length > 0) {
        const estimateItems = req.body.items.map((item: any) => ({
          estimate_id: newEstimate.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          amount: item.amount,
          notes: item.notes || null
        }));
        
        await db.insert(estimateItemsTable).values(estimateItems);
      }
      
      res.status(201).json(newEstimate);
    } catch (error: any) {
      console.error("Error creating estimate:", error);
      res.status(500).json({ message: "Failed to create estimate", error: error.message });
    }
  });

  app.patch("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        console.log("updateEstimate -> API - Updating estimate ID:", estimateId);
        console.log("updateEstimate -> API - Data received:", JSON.stringify(req.body, null, 2));
        
        // Obtener el estimado actual para verificar su existencia
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
      // Preparar datos con conversión de fechas
      const dataWithDateObjects = { ...req.body };
      
      // Aseguramos que issueDate sea un objeto Date válido
      if (dataWithDateObjects.issueDate && typeof dataWithDateObjects.issueDate === 'string') {
        dataWithDateObjects.issueDate = new Date(dataWithDateObjects.issueDate);
      }
      
      // Aseguramos que expiryDate sea un objeto Date válido si está presente
      if (dataWithDateObjects.expiryDate && typeof dataWithDateObjects.expiryDate === 'string') {
        dataWithDateObjects.expiryDate = new Date(dataWithDateObjects.expiryDate);
      }
      
      // Validamos los items si existen
      if (dataWithDateObjects.items && Array.isArray(dataWithDateObjects.items)) {
        console.log(`updateEstimate -> API - El estimado tiene ${dataWithDateObjects.items.length} items`);
      }
      
      const validatedData = estimateInsertSchema.partial().parse(dataWithDateObjects);
      
      console.log("updateEstimate -> API - Data validated, proceeding to update");
      
      const estimate = await storage.updateEstimate(estimateId, req.user!.id, validatedData);
      
      console.log("updateEstimate -> API - Estimate updated successfully");
      
      res.json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("updateEstimate -> API - Error de validación:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          details: error.format()
        });
      }
      
      console.error("updateEstimate -> API - Error:", error);
      res.status(500).json({ 
        message: "Failed to update estimate", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        const success = await storage.deleteEstimate(estimateId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting estimate:", error);
        res.status(500).json({ message: "Failed to delete estimate" });
      }
    }
  );
  
  // Accept estimate
  app.post("/api/protected/estimates/:id/accept", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        // First check if estimate exists and belongs to contractor
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        // Check if estimate can be accepted
        if (existingEstimate.status !== 'draft' && existingEstimate.status !== 'sent') {
          return res.status(400).json({ 
            message: `Estimate cannot be accepted from current status: ${existingEstimate.status}` 
          });
        }
        
        // Update estimate status to 'accepted'
        const updatedEstimate = await storage.updateEstimate(estimateId, req.user!.id, {
          status: 'accepted',
          acceptedDate: new Date(),
          notes: `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Estimate accepted by client`
        });
        
        res.json(updatedEstimate);
      } catch (error) {
        console.error("Error accepting estimate:", error);
        res.status(500).json({ message: "Failed to accept estimate" });
      }
  });
  
  // Reject estimate
  app.post("/api/protected/estimates/:id/reject", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        // Obtener estimado actual
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
        // Check if estimate can be rejected
        if (existingEstimate.status !== 'draft' && existingEstimate.status !== 'sent') {
          return res.status(400).json({ 
            message: `Estimate cannot be rejected from current status: ${existingEstimate.status}` 
          });
        }
        
        // Require rejection reason
        if (!req.body.notes) {
          return res.status(400).json({ message: "Rejection reason is required" });
        }
        
        // Update estimate status to 'rejected'
        const updatedEstimate = await storage.updateEstimate(estimateId, req.user!.id, {
          status: 'rejected',
          rejectionNotes: req.body.notes,
          rejectedDate: new Date(),
          notes: req.body.notes 
            ? `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Client rejected: ${req.body.notes}`
            : `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Estimate rejected by client`
        });
        
        res.json(updatedEstimate);
      } catch (error) {
        console.error("Error rejecting estimate:", error);
        res.status(500).json({ message: "Failed to reject estimate" });
      }
  });

  // Convert estimate to invoice
  app.post("/api/protected/estimates/:id/convert-to-invoice", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        if (!req.user || !req.user.id) {
          console.error('ERROR: req.user or req.user.id is missing in /convert-to-invoice');
          return res.status(401).json({ message: 'Unauthorized: User not authenticated or missing user ID.' });
        }
        const estimateId = Number(req.params.id);
        
        // Obtener el estimado
        const estimate = await storage.getEstimate(estimateId, req.user!.id);
        
        if (!estimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        // Verify the estimate status allows conversion
        // Solo permitir que estimados con estado 'accepted' puedan ser convertidos
        if (estimate.status !== 'accepted') {
          return res.status(400).json({ message: "Only accepted estimates can be converted to invoices. Please accept the estimate first." });
        }
        
        // Get the estimate items
        const estimateItems = await storage.getEstimateItems(estimateId, req.user!.id);
      
        // Generate an invoice number
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
        const invoiceNumber = `OT-${year}${month}-${random}`;
        
        // Debug logs before creating invoice and items
        console.log('DEBUG estimate:', estimate);
  
        // Create the invoice
        const invoiceData = {
          contractor_id: req.user!.id,
          client_id: estimate.client_id || estimate.clientId,
          project_id: estimate.project_id || estimate.projectId,
          estimate_id: estimate.id,
          invoice_number: invoiceNumber,
          issue_date: new Date().getTime(),
          due_date: new Date(new Date().setDate(new Date().getDate() + 15)).getTime(), // Due in 15 days
          status: "pending",
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          discount: estimate.discount,
          total: estimate.total,
          amount_paid: "0",
          terms: estimate.terms,
          notes: estimate.notes,
          contractor_signature: estimate.contractor_signature,
          created_at: new Date().getTime(),
        };
        
        let invoice;

        try {
          invoice = await storage.createInvoice(invoiceData);
          console.log('DEBUG created invoice:', invoice);
          console.log('DEBUG created invoice.id:', invoice?.id);
        } catch (err) {
          console.error('ERROR creating invoice:', err);
          let errorMessage = 'Unknown error';
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          return res.status(500).json({ message: 'Failed to create invoice', error: errorMessage });
        }
        console.log('DEBUG after invoice creation, invoice:', invoice);
        if (!invoice || !invoice.id) {
          console.error('*** ERROR: Invoice was not created or missing id:', invoice);
          return res.status(500).json({ message: 'Failed to create invoice. Invoice object missing or id not set.' });
        }
        // Move estimate status update here, before creating invoice items
        let statusUpdateError = null;
        let updatedEstimate = null;
        try {
          await storage.updateEstimate(estimateId, req.user!.id, {
            status: 'converted',
            notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Converted to Invoice #${invoiceNumber}`
          });
          updatedEstimate = await storage.getEstimate(estimateId, req.user!.id);
        } catch (err) {
          statusUpdateError = err;
          console.error('Warning: Estimate status update failed after invoice creation:', err);
        }
        console.log('DEBUG before creating invoice items, invoice.id:', invoice.id);
        // Only create invoice items if invoice.id is valid
        let invoiceItemsError = null;
        if (estimateItems && estimateItems.length > 0 && invoice && invoice.id) {
          for (const item of estimateItems) {
            try {
              console.log('DEBUG creating invoice item with invoice_id:', invoice.id, 'item:', item);
              const validatedItem = {
                invoice_id: invoice.id,
                description: item.description,
                quantity: String(item.quantity),
                unit_price: String(item.unit_price ?? item.unitPrice),
                amount: String(item.amount),
                notes: item.notes
              };
              await storage.createInvoiceItem(validatedItem);
            } catch (err) {
              invoiceItemsError = err;
              console.error('Error creating invoice item:', err);
            }
          }
        }
        // Return the created invoice with items, and the updated estimate
        const completeInvoice = await storage.getInvoice(invoice.id, req.user!.id);
        if (statusUpdateError || invoiceItemsError) {
          res.status(201).json({ invoice: completeInvoice, estimate: updatedEstimate, warning: 'Invoice created, but there were errors: ' + [statusUpdateError, invoiceItemsError].filter(Boolean).map(e => e?.message || e).join('; ') });
        } else {
          res.status(201).json({ invoice: completeInvoice, estimate: updatedEstimate });
        }
        
      } catch (error) {
        console.error("*** UNIQUE ERROR: Estimate-to-invoice conversion failed in /convert-to-invoice route! ***", error);
        res.status(500).json({ message: "*** UNIQUE ERROR: Estimate-to-invoice conversion failed in /convert-to-invoice route! ***", error: error.message });
      }
    }
  );

  // Estimate Items routes
  app.get("/api/protected/estimates/:estimateId/items", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const items = await storage.getEstimateItems(estimateId, req.user!.id);
        res.json(items);
      } catch (error) {
        console.error("Error fetching estimate items:", error);
        res.status(500).json({ message: "Failed to fetch estimate items" });
      }
    }
  );

  app.post("/api/protected/estimates/:estimateId/items", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        
        // Obtener el estimado
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
        const validatedData = estimateItemInsertSchema.parse({
          ...req.body,
          estimateId
        });
        
        const item = await storage.createEstimateItem(validatedData);
        res.status(201).json(item);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error creating estimate item:", error);
        res.status(500).json({ message: "Failed to create estimate item" });
      }
  });

  app.patch("/api/protected/estimates/:estimateId/items/:id", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const itemId = Number(req.params.id);
      
        const validatedData = estimateItemInsertSchema.partial().parse(req.body);
        
        const item = await storage.updateEstimateItem(itemId, estimateId, req.user!.id, validatedData);
        
        if (!item) {
          return res.status(404).json({ message: "Estimate item not found" });
        }
        
        res.json(item);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating estimate item:", error);
        res.status(500).json({ message: "Failed to update estimate item" });
      }
  });

  app.delete("/api/protected/estimates/:estimateId/items/:id", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const itemId = Number(req.params.id);
      
        const success = await storage.deleteEstimateItem(itemId, estimateId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Estimate item not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting estimate item:", error);
        res.status(500).json({ message: "Failed to delete estimate item" });
      }
  });

  // Invoices routes
  app.get("/api/protected/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices(req.user!.id);
      // Map client fields to camelCase for each invoice
      const mappedInvoices = invoices.map(inv => ({
        ...inv,
        client: inv.client ? {
          ...inv.client,
          firstName: inv.client.first_name,
          lastName: inv.client.last_name,
          email: inv.client.email,
          phone: inv.client.phone,
          address: inv.client.address,
          city: inv.client.city,
          state: inv.client.state,
          zip: inv.client.zip
        } : null
      }));
      res.json(mappedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoice = await storage.getInvoice(Number(req.params.id), req.user!.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        res.json(invoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: "Failed to fetch invoice" });
      }
  });

  app.post("/api/protected/invoices", async (req, res) => {
    try {
      // Convert camelCase from frontend to snake_case for database
      const snakeCaseData = {
        contractor_id: req.user!.id,
        client_id: req.body.clientId,
        project_id: req.body.projectId,
        estimate_id: req.body.estimateId,
        invoice_number: req.body.invoiceNumber,
        issue_date: req.body.issueDate ? new Date(req.body.issueDate).getTime() : Date.now(),
        due_date: req.body.dueDate ? new Date(req.body.dueDate).getTime() : new Date(new Date().setDate(new Date().getDate() + 15)).getTime(),
        status: req.body.status || "pending",
        subtotal: req.body.subtotal,
        tax: req.body.tax || 0,
        discount: req.body.discount || 0,
        total: req.body.total,
        amount_paid: req.body.amountPaid || 0,
        terms: req.body.terms,
        notes: req.body.notes,
        client_signature: req.body.clientSignature,
        contractor_signature: req.body.contractorSignature,
        created_at: Date.now()
      };
      
      const invoice = await storage.createInvoice(snakeCaseData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        
        // El middleware ya verificó que la factura existe y pertenece al contratista
        const validatedData = invoiceInsertSchema.partial().parse(req.body);
        
        const invoice = await storage.updateInvoice(invoiceId, req.user!.id, validatedData);
        res.json(invoice);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating invoice:", error);
        res.status(500).json({ message: "Failed to update invoice" });
      }
  });
  
  // Cancelar factura
  app.post("/api/protected/invoices/:id/cancel", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        
        // El middleware ya verificó que la factura existe y pertenece al contratista
        const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        // Verify that the invoice exists
        if (!existingInvoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Verify that the invoice is not already cancelled
        if (existingInvoice.status === "cancelled") {
          return res.status(400).json({ message: "Invoice is already cancelled" });
        }
        
        // Si la factura está pagada, no se puede cancelar
        if (existingInvoice.status === "paid") {
          return res.status(400).json({ message: "Cannot cancel a paid invoice" });
        }
        
        // Actualizar el estado de la factura a "cancelled"
        const invoice = await storage.updateInvoice(invoiceId, req.user!.id, { 
          status: "cancelled",
          notes: req.body.notes 
            ? `${existingInvoice.notes ? existingInvoice.notes + '\n\n' : ''}Cancelled: ${req.body.notes}`
            : `${existingInvoice.notes ? existingInvoice.notes + '\n\n' : ''}Invoice cancelled`
        });
        
        res.json(invoice);
      } catch (error) {
        console.error("Error cancelling invoice:", error);
        res.status(500).json({ message: "Failed to cancel invoice" });
      }
  });

  app.delete("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    preventCascadeOperations('invoice'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        const success = await storage.deleteInvoice(invoiceId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({ message: "Failed to delete invoice" });
      }
  });
  
  // Record payment for an invoice with automatic project status updates
  app.post("/api/protected/invoices/:id/payment", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        console.log('--- PAYMENT ENDPOINT HIT ---');
        const invoiceId = Number(req.params.id);
        const { amount, paymentMethod, notes } = req.body;
        console.log('Payment request body:', req.body);
        
        if (!amount || isNaN(parseFloat(amount))) {
          console.log('Invalid amount:', amount);
          return res.status(400).json({ message: "Valid payment amount is required" });
        }
        
        // Get invoice with project information
        const invoice = await storage.getInvoice(invoiceId, req.user!.id);
        console.log('Fetched invoice:', invoice);
        
        if (!invoice) {
          console.log('Invoice not found:', invoiceId);
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Convert amounts to numbers for consistent calculations
        const paymentAmount = parseFloat(amount);
        const totalAmount = parseFloat(invoice.total);
        const currentAmountPaid = parseFloat(invoice.amount_paid || '0');
        
        // Check if payment would exceed the total
        if (currentAmountPaid + paymentAmount > totalAmount) {
          console.log('Payment would exceed total:', { 
            currentAmountPaid, 
            paymentAmount, 
            totalAmount, 
            wouldBe: currentAmountPaid + paymentAmount 
          });
          return res.status(400).json({ 
            message: "Payment amount exceeds the remaining balance",
            currentAmountPaid,
            paymentAmount,
            totalAmount,
            remainingBalance: totalAmount - currentAmountPaid
          });
        }
      
        // Record the payment in the payments table
        const payment = await storage.createPayment({
          invoiceId: invoiceId,
          amount: paymentAmount,
          method: paymentMethod || "cash",
          paymentDate: req.body.paymentDate || new Date().toISOString(),
          notes: notes || ""
        });
        console.log('Payment saved to DB:', payment);
        
        // Calculate new total paid
        const newAmountPaid = currentAmountPaid + paymentAmount;
        const paymentPercentage = (newAmountPaid / totalAmount) * 100;
        
        // Update the invoice with the new amount paid
        let newInvoiceStatus = invoice.status;
        if (newAmountPaid >= totalAmount) {
          newInvoiceStatus = "paid";
        } else if (newAmountPaid > 0) {
          newInvoiceStatus = "partially_paid";
        }
        
        await storage.updateInvoice(invoiceId, req.user!.id, {
          amount_paid: newAmountPaid.toString(),
          status: newInvoiceStatus
        });
        
        // BUSINESS LOGIC: Auto-update project status based on ANY payment received
        let projectStatusUpdated = false;
        let newProjectStatus = null;
        let projectUpdateMessage = "";
        console.log(`[AUTO PROJECT] Payment received: $${newAmountPaid}, checking for project creation...`);
        if (newAmountPaid > 0) { // ANY payment triggers project logic
          try {
            console.log(`[AUTO PROJECT] Invoice has projectId: ${invoice.projectId}`);
            if (invoice.projectId) {
              // Update existing project
              console.log(`[AUTO PROJECT] Updating existing project ${invoice.projectId}`);
              const currentProject = await storage.getProject(invoice.projectId, req.user!.id);
              if (currentProject && currentProject.status === "pending") {
                newProjectStatus = "In Progress";
                await storage.updateProject(invoice.projectId, req.user!.id, {
                  status: "in_progress"
                });
                projectStatusUpdated = true;
                projectUpdateMessage = `Project automatically moved to In Progress status after receiving payment.`;
                console.log(`[AUTO PROJECT] Updated existing project ${invoice.projectId} to in_progress`);
              }
            }
            // Create new project when invoice has no existing project
            if (!invoice.projectId) {
              console.log(`[AUTO PROJECT] No existing project, creating new one for client ${invoice.clientId}`);
              const client = await storage.getClient(invoice.clientId, req.user!.id);
              if (client) {
                let estimateDetails = null;
                let serviceType = "general"; // Default service type
                
                if (invoice.estimateId) {
                  try {
                    estimateDetails = await storage.getEstimate(invoice.estimateId, req.user!.id);
                  } catch (estimateError) {
                    console.log("Could not fetch estimate details:", estimateError);
                  }
                }
                
                // Try to determine service type from contractor's services
                try {
                  console.log(`[AUTO PROJECT] Fetching contractor services for user ${req.user!.id}`);
                  // Get contractor's services to find the most appropriate one
                  const contractorServices = await db
                    .select()
                    .from(sqliteSchema.service_pricing)
                    .where(eq(sqliteSchema.service_pricing.contractor_id, req.user!.id));
                  
                  console.log(`[AUTO PROJECT] Found ${contractorServices.length} contractor services:`, contractorServices.map(s => ({ name: s.name, type: s.service_type })));
                  
                  if (contractorServices.length > 0) {
                    // If we have estimate details, try to match by description
                    if (estimateDetails?.description) {
                      const description = estimateDetails.description.toLowerCase();
                      for (const service of contractorServices) {
                        if (description.includes(service.service_type.toLowerCase()) || 
                            description.includes(service.name.toLowerCase())) {
                          serviceType = service.service_type;
                          break;
                        }
                      }
                    }
                    
                    // If no match found, use the first available service
                    if (serviceType === "general") {
                      serviceType = contractorServices[0].service_type;
                    }
                  }
                } catch (serviceError) {
                  console.log("Could not fetch contractor services:", serviceError);
                }
                
                const isFullyPaid = newAmountPaid >= totalAmount;
                const projectStatus = isFullyPaid ? "in_progress" : "in_progress";
                const projectTitle = estimateDetails?.title 
                  ? `${estimateDetails.title} - Invoice #${invoice.invoiceNumber}`
                  : `Project for Invoice #${invoice.invoiceNumber}`;
                const projectDescription = estimateDetails?.description 
                  ? `${estimateDetails.description}\n\nAutomatically created from invoice #${invoice.invoiceNumber} after receiving payment of $${newAmountPaid.toFixed(2)}. ${isFullyPaid ? 'Invoice fully paid.' : `Remaining balance: $${(totalAmount - newAmountPaid).toFixed(2)}`}`
                  : `Automatically created project from invoice #${invoice.invoiceNumber} after receiving payment of $${newAmountPaid.toFixed(2)}. ${isFullyPaid ? 'Invoice fully paid.' : `Remaining balance: $${(totalAmount - newAmountPaid).toFixed(2)}`}`;
                
                try {
                  const newProject = await storage.createProject({
                    contractorId: req.user!.id,
                    clientId: invoice.clientId,
                    title: projectTitle,
                    description: projectDescription,
                    status: projectStatus,
                    serviceType: serviceType,
                    budget: invoice.total,
                    startDate: new Date(),
                    notes: `Project created automatically when invoice payment was received.\n\nPayment Details:\n- Amount: $${parseFloat(amount).toFixed(2)}\n- Method: ${paymentMethod || 'cash'}\n- Total Paid: $${newAmountPaid.toFixed(2)}\n- Invoice Total: $${totalAmount.toFixed(2)}\n- Service Type: ${serviceType}\n${notes ? `- Notes: ${notes}\n` : ''}\n${estimateDetails ? `- Based on Estimate: ${estimateDetails.title || 'N/A'}` : ''}`
                  });
                  
                  await storage.updateInvoice(invoiceId, req.user!.id, {
                    projectId: newProject.id
                  });
                  projectStatusUpdated = true;
                  newProjectStatus = "In Progress";
                  projectUpdateMessage = `New project created and automatically started (In Progress) after receiving payment. Project ID: ${newProject.id}, Service Type: ${serviceType}`;
                  console.log(`[AUTO PROJECT] Created project ${newProject.id} for invoice ${invoice.invoiceNumber} with service type: ${serviceType}, status: ${projectStatus}`);
                } catch (projectCreateError) {
                  console.error("[AUTO PROJECT] Error creating project:", projectCreateError);
                }
              }
            }
          } catch (projectError) {
            console.error("Error handling project creation/update:", projectError);
            console.error("Project error details:", {
              invoiceId: invoice.id,
              clientId: invoice.clientId,
              hasProject: !!invoice.projectId,
              errorMessage: projectError instanceof Error ? projectError.message : projectError
            });
            // Don't fail the payment if project operation fails
          }
        }
        
        // Fetch the updated invoice with payments
        const updatedInvoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        res.json({ 
          invoice: updatedInvoice,
          payment: payment,
          totals: {
            currentAmountPaid: newAmountPaid,
            totalAmount,
            remainingBalance: totalAmount - newAmountPaid,
            paymentPercentage: Math.round(paymentPercentage)
          },
          projectUpdate: {
            updated: projectStatusUpdated,
            newStatus: newProjectStatus,
            message: projectUpdateMessage,
            serviceType: serviceType,
            projectId: projectStatusUpdated ? newProject?.id : undefined
          },
          message: projectStatusUpdated 
            ? `Payment recorded successfully. ${projectUpdateMessage}`
            : "Payment recorded successfully"
        });
      } catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({ message: "SQL SYNTAX ERROR DETECTED - DEBUG", error: error.message });
      }
    }
  );

  // Recalculate invoice balance from actual payments
  app.post("/api/protected/invoices/:id/recalculate-balance", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        const result = await storage.recalculateInvoiceBalance(invoiceId, req.user!.id);
        
        // Fetch the updated invoice with payments
        const updatedInvoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        res.json({ 
          invoice: updatedInvoice,
          recalculated: result,
          message: "Invoice balance recalculated successfully"
        });
      } catch (error) {
        console.error("Error recalculating invoice balance:", error);
        res.status(500).json({ message: "Failed to recalculate balance" });
      }
    }
  );

  // Invoice Items routes
  app.get("/api/protected/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const items = await storage.getInvoiceItems(invoiceId, req.user!.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/protected/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      
      // First check if invoice exists and belongs to contractor
      const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const validatedData = invoiceItemInsertSchema.parse({
        ...req.body,
        invoiceId
      });
      
      const item = await storage.createInvoiceItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.patch("/api/protected/invoices/:invoiceId/items/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const itemId = Number(req.params.id);
      
      const validatedData = invoiceItemInsertSchema.partial().parse(req.body);
      
      const item = await storage.updateInvoiceItem(itemId, invoiceId, req.user!.id, validatedData);
      
      if (!item) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/protected/invoices/:invoiceId/items/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const itemId = Number(req.params.id);
      
      const success = await storage.deleteInvoiceItem(itemId, invoiceId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // Public client routes for estimates
  app.get("/api/public/estimates/:id", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      const estimate = await storage.getEstimateById(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching public estimate:", error);
      res.status(500).json({ 
        message: "Failed to fetch estimate", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post("/api/public/estimates/:id/client-action", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      const { action, clientId, notes } = req.body;
      
      // Validate required fields
      if (!action || !clientId) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["action", "clientId"] 
        });
      }
      
      // Validate action type
      if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ 
          message: "Invalid action. Must be 'accept' or 'reject'" 
        });
      }
      
      // Get the estimate and verify it's for this client
      const estimate = await storage.getEstimateById(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify estimate belongs to the specified client
      if (estimate.clientId !== Number(clientId)) {
        return res.status(403).json({ 
          message: "Estimate does not belong to this client" 
        });
      }
      
      // If rejecting, require a reason
      if (action === 'reject' && !notes) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      if (action === 'accept') {
        // Simply accept the estimate without auto-creating invoice
        const updateData = {
          status: 'accepted',
          acceptedDate: new Date(),
          notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate accepted by client`
        };
        
        // Update the estimate
        const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
        
        res.json({
          success: true,
          message: "Estimate has been accepted successfully",
          estimate: updatedEstimate
        });
      } else {
        // Para rechazar, actualizamos el estado a rechazado
        const updateData = {
          status: 'rejected',
          rejectionNotes: notes,
          rejectedDate: new Date(),
          notes: notes 
            ? `${estimate.notes ? estimate.notes + '\n\n' : ''}Client rejected: ${notes}`
            : `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate rejected by client`
        };
        
        // Actualizar el estimado
        const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
        
        res.json({
          success: true,
          message: "Estimate has been rejected successfully",
          estimate: updatedEstimate
        });
      }
      
    } catch (error) {
      console.error(`Error processing client ${req.body?.action || 'unknown'} action:`, error);
      res.status(500).json({ 
        message: `Failed to process client action`, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Agent Management Routes
  app.get("/api/protected/agents", async (req, res) => {
    try {
      console.log("=== FETCHING AGENTS ===");
      console.log("User ID:", req.user!.id);
      
      const contractorId = req.user!.id;
      // Use agentsTable for all schema references
      const agentsList = await db.select().from(agentsTable)
        .where(eq(agentsTable.contractor_id, contractorId))
        .orderBy(agentsTable.first_name);
      
      // Map snake_case to camelCase for each agent
      const mapAgent = (a) => ({
        id: a.id,
        contractorId: a.contractor_id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        phone: a.phone,
        employeeId: a.employee_id,
        role: a.role,
        isActive: a.is_active,
        specialties: a.specialties,
        colorCode: a.color_code,
        hourlyRate: a.hourly_rate,
        commissionRate: a.commission_rate,
        hireDate: a.hire_date,
        notes: a.notes,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      });
      res.json(agentsList.map(mapAgent));
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Update agent
  app.put("/api/protected/agents/:id", async (req, res) => {
    try {
      const agentId = Number(req.params.id);
      const contractorId = req.user!.id;
      // Map camelCase to snake_case
      const updateData = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        employee_id: req.body.employeeId,
        role: req.body.role,
        is_active: req.body.isActive,
        specialties: Array.isArray(req.body.specialties) ? JSON.stringify(req.body.specialties) : req.body.specialties,
        color_code: req.body.colorCode,
        hourly_rate: req.body.hourlyRate,
        commission_rate: req.body.commissionRate,
        hire_date: req.body.hireDate,
        notes: req.body.notes,
        updated_at: Date.now()
      };
      const [updatedAgent] = await db.update(agentsTable)
        .set(updateData)
        .where(and(eq(agentsTable.id, agentId), eq(agentsTable.contractor_id, contractorId)))
        .returning();
      if (!updatedAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // Delete agent
  app.delete("/api/protected/agents/:id", async (req, res) => {
    try {
      const agentId = Number(req.params.id);
      const contractorId = req.user!.id;
      const deleted = await db.delete(agentsTable)
        .where(and(eq(agentsTable.id, agentId), eq(agentsTable.contractor_id, contractorId)));
      if (deleted.changes === 0) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Create agent
  app.post("/api/protected/agents", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      // Map camelCase to snake_case
      const agentData = {
        contractor_id: contractorId,
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        employee_id: req.body.employeeId,
        role: req.body.role,
        is_active: req.body.isActive,
        specialties: Array.isArray(req.body.specialties) ? JSON.stringify(req.body.specialties) : req.body.specialties,
        color_code: req.body.colorCode,
        hourly_rate: req.body.hourlyRate,
        commission_rate: req.body.commissionRate,
        hire_date: req.body.hireDate,
        notes: req.body.notes,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      const [newAgent] = await db.insert(agentsTable).values(agentData).returning();
      if (!newAgent) {
        return res.status(500).json({ message: "Failed to create agent" });
      }
      // Map snake_case to camelCase for response
      const mapAgent = (a) => ({
        id: a.id,
        contractorId: a.contractor_id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        phone: a.phone,
        employeeId: a.employee_id,
        role: a.role,
        isActive: a.is_active,
        specialties: a.specialties,
        colorCode: a.color_code,
        hourlyRate: a.hourly_rate,
        commissionRate: a.commission_rate,
        hireDate: a.hire_date,
        notes: a.notes,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      });
      res.status(201).json(mapAgent(newAgent));
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  // Create event
  app.post("/api/protected/events", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      console.log("[EVENT CREATE] Incoming data:", JSON.stringify(req.body, null, 2));
      // Map and coerce fields
      const eventType = req.body.eventType || req.body.type || "Event";
      const title = req.body.title || eventType;
      const startTime = req.body.startTime ? Number(req.body.startTime) : undefined;
      const endTime = req.body.endTime ? Number(req.body.endTime) : undefined;
      const projectId = req.body.projectId === null || req.body.projectId === undefined || req.body.projectId === '' ? undefined : Number(req.body.projectId);
      const notes = req.body.notes === null ? '' : req.body.notes;
      const address = req.body.address === null ? '' : req.body.address;
      const city = req.body.city === null ? '' : req.body.city;
      const state = req.body.state === null ? '' : req.body.state;
      const zip = req.body.zip === null ? '' : req.body.zip;
      // Required fields
      if (!eventType) {
        return res.status(400).json({ message: "Missing required field: eventType/type" });
      }
      const eventData = {
        contractor_id: contractorId,
        client_id: req.body.clientId === null || req.body.clientId === undefined || req.body.clientId === '' ? null : Number(req.body.clientId),
        project_id: projectId,
        agent_id: req.body.agentId || null,
        event_type: eventType,
        type: eventType,
        title,
        status: req.body.status,
        address,
        city,
        state,
        zip,
        notes,
        start_time: startTime,
        end_time: endTime,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      // Validate with schema
      const validatedData = eventInsertSchema.parse(eventData);
      // Insert event
      const [newEvent] = await db.insert(eventsTable).values(validatedData).returning();
      if (!newEvent) {
        return res.status(500).json({ message: "Failed to create event" });
      }
      // Map snake_case to camelCase for response
      const mapEvent = (e) => ({
        id: e.id,
        contractorId: e.contractor_id,
        clientId: e.client_id,
        projectId: e.project_id,
        agentId: e.agent_id,
        eventType: e.event_type,
        type: e.type,
        title: e.title,
        status: e.status,
        address: e.address,
        city: e.city,
        state: e.state,
        zip: e.zip,
        notes: e.notes,
        startTime: e.start_time,
        endTime: e.end_time,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      });
      res.status(201).json(mapEvent(newEvent));
    } catch (error) {
      console.error("Error creating event:", error);
      if (error.issues) {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // List all events for the current contractor
  app.get("/api/protected/events", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const { date } = req.query;
      const dayStart = date ? new Date(date as string).setHours(0, 0, 0, 0) : 0; // Start of day or 0 for all events
      const dayEnd = date ? new Date(date as string).setHours(23, 59, 59, 999) : Date.now() + (365 * 24 * 60 * 60 * 1000); // End of day or 1 year from now for all events

      // Get all events for this contractor and date
      const eventsList = await db.select().from(eventsTable)
        .where(and( // Filter by contractor_id and start_time within the date range
          eq(eventsTable.contractor_id, contractorId),
          gte(eventsTable.start_time, dayStart),
          lte(eventsTable.start_time, dayEnd)
        ));

      // For now, just map fields
      const mapEvent = (e) => ({
        id: e.id,
        contractorId: e.contractor_id,
        clientId: e.client_id,
        projectId: e.project_id,
        agentId: e.agent_id,
        eventType: e.type,
        type: e.type,
        title: e.title,
        status: e.status,
        address: e.address,
        city: e.city,
        state: e.state,
        zip: e.zip,
        notes: e.notes,
        startTime: e.start_time,
        endTime: e.end_time,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      });
      res.json(eventsList.map(mapEvent));
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Update event route
  app.patch("/api/protected/events/:id", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const eventId = parseInt(req.params.id);
      const { agent_id } = req.body;

      if (!eventId) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Verify the event belongs to this contractor
      const existingEvent = await db.select().from(eventsTable)
        .where(and(eq(eventsTable.id, eventId), eq(eventsTable.contractor_id, contractorId)))
        .limit(1);

      if (existingEvent.length === 0) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Update the event with the new agent_id
      await db.update(eventsTable)
        .set({ 
          agent_id: agent_id ? parseInt(agent_id) : null,
          updated_at: new Date()
        })
        .where(eq(eventsTable.id, eventId));

      res.json({ message: "Event updated successfully" });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Agent daily schedule route (summary for all events and estimates)
  app.get("/api/protected/agents/schedule", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ message: "Missing date parameter" });
      const dayStart = new Date(date + 'T00:00:00').getTime();
      const dayEnd = new Date(date + 'T23:59:59').getTime();

      // Get all active agents
      const agentsList = await db.select().from(agentsTable)
        .where(and(eq(agentsTable.contractor_id, contractorId), eq(agentsTable.is_active, true)));

      // Get all events for this contractor and date
      const eventsList = await db.select().from(eventsTable)
        .where(and(
          eq(eventsTable.contractor_id, contractorId),
          gte(eventsTable.start_time, dayStart),
          lte(eventsTable.start_time, dayEnd)
        ));

      // Get all estimates for this contractor
      const estimatesList = await db.select().from(estimatesTable)
        .where(eq(estimatesTable.contractor_id, contractorId));

      // For each estimate, check if it is scheduled for this date
      const estimatesForDate = estimatesList.filter(est => {
        if (!est.appointment_date) return false;
        const appt = new Date(est.appointment_date).getTime();
        return appt >= dayStart && appt <= dayEnd;
      });

      // Combine all events and estimates for the day
      const allScheduled = [
        ...eventsList.map(ev => ({
          type: 'event',
          id: ev.id,
          agentId: ev.agent_id
        })),
        ...estimatesForDate.map(est => ({
          type: 'estimate',
          id: est.id,
          agentId: est.agent_id
        }))
      ];

      const totalScheduled = allScheduled.length;
      const totalUnassigned = allScheduled.filter(item => !item.agentId).length;

      // Group estimates by agent for detailed view (unchanged)
      const schedule = agentsList.map(agent => {
        const agentEvents = eventsList.filter(ev => ev.agent_id === agent.id);
        const agentEstimates = estimatesForDate.filter(est => est.agent_id === agent.id);
        const totalHours = agentEvents.reduce((sum, ev) => sum + ((ev.end_time - ev.start_time) / 3600000), 0);
        return {
          agent: {
            id: agent.id,
            firstName: agent.first_name,
            lastName: agent.last_name,
            email: agent.email,
            phone: agent.phone,
            role: agent.role,
            colorCode: agent.color_code,
            isActive: agent.is_active
          },
          events: agentEvents.map(ev => ({
            id: ev.id,
            title: ev.title,
            startTime: ev.start_time,
            endTime: ev.end_time,
            type: ev.type,
            status: ev.status,
            clientId: ev.client_id,
            notes: ev.notes,
            address: ev.address
          })),
          estimates: agentEstimates.map(est => ({
            id: est.id,
            estimateNumber: est.estimate_number,
            appointmentDate: est.appointment_date,
            appointmentDuration: est.appointment_duration,
            status: est.status,
            clientId: est.client_id,
            agentId: est.agent_id
          })),
          totalHours,
          isAvailable: agentEvents.length === 0 && agentEstimates.length === 0
        };
      });

      // Unassigned estimates for this date
      const unassignedEstimates = estimatesForDate.filter(est => !est.agent_id).map(est => ({
        id: est.id,
        estimateNumber: est.estimate_number,
        appointmentDate: est.appointment_date,
        appointmentDuration: est.appointment_duration,
        status: est.status,
        clientId: est.client_id,
        agentId: est.agent_id
      }));

      res.json({
        date,
        schedule,
        totalEstimates: estimatesForDate.length,
        unassignedEstimates,
        totalScheduled,
        totalUnassigned,
        activeAgents: agentsList.length
      });
    } catch (error) {
      console.error("Error fetching agent schedule:", error);
      res.status(500).json({ message: "Failed to fetch agent schedule" });
    }
  });

  // Test endpoint for project creation
  app.post("/api/protected/test/create-project", async (req, res) => {
    try {
      console.log('--- TEST PROJECT CREATION ENDPOINT HIT ---');
      console.log('Request body:', req.body);
      
      const projectData = req.body;
      
      // Validate required fields
      if (!projectData.contractorId || !projectData.clientId || !projectData.title) {
        return res.status(400).json({ 
          message: "Missing required fields: contractorId, clientId, title" 
        });
      }
      
      // Create project using storage method
      const newProject = await storage.createSimpleProject({
        contractorId: projectData.contractorId,
        clientId: projectData.clientId,
        title: projectData.title,
        description: projectData.description,
        status: projectData.status || 'in_progress',
        budget: projectData.budget,
        startDate: projectData.startDate ? new Date(projectData.startDate) : new Date(),
        notes: projectData.notes
      });
      
      console.log('Project created successfully:', newProject);
      
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error in test project creation:", error);
      res.status(500).json({ 
        message: "Failed to create test project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Reverse/Refund a payment
  app.post("/api/protected/invoices/:id/reverse-payment", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        const { paymentId, reason } = req.body;
        
        if (!paymentId) {
          return res.status(400).json({ message: "Payment ID is required" });
        }
        
        // Get the invoice to verify ownership and current state
        const invoice = await storage.getInvoice(invoiceId, req.user!.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Get the specific payment to reverse
        const payment = await storage.getPayment(paymentId, req.user!.id);
        if (!payment) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        // Verify the payment belongs to this invoice
        if (payment.invoiceId !== invoiceId) {
          return res.status(400).json({ message: "Payment does not belong to this invoice" });
        }
        
        // Check if payment is already reversed
        if (payment.status === 'reversed') {
          return res.status(400).json({ message: "Payment has already been reversed" });
        }
        
        // Calculate new amounts
        const paymentAmount = parseFloat(payment.amount);
        const currentAmountPaid = parseFloat(invoice.amount_paid || '0');
        const newAmountPaid = Math.max(0, currentAmountPaid - paymentAmount);
        const totalAmount = parseFloat(invoice.total);
        
        // Determine new invoice status
        let newStatus = invoice.status;
        if (newAmountPaid >= totalAmount) {
          newStatus = "paid";
        } else if (newAmountPaid > 0) {
          newStatus = "partially_paid";
        } else {
          newStatus = "pending";
        }
        
        // Reverse the payment (mark as reversed, don't delete)
        await storage.reversePayment(paymentId, req.user!.id, {
          reason: reason || "Payment reversed by contractor",
          reversedBy: req.user!.id,
          reversedAt: Date.now()
        });
        
        // Update the invoice with new amount paid
        await storage.updateInvoice(invoiceId, req.user!.id, {
          amount_paid: newAmountPaid.toString(),
          status: newStatus
        });
        
        // Get updated invoice with payments
        const updatedInvoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        res.json({
          success: true,
          message: `Payment of $${paymentAmount.toFixed(2)} has been reversed successfully`,
          invoice: updatedInvoice,
          reversal: {
            paymentId,
            amount: paymentAmount,
            reason: reason || "Payment reversed by contractor",
            previousAmountPaid: currentAmountPaid,
            newAmountPaid,
            remainingBalance: totalAmount - newAmountPaid
          }
        });
        
      } catch (error) {
        console.error("Error reversing payment:", error);
        res.status(500).json({ message: "Failed to reverse payment", error: error.message });
      }
    }
  );

  // AI Job Description Generation
  app.post("/api/ai/generate-job-description", async (req, res) => {
    try {
      const { serviceType, appointmentNotes, measurements, clientName } = req.body;
      
      if (!serviceType || !appointmentNotes) {
        return res.status(400).json({ 
          message: "Service type and appointment notes are required" 
        });
      }

      // Prepare property details from measurements
      const propertyDetails = {
        squareFeet: measurements?.length && measurements?.width ? 
          measurements.length * measurements.width : undefined,
        linearFeet: measurements?.length || undefined,
        units: measurements?.count || undefined
      };

      const jobDescriptionData = {
        serviceType,
        appointmentNotes,
        propertyDetails,
        clientName
      };

      const result = await generateProfessionalJobDescription(jobDescriptionData);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating job description:", error);
      res.status(500).json({ 
        message: "Failed to generate job description",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI Description Generation Endpoints
  app.post('/api/protected/ai/generate-service-description', async (req, res) => {
    try {
      const { serviceData } = req.body;
      
      if (!serviceData) {
        return res.status(400).json({ error: 'Service data is required' });
      }

      const description = await generateServiceDescription(serviceData);
      res.json({ description });
    } catch (error) {
      console.error('Error generating service description:', error);
      res.status(500).json({ error: 'Failed to generate service description' });
    }
  });

  app.post('/api/protected/ai/generate-estimate-description', async (req, res) => {
    try {
      const { estimateData } = req.body;
      
      if (!estimateData) {
        return res.status(400).json({ error: 'Estimate data is required' });
      }

      const description = await generateEstimateDescription(estimateData);
      res.json({ description });
    } catch (error) {
      console.error('Error generating estimate description:', error);
      res.status(500).json({ error: 'Failed to generate estimate description' });
    }
  });

  // AI Service Description Generation
  app.post('/api/ai/generate-service-description', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { serviceType, serviceName, measurements, laborRate, unit } = req.body;

      if (!serviceType || !serviceName) {
        return res.status(400).json({ message: 'Service type and name are required' });
      }

      const result = await generateServiceDescriptionForEstimate({
        serviceType,
        serviceName,
        measurements: measurements || {},
        laborRate: laborRate || 0,
        unit: unit || 'unit'
      });

      res.json(result);
    } catch (error) {
      console.error('Error generating service description:', error);
      res.status(500).json({ 
        message: 'Error generating service description',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add missing achievement and streak routes to prevent 404 errors
  app.post('/api/contractor/streak/update', async (req, res) => {
    try {
      // Placeholder implementation - just return success
      res.json({ success: true, message: 'Streak updated' });
    } catch (error) {
      console.error('Error updating streak:', error);
      res.status(500).json({ error: 'Failed to update streak' });
    }
  });

  app.get('/api/contractor/achievements/unread', async (req, res) => {
    try {
      // Placeholder implementation - return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching unread achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // Materials routes
  app.get("/api/protected/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterials(req.user!.id);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Agents routes (already exists but adding for completeness)
  app.get("/api/protected/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents(req.user!.id);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Payments routes
  app.get("/api/protected/payments", async (req, res) => {
    try {
      const { invoiceId } = req.query;
      if (invoiceId) {
        const payments = await storage.getPayments(Number(invoiceId), req.user!.id);
        res.json(payments);
      } else {
        // Get all payments for all invoices of this contractor
        const invoices = await storage.getInvoices(req.user!.id);
        const allPayments = [];
        for (const invoice of invoices) {
          const payments = await storage.getPayments(invoice.id, req.user!.id);
          allPayments.push(...payments);
        }
        res.json(allPayments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Follow-ups routes
  app.get("/api/protected/follow-ups", async (req, res) => {
    try {
      const followUps = await storage.getFollowUps(req.user!.id);
      res.json(followUps);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  // Attachments routes
  app.get("/api/protected/attachments", async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      if (entityType && entityId) {
        const attachments = await storage.getAttachments(req.user!.id, entityType as string, Number(entityId));
        res.json(attachments);
      } else {
        // Get all attachments for this contractor
        const allAttachments = [];
        const entities = ['client', 'project', 'estimate', 'invoice', 'material'];
        
        for (const entityType of entities) {
          // Get all entities of this type for the contractor
          let entities = [];
          switch (entityType) {
            case 'client':
              entities = await storage.getClients(req.user!.id);
              break;
            case 'project':
              entities = await storage.getProjects(req.user!.id);
              break;
            case 'estimate':
              entities = await storage.getEstimates(req.user!.id);
              break;
            case 'invoice':
              entities = await storage.getInvoices(req.user!.id);
              break;
            case 'material':
              entities = await storage.getMaterials(req.user!.id);
              break;
          }
          
          // Get attachments for each entity
          for (const entity of entities) {
            const attachments = await storage.getAttachments(req.user!.id, entityType, entity.id);
            allAttachments.push(...attachments);
          }
        }
        
        res.json(allAttachments);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });
}
