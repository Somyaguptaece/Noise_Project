import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledgeController.js';

const router = Router();
router.get('/', KnowledgeController.list);
router.get('/:id', KnowledgeController.getById);

export default router;
