# Dawn Run adversarial first-read review 2

**Verdict: PASS.** No findings remain. This review was performed on 2026-09-02 UTC against the live deployment at `https://dawn-run.sociobot.in` and repository commit `7e663667fc38a0a1e61a3c9494d665eee1e6126d`. No product source was changed.

## Cold first read

Fresh, storage-free browser contexts at 390×844 and 1440×900 gave the same answer before scrolling:

| Question | Answer visible on the first screen |
| --- | --- |
| What does this do? | “Play a six-room daily run.” |
| For whom? | “For people who want a 5–7 minute tactical game to compare each day.” |
| What should I click first? | “Try it with sample data.” The adjacent note says “Opens a sample game already in progress. Sample play stays separate from your runs.” |

The mobile page had no horizontal overflow (`390px` scroll width). The action, explanation, and four facts are visible before scrolling. This passes the cold-read requirement.

## Copy audit

Counts treat hyphenated and numeric forms as one word. Buttons and headings are included because they are visitor-facing copy. No entry exceeds 22 words, uses disallowed marketing language, uses an unexplained term, or needs a rewrite. “Beacon,” “watcher,” “tool,” “map code,” and “move record” are consistently used game terms and are explained by their nearby instructions or controls.

### Landing

| Location | Exact copy | Words | Result |
| --- | --- | ---: | --- |
| Skip link | Skip to the game | 4 | Pass |
| Navigation | Demo | 1 | Pass |
| Navigation | How it works | 3 | Pass |
| Navigation | Privacy | 1 | Pass |
| H1 | Play a six-room daily run | 5 | Pass |
| Hero | For people who want a 5–7 minute tactical game to compare each day. | 13 | Pass |
| Primary action | Try it with sample data | 5 | Result-naming action |
| Action note | Opens a sample game already in progress. | 7 | Pass |
| Action note | Sample play stays separate from your runs. | 7 | Pass |
| Fact | Free to play | 3 | Pass |
| Fact | 18 beacons on one shared map | 6 | Pass |
| Fact | Works offline after the first visit | 6 | Pass |
| Fact | Scores publish only when you choose | 6 | Pass |
| Game panel | Today’s map code | 3 | Pass |
| Game panel | 6 rooms · 18 beacons | 4 | Pass |
| Game panel | Choose one tool | 3 | Pass |
| Game panel | Your three-tool offer is set by this browser. | 8 | Pass |
| Game panel | Another player can receive a different set on the same map. | 11 | Pass |
| Tool | Clear one rock beside you. | 5 | Pass |
| Tool | Move east two tiles once per room. | 7 | Pass |
| Tool | Restore up to two health once per room. | 8 | Pass |
| Tool | Delay the watcher for six turns. | 6 | Pass |
| Tool | Block the next watcher hit. | 5 | Pass |
| Game panel | The map stays shared. | 4 | Pass |
| Progress panel | Settings and run history | 4 | Pass |
| Section H2 | How the daily run works | 5 | Pass |
| Step | Pick one offered tool. | 4 | Pass |
| Step | Each browser gets three from five tools. | 7 | Pass |
| Step | Light 18 beacons. | 3 | Pass |
| Step | Avoid rocks and brambles while the watcher follows you. | 9 | Pass |
| Step | Publish a verified result. | 4 | Result-naming action |
| Step | Submit a nickname and a record of your moves after the run. | 12 | Pass |
| Section H2 | What Dawn Run sends | 4 | Pass |
| Privacy copy | Your current run, settings, and eight recent results stay in this browser. | 11 | Pass |
| Privacy copy | Dawn Run sends a score only after you choose Publish verified score. | 11 | Pass |
| Footer | A six-room tactical route for one player. | 7 | Pass |
| Footer | The background illustration is original generated art. | 7 | Pass; provenance is recorded in `design.md` |

### README

