const express = require('express');
const { ethers } = require('ethers');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// Initialize blockchain components conditionally
let provider, tokenContract, stakingContract;

try {
  // Load contract ABIs
  const RedditTokenABI = require('../abi/RedditToken.json');
  const RedditStakingABI = require('../abi/RedditStaking.json');

  // Initialize provider and contracts only if addresses are provided
  if (process.env.RPC_URL && process.env.TOKEN_CONTRACT_ADDRESS && process.env.STAKING_CONTRACT_ADDRESS) {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    tokenContract = new ethers.Contract(
      process.env.TOKEN_CONTRACT_ADDRESS,
      RedditTokenABI,
      provider
    );
    stakingContract = new ethers.Contract(
      process.env.STAKING_CONTRACT_ADDRESS,
      RedditStakingABI,
      provider
    );
  }
} catch (error) {
  console.warn('Blockchain contracts not initialized:', error.message);
}

// Helper function to check if blockchain is available
const isBlockchainAvailable = () => {
  return provider && tokenContract && stakingContract;
};

router.post('/convert-points', authenticateToken, async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const POINTS_REQUIRED = 100;
    const TOKENS_REWARDED = 2;

    // Check user has enough points
    if (user.points < POINTS_REQUIRED) {
      return res.status(400).json({ error: 'Insufficient points to convert. Need at least 100 points.' });
    }

    // Load owner's signer
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey) {
      return res.status(500).json({ error: 'Owner wallet not configured on backend' });
    }

    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);
    const tokenContractWithSigner = tokenContract.connect(ownerWallet);

    // Mint tokens to user's wallet address
    const mintTx = await tokenContractWithSigner.mint(
      wallet.address,
      ethers.parseEther(TOKENS_REWARDED.toString())
    );
    await mintTx.wait();

    // Deduct points from user
    user.points -= POINTS_REQUIRED;
    await user.save();

    // Update wallet balance (optional, for backend DB tracking)
    wallet.balance += TOKENS_REWARDED;
    await wallet.save();

    // Log transaction
    await wallet.addTransaction({
      type: 'mint',
      amount: TOKENS_REWARDED,
      txHash: mintTx.hash,
      status: 'completed',
      description: `Converted ${POINTS_REQUIRED} points to ${TOKENS_REWARDED} RDT`
    });

    res.json({
      message: 'Points converted to tokens successfully',
      pointsDeducted: POINTS_REQUIRED,
      tokensMinted: TOKENS_REWARDED,
      txHash: mintTx.hash
    });

  } catch (error) {
    console.error('Convert points error:', error);
    res.status(500).json({ error: 'Failed to convert points to tokens' });
  }
});

// Get blockchain info
router.get('/blockchain-info', async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Get token balance from blockchain
    let tokenBalance = 0;
    let stakingInfo = null;

    try {
      tokenBalance = await tokenContract.balanceOf(wallet.address);
      tokenBalance = parseFloat(ethers.formatEther(tokenBalance));
    } catch (error) {
      console.error('Error getting token balance:', error);
    }

    // Get staking info from blockchain
    try {
      const stakeInfo = await stakingContract.getStakeInfo(wallet.address);
      if (stakeInfo.amount > 0) {
        const previewUnstake = await stakingContract.previewUnstake(wallet.address);
        stakingInfo = {
          amount: parseFloat(ethers.formatEther(stakeInfo.amount)),
          startTime: new Date(stakeInfo.startTime * 1000),
          apy: stakeInfo.apy,
          previewUnstake: parseFloat(ethers.formatEther(previewUnstake))
        };
      }
    } catch (error) {
      console.error('Error getting staking info:', error);
    }

    res.json({
      address: wallet.address,
      tokenBalance,
      stakingInfo,
      points: user.points,
      apy: user.getAPY()
    });
  } catch (error) {
    console.error('Get blockchain info error:', error);
    res.status(500).json({ error: 'Failed to get blockchain info' });
  }
});

