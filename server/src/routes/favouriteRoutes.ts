import { Router } from 'express';
import { toggleFavourite, getMyFavourites, getMyFavouriteIds } from '../controllers/favouriteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getMyFavourites);
router.get('/ids', protect, getMyFavouriteIds);
router.post('/:equipmentId', protect, toggleFavourite);

export default router;
