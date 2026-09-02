# Dawn Run adversarial first-read review 1

**Verdict: FAIL.** This review found three blocking defects and ten further findings. `PASS` requires zero findings.

Reviewed 2026-09-02 UTC against `https://dawn-run.sociobot.in` and candidate `82d1b16b99abcdd2722a5463ab076d9b966a32ed`. No product source was changed.

## Cold first read

Fresh 1440×900 and 390×844 browser contexts gave the same answer before scrolling:

| Question | What the first screen says |
| --- | --- |
| What does it do? | “Play a six-room daily run.” |
| For whom? | “For people who want a 5–7 minute tactical game to compare each day.” |
| What should I click first? | “Try it with sample data” beside “Loads a sample run. Nothing is saved.” |

The first-read copy is clear, and the actual tool-selection panel is visible in both viewports. This passes the cold landing check. It does not cure the demo defects below.

## Findings

### Blocking

#### F-1-1 — The one-click demo does not show sample play

**Location / exact result:** Clicking “Try it with sample data” at live `/` reaches `/demo`, shows the required banner, and then shows the unchanged tool-selection screen headed “Choose one tool.” It does not show an active board, a played sample route, or the documented two-row sample leaderboard. This was confirmed at 1440×900 and 390×844. `.factory/demo.md:3` also says it “starts at a player-specific three-tool offer,” rather than a sample run.

**Why this fails:** The demo requirement is that the first screen after one click already shows the product being used with realistic sample data. A visitor still has to choose a tool and then play to see the product. The banner calls this “sample data,” but there is no visible sample state.

**Concrete fix:** Make `/demo` open an isolated, pre-seeded active run: show a realistic board with a selected tool, lit beacons, current score, move history, and the sample leaderboard immediately. Keep a clearly named action such as “Restart this sample run.” Add a claim test that enters `/demo` from a fresh context and asserts the active board, sample state, banner, reset, and no real-storage keys.

#### F-1-2 — The advertised sample path writes real browser storage

**Location / exact result:** In a fresh context, loading `/` and then clicking “Try it with sample data” left `dawn:player` in `localStorage` as well as `demo:player`. The landing says “Nothing is saved,” while `src/main.ts:33–39` creates a `dawn:player` during the initial real-mode render before the sample action is clicked. The declared `@claim:demo-isolated` test checks only that no `dawn:run:*` key is made; it does not check all `dawn:` keys.

**Why this fails:** A visitor following the advertised sample route causes a persistent real-data key to be written. That is not an isolated demo namespace and makes “nothing is saved” false as written.

**Concrete fix:** Do not initialise a real player code or any `dawn:` key until the visitor explicitly starts real play. Render the landing preview without storage, initialise only `demo:` keys on `/demo`, and assert after the full landing → sample flow that there are no `dawn:` keys.

#### F-1-11 — Previous axe minor remains unfixed

**Location / exact quote:** Live `/demo` full axe scan reports `aria-allowed-role` (minor) on `<aside class="demo-banner" role="status">`. This is the same unresolved low finding recorded in `.factory/verification-5.md`.

**Why this fails:** The review instruction requires every earlier finding to be actually fixed; an unfixed prior finding is blocking in this round. `status` is not an allowed role for `aside`.

**Concrete fix:** Use a role-compatible `<div role="status">` for the banner, or keep `<aside>` without `role="status"` and use a separate live region for the status text. Add a full-axe assertion for this node.

### Medium

#### F-1-3 — The landing’s publication-consent claim is unlisted

**Location / exact quote:** Landing facts: “Scores publish only when you choose” (`src/main.ts:270`). No `.factory/claims.json` entry asserts that no score/publication request occurs before the explicit publish action. `local-only` asserts same-origin requests after a publish; it is not the stated consent claim.

**Why this matters:** This is a privacy promise a visitor can rely on, but the sandbox does not prove it.

**Concrete fix:** Add `publication-consent` with a browser request-log test for a complete real run: assert no score request before clicking “Publish verified score,” then assert exactly the explicit publish request afterwards.

#### F-1-4 — The Hook effect is an unlisted claim

**Location / exact quote:** Tool card: “Clear one rock beside you.”

**Why this matters:** This is a game rule a player must rely on. `tool-offers` only proves offered names/counts and variation, not Hook’s observable effect.

**Concrete fix:** Add a `hook-tool` claim test that uses Hook beside a rock and asserts that the named grid cell becomes open.

#### F-1-5 — The Dash effect is an unlisted claim

**Location / exact quote:** Tool card: “Move east two tiles once per room.”

**Why this matters:** The claim is relied on to choose a tool, but has no matching claim test.

**Concrete fix:** Add a `dash-tool` claim test that records the two-cell east move, asserts one use per room, and checks its boundary/error behavior.