// Stake tokens
router.post('/stake', async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check if user is already staking
    if (wallet.isStaking) {
      return res.status(400).json({ error: 'Already staking tokens' });
    }

    // Check if user has enough balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get APY based on user's points
    const apy = user.getAPY();
    if (apy === 0) {
      return res.status(400).json({ 
        error: 'Insufficient points for staking. Need at least 1000 points.' 
      });
    }

    // Create wallet instance for signing
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    
    // Create contract instances with signer
    const tokenContractWithSigner = tokenContract.connect(walletInstance);
    const stakingContractWithSigner = stakingContract.connect(walletInstance);

    // Approve tokens for staking contract
    const approveTx = await tokenContractWithSigner.approve(
      stakingContract.target,
      ethers.parseEther(amount.toString())
    );
    await approveTx.wait();

    // Stake tokens
    const stakeTx = await stakingContractWithSigner.stake(
      ethers.parseEther(amount.toString()),
      apy
    );
    await stakeTx.wait();

    // Update local wallet record
    await wallet.startStaking(amount, apy);

    // Add transaction record
    await wallet.addTransaction({
      type: 'stake',
      amount: amount,
      txHash: stakeTx.hash,
      status: 'completed',
      description: `Staked ${amount} tokens with ${apy}% APY`
    });

    res.json({
      message: 'Tokens staked successfully',
      amount,
      apy,
      txHash: stakeTx.hash
    });
  } catch (error) {
    console.error('Stake tokens error:', error);
    res.status(500).json({ error: 'Failed to stake tokens' });
  }
});

// Unstake tokens
router.post('/unstake', async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (!wallet.isStaking) {
      return res.status(400).json({ error: 'No tokens staked' });
    }

    // Create wallet instance for signing
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const stakingContractWithSigner = stakingContract.connect(walletInstance);

    // Unstake tokens
    const unstakeTx = await stakingContractWithSigner.unstake();
    await unstakeTx.wait();

    // Get the staking info before stopping
    const stakingInfo = wallet.getStakingInfo();
    
    // Update local wallet record
    await wallet.stopStaking();

    // Add transaction record
    await wallet.addTransaction({
      type: 'unstake',
      amount: stakingInfo.stakedAmount + stakingInfo.reward,
      txHash: unstakeTx.hash,
      status: 'completed',
      description: `Unstaked ${stakingInfo.stakedAmount} tokens + ${stakingInfo.reward} reward`
    });

    res.json({
      message: 'Tokens unstaked successfully',
      stakedAmount: stakingInfo.stakedAmount,
      reward: stakingInfo.reward,
      totalReceived: stakingInfo.stakedAmount + stakingInfo.reward,
      txHash: unstakeTx.hash
    });
  } catch (error) {
    console.error('Unstake tokens error:', error);
    res.status(500).json({ error: 'Failed to unstake tokens' });
  }
});

// Get staking preview
router.get('/staking-preview', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const apy = user.getAPY();
    const stakingInfo = wallet.getStakingInfo();

    res.json({
      canStake: apy > 0 && wallet.balance > 0 && !wallet.isStaking,
      apy,
      availableBalance: wallet.balance,
      stakingInfo,
      pointsRequired: {
        20: 1000,
        50: 10000,
        1000: 50000
      },
      blockchainAvailable: isBlockchainAvailable()
    });
  } catch (error) {
    console.error('Get staking preview error:', error);
    res.status(500).json({ error: 'Failed to get staking preview' });
  }
});

// Transfer tokens to another user
router.post('/transfer', async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    const { toAddress, amount } = req.body;
    
    if (!toAddress || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid address or amount' });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create wallet instance for signing
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const tokenContractWithSigner = tokenContract.connect(walletInstance);

    // Transfer tokens
    const transferTx = await tokenContractWithSigner.transfer(
      toAddress,
      ethers.parseEther(amount.toString())
    );
    await transferTx.wait();

    // Update local balance
    await wallet.updateBalance(-amount);

    // Add transaction record
    await wallet.addTransaction({
      type: 'transfer',
      amount: -amount,
      to: toAddress,
      txHash: transferTx.hash,
      status: 'completed',
      description: `Transferred ${amount} tokens to ${toAddress}`
    });

    res.json({
      message: 'Tokens transferred successfully',
      amount,
      toAddress,
      txHash: transferTx.hash
    });
  } catch (error) {
    console.error('Transfer tokens error:', error);
    res.status(500).json({ error: 'Failed to transfer tokens' });
  }
});

// Get token price and market info
router.get('/market-info', async (req, res) => {
  try {
    if (!isBlockchainAvailable()) {
      return res.status(503).json({ 
        error: 'Blockchain service not available. Please check contract addresses and RPC URL.' 
      });
    }

    // Get total supply
    const totalSupply = await tokenContract.totalSupply();
    const formattedTotalSupply = parseFloat(ethers.formatEther(totalSupply));

    // Get circulating supply (approximation)
    const circulatingSupply = formattedTotalSupply * 0.8; // Assuming 80% is in circulation

    res.json({
      totalSupply: formattedTotalSupply,
      circulatingSupply,
      tokenSymbol: 'RDT',
      tokenName: 'RedditToken',
      contractAddress: tokenContract.address,
      stakingContractAddress: stakingContract.address
    });
  } catch (error) {
    console.error('Get market info error:', error);
    res.status(500).json({ error: 'Failed to get market info' });
  }
});


module.exports = router; 