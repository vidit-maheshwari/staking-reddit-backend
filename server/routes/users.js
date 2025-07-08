const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ 
      author: user._id, 
      isDeleted: false 
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      user,
      recentPosts: posts
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get user's posts
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: user._id, 
      isDeleted: false 
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({ 
      author: user._id, 
      isDeleted: false 
    });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to get user posts' });
  }
});

// Get leaderboard
router.get('/leaderboard/points', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await User.find()
      .select('username avatar points totalPosts totalLikes totalComments createdAt')
      .sort({ points: -1 })
      .limit(limit);

    res.json({ users });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username avatar bio points totalPosts')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user stats
router.get('/:username/stats', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get post stats
    const totalPosts = await Post.countDocuments({ 
      author: user._id, 
      isDeleted: false 
    });

    // Get total likes received
    const posts = await Post.find({ author: user._id, isDeleted: false });
    const totalLikesReceived = posts.reduce((sum, post) => sum + post.likes.length, 0);

    // Get total comments received
    const totalCommentsReceived = posts.reduce((sum, post) => sum + post.comments.length, 0);

    // Get total views
    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);

    // Get APY based on points
    const apy = user.getAPY();

    res.json({
      username: user.username,
      points: user.points,
      totalPosts,
      totalLikesReceived,
      totalCommentsReceived,
      totalViews,
      apy,
      dailyPostsCount: user.dailyPostsCount,
      canPostToday: user.canPostToday(),
      memberSince: user.createdAt
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role (admin only)
router.put('/:userId/role', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Ban/Unban user (admin only)
router.put('/:userId/ban', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { isBanned } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
      user
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban/unban user' });
  }
});

// Get user's APY for staking
router.get('/:username/apy', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const apy = user.getAPY();
    const pointsRequired = {
      20: 1000,
      50: 10000,
      1000: 50000
    };

    res.json({
      username: user.username,
      points: user.points,
      apy,
      pointsRequired,
      nextTier: apy === 0 ? 1000 : apy === 20 ? 10000 : apy === 50 ? 50000 : null,
      pointsToNextTier: apy === 0 ? 1000 - user.points : apy === 20 ? 10000 - user.points : apy === 50 ? 50000 - user.points : 0
    });
  } catch (error) {
    console.error('Get user APY error:', error);
    res.status(500).json({ error: 'Failed to get user APY' });
  }
});

// Get user activity (fixed version)
router.get('/:username/activity', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's posts
    const posts = await Post.find({ 
      author: user._id, 
      isDeleted: false 
    })
    .select('title createdAt likeCount commentCount')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get user's points log
    const pointsLog = user.pointsLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limit);

    const total = user.pointsLog.length;

    res.json({
      user: {
        username: user.username,
        points: user.points,
        totalPosts: user.totalPosts,
        totalLikes: user.totalLikes,
        totalComments: user.totalComments
      },
      recentPosts: posts,
      pointsLog,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
});

module.exports = router; 