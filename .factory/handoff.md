# Dawn Run review 1 handoff

## Status

Review completed without product-code changes. Verdict: **FAIL**. The required report is `.factory/review-1.md`.

## What was verified

- Fresh live desktop (1440×900) and phone (390×844) first reads.
- Live demo entry, reset, return-to-real storage behavior, request origins, headers, routes, metadata, crawler targets, 404, keyboard/focus, and full axe scans.
- Every one of the 19 declared claim commands from a fresh local clone. All passed when run independently.
- Clean-clone `npm run typecheck`, `npm run lint`, `npm test -- --reporter=line` (6 API tests and 28 Playwright tests), and `npm run build`. All passed and `dist/` was produced.
- Earlier verification/handoff findings were read and checked; only the previously documented minor `aria-allowed-role` issue remains.

## Remaining work

The review lists two blocking demo-sandbox issues, one blocking unresolved prior axe finding, eight claim/copy issues, and an incomplete 404 document. The highest-priority repair is to make `/demo` immediately show a realistic sample game without writing any `dawn:` storage during the landing-to-demo path.

## How to verify after repair

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=line
npm run build
```

Then repeat the cold-browser and claim checks recorded in `.factory/review-1.md`, especially a fresh-context landing → demo flow that asserts visible sample state and zero `dawn:` storage keys.
