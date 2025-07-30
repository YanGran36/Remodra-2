import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Sessions table for authentication
export const sessions = sqliteTable("session", {
  sid: text("sid").primaryKey(),
  sess: blob("sess").notNull(),
  expire: integer("expire").notNull()
});

// Contractors (users of the platform)
export const contractors = sqliteTable("contractors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  company_name: text("company_name").notNull(),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country").default("USA"),
  role: text("role").default("contractor").notNull(),
  plan: text("plan").default("basic").notNull(),
  // Subscription and billing fields
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: text("subscription_status").default("active").notNull(),
  plan_start_date: integer("plan_start_date"),
  plan_end_date: integer("plan_end_date"),
  // Usage tracking for plan limits
  current_client_count: integer("current_client_count").default(0).notNull(),
  ai_usage_this_month: integer("ai_usage_this_month").default(0).notNull(),
  ai_usage_reset_date: integer("ai_usage_reset_date").notNull(),
  settings: text("settings").default('{}'),
  language: text("language").default("en").notNull(),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull()
});

// Agents (field representatives working for contractors)
export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  employee_id: text("employee_id"),
  role: text("role").default("field_agent").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  specialties: text("specialties").default('[]'),
  color_code: text("color_code").default("#3B82F6"),
  hourly_rate: real("hourly_rate"),
  commission_rate: real("commission_rate"),
  hire_date: integer("hire_date"),
  notes: text("notes"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull()
});

// Clients (belonging to contractors)
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  notes: text("notes"),
  cancellation_history: text("cancellation_history"),
  created_at: integer("created_at").notNull()
});

// Projects
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  service_type: text("service_type").default("fence"), // fence, roof, deck, windows, gutters, siding, flooring, painting, electrical, plumbing, concrete, landscaping, hvac, other
  start_date: integer("start_date"),
  end_date: integer("end_date"),
  budget: real("budget"),
  notes: text("notes"),
  worker_instructions: text("worker_instructions"),
  worker_notes: text("worker_notes"),
  materials_needed: text("materials_needed").default('[]'),
  safety_requirements: text("safety_requirements"),
  ai_project_summary: text("ai_project_summary"),
  ai_analysis: text("ai_analysis").default('{}'),
  ai_generated_description: text("ai_generated_description"),
  ai_sharing_settings: text("ai_sharing_settings").default('{"installers": false, "clients": true, "estimators": true}'),
  last_ai_update: integer("last_ai_update"),
  position: integer("position").default(0),
  created_at: integer("created_at").notNull()
});

// Estimates
export const estimates = sqliteTable("estimates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  project_id: integer("project_id").references(() => projects.id),
  agent_id: integer("agent_id").references(() => agents.id),
  estimate_number: text("estimate_number").notNull(),
  issue_date: integer("issue_date").notNull(),
  expiry_date: integer("expiry_date"),
  status: text("status").notNull().default("draft"),
  estimate_type: text("estimate_type").notNull().default("agent"),
  appointment_date: integer("appointment_date"),
  appointment_duration: integer("appointment_duration").default(60),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull(),
  terms: text("terms"),
  notes: text("notes"),
  client_signature: text("client_signature"),
  contractor_signature: text("contractor_signature"),
  created_at: integer("created_at").notNull()
});

// Estimate line items
export const estimate_items = sqliteTable("estimate_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  estimate_id: integer("estimate_id").references(() => estimates.id).notNull(),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unit_price: real("unit_price").notNull(),
  amount: real("amount").notNull(),
  notes: text("notes")
});

// Invoices
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  project_id: integer("project_id").references(() => projects.id),
  estimate_id: integer("estimate_id").references(() => estimates.id),
  invoice_number: text("invoice_number").notNull(),
  issue_date: integer("issue_date").notNull(),
  due_date: integer("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull(),
  amount_paid: real("amount_paid").notNull().default(0),
  terms: text("terms"),
  notes: text("notes"),
  client_signature: text("client_signature"),
  contractor_signature: text("contractor_signature"),
  created_at: integer("created_at").notNull()
});