#### F-1-6 — The Lantern effect is an unlisted claim

**Location / exact quote:** Tool card: “Restore up to two health once per room.”

**Why this matters:** The claim is relied on to choose a tool, but has no matching claim test.

**Concrete fix:** Add a `lantern-tool` claim test that loses health, uses Lantern, observes the capped restoration, and verifies the room use limit.

#### F-1-7 — The Decoy effect is an unlisted claim

**Location / exact quote:** Tool card: “Delay the watcher for six turns.”

**Why this matters:** The claim is relied on to choose a tool, but has no matching claim test.

**Concrete fix:** Add a `decoy-tool` claim test that records the watcher position across exactly six turns and the following turn.

#### F-1-8 — The Cloak effect is an unlisted claim

**Location / exact quote:** Tool card: “Block the next watcher hit.”

**Why this matters:** The claim is relied on to choose a tool, but has no matching claim test.

**Concrete fix:** Add a `cloak-tool` claim test that causes two watcher hits and proves only the first is blocked.

#### F-1-9 — The persistence claim is broader than its declared test

**Location / exact quote:** `.factory/claims.json` promises “Settings, best score, and eight recent runs persist in this browser.” The landing says “Runs and settings stay in this browser.” The `@claim:settings-history` test changes two settings and completes one run. It does not assert a best score or the eight-run cap/persistence.

**Why this matters:** The tested observable outcome does not cover two relied-on parts of the declared claim.

**Concrete fix:** Complete nine deterministic runs in a fresh real context, reload, and assert the displayed best score and exactly the newest eight history entries. Either add the corresponding request-log check for the landing privacy wording or narrow that wording to the tested behavior.

#### F-1-10 — Reset demo does not do what the demo documentation says

**Location / exact quote:** `.factory/demo.md:5` says “Reset demo … deletes every `demo:` key.” On live `/demo`, after selecting a tool and moving, Reset demo removed `demo:run:2026-09-02` but immediately recreated `demo:player` on reload. The resulting storage was `["demo:player"]`.

**Why this matters:** The documented reset behavior is not true. It makes sandbox inspection ambiguous and leaves a persistent demo identity after a purported full reset.

**Concrete fix:** Either keep reset on a storage-free demo entry screen until a visitor begins the sample, so every key remains deleted, or change the documentation and UI to “Start a new sample run” and test the precise retained key behavior.

### Minor

#### F-1-12 — The 404 is outside the site skeleton and lacks route metadata

**Location / exact result:** Live `/not-a-real-route` correctly returns 404 and offers a way home, but `public/404.html` has no product header, footer, favicon, description, canonical link, Open Graph data, or Twitter data. It therefore does not have the consistent header/footer required on every route.

**Why this matters:** A visitor who follows a broken shared link loses the product navigation and receives an incomplete document.

**Concrete fix:** Give the static 404 the same wordmark, navigation, footer links, favicon, route-specific description/canonical/social metadata, and field-guide styling as the application shell.

#### F-1-13 — Two on-screen labels use unexplained technical jargon

**Location / exact quotes:** “DAILY SEED 2FWW8U” and “Offer code UPQCV · The map stays shared.”

**Why this matters:** “Seed” and “offer code” do not tell a first-time player what to do or why they matter. The code is not needed to choose a tool.

**Concrete fix:** Change the first label to “Today’s map code: 2FWW8U” and remove the offer code, or label it “Your tool offer code” with one short explanation only if players can use it.

## Copy audit

Word counts treat numbers and hyphenated terms as one word. No audited sentence exceeds 22 words. “Flag” contains the required proposed rewrite where a problem exists.

### Landing page

