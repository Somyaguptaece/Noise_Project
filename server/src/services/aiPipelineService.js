import { PrismaClient } from '@prisma/client';
import { retrievalService } from './retrievalService.js';
import { BusinessRuleEngine } from './businessRuleEngine.js';
import { AIProviderFactory } from './ai/aiProvider.js';
import { AuditService } from './auditService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export class AIPipelineService {
  /**
   * Runs the complete end-to-end AI Resolution Pipeline for a given ticket ID
   */
  static async runPipeline(ticketId, triggerActor = 'Noise Support Agent') {
    logger.info(`Starting AI Resolution Pipeline for ticket: ${ticketId}`);

    // Stage 1: Ticket Ingestion
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          include: {
            orders: {
              include: { product: true }
            }
          }
        },
        order: {
          include: { product: true }
        },
        product: true,
        messages: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    // Update status to PROCESSING
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { aiStatus: 'ANALYZING', status: 'PROCESSING' }
    });

    try {
      // Stage 2: Intent & Entity Extraction
      const customerMessagesText = ticket.messages
        .filter(m => m.senderType === 'CUSTOMER')
        .map(m => m.messageText)
        .join(' ');
      const fullText = `${ticket.subject} ${customerMessagesText}`;

      const { extractedOrderNumber, detectedCategory } = BusinessRuleEngine.extractEntities(ticket);

      // Attempt linking order if missing
      let order = ticket.order;
      if (!order && extractedOrderNumber) {
        const foundOrder = await prisma.order.findUnique({
          where: { orderNumber: extractedOrderNumber },
          include: { product: true }
        });
        if (foundOrder) {
          order = foundOrder;
          // Associate order to ticket
          await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { orderId: foundOrder.id, productId: foundOrder.productId }
          });
          logger.info(`Extracted and linked order ${extractedOrderNumber} to ticket ${ticketId}`);
        }
      }

      // If order has product, resolve product
      const product = order?.product || ticket.product;

      // Stage 3: Context Retrieval (TF-IDF & Policy Match)
      const retrievedPolicies = await retrievalService.retrieveRelevantPolicies(
        fullText,
        detectedCategory,
        4
      );

      // Stage 4: Deterministic Evidence Evaluation & Business Rules
      const ruleEvaluation = BusinessRuleEngine.evaluateRules({
        ticket,
        order,
        product,
        customerMessagesText
      });

      // Assemble Pipeline Context
      const pipelineContext = {
        ticket,
        customer: ticket.customer,
        order,
        product,
        retrievedPolicies,
        ruleEvaluation
      };

      // Stage 5: Resolution Generation via replaceable AI Provider
      const aiProvider = AIProviderFactory.getProvider();
      let draftResult;

      try {
        draftResult = await aiProvider.generateResolutionDraft(pipelineContext);
      } catch (aiErr) {
        // When AI_PROVIDER=gemini, do not silently fall back to mock output on API errors unless explicitly enabled.
        if ((config.aiProvider === 'gemini' || aiProvider.name === 'AI_GEMINI') && process.env.ALLOW_AI_FALLBACK !== 'true') {
          const safeMessage = (aiErr.message || String(aiErr))
            .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
            .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, '[REDACTED_EMAIL]')
            .replace(/\b\d{10}\b/g, '[REDACTED_PHONE]');

          logger.error(`Live Gemini Provider generation failed without fallback: ${safeMessage}`);
          throw new Error(`Live Gemini generation failed: ${safeMessage}`);
        }

        logger.warn('Primary AI Provider generation encountered error, falling back to deterministic mock generator:', aiErr);
        // Fallback to deterministic mock provider
        const { MockAIProvider } = await import('./ai/mockProvider.js');
        const fallbackProvider = new MockAIProvider();
        draftResult = await fallbackProvider.generateResolutionDraft(pipelineContext);
        if (!draftResult.policyFlags) draftResult.policyFlags = [];
        draftResult.policyFlags.push('Notice: Draft generated using Grounded Knowledge Engine due to temporary upstream AI provider downtime.');
      }

      // Combine retrieved evidence and order evidence
      const finalEvidence = [...draftResult.evidence];

      // Add order citation if available and not already cited
      if (order && !finalEvidence.some(e => e.sourceId === order.orderNumber)) {
        finalEvidence.push({
          sourceType: 'ORDER',
          sourceId: order.orderNumber,
          sourceTitle: `Order #${order.orderNumber} - ${product?.name || 'Wearable'}`,
          excerpt: `Status: ${order.orderStatus}, Purchased: ${new Date(order.purchaseDate).toLocaleDateString('en-IN')}, Amount: Rs. ${order.orderAmount}`,
          relevanceScore: 0.96,
          explanation: 'Official verified order and invoice record from Noise database.'
        });
      }

      // Merge policy flags from rule engine
      const combinedFlags = Array.from(new Set([
        ...(draftResult.policyFlags || []),
        ...(ruleEvaluation.flags || [])
      ]));

      const combinedMissingInfo = Array.from(new Set([
        ...(draftResult.missingInformation || []),
        ...(ruleEvaluation.missingInformation || [])
      ]));

      // Determine next ticket status
      // If requires human review, escalation flag, or flags/missing info exist -> NEEDS_REVIEW
      const isEscalated = draftResult.escalationFlag || ruleEvaluation.escalationFlag || false;
      const escalationReason = draftResult.escalationReason || ruleEvaluation.escalationReason || null;

      const nextStatus = (isEscalated || ruleEvaluation.isPromptInjection || combinedMissingInfo.length > 0 || combinedFlags.length > 1)
        ? 'NEEDS_REVIEW'
        : 'DRAFT_READY';

      // Stage 6: Persist ResolutionDraft with complete 9-field structure
      const createdDraft = await prisma.resolutionDraft.create({
        data: {
          ticketId: ticket.id,
          ticketSummary: draftResult.ticketSummary,
          detectedCategory: draftResult.category,
          customerIntent: draftResult.customerIntent || draftResult.category,
          identifiedOrderOrDevice: draftResult.identifiedOrderOrDevice || (order ? order.orderNumber : null),
          urgency: draftResult.priority === 'URGENT' ? 'CRITICAL' : (draftResult.priority || 'MEDIUM'),
          recommendedAction: draftResult.recommendedAction,
          draftReply: draftResult.draftReply,
          editableReply: draftResult.draftReply,
          internalNextAction: draftResult.internalNextAction || 'Review evidence citations and verify order credentials.',
          confidence: draftResult.confidence,
          requiresHumanReview: true, // Always true!
          escalationFlag: isEscalated,
          escalationReason: escalationReason,
          missingInformation: JSON.stringify(combinedMissingInfo),
          evidenceCitations: JSON.stringify(finalEvidence),
          policyFlags: JSON.stringify(combinedFlags),
          toolCalls: JSON.stringify(draftResult.toolCalls || []),
          generatedBy: aiProvider.name
        }
      });

      // Update SupportTicket
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: nextStatus,
          aiStatus: 'COMPLETED',
          confidenceScore: draftResult.confidence,
          category: draftResult.category
        },
        include: {
          customer: true,
          order: { include: { product: true } },
          product: true,
          messages: true,
          drafts: { orderBy: { createdAt: 'desc' } }
        }
      });

      // Audit Log Event with chosen tools and tool call metadata
      const toolsUsed = (draftResult.toolCalls || []).map(t => t.toolName);
      await AuditService.logEvent({
        ticketId: ticket.id,
        eventType: 'DRAFT_GENERATED',
        actorType: 'AI',
        actorName: `Noise Resolve AI (${aiProvider.name})`,
        metadata: {
          draftId: createdDraft.id,
          action: draftResult.recommendedAction,
          confidence: draftResult.confidence,
          status: nextStatus,
          escalationFlag: isEscalated,
          escalationReason: escalationReason,
          toolsUsed,
          toolCallsCount: toolsUsed.length,
          evidenceCount: finalEvidence.length
        }
      });

      logger.info(`AI Resolution Draft generated successfully for ticket ${ticketId}. Status: ${nextStatus}`);

      return {
        ticket: updatedTicket,
        draft: createdDraft,
        evidence: finalEvidence,
        ruleEvaluation
      };
    } catch (pipelineErr) {
      logger.error(`AI Resolution Pipeline failed for ticket ${ticketId}:`, pipelineErr);
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { aiStatus: 'FAILED', status: 'NEEDS_REVIEW' }
      });
      throw pipelineErr;
    }
  }
}
