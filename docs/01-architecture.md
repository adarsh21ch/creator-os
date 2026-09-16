# Architecture — the 13 employees

Four desks run in sequence daily. The desk order IS the pipeline.
`Intelligence → Creative → Production → Performance → back into Creative.`

## M-00 · Chief of Staff (the Manager)
Runs every desk on schedule, chases what is stuck, files one **Daily Brief at 06:00** with exactly
six things: what is trending, what is ready for him, what is working, what stopped working, what is
blocked, and one question it wants answered. He replies in plain Hinglish; it re-tasks the desks.
This is the entire interface — he should never need to open 13 screens.

## Intelligence Desk — 02:00–05:00, unattended
- **I-01 News Desk Analyst** — reads his newspaper/RSS list nightly, keeps only niche-relevant
  stories, scores on *shareability* not importance. Output: story cards with source, 2-line
  summary, why it could travel, how fast it goes stale.
- **I-02 Influencer Watch** — 40 handles tagged right / left / neutral. Logs every new post: topic,
  format, hook line, views, likes, comments, posted-at. Filterable by wing + topic + date.
  **Outlier rule: ~3× that account's own 30-day median**, never an absolute view threshold — a 50k
  account doing 300k is a stronger signal than a 5M account doing 1M.
- **I-03 Trend Scout** — trends *inside the niche* only. Flags a format when 3+ watched accounts
  use it within 7 days.
- **I-04 Deep Research Analyst** — on demand. Dossier: verified facts with dates and numbers,
  primary sources, what the other side argues, and a Risk line of claims not to make on camera.

## Creative Desk — on demand
- **C-01 Topic Planner** — turns ~15 raw stories into 5 decided reels, one per pillar, each with a
  why-now line and a confidence note.
- **C-02 Hook Writer** — 8 hooks per topic on his formula (recognizable trigger word → specific
  outcome → withhold the how). Tags each *wide reach* or *high intent*.
- **C-03 Scriptwriter** — his voice, from his transcripts. 60–90s, Hinglish, talking head, re-hook
  every 10–15s, one share line, one CTA, pause/emphasis cues. Accepts "make it angrier / shorter /
  more Hindi" and rewrites.
- **C-04 Packaging Writer** — caption, first comment, hashtags, on-screen text, cover-frame text,
  YouTube Shorts title. Six different jobs, six different sets of words.

## Production Desk — 2 AI + 2 humans
- **P-01 Production Coordinator** — shoot card (setting, wardrobe, props, b-roll) and edit brief
  (cut points, caption placement, zooms, music mood, target length). The edit brief must be
  precise enough that a hired editor never has to call him.
- **P-02 Publishing Scheduler** — calendar and slot times from *his* data, not generic advice.
  States: Idea → Researched → Scripted → Shot → Editing → Scheduled → Published. Anything stuck
  2+ days becomes a blocker in the Manager's brief.
- Humans: him on camera, an editor on the cut.

## Performance Desk — daily pull, weekly teardown
- **A-01 Performance Analyst** — his own metrics via Instagram Graph API. Answers which posts
  earned **follows**, which earned **saves**, which earned **profile visits**, which earned
  comments — usually four different reels. Broken down by pillar, hook type, length, posting time.
  Stops at *which*.
- **A-03 Pattern Analyst** — works out *why*. Takes a winner's transcript, breaks it into beats
  with timings, names the mechanism, strips the topic out, files it as a numbered reusable
  **Format**.
  - **Promotion rule (survivorship-bias guard): a pattern becomes a Format only if it appears in
    3+ winners AND is meaningfully rarer in the losers.** Everything else stays a labelled hunch.
  - **Format fatigue:** each Format carries a use count and performance-per-use trend; flag for
    retirement or mutation around the 10th use.
  - **Two-stage cost control for competitor teardowns:** nightly cheap scrape of all 40 accounts
    (numbers only, no video); only outliers get video pulled, transcribed and torn down. ~5–15
    reels/week instead of ~600. Roughly ₹300/month instead of ₹15,000.
  - **Proven vs Candidate:** formats from his own winners are Proven. Formats lifted from other
    creators are Candidates until they have worked on his page twice.
- **A-02 Playbook Keeper** — rewrites one file weekly with what won, what died, what changed. The
  Hook Writer and Scriptwriter load it as context before writing. **This is the compounding agent.**

## What transfers from other creators
| Layer | Transfers? |
|---|---|
| Format / structure | Copy freely — mechanical, audience-independent |
| Hook shape | Copy the construction, swap the trigger word for one his audience knows |
| Topic | Test, never assume — their audience is not his |
| Voice / persona | **Never.** Nobody follows the second version of someone else |

## Build phases
1. **The intake** — Watchlist, Sources, Brand Brain, Settings, Voice Training. Stores transcript
   AND metrics per past reel. Ends with a working voice profile.
2. **The writers** — Creative Desk.
3. **The desks that feed them** — Intelligence Desk + Manager + 06:00 brief.
4. **The loop** — Graph API, A-01, A-03, A-02.
5. **The board** — Production Desk, Kanban, calendar.
