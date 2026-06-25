# M0 Implementation Plan — GCG Web Project Skeleton + /cards Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the GCG Web Next.js project with real card data and a filterable /cards page in Premium TCG visual theme.

**Architecture:** Pure-function data layer (`lib/cards.ts`) supplies filtered card arrays to React components. UI components are stateless where possible; filter state lives in the /cards page component. All logic is separated from presentation.

**Tech Stack:** Next.js 14 (App Router), TypeScript (strict), Tailwind CSS v3, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `types/card.ts` | All shared TypeScript types |
| `data/cards.json` | 12 real cards from deckplanet API |
| `lib/cards.ts` | `getAllCards()`, `filterCards()` pure functions |
| `lib/cards.test.ts` | Vitest tests for `filterCards` |
| `tailwind.config.ts` | Custom color tokens (bg, accent, game, cardType) |
| `app/globals.css` | Base body background + resets |
| `app/layout.tsx` | Root layout with Navbar |
| `app/page.tsx` | Redirect → /cards |
| `app/cards/page.tsx` | /cards page — holds filter state, composes components |
| `components/Navbar.tsx` | Top navigation bar |
| `components/FilterSidebar.tsx` | Color + type filter toggles |
| `components/CardGrid.tsx` | Responsive grid wrapper |
| `components/CardTile.tsx` | Single card display tile |
| `vitest.config.ts` | Vitest configuration |
| `vitest.setup.ts` | Test setup (jest-dom matchers) |

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, project structure

- [ ] **Step 1: Create Next.js app**

Run from the parent directory (`/Users/nickckck`):
```bash
cd "/Users/nickckck"
npx create-next-app@14 "GCG Web" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*" \
  --no-git
```
When prompted, accept all defaults.

Expected output ends with:
```
✔ Success! Created GCG Web at /Users/nickckck/GCG Web
```

- [ ] **Step 2: Install Vitest and testing deps**

```bash
cd "/Users/nickckck/GCG Web"
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `added N packages` with no errors.

- [ ] **Step 3: Add test script to package.json**

Open `package.json`. In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
})
```

- [ ] **Step 5: Create vitest.setup.ts**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Verify test setup works**

```bash
cd "/Users/nickckck/GCG Web"
npm test
```

Expected: `No test files found` (zero tests, but Vitest runs without error).

- [ ] **Step 7: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add -A
git commit -m "chore: initialize Next.js 14 project with TypeScript, Tailwind, Vitest"
```

---

## Task 2: Tailwind Color Tokens + Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace tailwind.config.ts**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#0f0a1e',
          surface:  '#1a1030',
          elevated: '#221540',
        },
        accent: {
          gold: '#f0c060',
        },
        game: {
          blue:   '#3b7dd8',
          green:  '#4a9f5c',
          red:    '#d44a4a',
          white:  '#c8c8d4',
          purple: '#9a60d0',
        },
        cardtype: {
          unit:    '#3b7dd8',
          pilot:   '#4a9f5c',
          command: '#d47a2a',
          base:    '#7a4ab0',
          resource:'#888888',
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Replace app/globals.css**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg-base text-white;
    font-family: system-ui, -apple-system, sans-serif;
  }

  * {
    box-sizing: border-box;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "style: add Premium TCG color tokens and global base styles"
```

---

## Task 3: Type Definitions

**Files:**
- Create: `types/card.ts`

- [ ] **Step 1: Create types/card.ts**

