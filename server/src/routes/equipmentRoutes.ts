import { Router } from 'express';
import { createEquipment, getEquipments, getEquipmentById, getMyEquipments, updateEquipment, deleteEquipment } from '../controllers/equipmentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/my').get(protect, getMyEquipments);
router.route('/').post(protect, createEquipment).get(getEquipments);
router.route('/:id').get(getEquipmentById).put(protect, updateEquipment).delete(protect, deleteEquipment);

export default router;
