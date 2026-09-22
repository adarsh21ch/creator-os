-- Format library, requested by Adarsh 2026-09-22 ("the two patterns should show up
-- somewhere instead of only living in a markdown file"). Source: docs/04-formats.md.
--
-- A reel can fit MORE THAN ONE format at once (all 4 winners in the sample fit both
-- F-01 and F-02 simultaneously) — that's why this is a formats table + a junction
-- table, not the single `reels.format_id` column stubbed in 0001/0004. That column
-- is left in place unused rather than dropped, in case a later "primary format" use
-- shows up; the real tagging lives in reel_formats.

set search_path to creator_os, public;

create table if not exists formats (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'F-01'
  name text not null,
  status text not null default 'watching' check (status in ('promoted', 'killed', 'watching')),
  description text not null,
  scriptwriter_rule text, -- the instruction C-03 must follow, only set for promoted formats
  evidence text, -- short win/loss tally, e.g. '4 of 4 winners, 0 of 3 losers'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table formats is 'Promoted/killed patterns from teardown analysis. A pattern is promoted only if it appears in 3+ winners AND is meaningfully rarer in losers (docs/04-formats.md).';

create table if not exists reel_formats (
  reel_id uuid not null references reels(id) on delete cascade,
  format_id uuid not null references formats(id) on delete cascade,
  primary key (reel_id, format_id)
);

alter table formats enable row level security;
alter table reel_formats enable row level security;

create policy formats_authenticated_all on formats
  for all to authenticated using (true) with check (true);
create policy reel_formats_authenticated_all on reel_formats
  for all to authenticated using (true) with check (true);
-- No anon grant needed — same as 0007, 0006's default privileges only cover
-- authenticated/service_role for tables created after it.

-- ============================================================
-- SEED: the two promoted formats and the two killed hypotheses from the
-- 2026-09-16 teardown, so the screen isn't empty on first load.
-- ============================================================

insert into formats (code, name, status, description, scriptwriter_rule, evidence) values
(
  'F-01',
  'Named Living Villain',
  'promoted',
  'The reel is aimed at a specific, living, recognizable target the audience already has feelings about — a named party or leader, a visible group of creators or celebrities, or people the viewer argues with in real life. Losers aim at institutions, statistics, laws, or historical figures instead.',
  'Before writing, name the target out loud. If it is an institution, a statistic, a law, or a historical figure, the script has no villain yet — find the living person or group who is doing this now, or reject the topic.',
  '4 of 4 winners, 0 of 3 losers'
),
(
  'F-02',
  'Stake On The Viewer',
  'promoted',
  'Winners hand the viewer a grievance that touches their own life: their exam, their child''s admission, their job, their country being insulted, a promise broken to them. Losers hand the viewer information — a policy mechanism, a good-news update, an ideology explainer.',
  'Every script must be able to answer "what has been taken from the viewer, or is about to be?" in one sentence. If the answer is "nothing, but it is important to know" — that is a loser shape, and it will die.',
  '4 of 4 winners, 0 of 3 losers'
),
(
  'H-01',
  'The Counted Zero',
  'killed',
  'The guess-the-number device (ab aap guess karlo, walk the number down, reveal the real figure). Present in 2 winners but also in a loser that used it almost identically and still lost. Disproved as a cause: it is a delivery habit, not why a reel wins.',
  null,
  'Present in winners and losers alike — not discriminating'
),
(
  'H-02',
  'Their Words, Their Weapon',
  'killed',
  'State the opponent''s claim, then flatly contradict it. Present in 3 winners but also in the cleanest organic loser in the sample. Disproved as a cause: it is his default rhetorical habit (belongs in the voice profile), not a format.',
  null,
  'Present in winners and losers alike — not discriminating'
)
on conflict (code) do update set
  name = excluded.name,
  status = excluded.status,
  description = excluded.description,
  scriptwriter_rule = excluded.scriptwriter_rule,
  evidence = excluded.evidence,
  updated_at = now();

-- Tag the 4 winning reels with both promoted formats, matched by the unique `notes`
-- text already stored on each seeded reel (docs/04-formats.md's reel-by-reel table).
insert into reel_formats (reel_id, format_id)
select r.id, f.id
from reels r
cross join formats f
where f.code in ('F-01', 'F-02')
  and r.notes like 'WINNER (organic).%Fits F-01 + F-02.%'
on conflict do nothing;
