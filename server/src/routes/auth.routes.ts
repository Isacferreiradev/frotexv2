import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, resetPasswordLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.get('/me', authenticate, authCtrl.me);
router.post('/login', authLimiter, authCtrl.login);
router.post('/register', authLimiter, authCtrl.register);
router.get('/verify', authCtrl.verify);
router.post('/resend-verification', authLimiter, authCtrl.resendVerification);
router.post('/refresh', authCtrl.refresh);
router.post('/change-password', authenticate, authCtrl.changePassword);
router.put('/profile', authenticate, authCtrl.updateProfile);
router.post('/request-reset', resetPasswordLimiter, authCtrl.requestReset);
router.post('/reset-password', resetPasswordLimiter, authCtrl.resetPassword);

export default router;
