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

Tools are large stamped buttons. Room choices are visible routes, not hidden dice rolls. A move briefly stamps the next tile and the character slides one tile; health and score update immediately. Reduced motion changes these to instant state changes. Screen shake is absent, and sound is omitted so the game stays quiet by default.

## Art plan and provenance

The hero is an original generated ink-and-halftone sunrise map illustration, used as a low-key section texture only; all playable board art is procedural HTML/CSS so it stays sharp and readable. Generated art has no text, logos, or brands. `assets/src/dawn-field.png` is the source image and `public/assets/dawn-field.webp` is the 131 KB production asset. It was generated on 2026-09-01 with the factory-image deployment from this prompt: “A dithered halftone risograph field map at dawn, abstract six-room route through pine hills, warm paper ground, dark ink, pine green, burnt orange and ochre print inks, empty area for interface, screenprint grain, no words, no logos, no watermark.” The sidecar JSON records the exact source. The footer discloses the generated illustration.

## Difficulty curve

Every daily run has exactly six rooms. Rooms 1–2 teach the selected tool against one hazard. Rooms 3–4 combine an enemy and obstacle. Room 5 offers a cash-out decision. Room 6 is a final chase where the exit is always reachable with careful tool use. Each day’s seed controls the map; tool offers rotate deterministically by a local player id, so choices differ while the route remains shared.