// Invoice line items
export const invoice_items = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoice_id: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unit_price: real("unit_price").notNull(),
  amount: real("amount").notNull(),
  notes: text("notes")
});

// Payments
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoice_id: integer("invoice_id").notNull(),
  amount: real("amount").notNull(),
  method: text("method").notNull().default("cash"),
  payment_date: integer("payment_date").notNull(),
  notes: text("notes"),
  created_at: integer("created_at").notNull()
});

// Events/Calendar
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  start_time: integer("start_time").notNull(),
  end_time: integer("end_time").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  client_id: integer("client_id").references(() => clients.id),
  project_id: integer("project_id").references(() => projects.id),
  agent_id: integer("agent_id").references(() => agents.id),
  notes: text("notes"),
  created_at: integer("created_at").notNull()
});

// Service pricing
export const service_pricing = sqliteTable("service_pricing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Service information
  name: text("name").notNull(),
  service_type: text("service_type").notNull(), // fence, roof, gutters, windows, etc.
  
  // Labor rate configuration
  labor_rate: real("labor_rate").notNull(),
  
  // Unit of measure
  unit: text("unit").default("ft").notNull(), // ft, sqft, unit, etc.
  labor_calculation_method: text("labor_calculation_method").default("by_length").notNull(), // by_length, by_area, fixed
  
  // Metadata
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull()
});

// Material pricing
export const material_pricing = sqliteTable("material_pricing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Material data
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // fence, roof, etc. (to associate with service type)
  
  // Additional identification fields to map to estimate materials
  code: text("code"), // Original code (wood_fence, vinyl_fence, etc.)
  material_id: text("material_id"), // Alternative ID for search
  id_string: text("id_string"), // Another way to store ID as string
  
  // Prices and units
  unit_price: real("unit_price").notNull(),
  unit: text("unit").notNull(), // ft, sqft, box, unit, etc.
  
  // Metadata
  supplier: text("supplier"),
  status: text("status").default("active").notNull(), // active, inactive
  is_default: integer("is_default", { mode: "boolean" }).default(false),
  created_at: integer("created_at"),
  updated_at: integer("updated_at")
});

// Materials
export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  project_id: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  cost: real("cost").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at").notNull()
});

// Attachments
export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  file_name: text("file_name").notNull(),
  file_path: text("file_path").notNull(),
  file_type: text("file_type").notNull(),
  file_size: integer("file_size").notNull(),
  related_type: text("related_type").notNull(), // estimate, invoice, project, client
  related_id: integer("related_id").notNull(),
  created_at: integer("created_at").notNull()
});

// Follow-ups
export const follow_ups = sqliteTable("follow_ups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  estimate_id: integer("estimate_id").references(() => estimates.id),
  type: text("type").notNull(), // call, email, text, visit
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  scheduled_date: integer("scheduled_date").notNull(),
  completed_date: integer("completed_date"),
  notes: text("notes"),
  created_at: integer("created_at").notNull()
});

// Property measurements
export const property_measurements = sqliteTable("property_measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  property_address: text("property_address").notNull(),
  measurements: text("measurements").notNull(), // JSON string
  notes: text("notes"),
  created_at: integer("created_at").notNull()
});

// Price configurations
export const price_configurations = sqliteTable("price_configurations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  name: text("name").notNull(),
  configuration: text("configuration").notNull(), // JSON string
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at").notNull()
});

// Achievements
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  code: text("code").notNull().unique(),
  criteria: text("criteria").notNull(),
  points: integer("points").default(0).notNull(),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at").notNull()
});

// Contractor achievements
export const contractor_achievements = sqliteTable("contractor_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  achievement_id: integer("achievement_id").references(() => achievements.id).notNull(),
  earned_at: integer("earned_at").notNull(),
  progress: integer("progress").notNull().default(0),
  is_completed: integer("is_completed", { mode: "boolean" }).default(false).notNull(),
  notified: integer("notified", { mode: "boolean" }).default(false).notNull()
});

