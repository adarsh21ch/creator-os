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

## SECURITY BLOCKER — must be fixed before any deploy

**Verified 2026-09-16: RLS is disabled on all 8 tables.** `VITE_SUPABASE_ANON_KEY` ships inside
the client JS bundle, so it is public by definition. An anon `DELETE` against `reels` returned
**HTTP 204** — meaning once this app is live at creator.nevorai.com, anyone who opens the page
can read every transcript and strategy note, and can wipe the database.

Harmless right now because nothing is deployed. **It is a hard blocker on deploying.**

**Auth is now built** (2026-09-16): `src/lib/auth.tsx` (AuthProvider + useAuth),
`src/pages/Login.tsx` (email + password, no public sign-up), a gate in `App.tsx` that shows the
login screen when there is no session, and a sign-out control in the sidebar. Build passes.

`supabase/migrations/0003_enable_rls.sql` is still **NOT applied** — deliberately. Correct order,
so Adarsh is never locked out:
1. Create his user: Supabase dashboard → Authentication → Users → Add user (he sets the password).
2. Run the app, sign in, confirm the screens still load.
3. **Then** paste 0003 into the Supabase SQL editor.

If anything goes wrong, the Supabase dashboard table editor bypasses RLS, so the data is never
unreachable.

**Do not deploy to Vercel until 0003 has been applied and login verified.**

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
