import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Simple chat endpoint (no API calls to keep costs at $0)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Simulate AI response with simple patterns
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
        const response = responseArray[Math.floor(Math.random() * responseArray.length)];
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        res.json({ 
            response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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