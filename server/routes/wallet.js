const express = require('express');
const { ethers } = require('ethers');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create wallet for user
router.post('/create', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.isWalletCreated) {
      return res.status(400).json({ error: 'Wallet already exists for this user' });
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Create wallet record
    const walletRecord = new Wallet({
      user: req.user._id,
      address: wallet.address,
      privateKey: wallet.privateKey
    });

    await walletRecord.save();

    // Update user
    user.walletAddress = wallet.address;
    user.isWalletCreated = true;
    await user.save();

    res.status(201).json({
      message: 'Wallet created successfully',
      address: wallet.address,
      privateKey: wallet.privateKey,
      walletId: walletRecord._id,
      warning: 'Keep your private key secure and never share it!'
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Get wallet info
router.get('/info', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Get staking info
    const stakingInfo = wallet.getStakingInfo();

    res.json({
      address: wallet.address,
      balance: wallet.balance,
      stakingInfo,
      totalEarned: wallet.totalEarned,
      totalStaked: wallet.totalStaked,
      transactions: wallet.transactions.slice(-10) // Last 10 transactions
    });
  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({ error: 'Failed to get wallet info' });
  }
});


// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = wallet.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limit);

    const total = wallet.transactions.length;

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const user = await User.findById(req.user._id);
    const stakingInfo = wallet.getStakingInfo();

    res.json({
      balance: wallet.balance,
      points: user.points,
      stakingInfo,
      totalEarned: wallet.totalEarned,
      totalStaked: wallet.totalStaked
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Export wallet (get private key - for development only)
router.get('/export', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // In production, this should be more secure
    res.json({
      address: wallet.address,
      privateKey: wallet.privateKey,
      warning: 'Keep your private key secure and never share it!'
    });
  } catch (error) {
    console.error('Export wallet error:', error);
    res.status(500).json({ error: 'Failed to export wallet' });
  }
});

// Get user's points and conversion info
router.get('/points-info', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    const conversionRate = 100; // 100 points = 2 tokens
    const tokensPerHundredPoints = 2;

    res.json({
      points: user.points,
      hasWallet: !!wallet,
      conversionRate,
      tokensPerHundredPoints,
      canConvert: user.points >= 100,
      maxConvertible: Math.floor(user.points / 100) * 100,
      estimatedTokens: Math.floor(user.points / 100) * tokensPerHundredPoints
    });
  } catch (error) {
    console.error('Get points info error:', error);
    res.status(500).json({ error: 'Failed to get points info' });
  }
});

module.exports = router; 