# M7 /tier-list Page — Design Spec

**Date:** 2026-06-26
**Milestone:** M7 — Meta Snapshot + Tier List

---

## Goal

Build `lib/meta.ts` and a `/tier-list` page so users can see which decks are currently top-tier and get a snapshot of the competitive meta. Adds "Tier List" to the navbar.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `types/card.ts` | Add `tier: 'S' \| 'A' \| 'B' \| 'C'` to `TopDeck` |
| Modify | `data/topdecks.json` | Add `tier` field to all 20 decks (manual curation) |
| Create | `lib/meta.ts` | One exported function: `getMetaSnapshot` |
| Create | `lib/meta.test.ts` | 4 Vitest tests for `getMetaSnapshot` |
| Create | `components/MetaSnapshot.tsx` | Distribution bars display component |
| Create | `app/tier-list/page.tsx` | `/tier-list` page |
| Modify | `components/Navbar.tsx` | Add "Tier List" link after Counter |

All meta logic is a pure function in `lib/meta.ts`. The page only calls and renders.

---

## Data Layer

### `types/card.ts` — extend `TopDeck`

Add one field to the existing `TopDeck` interface:

```ts
interface TopDeck {
  // ... existing fields ...
  tier: 'S' | 'A' | 'B' | 'C'
}
```

### `data/topdecks.json` — manual tier curation

Add `"tier"` to every deck entry. Suggested initial assignment (adjust freely):

| Tier | Decks |
|------|-------|
| S | Blue Control, White Attrition, Blue-White Attrition |
| A | Blue Aggro, Red Burst, Purple Control, Blue-Purple Control, White Control |
| B | Green Midrange, Blue-Green Midrange, Red Aggro, Red-White Midrange, Green-White Midrange, Blue Midrange, Red Midrange |
| C | White Aggro, Green Control, Red-Green Aggro, White-Purple Attrition, Blue-Red Aggro |

---

## `lib/meta.ts`

### Types

```ts
export interface MetaSnapshot {
  dominantStrategy: Strategy
  dominantColor: CardColor
  strategyDist: Record<Strategy, number>   // proportion 0–1, sums to 1.0
  colorDist: Record<CardColor, number>     // proportion 0–1, can sum > 1 (multi-color decks)
  totalDecks: number
}
```

### `getMetaSnapshot(topDecks: TopDeck[]): MetaSnapshot`

Computes meta statistics from the deck corpus:

- **`strategyDist`**: for each strategy, count how many decks use it, divide by `totalDecks`. Sums to exactly 1.0.
- **`colorDist`**: for each color, count how many decks include it (a Blue-White deck increments both blue and white), divide by `totalDecks`. Can sum > 1 since multi-color decks contribute to multiple colors.
- **`dominantStrategy`**: strategy with the highest proportion in `strategyDist`.
- **`dominantColor`**: color with the highest proportion in `colorDist`.
- **`totalDecks`**: `topDecks.length`.

Returns a zero-distribution snapshot with `dominantStrategy: 'aggro'` and `dominantColor: 'blue'` if `topDecks` is empty (defensive default).

---

## `lib/meta.test.ts`

Uses a minimal hand-crafted fixture (not the full 20-deck JSON) for speed and determinism.

```ts
describe('getMetaSnapshot', () => {
  it('returns correct dominantStrategy')
  it('returns correct dominantColor')
  it('strategyDist values sum to 1.0')
  it('totalDecks equals input array length')
})
```

Fixture: 4 decks — 2 control (blue), 1 aggro (red), 1 control (white). Expected: dominantStrategy = 'control', dominantColor = 'blue' (appears in 2 decks, white and red appear in 1 each).

---

## `components/MetaSnapshot.tsx`

### Props

```ts
interface MetaSnapshotProps {
  snapshot: MetaSnapshot
}
```

### Visual layout

Two side-by-side distribution bar groups, styled dark (matching site theme):

```
┌─────────────────────────────────────────────────────┐
│  META SNAPSHOT                                      │
│                                                     │
│  STRATEGY                    COLOR                  │
│  Control  ████████░░  35%   Blue   ████████░░  40%  │
│  Aggro    ██████░░░░  30%   White  █████░░░░░  25%  │
│  Midrange ████░░░░░░  20%   Red    ████░░░░░░  20%  │
│  Attrition███░░░░░░░  15%   Green  ███░░░░░░░  15%  │
└─────────────────────────────────────────────────────┘
```

- Container: `bg-bg-surface border border-white/10 rounded-lg px-4 py-3`
- Section label: `text-[10px] font-semibold uppercase tracking-widest text-accent-gold`
- Bar track: `bg-white/10 rounded-full h-1.5`
- Bar fill: gold (`bg-accent-gold`) for strategy, color-matched (`bg-game-blue` etc.) for colors
- Percentage text: `text-xs text-white/40` right-aligned

---

## `/tier-list` Page

### File: `app/tier-list/page.tsx`

### State

```ts
const [activeDeck, setActiveDeck] = useState<TopDeck | null>(null)
```

No URL params, no filters — tier list is static display.

### Data

```ts
const topDecks = getTopDecks()
const snapshot = getMetaSnapshot(topDecks)
const TIERS = ['S', 'A', 'B', 'C'] as const
```

### Tier grouping

```ts
const byTier = Object.fromEntries(
  TIERS.map(t => [t, topDecks.filter(d => d.tier === t)])
) as Record<typeof TIERS[number], TopDeck[]>
```

### Page layout

```
<MetaSnapshot snapshot={snapshot} />

[S tier row]  ← gold label + gold-bordered chips
[A tier row]  ← silver label + white/20 chips
[B tier row]  ← bronze label + white/10 chips
[C tier row]  ← muted label + white/10 chips

<TopDeckDrawer deck={activeDeck} ... />
```

### Tier row markup

Each row:
- Tier label: `text-2xl font-black` colored by tier (S=`text-yellow-400`, A=`text-slate-300`, B=`text-amber-600`, C=`text-white/30`)
- Deck chips: `<button>` styled as small pill with deck name + color dots
- Chip click: `setActiveDeck(deck)` → opens drawer
- Empty tier: render row with label only, no chips (graceful)

### TopDeckDrawer integration

```tsx
<TopDeckDrawer
  deck={activeDeck}
  allCards={allCards}
  onClose={() => setActiveDeck(null)}
  onLoad={() => {}}                         // no-op: use /top-decks for that
  onCounter={(deck) => {
    const params = new URLSearchParams({ target: deck.name })
    router.push(`/counter?${params.toString()}`)
  }}
/>
```

"Counter 此 Deck" button navigates to `/counter?target=<name>`.
"載入到 Build" button is no-op (loading decks is /top-decks's job).

---

## `components/Navbar.tsx`

Add "Tier List" link after Counter:

```tsx
// before
<Link href="/counter" ...>Counter</Link>

// after
<Link href="/counter" ...>Counter</Link>
<Link
  href="/tier-list"
  className={`text-sm transition-colors ${pathname === '/tier-list' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  Tier List
</Link>
```

---

## What M7 Does NOT Include

- Win rate statistics or probability data — tier assignments are heuristic/editorial
- User voting or community tier lists — deferred to M8+
- Historical meta tracking (meta over time) — JSON is a snapshot, not a time series
- Filtering the tier list by color or strategy — plain display only
