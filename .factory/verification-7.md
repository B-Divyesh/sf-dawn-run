# Dawn Run independent verification 7

## Result: FAIL

Verified candidate: `de908dedd34fb76504e28e073692c96e92127eeb`  
Live URL: `https://dawn-run.sociobot.in`  
Verification date: 2026-09-02 (UTC)

This is a release-blocking **FAIL**. The work order requires every command in
`.factory/claims.json` to pass from a clean clone; two of the 29 declared
commands failed on their first clean execution. Later retries passed, which
shows instability rather than clearing the failed clean verification.

## First-read and demo gate

**PASS.** A cold desktop and 390 px mobile visit answered the required first
read in plain words: Dawn Run is “a six-room daily run,” for people wanting a
“5–7 minute tactical game to compare each day,” and the first action is “Try
it with sample data.” The action says it opens a sample game already in
progress and keeps it separate.

The first screen contains the real first game decision, the browser-specific
three-tool choice and map code, rather than a marketing-only page. One click
entered `/demo`, showing “Demo — sample data, nothing is saved,” Reset demo,
Start for real, Room 2 in progress, one lit beacon, and sample standings.

Evidence: fresh Playwright cold reads at 1440x900 and 390x844; screenshots
were captured at `/tmp/dawn-verify7-first-desktop.png`,
`/tmp/dawn-verify7-first-mobile.png`, and `/tmp/dawn-verify7-demo-mobile.png`.

## Required claim commands

All 29 `test` commands from `.factory/claims.json` were executed verbatim
after `npm ci`; the complete transcript is
`/tmp/dawn-run-verify7-claims.log` in the verification environment.

| Result | Claims | Evidence |
| --- | --- | --- |
| PASS (27) | demo-isolated, keyboard-controls, end-screen, shared-seed, tool-offers, comparison, resume-touch, accessible-board, score-publishing, publication-consent, hook-tool, dash-tool, lantern-tool, decoy-tool, cloak-tool, focus-preserved, local-only, storage-recovery, run-duration, offline-reload, response-policy, free-play, six-rooms, replay-tamper, leaderboard-time-integrity, demo-submission, score-retention | Each exact command exited successfully. |
| FAIL | `settings-history` | `npm test -- --grep @claim:settings-history` timed out at 60,000 ms while sending the deterministic keyboard route for the nine-run persistence check (`tests/game.spec.ts:215`, `keyboard.press` at line 98). |
| FAIL | `frame-rate` | `npm test -- --grep @claim:frame-rate` measured **52.178450300026086 fps**, below the asserted 55 fps floor (`tests/game.spec.ts:286`). |

Both failing commands passed when repeated alone (`settings-history`: 1.0 m;
`frame-rate`: 7.2 s), and subsequent `npm test` passed 38/38 in 2.2 minutes.
That does not satisfy the clean-run gate: a claim test that intermittently
fails cannot prove its public claim. Independent live samples similarly varied
from 37.90 to 60.00 fps at 390 px.

## Local quality checks

- `npm ci --no-audit --no-fund`: PASS (root and API lockfiles installed).
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS on retry — 10 Node/API tests and 38 Playwright tests.
- `npm run build`: PASS; `dist/` produced.
- Production assets: JS 31,789 B raw / 11,463 B gzip; CSS 11,065 B raw /
  3,392 B gzip; hero WebP 133,218 B. Initial JavaScript is within the static
  200 KB budget.

## Live product, game loop, and deployment identity

- Local candidate build and production are byte-identical for `index.html`,
  JavaScript, CSS, `sw.js`, and `dawn-field.webp`. SHA-256 values respectively:
  `452e0dc3ac74263d3128660b8e85fab119b4cf4e2b0451971c1a0ceadc020019`,
  `06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226`,
  `2321c8211fa37e841a50f946301091ac199deda3adf5e5c0861be507eedb9a62`,
  `f9c719463bf00d05c251be1c4eb8ac15a866ef3020aa2069495031762f06036a`, and
  `365f3118d729183e24925f473098a5f0654d911659679f0fee936d0dec072522`.
- A live keyboard-only deterministic run started from the title/tool choice,
  selected Lantern, made 145 actions through six rooms, chose the final chase,
  and reached the real “You escaped the sixth room.” end screen. It displayed
  score 1,430 and health 2/5; focus moved to `#result-heading`. No console or
  page error occurred. Screenshot: `/tmp/dawn-verify7-live-end.png`.
- The claim suite also exercised loss, five-room cash-out, restart reset,
  each of the five tools, keyboard and touch movement, persisted settings and
  history, copied-result comparison, malformed-storage recovery, and explicit
  score publication/retention.
- Service worker verification found active `sw.js`, one cache named
  `dawn-run-20260902-polish-1`, and a successful offline `/demo` reload (200,
  Room 2 in progress).

## Privacy, accessibility, delivery, and API

- Fresh request logs for `/`, `/demo`, `/privacy`, and `/terms` contained only
  `https://dawn-run.sociobot.in` resources. No analytics, third-party script,
  identity, payment, or AI request was observed. The local `local-only` and
  `publication-consent` claims passed; publication is the only score POST.
- Live axe-core 4.13 WCAG A/AA scans for `/`, `/demo`, `/privacy`, and `/terms`
  returned zero violations, including zero serious/critical findings. Every
  page had one h1, one main landmark, a route-specific title, and no console
  or page errors.
- At 390 px, `/demo` had `scrollWidth === innerWidth === 390`; its persistent
  demo banner was visible. With reduced motion, zero elements had non-zero CSS
  animation or transition duration.
- Links discovered across the four routes all returned 200. `/not-a-route`
  returned the designed 404. Static responses provide CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, and strict referrer policy. HTML
  has 30-second revalidation, hashed assets are one-year immutable, `sw.js`
  is `no-cache`, and API responses are `no-store`.
- The public score API allowance is **10 requests per 60 seconds**: ten
  same-client GETs returned 200; request 11 returned 429 with `Retry-After: 60`.
  Changing caller-supplied `X-Forwarded-For` after the 429 remained 429. API
  health is 200 with service `sf-dawn-run-api`; API unit tests cover SQLite
  persistence/restart and retention.

## Defects by severity

### High — release blocker: required claim suite is flaky

The clean required-claims execution failed `settings-history` at its 60-second
deadline and `frame-rate` below its 55 fps threshold. The retries passing is
not adequate evidence of a reliable release; it instead establishes that the
checks are timing-sensitive. Make the nine-run deterministic test reliably
finish within its timeout and make the 55 fps measurement stable under the
defined test environment (or revise the product and its honest, measurable
claim together). Re-run all 29 exact claim commands from a clean clone before
acceptance.

### Medium / Low

None observed.

## Acceptance

**FAIL.** The deployed bytes match candidate `de908de` and the product is
otherwise complete and accessible, but the required clean claim run did not
pass. No product code was modified during this verification.
