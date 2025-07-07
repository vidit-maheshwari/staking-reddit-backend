require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reddit-platform',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d'
  },

  // Blockchain configuration
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    tokenContractAddress: process.env.TOKEN_CONTRACT_ADDRESS,
    stakingContractAddress: process.env.STAKING_CONTRACT_ADDRESS,
    networkId: process.env.NETWORK_ID || 1337
  },

  // Points system configuration
  points: {
    post: 5,
    like: 1,
    comment: 2,
    conversionRate: 100, // 100 points = 2 tokens
    tokensPerHundredPoints: 2
  },

  // Staking APY tiers
  staking: {
    tiers: {
      1000: 20,   // 1000+ points = 20% APY
      10000: 50,  // 10000+ points = 50% APY
      50000: 1000 // 50000+ points = 1000% APY
    }
  },

  // Daily limits
  limits: {
    dailyPosts: 5
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadPath: 'uploads/'
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },

  // Validation rules
  validation: {
    username: {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    password: {
      minLength: 6
    },
    post: {
      titleMaxLength: 300,
      contentMaxLength: 10000
    },
    comment: {
      maxLength: 1000
    },
    bio: {
      maxLength: 500
    }
  },

  // Security configuration
  security: {
    bcryptRounds: 10,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  }
};

module.exports = config; 