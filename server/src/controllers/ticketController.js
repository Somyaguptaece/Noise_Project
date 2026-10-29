import { TicketService } from '../services/ticketService.js';
import { AIPipelineService } from '../services/aiPipelineService.js';
import { retrievalService } from '../services/retrievalService.js';

export class TicketController {
  static async list(req, res, next) {
    try {
      const data = await TicketService.listTickets(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const ticket = await TicketService.getTicketById(req.params.id);
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  static async generateDraft(req, res, next) {
    try {
      const { agentName } = req.body || {};
      const result = await AIPipelineService.runPipeline(req.params.id, agentName || 'Support Agent');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getEvidence(req, res, next) {
    try {
      const ticket = await TicketService.getTicketById(req.params.id);
      const queryText = `${ticket.subject} ${(ticket.messages || []).map(m => m.messageText).join(' ')}`;
      const evidence = await retrievalService.retrieveRelevantPolicies(queryText, ticket.category, 5);
      res.json({ success: true, data: { ticketId: ticket.id, evidence } });
    } catch (err) {
      next(err);
    }
  }

  static async editDraft(req, res, next) {
    try {
      const { editableReply, agentName } = req.body;
      const updated = await TicketService.editDraft(req.params.id, editableReply, agentName || 'Support Agent');
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async approveDraft(req, res, next) {
    try {
      const { agentName } = req.body || {};
      const result = await TicketService.approveDraft(req.params.id, agentName || 'Support Agent');
      res.json({
        success: true,
        message: 'Draft approved successfully. Status: Ready to send (Human Approved).',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectDraft(req, res, next) {
    try {
      const { reason, agentName } = req.body;
      const result = await TicketService.rejectDraft(req.params.id, reason, agentName || 'Support Agent');
      res.json({
        success: true,
        message: 'Draft rejected with reason recorded in audit log.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveTicket(req, res, next) {
    try {
      const { agentName, notes } = req.body || {};
      const result = await TicketService.resolveTicket(req.params.id, agentName || 'Support Agent', notes);
      res.json({
        success: true,
        message: 'Ticket successfully marked as RESOLVED.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async addMessage(req, res, next) {
    try {
      const { content, senderType, senderName, attachments } = req.body;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required.'
        });
      }
      const result = await TicketService.addMessage({
        ticketId: req.params.id,
        senderType: senderType || 'CUSTOMER',
        senderName,
        content,
        attachments: attachments || []
      });
      res.status(201).json({
        success: true,
        message: 'Message added successfully and ticket state updated.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
