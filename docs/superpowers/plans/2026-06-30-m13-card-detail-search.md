# M13 Card Detail Drawer + Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-side card detail drawer (click any card → full info panel) and a real-time search bar (name + traits + keywords) to the `/cards` page.

**Architecture:** A new `searchCards` pure function in `lib/cards.ts` pipes after `filterCards`. A new `CardDetailDrawer` component renders a fixed right-side panel with artwork, stats, traits, link info (reusing `LinkPanel`), and ability text. The `/cards` page replaces M12's `selectedLinkCard` state with `selectedCard` (any card) + `searchQuery`, removing the inline `LinkPanel` mount.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest. No new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/cards.ts` | Add `searchCards` export |
| Modify | `lib/cards.test.ts` | Add 6 tests for `searchCards` |
| Create | `components/CardDetailDrawer.tsx` | Fixed right-side drawer with full card info |
| Modify | `app/cards/page.tsx` | Search state + drawer state; remove inline LinkPanel |

---

## Task 1: Add `searchCards` to `lib/cards.ts` (TDD)

**Files:**
- Modify: `lib/cards.ts`
- Modify: `lib/cards.test.ts`

**Context:**

`lib/cards.ts` currently exports `getAllCards` and `filterCards`. We add `searchCards(cards, query)` — a pure function that filters cards by matching the query against `name`, `traits[]`, and `keywords[]`. It is called **after** `filterCards`, not inside it.

Current test count: 134. After this task: 140.

- [ ] **Step 1: Add 7 failing tests to `lib/cards.test.ts`**

First, update the existing import on line 2 of the file:

```ts
// before:
import { filterCards } from './cards'
// after:
import { filterCards, searchCards } from './cards'
```

Then append this block at the bottom of the file (after the closing `}` of the `filterCards` describe block):

```ts
const searchMockCards: Card[] = [
  {
    id: 'S-001', name: 'Nu Gundam', type: 'unit',
    colors: ['blue'], level: 5, cost: 7, ap: 5, hp: 6,
    rarity: 'LR', isLR: true, set: 'GD01',
    traits: ['Mobile Suit', 'Newtype'], keywords: ['Deploy'], text: '',
    linkRequirement: 'Amuro Ray',
  },
  {
    id: 'S-002', name: 'Amuro Ray', type: 'pilot',
    colors: ['blue'], level: 3, cost: 3,
    rarity: 'LR', isLR: true, set: 'GD01',
    traits: ['Newtype'], keywords: ['Pair'], text: '',
    apBoost: 2, hpBoost: 1,
  },
  {
    id: 'S-003', name: 'Strike Freedom', type: 'unit',
    colors: ['blue'], level: 5, cost: 6, ap: 5, hp: 5,
    rarity: 'LR', isLR: true, set: 'GD02',
    traits: ['Mobile Suit', 'SEED'], keywords: ['Deploy'], text: '',
  },
]

describe('searchCards', () => {
  it('returns all cards when query is empty string', () => {
    const result = searchCards(searchMockCards, '')
    expect(result).toHaveLength(3)
  })

  it('returns all cards when query is whitespace only', () => {
    const result = searchCards(searchMockCards, '   ')
    expect(result).toHaveLength(3)
  })

  it('filters by card name', () => {
    const result = searchCards(searchMockCards, 'Nu Gundam')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('S-001')
  })

  it('filters by trait', () => {
    const result = searchCards(searchMockCards, 'Newtype')
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['S-001', 'S-002'])
  })

  it('filters by keyword', () => {
    const result = searchCards(searchMockCards, 'Pair')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('S-002')
  })

  it('search is case-insensitive', () => {
    const result = searchCards(searchMockCards, 'NEWTYPE')
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['S-001', 'S-002'])
  })

  it('returns empty array when no cards match', () => {
    const result = searchCards(searchMockCards, 'Zeon')
    expect(result).toHaveLength(0)
  })
})
```

