// Studio's two AI employees: C-02 Hook Writer and C-03 Scriptwriter.
//
// Reads the Anthropic key and the Brand Brain from the database (this is what
// Settings' key-save feature was built for), never from an Edge Function
// secret. Model is Sonnet 5 for both — hooks and scripts are the two
// highest-leverage, viewer-facing outputs in the whole system, so quality
// beats the small savings Haiku would offer here. Haiku is the right choice
// for later, more mechanical employees (Packaging Writer, bulk classification).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Body =
  | { action: "hooks"; topic: string }
  | { action: "script"; topic: string; hook: string };

Deno.serve(async (req) => {
  // Require a real signed-in user — the anon key alone must not be enough to
  // spend Adarsh's Anthropic credits. Verify the caller's own JWT first,
  // then switch to the service-role client to read secrets/brand data.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asCaller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    db: { schema: "creator_os" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await asCaller.auth.getUser();
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: "creator_os" },
  });

  const { data: settings } = await supabase
    .from("app_settings")
    .select("anthropic_api_key")
    .eq("id", 1)
    .single();
  const apiKey = settings?.anthropic_api_key;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "No Anthropic key saved. Add one in Settings first." }),
      { status: 400 },
    );
  }

  const { data: brand } = await supabase
    .from("brand_brain")
    .select("pillars, hook_formula, voice_notes, banned_claims")
    .eq("id", 1)
    .single();

  const body = (await req.json()) as Body;
  if (!body.topic?.trim()) {
    return new Response(JSON.stringify({ error: "topic is required" }), { status: 400 });
  }

  const brandBrainBlock = [
    `Pillars: ${(brand?.pillars ?? []).join(", ")}`,
    `Hook formula: ${brand?.hook_formula ?? "(not set)"}`,
    `Voice profile: ${brand?.voice_notes ?? "(not set)"}`,
    brand?.banned_claims ? `Rules: ${brand.banned_claims}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt =
    "You are the scriptwriting employee inside Adarsh's personal Creator OS. Everything below is " +
    "his own voice profile and rules, learned from his real reels — follow it exactly, don't " +
    "default to generic AI-influencer phrasing.\n\n" + brandBrainBlock;

  let userPrompt: string;
  let maxTokens: number;
  if (body.action === "hooks") {
    userPrompt =
      `Topic: ${body.topic}\n\n` +
      "Write 8 hooks for a reel on this topic, following the hook formula above exactly. " +
      "Tag each one [WIDE REACH] or [HIGH INTENT]. Number them 1-8, one per line, hook text only " +
      "after the tag — no extra commentary.";
    maxTokens = 1200;
  } else {
    if (!body.hook?.trim()) {
      return new Response(JSON.stringify({ error: "hook is required for action=script" }), {
        status: 400,
      });
    }
    userPrompt =
      `Topic: ${body.topic}\nChosen hook: ${body.hook}\n\n` +
      "Write the full 60-90 second reel script that pays off this hook, following the voice " +
      "profile and beat structure above exactly. Mark pause/emphasis cues in [brackets]. End with " +
      "a share line and a CTA. Output the script only — no preamble, no explanation.";
    maxTokens = 2000;
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return new Response(JSON.stringify({ error: `Anthropic error: ${errText}` }), { status: 502 });
  }

  const result = await anthropicRes.json();
  const text = result.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

  return new Response(JSON.stringify({ text }), {
    headers: { "Content-Type": "application/json" },
  });
});
