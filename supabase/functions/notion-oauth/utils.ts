export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

export const createErrorResponse = (status: number, message: string, details?: any) => {
  console.error(`[error] ${message}`, details);
  return new Response(
    JSON.stringify({
      error: {
        message,
        details,
        status,
      }
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    }
  );
};