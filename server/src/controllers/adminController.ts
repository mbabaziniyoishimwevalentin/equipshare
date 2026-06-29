import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';

const isAdmin = (req: Request, res: Response): boolean => {
  // @ts-ignore
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
};

export const getAllUsers = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isVerified: true,
        phone: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllEquipments = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const equipments = await prisma.equipment.findMany({
      include: { owner: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(equipments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const orders = await prisma.order.findMany({
      include: {
        renter: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { equipment: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/admin/users/:id/verify
export const toggleUserVerify = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isVerified: true,
        phone: true, createdAt: true,
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!['RENTER', 'OWNER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isVerified: true,
        phone: true, createdAt: true,
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/admin/equipments/:id/toggle
export const toggleEquipmentActive = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const equip = await prisma.equipment.findUnique({ where: { id } });
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });

    const updated = await prisma.equipment.update({
      where: { id },
      data: { isActive: !equip.isActive },
      include: { owner: { select: { firstName: true, lastName: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/admin/users
export const createUser = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const { firstName, lastName, email, password, role, phone, isVerified } = req.body;
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || '123456', salt);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: role || 'RENTER',
        phone,
        isVerified: !!isVerified,
      },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isVerified: true,
        phone: true, createdAt: true,
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/admin/users/:id
export const editUser = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const { firstName, lastName, email, role, phone, isVerified } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    if (email && email !== existing.email) {
      const emailDup = await prisma.user.findUnique({ where: { email } });
      if (emailDup) return res.status(400).json({ error: 'Email already exists' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        email: email !== undefined ? email : existing.email,
        role: role !== undefined ? role : existing.role,
        phone: phone !== undefined ? phone : existing.phone,
        isVerified: isVerified !== undefined ? !!isVerified : existing.isVerified,
      },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isVerified: true,
        phone: true, createdAt: true,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting oneself
    // @ts-ignore
    if (user.id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete own account' });
    }

    // Delete any dependent records if necessary (Cascade is set or manual delete)
    // For simplicity:
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
