# 🚀 Deploy AI Avatar to Cloudflare

This guide will help you deploy your AI Avatar MVP to Cloudflare using Pages + Workers.

## Architecture

- **Frontend**: Cloudflare Pages (static hosting)
- **Backend**: Cloudflare Workers (serverless functions)
- **APIs**: OpenAI GPT-3.5-turbo + AWS Polly

## Quick Deploy

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Deploy the Worker

```bash
wrangler deploy
```

### 4. Set Environment Variables

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

### 5. Update Frontend Configuration

1. After deploying the worker, note your worker URL (e.g., `https://ai-avatar-worker.your-subdomain.workers.dev`)
2. Update `API_BASE_URL` in `deploy/index.html`:

```javascript
const API_BASE_URL = 'https://ai-avatar-worker.your-subdomain.workers.dev';
```

### 6. Deploy Frontend to Cloudflare Pages

**Option A: Git Integration**
1. Push code to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
3. Create new project → Connect to Git
4. Select repository and `deploy` folder
5. Build settings:
   - Build command: (leave empty)
   - Build output directory: `/`

**Option B: Direct Upload**
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Create new project → Upload assets
3. Upload the `deploy` folder contents

## Configuration

### Environment Variables (Worker)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-3.5-turbo | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key for Polly | Optional* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for Polly | Optional* |
| `AWS_REGION` | AWS region (default: us-east-1) | Optional |

*If AWS credentials are not provided, the system will fall back to browser Text-to-Speech

### Custom Domain (Optional)

1. In Cloudflare Pages, go to Custom domains
2. Add your domain (e.g., `avatar.yourdomain.com`)
3. Update `API_BASE_URL` in the frontend

## Testing

After deployment:

1. Visit your Cloudflare Pages URL
2. Click "Start Chat"
3. Send a test message
4. Verify the avatar responds with voice

## Troubleshooting

### Worker Issues
- Check worker logs: `wrangler tail`
- Verify environment variables: `wrangler secret list`

### CORS Issues
- Worker includes CORS headers for all origins
- If issues persist, check browser console

### Voice Issues
- AWS Polly requires valid credentials
- Falls back to browser TTS if Polly fails
- Check browser console for voice selection logs

## Cost Estimates

### Cloudflare
- **Pages**: Free (up to 500 builds/month)
- **Workers**: Free tier includes 100k requests/day

### External APIs
- **OpenAI**: ~$0.002 per chat (GPT-3.5-turbo)
- **AWS Polly**: ~$4 per 1M characters

## Files Created

- `worker.js` - Cloudflare Worker backend
- `wrangler.toml` - Worker configuration
- `deploy/index.html` - Frontend for Pages
- `deploy.sh` - Deployment script
- `CLOUDFLARE_DEPLOY.md` - This guide

## Next Steps

1. Run `./deploy.sh` to start deployment
2. Set your API keys using wrangler
3. Upload frontend to Pages
4. Test your live avatar!

Your AI Avatar will be live at: `https://your-project.pages.dev` 🎉