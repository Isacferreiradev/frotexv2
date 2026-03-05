import { Router } from 'express';
import * as onboardingCtrl from '../controllers/onboarding.controller';

const router = Router();

router.get('/status', onboardingCtrl.getStatus);
router.post('/finish', onboardingCtrl.finishOnboarding);

export default router;
