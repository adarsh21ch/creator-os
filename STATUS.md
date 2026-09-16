# STATUS — the resume point

_Last updated: 2026-09-16_

## Where we are

Design phase complete. **Zero code written.** Next action is to scaffold the app and build the
Phase 1 intake screens.

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

## Blocked on Adarsh

1. **Metrics for the 4 transcripts in `data/transcripts/`.** Which performed best, which worst.
   Without this nothing can be labelled winner vs loser and no Format can be promoted past a hunch.
2. **3 reels that clearly flopped.** Needed to check patterns against losers — winners alone
   produce survivorship bias, which is the exact failure mode the Pattern Analyst exists to avoid.
3. **Language register decision.** Transcript 02 contains a crude Hindi word. He wants brand deals
   later; the Brand Brain needs a register setting and he has to choose where it sits.
4. **API keys created** (console.anthropic.com and aistudio.google.com).

## Not blocked — can start now

Phase 1 scaffolding does not need any of the above. Build order is in `docs/01-architecture.md`.

**Next concrete action:** scaffold the Vite + React + TS + Tailwind app, set up Supabase, and
build the `reels` (Library) table plus the Voice Training intake screen.

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
