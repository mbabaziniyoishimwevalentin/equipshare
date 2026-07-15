import { Request, Response } from 'express';
import prisma from '../prisma';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, subtotal, tax, totalAmount, securityType, securityValue } = req.body;
    // @ts-ignore
    const renterId = req.user?.id;

    if (!renterId) return res.status(401).json({ error: 'Unauthorized' });
    if (!items || !items.length) return res.status(400).json({ error: 'No items in order' });

    const order = await prisma.order.create({
      data: {
        subtotal: subtotal || totalAmount,
        tax: tax || 0,
        totalAmount,
        securityType: securityType || null,
        securityValue: securityValue || null,
        renterId,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            equipmentId: item.equipmentId,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            price: item.price,
            quantity: item.quantity || 1,
            timeline: item.timeline,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: { include: { equipment: { select: { ownerId: true, title: true } } } },
        renter: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify each unique owner that a new order was placed
    const ownerIds = [...new Set(order.items.map((i: any) => i.equipment.ownerId))];
    const renterName = `${(order as any).renter.firstName} ${(order as any).renter.lastName}`;
    await Promise.all(
      ownerIds.map((ownerId: any) =>
        prisma.notification.create({
          data: {
            userId: ownerId,
            type: 'new_order',
            title: 'New order placed',
            body: `Hi! New order #${order.orderNumber} has been placed by ${renterName}, please review and accept.`,
            read: false,
            linkUrl: `/owner/orders`,
          },
        })
      )
    );

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while creating order' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;

    const orders = await prisma.order.findMany({
      where: { renterId: userId },
      include: {
        items: { include: { equipment: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const userRole = req.user?.role;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        renter: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true } },
        items: { include: { equipment: { include: { owner: true } } } },
        payment: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Allow renter, owner of any item in the order, or admin
    const isOwnerOfItem = order.items.some((item: any) => item.equipment.ownerId === userId);
    if (order.renterId !== userId && !isOwnerOfItem && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Orders received by an owner (orders that contain their equipment)
export const getReceivedOrders = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { items: { some: { equipment: { ownerId } } } },
      include: {
        renter: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true } },
        items: {
          where: { equipment: { ownerId } },
          include: { equipment: { select: { id: true, title: true, category: true, hourlyRate: true, images: true } } },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/orders/:id/status — owner can update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PROCESSING | COMPLETED | CANCELED
    // @ts-ignore
    const ownerId = req.user?.id;

    const allowed = ['PROCESSING', 'COMPLETED', 'CANCELED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify this owner has equipment in the order
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { equipment: { select: { ownerId: true } } } } },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner = order.items.some((item: any) => item.equipment.ownerId === ownerId);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    // Notify the renter of status change
    const statusLabels: Record<string, string> = {
      PROCESSING: 'accepted and is now being processed',
      COMPLETED:  'marked as completed',
      CANCELED:   'rejected/canceled',
    };
    const label = statusLabels[status] || status.toLowerCase();
    await prisma.notification.create({
      data: {
        userId: order.renterId,
        type: status === 'CANCELED' ? 'order_update' : 'order_update',
        title: 'Order status updated',
        body: `Your order #${order.orderNumber} has been ${label}.`,
        read: false,
        linkUrl: `/orders/${id}`,
      },
    });

    // If PENDING, notify renter that a new order was placed (for owner's reference notify owner too)
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
