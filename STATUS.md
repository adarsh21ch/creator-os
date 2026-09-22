# STATUS — the resume point

_Last updated: 2026-09-22_

## Where we are

Phase 1 scaffold is built and running. App shell (React + Vite + TS + Tailwind), Supabase project
live (`Creator OS`, ap-south-1, project ref `ljfiqwuidwilfoxqvtqx`), schema applied. Screens wired
to real data: **Library** (also the Voice Training intake — paste a transcript + metrics, it saves
to the `reels` table), **Watchlist**, **Sources**, **Brand Brain**, **Settings**. Verified working
end-to-end in the browser (add/read confirmed against the live database).

Not built yet: Today, Ideas, Studio, Board, Formats, Performance, Employees — each shows a "later"
placeholder naming which phase it belongs to.

**Not yet on GitHub** — waiting on a private repo to be created, see bottom of this file.

## Settled decisions

| Question | Answer |
|---|---|
| Niche | Politics, current affairs, incidents, reservation + business-politics crossover |
| Content type | Explainer + argument (not tips/tutorials) |
| Goal metric | Follows-per-post, saves, profile visits, returning viewers — NOT views |
| Domain | `creator.nevorai.com` |
| Instagram | Creator account, Facebook Page connected |
| AI providers | Both — Gemini Flash for transcription/classification, Claude for judgment work |
| Stack | React + Vite + TS + Tailwind, Supabase, Vercel |
| Employees | 13 AI + 1 manager across 4 desks — see `docs/01-architecture.md` |

## First real teardown — done 2026-09-16

7 transcripts in hand (4 winners, 3 losers). Result in `docs/04-formats.md`:

- **Both original hypotheses were killed.** The Counted Zero and Their Words Their Weapon both
  appear in losing reels. They are voice markers, not causes. This is exactly the survivorship
  bias the promotion rule exists to catch, and it caught it.
- **Two formats promoted:** F-01 Named Living Villain (4/4 winners, 0/3 losers) and F-02 Stake On
  The Viewer (4/4, 0/3). Winners aim at a living recognizable target and hand the viewer a
  grievance; losers explain institutions, policy or history.
- **Confound:** 2 of the 3 losers were paid promotions, so part of the gap may be cold
  distribution. l03 is organic and fits both formats, which is what keeps them standing.

## MOVED — now inside Nevorai Tools (2026-09-20)

Creator OS no longer has its own Supabase project. It lives in the **`creator_os` schema** inside
the shared **Nevorai Tools** project (`wxgfaaaboftzsazknbvl`, ap-south-1), alongside whatever other
Nevorai apps land there later — the schema boundary is what stops table-name collisions.

`.env` and `src/lib/supabase.ts` already point at it (`db.schema: 'creator_os'`). Build passes.

**One paste left to do it for real — `supabase/migrations/0004_bootstrap_in_nevorai_tools.sql`.**
It is everything: schema, all 8 tables, RLS + policies, and the 7 seeded reels + brand brain,
in one script. Run it once in the Nevorai Tools SQL Editor.

**Then one dashboard click, not SQL:** Project Settings → API → Exposed schemas → add `creator_os`
to the list (keep `public` too). Skipped, the app gets 404s — PostgREST won't serve a schema it
doesn't know to expose.

**Then create the login user** in this project's Authentication → Users (fresh project, no users
yet) and sign in to verify.

The old standalone project can be deleted once this is confirmed working.

## SECURITY BLOCKER — must be fixed before any deploy

**Verified 2026-09-16: RLS is disabled on all 8 tables.** `VITE_SUPABASE_ANON_KEY` ships inside
the client JS bundle, so it is public by definition. An anon `DELETE` against `reels` returned
**HTTP 204** — meaning once this app is live at creator.nevorai.com, anyone who opens the page
can read every transcript and strategy note, and can wipe the database.

Harmless right now because nothing is deployed. **It is a hard blocker on deploying.**

**Auth is built** (2026-09-16): `src/lib/auth.tsx`, `src/pages/Login.tsx`, a route gate in
`App.tsx`, sign-out in the sidebar. Build passes.