```ts
// types/card.ts
export type CardColor = 'blue' | 'green' | 'red' | 'white' | 'purple'
export type CardType = 'unit' | 'pilot' | 'command' | 'base' | 'resource'
export type Strategy = 'aggro' | 'midrange' | 'control' | 'attrition'

export interface Card {
  // Identifiers
  id: string           // e.g. "GD01-015"
  name: string
  type: CardType
  rarity: string       // "C" | "U" | "R" | "LR" | "P"
  set: string          // e.g. "GD01"
  sourceTitle?: string // e.g. "Mobile Suit Gundam SEED"

  // Game stats
  colors: CardColor[]  // 1+ colors; colorless = []
  level: number | null
  cost: number | null
  ap?: number          // Unit / Base attack power
  hp?: number          // Unit / Base hit points
  isLR?: boolean

  // Pilot-specific fields
  apBoost?: number
  hpBoost?: number
  linkRequirement?: string
  blockIcon?: number

  // Classification & effects
  traits: string[]     // e.g. ["Earth Alliance"]
  keywords: string[]   // e.g. ["Deploy", "Burst"]
  zones?: string[]     // e.g. ["Space", "Earth"]
  text: string

  // Legality
  isBanned?: boolean
  isLimited?: boolean
}

export interface DeckEntry {
  id: string
  count: number
}

export interface Deck {
  colors: CardColor[]  // max 2
  main: DeckEntry[]    // total = 50
  resource: DeckEntry[]// total = 10
}

export interface TopDeck {
  name: string
  colors: CardColor[]
  keyCards: string[]
  strategy: Strategy
  list?: DeckEntry[]
  source: string
  date: string
  placement?: number
}
```

- [ ] **Step 2: Commit**

```bash
git add types/card.ts
git commit -m "feat: add Card, Deck, TopDeck TypeScript types"
```

---

## Task 4: Sample Card Data

**Files:**
- Create: `data/cards.json`

- [ ] **Step 1: Create data/cards.json**

12 real cards sourced from `api.deckplanet.net/cardsearch/gundam_cards`, normalized to our `Card` type:

