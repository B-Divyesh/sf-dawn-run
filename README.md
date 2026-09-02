# Dawn Run

Dawn Run is a free daily tactical browser game for one player. A full six-room route is designed for 5–7 minutes on keyboard or touch.

Each room requires three beacons before its exit opens. The 18-beacon route takes 120–168 tactical inputs at the measured 2.5-second planning cadence. Players share the dated map but receive a player-specific offer of three tools from a pool of five.

## Run it

```sh
npm ci
npm run dev
```

Open the Vite URL. The local server includes a score API for development. Open `/demo` for an isolated run already in progress.

## Test and build

```sh
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

The tests play deterministic win, loss, and cash-out routes through their real screens. They cover every claim listed in `.factory/claims.json`.

The production build writes the static client to `dist/`.

## Scores and privacy

The current run, settings, random player code, best score, and eight recent results stay in browser storage. Nothing is published until the player chooses **Publish verified score**.

Publication sends a nickname, date, tool, score, reported time, and move record to Dawn Run. The API rebuilds the run, rejects altered scores, and removes published results after seven days. Scores and move records are checked; reported time does not change rank. Demo submissions are checked against sample standings but never stored.

Production links `/api/scores` to the product-owned `sf-dawn-run-api` container. It stores scores in a SQLite snapshot at `/data/dawn-run-scores-v3.sqlite`. No account, third-party script, analytics service, or payment service is used. The game opens offline after the first visit.

## Deploy

This remains a static Vite browser-game deployment with a linked same-origin API:

```sh
npm run build
/opt/fleet/lib/deploy-static.sh dawn-run ./dist
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh dawn-run-api . api/Dockerfile 8080
```

Link `sf-dawn-run-api` as the existing `sf-dawn-run` Static Web App backend after both deployments.

## License

MIT. See [LICENSE](LICENSE).
