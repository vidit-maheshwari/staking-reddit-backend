const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Reddit Platform Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reddit-platform

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Blockchain Configuration
# Uncomment and set these after deploying your smart contracts
# RPC_URL=http://localhost:8545
# TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
# STAKING_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Optional: For production
# RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
# TOKEN_CONTRACT_ADDRESS=0x... (deployed contract address)
# STAKING_CONTRACT_ADDRESS=0x... (deployed contract address)
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  console.log('Run: npm install');
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Update the .env file with your configuration');
console.log('3. Deploy your smart contracts (RedditToken.sol and Staking.sol)');
console.log('4. Update the contract addresses in .env file');
console.log('5. Run: npm run dev');
console.log('\n�� Setup complete!'); 