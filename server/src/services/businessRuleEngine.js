import { evaluateWarrantyStatus, evaluateReturnStatus, evaluateDOAStatus } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';

export class BusinessRuleEngine {
  /**
   * Scans customer text for prompt injection, jailbreaking, or unauthorized instruction overrides
   */
  static detectPromptInjection(text) {
    if (!text || typeof text !== 'string') return false;

    const lower = text.toLowerCase();
    const injectionPatterns = [
      /system\s+instruction\s+override/i,
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
      /forget\s+(all\s+)?(previous|prior)\s+instructions/i,
      /you\s+are\s+now\s+in\s+(superuser|admin|maintenance|god)\s+mode/i,
      /reveal\s+(the\s+)?(internal\s+)?(system\s+)?prompt/i,
      /print\s+(the\s+)?api\s+keys?/i,
      /disbursement\s+authorization/i,
      /output\s+json\s+approving/i,
      /bypass\s+safety/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(lower)) {
        logger.warn(`Security Rule: Prompt injection pattern matched: ${pattern}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Deterministically extracts intent, order numbers, and category from customer inquiry
   */
  static extractEntities(ticket, customerOrders = []) {
    const text = `${ticket.subject} ${(ticket.messages || []).map(m => m.messageText).join(' ')}`;
    const lower = text.toLowerCase();

    // 1. Detect order number pattern (e.g. NOISE-ORD-XXXXX or ORD-XXXXX)
    const orderMatch = text.match(/(NOISE-ORD-\d{4,6}|ORD-\d{4,6})/i);
    const extractedOrderNumber = orderMatch ? orderMatch[1].toUpperCase() : null;

    // 2. Classify intent / category
    let detectedCategory = ticket.category || 'GENERAL_INQUIRY';

    if (this.detectPromptInjection(text)) {
      detectedCategory = 'MALICIOUS_INJECTION';
    } else if (lower.includes('stuck') || lower.includes('delay') || lower.includes('not delivered') || lower.includes('tracking') || lower.includes('where is my order')) {
      detectedCategory = 'DELIVERY_DELAY';
    } else if (lower.includes('broken') || lower.includes('cracked') || lower.includes('damaged') || lower.includes('doa') || lower.includes('dead on arrival')) {
      detectedCategory = 'DAMAGED_PRODUCT';
    } else if (lower.includes('refund') || lower.includes('money back')) {
      detectedCategory = 'REFUND_REQUEST';
    } else if (lower.includes('return') || lower.includes('exchange')) {
      detectedCategory = 'RETURN_REQUEST';
    } else if (lower.includes('warranty') || lower.includes('display') || lower.includes('screen') || lower.includes('stopped working') || lower.includes('dead')) {
      detectedCategory = 'WARRANTY_CLAIM';
    } else if (lower.includes('battery') || lower.includes('drain') || lower.includes('charging') || lower.includes('charger')) {
      detectedCategory = 'BATTERY_CHARGING';
    } else if (lower.includes('bluetooth') || lower.includes('pair') || lower.includes('sync') || lower.includes('app') || lower.includes('connect')) {
      detectedCategory = 'BLUETOOTH_PAIRING';
    }

    return {
      extractedOrderNumber,
      detectedCategory,
      textLength: text.length
    };
  }

  /**
   * Evaluates deterministic business rules over order, product, and warranty facts
   */
  static evaluateRules({ ticket, order, product, customerMessagesText }) {
    const isPromptInjection = this.detectPromptInjection(customerMessagesText);
    const { detectedCategory } = this.extractEntities(ticket);

    const evaluation = {
      isPromptInjection,
      detectedCategory,
      hasOrder: Boolean(order),
      requiresHumanReview: true, // System always enforces human review before sending!
      flags: [],
      missingInformation: []
    };

    if (isPromptInjection) {
      evaluation.flags.push('CRITICAL: Malicious prompt injection attempt detected. System guardrails engaged.');
      evaluation.missingInformation.push('valid_ticket_context');
      return evaluation;
    }

    // Rule: Order must exist for order-specific claims
    const orderSpecificCategories = ['DELIVERY_DELAY', 'REFUND_REQUEST', 'RETURN_REQUEST', 'DAMAGED_PRODUCT'];
    if (orderSpecificCategories.includes(detectedCategory) && !order) {
      evaluation.missingInformation.push('order_number');
      evaluation.flags.push('Missing Order Record: Order ID or verified purchase invoice is mandatory before processing refund or replacement.');
    }

    // Rule: Warranty eligibility calculation
    if (order && order.purchaseDate) {
      const warrantyMonths = product?.warrantyMonths || 12;
      const warrantyEval = evaluateWarrantyStatus(order.purchaseDate, warrantyMonths);
      evaluation.warrantyEvaluation = warrantyEval;

      if (!warrantyEval.isEligible && detectedCategory === 'WARRANTY_CLAIM') {
        evaluation.flags.push(`Warranty Lapsed: Purchased ${warrantyEval.daysElapsed} days ago (exceeds ${warrantyMonths}-month warranty limit). Free replacement not permitted.`);
      }
    }

    // Rule: Return / Refund window calculation (7 days)
    if (order && order.deliveryDate) {
      const returnWindowDays = product?.returnWindowDays || 7;
      const returnEval = evaluateReturnStatus(order.deliveryDate, returnWindowDays);
      evaluation.returnEvaluation = returnEval;

      if (!returnEval.isEligible && (detectedCategory === 'RETURN_REQUEST' || detectedCategory === 'REFUND_REQUEST')) {
        evaluation.flags.push(`Return SLA Expired: Delivered ${returnEval.daysElapsed} days ago (exceeds 7-day return window).`);
      }
    }

    // Rule: DOA transit damage reporting window (48 hours)
    if (order && order.deliveryDate && detectedCategory === 'DAMAGED_PRODUCT') {
      const doaEval = evaluateDOAStatus(order.deliveryDate, 48);
      evaluation.doaEvaluation = doaEval;

      if (!doaEval.isEligible) {
        evaluation.flags.push(`DOA Window Expired: Delivered ${doaEval.hoursElapsed} hours ago (exceeds 48-hour transit damage reporting SLA).`);
      }
      evaluation.missingInformation.push('damaged_item_photo');
      evaluation.missingInformation.push('outer_box_photo');
    }

    return evaluation;
  }
}