Note: that's 7 tests (empty string, whitespace-only, name, trait, keyword, case-insensitive, no match) — giving us 141 total. The whitespace test is a worthwhile edge case.

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run lib/cards.test.ts
```

Expected: FAIL on all 7 new tests — "searchCards is not a function" or similar export error.

- [ ] **Step 3: Add `searchCards` to `lib/cards.ts`**

Append to the end of the file:

```ts
export function searchCards(cards: Card[], query: string): Card[] {
  const q = query.trim().toLowerCase()
  if (!q) return cards
  return cards.filter(card =>
    card.name.toLowerCase().includes(q) ||
    card.traits.some(t => t.toLowerCase().includes(q)) ||
    card.keywords.some(k => k.toLowerCase().includes(q))
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run lib/cards.test.ts
```

Expected: 14 tests PASS (7 existing filterCards + 7 new searchCards)

- [ ] **Step 5: Run full suite — confirm nothing broke**

```bash
npx vitest run
```

Expected: 141 tests passed (134 + 7 new)

- [ ] **Step 6: Commit**

```bash
git add lib/cards.ts lib/cards.test.ts
git commit -m "feat(m13): add searchCards pure function with tests"
```

---

## Task 2: Create `components/CardDetailDrawer.tsx`

**Files:**
- Create: `components/CardDetailDrawer.tsx`

**Context:**

This is a fixed right-side drawer that slides in when a card is selected on `/cards`. It's always mounted (never returns null early) — the open/close state is driven by CSS `translate-x` transitions so both open and close animations work. Content renders only when `card !== null` to avoid showing stale data.

The component reuses `LinkPanel` from M12 (already exists at `components/LinkPanel.tsx`). `LinkPanel` returns null when `card.linkRequirement` is absent, so no guard is needed here.

`CARD_TYPE_COLORS` is duplicated from `CardTile.tsx` (it's a private const there, not exported — duplication is correct here rather than restructuring).

- [ ] **Step 1: Create `components/CardDetailDrawer.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Card } from '../types/card'
import LinkPanel from './LinkPanel'

const CARD_TYPE_COLORS: Record<string, string> = {
  unit:     'text-cardtype-unit    bg-cardtype-unit/10    border-cardtype-unit/30',
  pilot:    'text-cardtype-pilot   bg-cardtype-pilot/10   border-cardtype-pilot/30',
  command:  'text-cardtype-command bg-cardtype-command/10 border-cardtype-command/30',
  base:     'text-cardtype-base    bg-cardtype-base/10    border-cardtype-base/30',
  resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
}

interface Props {
  card: Card | null
  allCards: Card[]
  onClose: () => void
}

export default function CardDetailDrawer({ card, allCards, onClose }: Props) {
  const [imgError, setImgError] = useState(false)

  // Reset image error when the selected card changes
  useEffect(() => { setImgError(false) }, [card?.id])

  const isOpen = card !== null
  const typeStyle = card ? (CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource) : ''

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`absolute right-0 top-0 h-full w-80 overflow-y-auto bg-bg-surface border-l border-white/10 transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {card && (
          <div className="flex flex-col gap-4 p-4">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold leading-tight text-white">{card.name}</h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-xl leading-none text-white/30 hover:text-white"
                aria-label="關閉"
              >
                ×
              </button>
            </div>

            {/* Artwork */}
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://gundambay.com/static/images/cards/${card.id}.webp`}
                alt={card.name}
                className="w-full rounded-lg object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex aspect-[5/7] w-full flex-col items-center justify-center gap-2 rounded-lg bg-bg-elevated">
                <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${typeStyle}`}>
                  {card.type}
                </span>
                <p className="px-4 text-center text-xs text-white/40">{card.name}</p>
              </div>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {card.isLR && (
                <span className="rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-bold text-bg-base">
                  LR
                </span>
              )}
              <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
                {card.type}
              </span>
              <span className="text-[10px] text-white/30">{card.set} · {card.id}</span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              {card.level != null && (
                <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                  Level {card.level}
                </span>
              )}
              {card.cost != null && (
                <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                  Cost {card.cost}
                </span>
              )}
              {(card.type === 'unit' || card.type === 'base') && card.ap != null && (
                <>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                    AP {card.ap}
                  </span>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                    HP {card.hp}
                  </span>
                </>
              )}
              {card.type === 'pilot' && card.apBoost != null && card.hpBoost != null && (
                <>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-cardtype-pilot">
                    AP+{card.apBoost}
                  </span>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-cardtype-pilot">
                    HP+{card.hpBoost}
                  </span>
                </>
              )}
            </div>

            {/* Traits + Keywords */}
            {(card.traits.length > 0 || card.keywords.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {card.traits.map(trait => (
                  <span
                    key={trait}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60"
                  >
                    {trait}
                  </span>
                ))}
                {card.keywords.map(kw => (
                  <span
                    key={kw}
                    className="rounded-full border border-accent-gold/30 px-2 py-0.5 text-[10px] text-accent-gold/70"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Link section — LinkPanel returns null if no linkRequirement */}
            <LinkPanel card={card} allCards={allCards} />

            {/* Ability text */}
            {card.text && (
              <p className="whitespace-pre-wrap border-t border-white/10 pt-4 text-sm leading-relaxed text-white/60">
                {card.text}
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/nickckck/GCG Web"
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full suite — confirm nothing broke**

```bash
npx vitest run
```

Expected: 141 tests passed

- [ ] **Step 4: Commit**

```bash
git add components/CardDetailDrawer.tsx
git commit -m "feat(m13): add CardDetailDrawer component"
```

---

## Task 3: Wire `/cards` page — search bar + drawer

**Files:**
- Modify: `app/cards/page.tsx` (full replacement)

**Context:**

The current `/cards/page.tsx` (after M12) has:
- `selectedLinkCard: Card | null` state → remove this
- `handleCardClick` that guards for `unit + linkRequirement` → simplify to any card
- Inline `<LinkPanel>` mount → remove (now inside `CardDetailDrawer`)
- `filterCards` only → add `searchCards` pipe

The `LinkPanel` import is no longer needed in this file (it's used inside `CardDetailDrawer` instead).

- [ ] **Step 1: Replace `app/cards/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { getAllCards, filterCards, searchCards } from '../../lib/cards'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import CardDetailDrawer from '../../components/CardDetailDrawer'
import type { Card, CardColor, CardType } from '../../types/card'

export default function CardsPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCards = useMemo(
    () => searchCards(filterCards(allCards, selectedColors, selectedTypes), searchQuery),
    [allCards, selectedColors, selectedTypes, searchQuery]
  )

  function toggleColor(color: CardColor) {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  function toggleType(type: CardType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, t]
    )
  }

  function handleCardClick(card: Card) {
    setSelectedCard(prev => prev?.id === card.id ? null : card)
  }

  return (
    <div className="flex gap-6">
      <FilterSidebar
        selectedColors={selectedColors}
        selectedTypes={selectedTypes}
        onColorToggle={toggleColor}
        onTypeToggle={toggleType}
        onClearAll={() => { setSelectedColors([]); setSelectedTypes([]) }}
        totalCards={allCards.length}
        filteredCount={filteredCards.length}
      />
      <div className="flex-1 min-w-0">
        <h1 className="mb-4 text-lg font-bold text-accent-gold tracking-wide">Card Library</h1>

        {/* Search bar */}
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜尋卡名、Traits、Keywords…"
          className="mb-4 w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none"
        />

        <CardGrid
          cards={filteredCards}
          allCards={allCards}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Card detail drawer — always mounted, open/close via CSS transition */}
      <CardDetailDrawer
        card={selectedCard}
        allCards={allCards}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run
```

Expected: 141 tests passed

- [ ] **Step 3: TypeScript check + build**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -15
```

Expected: no TypeScript errors, build succeeds

- [ ] **Step 4: Smoke test**

```bash
npx next dev &
```

Open `http://localhost:3000/cards`:
- Type "Amuro" in search bar → grid filters to show only Amuro Ray card
- Type "Newtype" → shows all cards with Newtype trait
- Clear search → all cards return
- Click any card → drawer slides in from right with full card info
- Click same card again → drawer closes
- Click backdrop → drawer closes
- Click a card with `linkRequirement` (e.g. Nu Gundam) → drawer shows Link section inside

Kill dev server after checking.

- [ ] **Step 5: Commit and push**

```bash
git add app/cards/page.tsx
git commit -m "feat(m13): wire /cards page with search bar and card detail drawer"
git push origin main
```
