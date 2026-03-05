import { Router } from 'express';
import * as automationController from '../controllers/automation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/settings', automationController.getSettings);
router.patch('/settings', automationController.updateSettings);
router.post('/test-message', automationController.sendTestMessage);
router.post('/trigger-check', automationController.triggerCheck);

// Evolution API WhatsApp Integration
router.post('/whatsapp/connect', automationController.connectWhatsApp);
router.get('/whatsapp/status', automationController.getWhatsAppStatus);
router.delete('/whatsapp/disconnect', automationController.disconnectWhatsApp);

export default router;
