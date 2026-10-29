import { GeminiAIProvider } from '../src/services/ai/geminiProvider.js';
import { config } from '../src/config/index.js';

describe('Live Gemini API Integration Check', () => {
  const hasKey = Boolean(config.geminiApiKey && config.geminiApiKey.trim());

  (hasKey ? test : test.skip)('attempts live call to gemini-3.8-flash and verifies response or clear demand error', async () => {
    const provider = new GeminiAIProvider(config.geminiApiKey, 'gemini-3.8-flash');
    expect(provider.modelName).toBe('gemini-3.8-flash');

    const context = {
      ticket: {
        ticketNumber: 'TCK-2026-1001',
        subject: 'Smartwatch battery draining fast',
        category: 'BATTERY_CHARGING',
        messages: [{ senderType: 'CUSTOMER', messageText: 'Battery drops to zero in 6 hours.' }]
      },
      customer: { name: 'Priya Patel', email: 'priya.patel@example.com' },
      order: {
        orderNumber: 'NOISE-ORD-90212',
        orderStatus: 'DELIVERED',
        purchaseDate: new Date('2026-10-01')
      },
      product: { name: 'Noise ColorFit Pro 5' },
      retrievedPolicies: [],
      ruleEvaluation: { detectedCategory: 'BATTERY_CHARGING', isAuthorized: true }
    };

    try {
      const result = await provider.generateResolutionDraft(context);
      expect(result).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.draftReply).toBeDefined();
      expect(result.internalNextAction).toBeDefined();
      expect(result.evidence.length).toBeGreaterThan(0);
      console.log('Live Gemini call succeeded with output summary:', result.ticketSummary);
    } catch (err) {
      console.log('Live Gemini call returned error:', err.message);
      // Verify secrets and PII were not exposed in error message
      expect(err.message).not.toContain(config.geminiApiKey);
      expect(err.message).not.toContain('priya.patel@example.com');
      // Verify error specifies model name
      expect(err.message).toContain('gemini-3.8-flash');
    }
  }, 35000);
});
