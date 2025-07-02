import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Initialize AWS Polly
const pollyClient = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ? new PollyClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
}) : null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Chat endpoint with OpenAI integration
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        let response;
        
        // Use OpenAI if available
        if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a friendly AI assistant. Keep responses concise (1-2 sentences) and conversational."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                });
                
                response = completion.choices[0].message.content.trim();
                console.log('✅ OpenAI response generated');
                
            } catch (openaiError) {
                console.error('OpenAI error:', openaiError.message);
                response = getFallbackResponse(message);
            }
        } else {
            console.log('ℹ️ OpenAI not configured, using fallback');
            response = getFallbackResponse(message);
        }
        
        res.json({ 
            response,
            timestamp: new Date().toISOString(),
            source: openai ? 'openai' : 'fallback'
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Text-to-speech endpoint
app.post('/api/speak', async (req, res) => {
    try {
        const { text, voice, voiceId, VoiceId, gender } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        // Determine voice to use (prioritize male voices)
        let selectedVoice = 'Matthew'; // Default male voice
        
        if (voice) selectedVoice = voice;
        if (voiceId) selectedVoice = voiceId;
        if (VoiceId) selectedVoice = VoiceId;
        
        console.log(`🎤 Using AWS Polly voice: ${selectedVoice} (gender: ${gender || 'male'})`);
        
        // Try AWS Polly first
        if (pollyClient) {
            try {
                const params = {
                    Text: text,
                    OutputFormat: 'mp3',
                    VoiceId: selectedVoice,
                    Engine: 'neural'
                };
                
                const command = new SynthesizeSpeechCommand(params);
                const data = await pollyClient.send(command);
                
                if (data.AudioStream) {
                    const chunks = [];
                    for await (const chunk of data.AudioStream) {
                        chunks.push(chunk);
                    }
                    const audioBuffer = Buffer.concat(chunks);
                    
                    res.set({
                        'Content-Type': 'audio/mpeg',
                        'Content-Length': audioBuffer.length,
                    });
                    
                    res.send(audioBuffer);
                    console.log(`✅ AWS Polly audio generated with ${selectedVoice} voice`);
                    return;
                }
            } catch (pollyError) {
                console.error('AWS Polly error:', pollyError.message);
                // Fall through to browser TTS
            }
        }
        
        // Fallback: Return instruction for browser's Speech Synthesis API
        res.json({ 
            useBrowserTTS: true,
            text: text,
            message: 'Using browser text-to-speech'
        });
        console.log('ℹ️ Using browser TTS fallback');
        
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Text-to-speech failed' });
    }
});

// Fallback responses when OpenAI is not available
function getFallbackResponse(message) {
    const responses = {
        greeting: [
            "Hello! How can I help you today?",
            "Hi there! What would you like to chat about?",
            "Hey! I'm here to help with whatever you need."
        ],
        question: [
            "That's a great question! Let me think about that.",
            "Interesting! I'd be happy to help with that.",
            "Good question! Here's what I think..."
        ],
        general: [
            "I understand what you're saying.",
            "That's really interesting!",
            "Tell me more about that.",
            "I see what you mean.",
            "That makes sense to me."
        ]
    };
    
    let responseType = 'general';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        responseType = 'greeting';
    } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
        responseType = 'question';
    }
    
    const responseArray = responses[responseType];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Avatar MVP Server running on port ${PORT}`);
    console.log(`💰 Current cost: $0 (using free tier only)`);
    console.log(`🌐 Open http://localhost:${PORT} to test`);
});