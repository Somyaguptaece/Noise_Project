import { PrismaClient } from '@prisma/client';
import { retrievalService } from './retrievalService.js';
import { evaluateWarrantyStatus, evaluateReturnStatus, evaluateDOAStatus } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * 1. get_ticket_history(ticket_id)
 * Retrieves complete multi-turn conversation history, customer profile, and linked order context.
 */
export async function get_ticket_history(ticket_id) {
  if (!ticket_id || typeof ticket_id !== 'string' || !ticket_id.trim()) {
    return {
      success: false,
      error: 'Invalid or missing ticket_id parameter'
    };
  }

  const query = ticket_id.trim();

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [
          { id: query },
          { ticketNumber: query }
        ]
      },
      include: {
        customer: true,
        order: { include: { product: true } },
        product: true,
        messages: { orderBy: { sentAt: 'asc' } }
      }
    });

    if (!ticket) {
      return {
        success: false,
        error: `Ticket not found for identifier: ${query}`
      };
    }

    // Extract verified attachments across conversation history
    const allAttachments = [];
    for (const msg of ticket.messages) {
      try {
        const atts = JSON.parse(msg.attachmentsJson || '[]');
        if (Array.isArray(atts)) {
          atts.forEach(a => allAttachments.push({ ...a, senderType: msg.senderType, sentAt: msg.sentAt }));
        }
      } catch {
        // ignore malformed attachment json
      }
    }

    // Check if a charging video was verified as received
    const hasVerifiedVideo = allAttachments.some(a =>
      (a.type === 'video' || (a.filename && a.filename.includes('video'))) && a.verifiedReceipt === true
    );

    // Check if customer previously claimed sending it without verified receipt
    const customerClaimedVideo = ticket.messages.some(m =>
      m.senderType === 'CUSTOMER' && /sent\s+(the\s+)?(charging\s+)?video/i.test(m.messageText)
    );

    return {
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      customer: {
        id: ticket.customer.id,
        externalId: ticket.customer.externalId,
        name: ticket.customer.name,
        email: ticket.customer.email,
        phone: ticket.customer.phone,
        tier: ticket.customer.tier
      },
      orderId: ticket.orderId,
      orderNumber: ticket.order?.orderNumber || null,
      productName: ticket.product?.name || ticket.order?.product?.name || null,
      messageCount: ticket.messages.length,
      messages: ticket.messages.map(m => ({
        id: m.id,
        senderType: m.senderType,
        senderName: m.senderName,
        messageText: m.messageText,
        sentAt: m.sentAt,
        attachments: (() => {
          try { return JSON.parse(m.attachmentsJson || '[]'); } catch { return []; }
        })()
      })),
      verifiedAttachments: allAttachments,
      evidenceStatus: {
        hasVerifiedVideo,
        customerClaimedVideo,
        videoStatus: hasVerifiedVideo
          ? 'VERIFIED_ON_FILE'
          : customerClaimedVideo
          ? 'CLAIMED_BY_CUSTOMER_NOT_VERIFIED_ON_FILE'
          : 'NOT_SUBMITTED'
      }
    };
  } catch (err) {
    logger.error('Error executing get_ticket_history:', err);
    return {
      success: false,
      error: `Failed to retrieve ticket history: ${err.message}`
    };
  }
}

/**
 * 2. lookup_order(order_id)
 * Retrieves verified order records, purchase date, delivery status, and calculated warranty/return eligibility.
 */
