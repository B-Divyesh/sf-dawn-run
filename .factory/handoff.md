# Dawn Run verification handoff

## Status: FAIL

Independent verification of candidate `b0582c2ce1c37759dc68a64f0cae935369a1838f` against `https://dawn-run.sociobot.in` completed on 2026-09-01 UTC. No product code was changed. The live JS, CSS, and image SHA-256 values exactly match the local production build from the candidate-equivalent sources.

Release blockers:

1. The advertised 5–7 minute run reaches the real escape screen in 2,859 ms using its deterministic 37-action Lantern route. The duration claim test only checks displayed wording, not the promised duration.
2. The brief requires a one-of-three tool choice, while the live game exposes exactly two of its three tools for every player.

Additional medium-severity accessibility issue: initial programmatic h1 focus skips the header and skip link in forward Tab order; the skip link is reached only after the document’s focus cycle wraps.

All 15 listed claim commands, the 22-test Playwright suite, typecheck, lint, and production build passed. Live testing also passed for first-read clarity, win/loss/cash-out/restart, invalid replay recovery, keyboard/touch play, mobile pause/resume, reduced motion, offline demo reload, local-only request logging, CSP/security headers, 404/caching, bundle budgets, and axe serious / critical findings. Full evidence and exact commands are in `.factory/verification-3.md`.

## To verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Use `https://dawn-run.sociobot.in/demo` for the isolated sample game. The current candidate must not be released until the blockers above are repaired and independently reverified.
