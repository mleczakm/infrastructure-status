#!/bin/bash

# Cloudflare Worker Setup Helper Script
# This script guides you through setting up the Cloudflare Worker

set -e

echo "🚀 Cloudflare Worker Setup Helper"
echo "=================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the cloudflare-worker directory."
    exit 1
fi

echo "📋 This script will help you:"
echo "  1. Validate Cloudflare credentials"
echo "  2. Deploy the worker"
echo "  3. Provide GitHub secret setup instructions"
echo ""

read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔐 Cloudflare Authentication"
echo "============================"
echo "We need to authenticate with Cloudflare. This will open your browser."
echo ""
read -p "Press Enter to continue..."

# Login to Cloudflare
npx wrangler login

echo ""
echo "🚀 Deploying Worker..."
npx wrangler deploy --env production

echo ""
echo "✅ Worker Deployed Successfully!"
echo ""
echo "📝 Next Steps - Configure GitHub Secrets:"
echo "=========================================="
echo ""
echo "You need to add the following secrets to your GitHub repository:"
echo ""
echo "1. CLOUDFLARE_API_TOKEN"
echo "   - Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "   - Create a new API token with 'Workers Scripts' permissions"
echo "   - Copy the token and add it as a GitHub secret"
echo ""
echo "2. CLOUDFLARE_ACCOUNT_ID"
echo "   - Go to: https://dash.cloudflare.com/"
echo "   - Find your Account ID in the sidebar (API section)"
echo "   - Add it as a GitHub secret"
echo ""
echo "3. GH_PAT (GitHub Personal Access Token)"
echo "   - Go to: https://github.com/settings/tokens"
echo "   - Create a new token with 'repo' scope"
echo "   - Add it as a GitHub secret"
echo ""
echo "To add secrets to GitHub:"
echo "1. Go to your repository: https://github.com/mleczakm/infrastructure-status"
echo "2. Navigate to: Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Add each secret with its value"
echo ""
echo "🎉 Setup complete! The worker will now trigger uptime checks every 5 minutes."

