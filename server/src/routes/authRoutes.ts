import { Router } from 'express';
import {
  register,
  login,
  verifyLoginCode,
  resendLoginCode,
  send2FAEmailCode,
  enable2FA,
  disable2FA,
  requestPasswordReset,
  confirmPasswordReset,
  getMe,
  updateMe,
  changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-code', verifyLoginCode);
router.post('/resend-login-code', resendLoginCode);
router.post('/2fa/send-code', protect, send2FAEmailCode);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

export default router;
