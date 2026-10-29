import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';

const router = Router();
router.get('/', SettingsController.getSettings);

export default router;
