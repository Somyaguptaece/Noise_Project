import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';
import { AIDraftResponseSchema } from './schemas.js';

export class OpenAIProvider {
  constructor(apiKey) {
    this.name = 'AI_OPENAI';
    this.client = new OpenAI({ apiKey });
  }

  async generateResolutionDraft(pipelineContext) {
    const { ticket, customer, order, product, retrievedPolicies, ruleEvaluation } = pipelineContext;

    const systemPrompt = `You are Noise Resolve AI, a senior customer resolution assistant for Noise wearable devices.
Generate a grounded draft reply for human agent review. Never fabricate facts, orders, or policies.
Output valid JSON adhering to the specified format.`;

    const userPrompt = `CONTEXT:
Customer: ${JSON.stringify(customer)}
Order: ${JSON.stringify(order)}
Product: ${JSON.stringify(product)}
Rule Evaluation: ${JSON.stringify(ruleEvaluation)}
Retrieved Policy Excerpts: ${JSON.stringify(retrievedPolicies)}

TICKET:
Ticket #${ticket.ticketNumber}
Subject: ${ticket.subject}
Messages:
${(ticket.messages || []).map(m => `[${m.senderType}]: ${m.messageText}`).join('\n')}

Output JSON format:
{
  "ticketSummary": "...",
  "category": "...",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "recommendedAction": "...",
  "draftReply": "...",
  "confidence": 0.95,
  "requiresHumanReview": true,
  "missingInformation": [],
  "evidence": [{"sourceType": "POLICY|ORDER|CUSTOMER|PRODUCT|KNOWLEDGE_BASE", "sourceId": "...", "sourceTitle": "...", "excerpt": "...", "relevanceScore": 0.95, "explanation": "..."}],
  "policyFlags": []
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      const validated = AIDraftResponseSchema.parse(parsed);
      return validated;
    } catch (err) {
      logger.error('OpenAI draft generation error:', err);
      throw err;
    }
  }
}
