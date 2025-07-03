# AI Avatar Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up/login
3. Go to API Keys section
4. Create new secret key
5. Copy the key (starts with sk-...)

### 2. Get AWS Credentials
1. Go to https://aws.amazon.com/
2. Sign up/login to AWS Console
3. Go to IAM > Users > Create User
4. Attach policy: `AmazonPollyFullAccess`
5. Create access key for user
6. Copy Access Key ID and Secret Access Key

### 3. Configure Environment
Edit the `.env` file:
```
OPENAI_API_KEY=sk-your-actual-openai-key-here
AWS_ACCESS_KEY_ID=your-actual-aws-access-key
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-key
AWS_REGION=us-east-1
```

### 4. Start the Server
```bash
npm install
node server.js
```

## 💰 Costs

**Free Credits:**
- OpenAI: $5 free credit (new accounts)
- AWS: 1M characters/month free (Polly neural voices)

**After free tier:**
- OpenAI: ~$0.002 per 1K tokens (~150 words)
- AWS Polly: $16 per 1M characters

**Estimated monthly cost for moderate use:** $5-15/month

## ✅ Testing

1. Open http://localhost:3000
2. Click "Start Chat"
3. Type "Hello, tell me about AI"
4. Should get OpenAI response + voice playback

## 🔧 Features

- ✅ Real OpenAI GPT-3.5-turbo conversations
- ✅ AWS Polly neural voice synthesis
- ✅ Voice input (Chrome/Edge)
- ✅ Audio playback of responses
- ✅ Animated avatar with expressions
- ✅ Fallback to text if APIs unavailable