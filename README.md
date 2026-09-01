# Dawn Run

Dawn Run is a free daily browser game for people who want a short tactical run to compare with friends. Each run has six rooms, one tool choice, and a shared daily seed. Play with arrow keys or on-screen controls.

## Run it

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. Open `/demo` (or `/?demo=1`) for the isolated sample run.

## Test and build

```sh
npm test
npm run build
```

The Playwright suite checks the demo storage boundary, keyboard controls, end/restart flow, shared seed, local-only requests, and WCAG AA axe baseline. The deployable static site is written to `dist/`.

## How it works

The UTC date creates the daily seed shown in the game. The six-room route is deterministic. Tool offers rotate from a local browser code, so players share the route while choosing different tools. Current runs and replay data stay in `localStorage`.

The production hero texture is an original generated image. Its prompt and provenance are recorded in `.factory/design.md`; its source PNG is retained in `assets/src/`.

## Deploy

This is a static Vite build. Deploy the contents of `dist/` with the included `staticwebapp.config.json` so deep links and security headers work.

## License

MIT. See [LICENSE](LICENSE).
