import { AIProviderFactory } from '../services/ai/aiProvider.js';
import { config } from '../config/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const providerInfo = AIProviderFactory.getProviderInfo();
      const dbConnected = true;

      const [ticketCount, policyCount] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.policyDocument.count()
      ]);

      res.json({
        success: true,
        data: {
          app: {
            name: config.appName,
            brand: config.brandName,
            version: '1.0.0',
            environment: config.nodeEnv
          },
          ai: providerInfo,
          database: {
            connected: dbConnected,
            type: 'SQLite (Prisma ORM)',
            ticketCount,
            policyCount
          },
          guardrails: {
            strictHumanInTheLoop: true,
            promptInjectionNeutralizer: true,
            deterministicPolicyValidation: true,
            autoSendOutboundDisabled: true
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