RLS is folded into migration 0004 (see "MOVED" above) and applies immediately on this project,
since it is fresh and nothing depends on anon access yet — unlike the old project, there is no
two-step dance needed here.

**Do not deploy to Vercel until 0004 has been run, the schema exposed, and login verified.**

**All three done and verified 2026-09-20** — schema exposed, login works, Library loads. Migration
0004 is live in Nevorai Tools. Old standalone Supabase project is no longer used.

## Two fixes made after go-live (2026-09-20)

1. **Library page had no error state** — a failed fetch just hung on "Loading…" forever instead
   of showing why. Fixed: now shows the real error message. Caught this because the first live
   Library load appeared stuck (schema cache likely still catching up right after exposing
   `creator_os` in the dashboard — refresh usually clears it; now if it doesn't, the error shows).
2. **Settings can now save AI keys directly** — Adarsh asked for this. `app_settings` gained
   `anthropic_api_key` / `gemini_api_key` text columns (migration 0005, additive only), behind the
   same authenticated-only RLS as every other table. Settings screen has a masked input + Save per
   key; once saved the value is never re-displayed, only "Set" / "Replace".
   **Not consumed yet** — no AI employee exists to read it. Whoever builds Studio (Phase 2) should
   read the key from this table server-side via the service_role key, not a separate Edge Function
   secret. Comment left in 0005 saying exactly this.

**Run 0005 the same way as 0004** — paste into the Nevorai Tools SQL Editor, run once.

## Bug found live 2026-09-20: "permission denied for schema creator_os"

0004 created the schema, tables, RLS and policies — but never granted `authenticated` USAGE on
the schema itself, and never granted table-level SELECT/INSERT/UPDATE/DELETE. RLS restricts which
*rows* a role sees once it's allowed into a schema; it doesn't grant entry. The built-in `public`
schema comes pre-granted by Supabase's own bootstrap, which is why the old standalone project
never needed this — a schema we create ourselves does not inherit that.

**Fix: `supabase/migrations/0006_grant_schema_access.sql`.** Also sets default privileges so any
table added in Phase 2+ gets the same access automatically, without needing a 0007 for the same
mistake.

**VERIFIED LIVE 2026-09-20:** Library loads all 7 reels in the browser (5 organic, 2 paid,
matching the winners/losers split exactly). Migration required one extra manual step beyond the
SQL itself: `NOTIFY pgrst, 'reload schema';` — GRANT/REVOKE statements don't trigger Supabase's
usual auto-reload the way CREATE/ALTER do, so the API layer needed an explicit nudge to pick up
the new permissions. Worth knowing for any future migration that touches grants.

**The Nevorai Tools migration is complete and confirmed working end to end.** Old standalone
Supabase project is fully replaced and safe to delete.

## Studio built (2026-09-20) — Phase 2 has started

First two real AI employees are live in code: **C-02 Hook Writer** and **C-03 Scriptwriter**,
both in one edge function `supabase/functions/studio-generate`. Model: **Sonnet 5** for both,
deliberately not Haiku — hooks and scripts are the two highest-leverage, viewer-facing outputs
in the system, and the Sonnet-vs-Haiku cost gap here is only ~₹200/month. Haiku is earmarked for
later, more mechanical employees (Packaging Writer, bulk classification of scraped posts).

- Reads the Anthropic key and Brand Brain straight from the database — this is exactly what the
  Settings key-save feature (built earlier the same day) was for. No Edge Function secret needed
  for the AI key itself.
- Brand Brain's system-prompt block is cache_control'd (ephemeral) — it's identical on every call,
  so this is the prompt-caching win discussed with Adarsh, built in from day one rather than
  bolted on later.
- **Auth gap found and fixed on BOTH edge functions**, not just the new one: neither
  `studio-generate` nor the pre-existing `ingest-instagram` checked that the caller was actually
  signed in — the anon key alone (public, ships in the browser bundle) would have been enough to
  invoke them and spend Apify/Anthropic credits. Both now verify a real user JWT first.
- Also fixed: `ingest-instagram` was never updated with `db: { schema: 'creator_os' }` after the
  Nevorai Tools move — it would have silently written into `public` instead. Caught before it was
  ever deployed to the new project.

**Studio UI**: topic in → 8 hooks tagged [WIDE REACH]/[HIGH INTENT] → pick one → full 60-90s
script with pause/emphasis cues. Not persisted to the Library automatically yet — Adarsh copies
the final script in manually once shot, along with real numbers. Topic is free-typed for now;
the Topic Planner (auto-suggesting topics from Intelligence Desk data) is still Phase 3.

**Deployed 2026-09-20** — CLI was linked to the wrong Supabase account (leftover from an earlier
project), fixed with `supabase logout` + `supabase login` + re-link, then both functions deployed
to `wxgfaaaboftzsazknbvl`.

**Bug found on first real test: CORS.** Studio's "Generate hooks" failed with "Failed to send a
request to the Edge Function" — the generic error `supabase-js` throws when the browser's CORS
preflight (OPTIONS request) gets no answer, not a real error from inside the function. Supabase
Edge Functions don't handle CORS automatically; every function called from a browser needs an
explicit OPTIONS handler and `Access-Control-Allow-*` headers on every response, or the browser
blocks the call before it reaches the server. Fixed in both `studio-generate` and
`ingest-instagram` via `supabase/functions/_shared/cors.ts` (a `json()` helper that always
includes the CORS headers). **Needs redeploying** — see next action.

## Database is now seeded (2026-09-16)

- `reels`: **7 rows** — the 4 winners and 3 losers, with `is_organic` set correctly (l01 and l02
  flagged as paid promotions). **Metrics left NULL on purpose** — exact figures were never
  supplied and inventing them would poison the exact analysis this table exists for. Adarsh
  filling real numbers in the Library screen is a 5-minute job that meaningfully strengthens
  F-01 and F-02.
- `brand_brain`: seeded with the 5 pillars, his hook formula, and the full voice profile —
  including the warning that beats 1 and 5 appear in losers too and are voice, not cause.
  `language_register` deliberately left NULL: that is his decision.
- Everything else still empty: `watchlist_accounts`, `sources`, `employees`, `news_stories`,
  `watchlist_posts`.

## Studio history — BUILT 2026-09-20 (same day it was queued)

Table `studio_sessions` (migration 0007), RLS'd the same as everything else. Studio now
upserts into it on every step (research/hooks/script), and a History list at the bottom of
the page shows past topics with a status row (✓ research / ✓ hooks / ✓ script / posted) —
click one to reload the whole thing back into view. `reel_id` column exists for the future
Library link but no linking button yet, per the scoped-down plan below.

**Also fixed in the same pass: the "blank result" bug Adarsh hit.** Root cause — the research
call's `max_tokens: 3000` combined with up to 5 web searches could exhaust the budget before
Claude ever wrote the final answer, so `extractText` returned `""` and the UI rendered nothing
with no error. Fixed: `max_tokens` raised to 8000, `max_uses` lowered to 3 (leaves more room,
costs less per search), and every response path now fails loudly with the real `stop_reason`
instead of silently returning empty text.

**Deployed 2026-09-20**, verified: `_shared/cors.ts` appeared in the deploy output alongside
the function, confirming the CORS fix built correctly.

## Production security audit — 2026-09-22, now that creator.nevorai.com is live

1. **CONFIRMED, SEVERE, NOT YET FIXED: Supabase public sign-up is enabled** (`disable_signup: false`,
   checked via the project's public `/auth/v1/settings` endpoint — read-only, created no user).
   Because every RLS policy in this app is `for all to authenticated using (true)` — "authenticated
   means Adarsh" — anyone who signs themselves up gets full read/write on every table. **This is a
   dashboard-only setting, cannot be fixed via SQL or the CLI used so far.** Adarsh must go to the
   Nevorai Tools Supabase project → Authentication → Sign In / Providers → Email, and turn OFF
   "Allow new users to sign up." Until that happens, the "single-operator" trust model this entire
   app's security is built on does not actually hold in production.
2. **Fixed: CORS was wildcard (`*`), now locked to `https://creator.nevorai.com` and
   `http://localhost:5173`** — `_shared/cors.ts` reworked to `corsHeadersFor(req)`, reflecting only
   an allowed origin. Both edge functions updated to pass `req` through to every response.
3. **Fixed: added a 404 route** (`src/pages/NotFound.tsx`) — the app had no catch-all before.
4. **Confirmed clean: no secrets ever committed to git** (`.env` was never tracked), repo builds
   from a clean clone, and the 14 commits sitting only-local got pushed to GitHub
   (`github.com/adarsh21ch/creator-os`) for the first time this session — they existed only on
   this laptop until now.
5. **Not verified: Vercel environment variables.** The app clearly works in production (login and
   pages render), which is decent evidence they're set correctly — but this was not independently
   confirmed against the Vercel dashboard.
6. **Deployed and verified 2026-09-22.** `supabase projects list` showed the wrong account
   moments earlier (some other project/session's login on this shared machine), but the per-repo
   link survived it — both `supabase functions deploy studio-generate` and
   `...deploy ingest-instagram` succeeded. Confirmed live with a real curl test: an OPTIONS
   preflight from `creator.nevorai.com` gets that origin back; one pretending to be
   `evil-example.com` gets the *production* origin back too (not its own) — which is exactly
   correct, since the browser only permits the read when the header matches the page's own
   origin, so an attacker origin can never pass regardless of what the server returns.
7. **All 15 pending commits pushed to GitHub** (`372e971..af43554`) — 14 of mine plus this
   hardening pass had been sitting local-only on this laptop until now. Should trigger Vercel's
   auto-deploy if the project is connected to this repo (very likely, since creator.nevorai.com
   was already serving the pre-push code from an earlier deploy).

## Only one item left from this audit, and it needs Adarsh directly

**Disable public sign-up** — Nevorai Tools Supabase project → Authentication → Sign In /
Providers → Email → turn off "Allow new users to sign up." Cannot be done via SQL, CLI, or
anything scriptable found so far; it's a dashboard-only toggle. This is the highest-priority
open item in the whole project — every RLS policy here assumes "authenticated = Adarsh," and
that assumption is false while this stays on.

**Re-confirmed 2026-09-22, still open.** Checked directly via the project's public
`/auth/v1/settings` endpoint (read-only, no user created) — `disable_signup: false`. Not fixed
yet as of this session; still needs Adarsh in the dashboard.

**Also deployed this session:** the research-timeout fix (effort lowered to `low`, client
timeout raised to 120s) that was written 2026-09-20 but never pushed — `supabase functions
deploy studio-generate` run 2026-09-22, confirmed in the deploy output.

**Worth a quick independent check, lower priority:** confirm Vercel's project settings have
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set to the Nevorai Tools values. The live site
working is decent evidence they're already correct, but this was not independently confirmed
against the Vercel dashboard.

## Follow-up same day: Library AND Studio both hung with no error

Right after redeploying, Library sat on "Loading…" and Studio's Research sat on "Searching the
web…" simultaneously with no error either side — a strong signal it was the local dev server
getting stuck (from a long session of repeated rebuilds), not two separate app bugs. Told Adarsh
to restart `bun run dev` and hard-refresh as the first move, since two unrelated screens failing
identically at the same moment rarely means two unrelated bugs.

**Also fixed for real, regardless of that cause:** a stuck spinner with no feedback was a fair
complaint on its own. Studio's three actions now: (1) time out client-side after 40-60s with a
clear error instead of hanging forever if something upstream genuinely drops, and (2) show live
elapsed seconds in the button label ("Searching the web… 14s") so "is it stuck?" always has a
visible answer. Library doesn't have this yet — same pattern should be applied there if it
recurs.

**Root cause of the actual timeout, found via the new error message itself:** research legitimately
took longer than 60s — the client-side cutoff was set too tight, and `effort: "medium"` asks the
model to reason harder than a search-and-summarize task needs. Fixed: research's effort lowered
to `"low"` (faster AND cheaper — this task never needed medium), client timeout raised to 120s as
a generous but still-bounded ceiling. NOT DEPLOYED YET — needs `supabase functions deploy
studio-generate`.

## Original design notes (superseded by "BUILT" above, kept for the reel_id follow-up)

Adarsh's own words: "search history, the data we have creating, everything should be persist...
I can watch my previous scripts, hooks, data maintains... and then performance inside." Correct
call — Studio is currently a whiteboard that erases itself. Every research/hooks/script call is
thrown away the moment he navigates off the page. Design for the fix, so a fresh session can
build it without re-deriving:

**New table `studio_sessions`:**
```
id uuid pk, topic text, research_text text, hooks_text text, chosen_hook text,
script_text text, reel_id uuid null references reels(id), created_at timestamptz
```
`reel_id` is the important field — once he actually posts something drafted in Studio and enters
its real numbers in the Library, linking the two lets a future Pattern Analyst compare *drafted
structure* against *actual performance*, not just posted-reel structure. This is the natural
extension of the Format/Pattern Analyst design already in `docs/04-formats.md` — Studio history
is training data for it, not just a convenience feature.

**Studio.tsx changes:** every research/hooks/script call also upserts into `studio_sessions`
(one row per topic session, updated as each step completes, not three separate rows). Add a
**History** list — either a new sidebar screen or a collapsible panel in Studio itself — showing
past sessions by topic/date, clickable to reload the full research+hooks+script back into view.
A "Mark as posted" action on a history row should let him link it to a Library reel once shot.

**RLS/schema:** additive only, same pattern as every other table here — one migration, authenticated-only
policy, default privileges already cover it (0006 set that up for anything added later, so this
needs no new grant statements).

**Scope note:** don't build the full Performance rollup in the same pass — land the persistence
and History view first, confirm it's actually useful day to day, then wire the reel_id linkage
once there's real posted data to link against.

## Formats screen + Studio → Library link — BUILT 2026-09-22

Both were the top two priorities for this session.

**Formats screen** (`src/pages/Formats.tsx`, migration `0008_formats.sql`): new `formats` +
`reel_formats` tables (many-to-many, not the unused `reels.format_id` column, because all 4
winners in the sample fit *both* F-01 and F-02 at once — a single FK couldn't represent that).
Seeded with F-01 Named Living Villain, F-02 Stake On The Viewer (both promoted, with the
Scriptwriter rule text from `docs/04-formats.md`), plus H-01 and H-02 (killed, kept visible so
nobody re-derives them). The 4 winning reels are auto-tagged in the seed migration itself,
matched by their existing unique `notes` text — no manual re-entry needed. Now in the nav as a
real Phase-1 screen, not a "later" placeholder.

**Studio → Library link**: every row in Studio's History list now has a "Mark as posted →"
control. Click it, pick the Library reel from a dropdown (shows date, pillar, and a transcript
snippet), and `studio_sessions.reel_id` gets set. One-click Unlink if picked wrong. This is
exactly the design queued in STATUS.md's "Original design notes" section below — implemented
as specified.

**Not yet run**: `supabase/migrations/0008_formats.sql`. Frontend code is deployed to Vercel
(pushed to `main`), but the Formats screen will show "No formats yet" until this migration is
pasted into the Nevorai Tools SQL Editor — see "WHAT YOU DO NEXT" for the exact paste.

## Intelligence Desk automation + production hardening — BUILT 2026-09-22

Requested this session: "build the next phase" + "I want app production ready." Verified the
signup toggle live via `/auth/v1/settings` after Adarsh's dashboard fix — **`disable_signup: true`
confirmed, security blocker is closed.**

**Two real gaps found before building anything new:**
1. `fetch-rss` (News Desk) existed and worked but was **never scheduled** — the "pulled nightly
   at 2am" copy on the Sources screen was aspirational, not real.
2. **`APIFY_API_TOKEN` was never set** as an Edge Function secret in Nevorai Tools — confirmed via
   `supabase secrets list` (the project has secrets for other Nevorai apps, none for Apify/IG).
   This means every "paste a link" ingestion on Library and Watchlist has been silently failing
   with "APIFY_API_TOKEN is not set" this whole time.

**Built:**
- **Influencer Watch** (`supabase/functions/scrape-watchlist`, lifted from
  `~/above1million`'s scrape-reels per CLAUDE.md's reuse instruction, same Apify actor
  `apify~instagram-scraper` that `ingest-instagram` already uses — one actor, not two). Pulls
  recent posts for every active Watchlist account, upserts into `watchlist_posts`, then flags
  outliers at **≥3× that account's own trailing-30-day median views** — never an absolute
  threshold, matching the rule already promised in the Watchlist screen's copy.
- **Migration `0009_intelligence_desk_automation.sql`**: adds `is_outlier` / `outlier_ratio` to
  `watchlist_posts`, and schedules both desks via `cron.schedule` + `net.http_post` —
  `fetch-rss` nightly at 02:00 IST, `scrape-watchlist` daily at 08:30 IST. **Has two placeholders
  (`<PROJECT_REF>`, `<SERVICE_ROLE_KEY>`) that must be filled in the SQL Editor before running —
  never commit the filled-in version, the service_role key bypasses every RLS policy.**
- **Watchlist screen**: expanding an account now shows its 10 most recent scraped posts with an
  outlier badge (e.g. "4.2×") instead of just the manual-log form.
- **Today screen** (was a placeholder): shows outlier posts across the whole Watchlist, sorted by
  ratio, plus the 10 latest headlines from Sources. No AI Manager narrating it yet — this is the
  raw feed version; an AI-written daily brief is the natural next step once this proves useful.
- **Error boundary** (`src/components/ErrorBoundary.tsx`): one broken screen no longer blanks the
  whole app — shows what broke and a way back to Today.
- **Confirmed via `vercel env ls production`**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  are correctly set on Vercel. Closes the "not independently confirmed" item from the 2026-09-22
  audit.

**Not deployed yet — needs Adarsh:**
1. Run `0009_intelligence_desk_automation.sql` in the SQL Editor, with both placeholders filled.
2. Set `APIFY_API_TOKEN` (and optionally `WATCHLIST_RESULTS_PER_ACCOUNT`, default 5) as Edge
   Function secrets — `supabase secrets set APIFY_API_TOKEN=xxx` from this machine, or via the
   dashboard. Until this is set, `scrape-watchlist` runs on schedule but returns a clean 400 each
   time — harmless, just an empty run in `cron.job_run_details`.

## Blocked on Adarsh

1. **3–5 more ORGANIC losers.** The validation step for F-01 and F-02. Organic only — promoted
   reels confound the comparison.
2. **Which of the 4 winners was biggest.** Lets the formats be weighted rather than flat.
3. **Language register decision.** Transcript w02 contains a crude Hindi word. He wants brand
   deals later; the Brand Brain needs a register setting and he has to choose where it sits.
4. **API keys created** (console.anthropic.com and aistudio.google.com).

## Not blocked — done

Phase 1 scaffolding is done (see "Where we are" above).

**Next concrete action — pick one:**
1. **Auth + RLS** (unblocks deploying). Supabase Auth, a login screen, apply migration 0003.
   Nothing can go live until this is done.
2. **Studio screen** (the first screen that gives him daily value) — Hook Writer + Scriptwriter
   reading the seeded Brand Brain. Needs an Anthropic or Gemini key in `.env`; none is set yet.
3. **Keep loading the archive** — his job, not a build task. 25-30 reels is the target for a real
   voice profile; 7 are in.

`gh` CLI is not installed on this machine, so the GitHub push needs him to create the private repo
manually at github.com/new (named `creator-os`, no README) and then `git remote add` + push.

## Build phases

1. **The intake** — Watchlist, Sources, Brand Brain, Settings, Voice Training. Ends with a working
   voice profile. Intake stores transcript AND metrics per past reel.
2. **The writers** — Creative Desk reading the Brand Brain.
3. **The desks that feed them** — Intelligence Desk + Manager + 06:00 brief.
4. **The loop** — Instagram Graph API, Performance Analyst, Pattern Analyst, Playbook Keeper.
5. **The board** — Production Coordinator, Scheduler, Kanban.

**Scope discipline agreed with him:** build Phase 1 only, let him use it for two weeks, then
decide. He runs many projects in parallel; do not let this eat a month before it has earned it.

## Reference

Published design document (his copy, opens in a browser):
https://claude.ai/artifact/DgvCHeUihWtt4TtjGPAt8N
