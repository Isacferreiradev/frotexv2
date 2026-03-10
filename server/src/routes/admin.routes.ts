import { Router } from 'express';
import * as adminCtrl from '../controllers/admin.controller';
import { adminAuth } from '../middleware/admin.middleware';

const router = Router();

/**
 * All routes under /api/admin are protected by Admin API Key
 */
router.use(adminAuth);

// SaaS Overview Metrics
router.get('/overview', adminCtrl.getOverview);

// Tenant Management
router.get('/tenants', adminCtrl.listTenants);
router.get('/tenants/:id', adminCtrl.getTenantDetails);

export default router;
