import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotification } from './notificationController';
import upload from '../upload';

// Helper: check community membership
const isMember = async (communityId: number, userId: number) => {
  const m = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
  return !!m;
};

// ─── Communities ──────────────────────────────────────────────────

export const getCommunities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const communities = await prisma.community.findMany({
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        members: { select: { userId: true } },
        _count: { select: { meetups: true, events: true, tips: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const result = communities.map((c) => ({
      ...c,
      memberCount: c.members.length,
      isMember: c.members.some((m) => m.userId === userId),
      isOwner: c.ownerId === userId,
      members: undefined,
    }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createCommunity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'OWNER') return res.status(403).json({ error: 'Only owners can create communities' });
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Image upload failed' });
      const { name, description } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const community = await prisma.community.create({
        data: { name, description, image, ownerId: userId },
      });
      await prisma.communityMember.create({ data: { communityId: community.id, userId } });
      res.status(201).json(community);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const communityId = Number(req.params.id);
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        meetups: { orderBy: { date: 'desc' }, include: { rsvps: true, organizer: { select: { id: true, firstName: true, lastName: true } } } },
        events: { orderBy: { date: 'desc' }, include: { rsvps: true, organizer: { select: { id: true, firstName: true, lastName: true } } } },
        tips: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, firstName: true, lastName: true } }, likes: true, comments: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } } } },
        suggestions: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const memberStatus = await isMember(communityId, userId);
    const result = {
      ...community,
      meetups: community.meetups.map((m) => ({ ...m, rsvpCount: m.rsvps.length, userRsvp: m.rsvps.find((r) => r.userId === userId) || null, rsvps: undefined })),
      events: community.events.map((e) => ({ ...e, rsvpCount: e.rsvps.length, userRsvp: e.rsvps.find((r) => r.userId === userId) || null, rsvps: undefined })),
      tips: community.tips.map((t) => ({ ...t, likeCount: t.likes.length, isLiked: t.likes.some((l) => l.userId === userId), likes: undefined })),
      isOwner: community.ownerId === userId,
      isMember: memberStatus,
    };
    // Fetch owner RSVPs separately
    let rsvps: any[] = [];
    if (result.isOwner) {
      rsvps = await prisma.rSVP.findMany({
        where: { status: 'PENDING', OR: [{ meetup: { organizerId: userId } }, { event: { organizerId: userId } }] },
        include: { user: { select: { id: true, firstName: true, lastName: true } }, meetup: { select: { id: true, title: true } }, event: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json({ ...result, rsvps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const existing = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
    if (existing) return res.status(400).json({ error: 'Already a member' });
    await prisma.communityMember.create({ data: { communityId, userId } });
    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { name: true, ownerId: true } });
    if (community) {
      await createNotification({ userId: community.ownerId, type: 'community', title: 'New member joined', body: `A user joined "${community.name}"`, linkUrl: `/community/${communityId}` });
    }
    res.json({ message: 'Joined community' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const leaveCommunity = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    await prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
    res.json({ message: 'Left community' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Meetups (scoped to community) ────────────────────────────────

export const createMeetup = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'OWNER') return res.status(403).json({ error: 'Only owners can create meetups' });
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Image upload failed' });
      const { title, description, location, date, maxAttendees } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const meetup = await prisma.meetup.create({
        data: { title, description, location, date: new Date(date), image, maxAttendees: maxAttendees ? Number(maxAttendees) : null, communityId, organizerId: userId },
      });
      const members = await prisma.communityMember.findMany({ where: { communityId, userId: { not: userId } }, select: { userId: true } });
      await Promise.all(members.map((m) => createNotification({ userId: m.userId, type: 'meetup', title: 'New meetup in your community', body: `"${title}" — ${location}`, linkUrl: `/community/${communityId}` })));
      res.status(201).json(meetup);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMeetups = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const meetups = await prisma.meetup.findMany({
      where: { communityId },
      orderBy: { date: 'desc' },
      include: { organizer: { select: { id: true, firstName: true, lastName: true } }, rsvps: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
    const result = meetups.map((m) => ({ ...m, rsvpCount: m.rsvps.length, userRsvp: m.rsvps.find((r) => r.userId === userId) || null }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Events (scoped to community) ─────────────────────────────────

export const createEvent = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'OWNER') return res.status(403).json({ error: 'Only owners can create events' });
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Image upload failed' });
      const { title, description, location, date, maxAttendees } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const event = await prisma.communityEvent.create({
        data: { title, description, location, date: new Date(date), image, maxAttendees: maxAttendees ? Number(maxAttendees) : null, communityId, organizerId: userId },
      });
      const members = await prisma.communityMember.findMany({ where: { communityId, userId: { not: userId } }, select: { userId: true } });
      await Promise.all(members.map((m) => createNotification({ userId: m.userId, type: 'event', title: 'New event in your community', body: `"${title}" — ${location}`, linkUrl: `/community/${communityId}` })));
      res.status(201).json(event);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const events = await prisma.communityEvent.findMany({
      where: { communityId },
      orderBy: { date: 'desc' },
      include: { organizer: { select: { id: true, firstName: true, lastName: true } }, rsvps: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
    const result = events.map((e) => ({ ...e, rsvpCount: e.rsvps.length, userRsvp: e.rsvps.find((r) => r.userId === userId) || null }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── RSVPs ────────────────────────────────────────────────────────

export const rsvpMeetup = async (req: Request, res: Response) => {
  try {
    const meetupId = Number(req.params.meetupId);
    const userId = (req as any).user?.id;
    const existing = await prisma.rSVP.findFirst({ where: { meetupId, userId } });
    if (existing) return res.status(400).json({ error: 'Already RSVPed' });
    const rsvp = await prisma.rSVP.create({ data: { meetupId, userId } });
    const meetup = await prisma.meetup.findUnique({ where: { id: meetupId }, include: { organizer: true, community: true } });
    if (meetup) {
      await createNotification({ userId: meetup.organizerId, type: 'meetup', title: 'New RSVP', body: `Someone RSVPed to "${meetup.title}"`, linkUrl: `/community/${meetup.communityId}` });
    }
    res.status(201).json(rsvp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const rsvpEvent = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const userId = (req as any).user?.id;
    const existing = await prisma.rSVP.findFirst({ where: { eventId, userId } });
    if (existing) return res.status(400).json({ error: 'Already RSVPed' });
    const rsvp = await prisma.rSVP.create({ data: { eventId, userId } });
    const event = await prisma.communityEvent.findUnique({ where: { id: eventId }, include: { organizer: true, community: true } });
    if (event) {
      await createNotification({ userId: event.organizerId, type: 'event', title: 'New RSVP', body: `Someone RSVPed to "${event.title}"`, linkUrl: `/community/${event.communityId}` });
    }
    res.status(201).json(rsvp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateRsvp = async (req: Request, res: Response) => {
  try {
    const rsvpId = Number(req.params.rsvpId);
    const { status, reason } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const rsvp = await prisma.rSVP.findUnique({ where: { id: rsvpId } });
    if (!rsvp) return res.status(404).json({ error: 'RSVP not found' });
    await prisma.rSVP.update({ where: { id: rsvpId }, data: { status, reason } });
    const fullRsvp = await prisma.rSVP.findUnique({ where: { id: rsvpId }, include: { meetup: { include: { community: true } }, event: { include: { community: true } } } });
    if (fullRsvp) {
      const title = fullRsvp.meetup?.title || fullRsvp.event?.title || '';
      const communityId = fullRsvp.meetup?.communityId || fullRsvp.event?.communityId || '';
      await createNotification({ userId: rsvp.userId, type: status === 'ACCEPTED' ? 'meetup' : 'event', title: status === 'ACCEPTED' ? 'RSVP Accepted' : 'RSVP Rejected', body: status === 'ACCEPTED' ? `Your booking for "${title}" was accepted!` : `Your booking for "${title}" was rejected. Reason: ${reason || 'N/A'}`, linkUrl: `/community/${communityId}` });
    }
    res.json({ message: 'RSVP updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getRsvpsForOwner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const rsvps = await prisma.rSVP.findMany({
      where: { OR: [{ meetup: { organizerId: userId } }, { event: { organizerId: userId } }] },
      include: { user: { select: { id: true, firstName: true, lastName: true } }, meetup: { select: { id: true, title: true } }, event: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rsvps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Tips (scoped to community) ───────────────────────────────────

export const createTip = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const memberStatus = await isMember(communityId, userId);
    if (!memberStatus) return res.status(403).json({ error: 'Only members can share tips' });
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Image upload failed' });
      const { title, body, category } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const tip = await prisma.sharingTip.create({ data: { title, body, category: category || 'General', image, communityId, authorId: userId } });
      const members = await prisma.communityMember.findMany({ where: { communityId, userId: { not: userId } }, select: { userId: true } });
      await Promise.all(members.map((m) => createNotification({ userId: m.userId, type: 'tip', title: 'New tip in your community', body: `"${title}" was shared`, linkUrl: `/community/${communityId}` })));
      res.status(201).json(tip);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTips = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const tips = await prisma.sharingTip.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, firstName: true, lastName: true } }, likes: true, comments: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } } },
    });
    const result = tips.map((t) => ({ ...t, likeCount: t.likes.length, isLiked: t.likes.some((l) => l.userId === userId), likes: undefined }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const likeTip = async (req: Request, res: Response) => {
  try {
    const tipId = Number(req.params.tipId);
    const userId = (req as any).user?.id;
    const existing = await prisma.tipLike.findUnique({ where: { tipId_userId: { tipId, userId } } });
    if (existing) {
      await prisma.tipLike.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.tipLike.create({ data: { tipId, userId } });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addTipComment = async (req: Request, res: Response) => {
  try {
    const tipId = Number(req.params.tipId);
    const userId = (req as any).user?.id;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' });
    const comment = await prisma.tipComment.create({ data: { tipId, userId, body } });
    const full = await prisma.tipComment.findUnique({ where: { id: comment.id }, include: { user: { select: { id: true, firstName: true, lastName: true } } } });
    res.status(201).json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTipComments = async (req: Request, res: Response) => {
  try {
    const tipId = Number(req.params.tipId);
    const comments = await prisma.tipComment.findMany({
      where: { tipId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTip = async (req: Request, res: Response) => {
  try {
    const tipId = Number(req.params.tipId);
    const userId = (req as any).user?.id;
    const tip = await prisma.sharingTip.findUnique({ where: { id: tipId } });
    if (!tip) return res.status(404).json({ error: 'Tip not found' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (tip.authorId !== userId && user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    await prisma.sharingTip.delete({ where: { id: tipId } });
    res.json({ message: 'Tip deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Suggestions (scoped to community) ────────────────────────────

export const createSuggestion = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const userId = (req as any).user?.id;
    const memberStatus = await isMember(communityId, userId);
    if (!memberStatus) return res.status(403).json({ error: 'Only members can suggest' });
    const { body } = req.body;
    const suggestion = await prisma.suggestion.create({ data: { body, communityId, userId } });
    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { ownerId: true } });
    if (community) {
      await createNotification({ userId: community.ownerId, type: 'suggestion', title: 'New suggestion', body: body.substring(0, 80), linkUrl: `/community/${communityId}` });
    }
    res.status(201).json(suggestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const suggestions = await prisma.suggestion.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Hubs ─────────────────────────────────────────────────────────

export const getHubs = async (req: Request, res: Response) => {
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      include: { owner: { select: { id: true, firstName: true, lastName: true, phone: true, isVerified: true } } },
    });
    const hubs: Record<string, { location: string; count: number; items: typeof equipments }> = {};
    for (const eq of equipments) {
      const loc = eq.location || 'Unknown';
      if (!hubs[loc]) hubs[loc] = { location: loc, count: 0, items: [] };
      hubs[loc].count++;
      hubs[loc].items.push(eq);
    }
    res.json(Object.values(hubs).sort((a, b) => b.count - a.count));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Trust Score ──────────────────────────────────────────────────

export const getTrustScore = async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.params.userId);
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: { reviews: { select: { rating: true } } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const reviewRatings = user.reviews.map((r) => r.rating);
    const avgRating = reviewRatings.length ? reviewRatings.reduce((a, b) => a + b, 0) / reviewRatings.length : 0;
    const score = {
      userId: user.id,
      reviewScore: Math.round(avgRating * 20),
      idVerified: user.isVerified,
      phoneVerified: user.phoneVerified,
      totalOrders: await prisma.order.count({ where: { renterId: targetId } }),
      totalEquipment: await prisma.equipment.count({ where: { ownerId: targetId } }),
      overall: Math.round((user.isVerified ? 30 : 0) + (user.phoneVerified ? 20 : 0) + (avgRating ? (avgRating / 5) * 50 : 0)),
    };
    res.json(score);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const expressInterest = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const event = await prisma.communityEvent.update({ where: { id: eventId }, data: { interested: { increment: 1 } } });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMembers = async (req: Request, res: Response) => {
  try {
    const communityId = Number(req.params.id);
    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: { user: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json(members.map((m) => ({ ...m.user, joinedAt: m.joinedAt })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
