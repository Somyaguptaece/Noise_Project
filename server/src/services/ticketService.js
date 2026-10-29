import { PrismaClient } from '@prisma/client';
import { AuditService } from './auditService.js';
import { AIPipelineService } from './aiPipelineService.js';

const prisma = new PrismaClient();

export class TicketService {
  /**
   * Search, filter, and paginate tickets
   */
  static async listTickets({
    search = '',
    status = '',
    category = '',
    priority = '',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q } } }
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: true,
          product: true,
          order: true,
          drafts: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    ]);

    return {
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Get single ticket with complete workspace context
   */
  static async getTicketById(id) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            orders: {
              include: { product: true },
              orderBy: { purchaseDate: 'desc' }
            }
          }
        },
        order: {
          include: { product: true }
        },
        product: true,
        messages: {
          orderBy: { sentAt: 'asc' }
        },
        drafts: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  /**
   * Add a follow-up message to a ticket (multi-turn conversation)
   * Strips quoted email reply headers and updates ticket state.
   */
  static async addMessage(arg1, arg2 = {}) {
    let ticketId;
    let options = {};
    if (typeof arg1 === 'string') {
      ticketId = arg1;
      options = arg2 || {};
    } else if (arg1 && typeof arg1 === 'object') {
      ticketId = arg1.ticketId;
      options = arg1;
    }

    const {
      messageText,
      content,
      senderType = 'CUSTOMER',
      senderName,
      attachments = []
    } = options;

    const rawText = messageText || content || '';

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const { BusinessRuleEngine } = await import('./businessRuleEngine.js');
    const cleanedText = BusinessRuleEngine.cleanCustomerMessage(rawText);

    const createdMsg = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderType,
        senderName: senderName || (senderType === 'CUSTOMER' ? ticket.customer.name : 'Support Specialist'),
        messageText: cleanedText,
        attachmentsJson: JSON.stringify(attachments),
        sentAt: new Date()
      }
    });

    // Update ticket state when new customer message arrives
    const nextStatus = senderType === 'CUSTOMER' ? 'PROCESSING' : ticket.status;
    const nextAiStatus = senderType === 'CUSTOMER' ? 'PENDING' : ticket.aiStatus;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        aiStatus: nextAiStatus,
        updatedAt: new Date()
      },
      include: {
        customer: true,
        order: { include: { product: true } },
        product: true,
        messages: { orderBy: { sentAt: 'asc' } },
        drafts: { orderBy: { createdAt: 'desc' } }
      }
    });

    await AuditService.logEvent({
      ticketId,
      eventType: senderType === 'CUSTOMER' ? 'CUSTOMER_MESSAGE_RECEIVED' : 'AGENT_MESSAGE_SENT',
      actorType: senderType === 'CUSTOMER' ? 'CUSTOMER' : 'AGENT',
      actorName: senderName || (senderType === 'CUSTOMER' ? ticket.customer.name : 'Support Specialist'),
      metadata: {
        messageId: createdMsg.id,
        attachmentCount: attachments.length,
        status: nextStatus
      }
    });

    return { message: createdMsg, ticket: updatedTicket };
  }

  /**
   * Edit current draft text
   */
  static async editDraft(ticketId, editableReply, agentName = 'Support Agent') {
    const draft = await prisma.resolutionDraft.findFirst({
      where: { ticketId },
      orderBy: { createdAt: 'desc' }
    });

    if (!draft) {
      throw new Error('No AI resolution draft found to edit. Please generate a draft first.');
    }

    const updatedDraft = await prisma.resolutionDraft.update({
      where: { id: draft.id },
      data: {
        editableReply,
        updatedAt: new Date()
      }
    });

    await AuditService.logEvent({
      ticketId,
      eventType: 'DRAFT_EDITED',
      actorType: 'AGENT',
      actorName: agentName,
      metadata: { draftId: draft.id, replyLength: editableReply.length }
    });

    return updatedDraft;
  }

  /**
   * Approve draft
   */
  static async approveDraft(ticketId, agentName = 'Support Agent') {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        drafts: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    if (ticket.status === 'RESOLVED') {
      throw new Error('Cannot approve draft for an already resolved ticket.');
    }

    const draft = ticket.drafts[0];
    if (!draft) {
      throw new Error('No draft exists to approve. Please generate a draft first.');
    }

    const now = new Date();

    const [updatedDraft, updatedTicket] = await Promise.all([
      prisma.resolutionDraft.update({
        where: { id: draft.id },
        data: {
          approvedAt: now,
          approvedBy: agentName,
          rejectedAt: null,
          rejectionReason: null
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'APPROVED'
        }
      })
    ]);

    await AuditService.logEvent({
      ticketId,
      eventType: 'DRAFT_APPROVED',
      actorType: 'AGENT',
      actorName: agentName,
      metadata: {
        draftId: draft.id,
        action: draft.recommendedAction,
        deliveryStatus: 'Approved — ready to send (human approved)'
      }
    });

    return { ticket: updatedTicket, draft: updatedDraft };
  }

  /**
   * Reject draft
   */
  static async rejectDraft(ticketId, reason, agentName = 'Support Agent') {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        drafts: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const draft = ticket.drafts[0];
    if (!draft) {
      throw new Error('No draft exists to reject.');
    }

    const now = new Date();

    const [updatedDraft, updatedTicket] = await Promise.all([
      prisma.resolutionDraft.update({
        where: { id: draft.id },
        data: {
          rejectedAt: now,
          rejectionReason: reason
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'REJECTED'
        }
      })
    ]);

    await AuditService.logEvent({
      ticketId,
      eventType: 'DRAFT_REJECTED',
      actorType: 'AGENT',
      actorName: agentName,
      metadata: { draftId: draft.id, reason }
    });

    return { ticket: updatedTicket, draft: updatedDraft };
  }

  /**
   * Mark ticket as Resolved
   */
  static async resolveTicket(ticketId, agentName = 'Support Agent', notes = '') {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    await AuditService.logEvent({
      ticketId,
      eventType: 'TICKET_RESOLVED',
      actorType: 'AGENT',
      actorName: agentName,
      metadata: { notes }
    });

    return updatedTicket;
  }
}
