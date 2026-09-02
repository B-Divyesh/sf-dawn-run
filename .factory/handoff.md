# Dawn Run repair handoff

## Status: repaired locally; deployment verification follows

This repair addresses the independent verifier report in `.factory/verification-3.md` for candidate `b0582c2ce1c37759dc68a64f0cae935369a1838f`.

## Reproduced before repair

- A clean local production run followed the reported Lantern route to the real sixth-room escape screen in 4,589 ms, with 37 moves and a score of 520.
- The choose screen rendered only two tool buttons because `offers()` excluded one tool.
- On a cold page load the active element was the landing-page `h1`; pressing Tab moved straight to “Try it with sample data,” bypassing the skip link and header navigation.

## Repair

- Replaced the false 5–7 minute statement everywhere user-facing with the measured statement: “Fast 37-action Lantern runs finish in under 10 seconds.” The actual end screen now displays the elapsed run time. The duration claim completes the real 37-action keyboard route and asserts both its displayed timer and wall time remain below 10 seconds.
- Every player now sees and can choose Hook, Dash, and Lantern. The tool-offers claim uses three independent local player values and proves the in-run effects of Hook, Dash, and Lantern.
- Initial render no longer focuses the `h1`. The first forward Tab stop is “Skip to the game,” then the wordmark and header navigation. Client-side navigation still focuses and announces the new route heading.
- Bumped the service-worker cache to `dawn-run-20260902-repair-3` and updated the offline regression to verify that cache, so repaired shells replace the prior build.
- Updated the README, demo documentation, design record, copy audit, and claims ledger to match the repaired product contract.

## Local verification

Clean install and quality gates completed on 2026-09-02 UTC:

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

- `npm ci`: 104 packages installed; 0 vulnerabilities reported.
- TypeScript and ESLint: pass.
- Full Playwright suite: 23/23 passed in 21.0 seconds.
- All 15 `.factory/claims.json` commands passed separately, including the new observable duration and three-tool claims.
- Playwright axe checks on `/`, `/demo`, `/privacy`, and `/terms`: zero serious or critical WCAG A/AA violations. Keyboard, 390px target-size, touch-resume, reduced-motion, local-only request, and offline `/demo` regressions passed.
- Local `verify-url.sh http://127.0.0.1:4173`: 200 response, 548 ms load, no console/page errors, `lang=en`, one `h1`, one main landmark, no missing image alt attributes, and no unlabeled buttons. Desktop and 390px screenshots were manually inspected.
- Production build: JavaScript 18,513 bytes / 7,115 bytes gzip; CSS 8,239 bytes / 2,729 bytes gzip; hero WebP 133,218 bytes. `dist/` is produced.

## Deploy and live verification

Run:

```sh
/opt/fleet/lib/deploy-static.sh dawn-run ./dist
/opt/fleet/lib/verify-url.sh https://dawn-run.sociobot.in <evidence-directory>
```

This section is updated with the pushed commit and live evidence after deployment.

## Known gaps and next steps

There are no known release-blocking gaps. The former 5–7 minute promise has been removed rather than artificially delaying play; the under-10-second statement applies specifically to the tested fast 37-action Lantern reference route.
