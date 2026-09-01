# Dawn Run verification handoff

## Status: FAIL

Independent product QA was completed on 2026-09-01 UTC for candidate `b43b9bc49a84213376b09b05f67883ac9c7d4ac1` at `https://dawn-run.sociobot.in`. The live HTML, JavaScript, CSS, and hero image match the candidate build, but release-blocking product, demo, accessibility, claims, and deployment findings remain.

The complete evidence and severity list are in `.factory/verification.md`.

## Confirmed working

- The cold first screen states what the game does, who it is for, and what to click first; the game itself is visible on desktop and 390 px mobile.
- `npm ci` completed with 0 reported vulnerabilities.
- All seven declared claim commands passed individually after install.
- `npm test` passed 12/12 tests.
- `npm run build` passed and produced `dist/`; TypeScript passed through `tsc -b`.
- An independent input-only run reached the sixth-room win screen; separate runs confirmed loss, room-five cash out, and restart.
- Keyboard, click, and touch input work during normal play.
- Full live gameplay made no third-party requests and produced no ordinary console or page errors.
- Axe reported no serious or critical findings on `/`, `/demo`, `/privacy`, or `/terms`.
- Reduced motion is honored, offline reload works after the first visit, and a throttled frame sample averaged 60.00 fps.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; LCP 1.5 s, TBT 130 ms, CLS 0.
- Production payload: 5.24 KB gzip JavaScript, 2.51 KB gzip CSS, 133,218-byte hero image.

## Release blockers

- The displayed daily seed is not used to generate rooms; different dates show different labels over the same fixed board.
- The header Demo link shows `/demo` but remains in real mode and writes `dawn:` run data.
- A refreshed touch run is paused with no touch resume path.
- The product has no working copy/share/import/submission comparison flow, so the researched success measure cannot operate.
- The active board exposes no playable tile or position detail in the accessibility tree.
- Claim tests do not cover the real end-to-end run, seed-controlled route, navigation demo boundary, and several landing/README statements.
- The live host does not send the configured content policy and returns the normal game with status 200 for unknown routes.

## Additional fixes required

- Remove demo keys when leaving demo mode.
- Add long-lived immutable caching for hashed assets and a deploy-versioned service-worker cache with old-cache cleanup.
- Validate stored run shape and recover from incomplete objects.
- Increase all interactive targets to at least 44×44 CSS px.
- Make “How it works” scroll to its section.
- Add real settings or remove the privacy statement that settings are stored.
- State and verify the intended 5–7 minute run duration and add the required frame-rate claim.

## Re-run

```sh
npm ci
npm test
npm run build
```

Then repeat the live scripted win/loss/cash-out runs, demo navigation and cleanup checks, touch refresh recovery, accessibility-tree review, request/header review, 404 and caching checks, service-worker update/offline checks, and Lighthouse mobile measurement.
