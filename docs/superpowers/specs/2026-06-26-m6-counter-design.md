# M6 /counter Page — Design Spec

**Date:** 2026-06-26
**Milestone:** M6 — Counter Deck Builder

---

## Goal

Build `lib/counter.ts` and a `/counter` page so users can pick a target top deck and auto-fill a deck optimised to counter it. This completes Feature 2.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `lib/autofill.ts` | Export `greedyFill` and `cardFitsColors` (currently private) |
| Create | `lib/counter.ts` | Three pure functions: `getCounterStrategy`, `counterScore`, `counterAutofill` |
| Create | `lib/counter.test.ts` | Vitest tests for all three functions |
| Create | `components/CounterBuildBar.tsx` | Top bar for /counter page |
| Create | `app/counter/page.tsx` | /counter page |
| Modify | `components/TopDeckDrawer.tsx` | Add optional `onCounter` prop; render secondary footer button when set |
| Modify | `app/top-decks/page.tsx` | Pass `onCounter` to TopDeckDrawer → routes to /counter?target= |
| Modify | `components/Navbar.tsx` | Enable Counter link (replace `<span>` with `<Link>`) |

All counter logic is pure functions in `lib/counter.ts`. The page only calls and renders.

---

## Data Layer

### `ThreatProfile` (internal type in counter.ts)

```ts
interface ThreatProfile {
  dominantKeywords: Map<string, number>  // keyword → count across all deck entries
  meanUnitAP: number                      // mean AP of unit cards in target deck
  meanUnitHP: number                      // mean HP of unit cards in target deck
}
```

### `analyzeTargetDeck(targetDeck: TopDeck, allCards: Card[]): ThreatProfile`

Scans all entries in `targetDeck.list`, resolves each card from `allCards`, and computes:
- `dominantKeywords`: sum keyword occurrences, weighted by `entry.count`
- `meanUnitAP` / `meanUnitHP`: average over unit cards found in `allCards` (0 if none)

Internal helper — not exported.

---

## `lib/counter.ts`

### `getCounterStrategy(targetStrategy: Strategy): Strategy`

Counter-strategy lookup table:

| Target strategy | Recommended counter | Rationale |
|----------------|---------------------|-----------|
| `aggro` | `attrition` | High HP + grind out fast attacks |
| `midrange` | `control` | Disrupt the value engine |
| `control` | `aggro` | Apply pressure before they set up |
| `attrition` | `aggro` | Finish before they out-grind you |

### `counterScore(card: Card, strategy: Strategy, targetDeck: TopDeck, topDeckFreq: Map<string, number>, allCards: Card[]): number`

```
counterScore = scoreCard(card, strategy, topDeckFreq)   // base from lib/strategy.ts
             + keywordCounterBonus(card, profile)        // keyword targeting
```

**`keywordCounterBonus` rules** (profile = `analyzeTargetDeck(targetDeck, allCards)`):

| Target deck condition | Bonus applies to |
|----------------------|-----------------|
| Burst count ≥ 3 | Cards with `Barrier` keyword: +2 |
| Deploy count ≥ 3 | Cards with HP ≥ 4: +1 |
| `meanUnitAP` > 3 | Cards with `Barrier` keyword: +1, cards with HP ≥ 4: +1 |
| `targetDeck.strategy === 'aggro'` | Cards with `Blocker`, `Repair`, or `Recover` keyword: +2 |

Bonuses are cumulative. No cap.

### `counterAutofill(mainDeck, resourceDeck, allCards, topDecks, targetDeck, colors, strategy)`

Same greedy-fill algorithm as `autofill()`, replacing the scoring function with `counterScore`.

Imports `greedyFill` and `cardFitsColors` from `lib/autofill.ts` (now exported).

```ts
export function counterAutofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  targetDeck: TopDeck,
  colors: CardColor[],
  strategy: Strategy
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> }
```

Uses `buildTopDeckFrequency` (imported from autofill.ts — also exported) to keep the top-deck popularity signal.

**Note:** `buildTopDeckFrequency` must also be exported from `autofill.ts` so `counterAutofill` can use it.

---

## `lib/counter.test.ts`

```ts
describe('getCounterStrategy', () => {
  it('returns attrition for aggro')
  it('returns control for midrange')
  it('returns aggro for control')
  it('returns aggro for attrition')
})

describe('counterScore', () => {
  it('gives Barrier cards a higher score when target has many Burst cards')
  it('gives high-HP cards a higher score when target meanUnitAP > 3')
  it('gives Blocker cards a higher score when target is aggro')
})

describe('counterAutofill', () => {
  it('returns mainDeck with total ≤ 50')
  it('returns resourceDeck with total ≤ 10')
  it('only includes cards matching the selected colors')
})
```

---

## `components/CounterBuildBar`

### Props

```ts
interface CounterBuildBarProps {
  targetDeck: TopDeck | null
  allTopDecks: TopDeck[]
  selectedColors: CardColor[]
  strategy: Strategy | null
  suggestedStrategy: Strategy | null
  onTargetChange: (deck: TopDeck) => void
  onViewTarget: () => void
  onColorToggle: (c: CardColor) => void
  onStrategyChange: (s: Strategy) => void
  onCounterBuild: () => void
  disabled: boolean
}
```

### Visual layout (left → right, same container style as AutoBuildBar)

