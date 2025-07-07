const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  privateKey: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  stakedAmount: {
    type: Number,
    default: 0
  },
  stakingStartTime: {
    type: Date,
    default: null
  },
  stakingAPY: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalStaked: {
    type: Number,
    default: 0
  },
  isStaking: {
    type: Boolean,
    default: false
  },
  transactions: [{
    type: {
      type: String,
      enum: ['mint', 'stake', 'unstake', 'transfer', 'convert'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    from: {
      type: String
    },
    to: {
      type: String
    },
    txHash: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ user: 1 });
walletSchema.index({ address: 1 });

// Method to add transaction
walletSchema.methods.addTransaction = function(transaction) {
  this.transactions.push(transaction);
  return this.save();
};

// Method to update balance
walletSchema.methods.updateBalance = function(amount) {
  this.balance += amount;
  return this.save();
};

// Method to start staking
walletSchema.methods.startStaking = function(amount, apy) {
  this.stakedAmount = amount;
  this.stakingStartTime = new Date();
  this.stakingAPY = apy;
  this.isStaking = true;
  this.totalStaked += amount;
  this.balance -= amount;
  return this.save();
};

// Method to stop staking
walletSchema.methods.stopStaking = function() {
  if (!this.isStaking) return Promise.resolve(this);
  
  const duration = (new Date() - this.stakingStartTime) / (1000 * 60 * 60 * 24 * 365); // in years
  const reward = (this.stakedAmount * this.stakingAPY * duration) / 100;
  
  this.balance += this.stakedAmount + reward;
  this.totalEarned += reward;
  this.stakedAmount = 0;
  this.stakingStartTime = null;
  this.stakingAPY = 0;
  this.isStaking = false;
  
  return this.save();
};

// Method to get staking info
walletSchema.methods.getStakingInfo = function() {
  if (!this.isStaking) {
    return {
      isStaking: false,
      stakedAmount: 0,
      reward: 0,
      apy: 0
    };
  }
  
  const duration = (new Date() - this.stakingStartTime) / (1000 * 60 * 60 * 24 * 365);
  const reward = (this.stakedAmount * this.stakingAPY * duration) / 100;
  
  return {
    isStaking: true,
    stakedAmount: this.stakedAmount,
    reward: reward,
    apy: this.stakingAPY,
    startTime: this.stakingStartTime
  };
};

module.exports = mongoose.model('Wallet', walletSchema); 