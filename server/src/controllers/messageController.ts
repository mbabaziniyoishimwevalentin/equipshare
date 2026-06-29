import { Request, Response } from 'express';
import prisma from '../prisma';

// ─── Send a message ───────────────────────────────────────────────
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { body } = req.body;
    // @ts-ignore
    const senderId = req.user?.id;

    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
    if (!body?.trim()) return res.status(400).json({ error: 'Message body is required' });

    // Verify the sender is either the renter or an owner of equipment in the order
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { equipment: { select: { ownerId: true } } } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isRenter = order.renterId === senderId;
    const isOwner  = order.items.some((i: any) => i.equipment.ownerId === senderId);
    if (!isRenter && !isOwner) return res.status(403).json({ error: 'Forbidden' });

    const msg = await prisma.message.create({
      data: { orderId: Number(orderId), senderId, body: body.trim() },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    // Create a notification for the other party
    const recipientId = isRenter
      ? order.items[0]?.equipment.ownerId
      : order.renterId;

    if (recipientId) {
      const senderName = msg.sender.firstName + ' ' + msg.sender.lastName;
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'message',
          title: 'New message received',
          body: `${senderName}: "${body.trim().slice(0, 60)}"`,
          read: false,
          linkUrl: isRenter ? '/owner/messages' : '/messages',
        },
      });
    }

    res.status(201).json(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Get messages for an order ────────────────────────────────────
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    // @ts-ignore
    const userId = req.user?.id;

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { equipment: { select: { ownerId: true } } } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isRenter = order.renterId === userId;
    const isOwner  = order.items.some((i: any) => i.equipment.ownerId === userId);
    if (!isRenter && !isOwner) return res.status(403).json({ error: 'Forbidden' });

    const messages = await prisma.message.findMany({
      where: { orderId: Number(orderId) },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Get all conversations for current user ───────────────────────
export const getMyConversations = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const role   = req.user?.role;

    let orders: any[];

    if (role === 'OWNER') {
      orders = await prisma.order.findMany({
        where: { items: { some: { equipment: { ownerId: userId } } }, messages: { some: {} } },
        include: {
          renter: { select: { id: true, firstName: true, lastName: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      orders = await prisma.order.findMany({
        where: { renterId: userId, messages: { some: {} } },
        include: {
          items: {
            take: 1,
            include: { equipment: { include: { owner: { select: { id: true, firstName: true, lastName: true } } } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
