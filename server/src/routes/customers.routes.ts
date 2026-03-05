import { Router } from 'express';
import * as customersCtrl from '../controllers/customers.controller';

const router = Router();

router.get('/', customersCtrl.list);
router.get('/:id', customersCtrl.get);
router.get('/:id/360', customersCtrl.get360);
router.post('/', customersCtrl.create);
router.put('/:id', customersCtrl.update);
router.delete('/:id', customersCtrl.remove);

export default router;
