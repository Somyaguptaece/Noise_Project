import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';
import { AIDraftResponseSchema } from './schemas.js';
import { executeToolCall } from '../tools.js';

export function isTransientError(err) {
  if (!err) return false;
  const status = err.status || (err.response && err.response.status);
  if ([429, 500, 502, 503, 504].includes(status)) return true;

  const msg = (err.message || String(err)).toLowerCase();
  if (/\b(429|500|502|503|504)\b/.test(msg)) return true;
  if (msg.includes('high demand') || msg.includes('spikes in demand') || msg.includes('temporarily unavailable')) return true;
  if (msg.includes('aborted') || msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('etimedout')) return true;
  if (err.name === 'AbortError') return true;

  return false;
}

export function sanitizeError(err) {
  const rawMessage = (err && (err.message || String(err))) || 'Unknown upstream error';
  return rawMessage
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, '[REDACTED_EMAIL]')
    .replace(/\b\d{10}\b/g, '[REDACTED_PHONE]');
}

export function calculateBackoffDelay(attempt, baseDelayMs = 1500, maxDelayMs = 8000, jitterMs = 800) {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * jitterMs;
  return Math.min(maxDelayMs, exponential + jitter);
}

export class GeminiAIProvider {
  constructor(apiKey, modelName, options = {}) {
    this.name = 'AI_GEMINI';
    this.apiKey = apiKey;
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.timeoutMs = options.timeoutMs || parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 20000;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : (parseInt(process.env.GEMINI_MAX_RETRIES, 10) || 2);
    this.baseDelayMs = options.baseDelayMs || 1500;
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel(
      {
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      },
      { timeout: this.timeoutMs }
    );
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
   - policyFlags: string array

CRITICAL CATEGORY CLASSIFICATION RULES:
- A complaint about missing sleep data, sleep stage tracking, sleep scores, or app synchronization MUST be classified under BLUETOOTH_PAIRING (health metrics sync), NOT DELIVERY_DELAY, unless the customer explicitly reports a shipping, courier, or parcel delivery failure.
- Never classify sleep tracking inquiries or health sync issues as DELIVERY_DELAY.`;

    const prompt = `TOOL CALLS EXECUTED:
${JSON.stringify(toolCallRecords, null, 2)}

RULE EVALUATION:
${JSON.stringify(ruleEvaluation, null, 2)}

CUSTOMER TICKET:
Ticket #${ticket.ticketNumber} - ${ticket.subject}
Messages:
${(ticket.messages || []).map(m => `[${m.senderType}]: ${m.messageText}`).join('\n')}

Generate the complete JSON draft matching the required schema.`;

    let lastError = null;
    const maxAttempts = this.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
        lastError = err;
        const sanitizedMsg = sanitizeError(err);
        const transient = isTransientError(err);

        if (transient && attempt < maxAttempts - 1) {
          const delay = calculateBackoffDelay(attempt, this.baseDelayMs);
          logger.warn(`Gemini API transient failure on attempt ${attempt + 1}/${maxAttempts} (${this.modelName}): ${sanitizedMsg}. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`Gemini draft generation failed (${this.modelName}) after ${attempt + 1} attempt(s): ${sanitizedMsg}`);
        break;
      }
    }

    const sanitizedLast = sanitizeError(lastError);
    let friendlyReason = sanitizedLast;
    if (isTransientError(lastError)) {
      friendlyReason = `Service is temporarily unavailable due to upstream high demand or request timeout after ${maxAttempts} attempts. Please try again in a few moments.`;
    }

    const cleanError = new Error(`Gemini API Error (${this.modelName}): ${friendlyReason}`);
    cleanError.status = (lastError && lastError.status) || 503;
    throw cleanError;
  }
}