```
[目標: <name> ●● | 查看 | 變更]  ·  顏色●●●●●  ·  [Aggro*][Midrange]…  ·  [Counter Build →]
```

- **Target section**: when `targetDeck !== null`, show deck name + color dots + "查看" (calls `onViewTarget`) + "變更" (opens inline dropdown of `allTopDecks`)
- When no target: show `"選擇目標 Deck"` placeholder text
- **Color dots**: same `bg-game-*` tokens, multi-select for selecting your own deck colors. The 2-color limit is enforced by `toggleColor` in the page component (same pattern as `/build`), not inside the bar itself
- **Strategy pills**: same as AutoBuildBar. When `strategy === suggestedStrategy`, append `*` to the label
- **Counter Build button**: right-aligned via `ml-auto`, disabled when `disabled` prop is true (= no target, no colors, or no strategy)
- Styled identically to AutoBuildBar: `bg-bg-surface border border-white/10 rounded-lg px-4 py-3`

---

## `/counter` Page

### File: `app/counter/page.tsx`

### State

```ts
const [targetDeck, setTargetDeck] = useState<TopDeck | null>(null)
const [showTargetDrawer, setShowTargetDrawer] = useState(false)
const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
const [strategy, setStrategy] = useState<Strategy | null>(null)
const [suggestedStrategy, setSuggestedStrategy] = useState<Strategy | null>(null)
const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})
const [search, setSearch] = useState('')
```

### URL param: `?target=<deckName>`

Read on mount with `useSearchParams` (requires `<Suspense>` boundary, same pattern as `/build`):

```ts
useEffect(() => {
  const targetName = searchParams.get('target')
  if (!targetName) return
  const found = topDecks.find(d => d.name === targetName)
  if (!found) return
  setTargetDeck(found)
  const suggested = getCounterStrategy(found.strategy)
  setSuggestedStrategy(suggested)
  setStrategy(suggested)
}, [])
```

### `handleTargetChange(deck: TopDeck)`

```ts
function handleTargetChange(deck: TopDeck) {
  setTargetDeck(deck)
  const suggested = getCounterStrategy(deck.strategy)
  setSuggestedStrategy(suggested)
  setStrategy(suggested)
  setMainDeck({})
  setResourceDeck({})
}
```

### `handleCounterBuild`

```ts
function handleCounterBuild() {
  if (!targetDeck || selectedColors.length === 0 || !strategy) return
  const result = counterAutofill(mainDeck, resourceDeck, allCards, topDecks, targetDeck, selectedColors, strategy)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
}
```

### Color toggle

Same 2-color limit as `/build`:

```ts
function toggleColor(color: CardColor) {
  setSelectedColors(prev => {
    if (prev.includes(color)) return prev.filter(c => c !== color)
    if (prev.length >= 2) return prev
    return [...prev, color]
  })
}
```

### Page layout

Identical to `/build` layout with two substitutions:
1. `AutoBuildBar` → `CounterBuildBar`
2. `handleAutoBuild` → `handleCounterBuild`

Plus: `TopDeckDrawer` mounted with `deck={showTargetDrawer ? targetDeck : null}` and `onLoad` set to no-op (loading into /build from here is out of scope — use /top-decks for that).

Split into `CounterPageContent` + `CounterPage` wrapper (same Suspense pattern as `/build`).

---

## Modified Files

### `lib/autofill.ts`

Export three previously-private helpers:

```ts
export function cardFitsColors(card: Card, colors: CardColor[]): boolean { ... }
export function greedyFill(...): Record<string, number> { ... }
export function buildTopDeckFrequency(...): Map<string, number> { ... }
```

No logic changes — only visibility change.

### `components/TopDeckDrawer.tsx`

Add an optional `onCounter` prop to the existing interface:

```ts
interface TopDeckDrawerProps {
  deck: TopDeck | null
  allCards: Card[]
  onClose: () => void
  onLoad: (deck: TopDeck) => void
  onCounter?: (deck: TopDeck) => void  // NEW — optional, only rendered when set
}
```

When `onCounter` is provided, render a secondary button below the "載入到 Build" button:

```tsx
{onCounter && (
  <button
    type="button"
    onClick={() => onCounter(deck)}
    className="w-full rounded-lg border border-white/20 py-2 text-sm font-semibold text-white/50 hover:text-white/80 hover:border-white/40 transition-colors mt-2"
  >
    Counter 此 Deck
  </button>
)}
```

### `app/top-decks/page.tsx`

Pass `onCounter` to `TopDeckDrawer`:

```tsx
<TopDeckDrawer
  deck={activeTopDeck}
  allCards={allCards}
  onClose={() => setActiveTopDeck(null)}
  onLoad={handleLoad}
  onCounter={(deck) => {
    const params = new URLSearchParams({ target: deck.name })
    router.push(`/counter?${params.toString()}`)
  }}
/>
```

### `components/Navbar.tsx`

Replace the disabled Counter span:

```tsx
// before
<span className="text-sm text-white/20 cursor-not-allowed">Counter</span>

// after
<Link
  href="/counter"
  className={`text-sm transition-colors ${pathname === '/counter' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  Counter
</Link>
```

---

## What M6 Does NOT Include

- Win rate statistics or confidence scores — heuristic approximations only; never promise accuracy
- Matchup simulation — deferred to M7+
- User-submitted counter reports — deferred (JSON-only for now)
- "Your deck is X% similar to a counter" — deferred to M7+
