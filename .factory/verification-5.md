# Independent product verification 5

## Verdict: PASS

Candidate `6d8aabd57b308d5d98e13265bd17c73e591c6ac6` **passes** the researched Dawn Run product contract at `https://dawn-run.sociobot.in`.

Verified independently on 2026-09-02 UTC from the supplied clean candidate. No product source code was modified. The local production build is byte-identical to the deployed HTML, JavaScript, CSS, service worker, and game artwork.

## Required first checks

`.factory/claims.json` is present with 19 claims. Its tests were exercised before other QA, and all 19 pass. After the clean `npm ci`, the full `npm test -- --reporter=line` suite was also run; it includes the same claims plus accessibility coverage.

Cold live first read: **PASS**. At 1440×900, the first screen says “Play a six-room daily run,” says it is “For people who want a 5–7 minute tactical game to compare each day,” and presents “Try it with sample data” alongside “Loads a sample run. Nothing is saved.” The game’s three-tool selection is already on that screen, rather than a menu wall. The one-click action enters `/demo` and shows the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real.

## Claim gate

All declared claim commands passed. Evidence includes 19/19 Playwright claim tests in the clean suite, plus the six API/storage tests run by `npm test`.

| Claims | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolated`, `keyboard-controls`, `resume-touch`, `storage-recovery` | PASS | Demo uses `demo:` storage, exits cleanly, keyboard/touch move the player, and malformed/incomplete saves recover. |
| `end-screen`, `comparison`, `focus-preserved` | PASS | Deterministic input reaches win/loss/cash-out/restart; copied replay compares; keyboard focus is retained through play and completion. |
| `shared-seed`, `tool-offers`, `six-rooms` | PASS | Same date produces one shared map; player-specific three-of-five offers vary; six rooms contain 18 beacons. |
| `accessible-board`, `frame-rate`, `run-duration` | PASS | Active board has 7 rows and 63 cells; live sampling was 60.00 fps desktop and 59.01 fps at 390 px; generated safe route is 145 inputs (the tested 5–7 minute planning budget is 120–168 inputs at 2.5 seconds each). |
| `score-publishing`, `settings-history`, `local-only` | PASS | Verified replay publication and leaderboard work; settings/history persist locally; full real run and publish made only same-origin requests. |
| `offline-reload`, `response-policy`, `free-play` | PASS | Controlled `/demo` reload works offline; app/API cache policy is asserted; no account, payment, or checkout control exists. |

## Clean candidate checks

- `npm ci --no-audit --no-fund`: PASS (104 root packages and 40 API packages installed).
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test -- --reporter=line`: PASS (6 Node API/storage tests and 28 Playwright tests).
- `npm run build`: PASS; `dist/` produced.
- Production output: JavaScript 28,792 bytes / 10.57 KB gzip; CSS 10,352 bytes / 3.22 KB gzip; original game art 133,218 bytes. This is within the static JS/CSS/image budgets.

## End-to-end live game

An independently generated, input-only route began at the live title screen, chose Lantern, lit all required beacons, entered the final chase, and reached the real sixth-room end screen in 145 actions. It displayed score 1,430, health 2/5, and the completion focus moved to `#result-heading`.

The real publication flow submitted nickname `VerifyFive`; `POST /api/scores` returned 201 and the page stated “Your replay was verified and published for seven days.” Its leaderboard row appeared. The route request log contained only the same-origin HTML, static assets, and `/api/scores`; no third-party request, analytics, identity, payment, or AI request occurred.

The automated claim route also confirms the distinct loss, room-five cash-out, restart reset, replay comparison, pause/reload/resume, player-specific tool offers, settings/history persistence, keyboard controls, and on-screen touch controls.

## Live accessibility, privacy, delivery, and performance

- Supplied `verify-url.sh`: PASS — 200, 614 ms cold load, valid title and `lang=en`, one h1, main landmark, no missing image alt attributes, no unnamed buttons, and no console/page errors.
- Live active-game axe: **zero serious or critical** violations. It exposes 7 `row` elements owning 63 named `gridcell`s.
- At 390×844 touch viewport: no horizontal overflow (390 px scroll/client width), move control worked, and all covered controls meet the 44 px test baseline.
- Reduced motion: media query matched; transition was `0s` and animation `none`.
- Service worker: one active `dawn-run-20260902-repair-5` cache, no stale cache observed, and `/demo` loaded offline after a controlled visit.
- Response headers: root 200 with HSTS, `nosniff`, strict referrer policy, and CSP including `frame-ancestors 'none'`; hashed asset is one-year immutable; `sw.js` is `no-cache`; API response is `no-store`; unknown route is 404.
- Request allowance: a single client received 200 for requests 1–10; request 11 received **429** with `Retry-After: 60` and `Cache-Control: no-store`.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100. FCP 0.9 s, LCP 1.7 s, TBT 90 ms, CLS 0, total transfer 145 KiB.

## Deployment identity

| File | Local and live SHA-256 |
| --- | --- |
| `index.html` | `d2afacc53123132a09bc4cf409b3031393466e13bad6ef92dbf5039e1c405376` |
| `index-B9RER7AR.js` | `1317fc0573c6ecef638ef9ea30cd8e18327ceed11c430854c0f62b8bf157fff2` |
| `index-CZJ76ZDW.css` | `833057465438e21259e00b22819a9e85ae3c23eef7189f5b5afa231acd758204` |
| `sw.js` | `3a1f69dcbc1a15ccc50c3293ca913369922b30734b009e599f93cd11e89d91cc` |
| `dawn-field.webp` | `365f3118d729183e24925f473098a5f0654d911659679f0fee936d0dec072522` |

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low (non-blocking): axe reports one `aria-allowed-role` **minor** finding on `<aside class="demo-banner" role="status">`. This is not serious/critical and does not affect the release gate, but replacing the `aside` with a role-compatible status container would remove it.

## Evidence artifacts

Screenshots and URL-verifier output are in `.factory/verification-artifacts/` (intentionally untracked local QA evidence).
