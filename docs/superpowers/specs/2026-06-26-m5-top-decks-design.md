# M5 /top-decks Page — Design Spec

**Date:** 2026-06-26
**Milestone:** M5 — Top Decks Browser

---

## Goal

Expand `data/topdecks.json` to 20–30 curated entries and build a `/top-decks` page where users can browse, filter, inspect, and load top decks directly into the `/build` page.

---

## Data Layer

### `data/topdecks.json`

Expand from 5 stubs to 20–30 fully-specified entries. Each entry uses the existing `TopDeck` interface (no type changes needed):

```ts
interface TopDeck {
  name: string        // e.g. "Blue-Red Aggro Seed"
  colors: CardColor[] // max 2 colors
  strategy: Strategy  // aggro | midrange | control | attrition
  keyCards: string[]  // 2–4 key card IDs shown on the card thumbnail
  list: DeckEntry[]   // full deck list — REQUIRED for all M5 entries (main + resource)
  source: string      // "sample" | "tournament"
  date: string        // ISO date string
  placement?: number  // optional tournament placement
}
```

**Coverage target:** at least one deck per strategy per major color pair:
- Blue Aggro, Red Aggro, White Aggro
- Blue-Red Aggro, Blue-Green Midrange, Red-White Midrange
- Blue Control, White Control, Green Control
- White Attrition, Blue-White Attrition
- (fill remaining slots with tournament variants)

**Note:** Card IDs in `list` reference the full GCG card pool. The `/top-decks` drawer resolves names from `allCards`; unknown IDs display as the raw ID string — acceptable until `cards.json` is fully populated.

`lib/topdecks.ts` — no changes. `getTopDecks()` continues to work as-is.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `data/topdecks.json` | Expand to 20–30 complete entries |
| Create | `components/TopDeckCard.tsx` | Single deck card in the grid |
| Create | `components/TopDeckDrawer.tsx` | Detail drawer with full card list + load button |
| Create | `app/top-decks/page.tsx` | `/top-decks` page with filter bar + grid + drawer |
| Modify | `app/build/page.tsx` | Read `?deck=` URL param on mount and pre-fill deck |
| Modify | `components/Navbar.tsx` | Add Top Decks link |

All filtering logic lives in the page component (`useMemo`). No new `lib/` functions needed.

---

## `/top-decks` Page

### Layout

```
┌──────────────────────────────────────────────────────┐
│  顏色●●●●●   [Aggro] [Midrange] [Control] [Attrition] │  ← filter bar
├──────────────────────────────────────────────────────┤
│  TopDeckCard  TopDeckCard  TopDeckCard  TopDeckCard   │
│  TopDeckCard  TopDeckCard  TopDeckCard  ...           │
└──────────────────────────────────────────────────────┘
```

### Filter Bar

- **Color dots** — 5 colors, multi-select (no 2-color limit here — this is a filter, not a deck builder)
- **Strategy pills** — Aggro | Midrange | Control | Attrition, multi-select
- Filter logic: a deck shows if it matches ALL selected colors (deck.colors must include every selected color) AND matches ANY selected strategy (or no strategy filter active)
- Filters styled identically to `AutoBuildBar` (`bg-bg-surface border border-white/10 rounded-lg px-4 py-3`)
- Clearing all filters shows all decks

### `TopDeckCard` props

```ts
interface TopDeckCardProps {
  deck: TopDeck
  onClick: () => void
}
```

Card displays (top to bottom):
1. **Name** — `text-sm font-semibold text-white`
2. **Colors** — color dots (same `bg-game-*` tokens)
3. **Strategy badge** — pill label (Aggro / Midrange / Control / Attrition)
4. **Key cards** — up to 4 card IDs shown as small chips
5. **Stats row** — main deck total / resource total (computed from `deck.list`)
6. **Footer** — `source` + `date`

Clicking the card calls `onClick` to open the drawer.

### State

```ts
const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([])
const [activeTopDeck, setActiveTopDeck] = useState<TopDeck | null>(null)
```

Filtered decks computed with `useMemo`.

---

## `TopDeckDrawer`

Slides in from the right. Fixed width `w-96`. Closes on backdrop click or × button.

### Props

```ts
interface TopDeckDrawerProps {
  deck: TopDeck | null       // null = closed
  allCards: Card[]           // for name lookup
  onClose: () => void
  onLoad: (deck: TopDeck) => void
}
```

### Content

1. **Header** — name, colors, strategy badge, × close button
2. **Key cards** — labeled section
3. **Full card list** — grouped by type (Unit / Pilot / Command / Base / Resource), each line: `×N <card name or ID>`
   - Card name resolved from `allCards` by ID; falls back to raw ID if not found
4. **Footer** — source, date, placement (if present)
5. **Load button** — `「載入到 Build」` — calls `onLoad(deck)`

### Load behaviour

`onLoad` in the page:
```ts
function handleLoad(deck: TopDeck) {
  const params = new URLSearchParams({ deck: deck.name })
  router.push(`/build?${params}`)
}
```

---

## `/build` Page Modification

Add `useSearchParams` to read the `?deck=` param on mount:

```ts
const searchParams = useSearchParams()

useEffect(() => {
  const deckName = searchParams.get('deck')
  if (!deckName) return
  const found = topDecks.find(d => d.name === deckName)
  if (!found?.list) return

  // Split list into main and resource by card type
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const newMain: Record<string, number> = {}
  const newResource: Record<string, number> = {}

  for (const entry of found.list) {
    const card = cardMap.get(entry.id)
    if (card?.type === 'resource') {
      newResource[entry.id] = entry.count
    } else {
      newMain[entry.id] = entry.count
    }
  }

  setMainDeck(newMain)
  setResourceDeck(newResource)
  setSelectedColors(found.colors)
  setStrategy(found.strategy)
}, []) // runs once on mount only
```

URL param is consumed once on mount; the user can freely edit the deck afterwards.

**Note:** Since `/build/page.tsx` uses `useSearchParams`, the route requires a `<Suspense>` boundary. Wrap the page export or the component that uses `useSearchParams` in `<Suspense fallback={null}>` to satisfy Next.js App Router requirements.

---

## Navbar

Add Top Decks link between Build and Counter:

```
Cards | Builder | Build | Top Decks | Counter(disabled)
```

```tsx
<Link href="/top-decks" className={`text-sm transition-colors ${pathname === '/top-decks' ? 'text-white' : 'text-white/60 hover:text-white'}`}>
  Top Decks
</Link>
```

---

## What M5 Does NOT Include

- Card image thumbnails in drawer — deferred (no image CDN yet)
- Deck similarity score ("your deck is X% similar") — deferred to M6+
- User-submitted top decks / CMS — deferred (JSON-only for now)
- Pagination — 20–30 decks fit on one page without it
- Sorting (by date, placement) — deferred (YAGNI at this scale)
