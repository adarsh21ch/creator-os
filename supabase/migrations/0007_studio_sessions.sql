-- Studio history/persistence, requested by Adarsh 2026-09-20 ("everything should be
-- persist... I can watch my previous scripts, hooks"). Design in STATUS.md.
--
-- reel_id is the important field, not an afterthought: once he posts something drafted
-- here and enters its real numbers in the Library, this links the two — so a future
-- Pattern Analyst can compare DRAFTED structure against ACTUAL performance, not just
-- posted-reel structure after the fact.

set search_path to creator_os, public;

create table if not exists studio_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  research_text text,
  hooks_text text,
  chosen_hook text,
  script_text text,
  reel_id uuid references reels(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table studio_sessions enable row level security;
create policy studio_sessions_authenticated_all on studio_sessions
  for all to authenticated using (true) with check (true);
-- No anon grant needed: 0006's default privileges only cover authenticated/service_role
-- for tables created after it, so this one never had anon access to begin with.
