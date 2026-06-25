# M4 /build Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the M3 autofill engine into a `/build` page — a new route that lets users pick colors + strategy, click Auto Build to fill a deck, then manually adjust.

**Architecture:** The `/build` page reuses all existing components (DeckPanel, CardGrid, FilterSidebar) unchanged. `AutoBuildBar` is the only new component: a horizontal bar with color dots, strategy pill tabs, and an Auto Build button. `selectedColors` is shared state between the bar and the card browser filter. All filling logic lives in `lib/autofill.ts` (M3) — the page just calls it.

**Tech Stack:** Next.js 14 App Router, React 18 (hooks), TypeScript strict, Tailwind CSS v3, Vitest

---

### Task 1: TopDeck data + loader

**Files:**
- Create: `data/topdecks.json`
- Create: `lib/topdecks.ts`
- Create: `lib/topdecks.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/topdecks.test.ts
import { describe, it, expect } from 'vitest'
import { getTopDecks } from './topdecks'

describe('getTopDecks', () => {
  it('returns a non-empty array', () => {
    const decks = getTopDecks()
    expect(decks.length).toBeGreaterThan(0)
  })

  it('each deck has required fields', () => {
    const decks = getTopDecks()
    for (const deck of decks) {
      expect(deck.name).toBeTruthy()
      expect(Array.isArray(deck.colors)).toBe(true)
      expect(typeof deck.strategy).toBe('string')
      expect(Array.isArray(deck.keyCards)).toBe(true)
      expect(Array.isArray(deck.list)).toBe(true)
      expect(deck.list!.length).toBeGreaterThan(0)
    }
  })

  it('covers all 4 strategies', () => {
    const decks = getTopDecks()
    const strategies = new Set(decks.map(d => d.strategy))
    expect(strategies.has('aggro')).toBe(true)
    expect(strategies.has('midrange')).toBe(true)
    expect(strategies.has('control')).toBe(true)
    expect(strategies.has('attrition')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/nickckck/GCG Web" && npx vitest run lib/topdecks.test.ts
```

Expected: FAIL — `Cannot find module './topdecks'`

- [ ] **Step 3: Create data/topdecks.json**

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

- [ ] **Step 4: Create lib/topdecks.ts**

```ts
import topDecksData from '../data/topdecks.json'
import type { TopDeck } from '../types/card'

export function getTopDecks(): TopDeck[] {
  return topDecksData as TopDeck[]
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd "/Users/nickckck/GCG Web" && npx vitest run lib/topdecks.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
cd "/Users/nickckck/GCG Web" && git add data/topdecks.json lib/topdecks.ts lib/topdecks.test.ts
git commit -m "feat(m4): add topdecks.json data and getTopDecks loader"
```

---

### Task 2: AutoBuildBar component

**Files:**
- Create: `components/AutoBuildBar.tsx`

No unit tests — this is a pure UI assembly component with no business logic.

- [ ] **Step 1: Create components/AutoBuildBar.tsx**

