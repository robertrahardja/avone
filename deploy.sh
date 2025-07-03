#!/bin/bash

echo "🚀 Deploying AI Avatar with Lip Sync to Cloudflare..."

# Copy latest MVP to deploy folder
echo "📁 Updating deployment files..."
cp mvp/index.html deploy/

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami || wrangler login

# Deploy the Worker
echo "📦 Deploying Cloudflare Worker with lip sync support..."
wrangler deploy

echo ""
echo "🎯 Worker deployed! Note your worker URL from above."
echo ""

# Get worker URL from user
read -p "📝 Enter your worker URL (e.g., https://ai-avatar-worker.your-subdomain.workers.dev): " WORKER_URL

if [ ! -z "$WORKER_URL" ]; then
    # Update API_BASE_URL in deploy/index.html
    echo "🔧 Updating API configuration..."
    sed -i.bak "s|const API_BASE_URL = '.*';|const API_BASE_URL = '$WORKER_URL';|" deploy/index.html
    echo "✅ Updated API_BASE_URL to: $WORKER_URL"
fi

# Set up secrets
echo ""
echo "🔐 Setting up environment variables..."
echo "Run these commands to set your API keys:"
echo ""
echo "wrangler secret put OPENAI_API_KEY"
echo "wrangler secret put AWS_ACCESS_KEY_ID" 
echo "wrangler secret put AWS_SECRET_ACCESS_KEY"
echo ""

# Create Pages project
echo "🌐 Cloudflare Pages Setup:"
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Create a new project → Upload assets"
echo "3. Upload the contents of the 'deploy' folder"
echo "4. Your avatar will be live at: https://your-project.pages.dev"
echo ""

echo "✅ Deployment setup complete!"
echo ""
echo "📋 Summary:"
echo "   • Worker deployed with lip sync support"
echo "   • Frontend updated with worker URL"
echo "   • Ready to upload to Cloudflare Pages"
echo ""
echo "🎉 Your AI Avatar with lip sync is ready for the web!"