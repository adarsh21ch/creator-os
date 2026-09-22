-- Turns the News Desk and Influencer Watch from "screens with a paste box"
-- into actually-scheduled desks. Requested 2026-09-22 ("build the next
-- phase"). Two real gaps found first: fetch-rss existed and worked but was
-- never scheduled (the "pulled nightly at 2am" copy in Sources.tsx was
-- aspirational, not wired up), and APIFY_API_TOKEN was never set as an Edge
-- Function secret in Nevorai Tools (fixed 2026-09-22, confirmed working).

set search_path to creator_os, public;

-- Influencer Watch needs somewhere to record "this post is unusually big for
-- this account" — a flat view-count threshold is meaningless across accounts
-- of very different sizes, so this is relative to the account's own 30-day
-- median (matches the copy already on the Watchlist screen).
alter table watchlist_posts
  add column if not exists is_outlier boolean not null default false,
  add column if not exists outlier_ratio numeric;

create index if not exists watchlist_posts_outlier_idx on watchlist_posts(is_outlier) where is_outlier;

-- pg_cron + pg_net were already enabled in 0004. The project ref
-- (wxgfaaaboftzsazknbvl) is not secret and is filled in below — only the
-- service_role key is, and it appears in exactly ONE place in this file:
-- the line right under "declare". Replace only the text between the quotes
-- on that one line, run this in the SQL Editor, then never save or commit
-- the filled-in version anywhere — that key bypasses every RLS policy.

do $$
declare
  -- <<< PASTE YOUR SERVICE_ROLE KEY BETWEEN THE QUOTES ON THIS LINE ONLY >>>
  service_role_key text := 'PASTE_SERVICE_ROLE_KEY_HERE';
begin
  perform cron.schedule(
    'creator-os-fetch-rss-nightly',
    '30 20 * * *', -- 20:30 UTC = 02:00 IST daily, matches the Sources.tsx copy
    format(
      $sql$select net.http_post(
        url := 'https://wxgfaaaboftzsazknbvl.supabase.co/functions/v1/fetch-rss',
        headers := jsonb_build_object('Authorization', 'Bearer %s'),
        timeout_milliseconds := 60000
      );$sql$,
      service_role_key
    )
  );

  perform cron.schedule(
    'creator-os-scrape-watchlist-daily',
    '0 3 * * *', -- 03:00 UTC = 08:30 IST daily — after the news pull, ahead of his morning
    format(
      $sql$select net.http_post(
        url := 'https://wxgfaaaboftzsazknbvl.supabase.co/functions/v1/scrape-watchlist',
        headers := jsonb_build_object('Authorization', 'Bearer %s'),
        timeout_milliseconds := 120000
      );$sql$,
      service_role_key
    )
  );
end $$;

-- Both jobs run on schedule starting tonight. APIFY_API_TOKEN is already set
-- and confirmed working (2026-09-22), so scrape-watchlist will do a real
-- scrape once the Watchlist has active accounts in it.
