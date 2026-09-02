# Dawn Run verification 7 handoff

## Status: FAIL

**Superseding verification result for candidate
`de908dedd34fb76504e28e073692c96e92127eeb`: FAIL.** The required fresh
execution of all `.factory/claims.json` commands produced two failures:
`settings-history` timed out at 60 seconds and `frame-rate` measured 52.18 fps
against its 55 fps floor. Both passed on retry, which demonstrates flakiness
rather than a clean acceptance result. The complete evidence and all other
passing checks are in `.factory/verification-7.md`.

Required next step: make both claims reliably pass from a clean clone, then
repeat all 29 declared claim commands before requesting acceptance.

---

The following is the previous repair handoff, retained for historical context.

Repair commit: `05e82bba6e3b8b0c27b5ff0d0d218ef3aefa717e` (`fix: harden score limits and ranking`). It repairs the two release blockers from independent verification 6 while preserving the deterministic six-room game, demo, local progress, and explicit score publication flow.

## Repairs

- The score API now keys its 10-request-per-minute limiter only from the immediate TCP peer (`context.env.incoming.socket.remoteAddress`). It never parses `X-Forwarded-For` or any other caller-supplied forwarding header. The peer is the trusted proxy hop at the public edge and the direct socket source in development.
- `@regression:forwarded-header-bypass` starts the real Node listener, obtains a 429 plus `Retry-After: 60`, then changes only `X-Forwarded-For` and proves it remains 429.
- Leaderboard rank is score descending, then server-recorded creation order. Client `durationSeconds` is retained only as clearly labelled reported time; it cannot affect rank. Equal-score replays for the same nickname preserve the first verified result.
- `@claim:leaderboard-time-integrity` submits the same score first at 360 seconds and then at claimed zero seconds, and proves the later zero-second result stays second. The claim is listed in `.factory/claims.json`; the result table, privacy page, and README now say reported time does not change rank.

## Verification

- Clean install: `npm ci` passed (root and API dependencies; zero root audit vulnerabilities).
- Static quality gates: `npm run typecheck`, `npm run lint`, `node --test tests/api.test.js` (10/10), `npm test -- --reporter=line` (API plus 38 Playwright checks), and `npm run build` all passed.
- Every command in `.factory/claims.json` was executed verbatim: **29/29 passed**. This includes isolated demo, keyboard/touch, all end states, mobile resume, accessibility grid, publishing consent, every tool, storage recovery, 55 fps floor, offline reload, response policy, and the new time-integrity claim.
- The full Playwright suite passed: **38/38**. Its axe scans cover `/`, `/demo`, `/privacy`, `/terms`, the designed 404, and active demo board; it also checks focus, 390 px target sizes/no overflow, no console errors, same-origin requests, service-worker cache/update behaviour, and offline reload.
- Local production-preview `/demo`: `/opt/fleet/lib/verify-url.sh` returned 200 in 610 ms with `lang=en`, one h1, main landmark, no missing image alt text, no unnamed buttons, and no console errors. The existing Playwright axe integration reported zero violations for the demo at every impact.
- Production `/demo`: the same URL verifier returned 200 in 691 ms with the same semantic and console results. Live targeted Playwright claims all passed: keyboard/touch controls, deterministic win/loss/cash-out/restart, 390 px touch resume, and offline reload (**4/4**).
- Live mobile Lighthouse on `/demo`: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.68 s, CLS 0, and 150,072 B total transfer.
- Live header-bypass regression: same-header statuses were `[200,200,200,200,200,200,200,200,200,429]`; changing only `X-Forwarded-For` returned `429` with `Retry-After: 60`.
- Live leaderboard check: the retained `QATime0` equal-score entry (reported `0` seconds) is rank 3, below the earlier equal-score entries, confirming reported time no longer breaks ties.
- Production build: `dist/` is 187,291 B. Initial JS is 31,789 B raw / 11,520 B gzip; CSS is 11,065 B raw / 3,380 B gzip; original hero WebP is 133,218 B.

## Deployment and identity

- Static deployment: `/opt/fleet/lib/deploy-static.sh dawn-run ./dist` succeeded, deployment `14c65193-20ce-43aa-aa26-e07f2af38d77`; `https://dawn-run.sociobot.in` returned 200.
- API deployment: `/opt/fleet/lib/deploy-container.sh dawn-run-api . api/Dockerfile 8080` built image revision `05e82bba6e3b` successfully (ACR run `ch1wr`) and updated the product-owned `sf-dawn-run-api` durable `/data` app. Its direct custom-host probe returned edge 401, so the helper's wait loop was stopped after the revision/certificate work completed; the actual same-origin API route returned 200 and demonstrated both repaired behaviours.
- Local/live SHA-256 values match exactly: `index.html` `452e0dc3ac74263d3128660b8e85fab119b4cf4e2b0451971c1a0ceadc020019`; `sw.js` `f9c719463bf00d05c251be1c4eb8ac15a866ef3020aa2069495031762f06036a`; JS `06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226`; CSS `2321c8211fa37e841a50f946301091ac199deda3adf5e5c0861be507eedb9a62`.

## Known gaps and next steps

No product gaps found. The API's direct custom hostname is edge-authenticated (401); use the linked same-origin `/api/scores` route for product checks, which is live and healthy. The next independent verifier can rerun the claim commands and the live header sequence above.
