import { Request, Response } from 'express';
import prisma from '../prisma';

// POST /api/reviews — renter creates a review for an equipment
export const createReview = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const authorId = req.user?.id;
    const { equipmentId, rating, comment } = req.body;

    if (!authorId) return res.status(401).json({ error: 'Unauthorized' });
    if (!equipmentId || !rating || !comment)
      return res.status(400).json({ error: 'equipmentId, rating and comment are required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    // Ensure the renter actually rented this equipment (completed order)
    const rented = await prisma.orderItem.findFirst({
      where: {
        equipmentId: Number(equipmentId),
        order: { renterId: authorId },
      },
    });
    if (!rented)
      return res.status(403).json({ error: 'You can only review equipment you have rented' });

    // Prevent duplicate reviews
    const existing = await prisma.review.findFirst({
      where: { equipmentId: Number(equipmentId), authorId },
    });
    if (existing)
      return res.status(409).json({ error: 'You have already reviewed this equipment' });

    const review = await prisma.review.create({
      data: { equipmentId: Number(equipmentId), authorId, rating: Number(rating), comment },
      include: { author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
    });

    // Notify the equipment owner
    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(equipmentId) },
      select: { ownerId: true, title: true },
    });
    if (equipment) {
      await prisma.notification.create({
        data: {
          userId: equipment.ownerId,
          type: 'review',
          title: 'New review received',
          body: `${req.body._authorName || 'A renter'} left a ${rating}★ review on "${equipment.title}": "${comment.slice(0, 60)}"`,
          read: false,
          linkUrl: '/owner/notifications',
        },
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reviews/equipment/:equipmentId — anyone can read reviews for a piece of equipment
export const getEquipmentReviews = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { equipmentId: Number(equipmentId) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/reviews/:id/reply — owner replies to a review
export const replyToReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ownerReply } = req.body;
    // @ts-ignore
    const userId = req.user?.id;

    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
      include: { equipment: { select: { ownerId: true } } },
    });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.equipment.ownerId !== userId)
      return res.status(403).json({ error: 'Only the equipment owner can reply' });

    const updated = await prisma.review.update({
      where: { id: Number(id) },
      data: { ownerReply },
      include: { author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reviews/my-equipment — owner gets all reviews for their equipment
export const getMyEquipmentReviews = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const ownerId = req.user?.id;
    const reviews = await prisma.review.findMany({
      where: { equipment: { ownerId } },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } },
        equipment: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
