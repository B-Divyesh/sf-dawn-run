# Dawn Run

Dawn Run is a free daily tactical browser game for one player. A full six-room route is designed for 5–7 minutes on keyboard or touch.

Each room requires three beacons before its exit opens. The 18-beacon route takes 120–168 tactical inputs at the measured 2.5-second planning cadence. Players share the dated map but receive a player-specific offer of three tools from a pool of five.

## Run it

```sh
npm ci
npm run dev
```

Open the Vite URL. The local server includes an in-memory score API for end-to-end development. Open `/demo` for the isolated sample run.

## Test and build

```sh
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

The tests play deterministic win, loss, and cash-out routes through their real screens. They also cover replay verification, score publication, active-state axe checks, keyboard focus, touch resume, persistent settings/history, privacy, offline reload, and frame rate.

The production build writes the static client to `dist/`.

## Scores and privacy

Runs, settings, a random player code, and eight recent results stay in browser storage. Nothing is published until the player chooses **Publish verified score**.

Publication sends a nickname, UTC date, tool, score, duration, and deterministic replay to the product’s same-origin API. The API rebuilds the run from its actions, rejects altered results, and retains the published row for seven days. Demo submissions are verified against sample standings but never stored.

Production links `/api/scores` to the product-owned `sf-dawn-run-api` container. It stores seven-day scores in SQLite under `/data`. No account, third-party script, analytics service, or payment service is used. Play and local history keep working offline after the first controlled visit; the leaderboard requires a connection.

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
