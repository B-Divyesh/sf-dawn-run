# Independent product verification 3

## Verdict: FAIL

Candidate `b0582c2ce1c37759dc68a64f0cae935369a1838f` is **not ready to release** at `https://dawn-run.sociobot.in`.

Verified independently on 2026-09-01 UTC from a clean checkout. The checked-out `50a05ca` differs from the candidate only in `.factory/handoff.md`; application sources are identical. A fresh production build byte-matched the deployed JavaScript, CSS, and main image, so the live findings apply to the candidate. No product code was changed.

## Mandatory first-read result: PASS

A cold 1440x900 live load says what it is: “Play a six-room daily run”; for whom: “For people who want a short tactical game to compare each day”; and what to do first: “Try it with sample data — Loads a sample run. Nothing is saved.” The first viewport contains the actual tool-selection game panel, not a marketing-only menu wall.

## Release-blocking findings

### High — the advertised 5–7 minute session is a seconds-long route

The brief and visible copy promise a 5–7 minute tactical run. In a fresh live demo, an input-only Lantern route reached the genuine sixth-room escape screen in **2,859 ms**: select Lantern, use it once in each room, move Right five times in rooms 1–6, and choose the final chase after room 5. The resulting replay has 37 actions and score 520. There is no time pressure, delay, required decision, or route variation on this path to make the session remotely approach five minutes.

`@claim:run-duration` passes only because it asserts the text “Designed for a 5–7 minute session.” It does not measure the advertised quantity. This violates both the researched session-length requirement and the claims rule for quantitative statements.

### High — players cannot pick one of three tools as specified

The researched smallest useful product says “Pick one of three tools.” The live choose panel exposes exactly two selectable buttons. Source confirms `tools` contains Hook, Dash, and Lantern but `offers()` always filters one out; the claim test explicitly asserts two tools. Consequently a player cannot make the specified one-of-three choice. This intentional scope change is neither explained nor approved in the handoff.

### Medium — initial keyboard focus bypasses the header and skip link

After a stable cold load, focus is programmatically placed on the page `<h1>`. Forward Tab then visits the sample button, tool buttons, and footer links; it does not visit the header navigation or “Skip to the game” link. The skip link becomes reachable only after Tab wraps around the whole document. This breaks the expected first-Tab skip-link behavior and makes header navigation awkward for keyboard-only users. Visible focus styling itself is present.

## Claims gate: PASS, but insufficient for the duration claim

Before general repository inspection, `.factory/claims.json` was found and all 15 listed commands were run individually after `npm ci`, each with exit code 0: `demo-isolated`, `keyboard-controls`, `end-screen`, `shared-seed`, `tool-offers`, `comparison`, `resume-touch`, `accessible-board`, `local-only`, `storage-recovery`, `frame-rate`, `run-duration`, `offline-reload`, `free-play`, and `six-rooms`.

The claims themselves are green, but `run-duration` is not an observable test of its numerical claim, as demonstrated above. Passing it does not cure the release-blocking duration defect.

## Local quality gates: PASS

- `npm ci`: 104 packages installed; 0 vulnerabilities reported.
- `npm test -- --reporter=line`: 22/22 Playwright tests passed (`test-results/.last-run.json` reports `passed`).
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed; `dist/` produced.
- Production output: JavaScript 18,382 bytes / 7,082 bytes gzip; CSS 8,196 bytes / 2,718 bytes gzip; main WebP 133,218 bytes. These are within the static-product bundle budgets.

## Live deployment, privacy, and game evidence: PASS except findings above

- Live asset SHA-256 matched the local production build exactly: JS `c7d601078e919af4e45fdcb8d0d895f535176578814b6520f4479a6684690021`; CSS `d005599450654dfe87c2212421f24dc1e5f9eef04a6ff687d637a75cf39c9abc`; image `365f3118d729183e24925f473098a5f0654d911659679f0fee936d0dec072522`.
- A deterministic live keyboard run reached cash-out, final chase, the real escape end screen, and restart. Separate live runs reached the loss screen and the five-room cash-out screen. Invalid replay input gives a useful recovery message. Demo run, pause/resume, and touch movement persisted at a 390x844 touch viewport with no horizontal overflow.
- The full winning-flow request log contained only `https://dawn-run.sociobot.in`; no third-party, analytics, account, or payment request was observed. There are no server-side product endpoints, so rate-limit and sign-in checks do not apply.
- In a fresh service-worker context, an online controlled load followed by an offline navigation to `/demo` showed the isolated demo banner and game.
- Live responses return HTTPS/HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive CSP including `frame-ancestors 'none'`. `/not-found` returns HTTP 404; hashed JS is `public, max-age=31536000, immutable`; `/sw.js` is `no-cache`.
- Playwright axe on `/`, `/demo`, `/privacy`, and `/terms` found zero serious or critical WCAG A/AA violations. All four routes had the expected title, language, one h1, main landmark, no load console/page errors, and the reduced-motion mobile game panel reported a `0s` transition duration.
- The live 60-frame heartbeat claim and local `@claim:frame-rate` both passed the documented >=55 fps threshold. The app uses a fixed 60 Hz accumulator.

## Required repair before acceptance

1. Make a representative complete run genuinely fit the promised 5–7 minute session, or remove/change that promise and obtain an approved scope change. Replace the text-only duration test with a measurement of the stated claim.
2. Offer all three specified tools at choice time, or document and approve a different product contract before shipping.
3. Do not autofocus the h1 on the initial document load; make the skip link the first forward Tab stop while retaining focused h1 announcements for client-side route changes.