```json
[
  {
    "id": "ST03-001",
    "name": "Sinanju",
    "type": "unit",
    "colors": ["red"],
    "level": 6,
    "cost": 6,
    "ap": 5,
    "hp": 4,
    "rarity": "LR",
    "isLR": true,
    "set": "ST03",
    "sourceTitle": "Mobile Suit Gundam Unicorn",
    "traits": ["Neo Zeon"],
    "keywords": ["During Pair", "High-Maneuver"],
    "zones": ["Space", "Earth"],
    "linkRequirement": "Full Frontal",
    "text": "[During Pair][High-Maneuver] When this unit attacks, if it is paired with a Pilot, it gains +2 AP until end of turn.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST03-006",
    "name": "Char's Zaku II",
    "type": "unit",
    "colors": ["green"],
    "level": 3,
    "cost": 2,
    "ap": 3,
    "hp": 2,
    "rarity": "LR",
    "isLR": true,
    "set": "ST03",
    "sourceTitle": "Mobile Suit Gundam",
    "traits": ["Zeon"],
    "keywords": ["Destroyed"],
    "zones": ["Space", "Earth"],
    "linkRequirement": "Char Aznable",
    "text": "[Destroyed] When this unit is destroyed, draw 1 card.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "GD01-018",
    "name": "ReZEL",
    "type": "unit",
    "colors": ["blue"],
    "level": 3,
    "cost": 2,
    "ap": 4,
    "hp": 3,
    "rarity": "C",
    "isLR": false,
    "set": "GD01",
    "sourceTitle": "Mobile Suit Gundam Unicorn",
    "traits": ["Earth Federation"],
    "keywords": [],
    "zones": ["Space", "Earth"],
    "text": "This unit can transform. When it transforms, it gains the [High-Maneuver] keyword.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "GD01-008",
    "name": "Guntank",
    "type": "unit",
    "colors": ["blue"],
    "level": 2,
    "cost": 1,
    "ap": 1,
    "hp": 2,
    "rarity": "U",
    "isLR": false,
    "set": "GD01",
    "sourceTitle": "Mobile Suit Gundam",
    "traits": ["Earth Federation", "White Base Team"],
    "keywords": ["Deploy"],
    "zones": ["Space", "Earth"],
    "text": "[Deploy] Draw 1. Then, discard 1.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST01-007",
    "name": "Gundam Aerial (Bit on Form)",
    "type": "unit",
    "colors": ["white"],
    "level": 4,
    "cost": 2,
    "ap": 3,
    "hp": 4,
    "rarity": "C",
    "isLR": false,
    "set": "ST01",
    "sourceTitle": "Mobile Suit Gundam: The Witch from Mercury",
    "traits": ["Academy"],
    "keywords": [],
    "zones": ["Space", "Earth"],
    "linkRequirement": "Suletta Mercury",
    "text": "When paired with [Suletta Mercury], this unit gains +1 AP and [Blocker].",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST01-011",
    "name": "Suletta Mercury",
    "type": "pilot",
    "colors": ["white"],
    "level": 4,
    "cost": 1,
    "ap": 1,
    "hp": 2,
    "apBoost": 1,
    "hpBoost": 2,
    "blockIcon": 1,
    "rarity": "C",
    "isLR": false,
    "set": "ST01",
    "sourceTitle": "Mobile Suit Gundam: The Witch from Mercury",
    "traits": ["Academy"],
    "keywords": ["Burst", "Attack", "Once per turn"],
    "text": "[Burst][Attack][Once per turn] When this pilot attacks while linked, draw 1 card.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "GD03-092",
    "name": "Nyaan",
    "type": "pilot",
    "colors": ["red"],
    "level": 4,
    "cost": 4,
    "apBoost": 1,
    "hpBoost": 2,
    "blockIcon": 1,
    "rarity": "U",
    "isLR": false,
    "set": "GD03",
    "sourceTitle": "Mobile Suit Gundam GQuuuuuuX",
    "traits": ["Zeon", "Newtype"],
    "keywords": ["Burst", "When Linked"],
    "text": "[Burst][When Linked] When this pilot is linked, your opponent discards 1 card.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "GD01-094",
    "name": "Yzak Jule",
    "type": "pilot",
    "colors": ["red"],
    "level": 3,
    "cost": 1,
    "ap": 1,
    "hp": 1,
    "apBoost": 1,
    "hpBoost": 1,
    "blockIcon": 1,
    "rarity": "C",
    "isLR": false,
    "set": "GD01",
    "sourceTitle": "Mobile Suit Gundam SEED",
    "traits": ["ZAFT", "Coordinator"],
    "keywords": ["Burst", "Once per turn"],
    "text": "[Burst][Once per turn] When a unit you control destroys an enemy unit, draw 1 card.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "GD01-102",
    "name": "Securing the Supply Line",
    "type": "command",
    "colors": ["blue"],
    "level": 4,
    "cost": 2,
    "rarity": "U",
    "isLR": false,
    "set": "GD01",
    "sourceTitle": "Mobile Suit Gundam",
    "traits": [],
    "keywords": ["Main"],
    "text": "[Main] Search your deck for 1 Earth Federation unit with cost 2 or less, reveal it, and add it to your hand. Shuffle your deck.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST01-014",
    "name": "Unforeseen Incident",
    "type": "command",
    "colors": ["white"],
    "level": 3,
    "cost": 1,
    "rarity": "C",
    "isLR": false,
    "set": "ST01",
    "sourceTitle": "Mobile Suit Gundam: The Witch from Mercury",
    "traits": [],
    "keywords": ["Action", "Burst", "Main"],
    "text": "[Action][Main] Until end of turn, 1 unit you control gains +1 AP. [Burst] Draw 1.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST01-016",
    "name": "Asticassia School of Technology, Earth House",
    "type": "base",
    "colors": ["white"],
    "level": 2,
    "cost": 1,
    "hp": 5,
    "rarity": "C",
    "isLR": false,
    "set": "ST01",
    "sourceTitle": "Mobile Suit Gundam: The Witch from Mercury",
    "traits": ["Academy", "Stronghold"],
    "keywords": ["Burst", "Deploy", "Activate Main"],
    "zones": ["Space"],
    "text": "[Burst][Deploy] When this base is deployed, draw 1. [Activate Main] Rest this base: gain 1 resource.",
    "isBanned": false,
    "isLimited": false
  },
  {
    "id": "ST02-015",
    "name": "Saint Gabriel Institute",
    "type": "base",
    "colors": ["green"],
    "level": 2,
    "cost": 2,
    "hp": 5,
    "rarity": "C",
    "isLR": false,
    "set": "ST02",
    "sourceTitle": "Mobile Suit Gundam Wing",
    "traits": ["Academy", "Stronghold"],
    "keywords": ["Burst", "Deploy"],
    "zones": ["Earth"],
    "text": "[Burst][Deploy] When this base is deployed, you may deploy 1 cost-1 unit from your hand without paying its cost.",
    "isBanned": false,
    "isLimited": false
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add data/cards.json
git commit -m "feat: add 12 real sample cards from deckplanet API (2 LR, all 4 types)"
```

