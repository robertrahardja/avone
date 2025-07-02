# Complete Guide to Building an AI Avatar System

This comprehensive guide will help you build a clone of the ReallyLesson avatar system with real-time AI conversation, 3D avatars, speech synthesis, and voice recognition.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Frontend Setup](#frontend-setup)
6. [Backend Setup](#backend-setup)
7. [Avatar Implementation](#avatar-implementation)
8. [AI Integration](#ai-integration)
9. [Speech & Voice](#speech--voice)
10. [3D Environment](#3d-environment)
11. [Deployment](#deployment)
12. [Advanced Features](#advanced-features)

## 🎯 Overview

The system consists of:
- **Frontend**: React + Three.js for 3D avatar rendering
- **Backend**: Node.js API for AI processing
- **AI**: OpenAI integration for conversations
- **Speech**: AWS Polly for text-to-speech
- **Voice**: Web Speech API for voice input
- **3D**: GLTF models with facial expression morphing

## 🛠 Tech Stack

### Frontend
- **React** (18+)
- **Vite** (build tool)
- **Three.js** (3D engine)
- **React Three Fiber** (React wrapper for Three.js)
- **React Three Drei** (useful Three.js components)
- **Leva** (debug controls)

### Backend
- **Node.js** (18+)
- **Express.js** (web framework)
- **OpenAI API** (conversational AI)
- **AWS Polly** (text-to-speech)
- **CORS** (cross-origin requests)

### Additional Services
- **AWS S3** (file storage)
- **Google reCAPTCHA** (bot protection)

## 📁 Project Structure

```
avatar-project/
├── frontend/
│   ├── public/
│   │   ├── models/
│   │   │   └── avatar.gltf
│   │   └── environment/
│   │       └── venice_sunset_1k.hdr
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar.jsx
│   │   │   ├── Experience.jsx
│   │   │   └── UI.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.jsx
│   │   │   └── useSpeechRecognition.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.js
│   │   ├── services/
│   │   │   ├── openai.js
│   │   │   └── polly.js
│   │   └── server.js
│   ├── package.json
│   └── .env
└── README.md
```

## 🔧 Prerequisites

### Required Accounts & API Keys
1. **OpenAI Account**: Get API key from [OpenAI](https://platform.openai.com/)
2. **AWS Account**: For Polly TTS service
3. **Google reCAPTCHA**: Get site key from [Google reCAPTCHA](https://www.google.com/recaptcha/)

### Software Requirements
- Node.js 18+
- npm or yarn
- Git

## 🤖 OpenAI Setup (Complete Guide)

### 1. Create OpenAI Account

1. **Visit OpenAI Platform**: Go to [https://platform.openai.com/](https://platform.openai.com/)
2. **Sign Up**: Click "Sign up" and create an account with email/Google/Microsoft
3. **Verify Email**: Check your email and verify your account
4. **Complete Profile**: Add your name and organization details

### 2. Add Payment Method

**Important**: OpenAI requires a payment method for API access beyond free tier.

1. **Go to Billing**: Navigate to [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. **Add Payment Method**: Click "Add payment method"
3. **Enter Card Details**: Add your credit/debit card information
4. **Set Usage Limits**: 
   - Click "Usage limits"
   - Set a monthly budget (e.g., $20) to prevent unexpected charges
   - Set notification thresholds (e.g., 50%, 80%, 100%)

### 3. Generate API Key

1. **Navigate to API Keys**: Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Create New Key**: Click "Create new secret key"
3. **Name Your Key**: Give it a descriptive name (e.g., "Avatar Project")
4. **Copy Key**: **IMPORTANT**: Copy the key immediately and store it securely
   ```
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. **Save Securely**: Store in password manager or secure environment file

### 4. Understanding OpenAI Pricing

**GPT-3.5 Turbo Pricing** (as of 2024):
- Input: $0.0005 per 1K tokens (~750 words)
- Output: $0.0015 per 1K tokens (~750 words)

**Example Usage Calculation**:
- 100 conversations per day
- Average 50 tokens input + 100 tokens output per conversation
- Daily cost: (50 × 100 × $0.0005 + 100 × 100 × $0.0015) / 1000 = ~$0.20/day
- Monthly cost: ~$6/month

### 5. Test Your API Key

Create a test file to verify your setup:

```javascript
// test-openai.js
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello! Can you respond with just 'API test successful'?" }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API Test Successful!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Tokens used:', response.usage.total_tokens);
  } catch (error) {
    console.error('❌ OpenAI API Test Failed:', error.message);
  }
}

testOpenAI();
```

Run the test:
```bash
npm install openai dotenv
node test-openai.js
```

## ☁️ AWS Setup (Complete Guide)

### 1. Create AWS Account

1. **Visit AWS**: Go to [https://aws.amazon.com/](https://aws.amazon.com/)
2. **Create Account**: Click "Create an AWS Account"
3. **Fill Details**:
   - Email address
   - Password
   - AWS account name (e.g., "Avatar Project")
4. **Contact Information**:
   - Account type: Personal
   - Full name, phone number, address
5. **Payment Information**: Add credit/debit card
6. **Identity Verification**: Phone verification with PIN
7. **Support Plan**: Choose "Basic support - Free"

### 2. Access AWS Console

1. **Sign In**: Go to [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
2. **Enter Credentials**: Use your email and password
3. **Select Region**: Choose region closest to your users (e.g., us-east-1, eu-west-1)

### 3. Create IAM User for API Access

**Why IAM User?**: Never use root credentials for applications. IAM users provide secure, limited access.

#### Step 3.1: Navigate to IAM
1. **Open IAM Console**: Search "IAM" in AWS console search bar
2. **Click "Users"** in left sidebar
3. **Click "Create user"**

#### Step 3.2: User Details
1. **User name**: `avatar-project-user`
2. **Check**: "Provide user access to the AWS Management Console" (optional)
3. **Click "Next"**

#### Step 3.3: Set Permissions
1. **Select**: "Attach policies directly"
2. **Search and select**: `AmazonPollyFullAccess`
3. **Additional policies** (if using S3 for file storage):
   - `AmazonS3FullAccess` (or create custom policy for specific bucket)
4. **Click "Next"**

#### Step 3.4: Review and Create
1. **Review settings**
2. **Click "Create user"**
3. **Important**: Download or copy the credentials

### 4. Generate Access Keys

#### Step 4.1: Navigate to User
1. **Go to IAM > Users**
2. **Click on your user**: `avatar-project-user`
3. **Click "Security credentials" tab**

#### Step 4.2: Create Access Key
1. **Click "Create access key"**
2. **Select use case**: "Application running outside AWS"
3. **Check confirmation box**
4. **Click "Next"**
5. **Add description**: "Avatar project API access"
6. **Click "Create access key"**

#### Step 4.3: Save Credentials
**CRITICAL**: Copy both values immediately and store securely:
```
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 5. Test AWS Polly Access

Create a test file:

```javascript
// test-polly.js
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
require('dotenv').config();

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testPolly() {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: "Hello! This is a test of AWS Polly text to speech.",
      OutputFormat: "mp3",
      VoiceId: "Joanna",
      Engine: "neural"
    });

    const response = await pollyClient.send(command);
    console.log('✅ AWS Polly Test Successful!');
    console.log('Audio stream received, length:', response.AudioStream.length);
    
    // Optionally save audio file for testing
    const fs = require('fs');
    const audioBuffer = await response.AudioStream.transformToByteArray();
    fs.writeFileSync('test-audio.mp3', audioBuffer);
    console.log('📄 Test audio saved as test-audio.mp3');
    
  } catch (error) {
    console.error('❌ AWS Polly Test Failed:', error.message);
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 Check your AWS credentials in .env file');
    }
  }
}

testPolly();
```

Install AWS SDK and run test:
```bash
npm install @aws-sdk/client-polly
node test-polly.js
```

### 6. AWS Polly Voice Options

Choose from available voices for different languages and styles:

**English Voices**:
- **Joanna** (Female, US) - Default, natural
- **Matthew** (Male, US) - Clear, professional
- **Amy** (Female, British) - Sophisticated
- **Brian** (Male, British) - Authoritative
- **Emma** (Female, US) - Young, friendly
- **Justin** (Male, US) - Child voice

**Neural Engine Voices** (Higher quality, slightly more expensive):
- **Joanna** (Neural) - Most natural sounding
- **Matthew** (Neural) - Professional male voice
- **Ruth** (Neural) - Warm, conversational

### 7. AWS Polly Pricing

**Standard Voices**:
- $4.00 per 1 million characters
- First 5 million characters per month free (12 months)

**Neural Voices**:
- $16.00 per 1 million characters
- First 1 million characters per month free (12 months)

**Example Usage**:
- 100 responses per day
- Average 100 characters per response
- Monthly usage: 100 × 30 × 100 = 300,000 characters
- Cost: Free (under 1M neural) or $1.20/month (standard)

### 8. Set Up AWS S3 (Optional - for file storage)

If you plan to store user uploads or avatar models:

#### Create S3 Bucket
1. **Open S3 Console**: Search "S3" in AWS console
2. **Click "Create bucket"**
3. **Bucket name**: `avatar-project-files` (must be globally unique)
4. **Region**: Same as your Polly region
5. **Block Public Access**: Keep enabled for security
6. **Click "Create bucket"**

#### Configure Bucket Policy
For public read access to avatar models:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::avatar-project-files/models/*"
    }
  ]
}
```

### 9. Environment Variables Setup

Create `.env` file in your backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# AWS Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# AWS Polly Configuration
POLLY_VOICE_ID=Joanna
POLLY_ENGINE=neural
POLLY_OUTPUT_FORMAT=mp3

# AWS S3 Configuration (Optional)
S3_BUCKET_NAME=avatar-project-files
S3_REGION=us-east-1

# Security
JWT_SECRET=your-jwt-secret-for-sessions
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 10. Security Best Practices

#### Environment Variables Security
```bash
# Never commit .env files to version control
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

# Use different .env files for different environments
# .env.development
# .env.production
# .env.test
```

#### AWS Security
1. **Use IAM policies with least privilege**
2. **Rotate access keys regularly**
3. **Enable CloudTrail for auditing**
4. **Set up billing alerts**
5. **Use AWS Secrets Manager for production**

#### OpenAI Security
1. **Set usage limits to prevent bill shock**
2. **Use environment variables, never hardcode keys**
3. **Monitor usage regularly**
4. **Use separate keys for development/production**

### 11. Production Environment Setup

For production deployment, use secure secret management:

#### AWS Secrets Manager
```javascript
// For production use AWS Secrets Manager
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

async function getSecret(secretName) {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

// Usage
const secrets = await getSecret("avatar-project/api-keys");
const openaiKey = secrets.OPENAI_API_KEY;
```

#### Environment-specific Configuration
```javascript
// config/index.js
const config = {
  development: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      maxTokens: 500
    },
    aws: {
      region: 'us-east-1',
      polly: {
        voiceId: 'Joanna',
        engine: 'neural'
      }
    }
  },
  production: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 800
    },
    aws: {
      region: process.env.AWS_REGION,
      polly: {
        voiceId: process.env.POLLY_VOICE_ID || 'Joanna',
        engine: 'neural'
      }
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## 🛡️ Google reCAPTCHA Setup (Complete Guide)

### 1. Create Google Account

If you don't have a Google account:
1. **Visit Google**: Go to [https://accounts.google.com/signup](https://accounts.google.com/signup)
2. **Create Account**: Follow the registration process
3. **Verify Email**: Complete email verification

### 2. Access reCAPTCHA Admin Console

1. **Visit reCAPTCHA**: Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. **Sign In**: Use your Google account credentials
3. **Accept Terms**: Review and accept reCAPTCHA Terms of Service

### 3. Register a New Site

#### Step 3.1: Site Registration
1. **Click "+" button** to create new site
2. **Label**: Enter descriptive name (e.g., "Avatar Project")
3. **reCAPTCHA type**: Choose your preferred type:

**reCAPTCHA v2 Options**:
- **"I'm not a robot" Checkbox** - Classic checkbox (recommended for beginners)
- **Invisible reCAPTCHA badge** - No user interaction unless suspicious
- **Android** - For mobile apps

**reCAPTCHA v3** (Advanced):
- **reCAPTCHA v3** - Score-based, no user interaction

**Recommendation**: Start with **"I'm not a robot" Checkbox** for simplicity.

#### Step 3.2: Domain Configuration
1. **Domains**: Add your domains:
   ```
   localhost (for development)
   127.0.0.1 (for development)
   yourdomain.com (for production)
   www.yourdomain.com (for production)
   ```

2. **Terms of Service**: Check the box to accept
3. **Send alerts**: Check if you want email alerts for issues
4. **Click "Submit"**

### 4. Obtain API Keys

After registration, you'll receive:

```
Site Key: 6Lc5_1cqAAAAALvmnCZn-2NbRV2shSMSm7by24k-
Secret Key: 6Lc5_1cqAAAAAH8XjB9FxG7fO2Y8QZ1rA3vW2kL9
```

- **Site Key**: Used in frontend (public, safe to expose)
- **Secret Key**: Used in backend (private, keep secure)

### 5. Frontend Integration

#### Install reCAPTCHA Package
```bash
npm install react-google-recaptcha
```

#### Basic Implementation
```jsx
// components/RecaptchaGate.jsx
import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const RecaptchaGate = ({ onVerified, onError }) => {
  const [isVerified, setIsVerified] = useState(false);

  const handleRecaptchaChange = (token) => {
    if (token) {
      // Verify token with your backend
      verifyRecaptcha(token)
        .then((isValid) => {
          if (isValid) {
            setIsVerified(true);
            onVerified(true);
          } else {
            onError('reCAPTCHA verification failed');
          }
        })
        .catch((error) => {
          onError('reCAPTCHA verification error');
        });
    }
  };

  const handleRecaptchaExpire = () => {
    setIsVerified(false);
    onVerified(false);
  };

  const verifyRecaptcha = async (token) => {
    try {
      const response = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          🤖 AI Avatar Access
        </h2>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Please verify you're human to continue
        </p>
        
        <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={handleRecaptchaChange}
          onExpired={handleRecaptchaExpire}
          theme="light"
          size="normal"
        />
        
        {isVerified && (
          <div style={{ marginTop: '20px', color: '#28a745' }}>
            ✅ Verification successful! Loading avatar...
          </div>
        )}
      </div>
    </div>
  );
};

export default RecaptchaGate;
```

#### Environment Variables (Frontend)
Create `.env` in your React project root:

```env
# reCAPTCHA Configuration
REACT_APP_RECAPTCHA_SITE_KEY=6Lc5_1cqAAAAALvmnCZn-2NbRV2shSMSm7by24k-
```

### 6. Backend Verification

#### Install Dependencies
```bash
npm install axios node-fetch
```

#### Create Verification Endpoint
```javascript
// routes/recaptcha.js
const express = require('express');
const router = express.Router();

router.post('/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA token is required'
      });
    }

    // Verify with Google
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: req.ip // Optional: client IP
      })
    });

    const data = await response.json();

    if (data.success) {
      // Optional: Check score for reCAPTCHA v3
      if (data.score && data.score < 0.5) {
        return res.json({
          success: false,
          error: 'Low confidence score',
          score: data.score
        });
      }

      res.json({
        success: true,
        score: data.score,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        error: 'reCAPTCHA verification failed',
        'error-codes': data['error-codes']
      });
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
```

#### Add to Main Server
```javascript
// server.js
const recaptchaRoutes = require('./routes/recaptcha');

// Add after other middleware
app.use('/api', recaptchaRoutes);
```

### 7. Environment Variables (Backend)

Add to your `.env` file:

```env
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=6Lc5_1cqAAAAAH8XjB9FxG7fO2Y8QZ1rA3vW2kL9
RECAPTCHA_SITE_KEY=6Lc5_1cqAAAAALvmnCZn-2NbRV2shSMSm7by24k-
```

### 8. Testing reCAPTCHA

#### Test Domains
Google provides special test keys for development:

**Test Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
**Test Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These keys will always pass verification (for testing only).

#### Create Test File
```javascript
// test-recaptcha.js
const fetch = require('node-fetch');
require('dotenv').config();

async function testRecaptcha() {
  const testToken = 'test-token'; // In real scenario, this comes from frontend
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: testToken
      })
    });

    const data = await response.json();
    console.log('reCAPTCHA Test Result:', data);
  } catch (error) {
    console.error('reCAPTCHA Test Failed:', error);
  }
}

testRecaptcha();
```

### 9. Advanced Configuration

#### reCAPTCHA v3 Implementation
For score-based verification without user interaction:

```jsx
// For reCAPTCHA v3
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';

const RecaptchaV3Component = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async () => {
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available');
      return;
    }

    const token = await executeRecaptcha('submit');
    // Send token to backend for verification
  };

  return (
    <button onClick={handleSubmit}>
      Submit with reCAPTCHA v3
    </button>
  );
};
```

#### Rate Limiting with reCAPTCHA
```javascript
// middleware/rateLimitWithRecaptcha.js
const rateLimit = require('express-rate-limit');

const createRateLimitWithRecaptcha = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    skip: (req) => {
      // Skip rate limiting if reCAPTCHA was verified
      return req.recaptchaVerified === true;
    },
    message: {
      error: 'Too many requests, please complete reCAPTCHA verification'
    }
  });
};

module.exports = createRateLimitWithRecaptcha;
```

### 10. Production Considerations

#### Security Best Practices
1. **Always verify tokens server-side** - Never trust frontend verification alone
2. **Use HTTPS in production** - reCAPTCHA requires secure connections
3. **Monitor suspicious activity** - Check reCAPTCHA analytics regularly
4. **Set appropriate score thresholds** - For v3, adjust based on your traffic
5. **Handle errors gracefully** - Provide fallback methods for users

#### Error Handling
```javascript
// Common reCAPTCHA error codes
const RECAPTCHA_ERRORS = {
  'missing-input-secret': 'The secret parameter is missing',
  'invalid-input-secret': 'The secret parameter is invalid or malformed',
  'missing-input-response': 'The response parameter is missing',
  'invalid-input-response': 'The response parameter is invalid or malformed',
  'bad-request': 'The request is invalid or malformed',
  'timeout-or-duplicate': 'The response is no longer valid: either is too old or has been used previously'
};

const handleRecaptchaError = (errorCodes) => {
  if (errorCodes && errorCodes.length > 0) {
    const errorMessages = errorCodes.map(code => RECAPTCHA_ERRORS[code] || code);
    console.error('reCAPTCHA errors:', errorMessages);
    return errorMessages;
  }
  return ['Unknown reCAPTCHA error'];
};
```

#### Analytics and Monitoring
```javascript
// Track reCAPTCHA metrics
const trackRecaptchaMetrics = (success, score, timestamp) => {
  // Log to your analytics service
  console.log('reCAPTCHA Metrics:', {
    success,
    score,
    timestamp,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  // Send to monitoring service (DataDog, CloudWatch, etc.)
};
```

## 🎨 Frontend Setup

### 1. Initialize React Project

```bash
# Create new Vite + React project
npm create vite@latest avatar-frontend -- --template react
cd avatar-frontend
npm install

# Install required dependencies
npm install three @react-three/fiber @react-three/drei
npm install leva
npm install react-google-recaptcha
npm install axios
```

### 2. Configure Vite (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### 3. Main App Component (src/App.jsx)

```jsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { ChatProvider } from "./hooks/useChat";
import ReCAPTCHA from "react-google-recaptcha";

const RecaptchaGate = ({ onVerified }) => {
  const handleRecaptchaChange = (value) => {
    if (value) onVerified(true);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <ReCAPTCHA
        sitekey="YOUR_RECAPTCHA_SITE_KEY"
        onChange={handleRecaptchaChange}
      />
    </div>
  );
};

function App() {
  const [isVerified, setIsVerified] = useState(true); // Set to false to enable reCAPTCHA

  return (
    <ChatProvider>
      {isVerified ? (
        <>
          <Loader />
          <Leva hidden />
          <UI />
          <Canvas shadows camera={{ position: [0, 0, 1], fov: 35 }}>
            <Experience />
          </Canvas>
        </>
      ) : (
        <RecaptchaGate onVerified={setIsVerified} />
      )}
    </ChatProvider>
  );
}

export default App;
```

### 4. Chat Hook (src/hooks/useChat.jsx)

```jsx
import { createContext, useContext, useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:3000";
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  const chat = async (messageText, imgLink = null, fileList = null) => {
    if (!messageText) return;

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          imgLink,
          fileList
        }),
      });

      const data = await response.json();
      const newMessages = data.messages;

      if (newMessages) {
        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
```

### 5. Speech Recognition Hook (src/hooks/useSpeechRecognition.jsx)

```jsx
import { useState, useEffect, useRef } from 'react';
import { useChat } from './useChat';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState(null);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const isRestartingRef = useRef(false);
  const { loading } = useChat();

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Web Speech API is not supported by this browser.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (isRestartingRef.current && !loading) {
        recognitionRef.current.start();
      }
    };

    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcriptResult = result[0].transcript.trim();
        setCurrentTranscript(transcriptResult);
      }
    };

    recognitionRef.current.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setError(null);
      isRestartingRef.current = true;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    currentTranscript,
    error,
    hasRecognitionSupport: !!recognitionRef.current,
    startListening,
    stopListening,
  };
};
```

### 6. 3D Experience Component (src/components/Experience.jsx)

```jsx
import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((prev) => (prev.length > 2 ? "." : prev + "."));
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);

  if (!loading) return null;

  return (
    <group {...props}>
      <Text fontSize={0.2} anchorX="left" anchorY="bottom">
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0);
  }, []);

  useEffect(() => {
    const zoomSettings = cameraZoomed
      ? [0, 1.5, 1.5, 0, 1.5, 0]
      : [0, 2.2, 5, 0, 1, 0];
    cameraControls.current.setLookAt(...zoomSettings, true);
  }, [cameraZoomed]);

  return (
    <>
      <CameraControls
        ref={cameraControls}
        minZoom={1}
        maxZoom={1}
        zoomSpeed={0}
        mouseButtons={{
          wheel: false, // Disable mouse wheel zoom
          right: CameraControls.ACTION.PAN, // Allow panning with right click
        }}
        touches={{
          two: false, // Disable pinch zoom for touch
        }}
      />
      <Environment path="/" files="venice_sunset_1k.hdr" />
      <Suspense fallback={null}>
        <Dots position-y={1.85} position-x={-0.12} />
      </Suspense>
      <Avatar />
      <ContactShadows opacity={0.7} />
    </>
  );
};
```

### 7. Avatar Component (src/components/Avatar.jsx)

```jsx
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";

// Facial expression morphs
const facialExpressions = {
  default: {},
  serious: {
    browDownLeft: 0.66,
    browDownRight: 0.65,
    eyeSquintLeft: 0.38,
    eyeSquintRight: 0.38,
    jawForward: 0.53,
    mouthShrugLower: 0.63,
    noseSneerLeft: 0.71,
  },
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    mouthSmileLeft: 0.22,
    mouthSmileRight: 0.22,
  },
  surprised: {
    browInnerUp: 1,
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.21,
    mouthFunnel: 0.02,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 0.53,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
  },
};

export const Avatar = () => {
  const { message, onMessagePlayed } = useChat();
  const [expression, setExpression] = useState("default");
  const [audio, setAudio] = useState();
  const [isPlaying, setIsPlaying] = useState(false);

  const { scene } = useGLTF("/models/avatar.gltf");
  const { actions } = useAnimations([], scene);

  const headRef = useRef();
  const [smoothMorphTarget, setSmoothMorphTarget] = useState({});

  // Leva controls for debugging
  const { 
    playAudio,
    expressionSelect,
  } = useControls({
    playAudio: button(() => {
      if (audio) {
        setIsPlaying(true);
        audio.play();
      }
    }),
    expressionSelect: {
      value: "default",
      options: Object.keys(facialExpressions),
      onChange: (value) => setExpression(value),
    },
  });

  useEffect(() => {
    if (message) {
      setAudio(new Audio(`data:audio/mp3;base64,${message.audio}`));
      setExpression(message.facialExpression || "default");
    }
  }, [message]);

  useEffect(() => {
    if (audio) {
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        onMessagePlayed();
      });
      
      if (isPlaying) {
        audio.play();
      }
    }
  }, [audio, isPlaying]);

  useFrame(() => {
    const currentMorphTarget = facialExpressions[expression];
    
    // Smooth morph target transitions
    Object.keys(facialExpressions.default).forEach((key) => {
      const current = smoothMorphTarget[key] || 0;
      const target = currentMorphTarget[key] || 0;
      const newValue = THREE.MathUtils.lerp(current, target, 0.1);
      
      setSmoothMorphTarget((prev) => ({ ...prev, [key]: newValue }));
      
      if (headRef.current && headRef.current.morphTargetDictionary) {
        const index = headRef.current.morphTargetDictionary[key];
        if (index !== undefined) {
          headRef.current.morphTargetInfluences[index] = newValue;
        }
      }
    });
  });

  return (
    <group>
      <primitive object={scene} />
      {/* Add head reference for morph targets */}
      <mesh ref={headRef} />
    </group>
  );
};

// Preload the GLTF model
useGLTF.preload("/models/avatar.gltf");
```

### 8. UI Component (src/components/UI.jsx)

```jsx
import React, { useState } from "react";
import { useChat } from "../hooks/useChat";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export const UI = () => {
  const { chat, loading, cameraZoomed, setCameraZoomed } = useChat();
  const [input, setInput] = useState("");
  const { 
    isListening, 
    currentTranscript, 
    startListening, 
    stopListening,
    hasRecognitionSupport 
  } = useSpeechRecognition();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      chat(input);
      setInput("");
    }
  };

  const handleVoiceSubmit = () => {
    if (currentTranscript) {
      chat(currentTranscript);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px"
    }}>
      {/* Camera Controls */}
      <button 
        onClick={() => setCameraZoomed(!cameraZoomed)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {cameraZoomed ? "Zoom Out" : "Zoom In"}
      </button>

      {/* Voice Recognition */}
      {hasRecognitionSupport && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              padding: "10px",
              backgroundColor: isListening ? "#dc3545" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              width: "50px",
              height: "50px"
            }}
          >
            🎤
          </button>
          {currentTranscript && (
            <div style={{ 
              padding: "5px 10px", 
              backgroundColor: "rgba(0,0,0,0.7)", 
              color: "white",
              borderRadius: "5px"
            }}>
              {currentTranscript}
              <button 
                onClick={handleVoiceSubmit}
                style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            minWidth: "300px"
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};
```

## 🎭 Backend Setup

### 1. Initialize Node.js Project

```bash
mkdir avatar-backend
cd avatar-backend
npm init -y

# Install dependencies
npm install express cors dotenv
npm install openai aws-sdk
npm install @aws-sdk/client-polly
npm install axios
```

### 2. Environment Variables (.env)

```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### 3. Main Server (src/server.js)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Avatar Backend API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. OpenAI Service (src/services/openai.js)

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getChatCompletion(message, context = []) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant avatar. Keep responses conversational and under 200 words. Include an appropriate facial expression keyword (default, smile, serious, surprised, sad, angry) in your response metadata."
        },
        ...context,
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;
    
    // Determine facial expression based on response content
    let facialExpression = "default";
    if (responseText.includes("!") || responseText.includes("amazing") || responseText.includes("wow")) {
      facialExpression = "surprised";
    } else if (responseText.includes("😊") || responseText.includes("happy") || responseText.includes("great")) {
      facialExpression = "smile";
    } else if (responseText.includes("sorry") || responseText.includes("sad") || responseText.includes("unfortunately")) {
      facialExpression = "sad";
    } else if (responseText.includes("serious") || responseText.includes("important")) {
      facialExpression = "serious";
    }

    return {
      text: responseText,
      facialExpression: facialExpression
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

module.exports = {
  getChatCompletion
};
```

### 5. AWS Polly Service (src/services/polly.js)

```javascript
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function textToSpeech(text, voiceId = "Joanna") {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voiceId,
      Engine: "neural"
    });

    const response = await pollyClient.send(command);
    const audioBuffer = await response.AudioStream.transformToByteArray();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return base64Audio;
  } catch (error) {
    console.error('Polly TTS error:', error);
    throw error;
  }
}

module.exports = {
  textToSpeech
};
```

### 6. Chat Route (src/routes/chat.js)

```javascript
const express = require('express');
const router = express.Router();
const { getChatCompletion } = require('../services/openai');
const { textToSpeech } = require('../services/polly');

// Store conversation context per session (in production, use Redis or database)
const conversationContexts = new Map();

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation context
    let context = conversationContexts.get(sessionId) || [];

    // Get AI response
    const aiResponse = await getChatCompletion(message, context);

    // Update conversation context
    context.push(
      { role: "user", content: message },
      { role: "assistant", content: aiResponse.text }
    );

    // Keep only last 10 messages to prevent context overflow
    if (context.length > 20) {
      context = context.slice(-20);
    }
    conversationContexts.set(sessionId, context);

    // Generate speech
    const audioBase64 = await textToSpeech(aiResponse.text);

    // Prepare response messages
    const messages = [
      {
        text: aiResponse.text,
        audio: audioBase64,
        facialExpression: aiResponse.facialExpression,
        animation: "talking",
        type: "text"
      }
    ];

    res.json({ messages });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process chat request'
    });
  }
});

