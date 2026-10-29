import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    const count = await prisma.policyDocument.count();
    res.json({
      ready: true,
      policiesLoaded: count
    });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

export default router;
