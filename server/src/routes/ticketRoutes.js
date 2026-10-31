import { Router } from 'express';
import { TicketController } from '../controllers/ticketController.js';
import { validateBody } from '../middleware/validate.js';
import { DraftEditSchema, DraftRejectionSchema } from '../services/ai/schemas.js';

const router = Router();

router.get('/', TicketController.list);
router.get('/:id', TicketController.getById);
router.post('/:id/messages', TicketController.addMessage);
router.get('/:id/generate-draft', TicketController.generateDraft);
router.post('/:id/generate-draft', TicketController.generateDraft);
router.get('/:id/evidence', TicketController.getEvidence);
router.patch('/:id/draft', validateBody(DraftEditSchema), TicketController.editDraft);
router.post('/:id/approve', TicketController.approveDraft);
router.post('/:id/reject', validateBody(DraftRejectionSchema), TicketController.rejectDraft);
router.post('/:id/resolve', TicketController.resolveTicket);

export default router;
