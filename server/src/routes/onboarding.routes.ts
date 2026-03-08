import { Router } from 'express';
import * as onboardingCtrl from '../controllers/onboarding.controller';

const router = Router();

router.get('/status', onboardingCtrl.getStatus);
router.patch('/step', onboardingCtrl.updateStep);
router.post('/finish', onboardingCtrl.finishOnboarding);
router.post('/tour-complete', onboardingCtrl.completeTour);
router.post('/tour-reset', onboardingCtrl.resetTour);

export default router;
