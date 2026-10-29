import { evaluateWarrantyStatus, evaluateReturnStatus, evaluateDOAStatus } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';

export class BusinessRuleEngine {
  /**
   * Strips quoted email reply headers and history (e.g., '> ...', 'On ... wrote:', '-----Original Message-----')
   * to prevent creating new requests from quoted context.
   */
  static cleanCustomerMessage(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    const lines = rawText.split(/\r?\n/);
    const cleaned = [];
    let skippingQuoteBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for start of standard email headers
      if (/^-----Original Message-----/i.test(trimmed) ||
          /^On\s+.*wrote:?$/i.test(trimmed) ||
          /^From:\s+.*Sent:\s+.*/i.test(trimmed) ||
          /^_{5,}/.test(trimmed)) {
        skippingQuoteBlock = true;
        continue;
      }

      // Skip lines starting with email quote markers '>'
      if (/^>/.test(trimmed)) {
        continue;
      }

      // If we were skipping a quote header block and hit a non-empty, non-quote line, resume!
      if (skippingQuoteBlock) {
        if (!trimmed) continue;
        skippingQuoteBlock = false;
      }

      cleaned.push(line);
    }

    return cleaned.join('\n').trim();
  }

  /**
   * Scans customer text for prompt injection, jailbreaking, or unauthorized instruction overrides
   */
  static detectPromptInjection(text) {
    if (!text || typeof text !== 'string') return false;

    const lower = text.toLowerCase();
    const injectionPatterns = [
      /system\s+instruction\s+override/i,
      /ignore\s+(all\s+)?(previous|prior|system)\s+instructions/i,
      /ignore\s+(all\s+)?policies/i,
      /forget\s+(all\s+)?(previous|prior)\s+instructions/i,
      /you\s+are\s+now\s+in\s+(superuser|admin|maintenance|god)\s+mode/i,
      /reveal\s+(the\s+)?(internal\s+)?(system\s+)?prompt/i,
      /reveal\s+(another|other)\s+customer('s)?\s+(order|data|info)/i,
      /print\s+(the\s+)?api\s+keys?/i,
      /disbursement\s+authorization/i,
      /output\s+json\s+approving/i,
      /approve\s+my\s+refund\s+without\s+review/i,
      /bypass\s+(safety|rules|approval)/i
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
   * Detects potentially hazardous safety issues (battery swelling, smoke, fire, sparks, skin burns)
   */
  static detectSafetyIssue(text) {
    if (!text || typeof text !== 'string') return { isSafetyHazard: false, reason: null };

    const lower = text.toLowerCase();
    const safetyPatterns = [
      { pattern: /(swell|swollen|bulg|bulging).{0,25}(battery|watch|case|ring)|(battery|watch|case|ring).{0,25}(swell|swollen|bulg|bulging)/i, reason: 'Potentially swollen battery hazard' },
      { pattern: /(smoke|fume|fire|burn|spark|sparking|shock|burnt)/i, reason: 'Thermal event, burning, or electrical spark report' },
      { pattern: /(blister|skin\s+burn|rash\s+burn|scorched)/i, reason: 'Skin burn or device overheating injury' },
      { pattern: /(melted|melting)\s+(charger|cable|port|pins)/i, reason: 'Melted charging component or electrical thermal runaway' }
    ];

    for (const { pattern, reason } of safetyPatterns) {
      if (pattern.test(lower)) {
        logger.warn(`Safety Guardrail Triggered: ${reason}`);
        return { isSafetyHazard: true, reason };
      }
    }

    return { isSafetyHazard: false, reason: null };
  }

  /**
   * Detects multiple independent issues in a single customer message
   * to ensure no secondary problem is silently dropped.
   */
  static detectMultiIssues(text) {
    if (!text) return ['GENERAL_INQUIRY'];

    const lower = text.toLowerCase();
    const detected = [];

    // Issue 1: Charging / Battery
    if (lower.includes('not charging') || lower.includes('won\'t charge') || lower.includes('battery') || lower.includes('charger') || lower.includes('drain')) {
      detected.push('BATTERY_CHARGING');
    }

    // Issue 2: Bluetooth / NoiseFit App Connectivity
    if (lower.includes('bluetooth') || lower.includes('pair') || lower.includes('connect') || lower.includes('sync') || lower.includes('noisefit')) {
      detected.push('BLUETOOTH_PAIRING');
    }

    // Issue 3: Missing sleep tracking data
    if (lower.includes('sleep') || lower.includes('sleep score') || lower.includes('stages') || lower.includes('rem sleep') || lower.includes('sleep data')) {
      if (!detected.includes('BLUETOOTH_PAIRING')) {
        detected.push('BLUETOOTH_PAIRING'); // Synced via Bluetooth sensor health tracking
      }
    }

    // Issue 4: Shipping & Delivery Delay
    if (lower.includes('stuck') || lower.includes('delay') || lower.includes('shipping') || lower.includes('courier') || lower.includes('not delivered') || lower.includes('tracking')) {
      detected.push('DELIVERY_DELAY');
    }

    // Issue 5: Exchange Request (Size / Color)
    if (lower.includes('exchange') || lower.includes('wrong size') || lower.includes('size exchange') || lower.includes('color exchange')) {
      detected.push('RETURN_REQUEST');
    }

    // Issue 6: Refund Request
    if (lower.includes('refund') || lower.includes('money back')) {
      if (!detected.includes('RETURN_REQUEST')) detected.push('REFUND_REQUEST');
    }

    // Issue 7: Damaged Product / Dead On Arrival
    if (lower.includes('damaged') || lower.includes('cracked') || lower.includes('broken') || lower.includes('doa') || lower.includes('crushed box')) {
      detected.push('DAMAGED_PRODUCT');
    }

    // Issue 8: Hardware Defect / Warranty Claim
    if (lower.includes('touch') || lower.includes('screen flick') || lower.includes('stopped working') || lower.includes('silent') || lower.includes('no sound') || lower.includes('warranty')) {
      if (!detected.includes('DAMAGED_PRODUCT') && !detected.includes('BATTERY_CHARGING')) {
        detected.push('WARRANTY_CLAIM');
      }
    }

    if (detected.length === 0) {
      detected.push('GENERAL_INQUIRY');
    }

    return Array.from(new Set(detected));
  }

  /**
   * Deterministically extracts intent, order numbers, and category from customer inquiry
   */
  static extractEntities(ticket) {
    const rawText = `${ticket.subject} ${(ticket.messages || []).map(m => m.messageText).join(' ')}`;
    const text = this.cleanCustomerMessage(rawText);
    const lower = text.toLowerCase();

    // 1. Detect order number pattern (e.g. NOISE-ORD-XXXXX or ORD-XXXXX)
    const orderMatch = text.match(/(NOISE-ORD-\d{4,6}|ORD-\d{4,6})/i);
    const extractedOrderNumber = orderMatch ? orderMatch[1].toUpperCase() : null;

    // 2. Classify intent / category
    let detectedCategory = ticket.category || 'GENERAL_INQUIRY';
    const multiCategories = this.detectMultiIssues(text);

    if (this.detectPromptInjection(text)) {
      detectedCategory = 'MALICIOUS_INJECTION';
    } else if (multiCategories.length > 0) {
      detectedCategory = multiCategories[0];
    }

    return {
      extractedOrderNumber,
      detectedCategory,
      multiCategories,
      textLength: text.length
    };
  }

  /**
   * Checks customer-order authorization: verifies that the accessed order belongs to the requesting customer.
   */
  static checkAuthorization(customer, order) {
    if (!order || !customer) {
      return { isAuthorized: true }; // No cross-customer access attempt
    }

    // Verify order customerId matches ticket customer ID or email
    const orderCustomerId = order.customerId;
    const ticketCustomerId = customer.id;
    const orderCustomerEmail = order.customer?.email?.toLowerCase();
    const ticketCustomerEmail = customer.email?.toLowerCase();

    const isMatch = (orderCustomerId === ticketCustomerId) ||
      (orderCustomerEmail && ticketCustomerEmail && orderCustomerEmail === ticketCustomerEmail);

    if (!isMatch) {
      logger.warn(`Security Violation: Customer ${customer.id} attempted to access Order ${order.id} owned by ${orderCustomerId}`);
      return {
        isAuthorized: false,
        error: `Authorization violation: Order #${order.orderNumber} does not belong to customer ${customer.name}. Details withheld.`
      };
    }

    return { isAuthorized: true };
  }

  /**
   * Evaluates contradictions between customer statements and stored records
   */
  static detectContradictions(customerText, order) {
    if (!order || !customerText) return [];
    const contradictions = [];
    const lower = customerText.toLowerCase();

    // Contradiction 1: Customer claims order was not delivered, but courier status is DELIVERED
    if ((lower.includes('never received') || lower.includes('not delivered') || lower.includes('where is my order')) && order.orderStatus === 'DELIVERED') {
      contradictions.push(`Contradiction: Customer claims package was not delivered, but official carrier tracking (${order.carrier || 'Logistics'}) records status as DELIVERED.`);
    }

    // Contradiction 2: Customer claims delivered "yesterday" or "2 days ago", but delivery was > 20 days ago
    if (order.deliveryDate) {
      const daysElapsed = Math.floor((Date.now() - new Date(order.deliveryDate).getTime()) / (1000 * 60 * 60 * 24));
      if ((lower.includes('delivered yesterday') || lower.includes('just received today') || lower.includes('got it 2 days ago')) && daysElapsed > 14) {
        contradictions.push(`Contradiction: Customer claims recent delivery, but courier verified delivery occurred ${daysElapsed} days ago.`);
      }
    }

    return contradictions;
  }

  /**
   * Evaluates deterministic business rules over order, product, and warranty facts
   */
  static evaluateRules({ ticket, customer, order, product, customerMessagesText }) {
    const cleanedText = this.cleanCustomerMessage(customerMessagesText);
    const isPromptInjection = this.detectPromptInjection(cleanedText);
    const safetyCheck = this.detectSafetyIssue(cleanedText);
    const { detectedCategory, multiCategories } = this.extractEntities(ticket);

    const authorization = this.checkAuthorization(customer || ticket.customer, order);
    const contradictions = this.detectContradictions(cleanedText, order);

    const evaluation = {
      isPromptInjection,
      detectedCategory,
      multiCategories,
      isSafetyHazard: safetyCheck.isSafetyHazard,
      safetyReason: safetyCheck.reason,
      hasOrder: Boolean(order),
      isAuthorized: authorization.isAuthorized,
      authorizationError: authorization.error || null,
      contradictions,
      requiresHumanReview: true, // System strictly enforces human review before sending!
      escalationFlag: false,
      escalationReason: null,
      flags: [],
      missingInformation: [],
      priorDisclosedFacts: {}
    };

    // 1. Safety Hazard Escalation (Highest Priority)
    if (safetyCheck.isSafetyHazard) {
      evaluation.escalationFlag = true;
      evaluation.escalationReason = `SAFETY_HAZARD: ${safetyCheck.reason}`;
      evaluation.flags.push(`CRITICAL SAFETY ALERT: Customer reported ${safetyCheck.reason}. Immediate engineering inspection and battery recall safety protocol required.`);
    }

    // 2. Prompt Injection Neutralization
    if (isPromptInjection) {
      evaluation.escalationFlag = true;
      evaluation.escalationReason = 'SECURITY_POLICY_VIOLATION: Prompt injection attempt detected';
      evaluation.flags.push('CRITICAL: Malicious prompt injection attempt detected. System guardrails engaged. Unauthorized compensation or prompt disclosure blocked.');
      evaluation.missingInformation.push('valid_ticket_context');
      return evaluation;
    }

    // 3. Authorization Violation
    if (!authorization.isAuthorized) {
      evaluation.escalationFlag = true;
      evaluation.escalationReason = 'ACCESS_DENIED: Cross-customer order lookup attempt';
      evaluation.flags.push(`SECURITY: ${authorization.error}`);
      return evaluation;
    }

    // 4. Contradictions Flagging
    if (contradictions.length > 0) {
      evaluation.escalationFlag = true;
      evaluation.escalationReason = 'DATA_CONTRADICTION: Customer claim conflicts with courier records';
      contradictions.forEach(c => evaluation.flags.push(c));
    }

    // 5. Multi-Issue Flagging
    if (multiCategories.length > 1) {
      evaluation.flags.push(`Multiple issues detected: ${multiCategories.join(' & ')}. Response must address both issues without omission.`);
    }

    // 6. Context Retention: Check what customer already supplied in earlier turns
    const allCustomerText = (ticket.messages || [])
      .filter(m => m.senderType === 'CUSTOMER')
      .map(m => m.messageText)
      .join(' ');

    const allAttachments = [];
    for (const msg of (ticket.messages || [])) {
      try {
        const atts = JSON.parse(msg.attachmentsJson || '[]');
        if (Array.isArray(atts)) atts.forEach(a => allAttachments.push(a));
      } catch {}
    }

    const hasVerifiedVideo = allAttachments.some(a =>
      (a.type === 'video' || (a.filename && a.filename.includes('video'))) && a.verifiedReceipt === true
    );
    const claimedVideo = /sent\s+(the\s+)?(charging\s+)?video/i.test(allCustomerText);

    evaluation.priorDisclosedFacts = {
      hasProvidedOrderNumber: Boolean(order || /NOISE-ORD-\d{4,6}/i.test(allCustomerText)),
      hasVerifiedVideo,
      claimedVideo
    };

    // Follow-up charging video evaluation
    if (detectedCategory === 'BATTERY_CHARGING' || cleanedText.toLowerCase().includes('video')) {
      if (hasVerifiedVideo) {
        evaluation.flags.push('Verified Evidence: Charging video confirmed on file. Do NOT ask customer to re-submit video.');
      } else if (claimedVideo) {
        evaluation.flags.push('Evidence Note: Customer claims video was sent, but file attachment is not confirmed received in database. Politely request re-upload or shared drive link.');
        evaluation.missingInformation.push('charging_video_file_confirmation');
      } else {
        evaluation.missingInformation.push('charging_demonstration_video');
      }
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
