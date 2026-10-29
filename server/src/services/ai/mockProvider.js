/**
 * Deterministic Mock AI Provider
 * Generates structured, evidence-grounded draft replies without external API dependencies.
 */

export class MockAIProvider {
  constructor() {
    this.name = 'AI_MOCK';
  }

  async generateResolutionDraft(pipelineContext) {
    const { ticket, customer, order, product, retrievedPolicies, ruleEvaluation } = pipelineContext;
    const category = ruleEvaluation.detectedCategory || ticket.category;
    const customerName = customer?.name || 'Valued Customer';
    const orderNumber = order?.orderNumber || 'your order';
    const productName = product?.name || 'Noise device';

    // 1. Check for prompt injection
    if (ruleEvaluation.isPromptInjection) {
      return {
        ticketSummary: 'Malicious instruction override detected attempting system manipulation or unauthorized refund release.',
        category: 'MALICIOUS_INJECTION',
        priority: 'HIGH',
        recommendedAction: 'REJECT_AND_FLAG_SECURITY',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Support.\n\nYour support inquiry has been flagged for standard administrative review by our security compliance team in accordance with Noise Acceptable Use and Security Policies. Support representatives adhere strictly to verified purchase records and documented RMA guidelines.\n\nIf you have a legitimate query regarding a Noise product or order, please provide your verified order number and invoice for assistance.\n\nSincerely,\nNoise Security & Customer Care Operations`,
        confidence: 0.99,
        requiresHumanReview: true,
        missingInformation: ['verified_order_number', 'valid_inquiry_intent'],
        evidence: [
          {
            sourceType: 'POLICY',
            sourceId: 'POL-WAR-01',
            sourceTitle: 'Security & Verification Guidelines',
            excerpt: 'All warranty, refund, and replacement actions require verified proof of purchase and human agent validation.',
            relevanceScore: 1.0,
            explanation: 'Deterministic security filter triggered: unauthorized prompt injection attempt contained in customer message.'
          }
        ],
        policyFlags: [
          'CRITICAL: Prompt injection patterns detected. System instructions preserved. No unauthorized actions granted.'
        ]
      };
    }

    // 2. Missing Order / Insufficient Evidence Case
    if (!order && (category === 'DELIVERY_DELAY' || category === 'REFUND_REQUEST' || category === 'RETURN_REQUEST')) {
      return {
        ticketSummary: `Customer raised a ${category.toLowerCase().replace('_', ' ')} inquiry without providing an order number.`,
        category,
        priority: 'MEDIUM',
        recommendedAction: 'REQUEST_ORDER_DETAILS',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nWe would be happy to assist you with your request. However, we could not find an associated order ID or invoice linked to your inquiry. To help us locate your shipment and verify your policy eligibility, please reply with:\n\n1. Your Noise Order Number (e.g., NOISE-ORD-XXXXX) or registered order email.\n2. A copy or screenshot of your purchase invoice.\n3. The exact product model you received.\n\nOnce received, we will immediately process your request in accordance with our return and delivery guidelines.\n\nWarm regards,\nNoise Customer Care Team`,
        confidence: 0.75,
        requiresHumanReview: true,
        missingInformation: ['order_number', 'purchase_invoice'],
        evidence: [
          {
            sourceType: 'POLICY',
            sourceId: 'POL-WAR-01',
            sourceTitle: '1-Year Limited Manufacturing Warranty Coverage',
            excerpt: 'An authorized invoice or verified order number is mandatory to open a service or return ticket.',
            relevanceScore: 0.95,
            explanation: 'Cannot proceed with order-specific resolution without a verified order record.'
          }
        ],
        policyFlags: [
          'Missing order ID: Human agent must verify customer credentials before approving refunds or replacements.'
        ]
      };
    }

    // 3. Delivery Delay with Order
    if (category === 'DELIVERY_DELAY' && order) {
      const carrier = order.carrier || 'our courier partner';
      const tracking = order.trackingNumber || 'assigned tracking number';

      return {
        ticketSummary: `Customer reporting shipment delay for order ${orderNumber}. Status: ${order.orderStatus} via ${carrier}.`,
        category: 'DELIVERY_DELAY',
        priority: 'HIGH',
        recommendedAction: 'ESCALATE_COURIER_SLA',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Support regarding Order #${orderNumber}.\n\nWe sincerely apologize for the delay in receiving your ${productName}. We have reviewed the transit logs with ${carrier} (Tracking: ${tracking}). As per our Delivery & Transit SLA (POL-DEL-01), when package movement is delayed beyond normal SLA, we initiate an immediate priority courier investigation.\n\nWe have escalated your tracking details directly to ${carrier}'s logistics operations desk for immediate clearance. We are actively tracking this shipment and will provide you with a definitive delivery timeline update within 24 hours.\n\nThank you for your patience and understanding.\n\nWarm regards,\nNoise Logistics Support Team`,
        confidence: 0.93,
        requiresHumanReview: true,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'ORDER',
            sourceId: order.orderNumber,
            sourceTitle: `Order #${order.orderNumber}`,
            excerpt: `Status: ${order.orderStatus}, Carrier: ${carrier}, Tracking: ${tracking}`,
            relevanceScore: 0.98,
            explanation: 'Active order currently in transit with delayed courier movement.'
          },
          {
            sourceType: 'POLICY',
            sourceId: 'POL-DEL-01',
            sourceTitle: 'Delivery Delays, Transit Escalation & RTO Protocol',
            excerpt: 'If tracking shows no hub movement for more than 48 hours past expected SLA, an internal priority investigation ticket is logged with courier logistics.',
            relevanceScore: 0.94,
            explanation: 'Mandates formal courier investigation and proactive update to customer within 24 hours.'
          }
        ],
        policyFlags: [
          `Tracking ${tracking} escalated to ${carrier}. No cancellation penalty applied.`
        ]
      };
    }

    // 4. Return / Refund Request - Check Return Window Rule
    if ((category === 'RETURN_REQUEST' || category === 'REFUND_REQUEST') && order) {
      const returnEval = ruleEvaluation.returnEvaluation;

      if (returnEval && !returnEval.isEligible) {
        // Expired Return Window
        return {
          ticketSummary: `Customer requesting return/refund for ${productName} ${returnEval.daysElapsed} days post-delivery. Exceeds 7-day policy.`,
          category,
          priority: 'MEDIUM',
          recommendedAction: 'POLICY_EXCEPTION_REVIEW_REJECT',
          draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support regarding Order #${orderNumber}.\n\nWe have reviewed your request. Under our 7-Day Return and Replacement Policy (POL-RET-01), returns and refunds are accepted within 7 calendar days of courier delivery. As your order was delivered ${returnEval.daysElapsed} days ago, it has passed our eligible return window.\n\nWhile we cannot process a return for this item, your ${productName} remains covered under our 1-Year Limited Manufacturing Warranty (POL-WAR-01) for any hardware or operational concerns. If you are encountering any performance or technical difficulties, we would be delighted to assist you with troubleshooting or warranty support.\n\nPlease feel free to let us know how we can best assist you.\n\nWarm regards,\nNoise Customer Care Team`,
          confidence: 0.91,
          requiresHumanReview: true,
          missingInformation: [],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-RET-01',
              sourceTitle: '7-Day Return and Replacement Policy for Wearables',
              excerpt: 'Returns and replacements are accepted within 7 calendar days from the verified delivery date recorded by the courier partner.',
              relevanceScore: 0.98,
              explanation: `Delivery occurred ${returnEval.daysElapsed} days ago, exceeding the 7-day limit.`
            },
            {
              sourceType: 'ORDER',
              sourceId: order.orderNumber,
              sourceTitle: `Order #${order.orderNumber}`,
              excerpt: `Delivered on ${new Date(order.deliveryDate).toLocaleDateString('en-IN')} via ${order.carrier}.`,
              relevanceScore: 0.95,
              explanation: 'Verified courier delivery date confirms lapse of the 7-day return window.'
            }
          ],
          policyFlags: [
            `Return window lapsed (${returnEval.daysElapsed} days > 7 days). Human agent confirmation required to finalize response.`
          ]
        };
      } else {
        // Eligible Return / Refund within 7 days
        return {
          ticketSummary: `Eligible return/refund request for ${productName} (Order #${orderNumber}) within 7-day window.`,
          category,
          priority: 'MEDIUM',
          recommendedAction: 'AUTHORIZE_RETURN_PICKUP',
          draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Support regarding Order #${orderNumber}.\n\nWe are pleased to inform you that your request is within our 7-Day Return & Replacement Policy (POL-RET-01). We have initiated a complimentary reverse pickup request for your ${productName}.\n\nNext Steps:\n1. Please ensure the item is packed securely with its original retail box, charging cable, and included accessories.\n2. Our courier representative will arrive within 48 to 72 business hours at: ${order.deliveryAddress || 'your registered delivery address'}.\n3. Once the package arrives at our warehouse and passes standard verification (POL-REF-01), your refund of Rs. ${order.orderAmount.toLocaleString('en-IN')} will be credited to your original payment method within 3 to 5 business days.\n\nPlease let us know if your pickup address requires any update.\n\nWarm regards,\nNoise Customer Care Team`,
          confidence: 0.95,
          requiresHumanReview: true,
          missingInformation: [],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-RET-01',
              sourceTitle: '7-Day Return and Replacement Policy for Wearables',
              excerpt: 'Returns and replacements are accepted within 7 calendar days from the verified delivery date recorded by the courier partner.',
              relevanceScore: 0.98,
              explanation: `Request submitted within 7-day window (${returnEval ? returnEval.daysElapsed : 2} days since delivery).`
            },
            {
              sourceType: 'POLICY',
              sourceId: 'POL-REF-01',
              sourceTitle: 'Refund Timelines and Bank Crediting Guidelines',
              excerpt: 'Refunds are processed to the original payment method once the returned package passes warehouse quality inspection (3-5 business days).',
              relevanceScore: 0.92,
              explanation: 'Specifies 3-5 business day refund crediting timeline post inspection.'
            }
          ],
          policyFlags: [
            'Eligible for reverse pickup. Human agent approval will queue RMA ticket in logistics portal.'
          ]
        };
      }
    }

    // 5. Damaged Product (DOA)
    if (category === 'DAMAGED_PRODUCT') {
      const doaEval = ruleEvaluation.doaEvaluation;
      return {
        ticketSummary: `Report of physical damage / transit damage for ${productName} (Order #${orderNumber}).`,
        category: 'DAMAGED_PRODUCT',
        priority: 'URGENT',
        recommendedAction: 'VERIFY_DOA_PHOTOS_EXPEDITE_REPLACEMENT',
        draftReply: `Dear ${customerName},\n\nWe are genuinely sorry to hear that your ${productName} arrived damaged under Order #${orderNumber}.\n\nUnder our Transit Damage and Dead On Arrival (DOA) Policy (POL-DAM-01), any transit damage reported within 48 hours is eligible for an expedited priority replacement. To allow our logistics team to validate the carrier claim and immediately dispatch your replacement:\n\n1. Please share 2 to 3 clear photos of the damaged unit showing the defect.\n2. A photo of the outer cardboard shipping box showing the courier shipping label.\n\nAs soon as our support team verifies the photos, we will dispatch a brand-new replacement unit with priority courier delivery, without waiting for the damaged unit to return.\n\nWe apologize for this inconvenience and are dedicated to making this right.\n\nWarm regards,\nNoise Escalations Team`,
        confidence: 0.94,
        requiresHumanReview: true,
        missingInformation: ['outer_box_photo', 'damaged_product_photo'],
        evidence: [
          {
            sourceType: 'POLICY',
            sourceId: 'POL-DAM-01',
            sourceTitle: 'Transit Damage and Dead On Arrival (DOA) Claims',
            excerpt: 'Any physical damage, broken seals, or missing components must be reported within 48 hours of courier delivery. Customer must submit photographs of outer box and damaged unit.',
            relevanceScore: 0.98,
            explanation: 'DOA policy provides fast-track replacement upon photo verification.'
          }
        ],
        policyFlags: [
          doaEval?.isEligible
            ? 'Reported within 48h DOA window. Fast-track replacement qualified upon photo submission.'
            : 'Reported past 48h DOA SLA. Requires managerial discretion.'
        ]
      };
    }

    // 6. Warranty Claim
    if (category === 'WARRANTY_CLAIM') {
      const warrantyEval = ruleEvaluation.warrantyEvaluation;

      if (warrantyEval && !warrantyEval.isEligible) {
        // Expired Warranty
        return {
          ticketSummary: `Warranty claim for ${productName} purchased ${warrantyEval.daysElapsed} days ago. 1-year warranty expired.`,
          category: 'WARRANTY_CLAIM',
          priority: 'MEDIUM',
          recommendedAction: 'OFFER_PAID_SERVICE_OR_DISCOUNT',
          draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nWe reviewed your purchase history for Order #${orderNumber}. The ${productName} was purchased ${warrantyEval.daysElapsed} days ago. Under our 1-Year Limited Manufacturing Warranty (POL-WAR-01), manufacturer warranty coverage applies for 12 months (365 days) from the purchase date.\n\nAs the warranty period has expired, a complimentary replacement cannot be authorized. However, we would be pleased to offer you out-of-warranty diagnostic service at our certified service centre or an exclusive 20% loyalty discount voucher towards an upgrade to our latest generation wearables.\n\nPlease let us know if you would like our service specialist to guide you through out-of-warranty service options.\n\nWarm regards,\nNoise Customer Care Team`,
          confidence: 0.92,
          requiresHumanReview: true,
          missingInformation: [],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-WAR-01',
              sourceTitle: '1-Year Limited Manufacturing Warranty Coverage',
              excerpt: 'All Noise smartwatches, audio devices, and smart rings carry a 12-month standard manufacturer warranty from the official date of purchase.',
              relevanceScore: 0.98,
              explanation: `Elapsed time is ${warrantyEval.daysElapsed} days, which exceeds the 365-day limit.`
            }
          ],
          policyFlags: [
            `Warranty expired (${warrantyEval.daysElapsed} days elapsed). Paid repair or loyalty voucher recommended.`
          ]
        };
      } else {
        // Active Warranty
        return {
          ticketSummary: `Hardware fault on ${productName} under active 1-year warranty (${warrantyEval ? warrantyEval.daysRemaining : 'valid'} days remaining).`,
          category: 'WARRANTY_CLAIM',
          priority: 'HIGH',
          recommendedAction: 'AUTHORIZE_WARRANTY_RMA',
          draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support.\n\nWe have verified your purchase record for Order #${orderNumber}. Your ${productName} is currently under active 1-Year Manufacturer Warranty (POL-WAR-01). Because the issue described is an internal hardware defect and no physical or liquid damage is reported, your device qualifies for our Hardware Replacement Process (POL-REP-01).\n\nTo schedule your complimentary doorstep reverse pickup:\n1. Please confirm that your current address is: ${order?.deliveryAddress || 'your registered delivery address'}.\n2. Please confirm whether a factory reset (pressing power button for 15 seconds) was attempted.\n\nOnce you confirm your pickup address, we will generate your RMA ticket and our courier partner will collect the device for replacement inspection.\n\nWarm regards,\nNoise Support Team`,
          confidence: 0.94,
          requiresHumanReview: true,
          missingInformation: [],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-WAR-01',
              sourceTitle: '1-Year Limited Manufacturing Warranty Coverage',
              excerpt: 'Warranty Covers: Internal electronic failure, display hardware failure not caused by impact, touch panel unresponsiveness, charging circuitry defects...',
              relevanceScore: 0.98,
              explanation: 'Device is within warranty period; hardware failure is an eligible covered event.'
            },
            {
              sourceType: 'POLICY',
              sourceId: 'POL-REP-01',
              sourceTitle: 'Hardware Replacement Authorization Process',
              excerpt: 'When a device is deemed defective under active warranty and remote troubleshooting fails, a Reverse Pickup (RMA) is generated.',
              relevanceScore: 0.94,
              explanation: 'Authorizes reverse logistics doorstep pickup.'
            }
          ],
          policyFlags: [
            'Active warranty verified. Human agent must confirm pickup address before booking courier.'
          ]
        };
      }
    }

    // 7. Battery & Charging Troubleshooting
    if (category === 'BATTERY_CHARGING') {
      return {
        ticketSummary: `Battery draining / charging inquiry for ${productName}. Providing step-by-step calibration guidelines.`,
        category: 'BATTERY_CHARGING',
        priority: 'MEDIUM',
        recommendedAction: 'PROVIDE_BATTERY_TROUBLESHOOTING',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support regarding the battery performance on your ${productName}.\n\nTo help resolve rapid battery drain, please follow the recommended troubleshooting steps from our Knowledge Base (KB-BAT-01):\n\n1. Charger Specification: Always charge using a standard 5V/1A or 5V/2A USB adapter. Avoid using ultra-fast 65W/120W smartphone fast chargers as their rapid voltage surge can trigger thermal protection.\n2. Health Tracking Intervals: In the NoiseFit app, adjust Continuous Heart Rate monitoring to "10-minute intervals" instead of continuous real-time.\n3. Display Settings: Turn off Always-On Display (AOD) and set screen timeout to 5 seconds with brightness at 50%.\n4. Clean Charging Contacts: Gently wipe the magnetic charging pins on the device back with a dry microfiber cloth to ensure solid electrical contact.\n\nPlease test the device for 24-48 hours with these settings. If the battery continues to deplete in under 24 hours, reply to this email and we will initiate a hardware battery diagnostic under warranty.\n\nWarm regards,\nNoise Technical Support Team`,
        confidence: 0.92,
        requiresHumanReview: true,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BAT-01',
            sourceTitle: 'Troubleshooting Smartwatch Battery Drain & Fast Depletion',
            excerpt: 'Use ONLY a 5V/1A or 5V/2A standard USB adapter. Do NOT use ultra-fast 65W/120W chargers. Turn Continuous Heart Rate tracking to 10-minute intervals...',
            relevanceScore: 0.97,
            explanation: 'Detailed manufacturer guidance for optimal battery calibration and avoiding fast-charger thermal lockouts.'
          }
        ],
        policyFlags: [
          'First-line troubleshooting suggested. If unresolved, escalate to hardware RMA.'
        ]
      };
    }

    // 8. Bluetooth Pairing & Connectivity
    if (category === 'BLUETOOTH_PAIRING') {
      return {
        ticketSummary: `Bluetooth connection / NoiseFit app sync difficulty with ${productName}. Providing pairing protocol.`,
        category: 'BLUETOOTH_PAIRING',
        priority: 'MEDIUM',
        recommendedAction: 'PROVIDE_BLUETOOTH_GUIDE',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Support. We understand you are experiencing difficulties pairing your ${productName} with the NoiseFit app.\n\nTo establish a stable connection, please perform the following steps (KB-BLE-01):\n\n1. Unpair from Phone Bluetooth: Open your phone's native Bluetooth settings. If you see your Noise device listed, tap the info icon and select "Forget This Device" / "Unpair".\n2. Permissions: Go to phone Settings -> NoiseFit App -> ensure "Location" (set to Always / While Using) and "Nearby Devices / Bluetooth" permissions are granted.\n3. Restart Bluetooth: Toggle phone Bluetooth OFF, wait 10 seconds, then toggle back ON.\n4. Connect via App: Open the NoiseFit app, navigate to "Devices" -> "Add Device", and scan the QR code displayed on your device screen (do not connect through phone settings directly).\n\nIf the pairing fails after these steps, please let us know the phone model and OS version you are using so we can assist further.\n\nWarm regards,\nNoise Technical Support Team`,
        confidence: 0.93,
        requiresHumanReview: true,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BLE-01',
            sourceTitle: 'Bluetooth Pairing & NoiseFit App Connectivity Guide',
            excerpt: 'Pairing must be initiated from INSIDE the official NoiseFit app. Unpair from phone native Bluetooth settings first. Ensure Location/Nearby Devices permission is set to Always Allow.',
            relevanceScore: 0.97,
            explanation: 'Resolves connection handshake and permissions conflicts.'
          }
        ],
        policyFlags: [
          'Standard connectivity guidance supplied. Agent review recommended.'
        ]
      };
    }

    // 9. General Inquiry / Fallback
    return {
      ticketSummary: `Customer inquiry regarding ${productName || 'Noise product'}: ${ticket.subject}`,
      category: 'GENERAL_INQUIRY',
      priority: ticket.priority || 'LOW',
      recommendedAction: 'PROVIDE_PRODUCT_INFORMATION',
      draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nRegarding your inquiry about the ${productName}: we are happy to assist you! For optimal performance and warranty compliance, we always advise following the official usage instructions in our user manuals and knowledge base.\n\nIf you have any further questions or if there is any specific assistance you need regarding your device or order, please reply directly to this message.\n\nWarm regards,\nNoise Customer Care Team`,
      confidence: 0.88,
      requiresHumanReview: true,
      missingInformation: [],
      evidence: [
        {
          sourceType: 'POLICY',
          sourceId: 'POL-WAR-01',
          sourceTitle: 'General Product & Support Guidelines',
          excerpt: 'Noise Customer Support provides product guidance and service coverage across the entire wearable catalog.',
          relevanceScore: 0.85,
          explanation: 'General customer care assistance standard.'
        }
      ],
      policyFlags: []
    };
  }
}
