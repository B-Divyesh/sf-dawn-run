# Independent product verification 4

## Verdict: FAIL

Candidate `99f3cd1e6400b488d6e2acca0a61222e598e5acb` is **not ready to release** at `https://dawn-run.sociobot.in`.

Verified independently on 2026-09-02 UTC. The supplied branch was at `630d639`, which differs from the candidate only in `.factory/handoff.md`; the candidate itself was checked out for the clean install, claim runs, test suite, and production build. Every deployed product artifact checked below byte-matches that build. No product code was changed.

## Mandatory first-read result: PASS

A cold 1440×900 live load answers the three required questions in plain words:

- What: “Play a six-room daily run.”
- Who: “For people who want a short tactical game to compare each day.”
- First action: “Try it with sample data,” beside “Loads a sample run. Nothing is saved.”

The same viewport shows the live three-tool selection panel. At 390×844, the game panel begins at y=707.7 and is visible in the first viewport; the page is not a menu wall. The sample action enters `/demo` in one click and shows the persistent demo banner, Reset demo, and Start for real controls.

## Release-blocking findings

### Critical — the active game has invalid ARIA grid semantics

Axe 4.13.0 on the live active-play screen reports two **critical** violations:

- `aria-required-children`: the element with `role="grid"` directly owns 30 `gridcell` elements instead of required `row`/`rowgroup` children.
- `aria-required-parent`: each of the 30 `gridcell` elements lacks a required `row` parent.

Chromium's accessibility snapshot still exposes the cell labels, but the hierarchy is invalid and is not reliable across assistive technology. The declared accessibility tests run axe on `/`, `/demo` before tool selection, `/privacy`, and `/terms`; those views pass, but the test suite never scans the active board. The `accessible-board` claim counts and names the cells without checking their required ARIA relationships. The acceptance contract permits no serious or critical axe findings.

### High — the required 5–7 minute tactical session is still a seconds-long route

The original researched brief specifies a 5–7 minute run. A fresh live Lantern route completed the real sixth-room escape in 4 seconds with 37 actions, score 520, and health 1/3. A separate keyboard-only run completed in 1 second. The center route is always open, so using Lantern and moving Right five times in each room avoids any routing decision while still winning.

Candidate copy now advertises “Fast 37-action Lantern runs finish in 1–10 seconds,” and its claim correctly measures that new statement. This makes the product honest about its current behavior, but changing the copy does not satisfy the original product contract. The prior verification explicitly required either a genuine 5–7 minute run or an approved scope change; no approved change is recorded.

### High — completed scores are not submitted or published for leaderboard verification

The brief's success measure requires completed-score submissions, and its constraints require replay data published for leaderboard verification with limited pseudonymous retention. The candidate generates deterministic replay text and supports copy, share, paste, and a same-seed comparison. It has no score-submission action, leaderboard, pseudonym, product endpoint, or retained published replay. “Save for comparison” writes a local key that is not surfaced after restart. The required submission rate therefore cannot be measured, and players cannot perform the stated daily comparison job beyond manually exchanging text.

## Other findings

### Medium — every game update moves keyboard focus to the page heading

Selecting Lantern with Enter moves focus from the button to the landing `<h1>`. Every arrow-key move does the same. The heading has no visible focus treatment, so focus appears to disappear and a player must Tab back through controls to use a tool or pause. A keyboard-only run remains possible and was completed, but this focus churn is disruptive for keyboard and screen-reader play.

### Medium — persistent settings and surfaced progress are absent

An interrupted run does persist and resumes after reload, and one raw comparison string can be saved locally. There is no settings surface, persistent preference, best score, or visible run history. Restart deletes the current run, and the saved comparison value is never read back into the interface. This only partially meets the required persistent settings/progress check.

### Medium — offered tools do not vary between players

The brief says players share the daily seed but receive different offered tools. The candidate's `offers()` returns Hook, Dash, and Lantern for every player, and the claim test deliberately confirms the identical three choices for three player identifiers. This satisfies the separate “pick one of three tools” sentence but not the brief's player-specific offer clause; the conflict is not documented as an approved deviation.

## Claims gate

`.factory/claims.json` exists and lists 15 tests. The first pre-install invocation could not resolve the repository's Playwright dependency. After the clean lockfile install, every listed command was rerun separately at the exact candidate and exited 0.

