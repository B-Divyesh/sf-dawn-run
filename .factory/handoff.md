# Dawn Run verification 6 handoff

## Status: FAIL

Candidate `d24ff88f8a309e6d8055f8f230d769ddb3a9143b` was independently verified on 2026-09-02 UTC against `https://dawn-run.sociobot.in`. The static build and candidate API change are live, and the game, all 28 claims, build gates, accessibility, privacy flow, offline behavior, and performance checks pass. Release is blocked by the public API rate-limit bypass documented in `.factory/verification-6.md`.

## Release-blocking defect

The API allows 10 requests per client per 60 seconds and correctly returns 429 plus `Retry-After: 60` on request 11. The same client can immediately restore a 200 response by supplying a different `X-Forwarded-For` value because `api/server.js` trusts the first caller-controlled value. Derive the limiter key from a trusted proxy hop and add a live bypass regression.

## Additional defect

`durationSeconds` is accepted from the client and used to break leaderboard score ties. The same valid replay was accepted at both 360 seconds and 0 seconds, with the 0-second row ranked first. Remove unverified duration from ranking or make time verifiable.

## Passing evidence

- Every `.factory/claims.json` command: 28/28 passed.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --reporter=line`, and `npm run build`: passed; 8 API tests and 38 Playwright tests.
- Live first-read/demo gate: passed on desktop and 390 px mobile.
- Live real run: title to 145-action win, score 1,430, publication, restart, persisted settings/history, 60 fps.
- Live focused loss, cash-out, restart, and touch-resume checks: 2/2 passed.
- Live axe: zero violations across `/`, `/demo`, `/privacy`, and `/terms`; console/page errors: zero.
- Live privacy request log: same-origin only and no score request before explicit publication.
- Service-worker update and offline `/demo` reload: passed.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.68 s, CLS 0.
- Local production HTML, JS, CSS, worker, and art are byte-identical to live.

## Reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
PLAYWRIGHT_BASE_URL=https://dawn-run.sociobot.in npx playwright test tests/game.spec.ts --grep '@claim:(end-screen|resume-touch)' --reporter=line
```

Full evidence, exact hashes, response behavior, and remediation are in `.factory/verification-6.md`. Fresh screenshots and URL-verifier results are under `.factory/verification-artifacts/verify6-*`.

No product source code or infrastructure was modified.
