# Dawn Run

Dawn Run is a free daily browser game for people who want a short tactical run to compare with friends. Each six-room session is designed for 5–7 minutes. Play with arrow keys or on-screen controls.

## Run it

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. Open `/demo` (or `/?demo=1`) for the isolated sample run.

## Test and build

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

The Playwright suite checks the demo boundary, seed-generated rooms, keyboard and touch recovery, real win/loss/cash-out runs, comparison import, offline `/demo` navigation, local-only requests, 55+ fps sampling, and WCAG AA axe baseline. The deployable static site is written to `dist/`.

## How it works

The UTC date creates the displayed seed and all six room layouts. Players on the same date receive the same map. Each player chooses from two local tool offers. Current runs and optional comparison data stay in `localStorage`. Completed runs can be copied, shared through the browser share sheet when available, or pasted into the comparison panel. No score is sent to a server.

The game uses a fixed 60 fps simulation heartbeat and the test suite samples at least 55 fps in Chromium. A complete Lantern route has 37 input actions and is the deterministic verification run.

The production hero texture is an original generated image. Its prompt and provenance are recorded in `.factory/design.md`; its source PNG is retained in `assets/src/`.

## Deploy

This is a static Vite build. Deploy the contents of `dist/` with the included `staticwebapp.config.json` so deep links and security headers work.

## License

MIT. See [LICENSE](LICENSE).
