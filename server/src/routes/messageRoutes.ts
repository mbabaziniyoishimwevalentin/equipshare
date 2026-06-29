import { Router } from 'express';
import { sendMessage, getMessages, getMyConversations } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/conversations', protect, getMyConversations);
router.get('/:orderId', protect, getMessages);
router.post('/:orderId', protect, sendMessage);

export default router;