| Location | Exact sentence or label | Words | Flag |
| --- | --- | ---: | --- |
| Skip link | Skip to the game | 4 | — |
| Wordmark | Dawn Run | 2 | — |
| Navigation | Demo | 1 | — |
| Navigation | How it works | 3 | — |
| Navigation | Privacy | 1 | — |
| Eyebrow | A daily browser game | 4 | F-1-13: remove it; the headline already supplies this useful context. |
| H1 | Play a six-room daily run | 5 | — |
| Hero | For people who want a 5–7 minute tactical game to compare each day. | 13 | — |
| Primary button | Try it with sample data | 5 | F-1-1: it must open a visible sample run. |
| Button note | Loads a sample run. | 4 | F-1-1: rewrite after repair as “Opens a sample game already in progress.” |
| Button note | Nothing is saved. | 3 | F-1-2: rewrite as “Sample play stays in separate demo storage.” only after true isolation. |
| Fact | Free to play | 3 | — (`free-play`) |
| Fact | 18 beacons on one shared map | 6 | — (`six-rooms`, `shared-seed`) |
| Fact | Works offline after the first visit | 6 | — (`offline-reload`) |
| Fact | Scores publish only when you choose | 6 | F-1-3: add `publication-consent`. |
| Game panel | Daily seed | 2 | F-1-13: rewrite “Today’s map code.” |
| Game panel | 6 rooms · 18 beacons | 4 | — (`six-rooms`) |
| Game panel | Choose one tool | 3 | — |
| Game panel | Your three-tool offer is set by this browser. | 8 | — (`tool-offers`) |
| Game panel | Another player can receive a different set on the same map. | 11 | — (`tool-offers`, `shared-seed`) |
| Tool | Hook | 1 | — |
| Tool | Clear one rock beside you. | 5 | F-1-4: add `hook-tool`. |
| Tool | Dash | 1 | — |
| Tool | Move east two tiles once per room. | 7 | F-1-5: add `dash-tool`. |
| Tool | Lantern | 1 | — |
| Tool | Restore up to two health once per room. | 8 | F-1-6: add `lantern-tool`. |
| Tool | Decoy | 1 | — |
| Tool | Delay the watcher for six turns. | 6 | F-1-7: add `decoy-tool`. |
| Tool | Cloak | 1 | — |
| Tool | Block the next watcher hit. | 6 | F-1-8: add `cloak-tool`. |
| Game panel | Offer code [five characters] · The map stays shared. | 7 | F-1-13: remove the unused code; retain “The map stays shared.” if useful. |
| Progress summary | Settings and run history | 4 | — |
| Section H2 | How the daily run works | 5 | — |
| Step | Pick one offered tool. | 4 | — |
| Step | Each browser gets three from five tools. | 7 | — (`tool-offers`) |
| Step | Light 18 beacons. | 3 | — (`six-rooms`) |
| Step | Plan around rocks, brambles, and the watcher. | 7 | Rewrite “Avoid rocks and brambles while the watcher follows you.” |
| Step | Publish a verified result. | 4 | Rewrite “Publish a score after Dawn Run checks your moves.” |
| Step | Submit a nickname and replay after the run. | 8 | Rewrite “Submit a nickname and a record of your moves after the run.” |
| Section H2 | What Dawn Run sends | 4 | — |
| Privacy copy | Runs and settings stay in this browser. | 7 | F-1-9: test all stated persistence behavior. |
| Privacy copy | Publishing sends only the listed result fields after you choose it. | 9 | F-1-3: add a consent/request-field test. |
| Footer | A six-room tactical route for one player. | 7 | — |
| Footer | Privacy | 1 | — |
| Footer | Terms | 1 | — |
| Footer | Built by Param Factory · v2.0 | 5 | — |
| Footer | Illustration texture is original generated imagery. | 6 | Rewrite “The background illustration is original generated art.” |

### README

| Location | Exact sentence or label | Words | Flag |
| --- | --- | ---: | --- |
| Intro | Dawn Run is a free daily tactical browser game for one player. | 12 | — (`free-play`) |
| Intro | A full six-room route is designed for 5–7 minutes on keyboard or touch. | 13 | — (`run-duration`, `keyboard-controls`) |
| Intro | Each room requires three beacons before its exit opens. | 9 | Add an observable beacon/exit claim or fold it into `six-rooms`. |
| Intro | The 18-beacon route takes 120–168 tactical inputs at the measured 2.5-second planning cadence. | 13 | — (`run-duration`) |
| Intro | Players share the dated map but receive a player-specific offer of three tools from a pool of five. | 18 | — (`shared-seed`, `tool-offers`) |
| H2 | Run it | 2 | — |
| Run instructions | Open the Vite URL. | 4 | — |
| Run instructions | The local server includes an in-memory score API for end-to-end development. | 11 | Add a local development API smoke test, or simplify to “The local server includes a score API for development.” |
| Run instructions | Open `/demo` for the isolated sample run. | 7 | F-1-1/F-1-2: make this true before retaining it. |
| H2 | Test and build | 3 | — |
| Test description | The tests play deterministic win, loss, and cash-out routes through their real screens. | 13 | — |
| Test description | They also cover replay verification, score publication, active-state axe checks, keyboard focus, touch resume, persistent settings/history, privacy, offline reload, and frame rate. | 22 | F-1-9: “persistent settings/history” overstates what the tagged test proves. |
| Build description | The production build writes the static client to `dist/`. | 9 | — |
| H2 | Scores and privacy | 3 | — |
| Privacy | Runs, settings, a random player code, and eight recent results stay in browser storage. | 14 | F-1-9: assert the random code scope and eight-result cap. |
| Privacy | Nothing is published until the player chooses **Publish verified score**. | 10 | F-1-3: add consent test. |
| Privacy | Publication sends a nickname, UTC date, tool, score, duration, and deterministic replay to the product’s same-origin API. | 16 | Add a request-body assertion or rewrite in plain words: “Publishing sends your nickname, date, tool, score, time, and move record to Dawn Run.” |
| Privacy | The API rebuilds the run from its actions, rejects altered results, and retains the published row for seven days. | 19 | Add a tagged API observable test for altered-score rejection and seven-day expiry. |
| Privacy | Demo submissions are verified against sample standings but never stored. | 10 | F-1-1: the standings are not visible on demo entry; add a demo-specific storage test. |
| Privacy | Production links `/api/scores` to the product-owned `sf-dawn-run-api` container. | 8 | Technical deployment detail; move to deployment documentation if it remains necessary. |
| Privacy | It stores seven-day scores in a SQLite snapshot at `/data/dawn-run-scores-v3.sqlite`. | 10 | Technical deployment detail; add a retention test or move it to deployment documentation. |
| Privacy | No account, third-party script, analytics service, or payment service is used. | 11 | — (`free-play`, `local-only`) |
| Privacy | Play and local history keep working offline after the first controlled visit; the leaderboard requires a connection. | 15 | Add an offline local-history test and offline leaderboard error test. |
| H2 | Deploy | 1 | — |
| Deploy | This remains a static Vite browser-game deployment with a linked same-origin API. | 11 | Technical deployment detail; no visitor-facing benefit. |
| Deploy | Link `sf-dawn-run-api` as the existing `sf-dawn-run` Static Web App backend after both deployments. | 12 | Deployment instruction; verify it in deployment automation rather than product claims. |
| H2 | License | 1 | — |
| License | MIT. | 1 | — |
| License | See [LICENSE](LICENSE). | 2 | — |

