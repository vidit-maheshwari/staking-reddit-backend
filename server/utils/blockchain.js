const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.tokenContract = null;
    this.stakingContract = null;
    this.initialized = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Load contract ABIs
      const RedditTokenABI = require('../abi/RedditToken.json');
      const RedditStakingABI = require('../abi/RedditStaking.json');

      // Initialize provider and contracts only if addresses are provided
      if (process.env.RPC_URL && process.env.TOKEN_CONTRACT_ADDRESS && process.env.STAKING_CONTRACT_ADDRESS) {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.tokenContract = new ethers.Contract(
          process.env.TOKEN_CONTRACT_ADDRESS,
          RedditTokenABI,
          this.provider
        );
        this.stakingContract = new ethers.Contract(
          process.env.STAKING_CONTRACT_ADDRESS,
          RedditStakingABI,
          this.provider
        );
        this.initialized = true;
        console.log('Blockchain service initialized successfully');
      } else {
        console.warn('Blockchain service not initialized: Missing environment variables');
      }
    } catch (error) {
      console.warn('Blockchain service initialization failed:', error.message);
    }
  }

  // Check if blockchain service is available
  isAvailable() {
    return this.initialized && this.provider && this.tokenContract && this.stakingContract;
  }

  // Get token balance for an address
  async getTokenBalance(address) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const balance = await this.tokenContract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  // Get staking info for an address
  async getStakingInfo(address) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const stakeInfo = await this.stakingContract.getStakeInfo(address);
      if (stakeInfo.amount > 0) {
        const previewUnstake = await this.stakingContract.previewUnstake(address);
        return {
          amount: parseFloat(ethers.formatEther(stakeInfo.amount)),
          startTime: new Date(stakeInfo.startTime * 1000),
          apy: stakeInfo.apy,
          previewUnstake: parseFloat(ethers.formatEther(previewUnstake))
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting staking info:', error);
      return null;
    }
  }

  // Stake tokens
  async stakeTokens(privateKey, amount, apy) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const tokenContractWithSigner = this.tokenContract.connect(wallet);
      const stakingContractWithSigner = this.stakingContract.connect(wallet);

      // Approve tokens
      const approveTx = await tokenContractWithSigner.approve(
        this.stakingContract.address,
        ethers.parseEther(amount.toString())
      );
      await approveTx.wait();

      // Stake tokens
      const stakeTx = await stakingContractWithSigner.stake(
        ethers.parseEther(amount.toString()),
        apy
      );
      const receipt = await stakeTx.wait();

      return {
        success: true,
        txHash: stakeTx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error staking tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Unstake tokens
  async unstakeTokens(privateKey) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const stakingContractWithSigner = this.stakingContract.connect(wallet);

      const unstakeTx = await stakingContractWithSigner.unstake();
      const receipt = await unstakeTx.wait();

      return {
        success: true,
        txHash: unstakeTx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer tokens
  async transferTokens(privateKey, toAddress, amount) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const tokenContractWithSigner = this.tokenContract.connect(wallet);

      const transferTx = await tokenContractWithSigner.transfer(
        toAddress,
        ethers.parseEther(amount.toString())
      );
      const receipt = await transferTx.wait();

      return {
        success: true,
        txHash: transferTx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction history for an address
  async getTransactionHistory(address) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const filter = {
        address: this.tokenContract.address,
        fromBlock: 0,
        toBlock: 'latest'
      };

      const logs = await this.provider.getLogs(filter);
      const userTransactions = logs.filter(log => {
        const parsedLog = this.tokenContract.interface.parseLog(log);
        return parsedLog.args.from === address || parsedLog.args.to === address;
      });

      return userTransactions.map(log => {
        const parsedLog = this.tokenContract.interface.parseLog(log);
        return {
          type: parsedLog.name,
          from: parsedLog.args.from,
          to: parsedLog.args.to,
          amount: parseFloat(ethers.formatEther(parsedLog.args.value)),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        };
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // Get market info
  async getMarketInfo() {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const totalSupply = await this.tokenContract.totalSupply();
      const formattedTotalSupply = parseFloat(ethers.formatEther(totalSupply));

      return {
        totalSupply: formattedTotalSupply,
        circulatingSupply: formattedTotalSupply * 0.8, // Approximation
        tokenSymbol: 'RDT',
        tokenName: 'RedditToken',
        contractAddress: this.tokenContract.address,
        stakingContractAddress: this.stakingContract.address
      };
    } catch (error) {
      console.error('Error getting market info:', error);
      return null;
    }
  }

  // Validate Ethereum address
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  // Format token amount
  formatTokenAmount(amount) {
    return parseFloat(ethers.formatEther(amount));
  }

  // Parse token amount
  parseTokenAmount(amount) {
    return ethers.parseEther(amount.toString());
  }

  // Get network info
  async getNetworkInfo() {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

module.exports = new BlockchainService(); 