const axios = require('axios');
const mongoose = require('mongoose');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'vidit',
  email: 'vidit@gmail.com',
  password: 'vidit123'
};

let authToken = '';
let userId = '';
let postId = '';
let walletId = '';
let commentId = '';

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

// Test suite
describe('Reddit Platform API Tests', () => {
  
  // Test 1: Health Check
  test('Health Check', async () => {
    try {
      const response = await makeRequest('GET', '/health');
      console.log('✅ Health Check:', response.status);
      expect(response.status).toBe(200);
    } catch (error) {
      console.log('❌ Health Check failed:', error.message);
      throw error;
    }
  });

  // Test 2: Register User
  test('Register User', async () => {
    try {
      const response = await makeRequest('POST', '/auth/register', TEST_USER);
      console.log('✅ Register User:', response.status);
      expect(response.status).toBe(201);
      expect(response.data.user.username).toBe(TEST_USER.username);
      expect(response.data.user.email).toBe(TEST_USER.email);
      expect(response.data.token).toBeDefined();
      authToken = response.data.token;
      userId = response.data.user._id;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding with login...');
        // Try to login instead
        const loginResponse = await makeRequest('POST', '/auth/login', {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        authToken = loginResponse.data.token;
        userId = loginResponse.data.user._id;
        console.log('✅ Login successful');
      } else {
        console.log('❌ Register User failed:', error.message);
        throw error;
      }
    }
  });

  // Test 3: Login User
  test('Login User', async () => {
    try {
      const response = await makeRequest('POST', '/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      console.log('✅ Login User:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      authToken = response.data.token;
    } catch (error) {
      console.log('❌ Login User failed:', error.message);
      throw error;
    }
  });

  // Test 4: Get Current User Profile
  test('Get Current User Profile', async () => {
    try {
      const response = await makeAuthRequest('GET', '/auth/me');
      console.log('✅ Get Current User Profile:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.username).toBe(TEST_USER.username);
      expect(response.data.email).toBe(TEST_USER.email);
    } catch (error) {
      console.log('❌ Get Current User Profile failed:', error.message);
      throw error;
    }
  });

  // Test 5: Update Profile
  test('Update Profile', async () => {
    try {
      const updateData = {
        bio: 'Test bio for API testing',
        avatar: 'https://example.com/avatar.jpg'
      };
      const response = await makeAuthRequest('PUT', '/auth/profile', updateData);
      console.log('✅ Update Profile:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.user.bio).toBe(updateData.bio);
      expect(response.data.user.avatar).toBe(updateData.avatar);
    } catch (error) {
      console.log('❌ Update Profile failed:', error.message);
      throw error;
    }
  });

  // Test 6: Create Wallet
  test('Create Wallet', async () => {
    try {
      const response = await makeAuthRequest('POST', '/wallet/create');
      console.log('✅ Create Wallet:', response.status);
      expect(response.status).toBe(201);
      expect(response.data.address).toBeDefined();
      expect(response.data.privateKey).toBeDefined();
      expect(response.data.warning).toBeDefined();
      walletId = response.data.walletId;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        console.log('ℹ️ Wallet already exists');
      } else {
        console.log('❌ Create Wallet failed:', error.message);
        throw error;
      }
    }
  });

  // Test 7: Get Wallet Info
  test('Get Wallet Info', async () => {
    try {
      const response = await makeAuthRequest('GET', '/wallet/info');
      console.log('✅ Get Wallet Info:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.address).toBeDefined();
      expect(response.data.balance).toBeDefined();
      expect(response.data.stakingInfo).toBeDefined();
    } catch (error) {
      console.log('❌ Get Wallet Info failed:', error.message);
      throw error;
    }
  });

  // Test 8: Get Points Info
  test('Get Points Info', async () => {
    try {
      const response = await makeAuthRequest('GET', '/wallet/points-info');
      console.log('✅ Get Points Info:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.points).toBeDefined();
      expect(response.data.hasWallet).toBeDefined();
      expect(response.data.conversionRate).toBeDefined();
    } catch (error) {
      console.log('❌ Get Points Info failed:', error.message);
      throw error;
    }
  });

  // Test 9: Create Post
  test('Create Post', async () => {
    try {
      const postData = {
        title: 'Test Post for API Testing',
        content: 'This is a test post to verify the API functionality. Testing posts, likes, and comments.',
        tags: ['test', 'api', 'reddit']
      };
      const response = await makeAuthRequest('POST', '/posts', postData);
      console.log('✅ Create Post:', response.status);
      expect(response.status).toBe(201);
      expect(response.data.post.title).toBe(postData.title);
      expect(response.data.post.content).toBe(postData.content);
      expect(response.data.pointsEarned).toBe(5);
      postId = response.data.post._id;
    } catch (error) {
      console.log('❌ Create Post failed:', error.message);
      throw error;
    }
  });

  // Test 10: Get All Posts
  test('Get All Posts', async () => {
    try {
      const response = await makeRequest('GET', '/posts');
      console.log('✅ Get All Posts:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.posts).toBeDefined();
      expect(response.data.pagination).toBeDefined();
    } catch (error) {
      console.log('❌ Get All Posts failed:', error.message);
      throw error;
    }
  });

  // Test 11: Get Specific Post
  test('Get Specific Post', async () => {
    try {
      const response = await makeRequest('GET', `/posts/${postId}`);
      console.log('✅ Get Specific Post:', response.status);
      expect(response.status).toBe(200);
      expect(response.data._id).toBe(postId);
      expect(response.data.title).toBeDefined();
      expect(response.data.content).toBeDefined();
    } catch (error) {
      console.log('❌ Get Specific Post failed:', error.message);
      throw error;
    }
  });

  // Test 12: Like Post
  test('Like Post', async () => {
    try {
      const response = await makeAuthRequest('POST', `/posts/${postId}/like`);
      console.log('✅ Like Post:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.liked).toBe(true);
      expect(response.data.pointsEarned).toBe(1);
    } catch (error) {
      console.log('❌ Like Post failed:', error.message);
      throw error;
    }
  });

  // Test 13: Add Comment
  test('Add Comment', async () => {
    try {
      const commentData = {
        content: 'This is a test comment for API testing.'
      };
      const response = await makeAuthRequest('POST', `/posts/${postId}/comments`, commentData);
      console.log('✅ Add Comment:', response.status);
      expect(response.status).toBe(201);
      expect(response.data.comment.content).toBe(commentData.content);
      expect(response.data.pointsEarned).toBe(2);
      commentId = response.data.comment._id;
    } catch (error) {
      console.log('❌ Add Comment failed:', error.message);
      throw error;
    }
  });

  // Test 14: Like Comment
  test('Like Comment', async () => {
    try {
      const response = await makeAuthRequest('POST', `/posts/${postId}/comments/${commentId}/like`);
      console.log('✅ Like Comment:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.liked).toBe(true);
    } catch (error) {
      console.log('❌ Like Comment failed:', error.message);
      throw error;
    }
  });

  // Test 15: Get User Profile
  test('Get User Profile', async () => {
    try {
      const response = await makeRequest('GET', `/users/profile/${TEST_USER.username}`);
      console.log('✅ Get User Profile:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.user.username).toBe(TEST_USER.username);
      expect(response.data.recentPosts).toBeDefined();
    } catch (error) {
      console.log('❌ Get User Profile failed:', error.message);
      throw error;
    }
  });

  // Test 16: Get User Stats
  test('Get User Stats', async () => {
    try {
      const response = await makeRequest('GET', `/users/${TEST_USER.username}/stats`);
      console.log('✅ Get User Stats:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.username).toBe(TEST_USER.username);
      expect(response.data.points).toBeDefined();
      expect(response.data.totalPosts).toBeDefined();
    } catch (error) {
      console.log('❌ Get User Stats failed:', error.message);
      throw error;
    }
  });

  // Test 17: Get Points Leaderboard
  test('Get Points Leaderboard', async () => {
    try {
      const response = await makeRequest('GET', '/users/leaderboard/points');
      console.log('✅ Get Points Leaderboard:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.users).toBeDefined();
    } catch (error) {
      console.log('❌ Get Points Leaderboard failed:', error.message);
      throw error;
    }
  });

  // Test 18: Get Posts Leaderboard
  test('Get Posts Leaderboard', async () => {
    try {
      const response = await makeRequest('GET', '/users/leaderboard/posts');
      console.log('✅ Get Posts Leaderboard:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.users).toBeDefined();
    } catch (error) {
      console.log('❌ Get Posts Leaderboard failed:', error.message);
      throw error;
    }
  });

  // Test 19: Search Users
  test('Search Users', async () => {
    try {
      const response = await makeRequest('GET', '/users/search?q=vidit');
      console.log('✅ Search Users:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.users).toBeDefined();
    } catch (error) {
      console.log('❌ Search Users failed:', error.message);
      throw error;
    }
  });

  // Test 20: Get Trending Posts
  test('Get Trending Posts', async () => {
    try {
      const response = await makeRequest('GET', '/posts/trending/posts');
      console.log('✅ Get Trending Posts:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.posts).toBeDefined();
    } catch (error) {
      console.log('❌ Get Trending Posts failed:', error.message);
      throw error;
    }
  });

  // Test 21: Get Wallet Balance
  test('Get Wallet Balance', async () => {
    try {
      const response = await makeAuthRequest('GET', '/wallet/balance');
      console.log('✅ Get Wallet Balance:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.balance).toBeDefined();
      expect(response.data.points).toBeDefined();
      expect(response.data.stakingInfo).toBeDefined();
    } catch (error) {
      console.log('❌ Get Wallet Balance failed:', error.message);
      throw error;
    }
  });

  // Test 22: Get Transaction History
  test('Get Transaction History', async () => {
    try {
      const response = await makeAuthRequest('GET', '/wallet/transactions');
      console.log('✅ Get Transaction History:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.transactions).toBeDefined();
      expect(response.data.pagination).toBeDefined();
    } catch (error) {
      console.log('❌ Get Transaction History failed:', error.message);
      throw error;
    }
  });

  // Test 23: Export Wallet (Get Private Key)
  test('Export Wallet', async () => {
    try {
      const response = await makeAuthRequest('GET', '/wallet/export');
      console.log('✅ Export Wallet:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.address).toBeDefined();
      expect(response.data.privateKey).toBeDefined();
      expect(response.data.warning).toBeDefined();
    } catch (error) {
      console.log('❌ Export Wallet failed:', error.message);
      throw error;
    }
  });

  // Test 24: Update Post
  test('Update Post', async () => {
    try {
      const updateData = {
        title: 'Updated Test Post',
        content: 'This post has been updated for API testing.',
        tags: ['updated', 'test', 'api']
      };
      const response = await makeAuthRequest('PUT', `/posts/${postId}`, updateData);
      console.log('✅ Update Post:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.post.title).toBe(updateData.title);
      expect(response.data.post.content).toBe(updateData.content);
    } catch (error) {
      console.log('❌ Update Post failed:', error.message);
      throw error;
    }
  });

  // Test 25: Unlike Post
  test('Unlike Post', async () => {
    try {
      const response = await makeAuthRequest('POST', `/posts/${postId}/like`);
      console.log('✅ Unlike Post:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.liked).toBe(false);
      expect(response.data.pointsRemoved).toBe(1);
    } catch (error) {
      console.log('❌ Unlike Post failed:', error.message);
      throw error;
    }
  });

  // Test 26: Unlike Comment
  test('Unlike Comment', async () => {
    try {
      const response = await makeAuthRequest('POST', `/posts/${postId}/comments/${commentId}/like`);
      console.log('✅ Unlike Comment:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.liked).toBe(false);
    } catch (error) {
      console.log('❌ Unlike Comment failed:', error.message);
      throw error;
    }
  });

  // Test 27: Get User's Posts
  test('Get User\'s Posts', async () => {
    try {
      const response = await makeRequest('GET', `/users/${TEST_USER.username}/posts`);
      console.log('✅ Get User\'s Posts:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.posts).toBeDefined();
      expect(response.data.pagination).toBeDefined();
    } catch (error) {
      console.log('❌ Get User\'s Posts failed:', error.message);
      throw error;
    }
  });

  // Test 28: Get User Activity
  test('Get User Activity', async () => {
    try {
      const response = await makeRequest('GET', `/users/${TEST_USER.username}/activity`);
      console.log('✅ Get User Activity:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.activity).toBeDefined();
      expect(response.data.pagination).toBeDefined();
    } catch (error) {
      console.log('❌ Get User Activity failed:', error.message);
      throw error;
    }
  });

  // Test 29: Refresh Token
  test('Refresh Token', async () => {
    try {
      const response = await makeAuthRequest('POST', '/auth/refresh');
      console.log('✅ Refresh Token:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      authToken = response.data.token; // Update token
    } catch (error) {
      console.log('❌ Refresh Token failed:', error.message);
      throw error;
    }
  });

  // Test 30: Change Password
  test('Change Password', async () => {
    try {
      const passwordData = {
        currentPassword: TEST_USER.password,
        newPassword: 'newvidit123'
      };
      const response = await makeAuthRequest('PUT', '/auth/password', passwordData);
      console.log('✅ Change Password:', response.status);
      expect(response.status).toBe(200);
      
      // Change it back
      const revertData = {
        currentPassword: 'newvidit123',
        newPassword: TEST_USER.password
      };
      await makeAuthRequest('PUT', '/auth/password', revertData);
    } catch (error) {
      console.log('❌ Change Password failed:', error.message);
      throw error;
    }
  });

  // Test 31: Convert Points to Tokens (if user has enough points)
  test('Convert Points to Tokens', async () => {
    try {
      // First check if user has enough points
      const pointsResponse = await makeAuthRequest('GET', '/wallet/points-info');
      const points = pointsResponse.data.points;
      
      if (points >= 100) {
        const convertData = {
          points: 100
        };
        const response = await makeAuthRequest('POST', '/wallet/convert-points', convertData);
        console.log('✅ Convert Points to Tokens:', response.status);
        expect(response.status).toBe(200);
        expect(response.data.pointsConverted).toBe(100);
        expect(response.data.tokensReceived).toBe(2);
      } else {
        console.log('ℹ️ User has insufficient points for conversion test');
      }
    } catch (error) {
      console.log('❌ Convert Points to Tokens failed:', error.message);
      throw error;
    }
  });

  // Test 32: Blockchain Info (if blockchain is configured)
  test('Get Blockchain Info', async () => {
    try {
      const response = await makeAuthRequest('GET', '/crypto/blockchain-info');
      console.log('✅ Get Blockchain Info:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.address).toBeDefined();
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('ℹ️ Blockchain service not available (expected if contracts not deployed)');
      } else {
        console.log('❌ Get Blockchain Info failed:', error.message);
        throw error;
      }
    }
  });

  // Test 33: Get Staking Preview
  test('Get Staking Preview', async () => {
    try {
      const response = await makeAuthRequest('GET', '/crypto/staking-preview');
      console.log('✅ Get Staking Preview:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.canStake).toBeDefined();
      expect(response.data.apy).toBeDefined();
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('ℹ️ Blockchain service not available (expected if contracts not deployed)');
      } else {
        console.log('❌ Get Staking Preview failed:', error.message);
        throw error;
      }
    }
  });

  // Test 34: Get Market Info
  test('Get Market Info', async () => {
    try {
      const response = await makeRequest('GET', '/crypto/market-info');
      console.log('✅ Get Market Info:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.tokenSymbol).toBe('RDT');
      expect(response.data.tokenName).toBe('RedditToken');
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('ℹ️ Blockchain service not available (expected if contracts not deployed)');
      } else {
        console.log('❌ Get Market Info failed:', error.message);
        throw error;
      }
    }
  });

  // Test 35: Delete Post (Cleanup)
  test('Delete Post', async () => {
    try {
      const response = await makeAuthRequest('DELETE', `/posts/${postId}`);
      console.log('✅ Delete Post:', response.status);
      expect(response.status).toBe(200);
    } catch (error) {
      console.log('❌ Delete Post failed:', error.message);
      throw error;
    }
  });

  // Test 36: Test Pagination
  test('Test Pagination', async () => {
    try {
      const response = await makeRequest('GET', '/posts?page=1&limit=5');
      console.log('✅ Test Pagination:', response.status);
      expect(response.status).toBe(200);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(5);
    } catch (error) {
      console.log('❌ Test Pagination failed:', error.message);
      throw error;
    }
  });

  // Test 37: Test Filtering
  test('Test Filtering', async () => {
    try {
      const response = await makeRequest('GET', `/posts?author=${TEST_USER.username}`);
      console.log('✅ Test Filtering:', response.status);
      expect(response.status).toBe(200);
    } catch (error) {
      console.log('❌ Test Filtering failed:', error.message);
      throw error;
    }
  });

  // Test 38: Test Error Handling - Invalid Token
  test('Test Error Handling - Invalid Token', async () => {
    try {
      const invalidToken = 'invalid-token';
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      // This should fail
      expect(response.status).toBe(401);
    } catch (error) {
      console.log('✅ Invalid Token Error Handling:', error.response?.status);
      expect(error.response?.status).toBe(401);
    }
  });

  // Test 39: Test Error Handling - Invalid Post ID
  test('Test Error Handling - Invalid Post ID', async () => {
    try {
      const response = await makeRequest('GET', '/posts/invalid-post-id');
      // This should fail
      expect(response.status).toBe(404);
    } catch (error) {
      console.log('✅ Invalid Post ID Error Handling:', error.response?.status);
      expect(error.response?.status).toBe(404);
    }
  });

  // Test 40: Test Error Handling - Invalid User
  test('Test Error Handling - Invalid User', async () => {
    try {
      const response = await makeRequest('GET', '/users/profile/nonexistentuser');
      // This should fail
      expect(response.status).toBe(404);
    } catch (error) {
      console.log('✅ Invalid User Error Handling:', error.response?.status);
      expect(error.response?.status).toBe(404);
    }
  });

});

// Cleanup after all tests
afterAll(async () => {
  console.log('\n🧹 Test cleanup completed');
  // Close any open connections if needed
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

// Test runner
const runTests = async () => {
  console.log('🚀 Starting Reddit Platform API Tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  const testFunctions = [
    { name: 'Health Check', fn: async () => {
      const response = await makeRequest('GET', '/health');
      expect(response.status).toBe(200);
    }},
    { name: 'Register User', fn: async () => {
      const response = await makeRequest('POST', '/auth/register', TEST_USER);
      expect(response.status).toBe(201);
      authToken = response.data.token;
      userId = response.data.user._id;
    }},
    // Add all other test functions here...
  ];
  
  for (const test of testFunctions) {
    try {
      await test.fn();
      console.log(`✅ ${test.name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
};

// Export for use with test runners
module.exports = { runTests, makeAuthRequest, makeRequest }; 