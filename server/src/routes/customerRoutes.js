import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';

const router = Router();
router.get('/', CustomerController.list);
router.get('/:id', CustomerController.getById);

export default router;