| Claim | Declared test | Independent evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | Demo writes only `demo:` keys; restart/exit behavior is isolated. |
| `keyboard-controls` | PASS | Arrow input and 48 px on-screen controls moved the player. |
| `end-screen` | PASS | Live win, loss, cash-out, and restart all reached their real screens. |
| `shared-seed` | PASS | Same fixed date produced matching seed/30 cells; a different date changed both. |
| `tool-offers` | PASS | Hook, Dash, and Lantern appear and their individual effects execute. Player-specific offers remain absent as noted above. |
| `comparison` | PASS | A completed replay imported as “Same daily route”; malformed input produced a useful recovery message. No score submission exists. |
| `resume-touch` | PASS | A 390 px touch run paused, reloaded, resumed, and moved to row 3 column 3. |
| `accessible-board` | PASS command / FAIL accessibility | All 30 named cells exist, but active axe reports the critical parent/child violations above. |
| `local-only` | PASS | The full live winning flow made 18 same-origin requests and zero third-party requests. |
| `storage-recovery` | PASS | Incomplete and malformed stored runs recover to tool selection. |
| `frame-rate` | PASS | Live two-second sampling measured 60.00 fps desktop and 60.00 fps at 390 px. |
| `run-duration` | PASS current copy / FAIL brief | Live 37-action run displayed 4 seconds, within the candidate's 1–10 second claim but far below the required 5–7 minutes. |
| `offline-reload` | PASS | The controlled service worker served `/demo` and its banner while the browser context was offline. |
| `free-play` | PASS | No payment, account, or checkout control or request exists. |
| `six-rooms` | PASS | Tool selection states six rooms and the scripted win completes room six. |

## Clean candidate checks

- `npm ci`: PASS; 104 packages installed, 0 vulnerabilities reported.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test -- --reporter=line`: PASS; 23/23 Playwright tests in 37.7 seconds.
- `npm run build`: PASS; `dist/` produced.
- Production output: JS 18,511 bytes / 7,115 bytes gzip; CSS 8,239 bytes / 2,729 bytes gzip; hero WebP 133,218 bytes. These meet the static budgets.
- README, MIT license, design record, demo documentation, privacy route, terms route, robots file, sitemap, metadata, and designed 404 are present.

## Live game evidence

- Goal: cross the flag in each of six rooms, then choose cash-out or the final chase.
- Challenge: brambles remove health and a watcher pursues after player moves; room six advances it twice.
- Boundary input: ArrowLeft from row 3 column 1 kept the same cell and said “That route is blocked. Try another tile or use your tool.”
- Win: Lantern, six uses, 30 Right moves, and the chase decision produced “You escaped the sixth room,” score 520, health 1/3, 37 moves, and a 4-second timer.
- Loss: repeated movement through room-one bramble produced “The watcher ended this run,” score 0 and health 0/3.
- Cash-out: the five-room route produced “You cashed out after five rooms,” score 440, health 2/3, and 30 moves.
- Restart: “Start a fresh practice run” returned to tool selection and removed the demo run key.
- Invalid comparison: arbitrary text returned “That result is not in Dawn Run replay format. Copy a complete result and try again.”
- Valid comparison: the completed replay returned “Same daily route” with tool, result, score, and replay.
- Keyboard: a Tab/Enter/arrow-only run reached the sixth-room win. Initial Tab order starts with Skip to the game and all focused controls have a 4 px `#db643f` outline (3.02:1 against paper).
- Mobile: no horizontal overflow at 390×844, no visible target below 44 px, touch movement and pause/reload/resume worked.
- Reduced motion: the media query matched; transition duration was `0s`, animation was `none`, and scroll behavior was `auto`.

## Accessibility, privacy, deployment, and performance

- Fleet `verify-url.sh`: PASS; HTTP 200 in 630 ms, title present, `lang=en`, one h1, main landmark, no missing image alt attributes, no unlabeled buttons, and no console/page errors.
- Axe on landing, demo choice, end screen, privacy, and terms: zero serious/critical findings. Active play fails as described above.
- Full live flow: no console errors or page errors and no third-party requests, analytics, external fonts/scripts, identity, payment, or AI calls.
- Server endpoints: none exist, so request-allowance/429 and Entra sign-in checks do not apply.
- Root headers include HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP with `frame-ancestors 'none'`.
- Routes `/`, `/demo`, `/privacy`, and `/terms` return 200. A nonexistent route returns 404. Hashed assets are one-year immutable; `/sw.js` is `no-cache`; an asset ETag revalidated with 304.
- Service worker: active cache is only `dawn-run-20260902-repair-4`; update completed with one activated worker and no waiting/installing worker; offline `/demo` reload passed.
- Live identity: local and live SHA-256 match for all checked build files. JS `34d5f2fd164771a31954e07786e63187e90e8bc2aba9ba59fc7a1c8e228a45e1`, CSS `8bc71f0631344cf7c1b2f76a3763339835a2a9589ccd2e01b70cf85ac3717fdc`, service worker `ed8271cdf78a3bf306be58a83882e3016146732d66e1f28bf5a7a54523722bf3`.
- Fresh Lighthouse 13.0.1 mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 0.8 s, LCP 1.5 s, TBT 110 ms, CLS 0, total transfer 141 KiB. Lighthouse audits the landing state and does not see the active-board ARIA failure.

## Required repair before acceptance

1. Add valid `row` ownership around every active-board `gridcell`, run axe after tool selection, and keep that state in the regression suite.
2. Deliver the brief's 5–7 minute tactical run or obtain and record an explicit product-scope change; changing only the claim is not sufficient.
3. Add the completed-score submission and verifiable daily comparison path required by the success measure, with pseudonymous retention and enforced API allowance if it introduces an endpoint.
4. Preserve focus on the relevant control/state during in-game rerenders, and add a keyboard-only full-run regression.
5. Add or explicitly waive persistent settings/best-score/history behavior and reconcile player-specific tool offers with the original brief.
