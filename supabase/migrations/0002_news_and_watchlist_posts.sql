-- News ingestion + competitor post logging.
-- Twitter/X skipped by decision 2026-09-16 (cost, not in original architecture).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── News stories — raw RSS pulls, not yet AI-scored (needs Anthropic/Gemini
-- keys, which are still pending — see STATUS.md). The News Desk Analyst's
-- shareability scoring is a later step once those keys exist.
create table if not exists news_stories (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  title text not null,
  url text not null unique,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists news_stories_source_idx on news_stories(source_id);

-- ── Watchlist posts — what the 40 competitor accounts are posting.
-- Populated by pasting an Instagram link into the Watchlist screen; the
-- ingest-instagram Edge Function calls Apify to fill in the rest.
create table if not exists watchlist_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references watchlist_accounts(id) on delete cascade,
  post_url text not null unique,
  posted_at date,
  caption text,
  transcript text,
  views bigint,
  likes bigint,
  comments bigint,
  fetched_at timestamptz not null default now()
);

create index if not exists watchlist_posts_account_idx on watchlist_posts(account_id);
