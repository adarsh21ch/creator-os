-- Turns the News Desk and Influencer Watch from "screens with a paste box"
-- into actually-scheduled desks. Requested 2026-09-22 ("build the next
-- phase"). Two real gaps found first: fetch-rss existed and worked but was
-- never scheduled (the "pulled nightly at 2am" copy in Sources.tsx was
-- aspirational, not wired up), and APIFY_API_TOKEN was never set as an Edge
-- Function secret in Nevorai Tools — see the note at the bottom.

set search_path to creator_os, public;

-- Influencer Watch needs somewhere to record "this post is unusually big for
-- this account" — a flat view-count threshold is meaningless across accounts
-- of very different sizes, so this is relative to the account's own 30-day
-- median (matches the copy already on the Watchlist screen).
alter table watchlist_posts
  add column if not exists is_outlier boolean not null default false,
  add column if not exists outlier_ratio numeric;

create index if not exists watchlist_posts_outlier_idx on watchlist_posts(is_outlier) where is_outlier;

-- pg_cron + pg_net were already enabled in 0004. Scheduling itself needs no
-- new grants — cron jobs run as the database owner.
--
-- IMPORTANT — replace both placeholders below before running this file:
--   <PROJECT_REF>        -> wxgfaaaboftzsazknbvl
--   <SERVICE_ROLE_KEY>   -> Nevorai Tools -> Project Settings -> API -> service_role key
-- Do this only in the SQL Editor paste, never commit the filled-in version —
-- the service_role key bypasses every RLS policy in the project.

select cron.schedule(
  'creator-os-fetch-rss-nightly',
  '30 20 * * *', -- 20:30 UTC = 02:00 IST daily, matches the Sources.tsx copy
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
    timeout_milliseconds := 60000
  );
  $$
);

select cron.schedule(
  'creator-os-scrape-watchlist-daily',
  '0 3 * * *', -- 03:00 UTC = 08:30 IST daily — after the news pull, ahead of his morning
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/scrape-watchlist',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
    timeout_milliseconds := 120000
  );
  $$
);

-- Both jobs will run on schedule starting tonight, but scrape-watchlist
-- returns a clean 400 ("APIFY_API_TOKEN is not set") until that secret is
-- added — see STATUS.md for the exact command. Harmless, just an empty run
-- logged in cron.job_run_details each day until then.
