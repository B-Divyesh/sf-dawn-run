# Dawn Run repair handoff

## Status: deployed

Repair commits: `1a46870` (`Repair seeded daily runs and sandbox recovery`) and `9c62630` (`Keep clipboard fallback CSP compliant`), pushed to `main` and deployed to `https://dawn-run.sociobot.in` on 2026-09-01 UTC.

## What changed

- The displayed UTC seed now deterministically generates each room's walls, tokens, bramble, and watcher. The middle trail remains open for a fair daily route. The regression test freezes two UTC dates and compares every named board cell.
- `/demo` is now mode-aware after in-app navigation. It never writes real keys, and Reset demo or Start for real removes every `demo:` key before navigating.
- Saved-state parsing validates the complete shape and safely recovers from malformed or incomplete data. Paused runs render a touch-sized **Resume run** control after reload.
- A completed run now has Copy result, Share result (with copy fallback), Save for comparison, and Paste/Compare result controls. Results are still local-only.
- The board is a 30-cell named `grid`: every row, column, player, exit, rock, token, bramble, and watcher state is available in the accessibility tree.
- All visible header, footer, demo, and game controls meet the 44 px target baseline. The How it works navigation now scrolls and moves focus to its section. The privacy copy no longer claims a nonexistent settings screen.
- The service worker precaches the built hashed shell assets, uses a deploy-versioned cache, and removes old Dawn Run caches. The static delivery configuration now ships in `dist/`, sends CSP including `frame-ancestors 'none'`, gives hashed assets immutable caching, keeps `sw.js` no-cache, and returns the designed 404 with status 404.
- Claims were expanded to 15 observable browser checks, including real title-to-win/loss/cash-out/restart, seed-controlled maps, demo exit cleanup, touch recovery, comparison, accessibility, offline reload, storage recovery, 55+ fps sampling, and the 5–7 minute session statement.

## Verification

From a clean dependency install, `npm test` passed 21 Playwright tests. `npm run build` passed TypeScript and produced `dist/` (JS: 7.08 KB gzip; CSS: 2.66 KB gzip; hero WebP: 132 KB).

The built and live JavaScript SHA-256 values matched:

`89cb5728c7bb57e0660c0fe7438e673743df06a569fd5e367c10fba14d798f49`

The built and live service-worker SHA-256 values matched:

`ccc40630272632de741b0f02658a9fb734585eed047bbd84091e245002315cf8`

Live checks at `https://dawn-run.sociobot.in` passed:

- Root 200 with CSP, `Referrer-Policy`, and `X-Content-Type-Options`; CSP includes `frame-ancestors 'none'`.
- Hashed JavaScript uses `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` uses `Cache-Control: no-cache`.
- `/not-a-real-route` returns 404.
- `verify-url.sh` recorded a 675 ms root load, no console/page errors, `lang=en`, one h1, one main landmark, no images missing alt, and no unlabeled buttons. Evidence is in `.factory/evidence-repair-1/` in the repair workspace.
- Live mobile smoke checks at 390×844 passed for `/`, `/demo`, `/privacy`, and `/terms`: one h1/main, no horizontal overflow, route-specific titles, and no console errors.
- Playwright's bundled axe integration passed WCAG A/AA checks on `/`, `/demo`, `/privacy`, and `/terms`. The standalone `npx @axe-core/cli` was attempted but its Selenium wrapper could not discover the preinstalled Playwright Chrome binary; no product issue was reported by the integrated axe suite.

## Run and deploy

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh dawn-run ./dist
```

## Known gaps

No product gaps are known. The standalone axe CLI needs a system-discoverable Chrome binary in this worker image; the repository's Playwright axe tests are the reproducible accessibility gate.
