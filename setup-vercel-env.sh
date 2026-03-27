#!/bin/bash

echo "🚀 Setting up Vercel Environment Variables for FinTrack Backend"
echo "=================================================="

# Essential environment variables
echo "Adding essential environment variables..."

echo ""
echo "📊 Step 1: MongoDB URI"
echo "Please enter your MongoDB connection string:"
vercel env add MONGODB_URI

echo ""
echo "🔑 Step 2: JWT Access Secret"
echo "Please enter your JWT access secret (min 32 characters):"
vercel env add JWT_ACCESS_SECRET

echo ""
echo "🔑 Step 3: JWT Refresh Secret"
echo "Please enter your JWT refresh secret (min 32 characters):"
vercel env add JWT_REFRESH_SECRET

echo ""
echo "🔥 Step 4: Firebase Project ID"
echo "Please enter your Firebase project ID:"
vercel env add FIREBASE_PROJECT_ID

echo ""
echo "🔥 Step 5: Firebase Private Key"
echo "Please enter your Firebase private key (include newlines):"
vercel env add FIREBASE_PRIVATE_KEY

echo ""
echo "🔥 Step 6: Firebase Client Email"
echo "Please enter your Firebase client email:"
vercel env add FIREBASE_CLIENT_EMAIL

echo ""
echo "⚙️ Step 7: Node Environment"
echo "Enter 'production' for production environment:"
vercel env add NODE_ENV

echo ""
echo "🔐 Step 8: Bcrypt Rounds"
echo "Enter bcrypt rounds (recommended: 12):"
vercel env add BCRYPT_ROUNDS

echo ""
echo "🌐 Step 9: Allowed Origins"
echo "Enter allowed origins (comma-separated):"
vercel env add ALLOWED_ORIGINS

echo ""
echo "✅ Environment variables setup complete!"
echo "🔄 Redeploying to apply changes..."
vercel --prod

echo ""
echo "🎉 Setup complete! Your FinTrack backend is now configured."
