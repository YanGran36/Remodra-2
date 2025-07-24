import type { Express } from "express";
import { storage } from "../storage";

export function registerPublicInvoiceRoutes(app: Express) {
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
} 