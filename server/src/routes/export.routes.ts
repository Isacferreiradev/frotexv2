import { Router } from 'express';
import * as exportCtrl from '../controllers/export.controller';

const router = Router();

router.post('/', exportCtrl.generateExport);

export default router;
