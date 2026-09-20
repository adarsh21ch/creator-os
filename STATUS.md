# STATUS — the resume point

_Last updated: 2026-09-16_

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
