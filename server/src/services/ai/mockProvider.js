import { executeToolCall } from '../tools.js';

/**
 * Deterministic Mock AI Provider
 * Simulates genuine LLM tool calling workflow deterministically and produces structured,
 * evidence-grounded draft replies with separate internal agent actions and external customer replies.
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
    const productName = product?.name || 'Noise wearable';

    // Simulate genuine tool calling loop
    const toolCallRecords = [];

    // 1. Tool Call: get_ticket_history
    const historyTool = await executeToolCall('get_ticket_history', { ticket_id: ticket.ticketNumber || ticket.id });
    toolCallRecords.push(historyTool);

    // 2. Tool Call: lookup_order (if order ID or order exists)
    if (order?.orderNumber || ruleEvaluation.extractedOrderNumber) {
      const orderTool = await executeToolCall('lookup_order', { order_id: order?.orderNumber || ruleEvaluation.extractedOrderNumber });
      toolCallRecords.push(orderTool);
    }

    // 3. Tool Call: search_support_policy
    const queryTerm = `${category} ${ticket.subject}`.toLowerCase();
    const policyTool = await executeToolCall('search_support_policy', { query: queryTerm });
    toolCallRecords.push(policyTool);

    // Check customer message content
    const customerMessagesText = (ticket.messages || [])
      .filter(m => m.senderType === 'CUSTOMER')
      .map(m => m.messageText)
      .join(' ');
    const lowerText = customerMessagesText.toLowerCase();

    // 1. Check for prompt injection
    if (ruleEvaluation.isPromptInjection) {
      return {
        ticketSummary: 'Malicious instruction override attempt detected attempting system manipulation or unauthorized compensation release.',
        category: 'MALICIOUS_INJECTION',
        customerIntent: 'Adversarial jailbreak / Prompt injection',
        identifiedOrderOrDevice: order ? order.orderNumber : null,
        priority: 'HIGH',
        recommendedAction: 'REJECT_AND_FLAG_SECURITY',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support.\n\nYour support inquiry has been flagged for standard administrative review by our security compliance team in accordance with Noise Acceptable Use and Security Policies. Support representatives adhere strictly to verified purchase records and documented RMA guidelines.\n\nIf you have a legitimate query regarding a Noise product or order, please provide your verified order number and invoice for assistance.\n\nSincerely,\nNoise Security & Customer Care Operations`,
        internalNextAction: 'BLOCK_UNAUTHORIZED_ACTIONS: Customer message attempted prompt injection. Do not release refunds or share internal data. Preserve security logs.',
        confidence: 0.99,
        requiresHumanReview: true,
        escalationFlag: true,
        escalationReason: 'SECURITY_VIOLATION: Prompt injection pattern detected',
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
        ],
        toolCalls: toolCallRecords
      };
    }

    // 2. Safety Hazard Escalation (swelling, fire, smoke, spark, burn)
    if (ruleEvaluation.isSafetyHazard) {
      return {
        ticketSummary: `Safety hazard alert: Customer reported ${ruleEvaluation.safetyReason} on ${productName}.`,
        category: 'WARRANTY_CLAIM',
        customerIntent: 'Urgent safety hazard reporting',
        identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
        priority: 'URGENT',
        recommendedAction: 'ESCALATE_SAFETY_TEAM_IMMEDIATE_STOP_USE',
        draftReply: `Dear ${customerName},\n\nThank you for bringing this to our attention immediately. Your safety is our absolute highest priority at Noise.\n\nGiven your report regarding ${ruleEvaluation.safetyReason}, please IMMEDIATELY cease using and charging your ${productName}. Disconnect it from any electrical outlet or charger and store it in a cool, ventilated area away from flammable materials.\n\nOur Senior Safety Operations Team has been paged with priority urgency. A dedicated safety specialist will contact you directly within 2 hours to coordinate an expedited inspection and safety resolution.\n\nSincerely,\nNoise Priority Safety Operations Desk`,
        internalNextAction: 'IMMEDIATE SAFETY RECALL PROTOCOL: Do not attempt standard troubleshooting. Escalate directly to Product Safety Director & Compliance desk. File carrier hazardous goods retrieval.',
        confidence: 0.98,
        requiresHumanReview: true,
        escalationFlag: true,
        escalationReason: `SAFETY_HAZARD: ${ruleEvaluation.safetyReason}`,
        missingInformation: ['safety_photographs', 'incident_timestamp'],
        evidence: [
          {
            sourceType: 'POLICY',
            sourceId: 'POL-WAR-01',
            sourceTitle: '1-Year Limited Manufacturing Warranty Coverage',
            excerpt: 'Noise maintains immediate safety compliance protocols for thermal runaway, electrical spark, and physical battery anomalies.',
            relevanceScore: 1.0,
            explanation: 'Safety protocols mandate immediate device retirement and priority managerial contact.'
          }
        ],
        policyFlags: [
          `CRITICAL SAFETY ALERT: ${ruleEvaluation.safetyReason}. Cease-use advice dispatched.`
        ],
        toolCalls: toolCallRecords
      };
    }

    // 3. Authorization Violation (Customer attempting to look up another customer's order)
    if (ruleEvaluation && ruleEvaluation.isAuthorized === false) {
      return {
        ticketSummary: `Unauthorized access attempt: Customer ${customerName} queried order not belonging to their account.`,
        category: 'GENERAL_INQUIRY',
        customerIntent: 'Cross-customer data inquiry',
        identifiedOrderOrDevice: order ? order.orderNumber : null,
        priority: 'HIGH',
        recommendedAction: 'REFUSE_UNAUTHORIZED_DATA_ACCESS',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nFor the privacy and protection of all Noise customers, account records and order statuses can only be shared with the verified email address and phone number on the original purchase invoice.\n\nWe could not verify that you are the registered purchaser for the requested order. If you placed this order under a different email, please reach out to us directly from that registered email address.\n\nWarm regards,\nNoise Customer Protection Team`,
        internalNextAction: 'AUTHORIZATION MISMATCH: Customer credentials do not match order purchaser. Do not reveal tracking address, amount, or recipient details.',
        confidence: 0.95,
        requiresHumanReview: true,
        escalationFlag: true,
        escalationReason: 'AUTHORIZATION_MISMATCH: Customer does not match order record',
        missingInformation: ['registered_email_verification'],
        evidence: [
          {
            sourceType: 'POLICY',
            sourceId: 'POL-WAR-01',
            sourceTitle: 'Customer Data Privacy & Authorization Policy',
            excerpt: 'Support agents are strictly prohibited from disclosing order, transit, or customer records to non-authorized third parties.',
            relevanceScore: 0.99,
            explanation: 'Backend access control violation: order owner differs from ticket requester.'
          }
        ],
        policyFlags: [
          'Security Flag: Customer authentication mismatch. Data disclosure blocked.'
        ],
        toolCalls: toolCallRecords
      };
    }

    // 4. Contradiction Case (Customer claims not delivered, but courier status is DELIVERED)
    if (ruleEvaluation.contradictions && ruleEvaluation.contradictions.length > 0) {
      const contradictionMsg = ruleEvaluation.contradictions[0];
      return {
        ticketSummary: `Contradiction detected: Customer claims package was not received, but courier reports DELIVERED.`,
        category: 'DELIVERY_DELAY',
        customerIntent: 'Disputed delivery / Denial of receipt',
        identifiedOrderOrDevice: order?.orderNumber || 'Unknown Order',
        priority: 'HIGH',
        recommendedAction: 'INVESTIGATE_DENIAL_OF_RECEIPT_POD',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support regarding Order #${orderNumber}.\n\nWe understand you have not received your package. However, our logistics partner ${order?.carrier || 'Delhivery'} has recorded this shipment as delivered on ${order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'file'} under tracking number ${order?.trackingNumber || 'on file'}.\n\nBecause of this discrepancy, we have initiated an immediate Denial of Receipt (DOR) investigation with the courier hub. We have requested:\n1. The delivery Proof of Delivery (POD) image and signature.\n2. The courier delivery executive's geo-coordinates at the time of delivery stamp.\n\nWe will update you with the carrier's GPS delivery proof within 24 hours. If misdelivery or loss is confirmed, we will dispatch a priority replacement immediately.\n\nWarm regards,\nNoise Logistics Escalations Desk`,
        internalNextAction: 'CONTRADICTION INVESTIGATION: Order is marked DELIVERED in courier portal. Request digital POD and driver GPS logs before approving re-shipment or refund.',
        confidence: 0.88,
        requiresHumanReview: true,
        escalationFlag: true,
        escalationReason: 'CONTRADICTION: Customer disputed delivery status marked delivered by carrier',
        missingInformation: ['courier_pod_signature', 'gps_delivery_coordinates'],
        evidence: [
          {
            sourceType: 'ORDER',
            sourceId: order.orderNumber,
            sourceTitle: `Order #${order.orderNumber} - Tracking ${order.trackingNumber}`,
            excerpt: `Carrier: ${order.carrier}, Status: ${order.orderStatus}, Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'Recorded'}`,
            relevanceScore: 0.96,
            explanation: 'Official courier tracking status directly contradicts customer denial of delivery.'
          },
          {
            sourceType: 'POLICY',
            sourceId: 'POL-DEL-01',
            sourceTitle: 'Delivery Delays, Transit Escalation & RTO Protocol',
            excerpt: 'When a customer disputes a delivered status, support agents must obtain Proof of Delivery (POD) from the logistics partner before re-shipping.',
            relevanceScore: 0.94,
            explanation: 'SLA requires formal denial-of-receipt investigation.'
          }
        ],
        policyFlags: ruleEvaluation.flags,
        toolCalls: toolCallRecords
      };
    }

    // 5. Follow-up Scenario (Charging Issue & Video Evidence)
    if (category === 'BATTERY_CHARGING' || lowerText.includes('charging') || lowerText.includes('charge')) {
      const historyData = historyTool.result || {};
      const evidenceStatus = historyData.evidenceStatus || {};

      // Check if this is the follow-up message: "I already sent the charging video yesterday"
      const isVideoFollowUp = lowerText.includes('video') || lowerText.includes('already sent');

      if (isVideoFollowUp) {
        if (evidenceStatus.hasVerifiedVideo) {
          // Video verified in database attachments
          return {
            ticketSummary: `Customer followed up confirming charging failure. Video demonstration verified on file.`,
            category: 'BATTERY_CHARGING',
            customerIntent: 'RMA warranty claim with verified charging video',
            identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
            priority: 'MEDIUM',
            recommendedAction: 'AUTHORIZE_WARRANTY_RMA_DOORSTEP_PICKUP',
            draftReply: `Dear ${customerName},\n\nThank you for following up with Noise Support.\n\nWe confirm that your charging demonstration video has been successfully reviewed by our technical team. The video verifies that the device remains unresponsive despite correct pin alignment on the charging dock.\n\nBecause remote troubleshooting has concluded and your ${productName} is covered under warranty (POL-WAR-01), we have authorized a complimentary doorstep pickup for replacement (POL-REP-01).\n\nPlease confirm your pickup address (Currently on file: ${order?.deliveryAddress || 'your registered delivery address'}). Once confirmed, our courier partner will collect the unit within 48 to 72 business hours.\n\nWarm regards,\nNoise Technical Support Team`,
            internalNextAction: 'RMA AUTHORIZED: Charging video reviewed and verified on file. Do not request video again. Book reverse courier pickup upon address confirmation.',
            confidence: 0.96,
            requiresHumanReview: true,
            escalationFlag: false,
            escalationReason: null,
            missingInformation: [],
            evidence: [
              {
                sourceType: 'KNOWLEDGE_BASE',
                sourceId: 'KB-BAT-01',
                sourceTitle: 'Troubleshooting Smartwatch Battery Drain & Fast Depletion',
                excerpt: 'If charging dock failure persists after cleaning pins and standard 5V adapter connection, proceed to warranty RMA pickup.',
                relevanceScore: 0.98,
                explanation: 'Video verification satisfies troubleshooting threshold.'
              },
              {
                sourceType: 'POLICY',
                sourceId: 'POL-REP-01',
                sourceTitle: 'Hardware Replacement Authorization Process',
                excerpt: 'When a device is deemed defective under active warranty and remote troubleshooting fails, a Reverse Pickup (RMA) is generated.',
                relevanceScore: 0.95,
                explanation: 'Authorizes doorstep exchange pickup.'
              }
            ],
            policyFlags: ['Verified charging video on file. Direct RMA approved.'],
            toolCalls: toolCallRecords
          };
        } else {
          // Customer claimed sending video, but it is NOT verified in system records
          return {
            ticketSummary: `Customer claims charging video was sent yesterday, but attachment is not verified received in ticket records.`,
            category: 'BATTERY_CHARGING',
            customerIntent: 'Charging failure follow-up / video submission status',
            identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
            priority: 'MEDIUM',
            recommendedAction: 'REQUEST_VIDEO_REUPLOAD_OR_LINK',
            draftReply: `Dear ${customerName},\n\nThank you for following up with us regarding your ${productName}.\n\nWe checked our ticket records for the charging video you mentioned sending yesterday. While we acknowledge your confirmation, the file attachment does not appear in our portal yet (email gateways occasionally filter video files over 15MB).\n\nTo ensure we can authorize your replacement without delay, could you please:\n1. Re-attach the video directly to this ticket, or\n2. Share a Google Drive or cloud link with view access.\n\nAs soon as our technical specialist views the 5-second video showing the watch connected to the charger, we will immediately initiate your replacement RMA.\n\nThank you for your patience!\n\nWarm regards,\nNoise Technical Support Team`,
            internalNextAction: 'EVIDENCE VERIFICATION GAP: Customer claims video was sent, but attachments array is empty in database. Help customer share cloud link or re-upload.',
            confidence: 0.91,
            requiresHumanReview: true,
            escalationFlag: false,
            escalationReason: null,
            missingInformation: ['charging_video_file_confirmation'],
            evidence: [
              {
                sourceType: 'KNOWLEDGE_BASE',
                sourceId: 'KB-BAT-01',
                sourceTitle: 'Troubleshooting Smartwatch Battery Drain & Fast Depletion',
                excerpt: 'Support agents must verify video evidence of charger connection failure before issuing an authorized hardware replacement RMA.',
                relevanceScore: 0.95,
                explanation: 'Ensures replacement unit is not booked without technical validation.'
              }
            ],
            policyFlags: [
              'Evidence Note: Customer stated video was sent, but file attachment is not recorded in database. Politely request re-upload.'
            ],
            toolCalls: toolCallRecords
          };
        }
      }

      // First Turn: Customer reporting device not charging
      return {
        ticketSummary: `Customer reporting ${productName} is completely unresponsive and not charging when connected.`,
        category: 'BATTERY_CHARGING',
        customerIntent: 'Smartwatch charging failure troubleshooting',
        identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
        priority: 'MEDIUM',
        recommendedAction: 'PROVIDE_CHARGER_TROUBLESHOOTING_AND_REQUEST_VIDEO',
        draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support. We are sorry to hear that your ${productName} is not responding to its charger.\n\nTo help get your device powered on, please try the following steps (KB-BAT-01):\n1. Power Adapter: Use ONLY a 5V/1A or 5V/2A standard USB adapter. Do NOT use 65W/120W smartphone turbo chargers, as they trigger safety power lockouts.\n2. Clean Pins: Gently wipe the gold magnetic charging pins on the watch back with a dry microfiber cloth to remove any dust or oxidation.\n3. Wall Outlet: Connect the watch directly to a wall outlet for 45 minutes uninterrupted without moving the magnetic cable.\n\nIf the screen still does not display the charging icon after 45 minutes, please reply with a short 5-second video clip showing the watch connected to power. Once verified, we will arrange a complimentary warranty replacement.\n\nWarm regards,\nNoise Technical Support Team`,
        internalNextAction: 'FIRST-TURN CHARGING DIAGNOSTIC: Provided 5V adapter and pin cleaning instructions. Requested 5-second charging demonstration video if uncharging persists.',
        confidence: 0.93,
        requiresHumanReview: true,
        escalationFlag: false,
        escalationReason: null,
        missingInformation: ['charging_video_demonstration'],
        evidence: [
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BAT-01',
            sourceTitle: 'Troubleshooting Smartwatch Battery Drain & Fast Depletion',
            excerpt: 'Use ONLY a 5V/1A or 5V/2A standard USB adapter. Do NOT use ultra-fast 65W/120W smartphone chargers. Clean magnetic pogo pins with dry cloth.',
            relevanceScore: 0.98,
            explanation: 'Addresses electrical safety lockouts and dirty magnetic contacts.'
          }
        ],
        policyFlags: ['Initial diagnostic dispatched. Awaiting customer confirmation or charging video.'],
        toolCalls: toolCallRecords
      };
    }

    // 6. Multi-Issue Handling (e.g., Charging + Bluetooth, or Sleep Tracking + Sync)
    if (ruleEvaluation.multiCategories && ruleEvaluation.multiCategories.length > 1) {
      const issues = ruleEvaluation.multiCategories.map(c => c.replace('_', ' ')).join(' and ');
      return {
        ticketSummary: `Customer reporting multiple issues: ${issues} on ${productName}.`,
        category: ruleEvaluation.multiCategories[0],
        customerIntent: `Resolution for multiple defects: ${issues}`,
        identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
        priority: 'HIGH',
        recommendedAction: 'PROVIDE_COMPREHENSIVE_MULTI_ISSUE_RESOLUTION',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support. We understand you are facing two separate issues with your ${productName}: charging performance and Bluetooth connection stability.\n\nHere is how we can resolve both:\n\n1. Charging Issue (KB-BAT-01):\n- Connect the device exclusively to a 5V/1A or 5V/2A adapter (avoid ultra-fast 65W phone chargers).\n- Wipe the magnetic charging pins on the watch and cable with a dry cloth.\n\n2. Bluetooth & App Sync Issue (KB-BLE-01):\n- Open phone Bluetooth settings -> select your Noise device -> tap "Forget This Device".\n- In phone app permissions, set Location and Nearby Devices to "Always Allow".\n- Open the NoiseFit app and re-pair directly from inside the app.\n\nPlease try these combined steps. If either issue persists, let us know and we will proceed with an expedited warranty replacement.\n\nWarm regards,\nNoise Technical Support Team`,
        internalNextAction: 'MULTI-ISSUE RESOLUTION: Customer reported both charging and Bluetooth failure. Addressed both without omitting secondary defect. Escalate to RMA if reboot fails.',
        confidence: 0.92,
        requiresHumanReview: true,
        escalationFlag: false,
        escalationReason: null,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BAT-01',
            sourceTitle: 'Troubleshooting Smartwatch Battery Drain & Fast Depletion',
            excerpt: 'Standard adapter and pin cleaning resolves charging failure.',
            relevanceScore: 0.95,
            explanation: 'Resolves charging issue.'
          },
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BLE-01',
            sourceTitle: 'Bluetooth Pairing & NoiseFit App Connectivity Guide',
            excerpt: 'Unpair from phone native Bluetooth settings first. Ensure Location/Nearby Devices permission is set to Always Allow.',
            relevanceScore: 0.95,
            explanation: 'Resolves Bluetooth disconnection.'
          }
        ],
        policyFlags: ['Multiple issues addressed in single comprehensive reply.'],
        toolCalls: toolCallRecords
      };
    }

    // 7. Missing Sleep Data Tracking (Luna Ring or Smartwatch)
    if (lowerText.includes('sleep') || category === 'BLUETOOTH_PAIRING' && lowerText.includes('sleep')) {
      return {
        ticketSummary: `Missing sleep stage tracking data in NoiseFit app for ${productName}.`,
        category: 'BLUETOOTH_PAIRING',
        customerIntent: 'Sleep tracking metrics calibration and sync',
        identifiedOrderOrDevice: order ? `${order.orderNumber} (${productName})` : productName,
        priority: 'MEDIUM',
        recommendedAction: 'PROVIDE_SLEEP_SENSOR_CALIBRATION_GUIDE',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support regarding missing sleep data on your ${productName}.\n\nFor accurate sleep stage recording and sync, please review the following calibration tips (KB-BLE-01):\n\n1. Snug Fit: Wear the device snugly one finger-width above the wrist bone (or on your index/middle finger for Luna Ring). A loose fit prevents optical PPG sensors from tracking nighttime REM intervals.\n2. Minimum Duration: Sleep metrics require a minimum of 3 consecutive hours of rest to populate stage analytics.\n3. Background App Sync: Ensure Background App Refresh and Battery Optimization are set to "Unrestricted" for the NoiseFit app.\n4. Manual Sync: In the morning, open the NoiseFit app home screen and swipe downwards to force a cloud sync while Bluetooth is active.\n\nIf sleep data remains absent tomorrow morning, please let us know your phone OS version so we can run an app diagnostic.\n\nWarm regards,\nNoise Health & Wearable Support Team`,
        internalNextAction: 'HEALTH SENSOR CALIBRATION: Provided optical sensor fit and NoiseFit background refresh instructions.',
        confidence: 0.93,
        requiresHumanReview: true,
        escalationFlag: false,
        escalationReason: null,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'KNOWLEDGE_BASE',
            sourceId: 'KB-BLE-01',
            sourceTitle: 'Bluetooth Pairing & NoiseFit App Connectivity Guide',
            excerpt: 'Background App Refresh and Location permissions must be enabled for health sensor data synchronization.',
            relevanceScore: 0.94,
            explanation: 'Ensures nightly health data sync to NoiseFit cloud.'
          }
        ],
        policyFlags: ['Sleep sensor calibration guidance provided.'],
        toolCalls: toolCallRecords
      };
    }

    // 8. Exchange Request (Size / Color)
    if (lowerText.includes('exchange') || category === 'RETURN_REQUEST' && lowerText.includes('exchange')) {
      const returnEval = ruleEvaluation.returnEvaluation;
      const isEligible = returnEval ? returnEval.isEligible : true;

      if (!isEligible) {
        return {
          ticketSummary: `Exchange request for ${productName} outside 7-day policy window (${returnEval.daysElapsed} days elapsed).`,
          category: 'RETURN_REQUEST',
          customerIntent: 'Exchange request past eligible SLA',
          identifiedOrderOrDevice: order ? order.orderNumber : null,
          priority: 'MEDIUM',
          recommendedAction: 'EXCHANGE_SLA_LAPSED_REVIEW',
          draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Customer Support regarding Order #${orderNumber}.\n\nUnder our 7-Day Return and Replacement Policy (POL-RET-01), size and color exchanges must be initiated within 7 calendar days of courier delivery. As your order was delivered ${returnEval.daysElapsed} days ago, our system cannot automatically generate an exchange pickup.\n\nHowever, your device remains fully covered under our 1-Year Limited Manufacturing Warranty (POL-WAR-01) for any hardware defects. We would be happy to explore accessory strap options or loyalty discount vouchers if applicable.\n\nWarm regards,\nNoise Customer Care Team`,
          internalNextAction: 'EXCHANGE WINDOW LAPSED: Delivered > 7 days ago. Inform customer of SLA limit while preserving customer loyalty.',
          confidence: 0.91,
          requiresHumanReview: true,
          escalationFlag: false,
          escalationReason: null,
          missingInformation: [],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-RET-01',
              sourceTitle: '7-Day Return and Replacement Policy for Wearables',
              excerpt: 'Returns and replacements are accepted within 7 calendar days from the verified delivery date recorded by the courier partner.',
              relevanceScore: 0.97,
              explanation: `Delivery occurred ${returnEval.daysElapsed} days ago, exceeding 7-day limit.`
            }
          ],
          policyFlags: ['Exchange SLA lapsed (> 7 days).'],
          toolCalls: toolCallRecords
        };
      } else {
        return {
          ticketSummary: `Eligible exchange request for ${productName} (Order #${orderNumber}) within 7-day window.`,
          category: 'RETURN_REQUEST',
          customerIntent: 'Exchange request within 7-day SLA',
          identifiedOrderOrDevice: order ? order.orderNumber : null,
          priority: 'MEDIUM',
          recommendedAction: 'AUTHORIZE_EXCHANGE_PICKUP',
          draftReply: `Dear ${customerName},\n\nThank you for contacting Noise Support regarding Order #${orderNumber}.\n\nWe are pleased to confirm that your exchange request is within our 7-Day Return & Replacement Policy (POL-RET-01). We have initiated an exchange request for your ${productName}.\n\nNext Steps:\n1. Please confirm the requested replacement size/color.\n2. Keep the unit packed securely in its original packaging with all included accessories.\n3. Our courier representative will collect the item from ${order?.deliveryAddress || 'your registered address'} within 48 to 72 business hours.\n\nOnce the exchange item arrives at our fulfillment hub, the replacement will be dispatched with priority courier delivery.\n\nWarm regards,\nNoise Customer Care Team`,
          internalNextAction: 'EXCHANGE QUALIFIED: Order delivered within 7-day return window. Confirm requested size/color and schedule reverse pickup.',
          confidence: 0.95,
          requiresHumanReview: true,
          escalationFlag: false,
          escalationReason: null,
          missingInformation: ['replacement_size_or_color_preference'],
          evidence: [
            {
              sourceType: 'POLICY',
              sourceId: 'POL-RET-01',
              sourceTitle: '7-Day Return and Replacement Policy for Wearables',
              excerpt: 'Returns and replacements are accepted within 7 calendar days from the verified delivery date recorded by the courier partner.',
              relevanceScore: 0.98,
              explanation: 'Order is within active 7-day window.'
            }
          ],
          policyFlags: ['Eligible for exchange reverse logistics.'],
          toolCalls: toolCallRecords
        };
      }
    }

    // 9. Delivery Delay / Shipping Issues
    if (category === 'DELIVERY_DELAY' && order) {
      const carrier = order.carrier || 'our courier partner';
      const tracking = order.trackingNumber || 'assigned tracking number';

      return {
        ticketSummary: `Shipment delay for order #${orderNumber} via ${carrier} (Tracking: ${tracking}).`,
        category: 'DELIVERY_DELAY',
        customerIntent: 'In-transit shipment tracking escalation',
        identifiedOrderOrDevice: `Order #${orderNumber} (${carrier} - ${tracking})`,
        priority: 'HIGH',
        recommendedAction: 'ESCALATE_COURIER_SLA',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out regarding Order #${orderNumber}.\n\nWe sincerely apologize for the delay in receiving your ${productName}. We have reviewed the transit logs with ${carrier} (Tracking: ${tracking}). Under our Delivery SLA Guidelines (POL-DEL-01), when package movement shows no hub updates past SLA, we initiate an immediate logistics escalation.\n\nWe have escalated your shipment directly to ${carrier}'s hub operations for priority dispatch. We are actively tracking this package and will provide you with a definitive delivery timeline update within 24 hours.\n\nThank you for your patience and understanding.\n\nWarm regards,\nNoise Logistics Support Team`,
        internalNextAction: `ESCALATE COURIER: Open ticket with ${carrier} logistics desk for tracking ${tracking}. Await hub scan within 24 hours.`,
        confidence: 0.94,
        requiresHumanReview: true,
        escalationFlag: false,
        escalationReason: null,
        missingInformation: [],
        evidence: [
          {
            sourceType: 'ORDER',
            sourceId: order.orderNumber,
            sourceTitle: `Order #${order.orderNumber}`,
            excerpt: `Status: ${order.orderStatus}, Carrier: ${carrier}, Tracking: ${tracking}`,
            relevanceScore: 0.98,
            explanation: 'Active order record in database currently in transit.'
          },
          {
            sourceType: 'POLICY',
            sourceId: 'POL-DEL-01',
            sourceTitle: 'Delivery Delays, Transit Escalation & RTO Protocol',
            excerpt: 'If tracking shows no hub movement for more than 48 hours past expected SLA, an internal priority investigation ticket is logged with courier logistics.',
            relevanceScore: 0.95,
            explanation: 'Mandates formal courier investigation and proactive customer update.'
          }
        ],
        policyFlags: [`Tracking ${tracking} escalated to ${carrier}.`],
        toolCalls: toolCallRecords
      };
    }

    // 10. Missing Order / Insufficient Context Case
    if (!order && (category === 'DELIVERY_DELAY' || category === 'REFUND_REQUEST' || category === 'RETURN_REQUEST')) {
      return {
        ticketSummary: `Customer raised a ${category.toLowerCase().replace('_', ' ')} inquiry without providing an order number.`,
        category,
        customerIntent: `Unlinked ${category.toLowerCase().replace('_', ' ')} inquiry`,
        identifiedOrderOrDevice: null,
        priority: 'MEDIUM',
        recommendedAction: 'REQUEST_ORDER_DETAILS',
        draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nWe would be happy to assist you with your request. However, we could not find an associated order ID or invoice linked to your inquiry. To help us locate your shipment and verify your policy eligibility, please reply with:\n\n1. Your Noise Order Number (e.g., NOISE-ORD-XXXXX) or registered order email.\n2. A copy or screenshot of your purchase invoice.\n3. The exact product model you received.\n\nOnce received, we will immediately process your request in accordance with our return and delivery guidelines.\n\nWarm regards,\nNoise Customer Care Team`,
        internalNextAction: 'ORDER VERIFICATION MANDATORY: Order record missing in database. Do not authorize refund or replacement until customer supplies order number and invoice.',
        confidence: 0.75,
        requiresHumanReview: true,
        escalationFlag: false,
        escalationReason: null,
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
        policyFlags: ['Missing order ID: Agent must verify invoice credentials before approving.'],
        toolCalls: toolCallRecords
      };
    }

    // 11. General Fallback
    return {
      ticketSummary: `Customer inquiry regarding ${productName || 'Noise product'}: ${ticket.subject}`,
      category: 'GENERAL_INQUIRY',
      customerIntent: 'General product inquiry',
      identifiedOrderOrDevice: order ? order.orderNumber : null,
      priority: ticket.priority || 'LOW',
      recommendedAction: 'PROVIDE_PRODUCT_INFORMATION',
      draftReply: `Dear ${customerName},\n\nThank you for reaching out to Noise Customer Support.\n\nRegarding your inquiry about the ${productName}: we are delighted to assist you! For optimal performance and warranty compliance, we advise following the official instructions in our user guides and knowledge base.\n\nIf you have any further questions or if there is any specific assistance you need regarding your device or order, please reply directly to this message.\n\nWarm regards,\nNoise Customer Care Team`,
      internalNextAction: 'GENERAL INQUIRY: Standard product assistance. Await customer follow-up.',
      confidence: 0.88,
      requiresHumanReview: true,
      escalationFlag: false,
      escalationReason: null,
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
      policyFlags: [],
      toolCalls: toolCallRecords
    };
  }
}
