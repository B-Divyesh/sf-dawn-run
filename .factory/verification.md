# Independent product verification

## Verdict: FAIL

Candidate `b43b9bc49a84213376b09b05f67883ac9c7d4ac1` is not ready for release at `https://dawn-run.sociobot.in`.

Verified on 2026-09-01 UTC from a clean checkout. The live HTML, JavaScript, CSS, and main image match the candidate build byte for byte. No product code was changed during verification.

## Release-blocking findings

### High — The daily seed does not generate the daily route

Confirmed with browser time fixed to two UTC dates. The displayed seed changed from `25XAJV` on 2026-09-01 to `2FWW8U` on 2026-09-02, but the complete 30-cell first-room board was identical. Code review confirms `roomFor()` returns six fixed layouts and never reads `seed`. The product therefore presents a changing seed beside an unchanged route. This does not meet the same-seed daily-run contract or support replay verification.

### High — The header Demo link enters real mode

Checked from a fresh browser at `/`. Clicking the header link labeled `Demo` changed the address to `/demo`, but no demo banner appeared. Choosing Hook and moving right created `dawn:run:2026-09-01`, not a `demo:` run. The mode is calculated only once at initial script load, while the link uses in-page history navigation. The primary “Try it with sample data” action performs a full navigation and works correctly, but the other visible demo entry does not preserve the sandbox boundary.

### High — A refreshed touch run cannot resume

Confirmed at a 390×844 touch viewport. After selecting Lantern, moving once, and reloading, the saved phase changed from `play` to `pause`. The screen still showed the old play message and controls. Tapping Move Right did nothing. Tapping the visible Pause button left the phase paused and changed the message to “Paused. Press Escape to resume.” There is no touch resume action, so a phone player cannot continue the saved run after refresh.

### High — The comparison and submission job is incomplete

Confirmed at the real end screen. The game shows a score and replay string, but provides no copy, share, import, replay-check, or score-submission action. The only end-screen action is “Start a fresh practice run.” The landing page says “Share your result. Copy the seed and replay data after the run,” yet there is no corresponding control or claim test. The researched success measure depends on completed-score submissions; this candidate cannot record that measure. The brief also calls for different offered tools, but every player receives Hook, Dash, and Lantern with only their order changed.

### High — The board state is not available to a screen reader

Checked the accessibility tree during active play. The complete board snapshot was only `region "Room 1 board": You Exit Watcher`; it omitted the player position, exit position, rocks, bramble, token, and all tile coordinates. The visual grid therefore cannot be used to make route decisions without sight. Axe found no serious or critical automated rules, but this manual screen-reader check fails the playable-task requirement.

### High — The claims suite does not prove several relied-on statements

All seven declared commands pass after dependency installation, but important coverage is missing or non-observable:

- `@claim:end-screen` writes a completed object directly into `localStorage`; it does not play a scripted run to the end.
- `@claim:shared-seed` compares only the displayed label between two pages; it does not confirm that the route is controlled by the seed.
- `@claim:demo-isolated` opens `/demo` directly and does not check the broken header Demo path or leaving demo mode.
- The landing/README statements about copying and sharing results, deterministic routes, personalized tool offers, saved runs, and stored settings do not each have a matching claim entry.
- No declared claim measures frame rate or settings persistence, both required by the browser-game acceptance rules.

This conflicts with the required claim-to-test contract even though the current test commands are green.

### High — Required live routing and security configuration is not active

Checked live response behavior. The built `staticwebapp.config.json` specifies a content policy and a 404 response override, but the live root and assets have no `Content-Security-Policy` header. A request to `/not-a-real-route` returns status 200 and the normal game HTML instead of the supplied 404 page. The expected `frame-ancestors 'none'` protection is consequently absent as well.

## Other findings

### Medium

- Confirmed that “Start for real” leaves `demo:player` and `demo:run:<date>` in storage. The demo contract requires demo data to be discarded when leaving.
- Confirmed that all hashed assets use `Cache-Control: public, must-revalidate, max-age=30`; they do not receive long-lived immutable caching.
- Checked the service worker: offline reload succeeds, but its cache name is permanently `dawn-run-v1`, it does not remove old caches, and an app-only release will not update the worker script. A previously controlled page can therefore continue serving an older cached shell.
- Confirmed that valid but incomplete saved JSON such as `{}` causes a blank page and the page error `"undefined" is not valid JSON`. Invalid JSON text correctly recovers to tool selection.
- Confirmed that mobile header, demo, and footer links/buttons have target heights from 16 to 31 CSS px, below the 44 px product baseline. The four movement controls meet the target size.
- Confirmed that the “How it works” link changes the URL to `/#how` but leaves `scrollY` at 0 and focuses the page heading; the target section starts about 842 px below the viewport.
- The privacy page says the game stores settings, but the candidate has no settings UI or settings storage. Progress is stored, but refresh recovery is incomplete as described above.
- The README does not state the required 5–7 minute session length, and no duration check exists.

### Low

- Route-specific pages update `<title>`, but retain the home canonical and home social metadata.
- The visible tool-use button remains enabled after its once-per-room action has been consumed; a second press gives no feedback.

## Mandatory first-read check

**PASS.** A cold 1440×900 load answers all three questions in the first screen:

