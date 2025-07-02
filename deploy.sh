#!/bin/bash

echo "🚀 Deploying AI Avatar to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami || wrangler login

# Deploy the Worker
echo "📦 Deploying Cloudflare Worker..."
wrangler deploy

# Set up secrets
echo "🔐 Setting up environment variables..."
echo "Please set your secrets using these commands:"
echo "wrangler secret put OPENAI_API_KEY"
echo "wrangler secret put AWS_ACCESS_KEY_ID"
echo "wrangler secret put AWS_SECRET_ACCESS_KEY"

# Create Pages project
echo "🌐 Setting up Cloudflare Pages..."
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Create a new project"
echo "3. Connect to Git or upload the 'deploy' folder"
echo "4. Set build command: (none)"
echo "5. Set build output directory: /"

echo "✅ Deployment setup complete!"
echo "📝 Next steps:"
echo "   1. Update API_BASE_URL in deploy/index.html with your worker URL"
echo "   2. Upload the deploy folder to Cloudflare Pages"
echo "   3. Set environment variables using wrangler secret commands above"