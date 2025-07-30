import { db } from "../db";
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
  contractorInsertSchema,
  agentInsertSchema,
  servicePricing,
  projects,
  aiUsageLog,
  contractors,
  clients,
  agents,
  estimates,
  estimateItems,
  invoices,
  invoiceItems,
  events,
  materials,
  attachments,
  followUps,
  propertyMeasurements,
  priceConfigurations,
  clientMessages,
  clientPortalTokens,
  messageReplies,
  payments
} from "../shared/schema";

// Import SQLite schema for local development
import * as sqliteSchema from "../shared/schema-sqlite";
import { eq, and, asc, desc, like, or, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// Use SQLite for local development, PostgreSQL for production
const isLocalDev = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('sqlite');

// Use the appropriate schema based on environment
const schema = isLocalDev ? sqliteSchema : {
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
  contractorInsertSchema,
  agentInsertSchema,
  servicePricing,
  projects,
  aiUsageLog,
  contractors,
  clients,
  agents,
  estimates,
  invoices,
  events
};

// Use the appropriate table references based on environment
const contractorsTable = isLocalDev ? sqliteSchema.contractors : contractors;
const clientsTable = isLocalDev ? sqliteSchema.clients : clients;
const agentsTable = isLocalDev ? sqliteSchema.agents : agents;
const projectsTable = isLocalDev ? sqliteSchema.projects : projects;
const estimatesTable = isLocalDev ? sqliteSchema.estimates : estimates;
const estimateItemsTable = isLocalDev ? sqliteSchema.estimate_items : estimateItems;
const estimateItemsModel = isLocalDev ? sqliteSchema.estimate_items : estimateItems;
const invoicesTable = isLocalDev ? sqliteSchema.invoices : invoices;
const eventsTable = isLocalDev ? sqliteSchema.events : events;
const materialsTable = isLocalDev ? sqliteSchema.materials : materials;
const followUpsTable = isLocalDev ? sqliteSchema.follow_ups : followUps;
const propertyMeasurementsTable = isLocalDev ? sqliteSchema.property_measurements : propertyMeasurements;
const priceConfigurationsTable = isLocalDev ? sqliteSchema.price_configurations : priceConfigurations;
const clientMessagesTable = isLocalDev ? sqliteSchema.client_messages : clientMessages;

export interface IStorage {
  // Contractors
  getContractor: (id: number) => Promise<any>;
  getContractorByEmail: (email: string) => Promise<any>;
  getAllContractors: () => Promise<any[]>;
  createContractor: (data: any) => Promise<any>;
  updateContractor: (id: number, data: any) => Promise<any>;
  
  // Clients
  getClients: (contractorId: number) => Promise<any[]>;
  getClient: (id: number, contractorId: number) => Promise<any>;
  getClientById: (id: number, contractorId: number) => Promise<any>; // Método público para client con seguridad
  createClient: (data: any) => Promise<any>;
  updateClient: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteClient: (id: number, contractorId: number) => Promise<boolean>;
  // Client uniqueness validation
  checkClientUniqueness: (contractorId: number, email?: string, phone?: string, address?: string) => Promise<{isUnique: boolean, existingClient?: any, conflictType?: string}>;
  findSimilarClients: (contractorId: number, searchData: {email?: string, phone?: string, address?: string}) => Promise<any[]>;
  
  // Projects
  getProjects: (contractorId: number) => Promise<any[]>;
  getProject: (id: number, contractorId: number) => Promise<any>;
  getProjectById: (id: number, contractorId: number) => Promise<any>; // Método público para projects con seguridad
  createProject: (data: any) => Promise<any>;
  createSimpleProject: (data: {
    contractorId: number;
    clientId: number;
    title: string;
    description?: string;
    status: string;
    budget?: number;
    startDate?: Date;
    notes?: string;
  }) => Promise<any>;
  updateProject: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteProject: (id: number, contractorId: number) => Promise<boolean>;
  
  // Estimates
  getEstimates: (contractorId: number) => Promise<any[]>;
  getEstimate: (id: number, contractorId: number) => Promise<any>;
  getEstimateById: (id: number, contractorId?: number) => Promise<any>; // Método público para clientes con seguridad
  createEstimate: (data: any) => Promise<any>;
  updateEstimate: (id: number, contractorId: number, data: any) => Promise<any>;
  updateEstimateById: (id: number, data: any) => Promise<any>; // Método público para clientes
  deleteEstimate: (id: number, contractorId: number) => Promise<boolean>;
  
  // Price Configurations
  getPriceConfigurations: (contractorId: number) => Promise<any[]>;
  getPriceConfiguration: (id: number, contractorId: number) => Promise<any>;
  getPriceConfigurationsByService: (contractorId: number, serviceType: string) => Promise<any[]>;
  getDefaultPriceConfiguration: (contractorId: number, serviceType: string) => Promise<any>;
  createPriceConfiguration: (data: any) => Promise<any>;
  updatePriceConfiguration: (id: number, contractorId: number, data: any) => Promise<any>;
  deletePriceConfiguration: (id: number, contractorId: number) => Promise<boolean>;
  setDefaultPriceConfiguration: (id: number, contractorId: number, serviceType: string) => Promise<any>;
  
  // Estimate Items
  getEstimateItems: (estimateId: number, contractorId: number) => Promise<any[]>;
  createEstimateItem: (data: any) => Promise<any>;
  updateEstimateItem: (id: number, estimateId: number, contractorId: number, data: any) => Promise<any>;
  deleteEstimateItem: (id: number, estimateId: number, contractorId: number) => Promise<boolean>;
  
  // Invoices
  getInvoices: (contractorId: number) => Promise<any[]>;
  getInvoice: (id: number, contractorId: number) => Promise<any>;
  getInvoiceById: (id: number, contractorId?: number) => Promise<any>; // Método público para clientes con seguridad
  createInvoice: (data: any) => Promise<any>;
  updateInvoice: (id: number, contractorId: number, data: any) => Promise<any>;
  updateInvoiceById: (id: number, data: any) => Promise<any>; // Método público para clientes
  deleteInvoice: (id: number, contractorId: number) => Promise<boolean>;
  
  // Invoice Items
  getInvoiceItems: (invoiceId: number, contractorId: number) => Promise<any[]>;
  getInvoiceItemsById: (invoiceId: number, contractorId?: number) => Promise<any[]>; // Método público para clientes con seguridad
  createInvoiceItem: (data: any) => Promise<any>;
  updateInvoiceItem: (id: number, invoiceId: number, contractorId: number, data: any) => Promise<any>;
  deleteInvoiceItem: (id: number, invoiceId: number, contractorId: number) => Promise<boolean>;
  
  // Payments
  getPayments: (invoiceId: number, contractorId: number) => Promise<any[]>;
  createPayment: (data: any) => Promise<any>;
  getPayment: (id: number, contractorId: number) => Promise<any>;
  
  // Events
  getEvents: (contractorId: number) => Promise<any[]>;
  getEvent: (id: number, contractorId: number) => Promise<any>;
  createEvent: (data: any) => Promise<any>;
  updateEvent: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteEvent: (id: number, contractorId: number) => Promise<boolean>;
  
  // Agents
  getAgents: (contractorId: number) => Promise<any[]>;
  getAgent: (id: number, contractorId: number) => Promise<any>;
  createAgent: (data: any) => Promise<any>;
  updateAgent: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteAgent: (id: number, contractorId: number) => Promise<boolean>;
  
  // Materials
  getMaterials: (contractorId: number) => Promise<any[]>;
  getMaterial: (id: number, contractorId: number) => Promise<any>;
  createMaterial: (data: any) => Promise<any>;
  updateMaterial: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteMaterial: (id: number, contractorId: number) => Promise<boolean>;
  
  // Attachments
  getAttachments: (contractorId: number, entityType: string, entityId: number) => Promise<any[]>;
  createAttachment: (data: any) => Promise<any>;
  deleteAttachment: (id: number, contractorId: number) => Promise<boolean>;
  
  // Follow-ups
  getFollowUps: (contractorId: number) => Promise<any[]>;
  createFollowUp: (data: any) => Promise<any>;
  updateFollowUp: (id: number, contractorId: number, data: any) => Promise<any>;
  deleteFollowUp: (id: number, contractorId: number) => Promise<boolean>;
  
  // Property Measurements
  getPropertyMeasurements: (contractorId: number) => Promise<any[]>;
  getPropertyMeasurement: (id: number, contractorId: number) => Promise<any>;
  createPropertyMeasurement: (data: any) => Promise<any>;
  updatePropertyMeasurement: (id: number, contractorId: number, data: any) => Promise<any>;
  deletePropertyMeasurement: (id: number, contractorId: number) => Promise<boolean>;
  
  // Subscription Management
  getAllSubscriptionPlans: () => Promise<any[]>;
  getClientsByContractor: (contractorId: number) => Promise<any[]>;
  
  // Client Messages
  getClientMessages: (contractorId: number) => Promise<any[]>;
  getClientMessage: (id: number, contractorId: number) => Promise<any>;
  createClientMessage: (data: any) => Promise<any>;
  updateClientMessage: (id: number, contractorId: number, data: any) => Promise<any>;
  markMessageAsRead: (id: number, contractorId: number) => Promise<any>;
  deleteClientMessage: (id: number, contractorId: number) => Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (isLocalDev) {
      // Use memory store for development but with better configuration
      this.sessionStore = new session.MemoryStore();
      console.log('Using memory session store for development');
    } else {
      // Use PostgreSQL session store for production
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === "production",
          max: 10,
          idleTimeoutMillis: 60000,
          connectionTimeoutMillis: 10000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        },
        createTableIfMissing: true,
        tableName: "session",
        pruneSessionInterval: 300,
        ttl: 24 * 60 * 60
      });
      console.log('Using PostgreSQL session store for production');
    }
  }

  // Helper to map DB fields to camelCase
  mapContractorToCamel(user: any) {
    if (!user) return null;
    return {
      ...user,
      subscriptionStatus: user.subscription_status,
      planEndDate: user.plan_end_date,
      planStartDate: user.plan_start_date,
      aiUsageResetDate: user.ai_usage_reset_date,
      currentClientCount: user.current_client_count,
      aiUsageThisMonth: user.ai_usage_this_month,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  // Contractor methods
  async getContractor(id: number) {
    const result = await db.query.contractors.findFirst({
      where: eq(contractorsTable.id, id)
    });
    return this.mapContractorToCamel(result);
  }

  async getContractorByEmail(email: string) {
    const result = await db.query.contractors.findFirst({
      where: eq(contractorsTable.email, email)
    });
    return this.mapContractorToCamel(result);
  }

  async getAllContractors() {
    const contractors = await db.query.contractors.findMany();
    return contractors.map(this.mapContractorToCamel);
  }

  async createContractor(data: any) {
    const [contractor] = await db.insert(contractorsTable).values(data).returning();
    
    // Don't send password to client
    const { password, ...user } = contractor;
    
    // Convert timestamp numbers back to Date objects for session compatibility
    if (user.createdAt && typeof user.createdAt === 'number') {
      user.createdAt = new Date(user.createdAt);
    }
    if (user.updatedAt && typeof user.updatedAt === 'number') {
      user.updatedAt = new Date(user.updatedAt);
    }
    if (user.aiUsageResetDate && typeof user.aiUsageResetDate === 'number') {
      user.aiUsageResetDate = new Date(user.aiUsageResetDate);
    }
    if (user.planStartDate && typeof user.planStartDate === 'number') {
      user.planStartDate = new Date(user.planStartDate);
    }
    if (user.planEndDate && typeof user.planEndDate === 'number') {
      user.planEndDate = new Date(user.planEndDate);
    }
    
    return user;
  }

  async updateContractor(id: number, data: any) {
    const [updated] = await db
      .update(contractorsTable)
      .set(data)
      .where(eq(contractorsTable.id, id))
      .returning();
    
    // Don't send password to client
    const { password, ...user } = updated;
    return user;
  }

  // Client methods
  async getClients(contractorId: number): Promise<any[]> {
    try {
      const table = clientsTable as any;
      const clients = await db
        .select()
        .from(table)
        .where(eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId))
        .orderBy(isLocalDev ? table.created_at : table.createdAt);
      // Map database fields to frontend expected format
      return clients.map((client: any) => ({
        id: client.id,
        contractorId: isLocalDev ? client.contractor_id : client.contractorId,
        firstName: isLocalDev ? client.first_name : client.firstName,
        lastName: isLocalDev ? client.last_name : client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        state: client.state,
        zip: client.zip,
        notes: client.notes,
        cancellationHistory: isLocalDev ? client.cancellation_history : client.cancellationHistory,
        createdAt: isLocalDev ? client.created_at : client.createdAt,
        projects: [] // Will be populated by the frontend if needed
      }));
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  }

  async getClient(id: number, contractorId: number): Promise<any> {
    try {
      const table = clientsTable as any;
      const results = await db
        .select()
        .from(table)
        .where(and(
          eq(table.id, id),
          eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)
        ))
        .limit(1);
      if (!results[0]) return null;
      const client = results[0];
      // Map database fields to frontend expected format
      return {
        id: client.id,
        contractorId: isLocalDev ? client.contractor_id : client.contractorId,
        firstName: isLocalDev ? client.first_name : client.firstName,
        lastName: isLocalDev ? client.last_name : client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        state: client.state,
        zip: client.zip,
        notes: client.notes,
        cancellationHistory: isLocalDev ? client.cancellation_history : client.cancellationHistory,
        createdAt: isLocalDev ? client.created_at : client.createdAt,
        projects: [] // Will be populated by the frontend if needed
      };
    } catch (error) {
      console.error("Error fetching client:", error);
      throw error;
    }
  }
  
  // Método para obtener un cliente por ID - ahora con verificación del contratista
  async getClientById(id: number, contractorId: number) {
    const table = clientsTable as any;
    return await db.query.clients.findFirst({
      where: and(
        eq(table.id, id),
        eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)
      )
    });
  }

  async createClient(data: any) {
    try {
      // Check for uniqueness before creating
      const uniquenessCheck = await this.checkClientUniqueness(
        data.contractorId,
        data.email,
        data.phone,
        data.address
      );

      if (!uniquenessCheck.isUnique) {
        const error = new Error(`Client already exists with this ${uniquenessCheck.conflictType}`);
        (error as any).code = 'CLIENT_DUPLICATE';
        (error as any).existingClient = uniquenessCheck.existingClient;
        (error as any).conflictType = uniquenessCheck.conflictType;
        throw error;
      }

      const [client] = await db.insert(clientsTable).values(data).returning();
      return client;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: number, contractorId: number, data: any) {
    try {
      const table = clientsTable as any;
      const [client] = await db
        .update(table)
        .set({ ...data, updatedAt: Date.now() })
        .where(and(eq(table.id, id), eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)))
        .returning();
      return client;
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  }

  async deleteClient(id: number, contractorId: number) {
    try {
      const table = clientsTable as any;
      const result = await db
        .delete(table)
        .where(and(eq(table.id, id), eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  }

  // Client uniqueness validation methods
  async checkClientUniqueness(contractorId: number, email?: string, phone?: string, address?: string) {
    try {
      const table = clientsTable as any;
      const conditions = [eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)];
      if (email) {
        conditions.push(eq(table.email, email));
      }
      if (phone) {
        conditions.push(eq(table.phone, phone));
      }
      if (address) {
        conditions.push(eq(table.address, address));
      }
      const existingClient = await db
        .select()
        .from(table)
        .where(and(...conditions))
        .limit(1);
      if (existingClient.length > 0) {
        const client = existingClient[0];
        let conflictType = 'general';
        if (email && client.email === email) {
          conflictType = 'email';
        } else if (phone && client.phone === phone) {
          conflictType = 'phone';
        } else if (address && client.address === address) {
          conflictType = 'address';
        }
        return {
          isUnique: false,
          existingClient: client,
          conflictType
        };
      }
      return { isUnique: true };
    } catch (error) {
      console.error("Error checking client uniqueness:", error);
      throw error;
    }
  }

  async findSimilarClients(contractorId: number, searchData: {email?: string, phone?: string, address?: string}) {
    try {
      const table = clientsTable as any;
      const conditions = [eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)];
      const searchConditions = [];
      if (searchData.email) {
        searchConditions.push(like(table.email, `%${searchData.email}%`));
      }
      if (searchData.phone) {
        searchConditions.push(like(table.phone, `%${searchData.phone}%`));
      }
      if (searchData.address) {
        searchConditions.push(like(table.address, `%${searchData.address}%`));
      }
      if (searchConditions.length === 0) {
        return [];
      }
      const similarClients = await db
        .select()
        .from(table)
        .where(and(...conditions, or(...searchConditions)))
        .orderBy(isLocalDev ? table.created_at : table.createdAt)
        .limit(10);
      return similarClients;
    } catch (error) {
      console.error("Error finding similar clients:", error);
      throw error;
    }
  }

  // Project methods
  async getProjects(contractorId: number): Promise<any[]> {
    try {
      const projects = await db
        .select()
        .from(projectsTable)
        .where(eq(sql.raw(isLocalDev ? 'contractor_id' : 'contractorId'), contractorId))
        .orderBy(desc(sql.raw(isLocalDev ? 'created_at' : 'createdAt')));
      
      // Get all clients for this contractor to join with projects
      const clients = await db
        .select()
        .from(clientsTable)
        .where(eq(sql.raw('contractor_id'), contractorId));
      
      // Create a map of client IDs to client objects for quick lookup
      const clientMap = new Map();
      clients.forEach((client: any) => {
        clientMap.set(client.id, {
          id: client.id,
          firstName: isLocalDev ? client.first_name : client.firstName,
          lastName: isLocalDev ? client.last_name : client.lastName,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          state: client.state,
          zip: client.zip
        });
      });
      
      // Map database fields to frontend expected format and include client information
      return projects.map((project: any) => {
        const clientId = isLocalDev ? project.client_id : project.clientId;
        const client = clientId ? clientMap.get(clientId) : null;
        
        console.log(`Project ${project.id}: clientId=${clientId}, client=`, client);
        
        return {
          id: project.id,
          contractorId: isLocalDev ? project.contractor_id : project.contractorId,
          clientId: clientId,
          title: project.title,
          description: project.description,
          status: project.status,
          serviceType: isLocalDev ? project.service_type : project.serviceType, // Map service_type field
          startDate: isLocalDev ? project.start_date : project.startDate,
          endDate: isLocalDev ? project.end_date : project.endDate,
          budget: project.budget,
          notes: project.notes,
          workerInstructions: isLocalDev ? project.worker_instructions : project.workerInstructions,
          workerNotes: isLocalDev ? project.worker_notes : project.workerNotes,
          materialsNeeded: isLocalDev ? project.materials_needed : project.materialsNeeded,
          safetyRequirements: isLocalDev ? project.safety_requirements : project.safetyRequirements,
          aiProjectSummary: isLocalDev ? project.ai_project_summary : project.aiProjectSummary,
          aiAnalysis: isLocalDev ? project.ai_analysis : project.aiAnalysis,
          aiGeneratedDescription: isLocalDev ? project.ai_generated_description : project.aiGeneratedDescription,
          aiSharingSettings: isLocalDev ? project.ai_sharing_settings : project.aiSharingSettings,
          lastAiUpdate: isLocalDev ? project.last_ai_update : project.lastAiUpdate,
          position: project.position,
          createdAt: isLocalDev ? project.created_at : project.createdAt,
          client: client // Include client information
        };
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  async getProject(id: number, contractorId: number): Promise<any> {
    try {
      const results = await db
        .select()
        .from(projectsTable)
        .where(and(eq(projectsTable.id, id), eq(sql.raw(isLocalDev ? 'contractor_id' : 'contractorId'), contractorId)));
      
      if (!results[0]) return null;
      
      const project = results[0];
      // Map database fields to frontend expected format
      return {
        id: project.id,
        contractorId: isLocalDev ? project.contractor_id : project.contractorId,
        clientId: isLocalDev ? project.client_id : project.clientId,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: isLocalDev ? project.start_date : project.startDate,
        endDate: isLocalDev ? project.end_date : project.endDate,
        budget: project.budget,
        notes: project.notes,
        workerInstructions: isLocalDev ? project.worker_instructions : project.workerInstructions,
        workerNotes: isLocalDev ? project.worker_notes : project.workerNotes,
        materialsNeeded: isLocalDev ? project.materials_needed : project.materialsNeeded,
        safetyRequirements: isLocalDev ? project.safety_requirements : project.safetyRequirements,
        aiProjectSummary: isLocalDev ? project.ai_project_summary : project.aiProjectSummary,
        aiAnalysis: isLocalDev ? project.ai_analysis : project.aiAnalysis,
        aiGeneratedDescription: isLocalDev ? project.ai_generated_description : project.aiGeneratedDescription,
        aiSharingSettings: isLocalDev ? project.ai_sharing_settings : project.aiSharingSettings,
        lastAiUpdate: isLocalDev ? project.last_ai_update : project.lastAiUpdate,
        position: project.position,
        createdAt: isLocalDev ? project.created_at : project.createdAt
      };
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  }
  
  // Método para obtener un proyecto por ID - ahora con verificación de contratista
  async getProjectById(id: number, contractorId: number) {
    // Use correct SQLite field names
    const project = await db
      .select()
      .from(sqliteSchema.projects)
      .where(
        and(
          eq(sqliteSchema.projects.id, id),
          eq(sqliteSchema.projects.contractor_id, contractorId)
        )
      )
      .limit(1);
    return project[0] || null;
  }

  async createProject(data: any) {
    const [project] = await db.insert(projectsTable).values(data).returning();
    return project;
  }

  async createSimpleProject(data: {
    contractorId: number;
    clientId: number;
    title: string;
    description?: string;
    status: string;
    budget?: number;
    startDate?: Date;
    notes?: string;
  }) {
    const table = projectsTable as any;
    // Create project using Drizzle ORM with correct field names for SQLite
    const [project] = await db.insert(table).values({
      contractor_id: isLocalDev ? data.contractorId : undefined,
      contractorId: isLocalDev ? undefined : data.contractorId,
      client_id: isLocalDev ? data.clientId : undefined,
      clientId: isLocalDev ? undefined : data.clientId,
      title: data.title,
      description: data.description || null,
      status: data.status,
      budget: data.budget || null,
      start_date: isLocalDev ? (data.startDate ? data.startDate.getTime() : null) : undefined,
      startDate: isLocalDev ? undefined : (data.startDate ? data.startDate : null),
      notes: data.notes || null,
      created_at: isLocalDev ? Date.now() : undefined,
      createdAt: isLocalDev ? undefined : new Date()
    }).returning();
    return project;
  }

  async updateProject(id: number, contractorId: number, data: any) {
    try {
      const table = projectsTable as any;
      const [project] = await db
        .update(table)
        .set({ ...data, updatedAt: Date.now() })
        .where(and(eq(table.id, id), eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)))
        .returning();
      return project;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  async deleteProject(id: number, contractorId: number) {
    const table = projectsTable as any;
    const result = await db
      .delete(table)
      .where(and(eq(table.id, id), eq(isLocalDev ? table.contractor_id : table.contractorId, contractorId)));
    return result.rowCount > 0;
  }

  // Estimate methods
  async getEstimates(contractorId: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    return await db.query.estimates.findMany({
      where: eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId),
      orderBy: desc(isLocalDev ? estTable.created_at : estTable.createdAt),
      with: {
        client: true,
        project: true
      }
    });
  }

  async getEstimate(id: number, contractorId: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    return await db.query.estimates.findFirst({
      where: and(
        eq(estTable.id, id),
        eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: true,
        items: true
      }
    });
  }

  async getEstimateById(id: number, contractorId?: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    if (contractorId) {
      return await db.query.estimates.findFirst({
        where: and(
          eq(estTable.id, id),
          eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
        ),
        with: {
          client: true,
          contractor: true,
          project: true,
          items: true
        }
      });
    } else {
      return await db.query.estimates.findFirst({
        where: eq(estTable.id, id),
        with: {
          client: true,
          contractor: true,
          project: true,
          items: true
        }
      });
    }
  }

  async createEstimate(data: any) {
    try {
      // Validar que el cliente pertenece al contratista
      const client = await db.query.clients.findFirst({
        where: and(
          eq(sql.raw(isLocalDev ? 'contractor_id' : 'contractorId'), data.contractorId),
          eq(clientsTable.id, data.clientId)
        )
      });
      
      if (!client) {
        throw new Error(`Client ${data.clientId} not found or does not belong to contractor ${data.contractorId}`);
      }
      
      // Si se proporciona projectId, validar que también pertenece al contratista
      if (data.projectId) {
        const project = await db.query.projects.findFirst({
          where: and(
            eq(projectsTable.id, data.projectId),
            eq(projectsTable.contractorId, data.contractorId)
          )
        });
        
        if (!project) {
          throw new Error(`Project ${data.projectId} not found or does not belong to contractor ${data.contractorId}`);
        }
      }
      
      // Extraer y eliminar la propiedad items si existe, ya que no es parte del modelo de la tabla
      const { items, ...estimateData } = data as any;
      
      // Server-side validation to prevent zero-total estimates
      const total = parseFloat(estimateData.total || "0");
      if (total <= 0) {
        throw new Error("Estimate total must be greater than $0.00");
      }
      
      const [estimate] = await db.insert(estimatesTable).values(estimateData).returning();
      
      // Si hay items en el parámetro, insertarlos también
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemData = {
            estimateId: estimate.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            amount: String(item.amount),
            notes: item.notes
          };
          await db.insert(estimateItemsModel).values(itemData);
        }
      }
      
      return estimate;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async updateEstimate(id: number, contractorId: number, data: any) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    try {
      const items = data.items;
      delete data.items;
      const [updated] = await db
        .update(estTable)
        .set(data)
        .where(
          and(
            eq(estTable.id, id),
            eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
          )
        )
        .returning();
      if (items && Array.isArray(items)) {
        await db
          .delete(estimateItemsModel)
          .where(eq(isLocalDev ? estimateItemsModel.estimate_id : estimateItemsModel.estimateId, id));
        for (const item of items) {
          const itemData = {
            estimate_id: id,
            description: item.description,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price || item.unitPrice),
            amount: String(item.amount),
            notes: item.notes || ""
          };
          await db.insert(estimateItemsModel).values(itemData);
        }
      }
      return updated;
    } catch (error) {
      console.error("Error updating estimate:", error);
      throw error;
    }
  }

  async updateEstimateById(id: number, data: any) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    try {
      const items = data.items;
      delete data.items;
      const [updated] = await db
        .update(estTable)
        .set(data)
        .where(eq(estTable.id, id))
        .returning();
      if (items && Array.isArray(items)) {
        await db
          .delete(estimateItemsModel)
          .where(eq(isLocalDev ? estimateItemsModel.estimate_id : estimateItemsModel.estimateId, id));
        for (const item of items) {
          const itemData = {
            estimate_id: id,
            description: item.description,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price || item.unitPrice),
            amount: String(item.amount),
            notes: item.notes || ""
          };
          await db.insert(estimateItemsModel).values(itemData);
        }
      }
      return updated;
    } catch (error) {
      console.error("Error updating estimate by id:", error);
      throw error;
    }
  }

  async deleteEstimate(id: number, contractorId: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    try {
      const estimateCheck = await db.query.estimates.findFirst({
        where: and(
          eq(estTable.id, id),
          eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
        )
      });
      if (!estimateCheck) {
        return false;
      }
      await db
        .delete(estimateItemsModel)
        .where(eq(isLocalDev ? estimateItemsModel.estimate_id : estimateItemsModel.estimateId, id));
      const result = await db
        .delete(estTable)
        .where(
          and(
            eq(estTable.id, id),
            eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
          )
        );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting estimate:", error);
      throw error;
    }
  }

  // Estimate Item methods
  async getEstimateItems(estimateId: number, contractorId: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    const estItemsTable = isLocalDev ? (sqliteSchema.estimate_items as any) : (estimateItems as any);
    const estimateCheck = await db
      .select()
      .from(estTable)
      .where(and(
        eq(estTable.id, estimateId),
        eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
      ))
      .limit(1);
    if (!estimateCheck || estimateCheck.length === 0) {
      return [];
    }
    return await db
      .select()
      .from(estItemsTable)
      .where(eq(isLocalDev ? estItemsTable.estimate_id : estItemsTable.estimateId, estimateId));
  }

  async createEstimateItem(data: any) {
    const [item] = await db.insert(estimateItemsModel).values(data).returning();
    return item;
  }

  async updateEstimateItem(id: number, estimateId: number, contractorId: number, data: any) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    const estItemsTable = isLocalDev ? (sqliteSchema.estimate_items as any) : (estimateItems as any);
    const estimateCheck = await db.query.estimates.findFirst({
      where: and(
        eq(estTable.id, estimateId),
        eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
      )
    });
    if (!estimateCheck) {
      return null;
    }
    const [updated] = await db
      .update(estItemsTable)
      .set(data)
      .where(
        and(
          eq(estItemsTable.id, id),
          eq(isLocalDev ? estItemsTable.estimate_id : estItemsTable.estimateId, estimateId)
        )
      )
      .returning();
    return updated;
  }

  async deleteEstimateItem(id: number, estimateId: number, contractorId: number) {
    const estTable = isLocalDev ? (sqliteSchema.estimates as any) : (estimates as any);
    const estItemsTable = isLocalDev ? (sqliteSchema.estimate_items as any) : (estimateItems as any);
    const estimateCheck = await db.query.estimates.findFirst({
      where: and(
        eq(estTable.id, estimateId),
        eq(isLocalDev ? estTable.contractor_id : estTable.contractorId, contractorId)
      )
    });
    if (!estimateCheck) {
      return false;
    }
    const result = await db
      .delete(estItemsTable)
      .where(
        and(
          eq(estItemsTable.id, id),
          eq(isLocalDev ? estItemsTable.estimate_id : estItemsTable.estimateId, estimateId)
        )
      );
    return result.rowCount > 0;
  }

  // Invoice methods
  async getInvoices(contractorId: number) {
    const invTable = sqliteSchema.invoices;
    const clientsTable = sqliteSchema.clients;
    const projectsTable = sqliteSchema.projects;
    try {
      const invoicesList = await db
        .select()
        .from(invTable)
        .where(eq(invTable.contractor_id, contractorId))
        .orderBy(desc(invTable.created_at));
      const invoicesWithRelations = await Promise.all(
        invoicesList.map(async (invoice: any) => {
          const clientId = invoice.client_id;
          const client = await db
            .select()
            .from(clientsTable)
            .where(eq(clientsTable.id, clientId))
            .limit(1);
          const projectId = invoice.project_id;
          const project = projectId ? await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, projectId))
            .limit(1) : null;
          return {
            ...invoice,
            client: client[0] || null,
            project: project ? project[0] : null
          };
        })
      );
      return invoicesWithRelations;
    } catch (error) {
      console.error('Error in getInvoices:', error);
      return [];
    }
  }

  async getInvoice(id: number, contractorId: number) {
    const invTable = sqliteSchema.invoices;
    const clientsTable = sqliteSchema.clients;
    const projectsTable = sqliteSchema.projects;
    try {
      const invoice = await db
        .select()
        .from(invTable)
        .where(
          and(
            eq(invTable.id, id),
            eq(invTable.contractor_id, contractorId)
          )
        )
        .limit(1);
      if (!invoice[0]) return null;
      const clientId = invoice[0].client_id;
      const client = await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, clientId))
        .limit(1);
      const projectId = invoice[0].project_id;
      const project = projectId ? await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1) : null;
      const payments = await this.getPayments(id, contractorId);
      return {
        ...invoice[0],
        client: client[0] || null,
        project: project ? project[0] : null,
        payments: payments
      };
    } catch (error) {
      console.error('Error in getInvoice:', error);
      return null;
    }
  }

  async getPayments(invoiceId: number, contractorId: number) {
    try {
      const payTable = sqliteSchema.payments;
      const invTable = sqliteSchema.invoices;
      const invoiceCheck = await db
        .select()
        .from(invTable)
        .where(
          and(
            eq(invTable.id, invoiceId),
            eq(invTable.contractor_id, contractorId)
          )
        )
        .limit(1);
      if (!invoiceCheck[0]) {
        return [];
      }
      const paymentsList = await db
        .select()
        .from(payTable)
        .where(eq(payTable.invoice_id, invoiceId))
        .orderBy(desc(payTable.payment_date));
      return paymentsList;
    } catch (error) {
      console.error('Error in getPayments:', error);
      return [];
    }
  }

  async createPayment(data: any) {
    const payTable = sqliteSchema.payments;
    try {
      const now = Date.now();
      const paymentData: any = {
        invoice_id: Number(data.invoiceId),
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : Number(data.amount),
        method: data.method || 'cash',
        payment_date: typeof data.payment_date === 'number' ? data.payment_date : now,
        notes: data.notes || '',
        created_at: typeof data.created_at === 'number' ? data.created_at : now
      };
      const [payment] = await db.insert(payTable).values(paymentData).returning();
      return payment;
    } catch (error) {
      console.error('Error inserting payment:', error, data);
      throw error;
    }
  }

  async getPayment(id: number, contractorId: number) {
    const payTable = sqliteSchema.payments;
    const invTable = sqliteSchema.invoices;
    // Get payment and verify it belongs to an invoice owned by the contractor
    const payment = await db
      .select()
      .from(payTable)
      .innerJoin(
        invTable,
        eq(payTable.invoice_id, invTable.id)
      )
      .where(
        and(
          eq(payTable.id, id),
          eq(invTable.contractor_id, contractorId)
        )
      )
      .limit(1);
    if (!payment[0]) return null;
    const paymentData = payment[0];
    return {
      id: paymentData.payments.id,
      invoiceId: paymentData.payments.invoice_id,
      amount: paymentData.payments.amount,
      method: paymentData.payments.method,
      paymentDate: paymentData.payments.payment_date,
      notes: paymentData.payments.notes,
      createdAt: paymentData.payments.created_at
    };
  }

  async getInvoiceById(id: number, contractorId?: number) {
    const invTable = sqliteSchema.invoices;
    const clientsTable = sqliteSchema.clients;
    const projectsTable = sqliteSchema.projects;
    
    if (contractorId) {
      // Si se proporciona el ID del contratista, verificamos que la factura le pertenezca
      const invoice = await db
        .select()
        .from(invTable)
        .where(
          and(
            eq(invTable.id, id),
            eq(invTable.contractor_id, contractorId)
          )
        )
        .limit(1);
      
      if (!invoice[0]) return null;
      
      // Get related data
      const clientId = invoice[0].client_id;
      const client = await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, clientId))
        .limit(1);
      
      const projectId = invoice[0].project_id;
      const project = projectId ? await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1) : null;
      
      return {
        ...invoice[0],
        client: client[0] || null,
        project: project ? project[0] : null
      };
    } else {
      // Si no se proporciona el ID del contratista, devolvemos la factura sin verificación
      const invoice = await db
        .select()
        .from(invTable)
        .where(eq(invTable.id, id))
        .limit(1);
      
      if (!invoice[0]) return null;
      
      // Get related data
      const clientId = invoice[0].client_id;
      const client = await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, clientId))
        .limit(1);
      
      const projectId = invoice[0].project_id;
      const project = projectId ? await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1) : null;
      
      return {
        ...invoice[0],
        client: client[0] || null,
        project: project ? project[0] : null
      };
    }
  }

  async createInvoice(data: any) {
    try {
      const [invoice] = await db.insert(invoicesTable).values(data).returning();
      return invoice;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async updateInvoice(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(sqliteSchema.invoices)
      .set(data)
      .where(
        and(
          eq(sqliteSchema.invoices.id, id),
          eq(sqliteSchema.invoices.contractor_id, contractorId)
        )
      )
      .returning();
    return updated;
  }
  
  // Método público para actualizar una factura por ID - Solo ciertos campos permitidos
  // Este método es usado para el portal del cliente, donde no se autentica como contratista
  async updateInvoiceById(id: number, data: any) {
    try {
      // Primero obtenemos la factura para verificar que existe
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoicesTable.id, id)
      });
      
      if (!invoice) {
        return null;
      }
      
      // Solo permitimos actualizar campos específicos para el cliente
      const allowedFields: any = {};
      
      // Campos permitidos para actualización pública
      if (data.status) allowedFields.status = data.status;
      if (data.clientSignature) allowedFields.clientSignature = data.clientSignature;
      if (data.notes) allowedFields.notes = data.notes;
      
      // Actualizamos solo los campos permitidos
      const [updated] = await db
        .update(invoicesTable)
        .set(allowedFields)
        .where(eq(invoicesTable.id, id))
        .returning();
        
      return updated;
    } catch (error) {
      console.error("Error en updateInvoiceById:", error);
      return null;
    }
  }

  async deleteInvoice(id: number, contractorId: number) {
    try {
      // Verify the invoice belongs to the contractor
      const invoiceCheck = await db.query.invoices.findFirst({
        where: and(
          eq(sqliteSchema.invoices.id, id),
          eq(sqliteSchema.invoices.contractor_id, contractorId)
        )
      });
      
      if (!invoiceCheck) {
        return false;
      }
      
      const [deleted] = await db
        .delete(sqliteSchema.invoices)
        .where(
          and(
            eq(sqliteSchema.invoices.id, id),
            eq(sqliteSchema.invoices.contractor_id, contractorId)
          )
        )
        .returning();
      return !!deleted;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  // Invoice Item methods
  async getInvoiceItems(invoiceId: number, contractorId: number) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(sqliteSchema.invoices.id, invoiceId),
        eq(sqliteSchema.invoices.contractor_id, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return [];
    }
    
    return await db.query.invoiceItems.findMany({
      where: eq(sqliteSchema.invoice_items.invoice_id, invoiceId)
    });
  }
  
  // Método para obtener items de factura por ID verificando primero que la factura pertenece al contratista
  async getInvoiceItemsById(invoiceId: number, contractorId?: number) {
    if (contractorId) {
      // First verify the invoice belongs to the contractor
      const invoiceCheck = await db.query.invoices.findFirst({
        where: and(
          eq(sqliteSchema.invoices.id, invoiceId),
          eq(sqliteSchema.invoices.contractor_id, contractorId)
        )
      });
      if (!invoiceCheck) {
        return [];
      }
    }
    return await db.query.invoiceItems.findMany({
      where: eq(sqliteSchema.invoice_items.invoice_id, invoiceId)
    });
  }

  async createInvoiceItem(data: any) {
    const [item] = await db.insert(invoiceItems).values(data).returning();
    return item;
  }

  async updateInvoiceItem(id: number, invoiceId: number, contractorId: number, data: any) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(invoicesTable.id, invoiceId),
        eq(invoicesTable.contractorId, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return null;
    }
    
    const [updated] = await db
      .update(invoiceItems)
      .set(data)
      .where(
        and(
          eq(invoiceItems.id, id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      )
      .returning();
    return updated;
  }

  async deleteInvoiceItem(id: number, invoiceId: number, contractorId: number) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(invoicesTable.id, invoiceId),
        eq(invoicesTable.contractorId, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return false;
    }
    
    const result = await db
      .delete(invoiceItems)
      .where(
        and(
          eq(invoiceItems.id, id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      );
    return result.rowCount > 0;
  }

  // Events methods
  async getEvents(contractorId: number) {
    const events = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.contractor_id, contractorId))
      .orderBy(desc(eventsTable.created_at));
    
    // Map database fields to frontend expected format
    return events.map(event => ({
      id: event.id,
      contractorId: event.contractor_id,
      title: event.title,
      description: event.description,
      startTime: event.start_time,
      endTime: event.end_time,
      address: event.address,
      city: event.city,
      state: event.state,
      zip: event.zip,
      type: event.type,
      status: event.status,
      clientId: event.client_id,
      projectId: event.project_id,
      agentId: event.agent_id,
      notes: event.notes,
      createdAt: event.created_at
    }));
  }

  async getEvent(id: number, contractorId: number) {
    const results = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.contractor_id, contractorId)));
    
    if (!results[0]) return null;
    
    const event = results[0];
    // Map database fields to frontend expected format
    return {
      id: event.id,
      contractorId: event.contractor_id,
      title: event.title,
      description: event.description,
      startTime: event.start_time,
      endTime: event.end_time,
      address: event.address,
      city: event.city,
      state: event.state,
      zip: event.zip,
      type: event.type,
      status: event.status,
      clientId: event.client_id,
      projectId: event.project_id,
      agentId: event.agent_id,
      notes: event.notes,
      createdAt: event.created_at
    };
  }

  async createEvent(data: any) {
    const [event] = await db.insert(eventsTable).values(data).returning();
    return event;
  }

  async updateEvent(id: number, contractorId: number, data: any) {
    const [event] = await db
      .update(eventsTable)
      .set(data)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.contractor_id, contractorId)))
      .returning();
    return event;
  }

  async deleteEvent(id: number, contractorId: number) {
    const result = await db
      .delete(eventsTable)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.contractor_id, contractorId)));
    return result.rowCount > 0;
  }

  // Agents
  async getAgents(contractorId: number) {
    return await db.query.agents.findMany({
      where: eq(agentsTable.contractor_id, contractorId)
    });
  }

  async getAgent(id: number, contractorId: number) {
    return await db.query.agents.findFirst({
      where: and(
        eq(agentsTable.id, id),
        eq(agentsTable.contractor_id, contractorId)
      )
    });
  }

  async createAgent(data: any) {
    const [agent] = await db.insert(agentsTable).values(data).returning();
    return agent;
  }

  async updateAgent(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(agentsTable)
      .set(data)
      .where(
        and(
          eq(agentsTable.id, id),
          eq(agentsTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteAgent(id: number, contractorId: number) {
    const result = await db
      .delete(agentsTable)
      .where(
        and(
          eq(agentsTable.id, id),
          eq(agentsTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }

  // Materials methods
  async getMaterials(contractorId: number) {
    return await db.query.materials.findMany({
      where: eq(materialsTable.contractorId, contractorId),
      orderBy: asc(materialsTable.name),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async getMaterial(id: number, contractorId: number) {
    return await db.query.materials.findFirst({
      where: and(
        eq(materialsTable.id, id),
        eq(materialsTable.contractorId, contractorId)
      ),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async createMaterial(data: any) {
    const [material] = await db.insert(materialsTable).values(data).returning();
    return material;
  }

  async updateMaterial(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(materialsTable)
      .set(data)
      .where(
        and(
          eq(materialsTable.id, id),
          eq(materialsTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteMaterial(id: number, contractorId: number) {
    const result = await db
      .delete(materialsTable)
      .where(
        and(
          eq(materialsTable.id, id),
          eq(materialsTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }

  // Attachments
  async getAttachments(contractorId: number, entityType: string, entityId: number) {
    return await db.query.attachments.findMany({
      where: and(
        eq(attachments.contractorId, contractorId),
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId)
      ),
      orderBy: desc(attachments.uploadedAt)
    });
  }

  async createAttachment(data: any) {
    const [attachment] = await db.insert(attachments).values(data).returning();
    return attachment;
  }

  async deleteAttachment(id: number, contractorId: number) {
    const result = await db
      .delete(attachments)
      .where(
        and(
          eq(attachments.id, id),
          eq(attachments.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }

  // Follow-up methods
  async getFollowUps(contractorId: number) {
    return await db.query.followUps.findMany({
      where: eq(followUpsTable.contractorId, contractorId),
      orderBy: asc(followUpsTable.scheduledDate),
      with: {
        client: true
      }
    });
  }

  async createFollowUp(data: any) {
    const [followUp] = await db.insert(followUpsTable).values(data).returning();
    return followUp;
  }

  async updateFollowUp(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(followUpsTable)
      .set(data)
      .where(
        and(
          eq(followUpsTable.id, id),
          eq(followUpsTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteFollowUp(id: number, contractorId: number) {
    const result = await db
      .delete(followUpsTable)
      .where(
        and(
          eq(followUpsTable.id, id),
          eq(followUpsTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }
  
  // Property Measurements methods
  async getPropertyMeasurements(contractorId: number) {
    return await db.query.propertyMeasurements.findMany({
      where: eq(propertyMeasurementsTable.contractorId, contractorId),
      orderBy: desc(propertyMeasurementsTable.createdAt),
      with: {
        client: true,
        project: true
      }
    });
  }

  async getPropertyMeasurement(id: number, contractorId: number) {
    return await db.query.propertyMeasurements.findFirst({
      where: and(
        eq(propertyMeasurementsTable.id, id),
        eq(propertyMeasurementsTable.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: true
      }
    });
  }

  async createPropertyMeasurement(data: any) {
    const [measurement] = await db.insert(propertyMeasurementsTable).values(data).returning();
    return measurement;
  }

  async updatePropertyMeasurement(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(propertyMeasurementsTable)
      .set(data)
      .where(
        and(
          eq(propertyMeasurementsTable.id, id),
          eq(propertyMeasurementsTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deletePropertyMeasurement(id: number, contractorId: number) {
    const result = await db
      .delete(propertyMeasurementsTable)
      .where(
        and(
          eq(propertyMeasurementsTable.id, id),
          eq(propertyMeasurementsTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }
  
  // Price Configurations methods
  async getPriceConfigurations(contractorId: number) {
    if (isLocalDev) {
      // SQLite schema - use available fields
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      return await db.query.priceConfigurations.findMany({
        where: eq(sqliteTable.contractorId, contractorId),
        orderBy: [
          asc(sqliteTable.name)
        ]
      });
    } else {
      // PostgreSQL schema - use original fields
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      return await db.query.priceConfigurations.findMany({
        where: eq(pgTable.contractorId, contractorId),
        orderBy: [
          asc(pgTable.serviceType),
          desc(pgTable.isDefault),
          asc(pgTable.configName)
        ]
      });
    }
  }

  async getPriceConfiguration(id: number, contractorId: number) {
    return await db.query.priceConfigurations.findFirst({
      where: and(
        eq(priceConfigurationsTable.id, id),
        eq(priceConfigurationsTable.contractorId, contractorId)
      )
    });
  }

  async getPriceConfigurationsByService(contractorId: number, serviceType: string) {
    if (isLocalDev) {
      // SQLite schema - filter by name containing service type
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      return await db.query.priceConfigurations.findMany({
        where: and(
          eq(sqliteTable.contractorId, contractorId),
          like(sqliteTable.name, `%${serviceType}%`)
        ),
        orderBy: [
          asc(sqliteTable.name)
        ]
      });
    } else {
      // PostgreSQL schema - use serviceType field
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      return await db.query.priceConfigurations.findMany({
        where: and(
          eq(pgTable.contractorId, contractorId),
          eq(pgTable.serviceType, serviceType)
        ),
        orderBy: [
          desc(pgTable.isDefault),
          asc(pgTable.configName)
        ]
      });
    }
  }

  async getDefaultPriceConfiguration(contractorId: number, serviceType: string) {
    if (isLocalDev) {
      // SQLite schema - look for active configurations with service type in name
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      return await db.query.priceConfigurations.findFirst({
        where: and(
          eq(sqliteTable.contractorId, contractorId),
          eq(sqliteTable.isActive, true),
          like(sqliteTable.name, `%${serviceType}%`)
        )
      });
    } else {
      // PostgreSQL schema - use isDefault field
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      return await db.query.priceConfigurations.findFirst({
        where: and(
          eq(pgTable.contractorId, contractorId),
          eq(pgTable.serviceType, serviceType),
          eq(pgTable.isDefault, true)
        )
      });
    }
  }

  async createPriceConfiguration(data: any) {
    if (isLocalDev) {
      // SQLite schema - adapt data to match SQLite fields
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      const sqliteData = {
        contractorId: data.contractorId,
        name: data.configName || data.serviceType || 'Default Configuration',
        configuration: JSON.stringify(data),
        isActive: true,
        createdAt: Date.now()
      };
      const [config] = await db.insert(sqliteTable).values(sqliteData).returning();
      return config;
    } else {
      // PostgreSQL schema - use original fields
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      
      // Si esta configuración se marca como predeterminada, primero asegúrese de que ninguna otra configuración para el mismo servicio sea predeterminada
      if (data.isDefault) {
        await db.update(pgTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(pgTable.contractorId, data.contractorId),
              eq(pgTable.serviceType, data.serviceType),
              eq(pgTable.isDefault, true)
            )
          );
      }
      
      const [config] = await db.insert(pgTable).values(data).returning();
      return config;
    }
  }

  async updatePriceConfiguration(id: number, contractorId: number, data: any) {
    if (isLocalDev) {
      // SQLite schema - adapt data to match SQLite fields
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      const sqliteData = {
        name: data.configName || data.serviceType || 'Updated Configuration',
        configuration: JSON.stringify(data),
        isActive: data.isActive !== undefined ? data.isActive : true
      };
      
      const [updated] = await db
        .update(sqliteTable)
        .set(sqliteData)
        .where(
          and(
            eq(sqliteTable.id, id),
            eq(sqliteTable.contractorId, contractorId)
          )
        )
        .returning();
      return updated;
    } else {
      // PostgreSQL schema - use original fields
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      
      // Si esta configuración se marca como predeterminada, primero asegúrese de que ninguna otra configuración para el mismo servicio sea predeterminada
      if (data.isDefault) {
        const currentConfig = await this.getPriceConfiguration(id, contractorId);
        if (currentConfig) {
          await db.update(pgTable)
            .set({ isDefault: false })
            .where(
              and(
                eq(pgTable.contractorId, contractorId),
                eq(pgTable.serviceType, currentConfig.serviceType),
                eq(pgTable.isDefault, true),
                sql`${pgTable.id} != ${id}`
              )
            );
        }
      }
      
      const [updated] = await db
        .update(pgTable)
        .set(data)
        .where(
          and(
            eq(pgTable.id, id),
            eq(pgTable.contractorId, contractorId)
          )
        )
        .returning();
      return updated;
    }
  }

  async deletePriceConfiguration(id: number, contractorId: number) {
    const result = await db
      .delete(priceConfigurationsTable)
      .where(
        and(
          eq(priceConfigurationsTable.id, id),
          eq(priceConfigurationsTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }

  async setDefaultPriceConfiguration(id: number, contractorId: number, serviceType: string) {
    if (isLocalDev) {
      // SQLite schema - update the configuration to mark as default
      const sqliteTable = priceConfigurationsTable as typeof sqliteSchema.priceConfigurations;
      const config = await this.getPriceConfiguration(id, contractorId);
      if (config) {
        const configData = JSON.parse(config.configuration);
        configData.isDefault = true;
        
        const [updated] = await db
          .update(sqliteTable)
          .set({ 
            configuration: JSON.stringify(configData),
            isActive: true
          })
          .where(
            and(
              eq(sqliteTable.id, id),
              eq(sqliteTable.contractorId, contractorId)
            )
          )
          .returning();
        return updated;
      }
      return null;
    } else {
      // PostgreSQL schema - use isDefault field
      const pgTable = priceConfigurationsTable as typeof priceConfigurations;
      
      // Primero, eliminar el predeterminado actual
      await db.update(pgTable)
        .set({ isDefault: false })
        .where(
          and(
            eq(pgTable.contractorId, contractorId),
            eq(pgTable.serviceType, serviceType),
            eq(pgTable.isDefault, true)
          )
        );
      
      // Luego, establecer el nuevo predeterminado
      const [updated] = await db
        .update(pgTable)
        .set({ isDefault: true })
        .where(
          and(
            eq(pgTable.id, id),
            eq(pgTable.contractorId, contractorId)
          )
        )
        .returning();
      return updated;
    }
  }

  // Subscription Management Methods
  async getAllSubscriptionPlans() {
    // Return hardcoded plan definitions since we're using static plans
    return [
      {
        id: 1,
        planName: 'basic',
        displayName: 'Basic Plan',
        priceMonthly: '29.00',
        clientLimit: 10,
        aiUsageLimit: 0,
        hasTimeClockAccess: false,
        hasStripeIntegration: false,
        hasCustomPortal: false,
        hasBrandedPortal: false,
        features: ['Client Management', 'Basic Estimates', 'Project Tracking'],
        isActive: true
      },
      {
        id: 2,
        planName: 'pro',
        displayName: 'Pro Plan',
        priceMonthly: '59.00',
        clientLimit: 50,
        aiUsageLimit: 10,
        hasTimeClockAccess: true,
        hasStripeIntegration: false,
        hasCustomPortal: true,
        hasBrandedPortal: false,
        features: ['Everything in Basic', 'AI Cost Analysis', 'Time Clock', 'Advanced Reports'],
        isActive: true
      },
      {
        id: 3,
        planName: 'business',
        displayName: 'Business Plan',
        priceMonthly: '99.00',
        clientLimit: null,
        aiUsageLimit: null,
        hasTimeClockAccess: true,
        hasStripeIntegration: true,
        hasCustomPortal: true,
        hasBrandedPortal: true,
        features: ['Everything in Pro', 'Unlimited Clients', 'Unlimited AI', 'Stripe Integration', 'Branded Portal'],
        isActive: true
      }
    ];
  }

  async getClientsByContractor(contractorId: number) {
    return await db.query.clients.findMany({
      where: eq(sqliteSchema.clients.contractor_id, contractorId)
    });
  }

  async getClientCountByContractor(contractorId: number) {
    const clientList = await this.getClientsByContractor(contractorId);
    return clientList.length;
  }

  async getAiUsageCount(contractorId: number, month: string) {
    // For now, return 0 since AI usage tracking is being implemented
    return 0;
  }

  async updateContractorSubscription(contractorId: number, subscriptionData: any) {
    const [updated] = await db
      .update(contractorsTable)
      .set({
        plan: subscriptionData.plan,
        subscriptionStatus: subscriptionData.status,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        planStartDate: subscriptionData.planStartDate,
        planEndDate: subscriptionData.planEndDate,
        updatedAt: new Date()
      })
      .where(eq(contractorsTable.id, contractorId))
      .returning();
    return updated;
  }

  // Client Messages implementation
  async getClientMessages(contractorId: number) {
    if (isLocalDev) {
      // SQLite schema - use sentAt instead of createdAt
      const sqliteTable = clientMessagesTable as typeof sqliteSchema.clientMessages;
      return await db.query.clientMessages.findMany({
        where: eq(sqliteTable.contractorId, contractorId),
        with: {
          client: true
        },
        orderBy: desc(sqliteTable.sentAt)
      });
    } else {
      // PostgreSQL schema - use createdAt
      const pgTable = clientMessagesTable as typeof clientMessages;
      return await db.query.clientMessages.findMany({
        where: eq(pgTable.contractorId, contractorId),
        with: {
          client: true
        },
        orderBy: desc(pgTable.createdAt)
      });
    }
  }

  async getClientMessage(id: number, contractorId: number) {
    return await db.query.clientMessages.findFirst({
      where: and(
        eq(clientMessagesTable.id, id),
        eq(clientMessagesTable.contractorId, contractorId)
      ),
      with: {
        client: true
      }
    });
  }

  async createClientMessage(data: any) {
    const [message] = await db.insert(clientMessagesTable).values(data).returning();
    return message;
  }

  async updateClientMessage(id: number, contractorId: number, data: any) {
    const [updated] = await db
      .update(clientMessagesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(clientMessagesTable.id, id),
          eq(clientMessagesTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async markMessageAsRead(id: number, contractorId: number) {
    const [updated] = await db
      .update(clientMessagesTable)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(clientMessagesTable.id, id),
          eq(clientMessagesTable.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteClientMessage(id: number, contractorId: number) {
    const result = await db
      .delete(clientMessagesTable)
      .where(
        and(
          eq(clientMessagesTable.id, id),
          eq(clientMessagesTable.contractorId, contractorId)
        )
      );
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
