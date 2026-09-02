# Dawn Run visual system

## Direction

**Dithered / halftone field guide.** Dawn Run is a small tactical expedition, not a fantasy inventory screen. The board looks printed on warm paper: bold ink blocks, imperfect dot shading, route lines and marker stamps. The feeling is alert but calm, like planning a dawn hike before the sun is fully up.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| paper | `#f5ecd2` | page and board ground |
| ink | `#18262b` | primary text and outlines |
| pine | `#225c52` | safe tiles and primary action |
| sunrise | `#db643f` | danger, enemies, primary highlights |
| ochre | `#d7a833` | loot and tool details |
| fog | `#c3d2c9` | secondary surface |
| night | `#28304d` | high contrast plates |

Ink on paper, paper on pine, and paper on night meet the 4.5:1 text contrast target. This is deliberately a single light paper mode; the board needs the printed-page ground.

## Type and spacing

The interface uses locally shipped system font stacks: Georgia for large editorial headings and a compact system sans for instructions and game data. The 8px spacing scale keeps the six-room map tidy. Numbers use tabular figures.

## Interaction and motion

Tools are large stamped buttons. Room choices are visible routes, not hidden dice rolls. Focus remains on the board or the control used when game state updates. Health, beacons, and score update immediately. Reduced motion and the persistent Reduce visual effects setting remove transitions. Screen shake and sound are omitted.

## Art plan and provenance

The hero is an original generated ink-and-halftone sunrise map illustration, used as a low-key section texture only; all playable board art is procedural HTML/CSS so it stays sharp and readable. Generated art has no text, logos, or brands. `assets/src/dawn-field.png` is the source image and `public/assets/dawn-field.webp` is the 131 KB production asset. It was generated on 2026-09-01 with the factory-image deployment from this prompt: “A dithered halftone risograph field map at dawn, abstract six-room route through pine hills, warm paper ground, dark ink, pine green, burnt orange and ochre print inks, empty area for interface, screenprint grain, no words, no logos, no watermark.” The sidecar JSON records the exact source. The footer discloses the generated illustration.

## Difficulty curve

Every daily run has six 9×7 rooms and 18 required beacons. The exit stays closed until all three room beacons are lit. Their alternating upper/lower placement removes the former straight winning lane and creates a 139–147-turn safe reference route across sampled dates. At the measured 2.5-second planning cadence, the 120–168 input budget is 5–7 minutes.

Rooms 1–2 teach beacon routing around rocks and brambles. Rooms 3–4 add a watcher that advances when a beacon lights. Room 5 offers a cash-out decision. Room 6 advances the watcher twice at each beacon. Each UTC date controls every layout. A local player code selects three tools from Hook, Dash, Lantern, Decoy, and Cloak, so offers vary while the map stays shared.

The active board is a semantic ARIA grid with seven owned rows and 63 named cells. Coordinate labels can be shown as a persistent setting. End screens layer the verified-score table over the same printed field-guide language instead of introducing a separate dashboard style.
