import { Router } from 'express';
import * as toolsCtrl from '../controllers/tools.controller';
import { enforceLimit } from '../middleware/subscription.middleware';

const router = Router();

router.get('/', toolsCtrl.list);
router.get('/:id', toolsCtrl.get);
router.get('/:id/360', toolsCtrl.get360);
router.post('/', enforceLimit('tools'), toolsCtrl.create);
router.put('/:id', toolsCtrl.update);
router.post('/bulk-delete', toolsCtrl.bulkRemove);
router.delete('/:id', toolsCtrl.remove);

export default router;
