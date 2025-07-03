// Cloudflare Worker for AI Avatar Backend
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      const url = new URL(request.url);
      
      // Chat endpoint
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return handleChat(request, env, corsHeaders);
      }
      
      // Text-to-speech endpoint
      if (url.pathname === '/api/speak' && request.method === 'POST') {
        return handleSpeak(request, env, corsHeaders);
      }
      
      // Health check
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

// Handle chat requests with OpenAI
async function handleChat(request, env, corsHeaders) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let response;
    
    // Use OpenAI if API key is available
    if (env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a friendly AI assistant. Keep responses concise (1-2 sentences) and conversational.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        });
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          response = data.choices[0].message.content.trim();
          console.log('✅ OpenAI response generated');
        } else {
          throw new Error('OpenAI API error');
        }
        
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError.message);
        response = getFallbackResponse(message);
      }
    } else {
      console.log('ℹ️ OpenAI not configured, using fallback');
      response = getFallbackResponse(message);
    }
    
    return new Response(JSON.stringify({
      response,
      timestamp: new Date().toISOString(),
      source: env.OPENAI_API_KEY ? 'openai' : 'fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle text-to-speech with AWS Polly and viseme support
async function handleSpeak(request, env, corsHeaders) {
  try {
    const { text, voice, voiceId, VoiceId, gender } = await request.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Determine voice to use (prioritize male voices)
    let selectedVoice = 'Matthew'; // Default male voice
    
    if (voice) selectedVoice = voice;
    if (voiceId) selectedVoice = voiceId;
    if (VoiceId) selectedVoice = VoiceId;
    
    // Try AWS Polly if credentials are available
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      try {
        const pollyResult = await callAWSPollyWithVisemes(text, selectedVoice, env);
        
        if (pollyResult) {
          return new Response(JSON.stringify({
            audio: pollyResult.audio,
            visemes: pollyResult.visemes,
            duration: pollyResult.duration,
            voice: selectedVoice
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (pollyError) {
        console.error('AWS Polly error:', pollyError.message);
      }
    }
    
    // Fallback: Return instruction for browser's Speech Synthesis API
    return new Response(JSON.stringify({
      useBrowserTTS: true,
      text: text,
      message: 'Using browser text-to-speech'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ error: 'Text-to-speech failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// AWS Polly integration with viseme support using aws4fetch
async function callAWSPollyWithVisemes(text, voiceId, env) {
  try {
    // Import aws4fetch for AWS v4 signing
    const { AwsClient } = await import('aws4fetch');
    
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION || 'us-east-1'
    });
    
    // Get viseme data
    const visemeParams = new URLSearchParams({
      'Text': text,
      'OutputFormat': 'json',
      'VoiceId': voiceId,
      'Engine': 'neural',
      'SpeechMarkTypes.member.1': 'viseme'
    });
    
    const visemeRequest = new Request(
      `https://polly.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/v1/speech`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'Polly.SynthesizeSpeech'
        },
        body: visemeParams
      }
    );
    
    // Get audio data
    const audioParams = new URLSearchParams({
      'Text': text,
      'OutputFormat': 'mp3',
      'VoiceId': voiceId,
      'Engine': 'neural'
    });
    
    const audioRequest = new Request(
      `https://polly.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/v1/speech`,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'Polly.SynthesizeSpeech'
        },
        body: audioParams
      }
    );
    
    // Sign and execute both requests
    const [visemeResponse, audioResponse] = await Promise.all([
      aws.fetch(visemeRequest),
      aws.fetch(audioRequest)
    ]);
    
    if (visemeResponse.ok && audioResponse.ok) {
      // Process visemes
      const visemeText = await visemeResponse.text();
      const visemes = parseVisemes(visemeText);
      
      // Process audio
      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
      
      return {
        audio: audioDataUrl,
        visemes: visemes,
        duration: calculateDuration(visemes)
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('AWS Polly error:', error);
    return null;
  }
}

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