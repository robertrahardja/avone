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
    
    // Generate mock visemes for browser TTS to enable lip sync
    const mockVisemes = generateMockVisemes(text);
    if (mockVisemes.length > 0) {
      return new Response(JSON.stringify({
        useBrowserTTS: true,
        text: text,
        visemes: mockVisemes,
        duration: calculateDuration(mockVisemes),
        message: 'Using browser TTS with generated visemes'
      }), {
        headers: corsHeaders
      });
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

// Simplified AWS Polly integration using built-in crypto
async function callAWSPollyWithVisemes(text, voiceId, env) {
  try {
    const region = env.AWS_REGION || 'ap-southeast-1';
    const accessKeyId = env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
    const service = 'polly';
    const host = `polly.${region}.amazonaws.com`;
    
    // Create timestamp
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    
    // Create signed requests for both visemes and audio
    const visemeBody = JSON.stringify({
      Text: text,
      OutputFormat: 'json',
      VoiceId: voiceId,
      Engine: 'neural',
      SpeechMarkTypes: ['viseme']
    });
    
    const audioBody = JSON.stringify({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural'
    });
    
    // Create authorization headers
    const visemeHeaders = await createAWSHeaders('POST', '/', visemeBody, host, region, service, accessKeyId, secretAccessKey, amzDate, dateStamp);
    const audioHeaders = await createAWSHeaders('POST', '/', audioBody, host, region, service, accessKeyId, secretAccessKey, amzDate, dateStamp);
    
    // Make requests
    const [visemeResponse, audioResponse] = await Promise.all([
      fetch(`https://${host}/v1/speech`, {
        method: 'POST',
        headers: visemeHeaders,
        body: visemeBody
      }),
      fetch(`https://${host}/v1/speech`, {
        method: 'POST',
        headers: audioHeaders,
        body: audioBody
      })
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
    } else {
      console.error('AWS Polly API error:', {
        visemeStatus: visemeResponse.status,
        audioStatus: audioResponse.status
      });
    }
    
    return null;
    
  } catch (error) {
    console.error('AWS Polly error:', error);
    return null;
  }
}

// Create AWS v4 signature headers
async function createAWSHeaders(method, uri, body, host, region, service, accessKeyId, secretAccessKey, amzDate, dateStamp) {
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const headers = {
    'Host': host,
    'X-Amz-Date': amzDate,
    'Content-Type': 'application/x-amz-json-1.0'
  };
  
  // Create canonical request
  const signedHeaders = Object.keys(headers).sort().join(';').toLowerCase();
  const canonicalHeaders = Object.keys(headers).sort().map(key => 
    `${key.toLowerCase()}:${headers[key]}\n`
  ).join('');
  
  const payloadHash = await sha256(body);
  const canonicalRequest = [
    method,
    uri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacSha256(signingKey, stringToSign);
  
  // Create authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'Authorization': authorization
  };
}

// Helper functions for AWS signing
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key, message) {
  const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgBuffer = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key, dateStamp, region, service) {
  const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${key}`), dateStamp);
  const kRegion = await hmacSha256(hexToBytes(kDate), region);
  const kService = await hmacSha256(hexToBytes(kRegion), service);
  const kSigning = await hmacSha256(hexToBytes(kService), 'aws4_request');
  return hexToBytes(kSigning);
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
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

// Generate mock visemes based on text analysis for browser TTS
function generateMockVisemes(text) {
  const visemes = [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let currentTime = 0;
  const wordDuration = 0.4; // Average word duration in seconds
  const pauseDuration = 0.1; // Pause between words
  
  // Vowel to viseme mapping
  const vowelMapping = {
    'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
    'y': 'i', 'ae': 'a', 'ai': 'a', 'au': 'o', 'aw': 'o',
    'ay': 'a', 'ea': 'e', 'ee': 'i', 'ei': 'a', 'eu': 'u',
    'ey': 'e', 'ie': 'i', 'oa': 'o', 'oo': 'u', 'ou': 'o',
    'ow': 'o', 'oy': 'o', 'ue': 'u', 'ui': 'u', 'uy': 'u'
  };
  
  // Consonant to viseme mapping
  const consonantMapping = {
    'b': 'p', 'p': 'p', 'm': 'p',           // Bilabial
    'f': 'f', 'v': 'f',                     // Labiodental  
    't': 't', 'd': 't', 'n': 't', 'l': 't', // Alveolar
    's': 's', 'z': 's', 'sh': 's', 'zh': 's', // Sibilant
    'k': 'k', 'g': 'k', 'ng': 'k',         // Velar
    'r': 'r', 'w': 'u', 'y': 'i', 'h': 'sil' // Approximants
  };
  
  visemes.push({ time: currentTime, viseme: 'sil' });
  
  words.forEach((word, wordIndex) => {
    if (word.length === 0) return;
    
    const syllableDuration = wordDuration / Math.max(1, Math.ceil(word.length / 3));
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      let viseme = 'sil';
      
      // Check for vowels first
      if ('aeiou'.includes(char)) {
        viseme = vowelMapping[char] || 'a';
      } else if (consonantMapping[char]) {
        viseme = consonantMapping[char];
      } else {
        // Default consonant mapping
        viseme = 't';
      }
      
      const charTime = currentTime + (i * syllableDuration / word.length);
      visemes.push({ time: charTime, viseme: viseme });
    }
    
    currentTime += wordDuration;
    
    // Add pause between words (except last word)
    if (wordIndex < words.length - 1) {
      visemes.push({ time: currentTime, viseme: 'sil' });
      currentTime += pauseDuration;
    }
  });
  
  // End with silence
  visemes.push({ time: currentTime, viseme: 'sil' });
  
  return visemes;
}