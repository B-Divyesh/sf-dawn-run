# Dawn Run verification 8 handoff

## Status: PASS

Independent QA accepted candidate `02174b02bd268fdf59575fa22f97b80e0c4d1458` on 2026-09-02 UTC. The tested deployment is `https://dawn-run.sociobot.in`.

## What was verified

- Clean install: `npm ci --no-audit --no-fund` passed for the app and API package.
- Every one of the 29 commands declared in `.factory/claims.json` was run from the clean install. All passed. A separate complete `npm test -- --reporter=line` passed **10/10 Node/API tests and 38/38 Playwright tests** in 1.6 minutes.
- `npm run typecheck`, `npm run lint`, and the exact `npm run build` all passed. `dist/` was produced.
- The production build is small: initial JS is 31,789 B raw / 11,459 B gzip; CSS is 11,065 B raw / 3,380 B gzip; the original hero WebP is 133,218 B.
- The deployed `index-0pJI82Vt.js` SHA-256 exactly matches the candidate build: `06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226`.
- A cold live read plainly explains the game, audience, and first action. The first screen has the playable tool choice and “Try it with sample data”; the demo opens immediately in progress and is visibly isolated.
- A live deterministic keyboard run selected Lantern, executed 145 actions through all six rooms and the final chase, and reached “You escaped the sixth room.” No console or page errors occurred.
- Desktop and 390 px mobile were checked. Mobile had `scrollWidth === clientWidth === 390`, no undersized visible interactive targets, no errors, and the reduced-motion context loaded cleanly.
- Live axe WCAG A/AA scans on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` found zero serious or critical violations. Each had one h1, a route-specific title, and no load errors. Keyboard Tab begins at the skip link and Demo navigation focuses its h1.
- Request logs for cold load, play, and explicit publication contained only `https://dawn-run.sociobot.in`. A real win published successfully (`201`, `Cache-Control: no-store`) only after the explicit button; its POST contained only nickname, date, seed, tool, result, score, duration, actions, and demo flag.
- API allowance is enforced at **10 requests per 60 seconds**: 10 score-list GETs returned 200; request 11 returned 429 with `Retry-After: 60` and `Cache-Control: no-store`.
- Delivery checks passed: CSP includes `frame-ancestors 'none'`, HTML/API are not long-cached, hashed assets are immutable for one year, `sw.js` is `no-cache`, and an unknown route returned the designed 404 with HTTP 404. The full suite passed the offline-reload and service-worker cache-update claims.

## How to verify

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

Use `/demo` for the isolated sample run. Full evidence and the defect assessment are in `.factory/verification-8.md`.

## Known gaps

None found. Verification published the temporary pseudonymous `Verify8QA` result through the real, explicit score-publication flow; product retention removes it after seven days.
