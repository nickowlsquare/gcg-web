# M12 Link Connection Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Link pairing information for any Unit card with a `linkRequirement` — clicking on `/cards` opens a full panel, hovering on `/build` shows a compact row inside the existing hover overlay.

**Architecture:** A pure function `getLinkPilots` resolves the link relationship from card data. A `LinkPanel` component renders the full pilot list. `CardTile` gains new optional props (`allCards`, `mainDeck`, `onClick`) and renders a compact link row inside its existing hover overlay. `/cards` mounts `LinkPanel` on click; `/build` passes `allCards` + `mainDeck` to `CardGrid` → `CardTile` to enable the hover row.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest. No new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/linkPairs.ts` | Pure `getLinkPilots` function |
| Create | `lib/linkPairs.test.ts` | Vitest unit tests (5 tests) |
| Create | `components/LinkPanel.tsx` | Full link panel for /cards click |
| Modify | `components/CardTile.tsx` | Add allCards/mainDeck/onClick props + link row |
| Modify | `components/CardGrid.tsx` | Forward new props to CardTile |
| Modify | `app/cards/page.tsx` | Click handler + selectedLinkCard state + LinkPanel |
| Modify | `app/build/page.tsx` | Pass allCards + mainDeck to CardGrid |

---

## Task 1: `lib/linkPairs.ts` — pure function with TDD

**Files:**
- Create: `lib/linkPairs.ts`
- Create: `lib/linkPairs.test.ts`

**Context:**

`Card` type (from `types/card.ts`) has `linkRequirement?: string` and `type: 'unit' | 'pilot' | 'command' | 'base' | 'resource'`. The link relationship is: a Unit's `linkRequirement` must equal a Pilot's `name`. Current test count: 129. After this task: ~134.

- [ ] **Step 1: Write the failing tests**

Create `lib/linkPairs.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getLinkPilots } from './linkPairs'
import type { Card } from '../types/card'

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: 'TEST-001',
    name: 'Test Card',
    type: 'unit',
    rarity: 'C',
    set: 'GD01',
    colors: ['blue'],
    level: 3,
    cost: 3,
    traits: [],
    keywords: [],
    text: '',
    ...overrides,
  }
}

