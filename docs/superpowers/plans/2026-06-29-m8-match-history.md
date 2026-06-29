# M8 Match History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users record win/loss results after using a generated deck; winning top decks feed back into the autofill frequency map so future builds improve over time.

**Architecture:** Pure functions in `lib/history.ts` handle all learning logic. A `hooks/useMatchHistory.ts` hook owns `localStorage` read/write. Pages call the hook and pass the history array into `autofill()` / `counterAutofill()` as an optional parameter — existing callers are unaffected.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest, localStorage (no backend)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types/card.ts` | Add `MatchResult` interface |
| Create | `lib/history.ts` | Pure functions: `addMatchResult`, `getWinRate`, `buildLearnedTopDecks` |
| Create | `lib/history.test.ts` | 5 Vitest tests |
| Modify | `lib/autofill.ts` | Accept optional `matchHistory?` param, merge learned decks |
| Modify | `lib/autofill.test.ts` | 1 new test for learning integration |
| Modify | `lib/counter.ts` | Accept optional `matchHistory?` param in `counterAutofill` |
| Create | `hooks/useMatchHistory.ts` | localStorage read/write hook |
| Create | `app/history/page.tsx` | `/history` page — left/right split layout |
| Modify | `components/Navbar.tsx` | Add "History" link after "Tier List" |
| Modify | `app/build/page.tsx` | Call `useMatchHistory`, pass `history` to `autofill()` |
| Modify | `app/counter/page.tsx` | Call `useMatchHistory`, pass `history` to `counterAutofill()` |

---

### Task 1: Add `MatchResult` type + `lib/history.ts` with TDD

**Files:**
- Modify: `types/card.ts`
- Create: `lib/history.ts`
- Create: `lib/history.test.ts`

**Context:** The project uses `types/card.ts` as the single source of truth for all domain types. `lib/history.ts` must only import from `types/card.ts` — no browser APIs, no storage. The test file uses Vitest (`import { describe, it, expect } from 'vitest'`).

- [ ] **Step 1: Add `MatchResult` to `types/card.ts`**

Open `types/card.ts`. After the `TopDeck` interface (around line 60), add:

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

- [ ] **Step 2: Write the failing tests in `lib/history.test.ts`**

Create `lib/history.test.ts` with this content:

```ts
import { describe, it, expect } from 'vitest'
import { addMatchResult, getWinRate, buildLearnedTopDecks } from './history'
import type { MatchResult, TopDeck } from '../types/card'

function makeResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    id: '1',
    date: '2026-06-29T00:00:00.000Z',
    deckName: 'Blue Control',
    deckIsTopDeck: true,
    outcome: 'win',
    opponentDeck: null,
    notes: '',
    ...overrides,
  }
}

const blueControlTopDeck: TopDeck = {
  name: 'Blue Control',
  colors: ['blue'],
  strategy: 'control',
  tier: 'A',
  keyCards: [],
  list: [{ id: 'GD01-001', count: 4 }],
  source: 'test',
  date: '2026-06-01',
}

// 2 wins for Blue Control (top deck), 1 win for custom deck, 1 loss
const fixture: MatchResult[] = [
  makeResult({ id: '1', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'win'  }),
  makeResult({ id: '2', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'win'  }),
  makeResult({ id: '3', deckName: 'My Custom Deck', deckIsTopDeck: false, outcome: 'win' }),
  makeResult({ id: '4', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'loss' }),
]

describe('addMatchResult', () => {
  it('prepends entry to history', () => {
    const entry = makeResult({ id: 'new' })
    const result = addMatchResult(fixture, entry)
    expect(result[0]).toBe(entry)
    expect(result.length).toBe(fixture.length + 1)
  })
})

describe('getWinRate', () => {
  it('returns correct wins/losses/rate', () => {
    const { wins, losses, rate } = getWinRate(fixture)
    expect(wins).toBe(3)
    expect(losses).toBe(1)
    expect(rate).toBeCloseTo(0.75)
  })

  it('returns rate 0 for empty history', () => {
    const { wins, losses, rate } = getWinRate([])
    expect(wins).toBe(0)
    expect(losses).toBe(0)
    expect(rate).toBe(0)
  })
})

