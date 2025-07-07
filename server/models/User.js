const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  points: {
    type: Number,
    default: 0
  },
  pointsLog: [{
    type: {
      type: String,
      enum: ['post', 'like', 'comment', 'conversion'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'pointsLog.relatedModel'
    },
    relatedModel: {
      type: String,
      enum: ['Post', 'Comment'],
      required: false
    }
  }],
  walletAddress: {
    type: String,
    default: null
  },
  isWalletCreated: {
    type: Boolean,
    default: false
  },
  dailyPostsCount: {
    type: Number,
    default: 0
  },
  lastPostDate: {
    type: Date,
    default: null
  },
  totalPosts: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  totalComments: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's APY based on points
userSchema.methods.getAPY = function() {
  if (this.points >= 50000) return 1000;
  if (this.points >= 10000) return 50;
  if (this.points >= 1000) return 20;
  return 0;
};

// Method to add points with logging
userSchema.methods.addPoints = function(amount, type, description, relatedId = null, relatedModel = null) {
  this.points += amount;
  
  // Add to points log
  this.pointsLog.push({
    type,
    amount,
    description,
    relatedId,
    relatedModel
  });
  
  return this.save();
};

// Method to check if user can post today
userSchema.methods.canPostToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastPostDate) return true;
  
  const lastPost = new Date(this.lastPostDate);
  lastPost.setHours(0, 0, 0, 0);
  
  return lastPost.getTime() !== today.getTime() || this.dailyPostsCount < 5;
};

// Method to increment daily post count
userSchema.methods.incrementPostCount = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastPostDate) {
    this.lastPostDate = new Date();
    this.dailyPostsCount = 1;
  } else {
    const lastPost = new Date(this.lastPostDate);
    lastPost.setHours(0, 0, 0, 0);
    
    if (lastPost.getTime() === today.getTime()) {
      this.dailyPostsCount += 1;
    } else {
      this.lastPostDate = new Date();
      this.dailyPostsCount = 1;
    }
  }
  
  this.totalPosts += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 