// Achievement rewards
export const achievement_rewards = sqliteTable("achievement_rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  achievement_id: integer("achievement_id").references(() => achievements.id).notNull(),
  type: text("type").notNull(), // discount, feature, bonus
  description: text("description").notNull(),
  value: real("value").notNull(),
  duration: integer("duration"), // in days, null for permanent
  created_at: integer("created_at").notNull()
});

// Contractor streaks
export const contractor_streaks = sqliteTable("contractor_streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  current_streak: integer("current_streak").notNull().default(0),
  longest_streak: integer("longest_streak").notNull().default(0),
  last_activity_date: integer("last_activity_date").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  next_level_xp: integer("next_level_xp").notNull().default(100),
  created_at: integer("created_at").notNull()
});

// Timeclock entries
export const timeclock_entries = sqliteTable("timeclock_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  employee_name: text("employee_name").notNull(),
  job_type: text("job_type"), // Type of work being done
  type: text("type").notNull(), // "IN" or "OUT"
  timestamp: integer("timestamp").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  notes: text("notes"),
  clock_in_entry_id: integer("clock_in_entry_id"),
  hours_worked: text("hours_worked"),
  viewer_role: text("viewer_role").default("all"), // Access control: 'all', 'manager', 'owner', 'self'
  created_at: integer("created_at").notNull()
});

// Client messages
export const client_messages = sqliteTable("client_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("sent"), // sent, delivered, read
  sent_at: integer("sent_at").notNull(),
  read_at: integer("read_at")
});

// Client portal tokens
export const client_portal_tokens = sqliteTable("client_portal_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  client_id: integer("client_id").references(() => clients.id).notNull(),
  token: text("token").notNull().unique(),
  expires_at: integer("expires_at").notNull(),
  created_at: integer("created_at").notNull()
});

// Message replies
export const message_replies = sqliteTable("message_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message_id: integer("message_id").references(() => client_messages.id).notNull(),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  reply: text("reply").notNull(),
  sent_at: integer("sent_at").notNull()
});

// AI usage logs
export const ai_usage_logs = sqliteTable("ai_usage_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractor_id: integer("contractor_id").references(() => contractors.id).notNull(),
  feature: text("feature").notNull(),
  tokens_used: integer("tokens_used").notNull(),
  cost: real("cost").notNull(),
  timestamp: integer("timestamp").notNull()
});

// Subscription plans
export const subscription_plans = sqliteTable("subscription_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  interval: text("interval").notNull(), // monthly, yearly
  features: text("features").notNull(), // JSON string
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at").notNull()
});

// Define relations
export const contractors_relations = relations(contractors, ({ many }) => ({
  agents: many(agents),
  clients: many(clients),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  follow_ups: many(follow_ups),
  property_measurements: many(property_measurements),
  price_configurations: many(price_configurations),
  service_pricing: many(service_pricing),
  achievement_progress: many(contractor_achievements),
  streaks: many(contractor_streaks),
  timeclock_entries: many(timeclock_entries),
  client_messages: many(client_messages),
  ai_usage_logs: many(ai_usage_logs)
}));

export const agents_relations = relations(agents, ({ one, many }) => ({
  contractor: one(contractors, { fields: [agents.contractor_id], references: [contractors.id] }),
  estimates: many(estimates),
  events: many(events),
  timeclock_entries: many(timeclock_entries)
}));

export const clients_relations = relations(clients, ({ one, many }) => ({
  contractor: one(contractors, { fields: [clients.contractor_id], references: [contractors.id] }),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  follow_ups: many(follow_ups),
  property_measurements: many(property_measurements),
  client_messages: many(client_messages),
  client_portal_tokens: many(client_portal_tokens)
}));

