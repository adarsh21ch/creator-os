-- Creator OS — Phase 1 schema
-- Single-user personal app (Adarsh only). RLS is intentionally left off: there is
-- exactly one user and the Supabase anon key is never exposed beyond his own devices.
-- Revisit if this ever becomes multi-tenant (see docs/02-decisions.md).

-- ── Library — the foundation table ──────────────────────────────────────────
-- Every reel he has posted: transcript + metrics + which format it used.
-- The Scriptwriter reads this to sound like him, the Pattern Analyst reads it
-- to find what works, the Playbook Keeper reads it to know what changed.
create table if not exists reels (
  id uuid primary key default gen_random_uuid(),
  posted_at date,
  transcript text not null,
  caption text,
  pillar text,
  hook_type text,
  length_seconds int,
  format_id uuid, -- fk added once the Formats table exists (Phase 2+)
  is_organic boolean not null default true, -- false = paid promotion, confounds teardown comparisons
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  profile_visits bigint,
  follows bigint,
  source text not null default 'voice_training' check (source in ('voice_training', 'graph_api', 'manual')),
  notes text,
  created_at timestamptz not null default now()
);

comment on table reels is 'The Library. Foundation table — build this correctly before anything else (docs/01-architecture.md).';

-- ── Watchlist — 40 competitor accounts ──────────────────────────────────────
create table if not exists watchlist_accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  wing text check (wing in ('right', 'left', 'neutral')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Sources — newspapers / RSS feeds for the News Desk Analyst ─────────────
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null default 'rss' check (type in ('rss', 'newspaper', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Brand Brain — singleton voice profile ───────────────────────────────────
create table if not exists brand_brain (
  id smallint primary key default 1 check (id = 1),
  pillars jsonb not null default '[]',
  hook_formula text,
  voice_notes text,
  banned_claims text,
  language_register text check (language_register in ('clean', 'mixed', 'crude')),
  updated_at timestamptz not null default now()
);

insert into brand_brain (id) values (1) on conflict (id) do nothing;

-- ── Employees — the 13 AI staff, each a row not a code file ────────────────
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'I-01'
  name text not null,
  desk text not null check (desk in ('intelligence', 'creative', 'production', 'performance', 'manager')),
  prompt text,
  provider text not null default 'anthropic' check (provider in ('anthropic', 'gemini')),
  model text,
  schedule text, -- cron expression, null = on-demand
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── App settings — singleton, non-secret connection state ──────────────────
create table if not exists app_settings (
  id smallint primary key default 1 check (id = 1),
  instagram_connected boolean not null default false,
  anthropic_key_set boolean not null default false,
  gemini_key_set boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;
