import { AIDraftResponseSchema } from '../src/services/ai/schemas.js';
import { MockAIProvider } from '../src/services/ai/mockProvider.js';
import { GeminiAIProvider } from '../src/services/ai/geminiProvider.js';
import { AIProviderFactory } from '../src/services/ai/aiProvider.js';
import { AIPipelineService } from '../src/services/aiPipelineService.js';
import { PrismaClient } from '@prisma/client';
import { config } from '../src/config/index.js';
import { jest } from '@jest/globals';

const prisma = new PrismaClient();

describe('AI Output Schema & Mock Provider Validation', () => {
  const mockProvider = new MockAIProvider();

  test('validates valid draft JSON against Zod schema', () => {
    const validDraft = {
      ticketSummary: 'Customer inquiring about battery depletion',
      category: 'BATTERY_CHARGING',
      priority: 'MEDIUM',
      recommendedAction: 'PROVIDE_BATTERY_TROUBLESHOOTING',
      draftReply: 'Dear Customer,\n\nPlease follow the troubleshooting guidelines by using a 5V/1A adapter and resetting device.',
      internalNextAction: 'Review customer response regarding 5V/1A adapter charging test and verify warranty status.',
      confidence: 0.92,
      requiresHumanReview: true,
      missingInformation: [],
      evidence: [
        {
          sourceType: 'POLICY',
          sourceId: 'KB-BAT-01',
          sourceTitle: 'Battery Troubleshooting Guide',
          excerpt: 'Use 5V/1A adapter',
          relevanceScore: 0.95,
          explanation: 'Standard adapter prevents thermal trips'
        }
      ],
      policyFlags: []
    };

    const parsed = AIDraftResponseSchema.safeParse(validDraft);
    expect(parsed.success).toBe(true);
  });

  test('rejects draft with missing evidence grounding', () => {
    const invalidDraft = {
      ticketSummary: 'Customer inquiry',
      category: 'GENERAL_INQUIRY',
      priority: 'LOW',
      recommendedAction: 'NONE',
      draftReply: 'Hello, here is a reply without any evidence.',
      confidence: 0.5,
      requiresHumanReview: true,
      missingInformation: [],
      evidence: [] // Violates min(1) evidence requirement!
    };

    const parsed = AIDraftResponseSchema.safeParse(invalidDraft);
    expect(parsed.success).toBe(false);
  });

  test('MockAIProvider returns schema-compliant output for delivery delay', async () => {
    const context = {
      ticket: {
        ticketNumber: 'TCK-2026-1001',
        subject: 'Where is my order?',
        category: 'DELIVERY_DELAY'
      },
      customer: { name: 'Priya Patel' },
      order: {
        orderNumber: 'NOISE-ORD-90212',
        orderStatus: 'IN_TRANSIT',
        carrier: 'BlueDart',
        trackingNumber: 'BLU-88273612',
        purchaseDate: new Date('2026-10-23T12:00:00Z')
      },
      product: { name: 'Noise Buds VS104 Pro' },
      ruleEvaluation: {
        detectedCategory: 'DELIVERY_DELAY',
        hasOrder: true,
        flags: [],
        missingInformation: []
      }
    };

    const result = await mockProvider.generateResolutionDraft(context);
    const parsed = AIDraftResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    expect(result.category).toBe('DELIVERY_DELAY');
    expect(result.recommendedAction).toBe('ESCALATE_COURIER_SLA');
    expect(result.requiresHumanReview).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  describe('GeminiAIProvider Configuration & Error Sanitization', () => {
    test('GeminiAIProvider initializes with gemini-3.8-flash model by default', () => {
      const provider = new GeminiAIProvider('fake-test-key');
      expect(provider.name).toBe('AI_GEMINI');
      expect(provider.modelName).toBe('gemini-3.8-flash');
    });

    test('GeminiAIProvider accepts custom model override', () => {
      const provider = new GeminiAIProvider('fake-test-key', 'gemini-3.8-flash-preview');
      expect(provider.modelName).toBe('gemini-3.8-flash-preview');
    });

    test('GeminiAIProvider redacts secrets and PII from error logs and exceptions', async () => {
      const provider = new GeminiAIProvider('fake-test-key');
      provider.model.generateContent = jest.fn().mockRejectedValue(
        new Error('Request failed with status 400 at https://generativelanguage.googleapis.com?key=AIzaSyFakeKeySecret123 for customer priya.patel@example.com phone 9876543210')
      );

      const context = {
        ticket: { ticketNumber: 'TCK-2026-1001', subject: 'Charging defect', category: 'BATTERY_CHARGING', messages: [] },
        customer: { name: 'Priya Patel', email: 'priya.patel@example.com' },
        order: null,
        product: null,
        retrievedPolicies: [],
        ruleEvaluation: {}
      };

      try {
        await provider.generateResolutionDraft(context);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.message).not.toContain('AIzaSyFakeKeySecret123');
        expect(err.message).not.toContain('priya.patel@example.com');
        expect(err.message).not.toContain('9876543210');
        expect(err.message).toContain('[REDACTED]');
        expect(err.message).toContain('[REDACTED_EMAIL]');
        expect(err.message).toContain('[REDACTED_PHONE]');
      }
    });

    test('AIProviderFactory selects GeminiAIProvider when configured', () => {
      const originalProvider = config.aiProvider;
      const originalKey = config.geminiApiKey;

      config.aiProvider = 'gemini';
      config.geminiApiKey = 'test-gemini-key';

      const provider = AIProviderFactory.getProvider();
      expect(provider.name).toBe('AI_GEMINI');
      expect(provider.modelName).toBe('gemini-3.8-flash');

      config.aiProvider = originalProvider;
      config.geminiApiKey = originalKey;
    });

    test('AIPipelineService throws without falling back to mock when AI_PROVIDER=gemini and generation fails', async () => {
      const originalProvider = config.aiProvider;
      config.aiProvider = 'gemini';

      const mockGemini = new GeminiAIProvider('fake-key');
      mockGemini.generateResolutionDraft = jest.fn().mockRejectedValue(
        new Error('Gemini API Error (gemini-3.8-flash): Service Unavailable 503 key=AIzaSecret123')
      );
      const spy = jest.spyOn(AIProviderFactory, 'getProvider').mockReturnValue(mockGemini);

      const ticket = await prisma.supportTicket.findFirst();
      expect(ticket).toBeTruthy();

      await expect(AIPipelineService.runPipeline(ticket.id, 'Test Evaluator'))
        .rejects
        .toThrow(/Live Gemini generation failed/);

      // Verify the ticket status transitioned to FAILED and NEEDS_REVIEW
      const updated = await prisma.supportTicket.findUnique({ where: { id: ticket.id } });
      expect(updated.aiStatus).toBe('FAILED');
      expect(updated.status).toBe('NEEDS_REVIEW');

      spy.mockRestore();
      config.aiProvider = originalProvider;
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
