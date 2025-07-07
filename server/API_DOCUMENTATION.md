# Reddit Platform API Documentation

Complete API documentation for the Reddit-like platform with crypto integration.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "bio": "string",
    "points": 0,
    "walletAddress": null,
    "isWalletCreated": false,
    "dailyPostsCount": 0,
    "totalPosts": 0,
    "totalLikes": 0,
    "totalComments": 0,
    "role": "user",
    "createdAt": "date",
    "lastActive": "date"
  }
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    // Same user object as register
  }
}
```

### Get Current User Profile
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  // User object without password
}
```

### Update Profile
**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "string (optional)",
  "bio": "string (optional, max 500 chars)",
  "avatar": "string (optional, valid URL)"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    // Updated user object
  }
}
```

### Change Password
**PUT** `/auth/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### Refresh Token
**POST** `/auth/refresh`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "token": "new-jwt-token"
}
```

---

## 📝 Posts Endpoints

### Create Post
**POST** `/posts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (1-300 chars)",
  "content": "string (1-10000 chars)",
  "image": "string (optional, URL)",
  "tags": ["string"] (optional)
}
```

**Response (201):**
```json
{
  "message": "Post created successfully",
  "post": {
    "_id": "string",
    "author": {
      "_id": "string",
      "username": "string",
      "avatar": "string"
    },
    "title": "string",
    "content": "string",
    "image": "string",
    "tags": ["string"],
    "likes": [],
    "comments": [],
    "likeCount": 0,
    "commentCount": 0,
    "viewCount": 0,
    "isDeleted": false,
    "isPinned": false,
    "createdAt": "date",
    "updatedAt": "date"
  },
  "pointsEarned": 5
}
```

### Get All Posts
**GET** `/posts`

**Query Parameters:**
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 10)
- `tag` (optional): string (filter by tag)
- `author` (optional): string (filter by username)

**Response (200):**
```json
{
  "posts": [
    {
      "_id": "string",
      "author": {
        "_id": "string",
        "username": "string",
        "avatar": "string"
      },
      "title": "string",
      "content": "string",
      "image": "string",
      "tags": ["string"],
      "likes": [
        {
          "user": {
            "_id": "string",
            "username": "string"
          },
          "createdAt": "date"
        }
      ],
      "comments": [
        {
          "_id": "string",
          "user": {
            "_id": "string",
            "username": "string",
            "avatar": "string"
          },
          "content": "string",
          "createdAt": "date",
          "likes": []
        }
      ],
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 0,
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Get Specific Post
**GET** `/posts/:id`

**Response (200):**
```json
{
  // Same post object as above with full details
}
```

### Like/Unlike Post
**POST** `/posts/:id/like`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Post liked" | "Post unliked",
  "liked": true | false,
  "pointsEarned": 1 | "pointsRemoved": 1
}
```

### Add Comment
**POST** `/posts/:id/comments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "string (1-1000 chars)"
}
```

**Response (201):**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "_id": "string",
    "user": {
      "_id": "string",
      "username": "string",
      "avatar": "string"
    },
    "content": "string",
    "createdAt": "date",
    "likes": []
  },
  "pointsEarned": 2
}
```

### Like/Unlike Comment
**POST** `/posts/:postId/comments/:commentId/like`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Comment liked" | "Comment unliked",
  "liked": true | false
}
```

### Update Post
**PUT** `/posts/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "tags": ["string"] (optional)
}
```

**Response (200):**
```json
{
  "message": "Post updated successfully",
  "post": {
    // Updated post object
  }
}
```

### Delete Post
**DELETE** `/posts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

### Get Trending Posts
**GET** `/posts/trending/posts`

**Query Parameters:**
- `limit` (optional): number (default: 10)

**Response (200):**
```json
{
  "posts": [
    {
      // Post objects with score based on likes, comments, and views
    }
  ]
}
```

---

## 👥 Users Endpoints

### Get User Profile
**GET** `/users/profile/:username`

**Response (200):**
```json
{
  "user": {
    // User object without password
  },
  "recentPosts": [
    // Array of user's recent posts
  ]
}
```

### Get User's Posts
**GET** `/users/:username/posts`

**Query Parameters:**
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 10)

