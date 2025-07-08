// Updated functions/api/speak.js for Indonesian voices
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { text, voice, voiceId, VoiceId, gender, language = 'id' } = await context.request.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Indonesian voice selection
    let selectedVoice = getIndonesianVoice(voice, voiceId, VoiceId, gender, language);
    
    // Try ElevenLabs if API key is available
    if (context.env.ELEVENLABS_API_KEY) {
      try {
        const elevenLabsResult = await callElevenLabsTTS(text, selectedVoice, language, context.env);
        
        if (elevenLabsResult) {
          return new Response(JSON.stringify({
            audio: elevenLabsResult.audio,
            visemes: elevenLabsResult.visemes,
            duration: elevenLabsResult.duration,
            voice: selectedVoice,
            language: language,
            provider: 'elevenlabs'
          }), {
            headers: corsHeaders
          });
        }
      } catch (elevenLabsError) {
        console.error('ElevenLabs error:', elevenLabsError.message);
      }
    }
    
    // Fallback: Return instruction for browser's Speech Synthesis API
    return new Response(JSON.stringify({
      useBrowserTTS: true,
      text: text,
      voice: selectedVoice,
      language: language,
      message: `Using browser text-to-speech for ${language === 'id' ? 'Indonesian' : 'English'}`
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
async function callElevenLabsTTS(text, voiceId, language, env) {
  try {
    const apiKey = env.ELEVENLABS_API_KEY;
    
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
    const audioBase64 = arrayBufferToBase64(audioBuffer);
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


// Convert ArrayBuffer to base64 (same as before)
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Parse viseme data from AWS Polly (same as before)
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

// Calculate approximate duration (same as before)
function calculateDuration(visemes) {
  if (visemes.length === 0) return 0;
  return Math.max(...visemes.map(v => v.time)) + 0.5;
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