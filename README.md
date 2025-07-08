# Reddit-like Platform Backend

A comprehensive backend for a Reddit-like social platform with crypto integration, featuring posts, comments, likes, points system, and blockchain staking.

## Features

- **Social Platform**: Posts, comments, likes with real-time updates
- **Points System**: Earn points for posting (5), liking (1), and commenting (2)
- **Daily Limits**: Users can post 5 times per day
- **Crypto Integration**: Convert 100 points to 2 crypto tokens
- **Wallet Management**: Create and manage crypto wallets
- **Staking System**: Stake tokens with APY based on points:
  - 1000+ points = 20% APY
  - 10000+ points = 50% APY
  - 50000+ points = 1000% APY
- **Blockchain Integration**: Full integration with Ethereum smart contracts

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Ethers.js** for blockchain integration
- **Socket.io** for real-time features
- **bcryptjs** for password hashing

## Installation

1. **Clone the repository**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/reddit-platform

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000

   # Blockchain Configuration
   RPC_URL=http://localhost:8545
   TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   STAKING_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Deploy Smart Contracts**
   Deploy the RedditToken.sol and Staking.sol contracts and update the contract addresses in your .env file

6. **Run the server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/refresh` - Refresh JWT token

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment to post
- `POST /api/posts/:postId/comments/:commentId/like` - Like/unlike comment
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/trending/posts` - Get trending posts

### Users
- `GET /api/users/profile/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `GET /api/users/leaderboard/points` - Get points leaderboard
- `GET /api/users/leaderboard/posts` - Get posts leaderboard
- `GET /api/users/search` - Search users
- `GET /api/users/:username/stats` - Get user stats
- `GET /api/users/:username/activity` - Get user activity

### Wallet
- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet/info` - Get wallet info
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/points-info` - Get points conversion info

### Crypto/Blockchain
- `GET /api/crypto/blockchain-info` - Get blockchain info
- `POST /api/crypto/stake` - Stake tokens
- `POST /api/crypto/unstake` - Unstake tokens
- `GET /api/crypto/staking-preview` - Get staking preview
- `POST /api/crypto/transfer` - Transfer tokens
- `GET /api/crypto/market-info` - Get market info
- `GET /api/crypto/transactions` - Get blockchain transactions

## Database Models

### User
- Basic profile info (username, email, password)
- Points system
- Wallet integration
- Daily post limits
- Role-based permissions

### Post
- Content with title and body
- Author reference
- Likes and comments
- Tags and categories
- View tracking

### Wallet
- Ethereum wallet address and private key
- Token balance
- Staking information
- Transaction history

## Points System

- **Post**: 5 points
- **Like**: 1 point (to post author)
- **Comment**: 2 points
- **Conversion**: 100 points = 2 tokens

## Staking APY Tiers

- **1000+ points**: 20% APY
- **10000+ points**: 50% APY
- **50000+ points**: 1000% APY

## Daily Limits

- Users can post 5 times per day
- Resets at midnight

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection


## Development

```bash
# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Environment Variables

Make sure to set up all required environment variables in your `.env` file:

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `RPC_URL`: Ethereum RPC URL
- `TOKEN_CONTRACT_ADDRESS`: Deployed token contract address
- `STAKING_CONTRACT_ADDRESS`: Deployed staking contract address

## Smart Contract Integration

The backend integrates with two main smart contracts:

1. **RedditToken.sol**: ERC20 token for the platform
2. **Staking.sol**: Staking contract with APY tiers



