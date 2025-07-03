// Simple test function
export async function onRequestGet() {
  return new Response(JSON.stringify({ 
    message: 'Pages Functions working!',
    timestamp: new Date().toISOString() 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost() {
  return new Response(JSON.stringify({ 
    message: 'POST request working!',
    timestamp: new Date().toISOString() 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}