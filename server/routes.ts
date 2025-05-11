import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { 
  clientInsertSchema, 
  projectInsertSchema, 
  estimateInsertSchema, 
  estimateItemInsertSchema,
  invoiceInsertSchema,
  invoiceItemInsertSchema,
  eventInsertSchema,
  materialInsertSchema,
  followUpInsertSchema,
  propertyMeasurementInsertSchema,
  priceConfigurationInsertSchema,
  contractorCreateSchema,
  contractorInsertSchema
} from "@shared/schema";

import { analyzeProject, generateSharingContent } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
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

  app.get("/api/protected/clients/:id", async (req, res) => {
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
  });

  app.post("/api/protected/clients", async (req, res) => {
    try {
      const validatedData = clientInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/protected/clients/:id", async (req, res) => {
    try {
      const clientId = Number(req.params.id);
      
      // First check if client exists and belongs to contractor
      const existingClient = await storage.getClient(clientId, req.user!.id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
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
  });

  app.delete("/api/protected/clients/:id", async (req, res) => {
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

  app.get("/api/protected/projects/:id", async (req, res) => {
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
  });

  app.post("/api/protected/projects", async (req, res) => {
    try {
      // Procesar las fechas del string ISO a objetos Date si están presentes
      const data = {
        ...req.body,
        contractorId: req.user!.id,
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

  app.patch("/api/protected/projects/:id", async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      
      // First check if project exists and belongs to contractor
      const existingProject = await storage.getProject(projectId, req.user!.id);
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
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
  });
  
  // Cancelar proyecto
  app.post("/api/protected/projects/:id/cancel", async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      
      // Verificar que el proyecto existe y pertenece al contratista
      const existingProject = await storage.getProject(projectId, req.user!.id);
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verificar que el proyecto no esté ya cancelado
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
  });

  app.delete("/api/protected/projects/:id", async (req, res) => {
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
  app.get("/api/protected/projects/:id/estimates", async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      
      // Primero verificamos que el proyecto existe y pertenece al contratista
      const project = await storage.getProject(projectId, req.user!.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Obtener los estimados que corresponden a este proyecto
      const estimates = await storage.getEstimates(req.user!.id);
      const projectEstimates = estimates.filter(estimate => estimate.projectId === projectId);
      
      res.json(projectEstimates);
    } catch (error) {
      console.error("Error fetching project estimates:", error);
      res.status(500).json({ message: "Failed to fetch project estimates" });
    }
  });

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

  app.get("/api/protected/estimates/:id", async (req, res) => {
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
    console.log("POST /api/protected/estimates - Recibiendo solicitud:", JSON.stringify(req.body, null, 2));
    try {
      // Preparar datos con el ID del contratista
      const dataWithContractorId = {
        ...req.body,
        contractorId: req.user!.id
      };
      
      console.log("Datos con contractor ID añadido:", JSON.stringify(dataWithContractorId, null, 2));
      
      // Aseguramos que issueDate sea un objeto Date válido
      if (dataWithContractorId.issueDate && typeof dataWithContractorId.issueDate === 'string') {
        dataWithContractorId.issueDate = new Date(dataWithContractorId.issueDate);
      }
      
      // Aseguramos que expiryDate sea un objeto Date válido si está presente
      if (dataWithContractorId.expiryDate && typeof dataWithContractorId.expiryDate === 'string') {
        dataWithContractorId.expiryDate = new Date(dataWithContractorId.expiryDate);
      }
      
      // Validar datos
      const validatedData = estimateInsertSchema.parse(dataWithContractorId);
      console.log("Datos validados correctamente:", JSON.stringify(validatedData, null, 2));
      
      // Crear estimado
      console.log("Creando estimado en la base de datos...");
      const estimate = await storage.createEstimate(validatedData);
      console.log("Estimado creado exitosamente:", JSON.stringify(estimate, null, 2));
      
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          details: error.format()
        });
      }
      
      console.error("Error creating estimate:", error);
      res.status(500).json({ 
        message: "Failed to create estimate", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch("/api/protected/estimates/:id", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      console.log("updateEstimate -> API - Actualizando estimado ID:", estimateId);
      console.log("updateEstimate -> API - Datos recibidos:", JSON.stringify(req.body, null, 2));
      
      // First check if estimate exists and belongs to contractor
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
      
      console.log("updateEstimate -> API - Datos validados, procediendo a actualizar");
      
      const estimate = await storage.updateEstimate(estimateId, req.user!.id, validatedData);
      
      console.log("updateEstimate -> API - Estimado actualizado exitosamente");
      
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

  app.delete("/api/protected/estimates/:id", async (req, res) => {
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
  });
  
  // Accept estimate
  app.post("/api/protected/estimates/:id/accept", async (req, res) => {
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
        notes: req.body.notes 
          ? `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Accepted: ${req.body.notes}`
          : `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Estimate accepted`
      });
      
      res.json(updatedEstimate);
    } catch (error) {
      console.error("Error accepting estimate:", error);
      res.status(500).json({ message: "Failed to accept estimate" });
    }
  });
  
  // Reject estimate
  app.post("/api/protected/estimates/:id/reject", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      // First check if estimate exists and belongs to contractor
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
        notes: `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Rejected: ${req.body.notes}`
      });
      
      res.json(updatedEstimate);
    } catch (error) {
      console.error("Error rejecting estimate:", error);
      res.status(500).json({ message: "Failed to reject estimate" });
    }
  });

  // Convert estimate to invoice
  app.post("/api/protected/estimates/:id/convert-to-invoice", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      // First, get the estimate and verify it belongs to the contractor
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
      
      // Create the invoice
      const invoiceData = {
        contractorId: req.user!.id,
        clientId: estimate.clientId,
        projectId: estimate.projectId,
        estimateId: estimate.id,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Due in 15 days
        status: "pending",
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        discount: estimate.discount,
        total: estimate.total,
        amountPaid: "0",
        terms: estimate.terms,
        notes: estimate.notes,
        contractorSignature: estimate.contractorSignature,
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Create invoice items from estimate items
      if (estimateItems && estimateItems.length > 0) {
        for (const item of estimateItems) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            notes: item.notes
          });
        }
      }
      
      // Mark the estimate as converted
      await storage.updateEstimate(estimateId, req.user!.id, {
        status: 'converted',
        notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Converted to Invoice #${invoiceNumber}`
      });
      
      // Return the created invoice with items
      const completeInvoice = await storage.getInvoice(invoice.id, req.user!.id);
      res.status(201).json(completeInvoice);
      
    } catch (error) {
      console.error("Error converting estimate to work order:", error);
      res.status(500).json({ message: "Failed to convert estimate to work order" });
    }
  });

  // Estimate Items routes
  app.get("/api/protected/estimates/:estimateId/items", async (req, res) => {
    try {
      const estimateId = Number(req.params.estimateId);
      const items = await storage.getEstimateItems(estimateId, req.user!.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching estimate items:", error);
      res.status(500).json({ message: "Failed to fetch estimate items" });
    }
  });

  app.post("/api/protected/estimates/:estimateId/items", async (req, res) => {
    try {
      const estimateId = Number(req.params.estimateId);
      
      // First check if estimate exists and belongs to contractor
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

  app.patch("/api/protected/estimates/:estimateId/items/:id", async (req, res) => {
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

  app.delete("/api/protected/estimates/:estimateId/items/:id", async (req, res) => {
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
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/protected/invoices/:id", async (req, res) => {
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
      const validatedData = invoiceInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/protected/invoices/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      
      // First check if invoice exists and belongs to contractor
      const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
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
  app.post("/api/protected/invoices/:id/cancel", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      
      // Verificar que la factura existe y pertenece al contratista
      const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verificar que la factura no esté ya cancelada
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

  app.delete("/api/protected/invoices/:id", async (req, res) => {
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
  
  // Record payment for an invoice
  app.post("/api/protected/invoices/:id/payment", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid payment amount is required" });
      }
      
      // First get the invoice to verify ownership and current amount paid
      const invoice = await storage.getInvoice(invoiceId, req.user!.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const currentAmountPaid = parseFloat(invoice.amountPaid || "0");
      const paymentAmount = parseFloat(amount);
      const totalAmount = parseFloat(invoice.total);
      const newAmountPaid = currentAmountPaid + paymentAmount;
      
      // Ensure payment doesn't exceed total
      if (newAmountPaid > totalAmount) {
        return res.status(400).json({ 
          message: "Payment amount exceeds the remaining balance",
          currentAmountPaid,
          totalAmount,
          remainingBalance: totalAmount - currentAmountPaid
        });
      }
      
      // Update the invoice with the new amount paid
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.user!.id, {
        amountPaid: newAmountPaid.toString()
      });
      
      // Update status to 'paid' if fully paid
      if (newAmountPaid >= totalAmount) {
        await storage.updateInvoice(invoiceId, req.user!.id, {
          status: "paid"
        });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

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
        // Para aceptar, convertimos el estimado a factura automáticamente
        try {
          console.log("Creando factura a partir de estimado aceptado:", estimateId);
          
          // Crear la factura con los mismos datos del estimado
          const invoiceData = {
            contractorId: estimate.contractorId,
            clientId: estimate.clientId,
            projectId: estimate.projectId,
            estimateId: estimateId,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            status: 'pending',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días para vencimiento
            subtotal: String(estimate.subtotal),
            tax: String(estimate.tax || 0),
            discount: String(estimate.discount || 0),
            total: String(estimate.total),
            notes: `Factura generada automáticamente a partir del estimado #${estimate.estimateNumber}`,
          };
          
          console.log("Datos de factura a crear:", invoiceData);
          
          // Crear la factura
          const newInvoice = await storage.createInvoice(invoiceData);
          console.log("Factura creada exitosamente:", newInvoice.id);
          
          // Copiar los items del estimado a la factura
          if (estimate.items && estimate.items.length > 0) {
            console.log(`Copiando ${estimate.items.length} items a la factura`);
            for (const item of estimate.items) {
              await storage.createInvoiceItem({
                invoiceId: newInvoice.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount
              });
            }
          }
          
          // Actualizar el estimado a estado convertido
          const updateData = {
            status: 'converted',
            convertedToInvoiceId: newInvoice.id,
            notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate accepted and converted to Invoice #${newInvoice.invoiceNumber}`
          };
          
          // Actualizar el estimado
          const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
          
          res.json({
            success: true,
            message: "Estimate has been accepted and converted to invoice successfully",
            estimate: updatedEstimate,
            invoice: newInvoice
          });
          
        } catch (error) {
          console.error("Error al convertir estimado a factura:", error);
          // En caso de error al crear la factura, aceptamos el estimado pero no lo convertimos
          const updateData = {
            status: 'accepted',
            notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate accepted but failed to convert to invoice`
          };
          
          const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
          
          res.json({
            success: true,
            message: "Estimate has been accepted, but failed to create invoice",
            estimate: updatedEstimate,
            error: error instanceof Error ? error.message : String(error)
          });
        }
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
  
  // Events routes
  app.get("/api/protected/events", async (req, res) => {
    try {
      const events = await storage.getEvents(req.user!.id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/protected/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id), req.user!.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/protected/events", async (req, res) => {
    try {
      console.log("Datos recibidos del cliente:", JSON.stringify(req.body, null, 2));
      
      // Preparar datos incluyendo el ID del contratista
      const dataToValidate = {
        ...req.body,
        contractorId: req.user!.id,
      };
      
      console.log("Datos preparados para validación:", JSON.stringify(dataToValidate, null, 2));
      
      // z.coerce.date() convierte automáticamente las strings a objetos Date
      const validatedData = eventInsertSchema.parse(dataToValidate);
      
      console.log("Datos validados:", JSON.stringify({
        ...validatedData,
        startTime: validatedData.startTime instanceof Date ? validatedData.startTime.toISOString() : validatedData.startTime,
        endTime: validatedData.endTime instanceof Date ? validatedData.endTime.toISOString() : validatedData.endTime
      }, null, 2));
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación ZOD:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/protected/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // First check if event exists and belongs to contractor
      const existingEvent = await storage.getEvent(eventId, req.user!.id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Usar el esquema parcial para validación
      const validatedData = eventInsertSchema.partial().parse({
        ...req.body,
        // Asegurarse de que las fechas se conviertan correctamente si están presentes
        startTime: req.body.startTime ? req.body.startTime : undefined,
        endTime: req.body.endTime ? req.body.endTime : undefined
      });
      
      console.log("Datos validados para actualización:", JSON.stringify({
        ...validatedData,
        startTime: validatedData.startTime instanceof Date ? validatedData.startTime.toISOString() : validatedData.startTime,
        endTime: validatedData.endTime instanceof Date ? validatedData.endTime.toISOString() : validatedData.endTime
      }, null, 2));
      
      const event = await storage.updateEvent(eventId, req.user!.id, validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación ZOD:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/protected/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const success = await storage.deleteEvent(eventId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
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

  app.get("/api/protected/materials/:id", async (req, res) => {
    try {
      const material = await storage.getMaterial(Number(req.params.id), req.user!.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.post("/api/protected/materials", async (req, res) => {
    try {
      const validatedData = materialInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.patch("/api/protected/materials/:id", async (req, res) => {
    try {
      const materialId = Number(req.params.id);
      
      // First check if material exists and belongs to contractor
      const existingMaterial = await storage.getMaterial(materialId, req.user!.id);
      if (!existingMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      const validatedData = materialInsertSchema.partial().parse(req.body);
      
      const material = await storage.updateMaterial(materialId, req.user!.id, validatedData);
      res.json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/protected/materials/:id", async (req, res) => {
    try {
      const materialId = Number(req.params.id);
      const success = await storage.deleteMaterial(materialId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Attachments routes
  app.get("/api/protected/attachments/:entityType/:entityId", async (req, res) => {
    try {
      const entityType = req.params.entityType;
      const entityId = Number(req.params.entityId);
      
      const attachments = await storage.getAttachments(req.user!.id, entityType, entityId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.post("/api/protected/attachments", async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        contractorId: req.user!.id
      };
      
      const attachment = await storage.createAttachment(validatedData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  app.delete("/api/protected/attachments/:id", async (req, res) => {
    try {
      const attachmentId = Number(req.params.id);
      const success = await storage.deleteAttachment(attachmentId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
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

  app.post("/api/protected/follow-ups", async (req, res) => {
    try {
      const validatedData = followUpInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const followUp = await storage.createFollowUp(validatedData);
      res.status(201).json(followUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating follow-up:", error);
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  app.patch("/api/protected/follow-ups/:id", async (req, res) => {
    try {
      const followUpId = Number(req.params.id);
      const validatedData = followUpInsertSchema.partial().parse(req.body);
      
      const followUp = await storage.updateFollowUp(followUpId, req.user!.id, validatedData);
      
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      
      res.json(followUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating follow-up:", error);
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });

  app.delete("/api/protected/follow-ups/:id", async (req, res) => {
    try {
      const followUpId = Number(req.params.id);
      const success = await storage.deleteFollowUp(followUpId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });

  // Property Measurements routes
  app.get("/api/protected/property-measurements", async (req, res) => {
    try {
      const measurements = await storage.getPropertyMeasurements(req.user!.id);
      res.json(measurements);
    } catch (error) {
      console.error("Error fetching property measurements:", error);
      res.status(500).json({ message: "Failed to fetch property measurements" });
    }
  });

  app.get("/api/protected/property-measurements/:id", async (req, res) => {
    try {
      const measurement = await storage.getPropertyMeasurement(Number(req.params.id), req.user!.id);
      if (!measurement) {
        return res.status(404).json({ message: "Property measurement not found" });
      }
      res.json(measurement);
    } catch (error) {
      console.error("Error fetching property measurement:", error);
      res.status(500).json({ message: "Failed to fetch property measurement" });
    }
  });

  app.post("/api/protected/property-measurements", async (req, res) => {
    try {
      const validatedData = propertyMeasurementInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id,
        measuredAt: new Date(),
      });
      
      const measurement = await storage.createPropertyMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating property measurement:", error);
      res.status(500).json({ message: "Failed to create property measurement" });
    }
  });

  app.patch("/api/protected/property-measurements/:id", async (req, res) => {
    try {
      const measurementId = Number(req.params.id);
      
      // First check if measurement exists and belongs to contractor
      const existingMeasurement = await storage.getPropertyMeasurement(measurementId, req.user!.id);
      if (!existingMeasurement) {
        return res.status(404).json({ message: "Property measurement not found" });
      }
      
      const validatedData = propertyMeasurementInsertSchema.partial().parse(req.body);
      
      const measurement = await storage.updatePropertyMeasurement(measurementId, req.user!.id, validatedData);
      res.json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating property measurement:", error);
      res.status(500).json({ message: "Failed to update property measurement" });
    }
  });

  app.delete("/api/protected/property-measurements/:id", async (req, res) => {
    try {
      const measurementId = Number(req.params.id);
      const success = await storage.deletePropertyMeasurement(measurementId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Property measurement not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting property measurement:", error);
      res.status(500).json({ message: "Failed to delete property measurement" });
    }
  });

  // AI routes for job cost analysis
  app.post("/api/protected/ai/analyze-job-cost", async (req, res) => {
    try {
      const { analyzeJobCost } = await import("./openai-service");
      const params = req.body;
      
      // Validación detallada
      if (!params) {
        return res.status(400).json({ 
          error: "Datos faltantes", 
          message: "No se recibieron datos para el análisis" 
        });
      }
      
      if (!params.serviceType) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe seleccionar un tipo de servicio" 
        });
      }
      
      if (!params.materials || !Array.isArray(params.materials) || params.materials.length === 0) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe agregar al menos un material al proyecto" 
        });
      }
      
      // Verificar si hay materiales con datos inválidos
      const invalidMaterials = params.materials.some(
        (m: {name?: string; quantity?: number; unitPrice?: number}) => !m.name || typeof m.quantity !== 'number' || typeof m.unitPrice !== 'number'
      );
      
      if (invalidMaterials) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          message: "Algunos materiales tienen información incompleta o inválida" 
        });
      }
      
      console.log("Iniciando análisis de costos para:", params.serviceType);
      const result = await analyzeJobCost(params);
      console.log("Análisis completado con éxito");
      res.json(result);
    } catch (error) {
      console.error("Error en el análisis de costos:", error);
      res.status(500).json({ 
        error: "Error al procesar el análisis de costos", 
        message: (error as Error).message 
      });
    }
  });
  
  // Ruta para generar descripción del trabajo con IA
  app.post("/api/protected/ai/generate-job-description", async (req, res) => {
    try {
      const { generateJobDescription } = await import("./openai-service");
      const params = req.body;
      
      // Validación detallada
      if (!params) {
        return res.status(400).json({ 
          error: "Datos faltantes", 
          message: "No se recibieron datos para la descripción" 
        });
      }
      
      if (!params.serviceType) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe seleccionar un tipo de servicio" 
        });
      }
      
      if (!params.materials || !Array.isArray(params.materials) || params.materials.length === 0) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe agregar al menos un material al proyecto" 
        });
      }
      
      // Verificar si hay materiales con datos inválidos
      const invalidMaterials = params.materials.some(
        (m: {name?: string; quantity?: number; unitPrice?: number}) => !m.name || typeof m.quantity !== 'number' || typeof m.unitPrice !== 'number'
      );
      
      if (invalidMaterials) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          message: "Algunos materiales tienen información incompleta o inválida" 
        });
      }
      
      console.log("Generando descripción para:", params.serviceType);
      const description = await generateJobDescription(params);
      console.log("Descripción generada con éxito");
      res.json({ description });
    } catch (error) {
      console.error("Error al generar descripción:", error);
      res.status(500).json({ 
        error: "Error al generar la descripción del trabajo", 
        message: (error as Error).message 
      });
    }
  });

  // Price Configuration routes
  app.get("/api/protected/price-configurations", async (req, res) => {
    try {
      const configurations = await storage.getPriceConfigurations(req.user!.id);
      res.json(configurations);
    } catch (error) {
      console.error("Error al obtener configuraciones de precios:", error);
      res.status(500).json({ message: "No se pudieron obtener las configuraciones de precios" });
    }
  });

  // Rutas específicas primero
  app.get("/api/protected/price-configurations/service/:serviceType/default", async (req, res) => {
    try {
      const serviceType = req.params.serviceType;
      const configuration = await storage.getDefaultPriceConfiguration(req.user!.id, serviceType);
      if (!configuration) {
        return res.status(404).json({ message: "No hay configuración predeterminada para este servicio" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error al obtener configuración de precios predeterminada:", error);
      res.status(500).json({ message: "No se pudo obtener la configuración de precios predeterminada" });
    }
  });

  app.get("/api/protected/price-configurations/service/:serviceType", async (req, res) => {
    try {
      const serviceType = req.params.serviceType;
      const configurations = await storage.getPriceConfigurationsByService(req.user!.id, serviceType);
      res.json(configurations);
    } catch (error) {
      console.error("Error al obtener configuraciones de precios por servicio:", error);
      res.status(500).json({ message: "No se pudieron obtener las configuraciones de precios para este servicio" });
    }
  });

  // Y después rutas por ID
  app.get("/api/protected/price-configurations/:id([0-9]+)", async (req, res) => {
    try {
      const configuration = await storage.getPriceConfiguration(Number(req.params.id), req.user!.id);
      if (!configuration) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error al obtener configuración de precios:", error);
      res.status(500).json({ message: "No se pudo obtener la configuración de precios" });
    }
  });

  app.post("/api/protected/price-configurations", async (req, res) => {
    try {
      const validatedData = priceConfigurationInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const configuration = await storage.createPriceConfiguration(validatedData);
      res.status(201).json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error al crear configuración de precios:", error);
      res.status(500).json({ message: "No se pudo crear la configuración de precios" });
    }
  });

  app.patch("/api/protected/price-configurations/:id", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      
      // Primero verificar si la configuración existe y pertenece al contratista
      const existingConfig = await storage.getPriceConfiguration(configId, req.user!.id);
      if (!existingConfig) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      const validatedData = priceConfigurationInsertSchema.partial().parse(req.body);
      
      const configuration = await storage.updatePriceConfiguration(configId, req.user!.id, validatedData);
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error al actualizar configuración de precios:", error);
      res.status(500).json({ message: "No se pudo actualizar la configuración de precios" });
    }
  });

  app.delete("/api/protected/price-configurations/:id", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      const success = await storage.deletePriceConfiguration(configId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error al eliminar configuración de precios:", error);
      res.status(500).json({ message: "No se pudo eliminar la configuración de precios" });
    }
  });

  app.post("/api/protected/price-configurations/:id/set-default", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      
      // Obtener la configuración para verificar que existe y determinar su tipo de servicio
      const config = await storage.getPriceConfiguration(configId, req.user!.id);
      if (!config) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      // Establecer como predeterminada
      const updatedConfig = await storage.setDefaultPriceConfiguration(configId, req.user!.id, config.serviceType);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error al establecer configuración predeterminada:", error);
      res.status(500).json({ message: "No se pudo establecer la configuración como predeterminada" });
    }
  });
  
  // Public routes for invoices
  app.get("/api/public/invoices/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      
      // Get invoice by ID
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get invoice items
      const items = await storage.getInvoiceItemsById(invoiceId);
      
      // Get contractor info
      const contractor = await storage.getContractor(invoice.contractorId);
      // Get client info
      const client = await storage.getClientById(invoice.clientId);
      
      // Get project info if available
      let project = null;
      if (invoice.projectId) {
        // Usamos el ID del contratista de la factura para garantizar que solo se acceda a proyectos propios
        project = await storage.getProjectById(invoice.projectId, invoice.contractorId);
      }
      
      // Return combined data
      res.json({
        ...invoice,
        items,
        contractor,
        client,
        project
      });
      
    } catch (error) {
      console.error("Error fetching public invoice:", error);
      res.status(500).json({ 
        message: "Failed to fetch invoice", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Public endpoint for clients to sign invoices
  app.post("/api/public/invoices/:id/client-action", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      const { action, signature, notes } = req.body;
      
      if (!action) {
        return res.status(400).json({ message: "Action is required" });
      }
      
      // Get invoice by ID (public endpoint)
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // For now we only support 'sign' action
      if (action !== 'sign') {
        return res.status(400).json({ message: "Invalid action. Only 'sign' is supported." });
      }
      
      // Validate signature is provided
      if (!signature) {
        return res.status(400).json({ message: "Signature is required for signing" });
      }
      
      // Make sure invoice is in a valid state for signing
      if (invoice.status !== 'pending') {
        return res.status(400).json({ 
          message: `Cannot sign invoice in "${invoice.status}" status. Invoice must be in "pending" status.` 
        });
      }
      
      // Update invoice with signature and change status to 'signed'
      const updatedInvoice = await storage.updateInvoiceById(invoiceId, {
        status: 'signed',
        clientSignature: signature,
        notes: notes ? 
          (invoice.notes ? `${invoice.notes}\n\n${notes}` : notes) : 
          invoice.notes
      });
      
      res.json({
        success: true,
        message: "Invoice has been signed successfully",
        invoice: updatedInvoice
      });
      
    } catch (error) {
      console.error("Error processing invoice action:", error);
      res.status(500).json({ 
        message: "Error processing invoice action", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Ruta para crear nuevos contratistas (solo accesible para super admin)
  app.post("/api/super-admin/contractors", async (req, res) => {
    // Temporalmente, comentamos la verificación de autenticación para pruebas
    /*
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    // Verificar que el usuario es super admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Acceso denegado. Se requieren privilegios de super admin." });
    }
    */
    
    try {
      console.log("Recibiendo solicitud para crear contratista:", JSON.stringify(req.body, null, 2));
      
      // Validar los datos enviados
      const validData = contractorCreateSchema.parse(req.body);
      console.log("Datos validados correctamente");
      
      // Buscar si ya existe un contratista con el mismo correo
      const existingEmail = await storage.getContractorByEmail(validData.email);
      if (existingEmail) {
        console.log("Correo duplicado:", validData.email);
        return res.status(400).json({ message: "Ya existe un contratista con este correo electrónico" });
      }
      
      // Crear el contratista con contraseña hasheada
      const hashedPassword = await hashPassword(validData.password);
      console.log("Contraseña hasheada correctamente");
      
      // Datos para crear el contratista
      const contractorData = {
        companyName: validData.companyName,
        email: validData.email,
        phone: validData.phone || null,
        website: validData.website || null,
        address: validData.address || null,
        city: validData.city || null,
        state: validData.state || null,
        zip: validData.zipCode || null, // Ajustamos el nombre a 'zip' según el esquema
        country: validData.country || "USA",
        firstName: validData.firstName,
        lastName: validData.lastName,
        username: validData.username,
        password: hashedPassword,
        role: "contractor", // Rol por defecto
        plan: validData.plan || "professional",
        language: "en", // Añadimos el campo obligatorio
        settings: JSON.stringify({
          serviceTypes: Array.isArray(validData.serviceTypes) && validData.serviceTypes.length > 0 
            ? validData.serviceTypes 
            : ["deck"],
          allowClientPortal: typeof validData.allowClientPortal === 'boolean' 
            ? validData.allowClientPortal 
            : true,
          useEstimateTemplates: typeof validData.useEstimateTemplates === 'boolean' 
            ? validData.useEstimateTemplates 
            : true,
          enabledAIAssistant: typeof validData.enabledAIAssistant === 'boolean' 
            ? validData.enabledAIAssistant 
            : true,
          primaryColor: validData.primaryColor || "#1E40AF",
          logoUrl: validData.logoUrl || null,
          companyDescription: validData.companyDescription || null
        })
      };
      
      console.log("Intentando guardar contratista con datos:", {
        ...contractorData,
        password: "[REDACTED]" // No mostramos la contraseña en los logs
      });
      
      // Guardar el contratista en la base de datos
      const newContractor = await storage.createContractor(contractorData);
      console.log("Contratista guardado con ID:", newContractor.id);
      
      // Retornar el contratista creado (pero omitimos datos sensibles)
      res.status(201).json({
        id: newContractor.id,
        email: newContractor.email,
        username: newContractor.username,
        companyName: newContractor.companyName,
        firstName: newContractor.firstName,
        lastName: newContractor.lastName,
        message: "Contratista creado exitosamente"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      console.error("Error creating contractor:", error);
      res.status(500).json({ 
        message: "Error al crear el contratista",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Create HTTP server
  // Endpoints de IA
  app.post("/api/ai/analyze-project", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API key de OpenAI no configurada" });
      }
      
      const projectData = req.body;
      const analysis = await analyzeProject(projectData);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project with AI:", error);
      res.status(500).json({ 
        message: `Error al analizar el proyecto con IA: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  });
  
  app.post("/api/ai/sharing-content/:projectId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API key de OpenAI no configurada" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const settings = req.body.settings;
      
      // Obtener el proyecto completo
      const project = await storage.getProject(projectId, req.user!.id);
      
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }
      
      const sharingContent = await generateSharingContent(project, settings);
      
      res.json(sharingContent);
    } catch (error) {
      console.error("Error generating sharing content:", error);
      res.status(500).json({ 
        message: `Error al generar contenido para compartir: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
