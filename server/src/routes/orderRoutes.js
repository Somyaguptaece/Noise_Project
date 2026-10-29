import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';

const router = Router();
router.get('/', OrderController.list);
router.get('/:id', OrderController.getById);

export default router;
