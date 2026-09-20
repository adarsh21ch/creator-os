// Given an Instagram reel URL, calls Apify's Instagram scraper to pull
// metrics + caption, then saves it either to `reels` (his own posts) or
// `watchlist_posts` (a competitor account already on the Watchlist).
//
// Needs the APIFY_API_TOKEN Edge Function secret — set by Adarsh himself,
// never by Claude (see README for the exact command). Until it's set this
// function returns a clear 400 instead of failing silently.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// Targets the creator_os schema now that this project lives inside the
// shared Nevorai Tools project — this was missing before the move and would
// have silently written into "public" instead.
const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  db: { schema: "creator_os" },
});

const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");
const APIFY_ACTOR = "apify~instagram-scraper";

type Body = {
  url: string;
  kind: "own" | "competitor";
  account_id?: string; // required when kind === "competitor"
};

Deno.serve(async (req) => {
  // Require a real signed-in user — this writes rows and spends Apify credits,
  // so the anon key alone must not be enough to call it.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asCaller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    db: { schema: "creator_os" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await asCaller.auth.getUser();
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  }

  if (!APIFY_TOKEN) {
    return new Response(
      JSON.stringify({ error: "APIFY_API_TOKEN is not set. See README for how to add it." }),
      { status: 400 },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.url) {
    return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
  }
  if (body.kind === "competitor" && !body.account_id) {
    return new Response(JSON.stringify({ error: "account_id is required for kind=competitor" }), {
      status: 400,
    });
  }

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directUrls: [body.url], resultsType: "posts", resultsLimit: 1 }),
    },
  );

  if (!runRes.ok) {
    return new Response(JSON.stringify({ error: `Apify error: ${await runRes.text()}` }), {
      status: 502,
    });
  }

  const items = await runRes.json();
  const item = items?.[0];
  if (!item) {
    return new Response(JSON.stringify({ error: "Apify returned no data for this URL" }), {
      status: 502,
    });
  }

  const posted_at = item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : null;
  const caption = item.caption ?? null;
  const views = item.videoPlayCount ?? item.videoViewCount ?? null;
  const likes = item.likesCount ?? null;
  const comments = item.commentsCount ?? null;

  if (body.kind === "own") {
    const { error } = await supabase.from("reels").insert({
      posted_at,
      transcript: caption ?? "",
      caption,
      source: "manual",
      is_organic: true,
      views,
      likes,
      comments,
      notes: `Ingested from ${body.url}`,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } else {
    const { error } = await supabase.from("watchlist_posts").upsert(
      {
        account_id: body.account_id,
        post_url: body.url,
        posted_at,
        caption,
        views,
        likes,
        comments,
      },
      { onConflict: "post_url" },
    );
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, views, likes, comments }), {
    headers: { "Content-Type": "application/json" },
  });
});