**Response (200):**
```json
{
  "posts": [
    // Array of user's posts
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Get Points Leaderboard
**GET** `/users/leaderboard/points`

**Query Parameters:**
- `limit` (optional): number (default: 10)

**Response (200):**
```json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "avatar": "string",
      "points": 1000,
      "totalPosts": 50,
      "totalLikes": 200,
      "totalComments": 100,
      "createdAt": "date"
    }
  ]
}
```

### Get Posts Leaderboard
**GET** `/users/leaderboard/posts`

**Query Parameters:**
- `limit` (optional): number (default: 10)

**Response (200):**
```json
{
  "users": [
    // Same structure as points leaderboard
  ]
}
```

### Search Users
**GET** `/users/search`

**Query Parameters:**
- `q` (required): string (search query)

**Response (200):**
```json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "avatar": "string",
      "bio": "string",
      "points": 100,
      "totalPosts": 10
    }
  ]
}
```

### Get User Stats
**GET** `/users/:username/stats`

**Response (200):**
```json
{
  "username": "string",
  "points": 1000,
  "totalPosts": 50,
  "totalLikesReceived": 200,
  "totalCommentsReceived": 100,
  "totalViews": 5000,
  "apy": 20,
  "dailyPostsCount": 3,
  "canPostToday": true,
  "memberSince": "date"
}
```

### Get User Activity
**GET** `/users/:username/activity`

**Query Parameters:**
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 10)

**Response (200):**
```json
{
  "activity": [
    {
      "_id": "string",
      "title": "string",
      "createdAt": "date",
      "likeCount": 10,
      "commentCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## 💰 Wallet Endpoints

### Create Wallet
**POST** `/wallet/create`

**Headers:** `Authorization: Bearer <token>`

**Response (201):**
```json
{
  "message": "Wallet created successfully",
  "address": "0x...",
  "privateKey": "0x...",
  "walletId": "string",
  "warning": "Keep your private key secure and never share it!"
}
```

### Get Wallet Info
**GET** `/wallet/info`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "address": "0x...",
  "balance": 100.5,
  "stakingInfo": {
    "isStaking": false,
    "stakedAmount": 0,
    "reward": 0,
    "apy": 0
  },
  "totalEarned": 50.25,
  "totalStaked": 200,
  "transactions": [
    {
      "type": "convert",
      "amount": 10,
      "description": "Converted 500 points to 10 tokens",
      "timestamp": "date",
      "status": "completed"
    }
  ]
}
```

### Convert Points to Tokens
**POST** `/wallet/convert-points`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "points": 100 // Must be multiple of 100
}
```

**Response (200):**
```json
{
  "message": "Points converted successfully",
  "pointsConverted": 100,
  "tokensReceived": 2,
  "remainingPoints": 50
}
```

### Get Transaction History
**GET** `/wallet/transactions`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20)

**Response (200):**
```json
{
  "transactions": [
    {
      "type": "convert" | "stake" | "unstake" | "transfer",
      "amount": 10,
      "from": "0x...",
      "to": "0x...",
      "txHash": "0x...",
      "status": "pending" | "completed" | "failed",
      "timestamp": "date",
      "description": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Get Wallet Balance
**GET** `/wallet/balance`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "balance": 100.5,
  "points": 250,
  "stakingInfo": {
    "isStaking": false,
    "stakedAmount": 0,
    "reward": 0,
    "apy": 0
  },
  "totalEarned": 50.25,
  "totalStaked": 200
}
```

### Get Points Info
**GET** `/wallet/points-info`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "points": 250,
  "hasWallet": true,
  "conversionRate": 100,
  "tokensPerHundredPoints": 2,
  "canConvert": true,
  "maxConvertible": 200,
  "estimatedTokens": 4
}
```

---

## ⛓️ Crypto/Blockchain Endpoints

### Get Blockchain Info
**GET** `/crypto/blockchain-info`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "address": "0x...",
  "tokenBalance": 100.5,
  "stakingInfo": {
    "amount": 50,
    "startTime": "date",
    "apy": 20,
    "previewUnstake": 52.5
  },
  "points": 1000,
  "apy": 20
}
```

