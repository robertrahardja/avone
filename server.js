const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure AWS Polly
const polly = new AWS.Polly({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Speech synthesis endpoint
app.post('/api/speak', async (req, res) => {
    try {
        const { text, voice = 'Joanna' } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log(`Synthesizing speech for: "${text}"`);

        // Get viseme data
        const visemeParams = {
            Text: text,
            OutputFormat: 'json',
            VoiceId: voice,
            Engine: 'neural',
            SpeechMarkTypes: ['viseme']
        };

        // Get audio data
        const audioParams = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voice,
            Engine: 'neural'
        };

        // Execute both requests in parallel
        const [visemeResponse, audioResponse] = await Promise.all([
            polly.synthesizeSpeech(visemeParams).promise(),
            polly.synthesizeSpeech(audioParams).promise()
        ]);

        // Parse viseme data
        const visemes = parseVisemes(visemeResponse.AudioStream.toString());
        
        // Convert audio to base64
        const audioBase64 = audioResponse.AudioStream.toString('base64');
        const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

        console.log(`Generated ${visemes.length} visemes`);

        res.json({
            audio: audioDataUrl,
            visemes: visemes,
            duration: calculateDuration(visemes)
        });

    } catch (error) {
        console.error('Speech synthesis error:', error);
        res.status(500).json({ 
            error: 'Speech synthesis failed',
            details: error.message 
        });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to set AWS credentials in environment variables:');
    console.log('- AWS_ACCESS_KEY_ID');
    console.log('- AWS_SECRET_ACCESS_KEY');
    console.log('- AWS_REGION (optional, defaults to us-east-1)');
});

module.exports = app;