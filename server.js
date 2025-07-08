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

// Chat endpoint with OpenAI integration and Indonesian support
app.post('/api/chat', async (req, res) => {
    try {
        const { message, language = 'id' } = req.body; // Default to Indonesian
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        let response;
        
        // Use OpenAI if available
        if (openai) {
            try {
                const systemPrompt = language === 'id' 
                    ? 'Anda adalah asisten AI yang ramah. Jawab dalam bahasa Indonesia dengan singkat (1-2 kalimat) dan percakapan yang natural.'
                    : 'You are a friendly AI assistant. Keep responses concise (1-2 sentences) and conversational.';

                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
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
                
            } catch (openaiError) {
                console.error('OpenAI error:', openaiError.message);
                response = getFallbackResponse(message, language);
            }
        } else {
            response = getFallbackResponse(message, language);
        }
        
        res.json({ 
            response,
            timestamp: new Date().toISOString(),
            source: openai ? 'openai' : 'fallback',
            language
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Text-to-speech endpoint with viseme support and Indonesian voices
app.post('/api/speak', async (req, res) => {
    try {
        const { text, voice, voiceId, VoiceId, gender, language = 'id' } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        // Indonesian voice selection
        let selectedVoice = getIndonesianVoice(voice, voiceId, VoiceId, gender, language);
        
        
        // Try ElevenLabs TTS first for Indonesian support
        if (process.env.ELEVENLABS_API_KEY) {
            try {
                const elevenLabsResult = await callElevenLabsTTS(text, selectedVoice, language);
                
                if (elevenLabsResult) {
                    res.json({
                        audio: elevenLabsResult.audio,
                        visemes: elevenLabsResult.visemes,
                        duration: elevenLabsResult.duration,
                        voice: selectedVoice,
                        language: language,
                        provider: 'elevenlabs'
                    });
                    return;
                }
            } catch (elevenLabsError) {
                console.error('ElevenLabs error:', elevenLabsError.message);
                // Fall through to browser TTS
            }
        }
        
        // Fallback: Return instruction for browser's Speech Synthesis API
        res.json({ 
            useBrowserTTS: true,
            text: text,
            voice: selectedVoice,
            language: language,
            message: `Using browser text-to-speech for ${language === 'id' ? 'Indonesian' : 'English'}`
        });
        
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Text-to-speech failed' });
    }
});

// Parse viseme data from AWS Polly
function parseVisemes(visemeData) {
    try {
        const lines = visemeData.trim().split('\n');
        return lines.map(line => {
            const data = JSON.parse(line);
            return {
                time: data.time / 1000, // Convert to seconds
                viseme: data.value
            };
        }).filter(viseme => viseme.viseme !== undefined);
    } catch (error) {
        console.error('Error parsing visemes:', error);
        return [];
    }
}

// Calculate approximate duration
function calculateDuration(visemes) {
    if (visemes.length === 0) return 0;
    return Math.max(...visemes.map(v => v.time)) + 0.5;
}

// Select appropriate voice for language
function getIndonesianVoice(voice, voiceId, VoiceId, gender, language) {
    // If specific voice provided, use it
    if (voice) return voice;
    if (voiceId) return voiceId;
    if (VoiceId) return VoiceId;
    
    // ElevenLabs supports Indonesian directly
    if (language === 'id') {
        // Use Indonesian voices for Indonesian
        if (gender === 'male' || !gender) {
            return 'andi'; // Andi - Indonesian Male voice
        } else {
            return 'indonesian-female'; // ElevenLabs Indonesian Female voice
        }
    } else {
        // Default English voices for ElevenLabs
        if (gender === 'male' || !gender) {
            return 'adam'; // ElevenLabs English Male
        } else {
            return 'rachel'; // ElevenLabs English Female
        }
    }
}

// ElevenLabs TTS integration
async function callElevenLabsTTS(text, voiceId, language) {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        
        // Map voice names to actual ElevenLabs voice IDs
        const voiceMap = {
            'indonesian-male': 'TMvmhlKUioQA4U7LOoko', // Andi - Indonesian male voice
            'andi': 'TMvmhlKUioQA4U7LOoko', // Direct Andi voice mapping
            'indonesian-female': 'AZnzlk1XvdvUeBnXmlld', // Default female voice
            'adam': 'pNInz6obpgDQGcFmaJgB', // Adam (male)
            'rachel': 'AZnzlk1XvdvUeBnXmlld' // Rachel (female)
        };
        
        const selectedVoiceId = voiceMap[voiceId] || voiceMap['indonesian-male'];
        
        // Call ElevenLabs API
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }
        
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
        
        // Generate mock visemes for lip sync (since ElevenLabs doesn't provide visemes)
        const visemes = generateMockVisemes(text);
        
        return {
            audio: audioDataUrl,
            visemes: visemes,
            duration: calculateDuration(visemes)
        };
        
    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        return null;
    }
}

// Generate mock visemes for lip sync
function generateMockVisemes(text) {
    const visemes = [];
    const words = text.split(' ');
    let currentTime = 0;
    
    // Start with silence
    visemes.push({
        time: 0,
        viseme: 'sil'
    });
    
    words.forEach((word, wordIndex) => {
        // Add silence before each word (except first)
        if (wordIndex > 0) {
            visemes.push({
                time: currentTime,
                viseme: 'sil'
            });
            currentTime += 0.05; // Short pause
        }
        
        // Process each letter in the word
        const letters = word.toLowerCase().split('');
        const letterDuration = Math.max(0.08, Math.min(0.15, 0.5 / letters.length)); // Dynamic timing
        
        letters.forEach((letter, letterIndex) => {
            const viseme = getVisemeForLetter(letter);
            
            visemes.push({
                time: currentTime,
                viseme: viseme
            });
            
            // Add transition viseme for smoother animation
            if (letterIndex < letters.length - 1) {
                const nextViseme = getVisemeForLetter(letters[letterIndex + 1]);
                if (viseme !== nextViseme) {
                    visemes.push({
                        time: currentTime + letterDuration * 0.7,
                        viseme: getTransitionViseme(viseme, nextViseme)
                    });
                }
            }
            
            currentTime += letterDuration;
        });
        
        // Add pause between words
        currentTime += 0.1;
    });
    
    // End with silence
    visemes.push({
        time: currentTime,
        viseme: 'sil'
    });
    
    return visemes;
}

// Get transition viseme for smoother mouth movement
function getTransitionViseme(from, to) {
    // Simple transition logic - can be enhanced
    if (from === 'sil' || to === 'sil') return 'sil';
    if (from === to) return from;
    
    // Vowel to vowel transitions
    if (['a', 'e', 'i', 'o', 'u'].includes(from) && ['a', 'e', 'i', 'o', 'u'].includes(to)) {
        return '@'; // Neutral vowel
    }
    
    return 'sil'; // Default transition
}

// Map letters to visemes for lip sync (matching frontend format)
function getVisemeForLetter(letter) {
    const visemeMap = {
        'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
        'b': 'p', 'p': 'p', 'm': 'p',
        'f': 'f', 'v': 'f',
        'd': 't', 't': 't', 'n': 't', 'l': 't',
        'k': 'k', 'g': 'k',
        'j': 'S', 'ch': 'S', 'sh': 'S',
        'r': 'r',
        's': 's', 'z': 's', 'c': 's',
        'w': '@', 'qu': '@'
    };
    
    return visemeMap[letter] || 'sil';
}

// Fallback responses in multiple languages
function getFallbackResponse(message, language = 'id') {
    const responses = {
        id: { // Indonesian
            greeting: [
                "Halo! Bagaimana saya bisa membantu Anda hari ini?",
                "Hai! Apa yang ingin Anda bicarakan?",
                "Hey! Saya di sini untuk membantu apa pun yang Anda butuhkan."
            ],
            question: [
                "Itu pertanyaan yang bagus! Biarkan saya memikirkannya.",
                "Menarik! Saya akan senang membantu dengan itu.",
                "Pertanyaan yang baik! Ini yang saya pikirkan..."
            ],
            general: [
                "Saya mengerti apa yang Anda katakan.",
                "Itu sangat menarik!",
                "Ceritakan lebih lanjut tentang itu.",
                "Saya mengerti maksud Anda.",
                "Itu masuk akal bagi saya."
            ]
        },
        en: { // English
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
        }
    };
    
    const langResponses = responses[language] || responses.id;
    let responseType = 'general';
    const lowerMessage = message.toLowerCase();
    
    // Indonesian greeting detection
    if (language === 'id') {
        if (lowerMessage.includes('halo') || lowerMessage.includes('hai') || 
            lowerMessage.includes('selamat') || lowerMessage.includes('hello')) {
            responseType = 'greeting';
        } else if (lowerMessage.includes('?') || lowerMessage.includes('apa') || 
                   lowerMessage.includes('bagaimana') || lowerMessage.includes('kenapa')) {
            responseType = 'question';
        }
    } else {
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            responseType = 'greeting';
        } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || 
                   lowerMessage.includes('what') || lowerMessage.includes('why')) {
            responseType = 'question';
        }
    }
    
    const responseArray = langResponses[responseType];
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