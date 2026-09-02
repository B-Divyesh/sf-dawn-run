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

Pending final production deployment and cold verification.

## Known gaps

None.