---

## Task 5: `lib/cards.ts` — TDD

**Files:**
- Create: `lib/cards.ts`
- Create: `lib/cards.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/cards.test.ts
import { describe, it, expect } from 'vitest'
import { filterCards, getAllCards } from './cards'
import type { Card, CardColor, CardType } from '../types/card'

const mockCards: Card[] = [
  {
    id: 'TEST-001', name: 'Blue Unit', type: 'unit',
    colors: ['blue'], level: 2, cost: 1, ap: 2, hp: 2,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-002', name: 'Red Pilot', type: 'pilot',
    colors: ['red'], level: 3, cost: 1,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-003', name: 'Green LR Unit', type: 'unit',
    colors: ['green'], level: 3, cost: 2, ap: 3, hp: 2,
    rarity: 'LR', isLR: true, set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-004', name: 'Blue Command', type: 'command',
    colors: ['blue'], level: 3, cost: 2,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
]

describe('filterCards', () => {
  it('returns all cards when no filters are active', () => {
    const result = filterCards(mockCards, [], [])
    expect(result).toHaveLength(4)
  })

  it('filters by single color', () => {
    const result = filterCards(mockCards, ['blue'], [])
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['TEST-001', 'TEST-004'])
  })

  it('filters by multiple colors (OR logic)', () => {
    const result = filterCards(mockCards, ['blue', 'red'], [])
    expect(result).toHaveLength(3)
    expect(result.map(c => c.id)).toContain('TEST-001')
    expect(result.map(c => c.id)).toContain('TEST-002')
    expect(result.map(c => c.id)).toContain('TEST-004')
  })

  it('filters by single type', () => {
    const result = filterCards(mockCards, [], ['unit'])
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['TEST-001', 'TEST-003'])
  })

  it('filters by color AND type simultaneously', () => {
    const result = filterCards(mockCards, ['blue'], ['unit'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('TEST-001')
  })

  it('returns empty array when no cards match', () => {
    const result = filterCards(mockCards, ['purple'], ['base'])
    expect(result).toHaveLength(0)
  })

  it('does not mutate the input array', () => {
    const original = [...mockCards]
    filterCards(mockCards, ['blue'], [])
    expect(mockCards).toEqual(original)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "/Users/nickckck/GCG Web"
npm test
```

Expected: FAIL — `Cannot find module './cards'`

- [ ] **Step 3: Implement lib/cards.ts**

```ts
// lib/cards.ts
import type { Card, CardColor, CardType } from '../types/card'
import cardsData from '../data/cards.json'

export function getAllCards(): Card[] {
  return cardsData as Card[]
}

export function filterCards(
  cards: Card[],
  colors: CardColor[],
  types: CardType[]
): Card[] {
  return cards.filter(card => {
    const colorMatch =
      colors.length === 0 ||
      card.colors.some(c => colors.includes(c))

    const typeMatch =
      types.length === 0 ||
      types.includes(card.type)

    return colorMatch && typeMatch
  })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected output:
```
✓ lib/cards.test.ts (7)
  ✓ filterCards > returns all cards when no filters are active
  ✓ filterCards > filters by single color
  ✓ filterCards > filters by multiple colors (OR logic)
  ✓ filterCards > filters by single type
  ✓ filterCards > filters by color AND type simultaneously
  ✓ filterCards > returns empty array when no cards match
  ✓ filterCards > does not mutate the input array

Test Files  1 passed (1)
Tests       7 passed (7)
```

- [ ] **Step 5: Commit**

```bash
git add lib/cards.ts lib/cards.test.ts
git commit -m "feat: add filterCards pure function with full test coverage"
```

---

## Task 6: Navbar Component

**Files:**
- Create: `components/Navbar.tsx`

- [ ] **Step 1: Create components/Navbar.tsx**

```tsx
// components/Navbar.tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-bg-base/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/cards" className="text-accent-gold font-bold tracking-widest text-sm">
          ✦ GCG
        </Link>
        <div className="flex gap-6">
          <Link href="/cards" className="text-sm text-white/60 hover:text-white transition-colors">
            Cards
          </Link>
          <span className="text-sm text-white/20 cursor-not-allowed">Builder</span>
          <span className="text-sm text-white/20 cursor-not-allowed">Counter</span>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add Navbar component with gold logo and nav links"