export const projects_relations = relations(projects, ({ one, many }) => ({
  contractor: one(contractors, { fields: [projects.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [projects.client_id], references: [clients.id] }),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  property_measurements: many(property_measurements),
  timeclock_entries: many(timeclock_entries)
}));

export const estimates_relations = relations(estimates, ({ one, many }) => ({
  contractor: one(contractors, { fields: [estimates.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [estimates.client_id], references: [clients.id] }),
  project: one(projects, { fields: [estimates.project_id], references: [projects.id] }),
  agent: one(agents, { fields: [estimates.agent_id], references: [agents.id] }),
  items: many(estimate_items),
  invoices: many(invoices),
  attachments: many(attachments),
  follow_ups: many(follow_ups)
}));

export const estimate_items_relations = relations(estimate_items, ({ one }) => ({
  estimate: one(estimates, { fields: [estimate_items.estimate_id], references: [estimates.id] })
}));

export const invoices_relations = relations(invoices, ({ one, many }) => ({
  contractor: one(contractors, { fields: [invoices.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [invoices.client_id], references: [clients.id] }),
  project: one(projects, { fields: [invoices.project_id], references: [projects.id] }),
  estimate: one(estimates, { fields: [invoices.estimate_id], references: [estimates.id] }),
  items: many(invoice_items),
  payments: many(payments),
  attachments: many(attachments)
}));

export const invoice_items_relations = relations(invoice_items, ({ one }) => ({
  invoice: one(invoices, { fields: [invoice_items.invoice_id], references: [invoices.id] })
}));

export const payments_relations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoice_id], references: [invoices.id] })
}));

