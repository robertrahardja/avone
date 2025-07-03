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

// AWS Polly integration with viseme support
async function callAWSPollyWithVisemes(text, voiceId, env) {
  try {
    // For Cloudflare Workers/Pages, we need to use the AWS API directly
    // This is a simplified version - for production, you'd use proper AWS signing
    
    const region = env.AWS_REGION || 'ap-southeast-1';
    
    // Create AWS signature v4 (simplified version)
    const accessKeyId = env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
    
    // Note: This is a simplified implementation
    // For production, you'd need proper AWS v4 signature
    console.log('AWS Polly integration would go here');
    console.log('Voice:', voiceId, 'Region:', region);
    
    // For now, return null to fall back to browser TTS
    // In production, implement proper AWS Polly integration
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