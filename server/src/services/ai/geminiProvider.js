import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';
import { AIDraftResponseSchema } from './schemas.js';
import { executeToolCall } from '../tools.js';

export class GeminiAIProvider {
  constructor(apiKey) {
    this.name = 'AI_GEMINI';
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });
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

    const systemPrompt = `You are Noise Resolve AI, a senior customer resolution assistant for Noise wearable devices.
Generate a grounded response adhering to these exact requirements:
1. Ground every claim on the provided customer, order, and policy records. Never invent facts or dates.
2. Produce separate fields for:
   - ticketSummary: Concise summary of customer issue
   - category: One of DELIVERY_DELAY, REFUND_REQUEST, RETURN_REQUEST, WARRANTY_CLAIM, DAMAGED_PRODUCT, BATTERY_CHARGING, BLUETOOTH_PAIRING, GENERAL_INQUIRY, MALICIOUS_INJECTION
   - customerIntent: The detected primary customer request
   - identifiedOrderOrDevice: The identified order number or product
   - missingInformation: Array of missing requirements
   - draftReply: Concise, professional customer-facing response
   - internalNextAction: Specific action instructions for the support agent
   - evidence: Grounded citations with sourceId, sourceTitle, excerpt, relevanceScore, explanation
   - escalationFlag: boolean indicating if safety hazard or contradiction requires escalation
   - escalationReason: string explanation if escalated, else null
   - requiresHumanReview: true
   - priority: LOW, MEDIUM, HIGH, URGENT
   - recommendedAction: string
   - confidence: float 0.0-1.0
   - policyFlags: string array`;

    const prompt = `TOOL CALLS EXECUTED:
${JSON.stringify(toolCallRecords, null, 2)}

RULE EVALUATION:
${JSON.stringify(ruleEvaluation, null, 2)}

CUSTOMER TICKET:
Ticket #${ticket.ticketNumber} - ${ticket.subject}
Messages:
${(ticket.messages || []).map(m => `[${m.senderType}]: ${m.messageText}`).join('\n')}

Generate the complete JSON draft matching the required schema.`;

    try {
      const response = await this.model.generateContent([
        { text: systemPrompt },
        { text: prompt }
      ]);

      const text = response.response.text();
      const parsed = JSON.parse(text);
      parsed.toolCalls = toolCallRecords;
      const validated = AIDraftResponseSchema.parse(parsed);
      return validated;
    } catch (err) {
      logger.error('Gemini draft generation error:', err);
      throw err;
    }
  }
}
