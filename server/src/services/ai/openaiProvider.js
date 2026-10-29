import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';
import { AIDraftResponseSchema } from './schemas.js';
import { executeToolCall } from '../tools.js';

export class OpenAIProvider {
  constructor(apiKey) {
    this.name = 'AI_OPENAI';
    this.client = new OpenAI({ apiKey });
  }

  async generateResolutionDraft(pipelineContext) {
    const { ticket, customer, order, product, retrievedPolicies, ruleEvaluation } = pipelineContext;

    // Execute tool calling workflow
    const toolCallRecords = [];
    toolCallRecords.push(await executeToolCall('get_ticket_history', { ticket_id: ticket.ticketNumber || ticket.id }));
    if (order?.orderNumber || ruleEvaluation.extractedOrderNumber) {
      toolCallRecords.push(await executeToolCall('lookup_order', { order_id: order?.orderNumber || ruleEvaluation.extractedOrderNumber }));
    }
    toolCallRecords.push(await executeToolCall('search_support_policy', { query: `${ticket.category} ${ticket.subject}` }));

    const systemPrompt = `You are Noise Resolve AI, a customer support resolution copilot for Noise.
Return a structured JSON object with separate fields for:
- ticketSummary (string)
- category (DELIVERY_DELAY | REFUND_REQUEST | RETURN_REQUEST | WARRANTY_CLAIM | DAMAGED_PRODUCT | BATTERY_CHARGING | BLUETOOTH_PAIRING | GENERAL_INQUIRY | MALICIOUS_INJECTION)
- customerIntent (string)
- identifiedOrderOrDevice (string or null)
- missingInformation (string array)
- draftReply (concise, professional customer-facing response)
- internalNextAction (internal instructions for the support specialist)
- evidence (array of { sourceType, sourceId, sourceTitle, excerpt, relevanceScore, explanation })
- escalationFlag (boolean)
- escalationReason (string or null)
- requiresHumanReview (true)
- priority (LOW | MEDIUM | HIGH | URGENT)
- recommendedAction (string)
- confidence (number 0.0-1.0)
- policyFlags (string array)`;

    const userPrompt = `TOOL CALLS RESULTS:
${JSON.stringify(toolCallRecords, null, 2)}

RULE EVALUATION:
${JSON.stringify(ruleEvaluation, null, 2)}

TICKET:
Ticket #${ticket.ticketNumber} - ${ticket.subject}
Messages:
${(ticket.messages || []).map(m => `[${m.senderType}]: ${m.messageText}`).join('\n')}`;

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
      parsed.toolCalls = toolCallRecords;
      const validated = AIDraftResponseSchema.parse(parsed);
      return validated;
    } catch (err) {
      logger.error('OpenAI draft generation error:', err);
      throw err;
    }
  }
}