## Demo, privacy, and claims checks

- `/demo` and `/?demo=1` enter demo mode. The persistent banner, Reset demo, and Start for real are visible.
- Start for real removed all `demo:` keys in the live check. Reset demo removed the run but recreated `demo:player` (F-1-10).
- The live request log for cold landing, demo entry, and return to real mode contained only `https://dawn-run.sociobot.in` requests. No third-party request was observed.
- The claim manifest contains 19 entries. From a clean clone, each exact command passed individually: `demo-isolated`, `keyboard-controls`, `end-screen`, `shared-seed`, `tool-offers`, `comparison`, `resume-touch`, `accessible-board`, `score-publishing`, `settings-history`, `focus-preserved`, `local-only`, `storage-recovery`, `frame-rate`, `run-duration`, `offline-reload`, `response-policy`, `free-play`, and `six-rooms`.
- Passing commands do not cover the missing or overbroad claims identified in F-1-3 through F-1-10.

## Earlier-review regression audit

There are no prior `.factory/review-*.md` or `.factory/polish-*.md` files. I read `.factory/verification.md`, `verification-3.md`, `verification-4.md`, `verification-5.md`, and the prior handoff.

The earlier blockers were rechecked live and in code and are fixed: date-dependent shared maps, header demo routing, touch resume, replay comparison/publication, active-grid row ownership, 5–7-minute input budget, player-varying three-tool offers, keyboard focus preservation, settings/history UI, route metadata, true 404 status, CSP, cache policy, malformed storage recovery, 44px mobile controls, and offline reload. `verification-5.md` recorded one remaining low axe issue; F-1-11 confirms it is still unfixed.

## Structure and delivery checks

- `/`, `/demo`, `/privacy`, and `/terms` return 200. Internal crawled assets and links return 200. An unknown route returns a designed 404 with a way home.
- Home, demo, privacy, and terms have route-specific titles, one h1, descriptions, canonicals, OG image, `lang="en"`, main landmarks, working deep links/back navigation, focus on client-side route change, and no console errors.
- `robots.txt`, `sitemap.xml`, favicon, Apple touch icon, 1200×630 OG SVG, CSP, and security/cache headers are present.
- WCAG-tagged axe scans had zero serious/critical violations on landing, active demo board, privacy, terms, and 404. Full axe found F-1-11. The 404 omissions are F-1-12.
- The field-guide visual identity is distinct and matches `.factory/design.md`; it is not a generic SaaS template.

## Missed leverage

No missing AI feature is indicated: the core job is a local tactical browser game, and adding an AI step would be decorative. Replay copy/import, verified publication, and offline play are present. The obvious missing leverage is the actual sample state in F-1-1, not an additional product feature.

## What would make this perfect

Ship a genuinely pre-seeded, storage-isolated demo that immediately shows play; make every privacy and tool-effect statement observable in its own claim test; correct reset semantics; remove the minor ARIA misuse; give the 404 the complete product shell; and replace or explain the two unexplained code labels. Then rerun this full review with no findings.