- What it does: “Play a six-room daily run.”
- Who it is for: “For people who want a short tactical game to compare each day.”
- What to click first: “Try it with sample data,” followed by “Loads a sample run. Nothing is saved.”

The first screen shows the live tool-selection game panel. At 390×844, the game panel begins at y=599 and is visible in the initial viewport, so the capture is not a menu wall.

## Claims gate

The mandatory first invocation occurred before repository inspection. Because the clean checkout had no installed packages, all seven commands initially returned exit 1 with `ERR_MODULE_NOT_FOUND: @playwright/test`. After the required `npm ci`, the same commands were run individually and all passed:

| Claim | Result after install | Independent check |
| --- | --- | --- |
| `demo-isolated` | PASS, 1 test | Direct `/demo` uses `demo:` keys; header Demo navigation and demo exit fail as described above. |
| `keyboard-controls` | PASS, 1 test | Arrow keys and on-screen movement work. |
| `end-screen` | PASS, 1 test | Independent 39-action input-only run reached the real sixth-room end screen. The repository test itself uses a stored end state. |
| `local-only` | PASS, 1 test | Full live winning flow made only same-origin GET requests. |
| `shared-seed` | PASS, 1 test | Same-day labels match, but different date labels still produce the same route. |
| `free-play` | PASS, 1 test | No account or payment controls or requests were observed. |
| `six-rooms` | PASS, 1 test | UI and completed run both show six rooms. |

## Build and repository checks

- `npm ci`: PASS; 20 packages installed, 0 reported vulnerabilities.
- `npm test`: PASS; 12/12 Playwright tests.
- Type check: PASS through `tsc -b` in the production build.
- Lint: not available; no lint script or configuration is present.
- `npm run build`: PASS; output written to `dist/`.
- Bundle sizes: JavaScript 5.24 KB gzip; CSS 2.51 KB gzip; hero WebP 133,218 bytes.
- Live identity: PASS. SHA-256 values matched between `dist/` and live for `index.html`, JavaScript, CSS, and the hero image.

## End-to-end game evidence

Confirmed from title screen through real controls, without writing game state directly:

- Invalid boundary input: ArrowLeft at the starting tile kept position `(0,2)`, left the replay log empty, and showed “That route is blocked. Try another tile or use your tool.”
- Win: Lantern run reached room six and “You escaped the sixth room.” after 39 logged actions; score 520, health 1/3.
- Loss: Hook run reached “The watcher ended this run.” in room three after 15 logged moves; score 200, health 0/3.
- Cash out: Lantern run reached the room-five decision and “You cashed out after five rooms.”; score 420.
- Restart: “Start a fresh practice run” removed the run key and returned to “Choose one tool.”
- Progress storage: move state remained in `localStorage`, but reload changed it to the unrecoverable touch pause state described above.
- Inputs: keyboard selection, arrows, click, and touch controls work before the refresh issue.
- Frame sampling: 182 frames over about 3 seconds under 4× CPU throttling, 60.00 fps average, 16.67 ms average interval, 16.80 ms maximum interval. There is no declared frame-rate claim/test.

## Accessibility and responsive checks

- Axe WCAG A/AA/2.1 AA on `/`, `/demo`, `/privacy`, and `/terms`: 0 serious or critical findings.
- Semantics: `lang="en"`, route titles, one `<h1>`, and one `<main>` confirmed on all four routes.
- Keyboard: tool selection and movement confirmed; focus outline measured as 4 px solid `#db643f`. No keyboard trap observed.
- Reduced motion: media query matched; scroll behavior became `auto`, transitions were `0s`, and no animations ran.
- Mobile: no horizontal overflow at 390 px; touch movement worked. Small targets and touch resume are findings above.
- Console/page errors: none during ordinary desktop, mobile, legal-route, or full-run checks. The malformed stored-object recovery check produced the error noted above.

## Privacy, network, and deployment checks

- Full winning-flow request log: only same-origin document, JavaScript, CSS, image, and service-worker requests; no third-party requests, analytics, fonts, account calls, or payment calls.
- Server-side endpoints: none observed or defined, so request allowance and 429 checks do not apply.
- Sign-in: not present, so identity-provider checks do not apply.
- Headers present: HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.
- Headers absent: Content Security Policy, including `frame-ancestors`.
- Conditional caching: the asset ETag returned 304. Cache lifetime remains only 30 seconds for both HTML and hashed assets.
- Offline reload: PASS after one online `/demo` visit under service-worker control.

## Performance

Lighthouse 12.8.2 mobile against the live root:

| Category or metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First contentful paint | 0.9 s |
| Largest contentful paint | 1.5 s |
| Total blocking time | 130 ms |
| Cumulative layout shift | 0 |
| Initial transfer | 142,338 bytes |

## Required next checks after repair

1. Confirm that the displayed seed generates all six layouts and that two dates differ while two same-date clients match.
2. Confirm every Demo entry uses `demo:` storage and that leaving demo removes demo data.
3. Confirm an active run can resume after refresh with keyboard and touch.
4. Confirm a completed result has a working comparison/submission path and corresponding claim test.
5. Confirm a screen reader can identify every board cell, coordinate, and state needed to play.
6. Confirm the live host returns the configured content policy, immutable asset caching, and a true 404 response.
7. Replace stored-state injection with an input-only end-to-end claim test and list every relied-on statement in `claims.json`.
