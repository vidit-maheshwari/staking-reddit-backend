const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Create a new post
router.post('/', authenticateToken, [
  body('title')
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1 and 300 characters'),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, image, tags } = req.body;

    // Check if user can post today
    const user = await User.findById(req.user._id);
    if (!user.canPostToday()) {
      return res.status(400).json({ 
        error: 'Daily post limit reached. You can post 5 times per day.' 
      });
    }

    // Create post
    const post = new Post({
      author: req.user._id,
      title,
      content,
      image: image || '',
      tags: tags || []
    });

    await post.save();

    // Increment user's post count and add points
    await user.incrementPostCount();
    await user.addPoints(5, 'post', 'Points earned for creating post', post._id, 'Post');

    // Populate author info
    await post.populate('author', 'username avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post,
      pointsEarned: 5
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };
    
    // Filter by tag if provided
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Filter by author if provided
    if (req.query.author) {
      const author = await User.findOne({ username: req.query.author });
      if (author) {
        query.author = author._id;
      }
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

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
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get a specific post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Check if ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username avatar')
      .populate('comments.likes.user', 'username');

    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Like/Unlike a post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = post.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      await post.removeLike(req.user._id);
      
      // Remove points from post author
      const author = await User.findById(post.author);
      if (author) {
        await author.addPoints(-1, 'like', 'Point removed for unlike', post._id, 'Post');
      }

      res.json({ 
        message: 'Post unliked',
        liked: false,
        pointsRemoved: 1
      });
    } else {
      // Like
      await post.addLike(req.user._id);
      
      // Add points to post author
      const author = await User.findById(post.author);
      if (author) {
        await author.addPoints(1, 'like', 'Point earned for like', post._id, 'Post');
      }

      res.json({ 
        message: 'Post liked',
        liked: true,
        pointsEarned: 1
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like/unlike post' });
  }
});

// Add comment to a post
router.post('/:id/comments', authenticateToken, [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await post.addComment(req.user._id, content);

    // Add points to comment author
    const user = await User.findById(req.user._id);
    await user.addPoints(2, 'comment', 'Points earned for commenting', post._id, 'Post');

    // Populate the new comment
    await post.populate('comments.user', 'username avatar');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
      pointsEarned: 2
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existingLike = comment.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike comment
      await post.unlikeComment(commentId, req.user._id);
      res.json({ message: 'Comment unliked', liked: false });
    } else {
      // Like comment
      await post.likeComment(commentId, req.user._id);
      res.json({ message: 'Comment liked', liked: true });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like/unlike comment' });
  }
});

// Delete a post (only by author or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Update a post (only by author)
router.put('/:id', authenticateToken, [
  body('title')
    .optional()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1 and 300 characters'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username avatar');

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Get trending posts
router.get('/trending/posts', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const posts = await Post.aggregate([
      { $match: { isDeleted: false } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 1] },
              { $multiply: [{ $size: '$comments' }, 2] },
              { $multiply: ['$viewCount', 0.1] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          'author.password': 0,
          'author.email': 0
        }
      }
    ]);

    res.json({ posts });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ error: 'Failed to get trending posts' });
  }
});

module.exports = router; 