export const events_relations = relations(events, ({ one }) => ({
  contractor: one(contractors, { fields: [events.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [events.client_id], references: [clients.id] }),
  project: one(projects, { fields: [events.project_id], references: [projects.id] }),
  agent: one(agents, { fields: [events.agent_id], references: [agents.id] })
}));

export const materials_relations = relations(materials, ({ one, many }) => ({
  contractor: one(contractors, { fields: [materials.contractor_id], references: [contractors.id] }),
  project: one(projects, { fields: [materials.project_id], references: [projects.id] }),
  attachments: many(attachments)
}));

export const attachments_relations = relations(attachments, ({ one }) => ({
  contractor: one(contractors, { fields: [attachments.contractor_id], references: [contractors.id] })
}));

export const follow_ups_relations = relations(follow_ups, ({ one }) => ({
  contractor: one(contractors, { fields: [follow_ups.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [follow_ups.client_id], references: [clients.id] }),
  estimate: one(estimates, { fields: [follow_ups.estimate_id], references: [estimates.id] })
}));

export const property_measurements_relations = relations(property_measurements, ({ one }) => ({
  contractor: one(contractors, { fields: [property_measurements.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [property_measurements.client_id], references: [clients.id] })
}));

export const price_configurations_relations = relations(price_configurations, ({ one }) => ({
  contractor: one(contractors, { fields: [price_configurations.contractor_id], references: [contractors.id] })
}));

export const service_pricing_relations = relations(service_pricing, ({ one }) => ({
  contractor: one(contractors, { fields: [service_pricing.contractor_id], references: [contractors.id] })
}));

export const achievements_relations = relations(achievements, ({ many }) => ({
  contractor_achievements: many(contractor_achievements),
  rewards: many(achievement_rewards)
}));

export const contractor_achievements_relations = relations(contractor_achievements, ({ one }) => ({
  contractor: one(contractors, { fields: [contractor_achievements.contractor_id], references: [contractors.id] }),
  achievement: one(achievements, { fields: [contractor_achievements.achievement_id], references: [achievements.id] })
}));

export const achievement_rewards_relations = relations(achievement_rewards, ({ one }) => ({
  achievement: one(achievements, { fields: [achievement_rewards.achievement_id], references: [achievements.id] })
}));

export const contractor_streaks_relations = relations(contractor_streaks, ({ one }) => ({
  contractor: one(contractors, { fields: [contractor_streaks.contractor_id], references: [contractors.id] })
}));

export const timeclock_entries_relations = relations(timeclock_entries, ({ one }) => ({
  contractor: one(contractors, { fields: [timeclock_entries.contractor_id], references: [contractors.id] })
}));

export const client_messages_relations = relations(client_messages, ({ one, many }) => ({
  contractor: one(contractors, { fields: [client_messages.contractor_id], references: [contractors.id] }),
  client: one(clients, { fields: [client_messages.client_id], references: [clients.id] }),
  replies: many(message_replies)
}));

export const client_portal_tokens_relations = relations(client_portal_tokens, ({ one }) => ({
  client: one(clients, { fields: [client_portal_tokens.client_id], references: [clients.id] })
}));

export const message_replies_relations = relations(message_replies, ({ one }) => ({
  message: one(client_messages, { fields: [message_replies.message_id], references: [client_messages.id] }),
  contractor: one(contractors, { fields: [message_replies.contractor_id], references: [contractors.id] })
}));

export const ai_usage_logs_relations = relations(ai_usage_logs, ({ one }) => ({
  contractor: one(contractors, { fields: [ai_usage_logs.contractor_id], references: [contractors.id] })
}));

// Export all schemas
export const schema = {
  sessions,
  contractors,
  agents,
  clients,
  projects,
  estimates,
  estimate_items,
  invoices,
  invoice_items,
  payments,
  events,
  service_pricing,
  material_pricing,
  materials,
  attachments,
  follow_ups,
  property_measurements,
  price_configurations,
  achievements,
  contractor_achievements,
  timeclock_entries,
  client_messages,
  client_portal_tokens,
  message_replies,
  ai_usage_logs,
  subscription_plans,
  achievement_rewards,
  contractor_streaks
};

// Zod schema for inserting estimates (SQLite)
export const estimate_insert_schema = createInsertSchema(estimates).extend({
  issue_date: z.number(),
  expiry_date: z.number().optional(),
  appointment_date: z.number().optional(),
  subtotal: z.number().or(z.string().transform(val => parseFloat(val))),
  tax: z.number().or(z.string().transform(val => parseFloat(val))),
  discount: z.number().or(z.string().transform(val => parseFloat(val))),
  total: z.number().or(z.string().transform(val => parseFloat(val))),
  created_at: z.number(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().or(z.string().transform(val => parseFloat(val))),
      unit_price: z.number().or(z.string().transform(val => parseFloat(val))),
      amount: z.number().or(z.string().transform(val => parseFloat(val))),
      notes: z.string().optional()
    })
  ).optional()
});

// Zod schema for inserting events (SQLite)
export const event_insert_schema = z.object({
  contractor_id: z.number(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  start_time: z.number(),
  end_time: z.number(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  type: z.string(),
  status: z.string(),
  client_id: z.number().optional(),
  project_id: z.number().optional(),
  agent_id: z.number().optional(),
  notes: z.string().optional(),
  created_at: z.number().optional()
});

// Zod schema for inserting clients (SQLite)
export const client_insert_schema = z.object({
  contractor_id: z.number(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")).or(z.null()).nullable(),
  phone: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  address: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  city: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  state: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  zip: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  notes: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  cancellation_history: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  created_at: z.number()
});

// Zod schema for inserting agents (SQLite)
export const agent_insert_schema = z.object({
  contractor_id: z.number(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")).or(z.null()).nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  employee_id: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  role: z.string().default("field_agent"),
  is_active: z.boolean().default(true),
  specialties: z.string().default("[]"),
  color_code: z.string().default("#3B82F6"),
  hourly_rate: z.number().optional().or(z.null()).nullable(),
  commission_rate: z.number().optional().or(z.null()).nullable(),
  hire_date: z.number().optional().or(z.null()).nullable(),
  notes: z.string().optional().or(z.literal("")).or(z.null()).nullable(),
  created_at: z.number(),
  updated_at: z.number()
});

// Zod schema for inserting invoice items (SQLite)
export const invoice_item_insert_schema = z.object({
  invoice_id: z.number(),
  description: z.string(),
  quantity: z.string(),
  unit_price: z.string(),
  amount: z.string(),
  notes: z.string().optional().or(z.literal("")).or(z.null()).nullable()
}); 