export async function lookup_order(order_id) {
  if (!order_id || typeof order_id !== 'string' || !order_id.trim()) {
    return {
      success: false,
      found: false,
      error: 'Invalid or missing order_id parameter'
    };
  }

  const query = order_id.trim();

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: query },
          { orderNumber: query }
        ]
      },
      include: {
        customer: true,
        product: true
      }
    });

    if (!order) {
      return {
        success: false,
        found: false,
        error: `Order not found for identifier: ${query}`
      };
    }

    const warrantyMonths = order.product?.warrantyMonths || 12;
    const returnWindowDays = order.product?.returnWindowDays || 7;

    const warrantyEval = evaluateWarrantyStatus(order.purchaseDate, warrantyMonths);
    const returnEval = evaluateReturnStatus(order.deliveryDate, returnWindowDays);
    const doaEval = evaluateDOAStatus(order.deliveryDate, 48);

    return {
      success: true,
      found: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customer?.name,
        customerEmail: order.customer?.email,
        productId: order.productId,
        productName: order.product?.name,
        productSku: order.product?.sku,
        productCategory: order.product?.category,
        purchaseDate: order.purchaseDate,
        deliveryDate: order.deliveryDate,
        orderStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        deliveryAddress: order.deliveryAddress,
        orderAmount: order.orderAmount,
        currency: order.currency,
        warrantyMonths,
        returnWindowDays,
        warrantyEvaluation: warrantyEval,
        returnEvaluation: returnEval,
        doaEvaluation: doaEval
      }
    };
  } catch (err) {
    logger.error('Error executing lookup_order:', err);
    return {
      success: false,
      found: false,
      error: `Failed to lookup order: ${err.message}`
    };
  }
}

/**
 * 3. search_support_policy(query)
 * Searches the versioned support and troubleshooting policy knowledge base.
 */
export async function search_support_policy(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      success: true,
      query: '',
      count: 0,
      matches: []
    };
  }

  const cleanQuery = query.trim();

  try {
    const results = await retrievalService.retrieveRelevantPolicies(cleanQuery, null, 5);

    return {
      success: true,
      query: cleanQuery,
      count: results.length,
      matches: results.map(r => ({
        id: r.sourceId,
        title: r.sourceTitle,
        category: r.sourceType,
        excerpt: r.excerpt,
        relevanceScore: r.relevanceScore,
        explanation: r.explanation
      }))
    };
  } catch (err) {
    logger.error('Error executing search_support_policy:', err);
    return {
      success: false,
      query: cleanQuery,
      count: 0,
      matches: [],
      error: `Policy search failed: ${err.message}`
    };
  }
}

/**
 * Tool dispatcher mapping exact names to implementations
 */
export async function executeToolCall(toolName, args = {}) {
  const start = Date.now();
  let result;
  let isError = false;

  try {
    switch (toolName) {
      case 'get_ticket_history':
        result = await get_ticket_history(args.ticket_id || args.ticketId);
        break;
      case 'lookup_order':
        result = await lookup_order(args.order_id || args.orderId);
        break;
      case 'search_support_policy':
        result = await search_support_policy(args.query);
        break;
      default:
        isError = true;
        result = { success: false, error: `Unknown tool function: ${toolName}` };
    }
  } catch (err) {
    isError = true;
    result = { success: false, error: err.message };
  }

  const executionRecord = {
    toolName,
    arguments: args,
    result,
    isError: isError || (result && result.success === false),
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString()
  };

  logger.info(`Tool executed: [${toolName}]`, { isError: executionRecord.isError, durationMs: executionRecord.durationMs });
  return executionRecord;
}

/**
 * OpenAI & Gemini compatible tool schemas
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'get_ticket_history',
    description: 'Retrieve complete multi-turn conversation history, customer profile, and prior evidence attachments for a ticket ID.',
    parameters: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'The unique ticket ID or ticketNumber (e.g. TCK-2026-1001)' }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'lookup_order',
    description: 'Lookup stored order record, purchase date, delivery status, and calculate warranty and return eligibility.',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'The order number (e.g. NOISE-ORD-90212) or order database ID' }
      },
      required: ['order_id']
    }
  },
  {
    name: 'search_support_policy',
    description: 'Search the authoritative Noise policy and troubleshooting knowledge base by keyword or issue description.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. smartwatch charging failure, 7-day return policy, Bluetooth pairing)' }
      },
      required: ['query']
    }
  }
];
