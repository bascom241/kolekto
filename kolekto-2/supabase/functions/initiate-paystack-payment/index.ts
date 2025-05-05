
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Initiate Paystack Payment function called");

// Define function to handle CORS preflight requests
function handleCorsRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: new Headers(corsHeaders),
    });
  }
  return null;
}

// Helper function to validate Paystack key format (basic check)
function isValidPaystackKey(key: string | undefined): boolean {
  return !!key && (key.startsWith('sk_test_') || key.startsWith('sk_live_')) && key.length >= 30;
}

// Function to handle non-JSON responses
async function handleResponse(response: Response) {
  const contentType = response.headers.get('Content-Type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON despite Content-Type:', error);
      const text = await response.text();
      console.error('Response text:', text.slice(0, 500)); // Log first 500 chars
      throw new Error('Invalid JSON response from payment gateway');
    }
  } else {
    // Handle non-JSON responses (like HTML error pages)
    const text = await response.text();
    console.error('Non-JSON response from Paystack:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: text.slice(0, 500) // Log first 500 chars
    });
    
    // Create a structured error based on status code
    let errorMessage = 'Payment gateway returned non-JSON response';
    if (response.status === 401) {
      errorMessage = 'Payment authentication failed: Invalid API key';
    } else if (response.status === 403) {
      errorMessage = 'Access denied by payment gateway';
    } else if (response.status === 429) {
      errorMessage = 'Too many requests to payment gateway';
    } else if (response.status >= 500) {
      errorMessage = 'Payment gateway server error';
    }
    
    throw new Error(errorMessage);
  }
}

// Helper function to validate Paystack key by making a request to /balance endpoint
async function validatePaystackKey(key: string): Promise<boolean> {
  try {
    // Use the /balance endpoint instead of /transaction/verify which requires a reference
    const validateResponse = await fetch('https://api.paystack.co/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
    });
    
    if (validateResponse.ok) {
      console.log('Paystack key validation successful');
      return true;
    }
    
    const status = validateResponse.status;
    if (status === 401 || status === 403) {
      console.error(`Paystack key validation failed with status ${status}`);
      return false;
    }
    
    // If we get a server error, don't fail the validation
    // as it might be a temporary Paystack issue
    console.warn(`Paystack key validation got unexpected status ${status}, proceeding anyway`);
    return true;
    
  } catch (error) {
    console.error('Error validating Paystack key:', error);
    return false;
  }
}

// Main request handler with retry logic for transient errors
serve(async (req) => {
  // CORS handling
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Environment variable checks
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
      hasPaystackKey: !!paystackSecretKey,
      paystackKeyLength: paystackSecretKey ? paystackSecretKey.length : 0,
      paystackKeyPrefix: paystackSecretKey ? paystackSecretKey.substring(0, 8) : 'missing',
    });
    
    // Validate Paystack key
    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Paystack key not configured',
          details: 'The server is not properly configured to process payments.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Basic validation of key format
    if (!isValidPaystackKey(paystackSecretKey)) {
      console.error('Paystack secret key appears to be invalid (wrong format)');
      return new Response(
        JSON.stringify({
          error: 'Invalid payment gateway configuration',
          details: 'The payment system API key appears to be incorrectly formatted.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate key by making a test API call
    const isKeyValid = await validatePaystackKey(paystackSecretKey);
    if (!isKeyValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or unauthorized Paystack API key',
          details: 'The payment system could not authenticate with the payment provider. Please contact support.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Database connection not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate request data
    const { email, amount, metadata } = requestData;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!amount || isNaN(parseInt(amount)) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!metadata || typeof metadata !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing metadata' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate unique reference
    const reference = `kolekto-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Prepare Paystack request
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';
    const paystackData = {
      email,
      amount, // Already in kobo from frontend
      reference,
      callback_url: `${Deno.env.get('PUBLIC_CALLBACK_URL') || 'https://kolekto.vercel.app'}/payment-callback`,
      metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
    };

    console.log('Sending request to Paystack:', {
      ...paystackData,
      // Don't log full metadata for privacy
      metadata: metadata ? '(metadata object present)' : 'missing'
    });

    // Implement retry logic for Paystack API calls
    const MAX_RETRIES = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for Paystack API call`);
          // Add a delay before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        const paystackResponse = await fetch(paystackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
          },
          body: JSON.stringify(paystackData),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        console.log('Paystack response status:', paystackResponse.status, paystackResponse.statusText);
        
        // Handle response based on content type
        try {
          const paystackResult = await handleResponse(paystackResponse);
          console.log('Paystack API response:', paystackResult);
          
          // Handle specific HTTP status codes
          if (!paystackResponse.ok) {
            let errorMessage = paystackResult.message || 'Failed to initialize payment';
            
            // Map status codes to user-friendly messages
            if (paystackResponse.status === 401 || paystackResponse.status === 403) {
              errorMessage = 'Invalid or unauthorized Paystack API key';
              // Don't retry for auth errors
              throw new Error(errorMessage);
            } else if (paystackResponse.status === 429) {
              errorMessage = 'Too many payment requests, please try again later';
              // For rate limiting, we should retry
              if (attempt < MAX_RETRIES) {
                lastError = new Error(errorMessage);
                continue; // Retry on rate limiting
              }
            } else if (paystackResponse.status >= 500) {
              errorMessage = 'Paystack server error';
              // For server errors, we should retry
              if (attempt < MAX_RETRIES) {
                lastError = new Error(errorMessage);
                continue; // Retry on server error
              }
            }

            console.error('Error from Paystack API:', {
              status: paystackResponse.status,
              statusText: paystackResponse.statusText,
              result: paystackResult,
            });

            return new Response(
              JSON.stringify({
                error: errorMessage,
                details: paystackResult,
                statusCode: paystackResponse.status,
                statusText: paystackResponse.statusText,
              }),
              {
                status: 502,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
              }
            );
          }

          if (!paystackResult.status) {
            console.error('Paystack API returned unsuccessful status:', paystackResult);
            return new Response(
              JSON.stringify({
                error: paystackResult.message || 'Failed to initialize payment',
                details: paystackResult,
              }),
              {
                status: 502,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
              }
            );
          }

          // Return success response
          return new Response(
            JSON.stringify(paystackResult.data),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        } catch (responseError) {
          // If we failed to handle the response and we have retries left, try again
          if (attempt < MAX_RETRIES) {
            console.log(`Error handling response, will retry: ${responseError.message}`);
            lastError = responseError;
            continue;
          }
          throw responseError;
        }
      } catch (apiError) {
        // If we have retries left and it's a potentially transient error, try again
        if (attempt < MAX_RETRIES && 
            (apiError.name === 'AbortError' || 
             apiError.message.includes('fetch failed') || 
             apiError.message.includes('network'))) {
          console.log(`Network error, will retry: ${apiError.message}`);
          lastError = apiError;
          continue;
        }
        
        console.error('Paystack API fetch error:', apiError);
        return new Response(
          JSON.stringify({
            error: `Payment gateway connection error: ${apiError.message}`,
            details: String(apiError),
            errorType: apiError.name || 'FetchError',
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }
    
    // If we got here, all retries failed
    console.error('All Paystack API call attempts failed');
    return new Response(
      JSON.stringify({
        error: `Failed to connect to payment service after ${MAX_RETRIES + 1} attempts`,
        details: lastError ? String(lastError) : 'Unknown error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Unhandled exception:', error);
    return new Response(
      JSON.stringify({
        error: `Unexpected error: ${error.message || 'Unknown error'}`,
        errorType: error.name || 'UnhandledException',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
