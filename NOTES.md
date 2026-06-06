# USA Study Guide — Build Notes

## Goal
Single-file `index.html` GitHub Pages quiz game (no build step).
Enable GitHub Pages on **main** branch after merging.

## User Requirements (priority order — user words override markdown spec)

1. **SVG-based USA map** (accurate outlines) — no photo/jpg
2. **Mountain ranges** → rendered as triangle symbols on map
3. **Rivers** → rendered as lines on map
4. **Water bodies** (lakes, oceans, gulf) → outlined/filled shapes
5. **3 attempts** per question before revealing answer
6. After 3 wrong guesses → highlight the correct location on the map
7. Score tracking (show score during quiz and on results screen)
8. Persist top score (localStorage is fine)
9. Features must match exactly what is on the test (list below)
10. Spanish names throughout (matches classroom test)

## Features List (from test — do not add/remove)

### Oceans & Straits
| id | Name | Category |
|----|------|----------|
| 1  | Océano Pacífico | ocean |
| 2  | Océano Atlántico | ocean |
| 3  | Golfo de México | ocean |
| 4  | Estrecho de Bering | ocean |

### Great Lakes
| id | Name | Category |
|----|------|----------|
| 5  | Lago Superior | water |
| 6  | Lago Huron | water |
| 7  | Lago Michigan | water |
| 8  | Lago Ontario | water |
| 9  | Lago Erie | water |

### Rivers
| id | Name | Category |
|----|------|----------|
| 10 | Río Mississippi | river |
| 11 | Río Missouri | river |
| 12 | Río Ohio | river |
| 13 | Río Colorado | river |
| 14 | Río Grande | river |
| 15 | Río Minnesota | river |
| 16 | Río San Lorenzo | river |

### Mountains & Land Features
| id | Name | Category |
|----|------|----------|
| 17 | Montañas Rocosas | mountain |
| 18 | Montañas de Sierra Nevada | mountain |
| 19 | Montes Apalaches | mountain |
| 20 | Desierto de Mojave | land |
| 21 | Gran Cuenca | land |
| 22 | Grandes Llanuras | land |
| 23 | Gran Cañón | land |
| 24 | Meseta de Ozark | land |
| 25 | Monte McKinley (Denali) | mountain |
| 26 | Mauna Kea | mountain |
| 27 | Monte Rushmore | mountain |

## Map Design

- Use an **inline SVG** of the USA (continental + Alaska inset + Hawaii inset)
- SVG paths can be sourced from Natural Earth / US Census simplified outlines
- Mountain ranges: draw `▲` triangle symbols at correct lat/lon positions
- Rivers: draw `<polyline>` or `<path>` strokes following actual river courses
- Great Lakes: filled/outlined `<path>` shapes
- Oceans / Gulf: labeled text regions or lightly shaded areas outside the coastline
- Color scheme: dark background (`#0f1923`), gold accent (`#f5c518`)

## Quiz Logic

- Shuffle all 27 features randomly each game
- For each question: player clicks somewhere on the map
  - Correct click → green highlight, +100 points, move to next
  - Wrong click (attempt 1 of 3) → red flash, "Incorrecto, intenta de nuevo"
  - Wrong click (attempt 2 of 3) → red flash, "Último intento"
  - Wrong click (attempt 3 of 3) → reveal correct location in gold/green, show name, move to next (0 points for this question)
- Score = 100 × correct answers (max 2700)
- After all 27: show results screen with %, correct count, top score

## Click Detection

Since features are SVG shapes/lines/triangles rather than just points:
- Mountains (triangles): click within ~30px radius of the triangle center
- Rivers (lines): click within ~15px of the line path
- Lakes/Water: click inside the filled SVG shape
- Oceans/Land regions: click inside labeled bounding region

## Screens

1. **Title Screen** — dark, "MAPA FÍSICO" in gold, "JUGAR →" button, show top score if set
2. **Game Screen** — map (left/main) + sidebar (right 270px)
   - Sidebar: current feature name, hint, category badge, answer history
   - Bottom bar: feedback message + "SIGUIENTE →" button
   - Top bar: logo, "Pregunta X/27", score
3. **Results Screen** — % score (green ≥80%, gold ≥55%, red <55%), stats, top score update, replay/menu buttons

## Design Tokens

```css
--gold:    #f5c518;
--correct: #22c55e;
--wrong:   #ef4444;
--bg:      #0f1923;
--card:    #172030;
--border:  #243448;
--text:    #e2eef8;
--dim:     #5580a0;
```

Fonts (Google Fonts CDN): Bebas Neue (headings), Space Mono (labels/badges), Nunito (body/hints)

## Testing Requirements

- Include a `test.html` or `test.js` (vanilla, no frameworks) that:
  - Verifies all 27 features render on the map
  - Simulates clicks (correct + wrong) and checks state transitions
  - Verifies 3-attempt logic (3 wrong → reveal)
  - Verifies score increments correctly
  - Can be run headlessly with `node test.js` or opened in browser
- Commit test suite alongside `index.html`

## File Structure

```
index.html      ← entire app (HTML + inline CSS + inline JS)
test.html       ← browser-runnable test suite (or test.js for node)
NOTES.md        ← this file
README.md       ← brief description
```

## GitHub Pages

- Merge feature branch → main
- Enable GitHub Pages: Settings → Pages → Source: main branch, / (root)
- No build step needed — pure static HTML

## Branch

Development branch: `claude/usa-map-quiz-game-gxorF`
