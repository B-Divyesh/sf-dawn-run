# Dawn Run polish 1 handoff

## Status

Polish round 1 resolves every finding in `.factory/review-1.md`. The production artifact remains a Vite + TypeScript browser game with its existing same-origin score service.

## What changed

- Demo entry now shows a realistic active room, lit progress, move history, current score, and sample standings without creating storage.
- Landing preview initialization no longer writes any `dawn:` key. Reset and Start for real delete the entire demo namespace.
- Added exact claims and tests for publication consent, all five tools, nine-run persistence, altered-score rejection, demo non-retention, and seven-day expiry.
- Corrected the banner ARIA role, added full-impact axe coverage, and completed the designed 404 shell and metadata.
- Rewrote first-screen notes, map-code labels, help steps, move-record language, privacy copy, and the ≤120-character catalog description.
- Added route-title, canonical, Open Graph, Twitter, history-focus, legal-link, 404, mobile-overflow, and touch-target checks.

## Verification

Run from the repository root:

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

Local results: typecheck and lint passed; 8 API tests and 38 Playwright tests passed; `dist/` was produced. The production build contains 31.53 KB JS, 11.07 KB CSS, and a 133.22 KB hero image before compression. Every one of the 28 claim commands passed independently in a clean clone. Local mobile Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO, with 1.8 s LCP, 0 CLS, and 0 ms total blocking time.

## Deployment and live checks

Deployed the static build to the existing `sf-dawn-run` Static Web App with fleet deployment `96346595-20fd-4cc3-bb9e-1dd3feaef574`. No infrastructure outside the work-order scope was read or changed.

- Live URL: `https://dawn-run.sociobot.in`
- `/`, `/demo`, `/privacy`, and `/terms`: HTTP 200 with route-specific titles, one h1, metadata, and legal links.
- `/not-a-real-route-polish-1`: HTTP 404 with the full Dawn Run header, footer, metadata, and recovery links.
- Cold demo: active room two, one lit beacon, two sample rows, no initial storage, zero `dawn:` keys after play, and zero keys after reset/return to real.
- Requests: zero `/api/scores` calls before an explicit publish action; no third-party requests in the claim flow.
- Accessibility: full axe 4.13 scan reported zero violations. The fleet verifier reported zero console errors on `/` and `/demo`.
- Offline: a fresh service-worker context loaded `/demo` after the network was disabled.
- Live finding regression: 10 focused Playwright checks passed, covering demo isolation, all five tool rules, nine-run persistence, metadata/history focus, 404, and full axe.

Evidence is under `.factory/live-polish-1/`, including `cold-check.json`, desktop/mobile screenshots, response HTML, and verifier reports.

## Known gaps

None.
