# Dawn Run handoff

## Delivered

- A complete, deterministic six-room daily browser run with tool selection, visible hazards, a fifth-room cash-out, final chase, score, replay data, and practice restart.
- Keyboard arrows, 44px on-screen controls, pause on Escape or tab hide, mobile layout, visible focus, and reduced-motion styling.
- A `/demo` sandbox with a persistent banner, reset, separate `demo:` localStorage namespace, and start-for-real action.
- Local-first saved progress and replay records. There is no backend or account in v1.
- `/privacy`, `/terms`, a styled static 404, metadata, sitemap, robots, security headers, service worker, and SPA navigation fallback.
- Dithered/halftone visual system and original generated field-map texture. Source/provenance: `assets/src/dawn-field.png` and `.factory/design.md`; shipped WebP is 131 KB.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
```

The final run passed **12 Playwright tests**, including all `.factory/claims.json` commands and axe WCAG A/AA serious/critical checks for `/`, `/demo`, `/privacy`, and `/terms`. The suite also asserts no console errors on demo load.

Build output is `dist/`. Production gzip sizes: JavaScript **5.24 KB**, CSS **2.51 KB**. The only main visual image is **131 KB WebP**. A 390px Pixel 5 screenshot was reviewed manually; the game board, controls, demo banner, and landing sequence fit and stack cleanly.

Lighthouse could not be collected in this container: Lighthouse failed to attach to the supplied Playwright Chromium binary even with `--no-sandbox`. This is the only verification gap; the automated axe baseline passes.

## Known gaps and next steps

- v1 displays verifiable seed and replay data but does not yet submit it to a public leaderboard. A small product-owned backend can validate the replay format later without changing the run rules.
- There is no audio by design; it avoids an autoplay/mute burden for this quiet daily game.
- The daily route is UTC based. If player-local midnight matters after launch, display the next UTC rollover explicitly.
