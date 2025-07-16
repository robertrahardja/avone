// Updated functions/api/chat.js for Indonesian support
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { message, language = 'en' } = await context.request.json(); // Default to English
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    let response;
    
    // Use OpenAI if API key is available
    if (context.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = language === 'id' 
          ? 'Anda adalah asisten AI yang ramah. Jawab dalam bahasa Indonesia dengan singkat (1-2 kalimat) dan percakapan yang natural.'
          : 'You are a friendly AI assistant. Keep responses concise (1-2 sentences) and conversational.';

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: systemPrompt
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
        } else {
          throw new Error('OpenAI API error');
        }
        
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError.message);
        response = getFallbackResponse(message, language);
      }
    } else {
      response = getFallbackResponse(message, language);
    }
    
    return new Response(JSON.stringify({
      response,
      timestamp: new Date().toISOString(),
      source: context.env.OPENAI_API_KEY ? 'openai' : 'fallback',
      language
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
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