```tsx
'use client'

import type { CardColor, Strategy } from '../types/card'

const COLORS: { value: CardColor; dot: string; label: string }[] = [
  { value: 'blue',   dot: 'bg-game-blue',   label: 'Blue'   },
  { value: 'green',  dot: 'bg-game-green',  label: 'Green'  },
  { value: 'red',    dot: 'bg-game-red',    label: 'Red'    },
  { value: 'white',  dot: 'bg-game-white',  label: 'White'  },
  { value: 'purple', dot: 'bg-game-purple', label: 'Purple' },
]

const STRATEGIES: { value: Strategy; label: string }[] = [
  { value: 'aggro',     label: 'Aggro'     },
  { value: 'midrange',  label: 'Midrange'  },
  { value: 'control',   label: 'Control'   },
  { value: 'attrition', label: 'Attrition' },
]

interface AutoBuildBarProps {
  selectedColors: CardColor[]
  strategy: Strategy | null
  onColorToggle: (color: CardColor) => void
  onStrategyChange: (strategy: Strategy) => void
  onAutoBuild: () => void
  disabled: boolean
}

export default function AutoBuildBar({
  selectedColors,
  strategy,
  onColorToggle,
  onStrategyChange,
  onAutoBuild,
  disabled,
}: AutoBuildBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
      {/* Color dots */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
          Color
        </span>
        {COLORS.map(({ value, dot, label }) => {
          const active = selectedColors.includes(value)
          return (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => onColorToggle(value)}
              className={`
                h-5 w-5 rounded-full transition-all
                ${dot}
                ${active
                  ? 'opacity-100 ring-2 ring-white/60 ring-offset-1 ring-offset-bg-surface'
                  : 'opacity-30 hover:opacity-60'
                }
              `}
            />
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-white/10 hidden sm:block" />

      {/* Strategy pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
          Strategy
        </span>
        {STRATEGIES.map(({ value, label }) => {
          const active = strategy === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onStrategyChange(value)}
              className={`
                rounded-full px-3 py-1 text-xs font-medium transition-colors
                ${active
                  ? 'bg-accent-gold text-bg-base'
                  : 'border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40'
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Auto Build button — pushed to right */}
      <button
        type="button"
        onClick={onAutoBuild}
        disabled={disabled}
        className={`
          ml-auto rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
          ${disabled
            ? 'border-white/10 text-white/20 cursor-not-allowed'
            : 'border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10'
          }
        `}
      >
        Auto Build
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd "/Users/nickckck/GCG Web" && git add components/AutoBuildBar.tsx
git commit -m "feat(m4): add AutoBuildBar component"
```

---

### Task 3: /build page

**Files:**
- Create: `app/build/page.tsx`

No unit tests — the page is UI assembly only; all business logic is tested in M2/M3.

- [ ] **Step 1: Create app/build/page.tsx**

```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { getAllCards, filterCards } from '../../lib/cards'
import { addCard, removeCard } from '../../lib/deck'
import { autofill } from '../../lib/autofill'
import { getTopDecks } from '../../lib/topdecks'
import AutoBuildBar from '../../components/AutoBuildBar'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import DeckPanel from '../../components/DeckPanel'
import type { Card, CardColor, CardType, Strategy } from '../../types/card'

