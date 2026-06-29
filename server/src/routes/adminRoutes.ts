import { Router } from 'express';
import {
  getAllUsers,
  getAllEquipments,
  getAllOrders,
  toggleUserVerify,
  updateUserRole,
  toggleEquipmentActive,
  createUser,
  editUser,
  deleteUser,
} from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.get('/users', protect, adminOnly, getAllUsers);
router.get('/equipments', protect, adminOnly, getAllEquipments);
router.get('/orders', protect, adminOnly, getAllOrders);

router.post('/users', protect, adminOnly, createUser);
router.put('/users/:id', protect, adminOnly, editUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

router.patch('/users/:id/verify', protect, adminOnly, toggleUserVerify);
router.patch('/users/:id/role', protect, adminOnly, updateUserRole);
router.patch('/equipments/:id/toggle', protect, adminOnly, toggleEquipmentActive);

export default router;
