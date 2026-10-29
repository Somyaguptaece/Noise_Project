import { AIDraftResponseSchema } from '../src/services/ai/schemas.js';
import { MockAIProvider } from '../src/services/ai/mockProvider.js';

describe('AI Output Schema & Mock Provider Validation', () => {
  const mockProvider = new MockAIProvider();

  test('validates valid draft JSON against Zod schema', () => {
    const validDraft = {
      ticketSummary: 'Customer inquiring about battery depletion',
      category: 'BATTERY_CHARGING',
      priority: 'MEDIUM',
      recommendedAction: 'PROVIDE_BATTERY_TROUBLESHOOTING',
      draftReply: 'Dear Customer,\n\nPlease follow the troubleshooting guidelines by using a 5V/1A adapter and resetting device.',
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
});
