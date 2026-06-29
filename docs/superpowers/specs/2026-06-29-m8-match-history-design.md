# M8 /history Page — Design Spec

**Date:** 2026-06-29
**Milestone:** M8 — Match Result Feedback Loop / Weight Learning

---

## Goal

Let users record win/loss results after playing with a generated deck. Winning top decks are fed back into the autofill frequency map so future deck suggestions improve over time. Data persists in `localStorage`. No backend required.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `types/card.ts` | Add `MatchResult` interface |
| Create | `lib/history.ts` | Pure functions: `addMatchResult`, `getWinRate`, `buildLearnedTopDecks` |
| Create | `lib/history.test.ts` | 5 Vitest tests |
| Create | `hooks/useMatchHistory.ts` | localStorage read/write hook |
| Modify | `lib/autofill.ts` | Accept optional `matchHistory` param; merge learned top decks |
| Modify | `lib/autofill.test.ts` | Test learning integration |
| Create | `app/history/page.tsx` | `/history` page — left/right split layout |
| Modify | `components/Navbar.tsx` | Add "History" link after Tier List |
| Modify | `app/build/page.tsx` | Pass `matchHistory` from hook to `autofill()` |
| Modify | `app/counter/page.tsx` | Pass `matchHistory` from hook to `buildCounterDeck()` |

All learning logic is pure functions in `lib/history.ts`. The hook owns storage. Pages only call and render.

---

## Data Layer

### `types/card.ts` — new interface

```ts
export interface MatchResult {
  id: string              // crypto.randomUUID()
  date: string            // ISO 8601
  deckName: string        // top deck name or custom name
  deckIsTopDeck: boolean  // true if deckName matches a TopDeck.name
  outcome: 'win' | 'loss'
  opponentDeck: string | null  // top deck name; null if not recorded
  notes: string           // free text; empty string if not provided
}
```

---

## `lib/history.ts`

### Exports

```ts
export function addMatchResult(
  history: MatchResult[],
  entry: MatchResult
): MatchResult[]
// Returns new array with entry prepended (newest first)

export function getWinRate(
  history: MatchResult[]
): { wins: number; losses: number; rate: number }
// rate = wins / (wins + losses), range 0–1, or 0 if no results
// Page displays as Math.round(rate * 100) + '%'

export function buildLearnedTopDecks(
  history: MatchResult[],
  allTopDecks: TopDeck[]
): TopDeck[]
// Filters history for wins where deckIsTopDeck === true.
// For each win, finds the matching TopDeck by deckName and
// appends a copy to the returned array.
// A deck won 3 times → 3 copies in output → higher frequency weight.
```

### `buildLearnedTopDecks` behaviour

- Returns `[]` if `history` is empty or has no qualifying wins
- Does not mutate `allTopDecks`
- Matches by `deckName === topDeck.name` (exact, case-sensitive)
- Custom-named decks (`deckIsTopDeck === false`) are excluded — they have no card list

---

## `lib/history.test.ts`

Fixture: 4 results — 2 wins (both "Blue Control", top deck), 1 win ("My Custom Deck", not top deck), 1 loss ("Blue Control").

```ts
describe('addMatchResult', () => {
  it('prepends entry to history')
})

describe('getWinRate', () => {
  it('returns correct wins/losses/rate')
  it('returns rate 0 for empty history')
})

describe('buildLearnedTopDecks', () => {
  it('returns one copy per qualifying win')
  it('excludes custom-named decks (deckIsTopDeck false)')
})
```

---

## `hooks/useMatchHistory.ts`

```ts
const STORAGE_KEY = 'gcg-match-history'

export function useMatchHistory() {
  const [history, setHistory] = useState<MatchResult[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MatchResult[]) : []
  })

  const add = (entry: MatchResult) => {
    const next = addMatchResult(history, entry)
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const clear = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { history, add, clear }
}
```

Only this hook touches `localStorage`. `lib/history.ts` is pure and storage-agnostic.

