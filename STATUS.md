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

## Blocked on Adarsh

1. **3–5 more ORGANIC losers.** The validation step for F-01 and F-02. Organic only — promoted
   reels confound the comparison.
2. **Which of the 4 winners was biggest.** Lets the formats be weighted rather than flat.
3. **Language register decision.** Transcript w02 contains a crude Hindi word. He wants brand
   deals later; the Brand Brain needs a register setting and he has to choose where it sits.
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
