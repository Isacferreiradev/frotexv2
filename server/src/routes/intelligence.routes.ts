import { Router } from 'express';
import * as intelligenceCtrl from '../controllers/intelligence.controller';

const router = Router();

router.get('/roi', intelligenceCtrl.getRoiInsights);
router.get('/cashflow', intelligenceCtrl.getCashFlowIntelligence);
router.get('/customers-report', intelligenceCtrl.getNewCustomers);
router.get('/operational-summary', intelligenceCtrl.getOperationalSummary);

export default router;
