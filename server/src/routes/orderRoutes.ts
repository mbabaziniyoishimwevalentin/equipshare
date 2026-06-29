import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById, getReceivedOrders, updateOrderStatus } from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/received').get(protect, getReceivedOrders);
router.route('/').post(protect, createOrder).get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').patch(protect, updateOrderStatus);

export default router;
