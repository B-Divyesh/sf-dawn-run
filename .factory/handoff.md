# Dawn Run repair 4 handoff

## Status

Repaired, tested, pushed candidate code, and deployed at `https://dawn-run.sociobot.in`.

This repair addresses every release blocker in `.factory/verification-4.md` for candidate `99f3cd1e6400b488d6e2acca0a61222e598e5acb`, recorded by report commit `82abe508691eb175a942dddcb351537c8537fe50`.

## Exact pre-fix reproduction

The unchanged candidate was built and exercised before source edits:

- Active play produced critical `aria-required-children` on the grid and critical `aria-required-parent` on all 30 gridcells.
- Choosing Lantern moved focus from the tool button to the page `h1`.
- The real input-only Lantern win reached “You escaped the sixth room.” in 1,913 ms with 37 actions and a displayed two-second duration.
- The end screen had local copy/compare controls but no published submission or leaderboard.

## Repairs

- Rebuilt the active board as a valid 9×7 ARIA grid: seven direct `row` children own 63 named `gridcell` elements. Active-state axe coverage now runs after tool selection.
- Replaced the straight 37-action lane with six seeded tactical rooms and 18 required beacons. Exits stay closed until all three room beacons are lit. The current deterministic safe route is 145 inputs; sampled dates require 139–147. The asserted 120–168 input budget measures 5–7 minutes at a 2.5-second planning cadence.
- Added upper/lower beacon routing, seeded rocks and brambles, beacon-triggered watchers, a room-five cash-out decision, and a harder sixth-room chase.
- Added five working tools. Each persistent local player code receives a deterministic three-tool offer, while the dated map remains shared.
- Preserved logical focus through rerenders. Selection moves focus to the board, movement keeps its current board/control focus, choices focus the next action, and completion focuses the result heading.
- Added persistent coordinate and reduced-effects settings, best score, and an eight-run local history. Demo and real storage remain separated.
- Added explicit completed-score publication. The client shows every transmitted field before submission and displays ranked replay data in a compact, expandable table.
- Added a Hono score API in product resource `sf-dawn-run-api`. It rebuilds every submitted action through the shared deterministic core, rejects altered scores/replays, applies a ten-request/minute allowance, rejects foreign origins, and returns `no-store`.
- Added pseudonymous seven-day retention in a SQLite snapshot at `/data/dawn-run-scores-v3.sqlite`. The single replica works from a local SQLite copy and synchronously replaces the durable SQLite snapshot after each mutation; a restart regression restores from that snapshot.
- Demo score checks return seeded sample standings and never call the repository write path. The service worker bypasses all `/api/` requests.
- Preserved the original Vite/static browser-game class. The product-owned container is linked as the Static Web App’s same-origin `/api` backend.

## Regression coverage

`npm test` runs six Node API/storage tests and 28 Playwright tests. The browser suite uses only game input for deterministic win, loss, cash-out, restart, keyboard-only completion, and score submission. It also covers:

- active-state axe and exact row/gridcell ownership;
- player-specific offers and all five offer slots;
- same-date/different-date route generation;
- copy/import comparison and server replay verification;
- real publication and returned leaderboard replay;
- tamper rejection, origin policy, request allowance, and seven-day policy;
- persistent settings, best score, history, pause/reload/touch resume, and malformed storage recovery;
- focus preservation, initial Tab order, 44px targets, reduced motion, and 390px layout;
- same-origin request privacy, offline reload/update, API cache bypass, 55+ fps, real 404, CSP, and immutable assets.

`.factory/claims.json` contains 19 claims. Every claim tag occurs exactly once, and every listed command passed independently from the clean installation.

## Clean local verification

Run:

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

Evidence on 2026-09-02 UTC:

- `npm ci`: 104 client/test packages and 40 API packages installed; 0 root vulnerabilities.
- TypeScript: pass.
- ESLint: pass.
- API/unit: 6/6 pass.
- Playwright: 28/28 pass in 30.6 seconds.
- Claims: 19/19 commands pass independently.
- Production build: `dist/` produced; JS 28,790 bytes / 10.57 KB gzip; CSS 10,349 bytes / 3.22 KB gzip; hero WebP 133,218 bytes.
- Local active axe: zero serious or critical violations.
- Current-date deterministic win: 145 inputs. Sampled safe routes: 139, 145, and 147 inputs.

## Deployment and live evidence

Resources used are only product-owned names:

- Static Web App: `sf-dawn-run`.
- Container App: `sf-dawn-run-api`, one replica, `/data` mount.
- Fleet durable share: `sf-dawn-run-api-data`.
- DNS: `dawn-run.sociobot.in` and the product API hostname `dawn-run-api.sociobot.in`.
- Linked backend: `sf-dawn-run` → `sf-dawn-run-api` for same-origin `/api` requests.

Deployment commands:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh dawn-run-api /work/repo api/Dockerfile 8080
az staticwebapp backends link -n sf-dawn-run -g sociobot --backend-resource-id /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/sociobot/providers/Microsoft.App/containerApps/sf-dawn-run-api
/opt/fleet/lib/deploy-static.sh dawn-run ./dist
```

Live evidence:

- Fleet URL verifier: HTTP 200 in 663 ms; no console/page errors; title and `lang=en`; one `h1`; one `main`; no missing alt text or unnamed buttons.
- Live input-only win: Hook, 145 turns, score 1,430, health 2/5, real sixth-room end screen.
- Live input-only loss: real “The watcher ended this run.” screen.
- Live publication: `Repair4` returned “Your replay was verified and published for seven days” and appeared with its full replay in the API response and table.
- Live tamper check: modified score returned HTTP 422. Foreign origin returned HTTP 403.
- Live active axe: zero serious or critical violations. Focus after keyboard tool selection was the grid.
- Live 390×844 touch check: seven rows, 63 cells, no horizontal overflow.
- Live offline/update check: only `dawn-run-20260902-repair-5` exists; no waiting/installing worker; `/demo` reloads offline; `/api/` is not cached.
- Response policy: root 200, missing route 404, CSP includes `frame-ancestors 'none'`, hashed assets are one-year immutable, worker is `no-cache`, API is `no-store`.
- Byte identity: local/live SHA-256 match — HTML `d2afacc53123132a09bc4cf409b3031393466e13bad6ef92dbf5039e1c405376`, JS `1317fc0573c6ecef638ef9ea30cd8e18327ceed11c430854c0f62b8bf157fff2`, CSS `833057465438e21259e00b22819a9e85ae3c23eef7189f5b5afa231acd758204`, worker `3a1f69dcbc1a15ccc50c3293ca913369922b30734b009e599f93cd11e89d91cc`.
- Lighthouse 13 mobile: performance 100, accessibility 100, best practices 100, SEO 100; FCP 0.9 s, LCP 1.7 s, TBT 0 ms, CLS 0, transfer 145 KiB.

Ignored local evidence is in `.factory/evidence-live/` (desktop/mobile captures, verifier JSON, and Lighthouse JSON).

## Known gaps

No release-blocking gaps are known. The leaderboard intentionally has no account identity: nicknames are pseudonymous, replay-verified, rate-limited, and removed after seven days.
