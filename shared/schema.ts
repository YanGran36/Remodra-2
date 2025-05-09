import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Sessions table for authentication
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull()
});

// Contractors (users of the platform)
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Clients (belonging to contractors)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, on_hold, completed, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Estimates
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  estimateNumber: text("estimate_number").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("draft"), // draft, sent, accepted, rejected, expired, converted
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  terms: text("terms"),
  notes: text("notes"),
  clientSignature: text("client_signature"),
  contractorSignature: text("contractor_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Estimate line items
export const estimateItems = pgTable("estimate_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").references(() => estimates.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes")
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  estimateId: integer("estimate_id").references(() => estimates.id),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, partially_paid, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  terms: text("terms"),
  notes: text("notes"),
  clientSignature: text("client_signature"),
  contractorSignature: text("contractor_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Invoice line items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes")
});

// Events/Calendar
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type").notNull(), // meeting, site-visit, delivery, estimate, invoice, other
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Materials/Supplies
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  supplier: text("supplier"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"), // e.g., each, ft, m, sq.ft, etc.
  orderNumber: text("order_number"),
  status: text("status").notNull().default("in_stock"), // in_stock, ordered, delivered, out_of_stock
  projectId: integer("project_id").references(() => projects.id),
  serviceType: text("service_type"), // deck, fence, roof, siding, windows, gutters
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Attachments for projects, clients, etc.
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  entityType: text("entity_type").notNull(), // client, project, estimate, invoice, material
  entityId: integer("entity_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description")
});

// AI Follow-up Agent settings and messages
export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  type: text("type").notNull(), // estimate, invoice, appointment, general
  status: text("status").notNull().default("pending"), // pending, sent, responded, completed
  entityId: integer("entity_id"), // ID of the estimate, invoice, etc.
  entityType: text("entity_type"), // estimate, invoice, appointment
  message: text("message").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  sentDate: timestamp("sent_date"),
  responseDate: timestamp("response_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Property measurements
export const propertyMeasurements = pgTable("property_measurements", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  serviceType: text("service_type").notNull(), // deck, fence, roof, siding, windows, gutters
  
  // Common measurements
  totalSquareFeet: decimal("total_square_feet", { precision: 10, scale: 2 }),
  totalLinearFeet: decimal("total_linear_feet", { precision: 10, scale: 2 }),
  notes: text("notes"),
  
  // Service-specific measurements (stored as JSON)
  measurementData: jsonb("measurement_data"), // Store different measurements based on service type
  
  // Image or diagram links
  diagramUrl: text("diagram_url"),
  
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Configuración de precios por contratista
export const priceConfigurations = pgTable("price_configurations", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Identificación del servicio
  serviceType: text("service_type").notNull(), // deck, fence, roof, siding, windows, gutters, etc.
  configName: text("config_name").notNull(), // Nombre amigable de la configuración
  
  // Precios base por unidad de medida
  baseLinearFootPrice: decimal("base_linear_foot_price", { precision: 10, scale: 2 }),
  baseSquareFootPrice: decimal("base_square_foot_price", { precision: 10, scale: 2 }),
  baseUnitPrice: decimal("base_unit_price", { precision: 10, scale: 2 }),
  
  // Configuración de costos y márgenes
  laborHourlyRate: decimal("labor_hourly_rate", { precision: 10, scale: 2 }).notNull(),
  materialCostMultiplier: decimal("material_cost_multiplier", { precision: 5, scale: 2 }).default("1.00").notNull(),
  overheadPercentage: decimal("overhead_percentage", { precision: 5, scale: 2 }).notNull(),
  profitMarginPercentage: decimal("profit_margin_percentage", { precision: 5, scale: 2 }).notNull(),
  
  // Multiplicadores por dificultad (JSON que almacena valores para fácil, medio, complejo)
  difficultyMultipliers: jsonb("difficulty_multipliers").default('{"easy": 0.8, "medium": 1.0, "complex": 1.3}'),
  
  // Metadatos
  isDefault: boolean("is_default").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define relations
export const contractorsRelations = relations(contractors, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  followUps: many(followUps),
  propertyMeasurements: many(propertyMeasurements),
  priceConfigurations: many(priceConfigurations)
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  contractor: one(contractors, { fields: [clients.contractorId], references: [contractors.id] }),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  followUps: many(followUps),
  propertyMeasurements: many(propertyMeasurements)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  contractor: one(contractors, { fields: [projects.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  propertyMeasurements: many(propertyMeasurements)
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  contractor: one(contractors, { fields: [estimates.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [estimates.clientId], references: [clients.id] }),
  project: one(projects, { fields: [estimates.projectId], references: [projects.id] }),
  items: many(estimateItems),
  invoices: many(invoices),
  attachments: many(attachments)
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, { fields: [estimateItems.estimateId], references: [estimates.id] })
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  contractor: one(contractors, { fields: [invoices.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  estimate: one(estimates, { fields: [invoices.estimateId], references: [estimates.id] }),
  items: many(invoiceItems),
  attachments: many(attachments)
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] })
}));

export const eventsRelations = relations(events, ({ one }) => ({
  contractor: one(contractors, { fields: [events.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [events.clientId], references: [clients.id] }),
  project: one(projects, { fields: [events.projectId], references: [projects.id] })
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  contractor: one(contractors, { fields: [materials.contractorId], references: [contractors.id] }),
  project: one(projects, { fields: [materials.projectId], references: [projects.id] }),
  attachments: many(attachments)
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  contractor: one(contractors, { fields: [attachments.contractorId], references: [contractors.id] })
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  contractor: one(contractors, { fields: [followUps.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [followUps.clientId], references: [clients.id] })
}));

// Property measurements relations
export const propertyMeasurementsRelations = relations(propertyMeasurements, ({ one }) => ({
  contractor: one(contractors, { fields: [propertyMeasurements.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [propertyMeasurements.clientId], references: [clients.id] }),
  project: one(projects, { fields: [propertyMeasurements.projectId], references: [projects.id] })
}));

// Price configurations relations
export const priceConfigurationsRelations = relations(priceConfigurations, ({ one }) => ({
  contractor: one(contractors, { fields: [priceConfigurations.contractorId], references: [contractors.id] })
}));

// Define schemas for validation
export const contractorInsertSchema = createInsertSchema(contractors, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  companyName: (schema) => schema.min(2, "Company name must be at least 2 characters"),
  language: (schema) => schema.refine(val => ["en", "es", "fr", "pt"].includes(val), "Language must be one of: en, es, fr, pt")
});

export const clientInsertSchema = createInsertSchema(clients, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email").nullable().optional()
});

export const projectInsertSchema = createInsertSchema(projects, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  startDate: (schema) => schema.optional(),
  endDate: (schema) => schema.optional()
});

// Extender el esquema de inserción de estimados para permitir ítems de línea
export const estimateInsertSchema = createInsertSchema(estimates).extend({
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().or(z.string().transform(val => parseFloat(val))),
      unitPrice: z.number().or(z.string().transform(val => parseFloat(val))),
      amount: z.number().or(z.string().transform(val => parseFloat(val))),
      notes: z.string().optional()
    })
  ).optional()
});
export const estimateItemInsertSchema = createInsertSchema(estimateItems);
export const invoiceInsertSchema = createInsertSchema(invoices);
export const invoiceItemInsertSchema = createInsertSchema(invoiceItems);
// Esquema personalizado para eventos en lugar de usar createInsertSchema
export const eventInsertSchema = z.object({
  contractorId: z.number(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().optional(),
  type: z.enum(["meeting", "site-visit", "delivery", "estimate", "invoice", "other"], {
    errorMap: () => ({ message: "Tipo de evento inválido" })
  }),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"], {
    errorMap: () => ({ message: "Estado de evento inválido" })
  }),
  clientId: z.number().optional(),
  projectId: z.number().optional(),
  notes: z.string().optional()
});
export const materialInsertSchema = createInsertSchema(materials);
export const attachmentInsertSchema = createInsertSchema(attachments);
export const followUpInsertSchema = createInsertSchema(followUps);
export const propertyMeasurementInsertSchema = createInsertSchema(propertyMeasurements);
export const priceConfigurationInsertSchema = createInsertSchema(priceConfigurations, {
  configName: (schema) => schema.min(2, "Nombre de configuración debe tener al menos 2 caracteres"),
  serviceType: (schema) => schema.min(1, "Tipo de servicio es requerido")
});

