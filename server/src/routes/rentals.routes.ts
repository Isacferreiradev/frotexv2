import { Router } from 'express';
import * as rentalsCtrl from '../controllers/rentals.controller';
import * as pdfCtrl from '../controllers/pdf.controller';
import { enforceLimit } from '../middleware/subscription.middleware';

const router = Router();

router.get('/dashboard-stats', rentalsCtrl.dashboardStats);
router.get('/expiring', rentalsCtrl.listExpiring);
router.get('/', rentalsCtrl.list);
router.get('/:id', rentalsCtrl.get);
router.get('/:id/contract', pdfCtrl.downloadContract);
router.post('/', enforceLimit('rentals'), rentalsCtrl.create);
router.get('/availability/:toolId', rentalsCtrl.getAvailability);
router.put('/:id/checkin', rentalsCtrl.checkin);

router.put('/:id/cancel', rentalsCtrl.cancel);

export default router;