describe('getLinkPilots', () => {
  it('returns matching pilot when linkRequirement matches pilot name', () => {
    const unit = makeCard({ id: 'U1', type: 'unit', linkRequirement: 'Amuro Ray' })
    const pilot = makeCard({ id: 'P1', name: 'Amuro Ray', type: 'pilot' })
    const result = getLinkPilots(unit, [unit, pilot])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('P1')
  })

  it('returns empty array when matching pilot is not in allCards', () => {
    const unit = makeCard({ type: 'unit', linkRequirement: 'Full Frontal' })
    const result = getLinkPilots(unit, [unit])
    expect(result).toEqual([])
  })

  it('returns empty array when card has no linkRequirement', () => {
    const unit = makeCard({ type: 'unit' })
    const result = getLinkPilots(unit, [])
    expect(result).toEqual([])
  })

  it('returns empty array when card type is not unit', () => {
    const pilot = makeCard({ type: 'pilot', linkRequirement: 'Amuro Ray' })
    const result = getLinkPilots(pilot, [pilot])
    expect(result).toEqual([])
  })

  it('returns all pilots when multiple pilots share the same name', () => {
    const unit = makeCard({ type: 'unit', linkRequirement: 'Suletta Mercury' })
    const p1 = makeCard({ id: 'P1', name: 'Suletta Mercury', type: 'pilot' })
    const p2 = makeCard({ id: 'P2', name: 'Suletta Mercury', type: 'pilot' })
    const result = getLinkPilots(unit, [unit, p1, p2])
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['P1', 'P2'])
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run lib/linkPairs.test.ts
```

Expected: FAIL with "Cannot find module './linkPairs'"

- [ ] **Step 3: Implement `lib/linkPairs.ts`**

```ts
import type { Card } from '../types/card'

export function getLinkPilots(card: Card, allCards: Card[]): Card[] {
  if (card.type !== 'unit' || !card.linkRequirement) return []
  return allCards.filter(c => c.type === 'pilot' && c.name === card.linkRequirement)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run lib/linkPairs.test.ts
```

Expected: 5 tests PASS

- [ ] **Step 5: Run full suite — confirm nothing broke**

```bash
npx vitest run
```

Expected: 134 tests passed (129 + 5 new)

- [ ] **Step 6: Commit**

```bash
git add lib/linkPairs.ts lib/linkPairs.test.ts
git commit -m "feat(m12): add getLinkPilots pure function with tests"
```

---

## Task 2: `components/LinkPanel.tsx` — full link panel

**Files:**
- Create: `components/LinkPanel.tsx`

**Context:**

This is the full panel shown when a user clicks a unit card on `/cards`. No separate test file — all logic is in `getLinkPilots` which is already tested. `onClose` is optional (only passed from /cards; not needed in /build hover row).

`Card` type has `apBoost?: number`, `hpBoost?: number`, `rarity: string`.

Tailwind tokens available: `bg-bg-surface`, `bg-bg-elevated`, `text-accent-gold`, `text-cardtype-pilot`. Standard green: `text-green-400`.

- [ ] **Step 1: Create `components/LinkPanel.tsx`**

```tsx
import type { Card } from '../types/card'
import { getLinkPilots } from '../lib/linkPairs'

interface Props {
  card: Card
  allCards: Card[]
  mainDeck?: Record<string, number>
  onClose?: () => void
}

export default function LinkPanel({ card, allCards, mainDeck, onClose }: Props) {
  if (!card.linkRequirement) return null

  const pilots = getLinkPilots(card, allCards)

  return (
    <div className="rounded-lg border border-accent-gold/30 bg-bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase">
          Link 效果：即時攻擊
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white text-lg leading-none"
            aria-label="關閉"
          >
            ×
          </button>
        )}
      </div>

      {/* Pilot list */}
      {pilots.length > 0 ? (
        <div className="flex flex-col gap-2">
          {pilots.map(pilot => {
            const inDeck = mainDeck != null ? (mainDeck[pilot.id] ?? 0) > 0 : null
            return (
              <div
                key={pilot.id}
                className="flex items-center justify-between rounded border border-white/10 bg-bg-elevated px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{pilot.name}</span>
                  <span className="text-[9px] text-accent-gold">{pilot.rarity}</span>
                  {pilot.apBoost != null && (
                    <span className="text-[10px] text-cardtype-pilot">
                      AP+{pilot.apBoost} HP+{pilot.hpBoost}
                    </span>
                  )}
                </div>
                {inDeck != null && (
                  <span className={inDeck ? 'text-xs text-green-400' : 'text-xs text-white/30'}>
                    {inDeck ? '✓ 已在牌組' : '✗ 未在牌組'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-white/30">
          「{card.linkRequirement}」— 卡牌資料未有
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web"
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/LinkPanel.tsx
git commit -m "feat(m12): add LinkPanel component"
```

---

## Task 3: Update `CardTile` + `CardGrid` — add link props

**Files:**
- Modify: `components/CardTile.tsx` (full replacement)
- Modify: `components/CardGrid.tsx` (full replacement)

**Context:**

`CardTile` currently has props: `card, deckCount?, onAdd?, canAdd?`. New optional props: `allCards?`, `mainDeck?`, `onClick?`.

The hover overlay (shown when `onAdd` is provided) currently is `flex items-center justify-center` with just the `+` button. We change it to `flex flex-col items-center justify-center gap-2 p-2` to also show a compact link row.

The compact link row only appears when `allCards` is provided AND `card.type === 'unit'` AND `card.linkRequirement` exists.

The `onClick` prop puts a click handler on the outer card `<div>` and adds `cursor-pointer`. It is separate from `onAdd` — they are never both set on the same card.

`CardGrid` currently has props: `cards, deckCounts?, onAdd?, canAdd?`. New optional props: `allCards?`, `mainDeck?`, `onCardClick?`.

- [ ] **Step 1: Replace `components/CardTile.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { Card } from '../types/card'
import { getLinkPilots } from '../lib/linkPairs'

const CARD_TYPE_COLORS: Record<string, string> = {
  unit:     'text-cardtype-unit    bg-cardtype-unit/10    border-cardtype-unit/30',
  pilot:    'text-cardtype-pilot   bg-cardtype-pilot/10   border-cardtype-pilot/30',
  command:  'text-cardtype-command bg-cardtype-command/10 border-cardtype-command/30',
  base:     'text-cardtype-base    bg-cardtype-base/10    border-cardtype-base/30',
  resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
}

const GAME_COLOR_DOTS: Record<string, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

function getCardImageUrl(id: string): string {
  return `https://gundambay.com/static/images/cards/${id}.webp`
}

interface CardTileProps {
  card: Card
  deckCount?: number
  onAdd?: () => void
  canAdd?: boolean
  allCards?: Card[]
  mainDeck?: Record<string, number>
  onClick?: () => void
}

export default function CardTile({
  card,
  deckCount,
  onAdd,
  canAdd = true,
  allCards,
  mainDeck,
  onClick,
}: CardTileProps) {
  const [imgError, setImgError] = useState(false)
  const typeStyle = CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource
  const isLR = card.isLR === true

  // Compute link info for hover overlay
  const linkPilots = allCards && card.type === 'unit' && card.linkRequirement
    ? getLinkPilots(card, allCards)
    : null
  const linkPilot = linkPilots?.[0] ?? null
  const linkInDeck = linkPilot && mainDeck != null
    ? (mainDeck[linkPilot.id] ?? 0) > 0
    : null

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd?.()
  }

  return (
    <div
      className={`
        relative flex flex-col rounded-lg border overflow-hidden
        bg-bg-surface transition-all duration-150
        hover:bg-bg-elevated hover:scale-[1.02]
        ${isLR ? 'border-accent-gold/50' : 'border-white/10'}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Deck count badge */}
      {deckCount && deckCount > 0 && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-accent-gold/90 px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none shadow">
          ×{deckCount}
        </span>
      )}

      {/* LR badge */}
      {isLR && (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-accent-gold px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none shadow">
          LR
        </span>
      )}

      {/* Card image */}
      <div className={`relative w-full aspect-[5/7] bg-bg-elevated overflow-hidden ${onAdd ? 'group' : ''}`}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getCardImageUrl(card.id)}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback when image not available */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
              {card.type}
            </span>
            <p className="text-[10px] text-white/40 text-center leading-tight mt-1">{card.name}</p>
          </div>
        )}

        {/* Hover overlay with add button + link row */}
        {onAdd && (
          <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-2">
            <button
              type="button"
              disabled={!canAdd}
              onClick={handleAddClick}
              className={`
                w-12 h-12 rounded-full font-bold text-lg transition-all
                flex items-center justify-center
                ${
                  canAdd
                    ? 'bg-accent-gold text-bg-base hover:scale-110 active:scale-95 cursor-pointer'
                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                }
              `}
            >
              +
            </button>

            {/* Compact link row */}
            {linkPilots !== null && (
              <div className="text-[10px] text-center leading-tight">
                <span className="text-white/50">Link: </span>
                {linkPilot ? (
                  <>
                    <span className="text-white/90">{linkPilot.name}</span>
                    {linkInDeck != null && (
                      <span className={linkInDeck ? ' text-green-400' : ' text-white/30'}>
                        {linkInDeck ? ' ✓' : ' ✗'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-white/30">{card.linkRequirement} — 未有資料</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex flex-col gap-1.5 p-2">
        {/* Type badge (only shown when image loads) */}
        {!imgError && (
          <span className={`self-start rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
            {card.type}
          </span>
        )}

        {/* Card name */}
        <p className="text-xs font-semibold leading-tight text-white line-clamp-2">
          {card.name}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-1">
          {card.level != null && (
            <span className="text-[10px] text-white/50">
              L{card.level}
              {card.cost != null && <span className="text-white/30"> / C{card.cost}</span>}
            </span>
          )}

          {(card.type === 'unit' || card.type === 'base') && card.ap != null && (
            <span className="ml-auto text-[10px] text-white/70">
              {card.ap}/{card.hp}
            </span>
          )}

          {card.type === 'pilot' && card.apBoost != null && (
            <span className="ml-auto text-[10px] text-cardtype-pilot">
              +{card.apBoost}/+{card.hpBoost}
            </span>
          )}
        </div>

        {/* Color dots */}
        <div className="flex gap-1">
          {card.colors.map(color => (
            <span
              key={color}
              className={`h-1.5 w-1.5 rounded-full ${GAME_COLOR_DOTS[color] ?? 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `components/CardGrid.tsx`**

```tsx
import type { Card } from '../types/card'
import CardTile from './CardTile'

interface CardGridProps {
  cards: Card[]
  deckCounts?: Record<string, number>
  onAdd?: (card: Card) => void
  canAdd?: (card: Card) => boolean
  allCards?: Card[]
  mainDeck?: Record<string, number>
  onCardClick?: (card: Card) => void
}

export default function CardGrid({
  cards,
  deckCounts,
  onAdd,
  canAdd,
  allCards,
  mainDeck,
  onCardClick,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-2xl">🔍</p>
        <p className="mt-3 text-sm text-white/40">No cards match your filters.</p>
        <p className="text-xs text-white/25">Try removing some filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map(card => (
        <CardTile
          key={card.id}
          card={card}
          deckCount={deckCounts?.[card.id] ?? 0}
          onAdd={onAdd ? () => onAdd(card) : undefined}
          canAdd={canAdd ? canAdd(card) : true}
          allCards={allCards}
          mainDeck={mainDeck}
          onClick={onCardClick ? () => onCardClick(card) : undefined}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Run full test suite — confirm nothing broke**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run
```

Expected: 134 tests passed

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/CardTile.tsx components/CardGrid.tsx
git commit -m "feat(m12): add link row props to CardTile and CardGrid"
```

---

## Task 4: Wire `/cards` page — click + LinkPanel

**Files:**
- Modify: `app/cards/page.tsx` (full replacement)

**Context:**

`/cards` page currently shows filtered cards with no click behavior. We add:
- `selectedLinkCard: Card | null` state (null = no panel shown)
- `handleCardClick(card)` — only opens panel for units with `linkRequirement`; clicking the same card again closes the panel
- `<LinkPanel>` renders above the card grid when a card is selected
- `allCards` and `onCardClick` are passed to `CardGrid`; no `mainDeck` passed (no deck context on /cards)

`LinkPanel` is imported from `../../components/LinkPanel`.

- [ ] **Step 1: Replace `app/cards/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { getAllCards, filterCards } from '../../lib/cards'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import LinkPanel from '../../components/LinkPanel'
import type { Card, CardColor, CardType } from '../../types/card'

export default function CardsPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
  const [selectedLinkCard, setSelectedLinkCard] = useState<Card | null>(null)

  const filteredCards = useMemo(
    () => filterCards(allCards, selectedColors, selectedTypes),
    [allCards, selectedColors, selectedTypes]
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
    if (card.type !== 'unit' || !card.linkRequirement) return
    setSelectedLinkCard(prev => prev?.id === card.id ? null : card)
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

        {/* Link panel — shown when a linkable unit is selected */}
        {selectedLinkCard && (
          <div className="mb-4">
            <LinkPanel
              card={selectedLinkCard}
              allCards={allCards}
              onClose={() => setSelectedLinkCard(null)}
            />
          </div>
        )}

        <CardGrid
          cards={filteredCards}
          allCards={allCards}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run
```

Expected: 134 tests passed

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/cards/page.tsx
git commit -m "feat(m12): wire /cards page with link panel on click"
```

---

## Task 5: Wire `/build` page — hover link row

**Files:**
- Modify: `app/build/page.tsx`

**Context:**

`/build` page already has `allCards` (from `getAllCards()`) and `mainDeck` (state `Record<string, number>`) in scope. The `CardGrid` call around line 207 currently passes `cards`, `deckCounts`, `onAdd`, `canAdd`. We add `allCards` and `mainDeck` to that call so `CardTile` can render the compact link row on hover.

No structural change — just two new props on the existing `<CardGrid>` element.

- [ ] **Step 1: Find and update the `<CardGrid>` call in `app/build/page.tsx`**

Read the file first to find the exact CardGrid usage. It looks like this (around line 207–215):

```tsx
<CardGrid
  cards={filteredCards}
  deckCounts={mainDeck}
  onAdd={handleAdd}
  canAdd={card => canAddCard(card, mainDeck, allCards)}
/>
```

Change it to:

```tsx
<CardGrid
  cards={filteredCards}
  deckCounts={mainDeck}
  onAdd={handleAdd}
  canAdd={card => canAddCard(card, mainDeck, allCards)}
  allCards={allCards}
  mainDeck={mainDeck}
/>
```

- [ ] **Step 2: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run
```

Expected: 134 tests passed

- [ ] **Step 3: TypeScript check + build**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -10
```

Expected: no errors, build succeeds

- [ ] **Step 4: Smoke test**

```bash
npx next dev &
```

Open `http://localhost:3000/cards`:
- Click a unit card with `linkRequirement` (e.g. Nu Gundam) → LinkPanel appears above grid
- Click same card again → panel closes
- Click a pilot or command card → nothing happens

Open `http://localhost:3000/build`:
- Hover any unit with linkRequirement (e.g. Nu Gundam) → compact row shows "Link: Amuro Ray ✗/✓" depending on deck
- Add Amuro Ray pilot to deck → hover Nu Gundam → shows ✓
- Hover a unit without linkRequirement → no link row shown

Kill dev server after checking.

- [ ] **Step 5: Commit and push**

```bash
git add app/build/page.tsx
git commit -m "feat(m12): pass allCards + mainDeck to CardGrid on /build for link hover"
git push origin main
```
