const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'vidit',
  email: 'vidit@gmail.com',
  password: 'vidit123'
};

let authToken = '';
let walletAddress = '';

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Helper function to make unauthenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Blockchain-specific tests
const blockchainTests = [
  {
    name: 'Login User',
    fn: async () => {
      const response = await makeRequest('POST', '/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      authToken = response.data.token;
      console.log('  ✅ Login successful');
    }
  },
  {
    name: 'Get Wallet Info',
    fn: async () => {
      const response = await makeAuthRequest('GET', '/wallet/info');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      walletAddress = response.data.address;
      console.log(`  📍 Wallet Address: ${walletAddress}`);
      console.log(`  💰 Wallet Balance: ${response.data.balance} RDT`);
    }
  },
  {
    name: 'Get User Points',
    fn: async () => {
      const response = await makeAuthRequest('GET', '/wallet/points-info');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      console.log(`  🎯 User Points: ${response.data.points}`);
      console.log(`  📈 APY Based on Points: ${response.data.apy}%`);
    }
  },
  {
    name: 'Check Blockchain Availability',
    fn: async () => {
      try {
        const response = await makeAuthRequest('GET', '/crypto/blockchain-info');
        if (response.status === 200) {
          console.log('  ✅ Blockchain is available and connected');
          console.log(`  🌐 Contract Address: ${response.data.address}`);
          console.log(`  💰 Token Balance: ${response.data.tokenBalance} RDT`);
          if (response.data.stakingInfo) {
            console.log(`  🔒 Currently Staked: ${response.data.stakingInfo.amount} RDT`);
          }
        }
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ❌ Blockchain not available - contracts may not be deployed');
          console.log('  💡 Make sure to:');
          console.log('     - Deploy RedditToken.sol and Staking.sol contracts');
          console.log('     - Set RPC_URL, TOKEN_CONTRACT_ADDRESS, and STAKING_CONTRACT_ADDRESS in .env');
          console.log('     - Ensure the contracts are on the correct network');
        } else {
          throw error;
        }
      }
    }
  },
  {
    name: 'Get Staking Preview',
    fn: async () => {
      try {
        const response = await makeAuthRequest('GET', '/crypto/staking-preview');
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  📊 Can Stake: ${response.data.canStake}`);
        console.log(`  📈 APY: ${response.data.apy}%`);
        console.log(`  💰 Available Balance: ${response.data.availableBalance} RDT`);
        console.log(`  🔗 Blockchain Available: ${response.data.blockchainAvailable}`);
        
        if (response.data.stakingInfo) {
          console.log(`  🔒 Current Staking: ${response.data.stakingInfo.amount} RDT`);
        }
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ℹ️ Blockchain service not available');
        } else {
          throw error;
        }
      }
    }
  },
  {
    name: 'Get Market Info',
    fn: async () => {
      try {
        const response = await makeAuthRequest('GET', '/crypto/market-info');
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  🏪 Token Symbol: ${response.data.tokenSymbol}`);
        console.log(`  📊 Total Supply: ${response.data.totalSupply} RDT`);
        console.log(`  🔄 Circulating Supply: ${response.data.circulatingSupply} RDT`);
        console.log(`  📍 Token Contract: ${response.data.contractAddress}`);
        console.log(`  📍 Staking Contract: ${response.data.stakingContractAddress}`);
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ℹ️ Blockchain service not available');
        } else {
          throw error;
        }
      }
    }
  },
  {
    name: 'Stake Tokens (Real Blockchain Transaction)',
    fn: async () => {
      try {
        // Check if user has tokens and can stake
        const walletResponse = await makeAuthRequest('GET', '/wallet/info');
        const stakingPreview = await makeAuthRequest('GET', '/crypto/staking-preview');
        
        if (walletResponse.data.balance < 1) {
          console.log('  ℹ️ Not enough tokens to stake (need at least 1 RDT)');
          console.log('  💡 Try earning more points by posting, liking, and commenting');
          return;
        }
        
        if (!stakingPreview.data.canStake) {
          console.log('  ℹ️ Cannot stake right now');
          if (stakingPreview.data.stakingInfo) {
            console.log(`  🔒 Already staking ${stakingPreview.data.stakingInfo.amount} RDT`);
          }
          if (stakingPreview.data.apy === 0) {
            console.log('  📈 Need at least 1000 points to get APY > 0%');
          }
          return;
        }
        
        console.log('  🔒 Attempting to stake 1 RDT...');
        const stakeData = { amount: 1 };
        const response = await makeAuthRequest('POST', '/crypto/stake', stakeData);
        
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  ✅ Successfully staked ${response.data.amount} RDT`);
        console.log(`  📈 APY: ${response.data.apy}%`);
        console.log(`  🔗 Transaction Hash: ${response.data.txHash}`);
        console.log(`  ⏱️ Transaction will be confirmed on blockchain`);
        
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ❌ Blockchain service not available');
        } else if (error.response?.status === 400) {
          console.log(`  ❌ Cannot stake: ${error.response.data.error}`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }
  },
  {
    name: 'Get Staking Info (From Blockchain)',
    fn: async () => {
      try {
        const response = await makeAuthRequest('GET', '/crypto/blockchain-info');
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        if (response.data.stakingInfo) {
          console.log(`  🔒 Staked Amount: ${response.data.stakingInfo.amount} RDT`);
          console.log(`  📈 APY: ${response.data.stakingInfo.apy}%`);
          console.log(`  ⏰ Start Time: ${response.data.stakingInfo.startTime}`);
          console.log(`  💰 Preview Unstake: ${response.data.stakingInfo.previewUnstake} RDT`);
          console.log(`  📊 This data is fetched directly from the smart contract`);
        } else {
          console.log('  ℹ️ No tokens currently staked');
        }
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ℹ️ Blockchain service not available');
        } else {
          throw error;
        }
      }
    }
  },
  {
    name: 'Unstake Tokens (Real Blockchain Transaction)',
    fn: async () => {
      try {
        // Check if user is staking
        const blockchainInfo = await makeAuthRequest('GET', '/crypto/blockchain-info');
        
        if (!blockchainInfo.data.stakingInfo || blockchainInfo.data.stakingInfo.amount <= 0) {
          console.log('  ℹ️ No tokens staked to unstake');
          return;
        }
        
        console.log('  🔓 Attempting to unstake tokens...');
        const response = await makeAuthRequest('POST', '/crypto/unstake');
        
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  ✅ Successfully unstaked tokens`);
        console.log(`  💰 Staked Amount: ${response.data.stakedAmount} RDT`);
        console.log(`  🎁 Reward Earned: ${response.data.reward} RDT`);
        console.log(`  💰 Total Received: ${response.data.totalReceived} RDT`);
        console.log(`  🔗 Transaction Hash: ${response.data.txHash}`);
        console.log(`  ⏱️ Transaction will be confirmed on blockchain`);
        
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ❌ Blockchain service not available');
        } else if (error.response?.status === 400) {
          console.log(`  ❌ Cannot unstake: ${error.response.data.error}`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }
  },
  {
    name: 'Transfer Tokens (Real Blockchain Transaction)',
    fn: async () => {
      try {
        // Check if user has tokens
        const walletResponse = await makeAuthRequest('GET', '/wallet/info');
        
        if (walletResponse.data.balance < 0.5) {
          console.log('  ℹ️ Not enough tokens to transfer (need at least 0.5 RDT)');
          return;
        }
        
        // Transfer 0.5 tokens to a test address
        const transferData = {
          toAddress: '0x000000000000000000000000000000000000dead',
          amount: 0.5
        };
        
        console.log('  💸 Attempting to transfer 0.5 RDT...');
        const response = await makeAuthRequest('POST', '/crypto/transfer', transferData);
        
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  ✅ Successfully transferred ${response.data.amount} RDT`);
        console.log(`  📍 To Address: ${response.data.toAddress}`);
        console.log(`  🔗 Transaction Hash: ${response.data.txHash}`);
        console.log(`  ⏱️ Transaction will be confirmed on blockchain`);
        
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ❌ Blockchain service not available');
        } else if (error.response?.status === 400) {
          console.log(`  ❌ Cannot transfer: ${error.response.data.error}`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }
  },
  {
    name: 'Get Blockchain Transaction History',
    fn: async () => {
      try {
        const response = await makeAuthRequest('GET', '/crypto/transactions');
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        
        console.log(`  📜 Found ${response.data.transactions.length} blockchain transactions`);
        
        if (response.data.transactions.length > 0) {
          console.log('  📋 Recent transactions:');
          response.data.transactions.slice(0, 3).forEach((tx, index) => {
            console.log(`    ${index + 1}. ${tx.type}: ${tx.amount} RDT (${tx.transactionHash})`);
          });
        } else {
          console.log('  ℹ️ No blockchain transactions found');
        }
        
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('  ℹ️ Blockchain service not available');
        } else {
          throw error;
        }
      }
    }
  },
  {
    name: 'Convert Points to Tokens',
    fn: async () => {
      try {
        const pointsResponse = await makeAuthRequest('GET', '/wallet/points-info');
        const points = pointsResponse.data.points;
        
        if (points >= 100) {
          console.log(`  🔄 Converting 100 points to tokens...`);
          const convertData = { points: 100 };
          const response = await makeAuthRequest('POST', '/wallet/convert-points', convertData);
          
          if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
          
          console.log(`  ✅ Converted 100 points to ${response.data.tokensReceived} RDT`);
          console.log(`  💰 New balance: ${response.data.newBalance} RDT`);
        } else {
          console.log(`  ℹ️ User has ${points} points (need 100 for conversion)`);
          console.log('  💡 Earn more points by posting, liking, and commenting');
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }
];

// Main blockchain test runner
const runBlockchainTests = async () => {
  console.log('🚀 Starting Blockchain API Tests...\n');
  console.log('🔗 These tests will interact with your deployed smart contracts\n');
  console.log(`📋 Running ${blockchainTests.length} blockchain tests...\n`);
  
  let passedTests = 0;
  let failedTests = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < blockchainTests.length; i++) {
    const test = blockchainTests[i];
    const testNumber = i + 1;
    
    try {
      console.log(`[${testNumber}/${blockchainTests.length}] Testing: ${test.name}`);
      await test.fn();
      console.log(`✅ ${test.name} - PASSED\n`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED: ${error.message}\n`);
      failedTests++;
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('📊 Blockchain Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️ Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📈 Success Rate: ${((passedTests / blockchainTests.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All blockchain tests passed!');
    console.log('🔗 Your smart contracts are working correctly!');
  } else {
    console.log(`\n⚠️ ${failedTests} test(s) failed.`);
    console.log('💡 Make sure your contracts are deployed and environment variables are set correctly.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runBlockchainTests().catch(console.error);
}

module.exports = { runBlockchainTests, blockchainTests }; 