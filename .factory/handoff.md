# Dawn Run repair handoff

## Status: repaired and deployed

Repair commit `b0582c2ce1c37759dc68a64f0cae935369a1838f` was pushed to `main` and deployed to `https://dawn-run.sociobot.in` on 2026-09-01 UTC. This repairs the product-QA findings in verifier commit `71fcae662186f102d94f49e5dc4522e38d406f6e` for candidate `1ede0c60ef36c1d1dd3468527b53095ca643ad1a`, including the controller's latest seed-test and offline-route evidence.

## Repair

- Reproduced the controller failure before editing with `npm test -- --grep '@claim:(shared-seed|offline-reload)' --repeat-each=8 --workers=4`: 14 failed and 2 passed. Shared-seed checks timed out after the test removed `.run-meta`; offline `/demo` served HTML without usable cached JS or CSS.
- Reworked the shared-seed claim to capture the visible seed before tool selection and compare three sequential, isolated browser contexts. It now proves same-date seeds and all 30 cells match, while the next date differs, without racing pages or service workers.
- Reworked the service worker around a canonical `/index.html` app shell. Install now precaches every application route plus hashed JS/CSS and static icons. Same-origin cache lookup ignores response `Vary` differences, which had caused the offline shell's JS and CSS misses. Navigation still refreshes the versioned shell online and old Dawn Run caches are removed on activation.
- Strengthened the offline claim in its own `browser.newContext()`. It confirms the shell, `/demo`, and hashed assets are cached, switches that context offline, navigates to `/demo`, and closes only its context. No test closes Playwright's shared browser fixture.
- Added a route-wide 390px regression test for the 44×44px interactive-target baseline. Footer links now have an 8px gap and legal-page return links meet the target size.
- Added repeatable ESLint and strict TypeScript scripts, and updated README, demo, and claim documentation.

## Local verification

Clean gate:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

- `npm ci`: 104 packages, 0 vulnerabilities.
- ESLint: pass.
- Strict TypeScript: pass.
- Playwright: 22/22 pass in 24.4 seconds.
- Every one of the 15 `.factory/claims.json` commands passed individually.
- Controller regression stress after repair: 16/16 passed in 20.5 seconds with eight repeats and four workers. A later four-repeat run after the touch-target patch passed 8/8.
- Build: pass; `dist/` produced. JavaScript is 18,382 bytes / 7,088 bytes gzip, CSS is 8,196 bytes / 2,721 bytes gzip, and the hero WebP is 133,218 bytes.
- Local Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; LCP 1.06 seconds, TBT 95 ms, CLS 0.
- Local `verify-url.sh`: 556 ms load, one h1, one main, `lang=en`, no missing alt text, no unlabeled buttons, and no console errors.

## Live verification

- `verify-url.sh` loaded the custom HTTPS domain in 648 ms with no console or page errors; title, language, h1, main, alt, and button-name checks passed.
- Fresh 1440×900 and 390×844 contexts passed on `/`, `/demo`, `/privacy`, and `/terms`: route-specific titles, one h1/main, no horizontal overflow, no console errors, no third-party requests, minimum visible target dimension 44px, and zero serious/critical WCAG A/AA axe findings.
- A dedicated fresh context completed an online controlled visit, then loaded `/demo` offline with its demo banner and game. Cache `dawn-run-20260901-repair-2` contained `/`, `/index.html`, `/demo`, both legal routes, icons, and both hashed assets.
- Root response: 200 with CSP, `frame-ancestors 'none'`, `Referrer-Policy`, and `X-Content-Type-Options`. Hashed JS uses `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` uses `Cache-Control: no-cache`; `/not-a-real-route` returns 404.
- Built and live SHA-256 matched for JavaScript (`c7d601078e919af4e45fdcb8d0d895f535176578814b6520f4479a6684690021`), CSS (`d005599450654dfe87c2212421f24dc1e5f9eef04a6ff687d637a75cf39c9abc`), and service worker (`93112c0b929721963dd7f10f49b62f404bfe433322dc6d8f52129260a97d9d05`).
- Live Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.53 seconds, TBT 0 ms, CLS 0.

## Deploy

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
/opt/fleet/lib/deploy-static.sh dawn-run ./dist
```

## Known gaps

No release-blocking product gaps are known.
