import { Router } from 'express';
import * as intelligenceCtrl from '../controllers/intelligence.controller';

const router = Router();

router.get('/roi', intelligenceCtrl.getRoiInsights);
router.get('/cashflow', intelligenceCtrl.getCashFlowIntelligence);

export default router;
