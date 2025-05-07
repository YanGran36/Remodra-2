import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
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
  propertyMeasurementInsertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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
      const validatedData = projectInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
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
      
      const validatedData = projectInsertSchema.partial().parse(req.body);
      
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
    try {
      const validatedData = estimateInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const estimate = await storage.createEstimate(validatedData);
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating estimate:", error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.patch("/api/protected/estimates/:id", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      // First check if estimate exists and belongs to contractor
      const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
      if (!existingEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      const validatedData = estimateInsertSchema.partial().parse(req.body);
      
      const estimate = await storage.updateEstimate(estimateId, req.user!.id, validatedData);
      res.json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating estimate:", error);
      res.status(500).json({ message: "Failed to update estimate" });
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

  // Convert estimate to invoice
  app.post("/api/protected/estimates/:id/convert-to-invoice", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      // First, get the estimate and verify it belongs to the contractor
      const estimate = await storage.getEstimate(estimateId, req.user!.id);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify the estimate status is 'accepted'
      if (estimate.status !== 'accepted') {
        return res.status(400).json({ message: "Only accepted estimates can be converted to work orders" });
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
      const validatedData = eventInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      
      const validatedData = eventInsertSchema.partial().parse(req.body);
      
      const event = await storage.updateEvent(eventId, req.user!.id, validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
