#!/bin/bash
# 9JASUB Automated Deployment Script
# Execute this on the Hostinger VPS to pull updates, build, and restart

set -e # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting 9JASUB Deployment..."

# 1. Pull latest code
echo "📦 Pulling latest code from GitHub..."
git pull origin main

# 2. Install backend dependencies
echo "🔧 Installing backend dependencies..."
npm install

# 3. Install frontend dependencies and build
echo "🏗️ Building frontend SPA..."
cd mk-vtu-frontend
npm install
npm run build
cd ..

# 4. Restart PM2 Process
echo "🔄 Restarting PM2 process..."
# --update-env ensures new .env values are loaded if changed
pm2 restart mk-digital-backend --update-env
pm2 save

echo "✅ Deployment successful!"
echo "Run 'pm2 logs mk-digital-backend --lines 20' to verify startup."
