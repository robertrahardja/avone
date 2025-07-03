// Cloudflare Pages Function for /api/chat
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { message } = await context.request.json();
    
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
        } else {
          throw new Error('OpenAI API error');
        }
        
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError.message);
        response = getFallbackResponse(message);
      }
    } else {
      response = getFallbackResponse(message);
    }
    
    return new Response(JSON.stringify({
      response,
      timestamp: new Date().toISOString(),
      source: context.env.OPENAI_API_KEY ? 'openai' : 'fallback'
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