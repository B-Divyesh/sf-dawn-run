# Independent product verification 6

## Verdict: FAIL

Candidate `d24ff88f8a309e6d8055f8f230d769ddb3a9143b` is deployed at `https://dawn-run.sociobot.in` and passes the gameplay, build, claim, accessibility, privacy, offline, and performance checks. It is **not releasable** because the public score API's documented 10-request-per-minute client allowance can be bypassed with a caller-controlled `X-Forwarded-For` header.

Verified independently on 2026-09-02 UTC from the supplied clean checkout. No product source code was modified.

## Required first checks

### Claim gate

`.factory/claims.json` is present. Every one of its 28 `test` commands was run exactly as listed before the general suite. Result: **28/28 PASS**.

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | Fresh sample opened in progress, completed, reset, and returned to real play without a `dawn:` key. |
| `keyboard-controls` | PASS | Arrow-key and on-screen movement changed the named player coordinate. |
| `end-screen` | PASS | Deterministic input reached win, loss, cash-out, and restart states. |
| `shared-seed` | PASS | Same-date isolated clients matched; another date changed the map. |
| `tool-offers` | PASS | Five player codes received unique three-of-five offers covering all tools. |
| `comparison` | PASS | A completed move record round-tripped and reported the same route, tool, score, time, and actions. |
| `resume-touch` | PASS | A 390 px touch run paused, reloaded, resumed, and moved again. |
| `accessible-board` | PASS | The active board exposed 7 owned rows and 63 named grid cells. |
| `score-publishing` | PASS | A completed replay was accepted and returned in the leaderboard. |
| `publication-consent` | PASS | No score request occurred before the explicit publish action; one POST followed it. |
| `hook-tool` | PASS | Hook cleared one adjacent rock and became spent. |
| `dash-tool` | PASS | Dash moved two east, enforced one use, and rejected the boundary case. |
| `lantern-tool` | PASS | Lantern restored health to the five-heart cap and enforced one use. |
| `decoy-tool` | PASS | The watcher stayed still for six turns and moved on the next beacon. |
| `cloak-tool` | PASS | Cloak blocked the first watcher hit but not the second. |
| `settings-history` | PASS | Both settings, the best score, and the newest eight of nine runs survived reload. |
| `focus-preserved` | PASS | Board focus survived updates and moved to the real result heading. |
| `local-only` | PASS | Complete play and explicit publication used only the product origin. |
| `storage-recovery` | PASS | Incomplete and malformed saved JSON recovered to usable sample state. |
| `frame-rate` | PASS | The 60-frame sample met the 55 fps floor. |
| `run-duration` | PASS | The generated route used 145 inputs, within the declared 120–168 input model. |
| `offline-reload` | PASS | A dedicated context loaded `/demo` offline after one controlled visit. |
| `response-policy` | PASS | API bypass, no-store, cache cleanup, CSP, immutable assets, and real 404 policy passed. |
| `free-play` | PASS | The first screen had no account, checkout, or payment control. |
| `six-rooms` | PASS | Six generated rooms each had three required beacons. |
| `replay-tamper` | PASS | A changed score returned 422 and was not stored. |
| `demo-submission` | PASS | A demo replay was checked, returned `published: false`, and was not stored. |
| `score-retention` | PASS | An expired SQLite row was removed on the next list. |

### Cold first-read gate

**PASS.** At 1440×900 and 390×844, the first screen says “Play a six-room daily run,” identifies “people who want a 5–7 minute tactical game to compare each day,” and gives one primary action, “Try it with sample data.” Its note says the sample opens already in progress and stays separate. The game itself is visible through the live three-tool choice rather than a menu wall. One click opens `/demo` with “Demo — sample data, nothing is saved,” Reset demo, Start for real, an active second room, one lit beacon, and two sample standings.

Evidence: `verification-artifacts/verify6-first-read-desktop.png`, `verify6-first-read-mobile.png`, and `verify6-mobile-demo.png`.

## Clean candidate checks