// Select schemas (used for types)
export const contractorSelectSchema = createSelectSchema(contractors);
export const clientSelectSchema = createSelectSchema(clients);
export const projectSelectSchema = createSelectSchema(projects);
export const estimateSelectSchema = createSelectSchema(estimates);
export const estimateItemSelectSchema = createSelectSchema(estimateItems);
export const invoiceSelectSchema = createSelectSchema(invoices);
export const invoiceItemSelectSchema = createSelectSchema(invoiceItems);
export const eventSelectSchema = createSelectSchema(events);
export const materialSelectSchema = createSelectSchema(materials);
export const attachmentSelectSchema = createSelectSchema(attachments);
export const followUpSelectSchema = createSelectSchema(followUps);
export const propertyMeasurementSelectSchema = createSelectSchema(propertyMeasurements);
export const priceConfigurationSelectSchema = createSelectSchema(priceConfigurations);

// Export types
export type Contractor = z.infer<typeof contractorSelectSchema>;
export type ContractorInsert = z.infer<typeof contractorInsertSchema>;
export type Client = z.infer<typeof clientSelectSchema>;
export type ClientInsert = z.infer<typeof clientInsertSchema>;
export type Project = z.infer<typeof projectSelectSchema>;
export type ProjectInsert = z.infer<typeof projectInsertSchema>;
export type Estimate = z.infer<typeof estimateSelectSchema>;
export type EstimateInsert = z.infer<typeof estimateInsertSchema>;
export type EstimateItem = z.infer<typeof estimateItemSelectSchema>;
export type EstimateItemInsert = z.infer<typeof estimateItemInsertSchema>;
export type Invoice = z.infer<typeof invoiceSelectSchema>;
export type InvoiceInsert = z.infer<typeof invoiceInsertSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSelectSchema>;
export type InvoiceItemInsert = z.infer<typeof invoiceItemInsertSchema>;
export type Event = z.infer<typeof eventSelectSchema>;
export type EventInsert = z.infer<typeof eventInsertSchema>;
export type Material = z.infer<typeof materialSelectSchema>;
export type MaterialInsert = z.infer<typeof materialInsertSchema>;
export type Attachment = z.infer<typeof attachmentSelectSchema>;
export type AttachmentInsert = z.infer<typeof attachmentInsertSchema>;
export type FollowUp = z.infer<typeof followUpSelectSchema>;
export type FollowUpInsert = z.infer<typeof followUpInsertSchema>;
export type PropertyMeasurement = z.infer<typeof propertyMeasurementSelectSchema>;
export type PropertyMeasurementInsert = z.infer<typeof propertyMeasurementInsertSchema>;
export type PriceConfiguration = z.infer<typeof priceConfigurationSelectSchema>;
export type PriceConfigurationInsert = z.infer<typeof priceConfigurationInsertSchema>;
