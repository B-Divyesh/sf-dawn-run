# Dawn Run polish round 1

All 13 findings in `.factory/review-1.md` are resolved. Earlier verification reports were also re-read; the only carried finding was the banner ARIA role in F-1-11.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | `/demo` and `/?demo=1` now open an in-memory room-two run with Hook selected, one beacon lit, a valid deterministic move record, a current score, and two sample standings. Added **Restart this sample run**. | `@claim:demo-isolated`; `.factory/desktop-demo-polish-1.png`; `.factory/mobile-demo-polish-1.png`; live `/demo` cold check recorded below. |
| F-1-2 | Landing settings and tool previews no longer call the persistent player initializer. Fresh landing and demo entry create no key; only an explicit real tool choice can create `dawn:` data. | `@claim:demo-isolated` asserts zero `dawn:` keys across landing → demo → reset → real. |
| F-1-3 | Registered the publication-consent claim and recorded score requests through a complete real run. The test proves zero score requests before the button and exactly one POST afterwards with only declared fields. | `@claim:publication-consent`. |
| F-1-4 | Registered Hook and test its named grid-cell change from blocked rock to open route plus its room use limit. | `@claim:hook-tool`. |
| F-1-5 | Registered Dash and test the two-tile move, once-per-room limit, and blocked-boundary message. | `@claim:dash-tool`. |
| F-1-6 | Registered Lantern and test its two-health behavior, five-health cap, and room use limit. | `@claim:lantern-tool`. |
| F-1-7 | Registered Decoy and test the unchanged watcher through six moves and its next eligible move. | `@claim:decoy-tool`. |
| F-1-8 | Registered Cloak and cause two watcher hits, proving only the first is blocked. | `@claim:cloak-tool`. |
| F-1-9 | The persistence test now completes nine distinct deterministic runs, reloads, and asserts both settings, the calculated best score, and exactly the newest eight history rows. Copy now states the tested scope. | `@claim:settings-history`. |
| F-1-10 | Reset deletes every `demo:` key and reloads the bundled sample from memory, so storage remains empty until a demo action. Documentation now states the exact behavior. | `@claim:demo-isolated`; `.factory/demo.md`. |
| F-1-11 | Replaced the invalid `<aside role="status">` pair with a role-compatible `<div role="status">`. Added a full-impact axe scan, not only serious/critical filtering. | `demo banner and active sample have no axe violations at any impact`. |
| F-1-12 | Rebuilt the 404 with the product header, navigation, footer, favicon, Apple icon, canonical, description, Open Graph, Twitter metadata, two recovery links, and field-guide artwork. | `designed 404 has complete shell and route metadata`; `accessibility baseline /404.html`; live unknown-route 404 check recorded below. |
| F-1-13 | Replaced “Daily seed” with “Today’s map code” and removed the unused offer code. Rewrote the flagged how-it-works and generated-art copy. | `@claim:shared-seed`; `.factory/copy-audit.md`; cold screenshots above. |

## Additional acceptance evidence

- Claim manifest: 28 unique claims and 28 unique `@claim:` tests; every exact manifest command passed from a clean clone.
- Full suite: 8 Node API tests and 38 Playwright tests passed.
- Accessibility: every app route and the 404 passed WCAG 2 A/AA scans; the active demo also passed an unfiltered full axe scan.
- Build budget: 31.02 KB JavaScript, 11.07 KB CSS, and 133.22 KB hero WebP uncompressed; all are below the product budgets.
- Mobile: the 390×844 test asserts 44 px targets, no horizontal overflow, and the active room heading; screenshot is `.factory/mobile-demo-polish-1.png`.
- 404 visual: `.factory/desktop-404-polish-1.png`.
- Live evidence: added after the production cold check in `.factory/handoff.md`.
