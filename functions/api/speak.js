// Cloudflare Pages Function for /api/speak with AWS Polly
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { text, voice, voiceId, VoiceId, gender } = await context.request.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Determine voice to use (prioritize male voices)
    let selectedVoice = 'Matthew'; // Default male voice
    
    if (voice) selectedVoice = voice;
    if (voiceId) selectedVoice = voiceId;
    if (VoiceId) selectedVoice = VoiceId;
    
    // Try AWS Polly if credentials are available
    if (context.env.AWS_ACCESS_KEY_ID && context.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const pollyResult = await callAWSPollyWithVisemes(text, selectedVoice, context.env);
        
        if (pollyResult) {
          return new Response(JSON.stringify({
            audio: pollyResult.audio,
            visemes: pollyResult.visemes,
            duration: pollyResult.duration,
            voice: selectedVoice
          }), {
            headers: corsHeaders
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
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ error: 'Text-to-speech failed' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// AWS Polly integration using AWS REST API with proper v4 signing
async function callAWSPollyWithVisemes(text, voiceId, env) {
  try {
    const region = env.AWS_REGION || 'ap-southeast-1';
    
    // Import AWS signing library for Cloudflare Workers
    const { AwsClient } = await import('aws4fetch');
    
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: region
    });
    
    // Parameters for viseme request
    const visemeParams = {
      Text: text,
      OutputFormat: 'json',
      VoiceId: voiceId,
      Engine: 'neural',
      SpeechMarkTypes: ['viseme']
    };
    
    // Parameters for audio request
    const audioParams = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural'
    };
    
    // Create requests
    const visemeRequest = new Request(`https://polly.${region}.amazonaws.com/v1/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.0'
      },
      body: JSON.stringify(visemeParams)
    });
    
    const audioRequest = new Request(`https://polly.${region}.amazonaws.com/v1/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.0'
      },
      body: JSON.stringify(audioParams)
    });
    
    // Sign and execute requests
    const [visemeResponse, audioResponse] = await Promise.all([
      aws.fetch(visemeRequest),
      aws.fetch(audioRequest)
    ]);
    
    if (visemeResponse.ok && audioResponse.ok) {
      // Process visemes
      const visemeText = await visemeResponse.text();
      const visemes = parseVisemes(visemeText);
      
      // Process audio
      const audioArrayBuffer = await audioResponse.arrayBuffer();
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));
      const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
      
      return {
        audio: audioDataUrl,
        visemes: visemes,
        duration: calculateDuration(visemes)
      };
    }
    
    console.error('AWS Polly API responses not OK:', {
      visemeStatus: visemeResponse.status,
      audioStatus: audioResponse.status
    });
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