import { Request, Response } from 'express';
import prisma from '../prisma';

// GET /api/notifications — get current user's notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/notifications/:id/read — mark one as read
export const markRead = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { id } = req.params;
    const notif = await prisma.notification.findUnique({ where: { id: Number(id) } });
    if (!notif || notif.userId !== userId)
      return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.notification.update({
      where: { id: Number(id) },
      data: { read: true },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/notifications/read-all — mark all as read
export const markAllRead = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Internal helper — create a notification (used by other controllers) ───
export const createNotification = async (data: {
  userId: number;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
}) => {
  return prisma.notification.create({ data: { ...data, read: false } });
};
