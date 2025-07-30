import { Router } from 'express';
import { db } from '../../db';
import { eq, or, like, ilike, and, desc, asc } from 'drizzle-orm';
import { clients, estimates, invoices, projects, events, materials, agents, payments, follow_ups, attachments } from '../../shared/schema-sqlite';

const router = Router();

// Enhanced global search endpoint with comprehensive search
router.get('/global', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.json({
        clients: [],
        estimates: [],
        invoices: [],
        projects: [],
        events: [],
        materials: [],
        agents: [],
        payments: [],
        followUps: []
      });
    }

    const searchTerm = `%${query}%`;

    // Enhanced client search - search across all client fields
    const clientResults = await db
      .select()
      .from(clients)
      .where(
        or(
          like(clients.first_name, searchTerm),
          like(clients.last_name, searchTerm),
          like(clients.email, searchTerm),
          like(clients.phone, searchTerm),
          like(clients.address, searchTerm),
          like(clients.city, searchTerm),
          like(clients.state, searchTerm),
          like(clients.zip, searchTerm),
          like(clients.notes, searchTerm)
        )
      )
      .orderBy(desc(clients.created_at))
      .limit(15);

    // Enhanced estimate search - search across all estimate fields and related data
    const estimateResults = await db
      .select()
      .from(estimates)
      .where(
        or(
          like(estimates.estimate_number, searchTerm),
          like(estimates.notes, searchTerm),
          like(estimates.terms, searchTerm),
          like(estimates.status, searchTerm)
        )
      )
      .orderBy(desc(estimates.created_at))
      .limit(15);

    // Enhanced invoice search
    const invoiceResults = await db
      .select()
      .from(invoices)
      .where(
        or(
          like(invoices.invoice_number, searchTerm),
          like(invoices.notes, searchTerm),
          like(invoices.terms, searchTerm),
          like(invoices.status, searchTerm)
        )
      )
      .orderBy(desc(invoices.created_at))
      .limit(15);

    // Enhanced project search
    const projectResults = await db
      .select()
      .from(projects)
      .where(
        or(
          like(projects.title, searchTerm),
          like(projects.description, searchTerm),
          like(projects.notes, searchTerm),
          like(projects.status, searchTerm),
          like(projects.service_type, searchTerm),
          like(projects.worker_instructions, searchTerm),
          like(projects.worker_notes, searchTerm),
          like(projects.safety_requirements, searchTerm),
          like(projects.ai_project_summary, searchTerm),
          like(projects.ai_generated_description, searchTerm)
        )
      )
      .orderBy(desc(projects.created_at))
      .limit(15);

    // Enhanced event search
    const eventResults = await db
      .select()
      .from(events)
      .where(
        or(
          like(events.title, searchTerm),
          like(events.description, searchTerm),
          like(events.notes, searchTerm),
          like(events.type, searchTerm),
          like(events.status, searchTerm),
          like(events.address, searchTerm),
          like(events.city, searchTerm),
          like(events.state, searchTerm),
          like(events.zip, searchTerm)
        )
      )
      .orderBy(desc(events.created_at))
      .limit(15);

    // Enhanced Materials search
    const materialResults = await db
      .select()
      .from(materials)
      .where(
        or(
          like(materials.name, searchTerm),
          like(materials.description, searchTerm),
          like(materials.unit, searchTerm)
        )
      )
      .orderBy(desc(materials.created_at))
      .limit(15);

    // Enhanced agent search
    const agentResults = await db
      .select()
      .from(agents)
      .where(
        or(
          like(agents.first_name, searchTerm),
          like(agents.last_name, searchTerm),
          like(agents.email, searchTerm),
          like(agents.phone, searchTerm),
          like(agents.employee_id, searchTerm),
          like(agents.role, searchTerm),
          like(agents.notes, searchTerm)
        )
      )
      .orderBy(desc(agents.created_at))
      .limit(15);

    // Search payments
    const paymentResults = await db
      .select()
      .from(payments)
      .where(
        or(
          like(payments.method, searchTerm),
          like(payments.notes, searchTerm)
        )
      )
      .orderBy(desc(payments.created_at))
      .limit(10);

    // Search follow-ups
    const followUpResults = await db
      .select()
      .from(follow_ups)
      .where(
        or(
          like(follow_ups.type, searchTerm),
          like(follow_ups.status, searchTerm),
          like(follow_ups.notes, searchTerm)
        )
      )
      .orderBy(desc(follow_ups.created_at))
      .limit(10);

    // Search attachments
    const attachmentResults = await db
      .select()
      .from(attachments)
      .where(
        or(
          like(attachments.file_name, searchTerm),
          like(attachments.file_type, searchTerm),
          like(attachments.related_type, searchTerm)
        )
      )
      .orderBy(desc(attachments.created_at))
      .limit(10);

    res.json({
      clients: clientResults,
      estimates: estimateResults,
      invoices: invoiceResults,
      projects: projectResults,
      events: eventResults,
      materials: materialResults,
      agents: agentResults,
      payments: paymentResults,
      followUps: followUpResults,
      attachments: attachmentResults
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Enhanced quick search endpoint for specific entity types
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { q: query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const searchTerm = `%${query}%`;

    switch (type) {
      case 'clients':
        const clientResults = await db
          .select()
          .from(clients)
          .where(
            or(
              like(clients.first_name, searchTerm),
              like(clients.last_name, searchTerm),
              like(clients.email, searchTerm),
              like(clients.phone, searchTerm),
              like(clients.address, searchTerm),
              like(clients.city, searchTerm),
              like(clients.state, searchTerm),
              like(clients.zip, searchTerm),
              like(clients.notes, searchTerm)
            )
          )
          .orderBy(desc(clients.created_at))
          .limit(25);
        res.json(clientResults);
        break;

      case 'estimates':
        const estimateResults = await db
          .select()
          .from(estimates)
          .where(
            or(
              like(estimates.estimate_number, searchTerm),
              like(estimates.notes, searchTerm),
              like(estimates.terms, searchTerm),
              like(estimates.status, searchTerm)
            )
          )
          .orderBy(desc(estimates.created_at))
          .limit(25);
        res.json(estimateResults);
        break;

      case 'invoices':
        const invoiceResults = await db
          .select()
          .from(invoices)
          .where(
            or(
              like(invoices.invoice_number, searchTerm),
              like(invoices.notes, searchTerm),
              like(invoices.terms, searchTerm),
              like(invoices.status, searchTerm)
            )
          )
          .orderBy(desc(invoices.created_at))
          .limit(25);
        res.json(invoiceResults);
        break;

      case 'projects':
        const projectResults = await db
          .select()
          .from(projects)
          .where(
            or(
              like(projects.title, searchTerm),
              like(projects.description, searchTerm),
              like(projects.notes, searchTerm),
              like(projects.status, searchTerm),
              like(projects.service_type, searchTerm),
              like(projects.worker_instructions, searchTerm),
              like(projects.worker_notes, searchTerm),
              like(projects.safety_requirements, searchTerm),
              like(projects.ai_project_summary, searchTerm),
              like(projects.ai_generated_description, searchTerm)
            )
          )
          .orderBy(desc(projects.created_at))
          .limit(25);
        res.json(projectResults);
        break;

      case 'events':
        const eventResults = await db
          .select()
          .from(events)
          .where(
            or(
              like(events.title, searchTerm),
              like(events.description, searchTerm),
              like(events.notes, searchTerm),
              like(events.type, searchTerm),
              like(events.status, searchTerm),
              like(events.address, searchTerm),
              like(events.city, searchTerm),
              like(events.state, searchTerm),
              like(events.zip, searchTerm)
            )
          )
          .orderBy(desc(events.created_at))
          .limit(25);
        res.json(eventResults);
        break;

      case 'materials':
        const materialResults = await db
          .select()
          .from(materials)
          .where(
            or(
              like(materials.name, searchTerm),
              like(materials.description, searchTerm),
              like(materials.unit, searchTerm)
            )
          )
          .orderBy(desc(materials.created_at))
          .limit(25);
        res.json(materialResults);
        break;

      case 'agents':
        const agentResults = await db
          .select()
          .from(agents)
          .where(
            or(
              like(agents.first_name, searchTerm),
              like(agents.last_name, searchTerm),
              like(agents.email, searchTerm),
              like(agents.phone, searchTerm),
              like(agents.employee_id, searchTerm),
              like(agents.role, searchTerm),
              like(agents.notes, searchTerm)
            )
          )
          .orderBy(desc(agents.created_at))
          .limit(25);
        res.json(agentResults);
        break;

      default:
        res.status(400).json({ error: 'Invalid search type' });
    }

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router; 