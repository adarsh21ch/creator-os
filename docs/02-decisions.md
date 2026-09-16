# Decision log

## 2026-09-16

- **Creator OS is a web app, not a chat workflow.** Decisive reason: a chat cannot wake at 02:00,
  and cannot hold 100 reels with metrics in a queryable table. The three roles are distinct —
  the Claude Code chat is the workshop, the website is where he works, the Claude/Gemini API is
  the engine inside the website.
- **Data goes into the product, not into chat.** His instinct, and correct. Consequence: the
  intake screens moved to Phase 1, ahead of the writers. Build went 4 weeks → 5.
- **Intake stores metrics alongside transcripts.** Same paste, two payoffs: voice profile for the
  Scriptwriter, labelled examples for the Pattern Analyst — available day one from his back
  catalogue, before he posts anything new.
- **Scoreboard is follows / saves / profile visits / returning viewers, not views.** Follows from
  his stated goal of a cult audience that migrates to YouTube and a podcast. A 400k-view reel with
  11 follows is a failure under this design and the system must say so.
- **Playbook tracks recurring assets** — catchphrases, named series, signature formats. Cults run
  on repetition; the Scriptwriter reuses them deliberately instead of inventing a new persona each
  reel.
- **A-03 Pattern Analyst added** at his request — reverse-engineer winners into reusable templates.
  Kept separate from A-01 (which counts) and A-02 (which writes the lessons down).
- **Both AI providers, not one.** Gemini Flash for transcription and high-volume classification;
  Claude for Scriptwriter, Hook Writer, Pattern Analyst, Deep Research. Per-employee override in
  the admin panel makes this cheap rather than complicated.
- **Domain: `creator.nevorai.com`.** Rejected `creatoros.nevorai.com` — reads like a typo, awkward
  to say. The app is titled Creator OS internally; the URL need not repeat it.
- **Lift `~/above1million` for the Influencer Watch desk.** Already has Apify scraper, reels table,
  pg_cron, Claude classifier, build-clean. Removes roughly a week.
- **Do not sell to other creators yet.** Academy OS has a 100-tenant target; a second product
  competes for the same weeks. The architecture is multi-tenant-shaped so the door stays open.
- **Scope discipline:** build Phase 1, let him use it two weeks, then decide on the rest.