| Location | Exact sentence or label | Words | Result |
| --- | --- | ---: | --- |
| Title | Dawn Run | 2 | Pass |
| Intro | Dawn Run is a free daily tactical browser game for one player. | 12 | Pass |
| Intro | A full six-room route is designed for 5–7 minutes on keyboard or touch. | 13 | Pass |
| Intro | Each room requires three beacons before its exit opens. | 9 | Pass |
| Intro | The 18-beacon route takes 120–168 tactical inputs at the measured 2.5-second planning cadence. | 13 | Pass |
| Intro | Players share the dated map but receive a player-specific offer of three tools from a pool of five. | 18 | Pass |
| H2 | Run it | 2 | Pass |
| Run instructions | Open the Vite URL. | 4 | Pass |
| Run instructions | The local server includes a score API for development. | 9 | Pass |
| Run instructions | Open `/demo` for an isolated run already in progress. | 9 | Pass |
| H2 | Test and build | 3 | Pass |
| Test description | The tests play deterministic win, loss, and cash-out routes through their real screens. | 13 | Pass |
| Test description | They cover every claim listed in `.factory/claims.json`. | 7 | Pass |
| Test description | The fixed simulation heartbeat targets 60 fps. | 7 | Pass |
| Test description | Its mobile browser check requires a median of at least 55 fps across five samples. | 15 | Pass |
| Build description | The production build writes the static client to `dist/`. | 9 | Pass |
| H2 | Scores and privacy | 3 | Pass |
| Privacy | The current run, settings, random player code, best score, and eight recent results stay in browser storage. | 17 | Pass |
| Privacy | Nothing is published until the player chooses Publish verified score. | 9 | Pass |
| Privacy | Publication sends a nickname, date, tool, score, reported time, and move record to Dawn Run. | 15 | Pass |
| Privacy | The API rebuilds the run, rejects altered scores, and removes published results after seven days. | 15 | Pass |
| Privacy | Scores and move records are checked; reported time does not change rank. | 12 | Pass |
| Privacy | Demo submissions are checked against sample standings but never stored. | 10 | Pass |
| Privacy | Production links `/api/scores` to the product-owned `sf-dawn-run-api` container. | 9 | Pass |
| Privacy | It stores scores in a SQLite snapshot at `/data/dawn-run-scores-v3.sqlite`. | 10 | Pass |
| Privacy | No account, third-party script, analytics service, or payment service is used. | 11 | Pass |
| Privacy | The game opens offline after the first visit. | 8 | Pass |
| H2 | Deploy | 1 | Pass |
| Deploy | This remains a static Vite browser-game deployment with a linked same-origin API. | 12 | Pass |
| Deploy | Link `sf-dawn-run-api` as the existing `sf-dawn-run` Static Web App backend after both deployments. | 13 | Pass |
| H2 | License | 1 | Pass |
| License | MIT. | 1 | Pass |
| License | See [LICENSE](LICENSE). | 2 | Pass |

Every landing and README statement that makes a visitor-reliance claim maps to a manifest entry: demo isolation, controls, outcomes, shared map, offers, comparison, resume, accessibility, publishing consent/integrity, tools, persistence, privacy, recovery, performance, duration, offline support, delivery policy, free play, room/beacon structure, and score retention. The README’s local development and deploy instructions are operational documentation, not visitor promises.

## Demo and sandbox

From a fresh landing page, clicking **Try it with sample data** opened `/demo`. The first resulting screen already showed Room 2 in progress, Hook selected, one beacon lit, a current score, five recent moves, a 63-cell board, and two realistic sample standings. The persistent banner read exactly: “Demo — sample data, nothing is saved,” with **Reset demo** and **Start for real**.

Before movement, storage was empty. A demo move used only a `demo:` key; no `dawn:` key was read or written. **Reset demo** returned to the same visible in-progress sample while leaving storage empty. **Start for real** removed demo keys and returned to `/` without creating a real-run key. Cold landing, demo, and real-return request logs contained only same-origin requests.

