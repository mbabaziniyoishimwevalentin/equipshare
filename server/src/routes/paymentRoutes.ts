import { Router } from 'express';
import { initiatePayment, paymentWebhook, verifyPayment, getInvoice } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/initiate', protect, initiatePayment);
router.post('/webhook', paymentWebhook); // public endpoint for provider
router.get('/verify', protect, verifyPayment);
router.get('/invoice/:orderId', protect, getInvoice);

export default router;