module.exports = router;
```

## 🎪 3D Assets & Models

### 1. Avatar Model Requirements

You'll need a GLTF avatar model with:
- **Rigged skeleton** for animations
- **Blend shapes/morphs** for facial expressions
- **Texture maps** (diffuse, normal, roughness)

**Recommended sources:**
- [Ready Player Me](https://readyplayer.me/) - Free avatar creation
- [Mixamo](https://www.mixamo.com/) - Free 3D models with animations
- [Sketchfab](https://sketchfab.com/) - Premium 3D models

### 2. Environment Assets

Download HDR environment map:
```bash
# Place in public/environment/
venice_sunset_1k.hdr
```

**Free HDR sources:**
- [Poly Haven](https://polyhaven.com/hdris)
- [HDRI Haven](https://hdrihaven.com/)

### 3. Model Preparation

Ensure your GLTF model has these blend shapes:
- `browDownLeft`, `browDownRight`
- `browInnerUp`
- `eyeSquintLeft`, `eyeSquintRight`
- `eyeWideLeft`, `eyeWideRight`
- `jawOpen`, `jawForward`
- `mouthSmileLeft`, `mouthSmileRight`
- `mouthFrownLeft`, `mouthFrownRight`
- `mouthShrugLower`
- `noseSneerLeft`, `noseSneerRight`

## 🚀 Running the Application

### 1. Start Backend

```bash
cd avatar-backend
npm start
```

### 2. Start Frontend

```bash
cd avatar-frontend
npm run dev
```

### 3. Access Application

Open http://localhost:5173 in your browser

## 🌐 Deployment

### Frontend (Netlify/Vercel)

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting provider
```

