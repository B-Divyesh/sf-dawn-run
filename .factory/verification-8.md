# Dawn Run independent verification 8

## Result: PASS

- Candidate commit: `02174b02bd268fdf59575fa22f97b80e0c4d1458`
- Live URL: `https://dawn-run.sociobot.in`
- Date: 2026-09-02 UTC

This candidate passes the factory acceptance contract. No product code was changed during verification.

## First read and demo

**PASS.** A fresh live desktop visit read: “Play a six-room daily run,” “For people who want a 5–7 minute tactical game to compare each day,” and “Try it with sample data.” The adjacent explanation says that it opens a sample game already in progress and stays separate from real runs. This answers what it does, who it is for, and what to click first in plain words.

The same initial screen already contains the live game’s dated map, six-room/18-beacon scope, and the browser-specific three-tool selection; it is not a menu wall. One click opens `/demo` with the persistent “Demo — sample data, nothing is saved” banner, Reset demo, Start for real, Room 2 in progress, one lit beacon, and sample standings.

## Required claim tests

**PASS — 29/29 manifest commands.** After a clean `npm ci --no-audit --no-fund`, I executed every `test` command in `.factory/claims.json` in manifest order against its demo entry point. All completed successfully. The individual pass flow was independently corroborated by the complete local suite:

```text
npm test -- --reporter=line
10/10 Node/API tests passed
38/38 Playwright tests passed (1.6m)
```

This includes the repaired first-run-sensitive `@claim:settings-history` and `@claim:frame-rate` checks, as well as all game, demo, publication, offline, storage, accessibility, and delivery claims. There is a claims manifest, so no missing-manifest release blocker exists.

Other local gates passed:

- `npm run typecheck`
- `npm run lint`
- `npm run build` (generated `dist/`)

The built initial JavaScript is 31,789 B raw / 11,459 B gzip, below the 200 KB browser-game budget. CSS is 11,065 B raw / 3,380 B gzip and the original hero WebP is 133,218 B.

## Live deployment and game QA

**PASS.** The live JavaScript asset and the candidate build are byte-identical:

```text
dist/assets/index-0pJI82Vt.js
06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226
https://dawn-run.sociobot.in/assets/index-0pJI82Vt.js
06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226
```

A fresh live scripted keyboard run selected Lantern and used 145 deterministic actions across six rooms, including the final chase. It reached the real win screen, “You escaped the sixth room,” with no console or page errors. The local deterministic suite also explicitly covered loss, five-room cash-out, restart reset, all five tools, keyboard, touch controls, pause/resume, settings/history persistence, copied-result comparison, malformed-storage recovery, and focus preservation. The verified route action count is within the advertised 120–168 tactical-input / 5–7 minute planning budget. The claimed 60 Hz simulation test passed its five-window 55 fps median floor.

## Privacy, API, accessibility, and delivery

**PASS.** Cold and completed-run Playwright request logs were same-origin only. The only request during explicit real score publication was the expected same-origin `POST /api/scores`; it sent the documented result fields only. The live response was `201`, `Cache-Control: no-store`, and displayed “Your replay was verified and published for seven days.” This used pseudonym `Verify8QA`, which is subject to the product’s seven-day retention rule.

The rate-limit requirement was independently exercised against the live API: requests 1–10 to the same score-list client returned 200; request 11 returned `429` with `Retry-After: 60` and the clear recovery message. Observed allowance: **10 requests / 60 seconds**.

At 390×844 with touch and reduced motion, the page had no horizontal overflow and no visible target smaller than 44 px. Live Axe WCAG A/AA scans for `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` found zero serious/critical violations; all five pages had a single h1 and no console/page errors. Keyboard verification started at the Skip to game link and navigation to Demo moved focus to “Continue a sample run.”

Live responses provided CSP (`frame-ancestors 'none'`), HSTS, `nosniff`, and strict referrer policy. HTML used short revalidation, hashed assets were `public, max-age=31536000, immutable`, `sw.js` was `no-cache`, and API responses were `no-store`. `/not-on-map` returned the designed Dawn Run 404 with status 404. The full claim suite passed offline reload and service-worker cache-update checks.

## Defects by severity

None found.

## Acceptance

**PASS.** Candidate `02174b02bd268fdf59575fa22f97b80e0c4d1458` is live-identical, end-to-end playable, claim-tested, accessible, privacy-constrained, and within the stated bundle budget.
