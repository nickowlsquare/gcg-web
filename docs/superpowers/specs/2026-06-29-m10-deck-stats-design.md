# M10 Per-Deck Stats — Design Spec

**Date:** 2026-06-29
**Milestone:** M10 — Per-Deck Match Statistics

---

## Goal

Link match history records (M8) to saved decks (M9). When a user loads a saved deck into `/build`, it becomes the "active deck". Match results recorded in `/history` are tagged with that deck's ID. The `/decks` page shows per-deck win/loss stats and per-opponent-strategy breakdowns.

No backend required. All state in localStorage.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `types/card.ts` | Add `deckId?: string` to `MatchResult` |
| Create | `lib/deckStats.ts` | Pure functions: `getDeckStats` |
| Create | `lib/deckStats.test.ts` | Vitest tests |
| Create | `hooks/useActiveDeck.ts` | localStorage hook for active deck ID |
| Modify | `app/build/page.tsx` | Set active deck on `?saved=` load; show banner |
| Modify | `app/history/page.tsx` | Include `deckId` when recording match |
| Modify | `app/decks/page.tsx` | Show 「使用中」badge + stats row per deck |

All logic is pure functions in `lib/deckStats.ts`. Hooks own storage. Pages only call and render.

---

## Data Layer

### `types/card.ts` — extend `MatchResult`

```ts
export interface MatchResult {
  id: string
  date: string
  myColors: CardColor[]
  myStrategy: Strategy
  opponentStrategy: Strategy
  result: 'win' | 'loss'
  deckId?: string   // optional — existing records without this field remain valid
}
```

---

## `lib/deckStats.ts`

### Types

```ts
export interface DeckStats {
  wins: number
  losses: number
  winRate: number   // 0–1, e.g. 0.7 for 70%
  byStrategy: Partial<Record<Strategy, { wins: number; losses: number }>>
}
```

### Export

```ts
export function getDeckStats(
  deckId: string,
  history: MatchResult[]
): DeckStats
```

**Behaviour:**
- Filters `history` to entries where `r.deckId === deckId`
- Counts `wins` and `losses` from `r.result`
- Builds `byStrategy` keyed on `r.opponentStrategy`
- `winRate = wins / (wins + losses)`, or `0` when no matches
- Returns `{ wins: 0, losses: 0, winRate: 0, byStrategy: {} }` for unknown `deckId`
- Does not mutate input

---

## `lib/deckStats.test.ts`

Fixture: a small `history` array with 5 records — mix of `deckId: 'deck-1'`, `deckId: 'deck-2'`, and `undefined`.

```ts
describe('getDeckStats', () => {
  it('returns zeros for unknown deckId')
  it('counts wins and losses correctly')
  it('computes winRate as a fraction 0–1')
  it('builds byStrategy breakdown from opponentStrategy')
  it('ignores records with different deckId')
  it('ignores records with undefined deckId')
  it('does not mutate the input history array')
})
```

---

## `hooks/useActiveDeck.ts`

```ts
'use client'

const STORAGE_KEY = 'gcg-active-deck'

export function useActiveDeck() {
  const [activeDeckId, setId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
  })

  const setActiveDeckId = (id: string) => {
    setId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const clearActiveDeck = () => {
    setId(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { activeDeckId, setActiveDeckId, clearActiveDeck }
}
```

Only this hook touches `localStorage` for the active deck key. `lib/deckStats.ts` is pure and storage-agnostic.

---

## `/build` Integration

```ts
// app/build/page.tsx
const { activeDeckId, setActiveDeckId } = useActiveDeck()

// Extend existing ?saved= useEffect:
useEffect(() => {
  const id = searchParams.get('saved')
  if (!id) return
  const found = savedDecks.find(d => d.id === id)
  if (!found) return
  setMainDeck(found.mainDeck)
  setResourceDeck(found.resourceDeck)
  setSelectedColors(found.colors)
  setStrategy(found.strategy)
  setActiveDeckId(found.id)   // ← new: set as active deck
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

**Active deck banner** — rendered below `<AutoBuildBar>`, only when a linked deck exists:

```tsx
{(() => {
  const activeDeck = activeDeckId ? savedDecks.find(d => d.id === activeDeckId) : null
  return activeDeck ? (
    <div className="flex items-center gap-2 rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-4 py-2 text-sm">
      <span className="text-accent-gold">●</span>
      <span className="text-white/60">使用中：</span>
      <span className="font-medium text-white">{activeDeck.name}</span>
      <span className="ml-auto text-white/30 text-xs">記錄比賽將自動關聯此牌組</span>
    </div>
  ) : null
})()}
```

---

## `/history` Integration

```ts
// app/history/page.tsx
const { activeDeckId } = useActiveDeck()

// When recording a match result:
add({
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  myColors,
  myStrategy,
  opponentStrategy,
  result,
  deckId: activeDeckId ?? undefined,   // ← new field
})
```

No UI change to the recording flow — `deckId` is silently included.

---

## `/decks` Integration

```ts
// app/decks/page.tsx
const { history } = useMatchHistory()
const { activeDeckId } = useActiveDeck()
```

**Per-deck card changes:**

1. **「使用中」badge** next to deck name:
```tsx
{activeDeckId === deck.id && (
  <span className="rounded border border-accent-gold/50 bg-accent-gold/10 px-1.5 py-0.5 text-[10px] text-accent-gold">
    使用中
  </span>
)}
```

2. **Stats row** below the existing metadata line (border-top separator):
```tsx
{(() => {
  const stats = getDeckStats(deck.id, history)
  const total = stats.wins + stats.losses
  if (total === 0) return (
    <p className="text-xs text-white/30">未有比賽記錄</p>
  )
  return (
    <div className="text-xs text-white/50">
      <span className="text-green-400">{stats.wins}勝</span>
      {' '}<span className="text-red-400">{stats.losses}負</span>
      {' '}· <span className="text-accent-gold">{Math.round(stats.winRate * 100)}%</span>
      {Object.entries(stats.byStrategy).map(([strat, s]) => (
        <span key={strat}> · vs {strat}: {s.wins}W {s.losses}L</span>
      ))}
    </div>
  )
})()}
```

---

## What M10 Does NOT Include

- Clearing/resetting per-deck stats independently of match history
- Renaming the active deck association after the fact
- Showing stats in `/history` page (stays as-is — flat list by date)
- Multiple "active decks" simultaneously