export default function BuildPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const topDecks = useMemo(() => getTopDecks(), [])

  // Deck state
  const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
  const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})

  // Browser filter state
  const [search, setSearch] = useState('')
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])

  // M4: strategy state
  const [strategy, setStrategy] = useState<Strategy | null>(null)

  // Color toggle with 2-color limit
  function toggleColor(color: CardColor) {
    setSelectedColors(prev => {
      if (prev.includes(color)) return prev.filter(c => c !== color)
      if (prev.length >= 2) return prev  // ignore 3rd color
      return [...prev, color]
    })
  }

  function toggleType(type: CardType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // Auto Build handler
  function handleAutoBuild() {
    if (!strategy || selectedColors.length === 0) return
    const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors)
    setMainDeck(result.mainDeck)
    setResourceDeck(result.resourceDeck)
  }

  const filteredCards = useMemo(() => {
    const byFilter = filterCards(allCards, selectedColors, selectedTypes)
    if (!search.trim()) return byFilter
    const q = search.trim().toLowerCase()
    return byFilter.filter(c => c.name.toLowerCase().includes(q))
  }, [allCards, selectedColors, selectedTypes, search])

  const handleAdd = useCallback((card: Card, isResource: boolean) => {
    if (isResource) {
      setResourceDeck(prev => addCard(prev, card, true))
    } else {
      setMainDeck(prev => addCard(prev, card, false))
    }
  }, [])

  const handleRemove = useCallback((cardId: string, isResource: boolean) => {
    if (isResource) {
      setResourceDeck(prev => removeCard(prev, cardId))
    } else {
      setMainDeck(prev => removeCard(prev, cardId))
    }
  }, [])

  const mainTotal = Object.values(mainDeck).reduce((s, n) => s + n, 0)

  function canAddToMain(card: Card): boolean {
    const count = mainDeck[card.id] ?? 0
    return count < 4 && mainTotal < 50
  }

  return (
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
        {/* Left: card browser */}
        <div className="flex flex-col gap-4 min-w-0 flex-1 lg:overflow-hidden">
          {/* Search bar */}
          <div className="relative shrink-0">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋卡牌..."
              className="w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex gap-4 flex-1 min-h-0 lg:overflow-hidden">
            {/* Filter sidebar */}
            <FilterSidebar
              selectedColors={selectedColors}
              selectedTypes={selectedTypes}
              onColorToggle={toggleColor}
              onTypeToggle={toggleType}
              onClearAll={() => { setSelectedColors([]); setSelectedTypes([]) }}
              totalCards={allCards.length}
              filteredCount={filteredCards.length}
            />

            {/* Card grid (scrollable) */}
            <div className="flex-1 min-w-0 lg:overflow-y-auto">
              <CardGrid
                cards={filteredCards}
                deckCounts={mainDeck}
                onAdd={(card) => handleAdd(card, false)}
                canAdd={canAddToMain}
              />
            </div>
          </div>
        </div>

        {/* Right: deck panel */}
        <DeckPanel
          mainDeck={mainDeck}
          resourceDeck={resourceDeck}
          allCards={allCards}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd "/Users/nickckck/GCG Web" && git add app/build/page.tsx
git commit -m "feat(m4): add /build page with autofill integration"
```

---

### Task 4: Navbar — add Build link

**Files:**
- Modify: `components/Navbar.tsx`

The current Navbar has: Cards | Builder | Counter (disabled).
The spec adds Build between Builder and Counter: Cards | Builder | **Build** | Counter (disabled).

- [ ] **Step 1: Edit components/Navbar.tsx**

Find this block:
```tsx
          <Link
            href="/builder"
            className={`text-sm transition-colors ${pathname === '/builder' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Builder
          </Link>
          <span className="text-sm text-white/20 cursor-not-allowed">Counter</span>
```

Replace with:
```tsx
          <Link
            href="/builder"
            className={`text-sm transition-colors ${pathname === '/builder' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Builder
          </Link>
          <Link
            href="/build"
            className={`text-sm transition-colors ${pathname === '/build' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Build
          </Link>
          <span className="text-sm text-white/20 cursor-not-allowed">Counter</span>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd "/Users/nickckck/GCG Web" && git add components/Navbar.tsx
git commit -m "feat(m4): add Build link to Navbar"
```

---

### Task 5: Full test suite + build verification

**Files:** No changes

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web" && npx vitest run
```

Expected: All tests pass (previous 79 + new 3 topdecks tests = 82 total)

- [ ] **Step 2: Run Next.js build**

```bash
cd "/Users/nickckck/GCG Web" && npm run build
```

Expected: Build succeeds, no TypeScript or lint errors. The `/build` route appears in the route list.

- [ ] **Step 3: Smoke-test the page in dev mode**

```bash
cd "/Users/nickckck/GCG Web" && npm run dev
```

Manual check at http://localhost:3000/build:
- AutoBuildBar is visible at top
- Clicking color dots toggles selection (max 2 enforced — 3rd click does nothing)
- Clicking a strategy pill activates it (one at a time)
- Auto Build button is muted until both a color and a strategy are selected
- Clicking Auto Build fills the deck panel (DeckPanel shows 50 main / 10 resource)
- Clicking Auto Build again on an already-full deck does not change anything (existing cards preserved)
- The card browser filters to the selected colors simultaneously
- Navbar shows: Cards | Builder | Build | Counter

Stop dev server with Ctrl+C after verification.
