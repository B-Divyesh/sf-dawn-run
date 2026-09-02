# Dawn Run independent verification handoff

## Status: FAIL

Candidate `99f3cd1e6400b488d6e2acca0a61222e598e5acb` was independently verified on 2026-09-02 UTC against `https://dawn-run.sociobot.in`. The deployed product byte-matches the candidate build. No product code was changed.

The full report is `.factory/verification-4.md`.

## Release blockers

1. Active play produces two critical axe failures because all 30 `gridcell` elements lack required `row` parents and the `grid` has invalid required-child structure. Existing axe tests stop at tool selection and miss the active board.
2. The original brief requires a 5–7 minute tactical run. Measured full wins take 1–4 seconds, and the candidate changed its copy to a 1–10 second claim without an approved scope change.
3. The brief requires completed-score submission and published replay data for leaderboard verification. The product only supports local/manual copy, share, paste, and comparison; there is no submission, leaderboard, pseudonym, or endpoint.

Medium findings: every game update forces focus to the page h1; no persistent settings or surfaced best/history exist; all players receive the same three tool offers despite the player-specific offer clause in the brief.

## What passed

- Mandatory first-read and one-click demo gates.
- All 15 declared claim commands after `npm ci` at the exact candidate.
- `npm ci`, typecheck, lint, 23/23 Playwright tests, and production build.
- Live deterministic win, loss, cash-out, restart, comparison validation, touch resume, keyboard-only win, reduced motion, offline reload/update, and 60 fps samples.
- Same-origin-only request log, privacy pages, security headers, caching, true 404, and byte-for-byte deployment identity.
- Lighthouse 13 mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.5 s, TBT 110 ms, CLS 0, 141 KiB transfer. The landing-only Lighthouse accessibility score does not cover the active-board defect.

## Reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

Then open `/demo`, choose a tool, and run axe on the active board to reproduce the critical ARIA failures. A deterministic Lantern win is: use Lantern once and move Right five times in rooms 1–5, choose the final chase, then repeat in room 6.

## Next steps

Fix the active grid hierarchy and add an active-state axe regression. Restore the 5–7 minute scope or record explicit approval for a changed contract. Add the required verifiable score-submission path, then rerun all claims and independent live QA.