```

---

## Task 7: CardTile Component

**Files:**
- Create: `components/CardTile.tsx`

- [ ] **Step 1: Create components/CardTile.tsx**

```tsx
// components/CardTile.tsx
import type { Card } from '../types/card'

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

interface CardTileProps {
  card: Card
}

export default function CardTile({ card }: CardTileProps) {
  const typeStyle = CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource
  const isLR = card.isLR === true

  return (
    <div
      className={`
        relative flex flex-col gap-2 rounded-lg border p-3
        bg-bg-surface transition-all duration-150
        hover:bg-bg-elevated hover:scale-[1.02]
        ${isLR ? 'border-accent-gold/50' : 'border-white/10'}
      `}
    >
      {/* LR badge */}
      {isLR && (
        <span className="absolute -top-2 -right-2 rounded-full bg-accent-gold px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none">
          LR
        </span>
      )}

      {/* Card type badge */}
      <span className={`self-start rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
        {card.type}
      </span>

      {/* Card name */}
      <p className="text-xs font-semibold leading-tight text-white line-clamp-2 min-h-[2rem]">
        {card.name}
      </p>

      {/* Card ID */}
      <p className="font-mono text-[10px] text-white/30">{card.id}</p>

      {/* Stats row */}
      <div className="flex items-center gap-2 mt-auto">
        {/* Level / Cost */}
        {card.level != null && (
          <span className="text-[10px] text-white/50">
            L{card.level}
            {card.cost != null && <span className="text-white/30"> / C{card.cost}</span>}
          </span>
        )}

        {/* AP / HP for units and bases */}
        {(card.type === 'unit' || card.type === 'base') && card.ap != null && (
          <span className="ml-auto text-[10px] text-white/70">
            {card.ap}/{card.hp}
          </span>
        )}

        {/* AP boost / HP boost for pilots */}
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
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CardTile.tsx
git commit -m "feat: add CardTile component with type colors, LR badge, and stats"
```

---

## Task 8: CardGrid Component

**Files:**
- Create: `components/CardGrid.tsx`

- [ ] **Step 1: Create components/CardGrid.tsx**

```tsx
// components/CardGrid.tsx
import type { Card } from '../types/card'
import CardTile from './CardTile'

interface CardGridProps {
  cards: Card[]
}

export default function CardGrid({ cards }: CardGridProps) {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map(card => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CardGrid.tsx
git commit -m "feat: add CardGrid responsive grid with empty state"
```

---

## Task 9: FilterSidebar Component

**Files:**
- Create: `components/FilterSidebar.tsx`

- [ ] **Step 1: Create components/FilterSidebar.tsx**

```tsx
// components/FilterSidebar.tsx
'use client'

import type { CardColor, CardType } from '../types/card'

const COLORS: { value: CardColor; label: string; dot: string }[] = [
  { value: 'blue',   label: 'Blue',   dot: 'bg-game-blue'   },
  { value: 'green',  label: 'Green',  dot: 'bg-game-green'  },
  { value: 'red',    label: 'Red',    dot: 'bg-game-red'    },
  { value: 'white',  label: 'White',  dot: 'bg-game-white'  },
  { value: 'purple', label: 'Purple', dot: 'bg-game-purple' },
]

const TYPES: { value: CardType; label: string; textColor: string; borderColor: string }[] = [
  { value: 'unit',    label: 'Unit',    textColor: 'text-cardtype-unit',    borderColor: 'border-cardtype-unit/40'    },
  { value: 'pilot',   label: 'Pilot',   textColor: 'text-cardtype-pilot',   borderColor: 'border-cardtype-pilot/40'   },
  { value: 'command', label: 'Command', textColor: 'text-cardtype-command', borderColor: 'border-cardtype-command/40' },
  { value: 'base',    label: 'Base',    textColor: 'text-cardtype-base',    borderColor: 'border-cardtype-base/40'    },
]

interface FilterSidebarProps {
  selectedColors: CardColor[]
  selectedTypes: CardType[]
  onColorToggle: (color: CardColor) => void
  onTypeToggle: (type: CardType) => void
  onClearAll: () => void
  totalCards: number
  filteredCount: number
}

export default function FilterSidebar({
  selectedColors,
  selectedTypes,
  onColorToggle,
  onTypeToggle,
  onClearAll,
  totalCards,
  filteredCount,
}: FilterSidebarProps) {
  return (
    <aside className="w-48 shrink-0">
      <div className="sticky top-20 rounded-lg border border-white/10 bg-bg-surface p-4 space-y-5">
        {/* Result count */}
        <p className="text-xs text-white/40">
          Showing <span className="text-white/70 font-semibold">{filteredCount}</span> / {totalCards} cards
        </p>

        {/* Color filter */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
            Color
          </p>
          <div className="flex flex-col gap-1.5">
            {COLORS.map(({ value, label, dot }) => {
              const active = selectedColors.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => onColorToggle(value)}
                  className={`
                    flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors
                    ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}
                  `}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dot} ${active ? 'opacity-100' : 'opacity-40'}`} />
                  {label}
                  {active && <span className="ml-auto text-white/30">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
            Type
          </p>
          <div className="flex flex-col gap-1.5">
            {TYPES.map(({ value, label, textColor, borderColor }) => {
              const active = selectedTypes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => onTypeToggle(value)}
                  className={`
                    rounded border px-2 py-1.5 text-xs text-left transition-colors
                    ${active
                      ? `${textColor} ${borderColor} bg-white/10`
                      : 'border-transparent text-white/40 hover:text-white/60'
                    }
                  `}
                >
                  {label}
                  {active && <span className="float-right text-white/40">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Clear filters */}
        {(selectedColors.length > 0 || selectedTypes.length > 0) && (
          <button
            onClick={onClearAll}
            className="w-full rounded border border-white/10 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/FilterSidebar.tsx
git commit -m "feat: add FilterSidebar with color and type toggles"
```

---

## Task 10: Root Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '../components/Navbar'

export const metadata: Metadata = {
  title: 'GCG Deck Builder',
  description: 'Gundam Card Game automatic deck builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-white antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add root layout with Navbar and max-width container"
```

---

## Task 11: Home Page Redirect

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/cards')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redirect home page to /cards"
```

---

## Task 12: /cards Page

**Files:**
- Create: `app/cards/page.tsx`

- [ ] **Step 1: Create app/cards/page.tsx**

```tsx
// app/cards/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { getAllCards, filterCards } from '../../lib/cards'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import type { CardColor, CardType } from '../../types/card'

export default function CardsPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])

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
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
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
        <CardGrid cards={filteredCards} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/cards/page.tsx
git commit -m "feat: add /cards page with filter state and card grid"
```

---

## Task 13: Build Verification

- [ ] **Step 1: Run all tests**

```bash
cd "/Users/nickckck/GCG Web"
npm test
```

Expected:
```
Test Files  1 passed (1)
Tests       7 passed (7)
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected output ends with:
```
Route (app)              Size     First Load JS
┌ ○ /                    ...
└ ● /cards               ...

✓ Compiled successfully
```

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:3000` in browser. Verify:
1. ✅ Redirects to `/cards`
2. ✅ Deep purple background, gold "✦ GCG" navbar logo
3. ✅ Left sidebar with Color + Type filters
4. ✅ 12 cards shown in grid
5. ✅ Clicking "Blue" filter hides non-blue cards instantly
6. ✅ Sinanju and Char's Zaku II have gold border + LR badge
7. ✅ Pilot cards show "+1/+2" boost instead of AP/HP

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(M0): complete project skeleton and /cards page

- Next.js 14 + TypeScript + Tailwind with Premium TCG theme
- 12 real cards from deckplanet API (2 LR, all 4 types)
- filterCards pure function with 7 passing tests
- /cards page with left sidebar filter (color + type)
- Responsive card grid with LR badges and type color coding"
```

---

## M0 Done ✓

After Task 13 passes, M0 is complete. Next step: **M1** — `/builder` 手動 deck builder.
