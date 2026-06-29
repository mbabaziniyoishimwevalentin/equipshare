import { Request, Response } from 'express';
import prisma from '../prisma';

// POST /api/favourites/:equipmentId — toggle favourite
export const toggleFavourite = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const equipmentId = Number(req.params.equipmentId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.favourite.findUnique({
      where: { userId_equipmentId: { userId, equipmentId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return res.json({ favourited: false });
    }

    await prisma.favourite.create({ data: { userId, equipmentId } });
    return res.json({ favourited: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/favourites — get current user's wishlist
export const getMyFavourites = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const favs = await prisma.favourite.findMany({
      where: { userId },
      include: {
        equipment: {
          include: { owner: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(favs.map((f: any) => f.equipment));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/favourites/ids — get just the equipmentIds the user has favourited
export const getMyFavouriteIds = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const favs = await prisma.favourite.findMany({
      where: { userId },
      select: { equipmentId: true },
    });
    res.json(favs.map((f: any) => f.equipmentId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