- `npm ci`: PASS; 104 root and 40 API packages installed, with zero root audit vulnerabilities.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test -- --reporter=line`: PASS; 8 Node API/storage tests and 38 Playwright tests.
- `npm run build`: PASS; `dist/` produced.
- Production sizes: JavaScript 31,590 B raw / 11,424 B gzip; CSS 11,065 B raw / 3,392 B gzip; hero WebP 133,218 B; complete `dist/` 187,092 B.
- README, MIT license, design record, demo documentation, privacy route, terms route, robots, sitemap, metadata, and designed 404 are present.

## Deployment identity

The production static files are byte-identical to the candidate build. The live demo API also returns the candidate commit's changed text, `Sample replay verified. Demo data was not published.`, proving the backend change is live.

| File | Local and live SHA-256 |
| --- | --- |
| `index.html` | `150538afbfc1223d18fa4eae6ebf282aff72e0b78d8501b4d9de542a8b5388f8` |
| `index-B2cfioxo.js` | `06b310bbd281c7ac2d1df01a68ab5ee7abeedd072c8c282db4e8cfa990cf4263` |
| `index-CoyGrBaE.css` | `2321c8211fa37e841a50f946301091ac199deda3adf5e5c0861be507eedb9a62` |
| `sw.js` | `f9c719463bf00d05c251be1c4eb8ac15a866ef3020aa2069495031762f06036a` |
| `dawn-field.webp` | `365f3118d729183e24925f473098a5f0654d911659679f0fee936d0dec072522` |

## End-to-end game evidence

An independent real-mode run began on the live title screen, selected Hook by keyboard, paused and resumed, lit all 18 beacons, chose the final chase, and reached “You escaped the sixth room” after 145 actions. The end screen showed score 1,430, health 2/5, and focused its result heading. An invalid comparison was rejected with a recovery instruction; the copied move record then compared as the same route. An invalid nickname was rejected locally; `VerifySix` then published successfully and appeared in the live table. Restart returned to a clean tool choice. Coordinate and reduced-effects settings plus completed history survived reload.

The live end screen is in `verification-artifacts/verify6-live-end.png`. A focused live run of the `end-screen` and `resume-touch` tests also passed, independently covering the caught ending, room-five cash-out, restart, and saved mobile touch resume.

Goal and challenge were visible during play: light three beacons in each of six rooms, avoid rocks and brambles, manage the watcher, then reach the flag. Keyboard arrows, the four 48 px touch buttons, pause/resume, the five advertised tools, demo mode, real daily mode, and post-completion practice were exercised by the claim suite and live checks.

Frame sampling during active live play measured **60 fps**. The deterministic safe route was 145 inputs; the product's declared 2.5-second planning model maps that to 362.5 seconds.

## Accessibility, mobile, privacy, and delivery

- The supplied `verify-url.sh` passed: 200 response, 580 ms load, valid title and `lang=en`, one h1, main landmark, no missing alt attributes, no unnamed buttons, and no console errors.
- Live axe 4.13 scans on `/`, `/demo`, `/privacy`, and `/terms` reported zero violations at any impact, therefore zero serious/critical findings.
- Keyboard tab order starts at “Skip to the game.” Every sampled focus target showed a 4 px `#db643f` outline. Board focus survived keyboard moves and completion focused the result heading.
- At 390×844 there was no horizontal overflow. Every visible link, button, input, and summary was at least 44×44 CSS px. Touch moved the player and saved touch play resumed after reload.
- With `prefers-reduced-motion: reduce`, no element had a non-zero CSS animation or transition.
- The complete real run made no `/api/scores` request before publication. Its only score request was the explicit POST. Every browser request was same-origin; there were no analytics, third-party scripts, identity, payment, or AI requests. Sign-in/Entra checks are not applicable because the game has no sign-in.
- Static responses send CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, and strict referrer policy. HTML uses 30-second revalidation, hashed assets use one-year immutable caching, `sw.js` uses `no-cache`, and API responses use `no-store`.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 with route titles; an unknown route returns the designed 404. Every discovered link returned 200.
- Service-worker update completed with one active cache, `dawn-run-20260902-polish-1`; no stale Dawn Run cache remained. Its precache includes all app routes and hashed assets. `/demo` reloaded offline.
- Mobile Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; FCP 0.93 s, LCP 1.68 s, TBT 0 ms, CLS 0, total transfer 149,948 B.

## Backend evidence

- Candidate/live identity: the live demo POST returned the exact new candidate message and did not publish.
- Normal publication: a valid 145-action replay returned 201 and appeared in the live leaderboard.
- Invalid input: future date 400, malformed JSON 400, 52 KiB body 413, and foreign origin 403. Each API response was `no-store`.
- Concurrency: 20 concurrent local Hono requests from distinct clients all returned 200 and `no-store`.
- Persistence boundary: the clean suite's SQLite snapshot test wrote under a temporary `/data` analogue, closed the process repository, removed the active copy, restored from the snapshot, and recovered the score.
- Health: the candidate API app returned 200 with `{ "ok": true, "service": "sf-dawn-run-api" }`.

## Defects by severity

### High — release blocker: caller-controlled header bypasses request allowance

The public API normally allowed 10 requests in 60 seconds; request 11 returned 429 with `Retry-After: 60`. Without waiting, the same machine sent the same request with `X-Forwarded-For: 203.0.113.244` and received 200. `api/server.js` keys the limiter from the first `x-forwarded-for` value, and the live proxy preserves the supplied value. A caller can rotate that header and evade the required per-client allowance.

Required repair: derive the client identity only from a trusted proxy-provided address after stripping caller input, or configure the trusted proxy chain and select its verified hop. Add a live regression that reaches 429 and proves changing a caller-supplied forwarding header cannot restore 200 within the window.

### Medium — leaderboard time is trusted although it affects rank

The server reconstructs result and score from the move record but accepts any integer `durationSeconds` from 0 to 3600. In an isolated repository, the same valid 1,430-point replay was accepted once at 360 seconds and once at 0 seconds; the 0-second entry ranked first because duration breaks score ties. The public table labels the rows as verified and publishes time.

Required repair: remove client time from ranking, or include server-verifiable timing evidence in the replay design. Add a claim test showing that altered duration cannot improve rank.

### Critical

None.

### Low

None.

## Acceptance result

**FAIL.** The core game is complete and the candidate is live, but the explicit server-side request-allowance contract is not enforced against a caller-controlled forwarding header. Re-verify the API after that release blocker is fixed; the time-ranking integrity issue should be resolved in the same repair cycle.
