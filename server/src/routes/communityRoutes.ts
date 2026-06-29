import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getHubs,
  getTrustScore,
  expressInterest,
  getCommunities, createCommunity, getCommunityById, joinCommunity, leaveCommunity,
  createMeetup, getMeetups, rsvpMeetup,
  createEvent, getEvents, rsvpEvent,
  createTip, getTips, likeTip, addTipComment, getTipComments, deleteTip,
  createSuggestion, getSuggestions,
  updateRsvp, getRsvpsForOwner,
  getMembers,
} from '../controllers/communityController';

const router = Router();

// Communities — basic CRUD
router.get('/', protect, getCommunities);
router.post('/', protect, createCommunity);

// Named routes — must come BEFORE /:id
router.get('/hubs', protect, getHubs);
router.get('/rsvps/manage', protect, getRsvpsForOwner);
router.patch('/rsvps/:rsvpId', protect, updateRsvp);
router.get('/trust-score/:userId', protect, getTrustScore);

// Community-scoped content
router.get('/:id', protect, getCommunityById);
router.get('/:id/members', protect, getMembers);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

router.get('/:id/meetups', protect, getMeetups);
router.post('/:id/meetups', protect, createMeetup);
router.post('/:id/meetups/:meetupId/rsvp', protect, rsvpMeetup);

router.get('/:id/events', protect, getEvents);
router.post('/:id/events', protect, createEvent);
router.post('/:id/events/:eventId/rsvp', protect, rsvpEvent);
router.post('/:id/events/:eventId/interest', protect, expressInterest);

router.get('/:id/tips', protect, getTips);
router.post('/:id/tips', protect, createTip);
router.post('/:id/tips/:tipId/like', protect, likeTip);
router.get('/:id/tips/:tipId/comments', protect, getTipComments);
router.post('/:id/tips/:tipId/comments', protect, addTipComment);
router.delete('/:id/tips/:tipId', protect, deleteTip);

router.get('/:id/suggestions', protect, getSuggestions);
router.post('/:id/suggestions', protect, createSuggestion);

export default router;
