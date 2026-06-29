import { Router } from 'express';
import { createReview, getEquipmentReviews, replyToReview, getMyEquipmentReviews } from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/my-equipment', protect, getMyEquipmentReviews);
router.get('/equipment/:equipmentId', getEquipmentReviews);
router.post('/', protect, createReview);
router.patch('/:id/reply', protect, replyToReview);

export default router;
