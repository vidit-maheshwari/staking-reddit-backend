# API Test Suite

This directory contains comprehensive tests for the Reddit Platform API.

## Test Files

- `api.test.js` - Jest-style test suite with 40+ test cases
- `run-tests.js` - Simple test runner that can be executed directly

## Prerequisites

1. Make sure the server is running on `http://localhost:5000`
2. Install dependencies: `npm install`
3. Ensure MongoDB is running and connected
4. Set up environment variables (see `.env.example`)

## Running Tests

### Method 1: Using the Simple Test Runner
```bash
npm test
```
or
```bash
node test/run-tests.js
```

### Method 2: Using Jest (if installed)
```bash
npm run test:jest
```

## Test Coverage

The test suite covers all major API endpoints:

### Authentication Tests
- ✅ User registration
- ✅ User login
- ✅ Get current user profile
- ✅ Update profile
- ✅ Refresh token
- ✅ Change password
- ✅ Error handling for invalid tokens

### Wallet & Crypto Tests
- ✅ Create wallet
- ✅ Get wallet info
- ✅ Get points info
- ✅ Get wallet balance
- ✅ Get transaction history
- ✅ Export wallet (get private key)
- ✅ Convert points to tokens
- ✅ Blockchain info (if contracts deployed)
- ✅ Staking preview
- ✅ Market info

### Post Management Tests
- ✅ Create post
- ✅ Get all posts
- ✅ Get specific post
- ✅ Update post
- ✅ Delete post
- ✅ Like/unlike post
- ✅ Add comment
- ✅ Like/unlike comment
- ✅ Get trending posts
- ✅ Test pagination
- ✅ Test filtering

### User Management Tests
- ✅ Get user profile
- ✅ Get user stats
- ✅ Get user's posts
- ✅ Get user activity
- ✅ Search users
- ✅ Points leaderboard
- ✅ Posts leaderboard
- ✅ Error handling for invalid users

### Error Handling Tests
- ✅ Invalid authentication tokens
- ✅ Invalid post IDs
- ✅ Invalid user names
- ✅ Missing required fields

## Test User

The tests use the following test user:
- **Username**: vidit
- **Email**: vidit@gmail.com
- **Password**: vidit123

## Test Results

The test runner provides detailed output including:
- ✅ Pass/fail status for each test
- ⏱️ Total execution time
- 📊 Success rate percentage
- 📋 Summary of passed/failed tests

## Expected Output

```
🚀 Starting Reddit Platform API Tests...

📋 Running 40 tests...

[1/40] Testing: Health Check
✅ Health Check - PASSED

[2/40] Testing: Register User
✅ Register User - PASSED

...

📊 Test Results Summary:
✅ Passed: 40
❌ Failed: 0
⏱️ Duration: 12.34 seconds
📈 Success Rate: 100.0%

🎉 All tests passed!
```

## Notes

- Some blockchain-related tests may be skipped if contracts are not deployed
- The test suite handles existing users gracefully (will login instead of register)
- Tests are designed to clean up after themselves (delete test posts)
- Error handling tests verify proper HTTP status codes
- All tests use the provided test user credentials

## Troubleshooting

1. **Server not running**: Make sure the server is started with `npm start`
2. **Database connection**: Ensure MongoDB is running and accessible
3. **Environment variables**: Check that all required env vars are set
4. **Port conflicts**: Verify the server is running on port 5000
5. **Network issues**: Check if localhost:5000 is accessible

## Adding New Tests

To add new tests, edit `run-tests.js` and add a new test object to the `tests` array:

```javascript
{
  name: 'New Test Name',
  fn: async () => {
    // Test implementation
    const response = await makeRequest('GET', '/new-endpoint');
    if (response.status !== 200) throw new Error('Test failed');
  }
}
``` 