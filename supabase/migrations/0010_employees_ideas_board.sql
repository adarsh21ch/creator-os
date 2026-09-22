-- "go all in": Employees, Ideas, Board. Requested 2026-09-22.
--
-- The employees table has existed since 0001/0004 but was always empty --
-- Studio's Hook Writer and Scriptwriter prompts were hardcoded in
-- studio-generate instead, which is exactly the thing CLAUDE.md's core
-- architecture idea says not to do ("an employee is a database row, not a
-- code file... hiring a 14th employee must not require a deploy"). This
-- seeds all 13 + the Manager as real rows, matching docs/01-architecture.md
-- exactly, and studio-generate now reads C-02/C-03/I-04's prompt + model
-- from these rows (falling back to the old hardcoded text only if a row's
-- prompt is empty).
--
-- enabled = true only for desks that have a real working call behind them
-- today (I-02 Influencer Watch and I-04/C-01/C-02/C-03 via Studio + Ideas).
-- Everything else is staffed but not built -- honest, not aspirational.

set search_path to creator_os, public;

insert into employees (code, name, desk, prompt, provider, model, schedule, enabled) values
('M-00', 'Chief of Staff', 'manager',
 'Runs every desk on schedule, chases what is stuck, files one Daily Brief at 06:00 IST: what is trending, what is ready for him, what is working, what stopped working, what is blocked, and one question it wants answered.',
 'anthropic', 'claude-sonnet-5', '30 0 * * *', false),

('I-01', 'News Desk Analyst', 'intelligence',
 'Reads the RSS/newspaper list nightly, keeps only stories relevant to his pillars (politics, current affairs, incidents, reservation, business-politics crossover), scores on shareability not importance.',
 'gemini', 'gemini-flash', '30 20 * * *', false),

('I-02', 'Influencer Watch', 'intelligence',
 'Logs every new post from the 40 watched accounts. Outlier rule: views >= 3x that account''s own trailing 30-day median, never an absolute threshold -- a 50k account doing 150k is a stronger signal than a 5M account doing 10M. Rule-based, not an LLM call.',
 'anthropic', null, '0 3 * * *', true),

('I-03', 'Trend Scout', 'intelligence',
 'Flags a format inside the niche when 3+ watched accounts use it within 7 days. No trending-audio API exists -- substitute: flag audio used by 3+ watched accounts in 7 days.',
 'anthropic', null, null, false),

('I-04', 'Deep Research Analyst', 'intelligence',
 'Search the web for real, verifiable facts about the topic given. Return a plain numbered list. Every line must end with the source URL in parentheses. Do not include anything you could not find a source for. If you find little or nothing solid, say so plainly instead of filling space.',
 'anthropic', 'claude-sonnet-5', null, true),

('C-01', 'Topic Planner', 'creative',
 'Turn today''s raw outlier posts and news headlines into a short ranked list of reel topics, one per pillar where possible, each with a one-line why-now and a confidence note. Prefer topics that fit F-01 (named living villain) and F-02 (stake on the viewer).',
 'anthropic', 'claude-sonnet-5', null, true),

('C-02', 'Hook Writer', 'creative',
 'Write 8 hooks for the topic, following the hook formula exactly. Tag each one [WIDE REACH] or [HIGH INTENT]. Number them 1-8, hook text only after the tag -- no extra commentary.',
 'anthropic', 'claude-sonnet-5', null, true),

('C-03', 'Scriptwriter', 'creative',
 'Write the full 60-90 second reel script that pays off the chosen hook, following the voice profile and beat structure exactly. Mark pause/emphasis cues in [brackets]. End with a share line and a CTA.',
 'anthropic', 'claude-sonnet-5', null, true),

('C-04', 'Packaging Writer', 'creative',
 'Write caption, first comment, hashtags, on-screen text, cover-frame text, and a YouTube Shorts title for the finished script -- six different jobs, six different sets of words.',
 'gemini', 'gemini-flash', null, false),

('P-01', 'Production Coordinator', 'production',
 'Write a shoot card (setting, wardrobe, props, b-roll) and an edit brief (cut points, caption placement, zooms, music mood, target length) precise enough that a hired editor never has to call him. AI cannot edit video -- this only writes the brief.',
 'anthropic', null, null, false),

('P-02', 'Publishing Scheduler', 'production',
 'Track each drafted reel through Idea -> Researched -> Scripted -> Shot -> Editing -> Scheduled -> Published. Anything stuck 2+ days becomes a blocker in the Manager''s brief.',
 'anthropic', null, null, false),

('A-01', 'Performance Analyst', 'performance',
 'Pull his own metrics via the Instagram Graph API. Answer which posts earned follows, which earned saves, which earned profile visits, which earned comments -- usually four different reels -- broken down by pillar, hook type, length, posting time.',
 'anthropic', null, null, false),

('A-02', 'Playbook Keeper', 'performance',
 'Rewrite one file weekly with what won, what died, what changed. The Hook Writer and Scriptwriter should load this as context before writing -- this is the compounding agent.',
 'anthropic', null, null, false),

('A-03', 'Pattern Analyst', 'performance',
 'Take a winner''s transcript, break it into beats with timings, name the mechanism, strip the topic out, file it as a numbered reusable Format. Promote only if a pattern appears in 3+ winners AND is meaningfully rarer in the losers.',
 'anthropic', 'claude-sonnet-5', null, false)

on conflict (code) do nothing;

-- Ideas: C-01 Topic Planner's output, persisted so ideas survive a page
-- refresh and can be marked used (sent to Studio) or dismissed, same
-- "don't throw away AI output" principle as studio_sessions.
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  pillar text,
  why_now text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  source text,
  status text not null default 'new' check (status in ('new', 'used', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table ideas enable row level security;
create policy ideas_authenticated_all on ideas
  for all to authenticated using (true) with check (true);

-- Board: a status per Studio session. A script IS the production unit here,
-- so this rides on studio_sessions rather than a separate table.
alter table studio_sessions
  add column if not exists production_status text not null default 'scripted'
    check (production_status in ('scripted', 'shooting', 'editing', 'scheduled', 'posted'));
