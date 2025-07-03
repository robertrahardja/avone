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
    const region = env.AWS_REGION || 'us-east-1';
    const accessKeyId = env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
    
    // Get viseme data and audio in parallel
    const [visemeData, audioData] = await Promise.all([
      callPollyAPI(text, voiceId, 'json', ['viseme'], region, accessKeyId, secretAccessKey),
      callPollyAPI(text, voiceId, 'mp3', [], region, accessKeyId, secretAccessKey)
    ]);
    
    if (audioData && visemeData) {
      const visemes = parseVisemes(visemeData);
      const audioBase64 = arrayBufferToBase64(audioData);
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

// Call AWS Polly API with proper signature
async function callPollyAPI(text, voiceId, outputFormat, speechMarkTypes, region, accessKeyId, secretAccessKey) {
  const service = 'polly';
  const host = `${service}.${region}.amazonaws.com`;
  const endpoint = `https://${host}/v1/speech`;
  
  const payload = {
    Text: text,
    OutputFormat: outputFormat,
    VoiceId: voiceId,
    Engine: 'neural'
  };
  
  if (speechMarkTypes.length > 0) {
    payload.SpeechMarkTypes = speechMarkTypes;
  }
  
  const headers = {
    'Content-Type': 'application/x-amz-json-1.0',
    'Host': host
  };
  
  const signedHeaders = await signAWSRequest(
    'POST',
    endpoint,
    headers,
    JSON.stringify(payload),
    region,
    service,
    accessKeyId,
    secretAccessKey
  );
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: signedHeaders,
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`AWS Polly API error: ${response.status}`);
  }
  
  if (outputFormat === 'mp3') {
    return await response.arrayBuffer();
  } else {
    return await response.text();
  }
}

// AWS Signature V4 implementation
async function signAWSRequest(method, url, headers, payload, region, service, accessKeyId, secretAccessKey) {
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substr(0, 8);
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-date';
  
  const payloadHash = await sha256(payload);
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
  
  const kDate = await hmacSha256(dateStamp, `AWS4${secretAccessKey}`);
  const kRegion = await hmacSha256(region, kDate);
  const kService = await hmacSha256(service, kRegion);
  const kSigning = await hmacSha256('aws4_request', kService);
  
  const signature = await hmacSha256(stringToSign, kSigning, 'hex');
  
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'Authorization': authorization,
    'X-Amz-Date': amzDate
  };
}

// Crypto helper functions
async function sha256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(data, key, encoding = 'raw') {
  const encoder = new TextEncoder();
  const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  
  if (encoding === 'hex') {
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  return signature;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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