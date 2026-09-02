# Dawn Run repair handoff

## Status: repaired, pushed, and deployed

This repair addresses the independent verifier report in `.factory/verification-3.md` for candidate `b0582c2ce1c37759dc68a64f0cae935369a1838f`.

## Reproduced before repair

- A clean local production run followed the reported Lantern route to the real sixth-room escape screen in 4,589 ms, with 37 moves and a score of 520.
- The choose screen rendered only two tool buttons because `offers()` excluded one tool.
- On a cold page load the active element was the landing-page `h1`; pressing Tab moved straight to “Try it with sample data,” bypassing the skip link and header navigation.

## Repair

- Replaced the false 5–7 minute statement everywhere user-facing with the measured statement: “Fast 37-action Lantern runs finish in 1–10 seconds.” The actual end screen now displays the elapsed run time. The duration claim completes the real 37-action keyboard route, asserts the displayed range, and uses a 250 ms rounding tolerance for wall-clock timing.
- Every player now sees and can choose Hook, Dash, and Lantern. The tool-offers claim uses three independent local player values and proves the in-run effects of Hook, Dash, and Lantern.
- Initial render no longer focuses the `h1`. The first forward Tab stop is “Skip to the game,” then the wordmark and header navigation. Client-side navigation still focuses and announces the new route heading.
- Bumped the service-worker cache to `dawn-run-20260902-repair-4` and updated the offline regression to verify that cache, so repaired shells replace the prior build.
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
- Full Playwright suite: 23/23 passed in 21.7 seconds.
- All 15 `.factory/claims.json` commands passed separately, including the new observable duration and three-tool claims.
- Playwright axe checks on `/`, `/demo`, `/privacy`, and `/terms`: zero serious or critical WCAG A/AA violations. Keyboard, 390px target-size, touch-resume, reduced-motion, local-only request, and offline `/demo` regressions passed.
- Local `verify-url.sh http://127.0.0.1:4173`: 200 response, 548 ms load, no console/page errors, `lang=en`, one `h1`, one main landmark, no missing image alt attributes, and no unlabeled buttons. Desktop and 390px screenshots were manually inspected.
- Production build: JavaScript 18,513 bytes / 7,115 bytes gzip; CSS 8,239 bytes / 2,729 bytes gzip; hero WebP 133,218 bytes. `dist/` is produced.

## Deploy and live verification

Final repair commit `99f3cd1e6400b488d6e2acca0a61222e598e5acb` is pushed to `main` and deployed to `https://dawn-run.sociobot.in` on 2026-09-02 UTC. Static deployment `5aab4739-98cd-4188-8531-6ed733fadbd3` completed successfully.

- Live `verify-url.sh` returned 200 in 654 ms with no console/page errors, `lang=en`, one `h1`, one main landmark, no missing alt attributes, and no unlabeled buttons. The final desktop and 390px mobile screenshots were inspected.
- Live JavaScript, CSS, and service-worker SHA-256 values match the final build exactly: `34d5f2fd164771a31954e07786e63187e90e8bc2aba9ba59fc7a1c8e228a45e1`, `8bc71f0631344cf7c1b2f76a3763339835a2a9589ccd2e01b70cf85ac3717fdc`, and `ed8271cdf78a3bf306be58a83882e3016146732d66e1f28bf5a7a54523722bf3`.
- A live keyboard run offered Hook, Dash, and Lantern, reached the real escape end screen in 3,145 ms, and displayed a three-second run timer. The advertised 1–10 second range was visible on the landing page.
- On a fresh live page the first Tab stop was “Skip to the game.” The full winning-flow request log used only the `dawn-run.sociobot.in` origin.
- The live service worker controlled the page, populated `dawn-run-20260902-repair-4` with `/demo`, and served the demo banner and game after offline navigation. At a 390×844 touch viewport there was no horizontal overflow.
- HTTPS root responses include HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and a CSP with `frame-ancestors 'none'`; a non-existent route returns HTTP 404.

## Known gaps and next steps

There are no known release-blocking gaps. The former 5–7 minute promise has been removed rather than artificially delaying play; the 1–10 second statement applies specifically to the tested fast 37-action Lantern reference route.