## Claims and local gates

After a clean `npm ci --no-audit --no-fund`, all 29 manifest commands passed, with no untested claim:

`demo-isolated`, `keyboard-controls`, `end-screen`, `shared-seed`, `tool-offers`, `comparison`, `resume-touch`, `accessible-board`, `score-publishing`, `publication-consent`, `hook-tool`, `dash-tool`, `lantern-tool`, `decoy-tool`, `cloak-tool`, `settings-history`, `focus-preserved`, `local-only`, `storage-recovery`, `frame-rate`, `run-duration`, `offline-reload`, `response-policy`, `free-play`, `six-rooms`, `replay-tamper`, `leaderboard-time-integrity`, `demo-submission`, and `score-retention`.

The last four use their listed `node --test --test-name-pattern` commands; the preceding entries use their listed `npm test -- --grep @claim:<id>` commands. The complete suite also passed: 10/10 Node/API tests and 38/38 Playwright tests (`test-results/.last-run.json` records `status: passed`). `npm run typecheck`, `npm run lint`, and `npm run build` passed. The built JS is 31,789 bytes raw / 11,520 bytes gzip. Its SHA-256 matches the live JS exactly: `06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226`.

## History audit

I read `review-1.md`, `polish-1.md`, and the earlier handoff, then confirmed every earlier review finding on both the live site and relevant tests/code.

| Earlier id | Verification in this round | Result |
| --- | --- | --- |
| F-1-1 | One click reaches the pre-seeded Room 2 board, move history, score, and sample standings. | Fixed |
| F-1-2 | Landing → demo has no real keys; demo actions use only `demo:` keys. | Fixed |
| F-1-3 | Request log shows no score request before explicit publishing, then exactly the expected same-origin POST. | Fixed |
| F-1-4 through F-1-8 | Hook, Dash, Lantern, Decoy, and Cloak each have a dedicated passing observable claim test. | Fixed |
| F-1-9 | The passing persistence claim completes nine runs and checks settings, best score, and newest eight rows after reload. | Fixed |
| F-1-10 | Reset removes every demo key and rebuilds the bundled in-memory sample. | Fixed |
| F-1-11 | Full Axe scans found zero violations on `/demo` and all other reviewed routes. | Fixed |
| F-1-12 | The live 404 has a header, footer, favicon, metadata, recovery links, and product styling. | Fixed |
| F-1-13 | Live label is “Today’s map code”; the unused offer code is absent. | Fixed |

## Structure, accessibility, and delivery

`/`, `/demo`, `/privacy`, and `/terms` returned 200 with route-specific titles, descriptions, canonicals, social image metadata, one h1, one main landmark, skip links, consistent header/footer, Privacy and Terms links, and no page errors. Client navigation, back navigation, and `/#how` changed focus to the new heading/section. All crawled internal links returned 200; an unknown route returned the designed 404 with HTTP 404. `robots.txt`, `sitemap.xml`, favicon, and Apple touch icon are live.

Full Axe scans found zero violations on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html`. At 390px, controls met the 44px baseline and there was no horizontal overflow. Reduced-motion behavior is covered by the browser suite. The cold live request log was same-origin only; no analytics, third-party scripts, font CDN, payment, or AI request appeared. The delivery response provided CSP including `frame-ancestors 'none'`, HSTS, `nosniff`, and strict referrer policy.

The dithered field-guide identity is visibly distinct from a generic SaaS template and follows the palette, type, printed-map art provenance, and motion policy recorded in `design.md`.

## Missed leverage

No additional AI step is implied by the job. The useful adjacent capabilities—sample play, offline use, touch and keyboard play, replay copy/comparison, and optional verified score publication—are already present. Adding AI would be decorative rather than helpful.

## What would make this perfect

Keep the claim manifest, full browser coverage, demo isolation, and route checks at this level as future gameplay changes are made. No concrete product change is required by this review.