### Stake Tokens
**POST** `/crypto/stake`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 50.5
}
```

**Response (200):**
```json
{
  "message": "Tokens staked successfully",
  "amount": 50.5,
  "apy": 20,
  "txHash": "0x..."
}
```

### Unstake Tokens
**POST** `/crypto/unstake`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Tokens unstaked successfully",
  "stakedAmount": 50,
  "reward": 2.5,
  "totalReceived": 52.5,
  "txHash": "0x..."
}
```

### Get Staking Preview
**GET** `/crypto/staking-preview`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "canStake": true,
  "apy": 20,
  "availableBalance": 100.5,
  "stakingInfo": {
    "isStaking": false,
    "stakedAmount": 0,
    "reward": 0,
    "apy": 0
  },
  "pointsRequired": {
    "20": 1000,
    "50": 10000,
    "1000": 50000
  },
  "blockchainAvailable": true
}
```

### Transfer Tokens
**POST** `/crypto/transfer`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "toAddress": "0x...",
  "amount": 10.5
}
```

**Response (200):**
```json
{
  "message": "Tokens transferred successfully",
  "amount": 10.5,
  "toAddress": "0x...",
  "txHash": "0x..."
}
```

### Get Market Info
**GET** `/crypto/market-info`

**Response (200):**
```json
{
  "totalSupply": 1000000,
  "circulatingSupply": 800000,
  "tokenSymbol": "RDT",
  "tokenName": "RedditToken",
  "contractAddress": "0x...",
  "stakingContractAddress": "0x..."
}
```

### Get Blockchain Transactions
**GET** `/crypto/transactions`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "transactions": [
    {
      "type": "Transfer",
      "from": "0x...",
      "to": "0x...",
      "amount": 10.5,
      "blockNumber": 12345,
      "transactionHash": "0x..."
    }
  ]
}
```

---

## 📊 Points System

### Points Earned:
- **Post**: 5 points
- **Like**: 1 point (to post author)
- **Comment**: 2 points

### Points Conversion:
- **100 points** = **2 tokens**

### Staking APY Tiers:
- **1000+ points**: 20% APY
- **10000+ points**: 50% APY
- **50000+ points**: 1000% APY

---

## 🚨 Error Responses

### Validation Error (400):
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-value",
      "msg": "Error message",
      "path": "fieldName",
      "location": "body"
    }
  ]
}
```

### Authentication Error (401):
```json
{
  "error": "Access token required" | "Invalid token" | "Token expired"
}
```

### Authorization Error (403):
```json
{
  "error": "Insufficient permissions" | "Not authorized to edit this post"
}
```

### Not Found Error (404):
```json
{
  "error": "Post not found" | "User not found" | "Wallet not found"
}
```

### Server Error (500):
```json
{
  "error": "Something went wrong!" | "Failed to create post"
}
```

### Blockchain Service Unavailable (503):
```json
{
  "error": "Blockchain service not available. Please check contract addresses and RPC URL."
}
```

---

## 🔧 Environment Variables

Required environment variables in `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reddit-platform

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Blockchain Configuration (optional)
RPC_URL=http://localhost:8545
TOKEN_CONTRACT_ADDRESS=0x...
STAKING_CONTRACT_ADDRESS=0x...
```

---

## 📝 Notes

1. **Authentication**: Most endpoints require a valid JWT token in the Authorization header
2. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
3. **Rate Limiting**: API is rate-limited to 100 requests per 15 minutes per IP
4. **Daily Limits**: Users can post 5 times per day maximum
5. **Blockchain**: Crypto endpoints require deployed smart contracts and proper environment configuration
6. **File Upload**: Image uploads are supported for posts (URLs only in this version)
7. **Real-time**: Socket.io integration available for real-time updates
8. **Private Keys**: Wallet creation returns the private key - keep it secure!

---

## 🚀 Getting Started

1. **Install dependencies**: `npm install`
2. **Run setup**: `npm run setup`
3. **Configure environment**: Update `.env` file
4. **Start server**: `npm run dev`
5. **Deploy contracts**: Deploy RedditToken.sol and Staking.sol
6. **Update addresses**: Add contract addresses to `.env`

The API will be available at `http://localhost:5000/api` 