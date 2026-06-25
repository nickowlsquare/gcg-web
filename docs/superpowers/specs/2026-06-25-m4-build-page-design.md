# M4 /build Page — Auto Deck Builder Design Spec

**Date:** 2026-06-25
**Milestone:** M4 — /build Page (Feature 1 Complete)

---

## Goal

Build the `/build` page — an auto deck-builder that wires the `autofill` engine (M3) into a full UI. Users select colors and strategy, click Auto Build to fill the deck, then manually adjust if needed.

---

## Layout

Identical to `/builder` with an `AutoBuildBar` added at the top of the left panel:

```
┌─────────────────────────────────────────────┐
│  [AutoBuildBar] 顏色●● 策略▼  [Auto Build]  │
├───────────────────────────┬─────────────────┤
│  Search                   │                 │
│  FilterSidebar  CardGrid  │   DeckPanel     │
│                           │                 │
└───────────────────────────┴─────────────────┘
```

---

## Files

| Action | File | Change |
|--------|------|--------|
| Create | `data/topdecks.json` | 5 sample TopDeck entries |
| Create | `lib/topdecks.ts` | `getTopDecks(): TopDeck[]` |
| Create | `components/AutoBuildBar.tsx` | Color + strategy selector + Auto Build button |
| Create | `app/build/page.tsx` | New /build page |
| Modify | `components/Navbar.tsx` | Add Build link between Builder and Counter |

---

## data/topdecks.json

5 sample TopDecks — one per strategy (plus one dual-color midrange). Card IDs drawn from existing `data/cards.json`.

```json
[
  {
    "name": "Blue Aggro",
    "colors": ["blue"],
    "strategy": "aggro",
    "keyCards": ["GD01-018", "GD01-008"],
    "list": [
      { "id": "GD01-018", "count": 4 },
      { "id": "GD01-008", "count": 4 },
      { "id": "GD01-102", "count": 4 }
    ],
    "source": "sample",
    "date": "2026-06-01"
  },
  {
    "name": "Red Aggro",
    "colors": ["red"],
    "strategy": "aggro",
    "keyCards": ["ST03-001", "GD03-092"],
    "list": [
      { "id": "ST03-001", "count": 4 },
      { "id": "GD03-092", "count": 4 },
      { "id": "GD01-094", "count": 4 }
    ],
    "source": "sample",
    "date": "2026-06-01"
  },
  {
    "name": "Blue Control",
    "colors": ["blue"],
    "strategy": "control",
    "keyCards": ["GD01-102"],
    "list": [
      { "id": "GD01-102", "count": 4 },
      { "id": "GD01-008", "count": 4 }
    ],
    "source": "sample",
    "date": "2026-06-01"
  },
  {
    "name": "White Attrition",
    "colors": ["white"],
    "strategy": "attrition",
    "keyCards": ["ST01-014", "ST01-016"],
    "list": [
      { "id": "ST01-007", "count": 4 },
      { "id": "ST01-011", "count": 4 },
      { "id": "ST01-014", "count": 4 },
      { "id": "ST01-016", "count": 4 }
    ],
    "source": "sample",
    "date": "2026-06-01"
  },
  {
    "name": "Blue-Green Midrange",
    "colors": ["blue", "green"],
    "strategy": "midrange",
    "keyCards": ["GD01-018", "ST03-006"],
    "list": [
      { "id": "GD01-018", "count": 4 },
      { "id": "ST03-006", "count": 4 },
      { "id": "ST02-015", "count": 4 }
    ],
    "source": "sample",
    "date": "2026-06-01"
  }
]
```

---

## lib/topdecks.ts

```ts
import topDecksData from '../data/topdecks.json'
import type { TopDeck } from '../types/card'

export function getTopDecks(): TopDeck[] {
  return topDecksData as TopDeck[]
}
```

---

## components/AutoBuildBar.tsx

### Props

```ts
interface AutoBuildBarProps {
  selectedColors: CardColor[]
  strategy: Strategy | null
  onColorToggle: (color: CardColor) => void
  onStrategyChange: (strategy: Strategy) => void
  onAutoBuild: () => void
  disabled: boolean  // true when strategy is null or selectedColors is empty
}
```

### Appearance

One dark horizontal bar (`bg-bg-surface border border-white/10 rounded-lg px-4 py-3`), left→right:

1. **Colors** — 5 color dots (same palette as FilterSidebar), max 2 selected. Selected = full opacity + ring. Clicking a third color deselects the oldest.
2. **Strategy tabs** — `Aggro | Midrange | Control | Attrition` pill buttons. One selected at a time.
3. **Auto Build button** — right-aligned, `border border-accent-gold/50 text-accent-gold`. Disabled (muted) when `disabled` is true.

### Color limit enforcement

When user tries to select a 3rd color, show no feedback — simply ignore the click (the button does nothing when `selectedColors.length >= 2` and the color is not already selected).

---

## app/build/page.tsx

### State

```ts
// Identical to /builder
const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})
const [search, setSearch] = useState('')
const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])

// M4 new
const [strategy, setStrategy] = useState<Strategy | null>(null)
```

### Data loading

```ts
const allCards = useMemo(() => getAllCards(), [])
const topDecks = useMemo(() => getTopDecks(), [])
```

### Auto Build handler

```ts
function handleAutoBuild() {
  if (!strategy || selectedColors.length === 0) return
  const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
}
```

Auto Build fills empty slots only — it never removes existing cards. Users may pre-load key cards before clicking Auto Build.

### Color toggle (with 2-color limit)

```ts
function toggleColor(color: CardColor) {
  setSelectedColors(prev => {
    if (prev.includes(color)) return prev.filter(c => c !== color)
    if (prev.length >= 2) return prev  // ignore 3rd color
    return [...prev, color]
  })
}
```

Note: `selectedColors` in AutoBuildBar and `selectedColors` used as the card browser filter are the **same state**. Selecting blue in AutoBuildBar also filters the card browser to blue cards.

### Layout

```tsx
<div className="flex flex-col gap-4">
  <AutoBuildBar
    selectedColors={selectedColors}
    strategy={strategy}
    onColorToggle={toggleColor}
    onStrategyChange={setStrategy}
    onAutoBuild={handleAutoBuild}
    disabled={!strategy || selectedColors.length === 0}
  />

  <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
    {/* Left: card browser (identical to /builder) */}
    {/* Right: DeckPanel (identical to /builder) */}
  </div>
</div>
```

---

## components/Navbar.tsx

Add Build link between Builder and Counter:

```tsx
<Link href="/build" className={...}>Build</Link>
```

---

## What M4 Does NOT Include

- Reset deck button — deferred (YAGNI)
- TopDeck selector UI — deferred
- Deck save/export — deferred to M5+
- TopDeck display ("your deck is similar to X") — deferred
- Unit tests for page components — UI assembly, no new business logic
