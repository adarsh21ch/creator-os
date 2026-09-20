// Edge Functions don't answer the browser's CORS preflight (an OPTIONS
// request) on their own — every function called from the browser needs this,
// or the browser blocks the call before it ever reaches the function, with
// no useful error beyond "Failed to send a request to the Edge Function".
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
