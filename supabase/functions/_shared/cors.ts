// Edge Functions don't answer the browser's CORS preflight (an OPTIONS
// request) on their own — every function called from the browser needs this,
// or the browser blocks the call before it ever reaches the function, with
// no useful error beyond "Failed to send a request to the Edge Function".
//
// Locked to real origins now that this is live at creator.nevorai.com — a
// wildcard "*" was fine for local-only testing but has no reason to stay
// once there's a real domain to restrict to. Access-Control-Allow-Origin can
// only ever reflect ONE origin per response (never a list), so we check the
// incoming request's Origin against this allowlist and echo back the match.
const ALLOWED_ORIGINS = new Set([
  "https://creator.nevorai.com",
  "http://localhost:5173", // Vite dev server
]);

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://creator.nevorai.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}
