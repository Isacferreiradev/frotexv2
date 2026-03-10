import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/info', authenticate, tenantController.getInfo);
router.put('/info', authenticate, tenantController.updateInfo);
router.get('/team', authenticate, tenantController.getTeam);
router.put('/gateway', authenticate, tenantController.updateGateway);
router.get('/subscription', authenticate, tenantController.getSubscriptionStatus);

export default router;