### Backend (Heroku/Railway/AWS)

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

## 🎯 Advanced Features

### 1. Lip Sync Animation

Add viseme-based lip synchronization:

```javascript
// In Avatar.jsx
const visemeMapping = {
  'sil': 'mouthClose',
  'pp': 'mouthPucker',
  'ff': 'mouthFunnel',
  'th': 'mouthShrugLower',
  // ... more viseme mappings
};

// Implement audio analysis for lip sync
useEffect(() => {
  if (audio && isPlaying) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    // Implement frequency analysis for viseme detection
  }
}, [audio, isPlaying]);
```

### 2. Multiple Avatar Models

Support different avatar models:

```javascript
// In useChat.jsx
const [avatarModel, setAvatarModel] = useState("default");

// Load different models based on URL parameter
const getAvatarModel = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('avatar') || 'default';
};
```

### 3. Real-time Streaming

Implement WebSocket for real-time communication:

```javascript
// Backend: Add WebSocket support
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Frontend: Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080');
```

### 4. Voice Cloning

Integrate with ElevenLabs or similar for custom voices:

```javascript
// In polly.js, add ElevenLabs integration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

async function elevenLabsTTS(text, voiceId) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    }
  );
  
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer).toString('base64');
}
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has proper CORS configuration
2. **Audio Not Playing**: Check browser autoplay policies
3. **3D Model Not Loading**: Verify GLTF file path and format
4. **Speech Recognition Not Working**: Test in Chrome/Edge (best support)
5. **AWS Polly Errors**: Verify AWS credentials and region settings

### Performance Optimization

1. **Use Web Workers** for heavy audio processing
2. **Implement model LOD** (Level of Detail) for distant views
3. **Optimize textures** - use compressed formats (KTX2, WebP)
4. **Cache API responses** to reduce OpenAI API calls
5. **Preload critical assets** in public folder

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🎉 Conclusion

You now have a complete guide to build an AI avatar system like ReallyLesson! This implementation provides:

- ✅ Real-time AI conversations
- ✅ 3D avatar with facial expressions
- ✅ Text-to-speech with AWS Polly
- ✅ Voice recognition input
- ✅ Professional 3D environment
- ✅ Scalable backend architecture

Start with the basic implementation and gradually add advanced features like lip sync, multiple avatars, and voice cloning. Remember to test extensively and optimize for your target audience.

Happy coding! 🚀