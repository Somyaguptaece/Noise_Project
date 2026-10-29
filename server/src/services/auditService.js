import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export class AuditService {
  static async logEvent({ ticketId, eventType, actorType = 'AGENT', actorName, metadata = {} }) {
    try {
      const record = await prisma.auditLog.create({
        data: {
          ticketId,
          eventType,
          actorType,
          actorName: actorName || 'Support Agent',
          metadataJson: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });
      logger.info(`Audit log recorded: [${eventType}] on ticket ${ticketId} by ${actorName}`);
      return record;
    } catch (err) {
      logger.error('Failed to write audit log:', err);
      // Non-blocking for primary transaction
      return null;
    }
  }

  static async getTicketAuditTrail(ticketId) {
    return await prisma.auditLog.findMany({
      where: { ticketId },
      orderBy: { timestamp: 'desc' }
    });
  }
}
