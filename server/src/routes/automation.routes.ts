import { Router } from 'express';
import * as automationController from '../controllers/automation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/settings', automationController.getSettings);
router.patch('/settings', automationController.updateSettings);
router.post('/test-message', automationController.sendTestMessage);
router.post('/trigger-check', automationController.triggerCheck);

export default router;
