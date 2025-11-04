import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as recommendationService from '../services/recommendations.js';

const router = express.Router();

/**
 * GET /api/recommendations
 * Get personalized recommendations for the authenticated user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await recommendationService.getRecommendations(userEmail, limit);

    res.json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * POST /api/recommendations/track
 * Track user interaction (like, view, copy)
 */
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { promptId, interactionType } = req.body;

    if (!promptId || !interactionType) {
      return res.status(400).json({ error: 'promptId and interactionType are required' });
    }

    if (!['like', 'view', 'copy'].includes(interactionType)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }

    const interaction = await recommendationService.trackInteraction(userEmail, promptId, interactionType);

    res.json({
      success: true,
      interaction
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

/**
 * POST /api/recommendations/follow/:creatorEmail
 * Follow a creator
 */
router.post('/follow/:creatorEmail', authMiddleware, async (req, res) => {
  try {
    const followerEmail = req.user.email;
    const creatorEmail = req.params.creatorEmail;

    if (followerEmail === creatorEmail) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    await recommendationService.followCreator(followerEmail, creatorEmail);

    res.json({
      success: true,
      message: 'Successfully followed creator'
    });
  } catch (error) {
    console.error('Error following creator:', error);
    res.status(500).json({ error: 'Failed to follow creator' });
  }
});

/**
 * DELETE /api/recommendations/follow/:creatorEmail
 * Unfollow a creator
 */
router.delete('/follow/:creatorEmail', authMiddleware, async (req, res) => {
  try {
    const followerEmail = req.user.email;
    const creatorEmail = req.params.creatorEmail;

    await recommendationService.unfollowCreator(followerEmail, creatorEmail);

    res.json({
      success: true,
      message: 'Successfully unfollowed creator'
    });
  } catch (error) {
    console.error('Error unfollowing creator:', error);
    res.status(500).json({ error: 'Failed to unfollow creator' });
  }
});

/**
 * GET /api/recommendations/follow/:creatorEmail/status
 * Check if user is following a creator
 */
router.get('/follow/:creatorEmail/status', authMiddleware, async (req, res) => {
  try {
    const followerEmail = req.user.email;
    const creatorEmail = req.params.creatorEmail;

    const isFollowing = await recommendationService.isFollowing(followerEmail, creatorEmail);

    res.json({
      success: true,
      isFollowing
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

/**
 * GET /api/recommendations/stats/:userEmail
 * Get follower/following counts for a user
 */
router.get('/stats/:userEmail', async (req, res) => {
  try {
    const userEmail = req.params.userEmail;

    const stats = await recommendationService.getFollowStats(userEmail);

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching follow stats:', error);
    res.status(500).json({ error: 'Failed to fetch follow stats' });
  }
});

export default router;
