// Debug endpoint to check AWS Polly integration
export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const debug = {
      hasOpenAI: !!context.env.OPENAI_API_KEY,
      hasAWSAccessKey: !!context.env.AWS_ACCESS_KEY_ID,
      hasAWSSecretKey: !!context.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: context.env.AWS_REGION || 'not-set',
      timestamp: new Date().toISOString()
    };

    // Test AWS Polly with a simple request
    if (context.env.AWS_ACCESS_KEY_ID && context.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const testResult = await testAWSPolly(context.env);
        debug.pollyTest = testResult;
      } catch (error) {
        debug.pollyError = error.message;
      }
    }

    return new Response(JSON.stringify(debug, null, 2), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Debug failed', 
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

async function testAWSPolly(env) {
  const region = env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  
  try {
    // Simple test request
    const body = JSON.stringify({
      Text: "test",
      OutputFormat: 'json',
      VoiceId: 'Matthew',
      Engine: 'neural',
      SpeechMarkTypes: ['viseme']
    });

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    
    const headers = await createAWSHeaders('POST', '/', body, `polly.${region}.amazonaws.com`, region, 'polly', accessKeyId, secretAccessKey, amzDate, dateStamp);
    
    const response = await fetch(`https://polly.${region}.amazonaws.com/v1/speech`, {
      method: 'POST',
      headers: headers,
      body: body
    });

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    };

  } catch (error) {
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Simplified AWS signing functions
async function createAWSHeaders(method, uri, body, host, region, service, accessKeyId, secretAccessKey, amzDate, dateStamp) {
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const headers = {
    'Host': host,
    'X-Amz-Date': amzDate,
    'Content-Type': 'application/x-amz-json-1.0'
  };
  
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
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacSha256(signingKey, stringToSign);
  
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'Authorization': authorization
  };
}

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