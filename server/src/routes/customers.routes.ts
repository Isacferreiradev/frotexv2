import { Router } from 'express';
import * as customersCtrl from '../controllers/customers.controller';
import { enforceLimit } from '../middleware/subscription.middleware';

const router = Router();

router.get('/', customersCtrl.list);
router.get('/:id', customersCtrl.get);
router.get('/:id/360', customersCtrl.get360);
router.post('/', enforceLimit('customers'), customersCtrl.create);
router.put('/:id', customersCtrl.update);
router.delete('/:id', customersCtrl.remove);

export default router;
