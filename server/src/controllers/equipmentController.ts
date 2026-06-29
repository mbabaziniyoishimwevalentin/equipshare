import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotification } from './notificationController';

export const createEquipment = async (req: Request, res: Response) => {
  try {
    const { title, category, description, specs, hourlyRate, dailyRate, weeklyRate, deposit, location, images, isActive } = req.body;
    // @ts-ignore
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

    const equipment = await prisma.equipment.create({
      data: {
        title,
        category,
        description,
        specs,
        hourlyRate,
        dailyRate,
        weeklyRate,
        deposit,
        location,
        images: images || [],
        isActive: isActive ?? true,
        ownerId,
      },
    });

    const renters = await prisma.user.findMany({
      where: { role: 'RENTER' },
      select: { id: true },
    });

    await Promise.all(
      renters.map((renter) =>
        createNotification({
          userId: renter.id,
          type: 'new_equipment',
          title: 'New equipment available',
          body: `A new ${category} item "${title}" is now available in ${location}.`,
          linkUrl: `/equipment/${equipment.id}`,
        })
      )
    );

    res.status(201).json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while creating equipment' });
  }
};

export const getEquipments = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category) where.category = String(category);
    if (search) where.title = { contains: String(search), mode: 'insensitive' };
    const equipments = await prisma.equipment.findMany({ where, include: { owner: { select: { firstName: true, lastName: true } } } });
    res.json(equipments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching equipments' });
  }
};

export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(id) },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, preferredCommunication: true, profilePictureUrl: true },
        },
      },
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    // Fetch booked order items separately to avoid complex include types
    const booked = await prisma.orderItem.findMany({
      where: {
        equipmentId: equipment.id,
        order: { status: { not: 'CANCELED' } },
      },
      select: { startDate: true, endDate: true },
    });

    res.json({ ...equipment, orderItems: booked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching equipment' });
  }
};

export const getMyEquipments = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
    const equipments = await prisma.equipment.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } });
    res.json(equipments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const ownerId = req.user?.id;
    const existing = await prisma.equipment.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.ownerId !== ownerId) return res.status(403).json({ error: 'Forbidden' });

    const { title, category, description, hourlyRate, dailyRate, location, isActive, images } = req.body;
    const updated = await prisma.equipment.update({
      where: { id: Number(id) },
      data: { title, category, description, hourlyRate, dailyRate, location, isActive, images },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const ownerId = req.user?.id;
    const existing = await prisma.equipment.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.ownerId !== ownerId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.equipment.delete({ where: { id: Number(id) } });
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
