import request from 'supertest';
import app from '../src/app.js';
import { PrismaClient } from '@prisma/client';
import { config } from '../src/config/index.js';

const prisma = new PrismaClient();

describe('End-to-End API Workflows & State Transitions', () => {
  let testTicketId;
  let originalAiProvider;

  beforeAll(async () => {
    originalAiProvider = config.aiProvider;
    // Ensure deterministic mock provider is active for fast, reliable API integration tests
    config.aiProvider = 'mock';

    // Find a ticket in NEW state from seeded database
    const ticket = await prisma.supportTicket.findFirst({
      where: { ticketNumber: 'TCK-2026-1001' }
    });
    if (ticket) {
      testTicketId = ticket.id;
    }
  });

  afterAll(async () => {
    config.aiProvider = originalAiProvider;
    await prisma.$disconnect();
  });

  test('GET /api/health returns healthy and database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });

  test('GET /api/dashboard/stats returns metrics and charts', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalTickets).toBeGreaterThan(0);
    expect(res.body.data.charts.byCategory).toBeInstanceOf(Array);
  });

  test('GET /api/tickets supports filtering and pagination', async () => {
    const res = await request(app).get('/api/tickets?status=NEW&page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tickets).toBeInstanceOf(Array);
    expect(res.body.data.pagination.page).toBe(1);
  });

  test('POST /api/tickets/:id/generate-draft runs AI pipeline and creates draft', async () => {
    expect(testTicketId).toBeDefined();

    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/generate-draft`)
      .send({ agentName: 'Test Evaluator' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.draft).toBeDefined();
    expect(res.body.data.draft.draftReply.length).toBeGreaterThan(20);
    expect(res.body.data.ticket.aiStatus).toBe('COMPLETED');
  });

  test('PATCH /api/tickets/:id/draft allows agent to edit draft reply', async () => {
    const customText = 'Dear Priya, This is an edited reply with updated courier contact numbers.';

    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/draft`)
      .send({
        editableReply: customText,
        agentName: 'Test Evaluator'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.editableReply).toBe(customText);
  });

  test('POST /api/tickets/:id/approve transitions state to APPROVED', async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/approve`)
      .send({ agentName: 'Senior Agent Priya' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.status).toBe('APPROVED');
    expect(res.body.data.draft.approvedBy).toBe('Senior Agent Priya');
  });

  test('POST /api/tickets/:id/resolve transitions state to RESOLVED', async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/resolve`)
      .send({ agentName: 'Senior Agent Priya', notes: 'Courier confirmed delivery' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');
  });

  test('Verifies AuditLog records were persisted', async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: { ticketId: testTicketId },
      orderBy: { timestamp: 'desc' }
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    const eventTypes = auditLogs.map(l => l.eventType);
    expect(eventTypes).toContain('DRAFT_GENERATED');
    expect(eventTypes).toContain('DRAFT_EDITED');
    expect(eventTypes).toContain('DRAFT_APPROVED');
    expect(eventTypes).toContain('TICKET_RESOLVED');
  });
});