---

## `lib/autofill.ts` — signature change

```ts
export function autofill(
  cards: Card[],
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[],
  matchHistory?: MatchResult[]   // optional — omit for original behaviour
): DeckEntry[]
```

Inside `autofill()`:

```ts
const learnedDecks = matchHistory
  ? buildLearnedTopDecks(matchHistory, topDecks)
  : []
const allDecks = [...topDecks, ...learnedDecks]
const topDeckFrequency = buildTopDeckFrequency(allDecks, strategy, colors)
```

`counterAutofill()` in `lib/counter.ts` receives the same optional param and passes it through to the shared `buildTopDeckFrequency` call.

---

## `/history` Page

### File: `app/history/page.tsx`

`'use client'` — uses `useMatchHistory` hook and local form state.

### State

```ts
const { history, add, clear } = useMatchHistory()
const topDecks = useMemo(() => getTopDecks(), [])
const [formOpen, setFormOpen] = useState(false)

// Form fields
const [deckName, setDeckName] = useState('')
const [isCustom, setIsCustom] = useState(false)
const [outcome, setOutcome] = useState<'win' | 'loss' | null>(null)
const [opponentDeck, setOpponentDeck] = useState('')
const [notes, setNotes] = useState('')
```

### Layout — left/right split

```
┌──────────────────────────────────────────────────────┐
│  左欄 (flex 1.5)                右欄 (flex 1)        │
│                                                      │
│  [+ 記錄新對局]                  勝率統計卡片          │
│                                                      │
│  [展開表單 when formOpen]        學習狀態卡片          │
│                                                      │
│  對局 Feed (newest first)                            │
│  ┌──────────────────────────┐                       │
│  │ 勝/負  牌組名稱           │                       │
│  │ vs 對手  日期             │                       │
│  │ 備注文字                  │                       │
│  └──────────────────────────┘                       │
└──────────────────────────────────────────────────────┘
```

### 右欄卡片

**勝率卡片:**
- `getWinRate(history)` → 顯示 `{rate}%  {wins}W / {losses}L`
- history 為空時顯示「未有對局記錄」

**學習狀態卡片:**
- 計算 `buildLearnedTopDecks(history, topDecks).length`
- 顯示「已從 N 場勝局學習」（N = 學習到嘅副本數量）
- N = 0 時顯示「尚未有學習資料」

### 表單邏輯

1. 「你的牌組」— `<select>` 列出所有 top deck names，最後一項係「自訂名稱…」
2. 揀「自訂名稱…」→ 顯示 `<input>` 輸入，`deckIsTopDeck = false`
3. 揀 top deck → `deckIsTopDeck = true`
4. 「對手牌組」— `<select>` 列出 top deck names + 空選項（可不填）
5. 勝/負 toggle buttons
6. textarea 備注（可選）
7. 確認 → `add({ id: crypto.randomUUID(), date: new Date().toISOString(), ... })`，表單收起 reset

### 空狀態

History 為空時，左欄顯示「未有對局記錄。記錄第一場對局吧！」

---

## `components/Navbar.tsx`

Add "History" link after "Tier List":

```tsx
<Link
  href="/history"
  className={`text-sm transition-colors ${pathname === '/history' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  History
</Link>
```

---

## Integration — `/build` and `/counter` pages

Both pages call `useMatchHistory()` and pass `history` to the generation function:

```ts
// app/build/page.tsx
const { history } = useMatchHistory()
// ...
const deck = autofill(cards, topDecks, strategy, colors, history)

// app/counter/page.tsx
const { history } = useMatchHistory()
// ...
const deck = counterAutofill(cards, topDecks, targetDeck, strategy, colors, history)
```

---

## What M8 Does NOT Include

- Deleting individual match records (M9+)
- Filtering/searching history by deck or date (M9+)
- Export / import of history data
- Server-side persistence — localStorage only
- Win rate breakdown per deck (M9+)