describe('buildLearnedTopDecks', () => {
  it('returns one copy per qualifying win', () => {
    const learned = buildLearnedTopDecks(fixture, [blueControlTopDeck])
    // 2 wins for 'Blue Control' (top deck) → 2 copies
    expect(learned).toHaveLength(2)
    expect(learned[0].name).toBe('Blue Control')
    expect(learned[1].name).toBe('Blue Control')
  })

  it('excludes custom-named decks (deckIsTopDeck false)', () => {
    const learned = buildLearnedTopDecks(fixture, [blueControlTopDeck])
    // 'My Custom Deck' win is excluded even though outcome is 'win'
    expect(learned.every(d => d.name === 'Blue Control')).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run lib/history.test.ts
```

Expected: FAIL — `Cannot find module './history'`

- [ ] **Step 4: Create `lib/history.ts`**

```ts
import type { MatchResult, TopDeck } from '../types/card'

/** Returns new array with entry prepended (newest first). Does not mutate input. */
export function addMatchResult(
  history: MatchResult[],
  entry: MatchResult
): MatchResult[] {
  return [entry, ...history]
}

/**
 * Computes win/loss counts and win rate.
 * rate is in the range 0–1 (multiply by 100 to display as percentage).
 * Returns rate 0 when history is empty.
 */
export function getWinRate(
  history: MatchResult[]
): { wins: number; losses: number; rate: number } {
  const wins = history.filter(r => r.outcome === 'win').length
  const losses = history.filter(r => r.outcome === 'loss').length
  const total = wins + losses
  return { wins, losses, rate: total === 0 ? 0 : wins / total }
}

/**
 * Builds a list of TopDeck copies from winning results where deckIsTopDeck is true.
 * A deck won N times produces N copies — each copy increases that deck's frequency weight
 * when merged into buildTopDeckFrequency.
 * Custom-named decks (deckIsTopDeck false) are excluded — they have no card list.
 */
export function buildLearnedTopDecks(
  history: MatchResult[],
  allTopDecks: TopDeck[]
): TopDeck[] {
  const result: TopDeck[] = []
  for (const entry of history) {
    if (entry.outcome !== 'win' || !entry.deckIsTopDeck) continue
    const found = allTopDecks.find(d => d.name === entry.deckName)
    if (found) result.push(found)
  }
  return result
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run lib/history.test.ts
```

Expected: 5 tests PASS

- [ ] **Step 6: Run full suite to confirm nothing broken**

```bash
npm test -- --run
```

Expected: 103 tests PASS (98 existing + 5 new)

- [ ] **Step 7: Commit**

```bash
git add types/card.ts lib/history.ts lib/history.test.ts
git commit -m "feat(m8): add MatchResult type and lib/history.ts with TDD"
```

---

### Task 2: Update `lib/autofill.ts` to accept `matchHistory`

**Files:**
- Modify: `lib/autofill.ts`
- Modify: `lib/autofill.test.ts`

**Context:** `autofill()` currently takes 6 params. Add an optional 7th `matchHistory?: MatchResult[]`. When provided, call `buildLearnedTopDecks(matchHistory, topDecks)` and merge the result with `topDecks` before computing `topDeckFrequency`. All existing callers pass 6 args and are unaffected.

Current `autofill` signature (line 62 of `lib/autofill.ts`):
```ts
export function autofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[]
)
```

- [ ] **Step 1: Write the failing test in `lib/autofill.test.ts`**

Add this new describe block at the bottom of `lib/autofill.test.ts` (after the existing "immutability" block):

```ts
describe('autofill — matchHistory learning', () => {
  it('cards from a winning top deck appear in output when matchHistory is provided', () => {
    const pool = makeLargePool()
    const featuredCard = pool[0]  // first unit card in pool
    const topDeck: TopDeck = {
      name: 'Test Aggro',
      colors: ['blue'],
      keyCards: [],
      strategy: 'aggro',
      tier: 'C',
      list: [{ id: featuredCard.id, count: 4 }],
      source: 'test',
      date: '2026-06-29',
    }
    const history: import('../types/card').MatchResult[] = [
      {
        id: '1',
        date: '2026-06-29T00:00:00.000Z',
        deckName: 'Test Aggro',
        deckIsTopDeck: true,
        outcome: 'win',
        opponentDeck: null,
        notes: '',
      },
    ]
    // Pass empty topDecks but matchHistory — the learning should inject the top deck
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'], history)
    // featuredCard should appear because it was boosted via learned frequency
    expect(result.mainDeck[featuredCard.id]).toBeGreaterThan(0)
  })
})
```

Also add `TopDeck` to the import at line 3 of `lib/autofill.test.ts` if it's not already there — check the import line and update to:
```ts
import type { Card, TopDeck } from '../types/card'
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run lib/autofill.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `autofill` does not accept 7th argument yet

- [ ] **Step 3: Update `lib/autofill.ts`**

Replace the file content with:

```ts
import type { Card, CardColor, Strategy, TopDeck, MatchResult } from '../types/card'
import { scoreCard } from './strategy'
import { buildLearnedTopDecks } from './history'

function totalCount(deck: Record<string, number>): number {
  return Object.values(deck).reduce((sum, n) => sum + n, 0)
}

/**
 * Build a frequency map: cardId → number of matching TopDecks that contain it.
 * A TopDeck matches if strategy matches, at least one color overlaps, and list is non-empty.
 */
export function buildTopDeckFrequency(
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[]
): Map<string, number> {
  const freq = new Map<string, number>()
  for (const td of topDecks) {
    if (td.strategy !== strategy) continue
    if (!td.list || td.list.length === 0) continue
    if (!td.colors.some(c => colors.includes(c))) continue
    for (const entry of td.list) {
      freq.set(entry.id, (freq.get(entry.id) ?? 0) + 1)
    }
  }
  return freq
}

/**
 * Returns true if the card's colors are all within the selected colors.
 * Colorless cards (empty colors array) always pass.
 */
export function cardFitsColors(card: Card, colors: CardColor[]): boolean {
  if (card.colors.length === 0) return true
  return card.colors.every(c => colors.includes(c))
}

/**
 * Greedily fill `deck` with cards from `sorted` (highest score first).
 * Respects `limit` (total cards) and `maxPerCard` (copies per card).
 * Returns a new deck — does not mutate input.
 */
export function greedyFill(
  deck: Record<string, number>,
  sorted: Card[],
  limit: number,
  maxPerCard: number
): Record<string, number> {
  const result = { ...deck }
  for (const card of sorted) {
    const remaining = limit - totalCount(result)
    if (remaining <= 0) break
    const existing = result[card.id] ?? 0
    const canAdd = Math.min(maxPerCard - existing, remaining)
    if (canAdd > 0) {
      result[card.id] = existing + canAdd
    }
  }
  return result
}

export function autofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[],
  matchHistory?: MatchResult[]
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> } {
  const learnedDecks = matchHistory ? buildLearnedTopDecks(matchHistory, topDecks) : []
  const allDecks = [...topDecks, ...learnedDecks]
  const topDeckFrequency = buildTopDeckFrequency(allDecks, strategy, colors)

  // Filter by color fit; split by type
  const eligible = allCards.filter(c => cardFitsColors(c, colors))
  const mainCandidates = eligible.filter(c => c.type !== 'resource')
  const resourceCandidates = eligible.filter(c => c.type === 'resource')

  // Sort by score descending
  const byScore = (a: Card, b: Card) =>
    scoreCard(b, strategy, topDeckFrequency) - scoreCard(a, strategy, topDeckFrequency)

  const sortedMain = [...mainCandidates].sort(byScore)
  const sortedResource = [...resourceCandidates].sort(byScore)

  const newMain = greedyFill(mainDeck, sortedMain, 50, 4)
  const newResource = greedyFill(resourceDeck, sortedResource, 10, 4)

  return { mainDeck: newMain, resourceDeck: newResource }
}
```

- [ ] **Step 4: Run tests to confirm all pass**

```bash
npm test -- --run
```

Expected: 104 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/autofill.ts lib/autofill.test.ts
git commit -m "feat(m8): autofill accepts optional matchHistory for learned top decks"
```

---

### Task 3: Update `lib/counter.ts` to accept `matchHistory`

**Files:**
- Modify: `lib/counter.ts`

**Context:** `counterAutofill()` calls `buildTopDeckFrequency(topDecks, strategy, colors)`. Add optional `matchHistory?: MatchResult[]` as the last param and merge learned decks the same way as `autofill`. No new tests needed — the logic is identical to what Task 2 tested.

Current `counterAutofill` signature (line 129 of `lib/counter.ts`):
```ts
export function counterAutofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  targetDeck: TopDeck,
  colors: CardColor[],
  strategy: Strategy
)
```

- [ ] **Step 1: Update `lib/counter.ts`**

Replace the top-of-file imports with:

```ts
import type { Card, CardColor, Strategy, TopDeck, MatchResult } from '../types/card'
import { scoreCard } from './strategy'
import { buildTopDeckFrequency, cardFitsColors, greedyFill } from './autofill'
import { buildLearnedTopDecks } from './history'
```

Note: `buildLearnedTopDecks` lives in `lib/history.ts` (created in Task 1), not in `lib/autofill.ts`.

Then replace the `counterAutofill` function (lines 129–158) with:

```ts
export function counterAutofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  targetDeck: TopDeck,
  colors: CardColor[],
  strategy: Strategy,
  matchHistory?: MatchResult[]
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> } {
  const learnedDecks = matchHistory ? buildLearnedTopDecks(matchHistory, topDecks) : []
  const allDecks = [...topDecks, ...learnedDecks]
  const topDeckFreq = buildTopDeckFrequency(allDecks, strategy, colors)

  // Pre-compute threat profile once (avoid re-analysis per card)
  const profile = analyzeTargetDeck(targetDeck, allCards)

  const eligible = allCards.filter(c => cardFitsColors(c, colors))
  const mainCandidates     = eligible.filter(c => c.type !== 'resource')
  const resourceCandidates = eligible.filter(c => c.type === 'resource')

  // Sort by counter score descending
  const scorer = (card: Card) =>
    scoreCard(card, strategy, topDeckFreq) +
    keywordCounterBonus(card, profile, targetDeck.strategy)

  const sortedMain     = [...mainCandidates].sort((a, b) => scorer(b) - scorer(a))
  const sortedResource = [...resourceCandidates].sort((a, b) => scorer(b) - scorer(a))

  return {
    mainDeck:     greedyFill(mainDeck,     sortedMain,     50, 4),
    resourceDeck: greedyFill(resourceDeck, sortedResource, 10, 4),
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --run
```

Expected: 104 tests PASS (no new tests, just verifying no regressions)

- [ ] **Step 3: Commit**

```bash
git add lib/counter.ts
git commit -m "feat(m8): counterAutofill accepts optional matchHistory"
```

---

### Task 4: Create `hooks/useMatchHistory.ts`

**Files:**
- Create: `hooks/useMatchHistory.ts`

**Context:** This hook is the only place that touches `localStorage`. It reads history on first render via a lazy `useState` initializer (safe because this is always a `'use client'` component). The `add` function updates both React state and `localStorage` atomically.

- [ ] **Step 1: Create the `hooks/` directory and file**

```bash
mkdir -p "/Users/nickckck/GCG Web/hooks"
```

Create `hooks/useMatchHistory.ts`:

```ts
'use client'

import { useState } from 'react'
import { addMatchResult } from '../lib/history'
import type { MatchResult } from '../types/card'

const STORAGE_KEY = 'gcg-match-history'

export function useMatchHistory() {
  const [history, setHistory] = useState<MatchResult[]>(() => {
    // Lazy initializer — only runs once on client mount.
    // Safe because this hook is only used in 'use client' components.
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useMatchHistory.ts
git commit -m "feat(m8): add useMatchHistory hook with localStorage persistence"
```

---

### Task 5: Create `app/history/page.tsx`

**Files:**
- Create: `app/history/page.tsx`

**Context:** Left/right split layout. Left: "+ 記錄新對局" button that expands an inline form, then a feed of past matches. Right: win rate stat card + learning status card (sticky). The form uses controlled inputs with local state; on submit calls `add()` from the hook.

- [ ] **Step 1: Create `app/history/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useMatchHistory } from '../../hooks/useMatchHistory'
import { getTopDecks } from '../../lib/topdecks'
import { getWinRate, buildLearnedTopDecks } from '../../lib/history'
import type { MatchResult } from '../../types/card'

export default function HistoryPage() {
  const { history, add } = useMatchHistory()
  const topDecks = useMemo(() => getTopDecks(), [])

  // Form visibility
  const [formOpen, setFormOpen] = useState(false)

  // Form fields
  const [deckSelection, setDeckSelection] = useState('')
  const [customName, setCustomName]       = useState('')
  const [outcome, setOutcome]             = useState<'win' | 'loss' | null>(null)
  const [opponentDeck, setOpponentDeck]   = useState('')
  const [notes, setNotes]                 = useState('')

  const topDeckNames = topDecks.map(d => d.name)
  const isCustom     = deckSelection === '__custom__'
  const deckName     = isCustom ? customName.trim() : deckSelection
  const deckIsTopDeck = !isCustom && deckSelection !== ''

  const stats        = getWinRate(history)
  const learnedCount = buildLearnedTopDecks(history, topDecks).length

  function handleSubmit() {
    if (!deckName || !outcome) return
    const entry: MatchResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      deckName,
      deckIsTopDeck,
      outcome,
      opponentDeck: opponentDeck || null,
      notes,
    }
    add(entry)
    // Reset form
    setDeckSelection('')
    setCustomName('')
    setOutcome(null)
    setOpponentDeck('')
    setNotes('')
    setFormOpen(false)
  }

  return (
    <div className="flex gap-6 items-start">

      {/* ── Left column — form + feed ── */}
      <div className="flex-[1.5] flex flex-col gap-4 min-w-0">

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setFormOpen(o => !o)}
          className="w-full rounded-lg border border-dashed border-accent-gold/50 py-2 text-sm text-accent-gold hover:bg-accent-gold/5 transition-colors"
        >
          {formOpen ? '✕ 收起' : '+ 記錄新對局'}
        </button>

        {/* Inline form */}
        {formOpen && (
          <div className="rounded-lg border border-white/10 bg-bg-surface p-4 flex flex-col gap-3">

            {/* Your deck */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                你的牌組
              </label>
              <select
                value={deckSelection}
                onChange={e => setDeckSelection(e.target.value)}
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
              >
                <option value="">選擇牌組…</option>
                {topDeckNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__custom__">自訂名稱…</option>
              </select>
              {isCustom && (
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="輸入牌組名稱"
                  className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
                />
              )}
            </div>

            {/* Opponent deck */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                對手牌組（可選）
              </label>
              <select
                value={opponentDeck}
                onChange={e => setOpponentDeck(e.target.value)}
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
              >
                <option value="">不填寫</option>
                {topDeckNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Outcome */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                結果
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome('win')}
                  className={`flex-1 rounded py-1.5 text-sm font-semibold transition-colors ${
                    outcome === 'win'
                      ? 'bg-green-700 text-white'
                      : 'border border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  勝
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('loss')}
                  className={`flex-1 rounded py-1.5 text-sm font-semibold transition-colors ${
                    outcome === 'loss'
                      ? 'bg-red-700 text-white'
                      : 'border border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  負
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                備注（可選）
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="對局備注…"
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!deckName || !outcome}
              className="rounded-lg border border-accent-gold/40 bg-accent-gold/10 py-2 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-30"
            >
              確認記錄
            </button>
          </div>
        )}

        {/* Match feed */}
        {history.length === 0 ? (
          <p className="text-sm italic text-white/30">
            未有對局記錄。記錄第一場對局吧！
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(r => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">{r.deckName}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      r.outcome === 'win' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
                    }`}
                  >
                    {r.outcome === 'win' ? '勝' : '負'}
                  </span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-white/30">
                  {r.opponentDeck && <span>vs {r.opponentDeck}</span>}
                  <span>{new Date(r.date).toLocaleDateString('zh-HK')}</span>
                </div>
                {r.notes && (
                  <p className="mt-1 text-xs italic text-white/40">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right column — stats ── */}
      <div className="flex-1 flex flex-col gap-4 sticky top-20">

        {/* Win rate card */}
        <div className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            勝率
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-white/30">未有對局記錄</p>
          ) : (
            <>
              <p className="text-3xl font-black text-white">
                {Math.round(stats.rate * 100)}%
              </p>
              <p className="mt-1 text-xs text-white/40">
                {stats.wins}W / {stats.losses}L
              </p>
            </>
          )}
        </div>

        {/* Learning status card */}
        <div className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            學習狀態
          </p>
          {learnedCount === 0 ? (
            <p className="text-sm text-white/30">尚未有學習資料</p>
          ) : (
            <>
              <p className="text-sm text-white/80">
                ✦ 已從{' '}
                <span className="font-bold text-accent-gold">{learnedCount}</span>{' '}
                場勝局學習
              </p>
              <p className="mt-1 text-xs text-white/30">
                下次生成牌組將反映學習結果
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --run
```

Expected: 104 tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/history/page.tsx
git commit -m "feat(m8): add /history page with match recording and stats"
```

---

### Task 6: Wire Navbar + `/build` + `/counter` pages

**Files:**
- Modify: `components/Navbar.tsx`
- Modify: `app/build/page.tsx`
- Modify: `app/counter/page.tsx`

**Context:** Three small changes. Navbar gets one new link. Both pages import `useMatchHistory` and pass `history` as the last arg to their autofill calls. No other changes to those pages.

- [ ] **Step 1: Add "History" link to `components/Navbar.tsx`**

Open `components/Navbar.tsx`. After the Tier List `<Link>` block (around line 46–51), add:

```tsx
<Link
  href="/history"
  className={`text-sm transition-colors ${pathname === '/history' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  History
</Link>
```

The full `<div className="flex gap-6">` section should now end with:
```tsx
          <Link href="/counter"  ...>Counter</Link>
          <Link href="/tier-list" ...>Tier List</Link>
          <Link
            href="/history"
            className={`text-sm transition-colors ${pathname === '/history' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            History
          </Link>
```

- [ ] **Step 2: Update `app/build/page.tsx`**

Add the import at the top (after the existing imports):
```ts
import { useMatchHistory } from '../../hooks/useMatchHistory'
```

Inside `BuildPageContent()`, add after the existing `useMemo` calls (e.g. after `const topDecks = useMemo(...)` on line 18):
```ts
const { history } = useMatchHistory()
```

Update `handleAutoBuild()` (currently line 74–78) to pass `history`:
```ts
function handleAutoBuild() {
  if (!strategy || selectedColors.length === 0) return
  const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors, history)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
}
```

- [ ] **Step 3: Update `app/counter/page.tsx`**

Add the import at the top:
```ts
import { useMatchHistory } from '../../hooks/useMatchHistory'
```

Inside `CounterPageContent()`, add after the existing `useMemo` calls:
```ts
const { history } = useMatchHistory()
```

Update `handleCounterBuild()` (currently line 74–78) to pass `history`:
```ts
function handleCounterBuild() {
  if (!targetDeck || selectedColors.length === 0 || !strategy) return
  const result = counterAutofill(mainDeck, resourceDeck, allCards, topDecks, targetDeck, selectedColors, strategy, history)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test -- --run
```

Expected: 104 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/Navbar.tsx app/build/page.tsx app/counter/page.tsx
git commit -m "feat(m8): wire History link, pass matchHistory to autofill and counterAutofill"
```

---

### Task 7: Full verification

**Files:** None — verification only.

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --run
```

Expected output:
```
Test Files  9 passed (9)
     Tests  104 passed (104)
```

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with `/history` appearing in the route list.

- [ ] **Step 3: Smoke test `/history`**

Start dev server: `npm run dev`

- Open `http://localhost:3000/history`
- "History" link in Navbar is active
- Click "+ 記錄新對局" → form expands
- Select a top deck, pick 勝, click 確認記錄
- Match appears in feed; right column shows 100% (1W / 0L)
- Right column learning status shows "✦ 已從 1 場勝局學習"
- Go to `/build`, pick same colors/strategy, click Auto Build → confirm no errors

- [ ] **Step 4: Commit if any fixes were needed; otherwise done**
