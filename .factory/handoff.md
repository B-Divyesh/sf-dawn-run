# Dawn Run repair 6 handoff

## Status

**PASS.** Repair commit `29d4c5a5327413c83f9471ac449ae2c12044bf81` fixes the two release-blocking claim-test failures recorded in verifier report commit `5fd5c775cf92fc48fcb1282c73c62b24382d3d12` for candidate `de908dedd34fb76504e28e073692c96e92127eeb`. The product behavior and static deployment class are unchanged.

## Repairs

- `@claim:settings-history` now owns a fresh browser context with service workers blocked and proves the context starts with empty storage. It still changes both settings, completes nine distinct runs through the real keyboard event handler, reloads, and checks the calculated best score plus the newest eight rows. Keyboard events are sent in browser-side batches, removing hundreds of protocol round trips while preserving the tested app path.
- `@claim:frame-rate` now owns a fresh 390×844 browser context with service workers blocked. It warms up for 30 frames, measures five independent 60-frame windows, takes their median, and keeps the truthful 55 fps floor.
- `.factory/claims.json` describes both isolated sandboxes exactly. README states the 60 fps target and the tested five-sample 55 fps median floor.

Before edits, a clean checkout of the failing candidate reproduced the timing sensitivity: the nine-run test needed 26.7 seconds unloaded and 1.1 minutes under controlled single-core contention; the one-shot frame test let any scheduler stall determine the entire result. The independent verifier captured the release failures directly: 60,000 ms for settings-history and 52.178 fps for frame-rate. After repair, three consecutive repetitions of both tests passed (6/6), and settings-history completed in 8.5 seconds in the targeted local run.

## Clean verification

A new checkout of repair commit `29d4c5a` used a new npm cache and no existing `node_modules` or build output. `npm ci --no-audit --no-fund` passed. All 29 commands from `.factory/claims.json` then ran exactly once, in manifest order, with **29 passed, 0 failed, 0 retries**. The formerly failing commands completed on their first attempt: settings-history in 10 seconds and frame-rate in 12 seconds. Full output is at `/tmp/dawn-run-repair-claims.log` in the worker environment.

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test -- --reporter=line`: 10/10 Node/API tests and 38/38 Playwright tests passed in 44.3 seconds.
- `npm run build`: passed and produced `dist/` (187,291 bytes). Initial JS is 31,789 bytes raw / 11,520 bytes gzip; CSS is 11,065 bytes raw / 3,380 bytes gzip; the hero WebP is 133,218 bytes.
- Package/consumer verification is not applicable to this browser-game artifact.
- Local production `/demo` passed `verify-url.sh`: 200, `lang=en`, one h1, main landmark, no missing alt text, no unnamed buttons, and no console errors.

The browser suite covers desktop and 390 px touch layouts, keyboard-only play through the sixth-room result, all real end states, focus restoration, 44 px targets, semantic grid ownership, demo isolation, storage recovery, local-only requests, explicit publication consent, offline reload, cache replacement policy, and the designed 404. Axe scans cover `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, and the active game; every scan had zero violations. The live reduced-motion check found zero elements with non-zero animation or transition duration, and the 390 px page had `scrollWidth === clientWidth === 390`.

## Deployment and live evidence

- Static deployment command: `/opt/fleet/lib/deploy-static.sh dawn-run ./dist`.
- Azure Static Web Apps deployment ID: `5696706e-e628-4036-af91-d0b9b30c98f4`.
- `https://dawn-run.sociobot.in` returned 200 after deployment. The product-owned score API was not redeployed because no API or game-runtime source changed.
- Live `verify-url.sh` on `/demo`: 200 in 723 ms, correct title and landmarks, no missing names/alt text, and no console errors.
- Live desktop/390 px checks passed for `/`, `/demo`, `/privacy`, `/terms`, and a real 404. Demo state opened in room two with one beacon and two sample rows, wrote no real keys, reset to zero demo keys, and made no score request. Offline `/demo` reload passed. Live axe reported zero violations and no unexpected console errors. Evidence is under `.factory/repair-6-live/`.
- Live frame samples at 390×844 were `60.00, 60.01, 60.01, 59.99, 60.00` fps; median `60.00` fps against the 55 fps floor.
- Live Lighthouse mobile `/demo`: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.66 s, CLS 0, TBT 29 ms, total transfer 150,036 bytes.
- Root responses include HSTS, `nosniff`, strict referrer policy, and CSP with `frame-ancestors 'none'`. Hashed JS is one-year immutable. The same-origin score API returned 200 with `Cache-Control: no-store`; an unknown route returned 404.
- Local and live SHA-256 values match: `index.html` `452e0dc3ac74263d3128660b8e85fab119b4cf4e2b0451971c1a0ceadc020019`; JS `06299e27c9f49baccc4f6286fd83622474dda0c9473fcd96cce620a847b0d226`; CSS `2321c8211fa37e841a50f946301091ac199deda3adf5e5c0861be507eedb9a62`; `sw.js` `f9c719463bf00d05c251be1c4eb8ac15a866ef3020aa2069495031762f06036a`; artwork `365f3118d729183e24925f473098a5f0654d911659679f0fee936d0dec072522`.

## Known gaps and next steps

No known product or release-blocking gaps. The next independent verifier can run the 29 manifest commands once from a fresh clone; retries should not be needed.
