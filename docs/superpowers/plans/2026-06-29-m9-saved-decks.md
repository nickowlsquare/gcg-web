# M9 Saved Decks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users save generated decks by name after auto-building, load them back into `/build`, copy them to clipboard as plain text, and manage them on a new `/decks` page.

**Architecture:** Pure functions in `lib/savedDecks.ts` handle array operations and text export. `hooks/useSavedDecks.ts` owns localStorage read/write (same pattern as `useMatchHistory`). A modal component prompts save after each auto-build. `/decks` lists all saved decks with load/copy/delete actions.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest, localStorage (no backend)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types/card.ts` | Add `SavedDeck` interface |
| Create | `lib/savedDecks.ts` | Pure functions: `addSavedDeck`, `removeSavedDeck`, `formatDeckExport` |
| Create | `lib/savedDecks.test.ts` | 7 Vitest tests |
| Create | `hooks/useSavedDecks.ts` | localStorage hook: `{ savedDecks, save, remove }` |
| Create | `components/SaveDeckModal.tsx` | Modal: name input + Save / Skip buttons |
| Modify | `app/build/page.tsx` | Show modal after auto-build; load `?saved=<id>` on mount |
| Modify | `app/counter/page.tsx` | Show modal after counter-build |
| Create | `app/decks/page.tsx` | `/decks` page — list, load, copy, delete |
| Modify | `components/Navbar.tsx` | Add "Decks" link after "History" |

---

### Task 1: Add `SavedDeck` type + `lib/savedDecks.ts` with TDD

**Files:**
- Modify: `types/card.ts`
- Create: `lib/savedDecks.ts`
- Create: `lib/savedDecks.test.ts`

**Context:** Project root is `/Users/nickckck/GCG Web`. All types live in `types/card.ts`. Pure functions go in `lib/`. Tests use Vitest with `import { describe, it, expect } from 'vitest'`. The existing `lib/history.ts` is a good pattern to follow.

`CardColor` and `Strategy` are already defined in `types/card.ts`:
```ts
export type CardColor = 'blue' | 'green' | 'red' | 'white' | 'purple'
export type Strategy = 'aggro' | 'midrange' | 'control' | 'attrition'
```

- [ ] **Step 1: Add `SavedDeck` to `types/card.ts`**

Open `types/card.ts`. After the `MatchResult` interface (at the end of the file), add:

```ts
export interface SavedDeck {
  id: string              // crypto.randomUUID()
  name: string            // user-given name
  createdAt: string       // ISO 8601
  colors: CardColor[]
  strategy: Strategy
  mainDeck: Record<string, number>
  resourceDeck: Record<string, number>
  source: 'build' | 'counter'
}
```

- [ ] **Step 2: Write the failing tests in `lib/savedDecks.test.ts`**

Create `lib/savedDecks.test.ts` with this exact content:

```ts
import { describe, it, expect } from 'vitest'
import { addSavedDeck, removeSavedDeck, formatDeckExport } from './savedDecks'
import type { SavedDeck, Card } from '../types/card'

function makeDeck(overrides: Partial<SavedDeck> = {}): SavedDeck {
  return {
    id: '1',
    name: 'Test Deck',
    createdAt: '2026-06-29T00:00:00.000Z',
    colors: ['blue'],
    strategy: 'control',
    mainDeck: { 'GD01-001': 4 },
    resourceDeck: { 'GD01-010': 2 },
    source: 'build',
    ...overrides,
  }
}

const deck1 = makeDeck({ id: '1', name: 'Blue Control' })
const deck2 = makeDeck({ id: '2', name: 'Red Aggro', colors: ['red'], strategy: 'aggro' })
const fixture: SavedDeck[] = [deck1, deck2]

const allCards: Card[] = [
  {
    id: 'GD01-001',
    name: 'Gundam RX-78',
    type: 'unit',
    rarity: 'R',
    set: 'GD01',
    colors: ['blue'],
    level: 3,
    cost: 3,
    traits: [],
    keywords: [],
    text: '',
  },
  {
    id: 'GD01-010',
    name: 'Luna II Base',
    type: 'resource',
    rarity: 'C',
    set: 'GD01',
    colors: ['blue'],
    level: null,
    cost: 1,
    traits: [],
    keywords: [],
    text: '',
  },
]

describe('addSavedDeck', () => {
  it('prepends entry to list', () => {
    const newDeck = makeDeck({ id: 'new' })
    const result = addSavedDeck(fixture, newDeck)
    expect(result[0]).toBe(newDeck)
    expect(result).toHaveLength(fixture.length + 1)
  })

  it('does not mutate the input array', () => {
    const original = [...fixture]
    addSavedDeck(fixture, makeDeck({ id: 'new' }))
    expect(fixture).toHaveLength(original.length)
  })
})

describe('removeSavedDeck', () => {
  it('removes deck by id', () => {
    const result = removeSavedDeck(fixture, '1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('does not mutate the input array', () => {
    const original = [...fixture]
    removeSavedDeck(fixture, '1')
    expect(fixture).toHaveLength(original.length)
  })

  it('returns unchanged array when id not found', () => {
    const result = removeSavedDeck(fixture, 'nonexistent')
    expect(result).toHaveLength(fixture.length)
    expect(result[0].id).toBe('1')
  })
})

describe('formatDeckExport', () => {
  it('includes deck name, color label, strategy, date', () => {
    const output = formatDeckExport(deck1, allCards)
    expect(output).toContain('Blue Control')
    expect(output).toContain('藍')
    expect(output).toContain('control')
    expect(output).toContain('2026-06-29')
  })

  it('includes card names from allCards lookup', () => {
    const output = formatDeckExport(deck1, allCards)
    expect(output).toContain('Gundam RX-78')
    expect(output).toContain('Luna II Base')
  })

  it('falls back to card id when card not found in allCards', () => {
    const deckWithUnknown = makeDeck({ mainDeck: { 'UNKNOWN-999': 2 }, resourceDeck: {} })
    const output = formatDeckExport(deckWithUnknown, allCards)
    expect(output).toContain('UNKNOWN-999')
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run lib/savedDecks.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './savedDecks'`

- [ ] **Step 4: Create `lib/savedDecks.ts`**

```ts
import type { Card, SavedDeck } from '../types/card'

const COLOR_LABELS: Record<string, string> = {
  blue: '藍',
  red: '紅',
  green: '綠',
  white: '白',
  purple: '紫',
}

/** Returns new array with entry prepended (newest first). Does not mutate input. */
export function addSavedDeck(decks: SavedDeck[], entry: SavedDeck): SavedDeck[] {
  return [entry, ...decks]
}

/** Returns new array with the matching deck removed. Does not mutate input. */
export function removeSavedDeck(decks: SavedDeck[], id: string): SavedDeck[] {
  return decks.filter(d => d.id !== id)
}

/**
 * Returns a plain-text deck list for clipboard export.
 * Card names are looked up from allCards; falls back to card ID if not found.
 * Color labels: 藍=blue, 紅=red, 綠=green, 白=white, 紫=purple.
 * Date is the first 10 chars of deck.createdAt (YYYY-MM-DD).
 */
export function formatDeckExport(deck: SavedDeck, allCards: Card[]): string {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const date = deck.createdAt.slice(0, 10)
  const colorLabel = deck.colors.map(c => COLOR_LABELS[c] ?? c).join('、')

  const formatEntries = (entries: Record<string, number>): string =>
    Object.entries(entries)
      .map(([id, count]) => {
        const name = cardMap.get(id)?.name ?? id
        return `${count}x ${id} ${name}`
      })
      .join('\n')

  const mainTotal = Object.values(deck.mainDeck).reduce((s, n) => s + n, 0)
  const resourceTotal = Object.values(deck.resourceDeck).reduce((s, n) => s + n, 0)

  return [
    deck.name,
    `${colorLabel} · ${deck.strategy} · ${date}`,
    '',
    `Main Deck (${mainTotal}):`,
    formatEntries(deck.mainDeck),
    '',
    `Resource Deck (${resourceTotal}):`,
    formatEntries(deck.resourceDeck),
  ].join('\n')
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd "/Users/nickckck/GCG Web"
npx vitest run lib/savedDecks.test.ts 2>&1 | tail -10
```

Expected: 7 tests PASS

- [ ] **Step 6: Run full suite to confirm nothing broken**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 112 tests PASS (105 existing + 7 new)

- [ ] **Step 7: Commit**

```bash
git add types/card.ts lib/savedDecks.ts lib/savedDecks.test.ts
git commit -m "feat(m9): add SavedDeck type and lib/savedDecks.ts with TDD"
```

---

### Task 2: Create `hooks/useSavedDecks.ts`

**Files:**
- Create: `hooks/useSavedDecks.ts`

**Context:** `hooks/` directory already exists (created in M8 for `useMatchHistory.ts`). This hook mirrors `useMatchHistory.ts` exactly — localStorage key is `'gcg-saved-decks'`. The `typeof window === 'undefined'` guard prevents build-time crash (learned from M8).

- [ ] **Step 1: Create `hooks/useSavedDecks.ts`**

```ts
'use client'

import { useState } from 'react'
import { addSavedDeck, removeSavedDeck } from '../lib/savedDecks'
import type { SavedDeck } from '../types/card'

const STORAGE_KEY = 'gcg-saved-decks'

export function useSavedDecks() {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
    // Guard against SSR prerender — localStorage is client-only.
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedDeck[]) : []
  })

  const save = (entry: SavedDeck) => {
    const next = addSavedDeck(savedDecks, entry)
    setSavedDecks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const remove = (id: string) => {
    const next = removeSavedDeck(savedDecks, id)
    setSavedDecks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { savedDecks, save, remove }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useSavedDecks.ts
git commit -m "feat(m9): add useSavedDecks hook with localStorage persistence"
```

---

### Task 3: Create `components/SaveDeckModal.tsx`

**Files:**
- Create: `components/SaveDeckModal.tsx`

**Context:** A modal overlay that appears after auto-build. Props: `open`, `onClose`, `onSave(name)`, `deckInfo`. When `open` is false, renders `null`. Auto-focuses the text input when opened. Escape key calls `onClose`. The Tailwind color tokens for this project: `bg-bg-base`, `bg-bg-surface`, `text-accent-gold`, `border-accent-gold/40`. All other nav components and pages follow this pattern.

- [ ] **Step 1: Create `components/SaveDeckModal.tsx`**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { CardColor, Strategy } from '../types/card'

interface SaveDeckModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
  deckInfo: {
    colors: CardColor[]
    strategy: Strategy
    mainCount: number
    resourceCount: number
  }
}

const COLOR_LABELS: Record<string, string> = {
  blue: '藍', red: '紅', green: '綠', white: '白', purple: '紫',
}

export default function SaveDeckModal({ open, onClose, onSave, deckInfo }: SaveDeckModalProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and reset name when modal opens
  useEffect(() => {
    if (open) {
      setName('')
      // setTimeout 0 lets the DOM render first so the input is focusable
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Escape key closes modal
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const colorLabel = deckInfo.colors.map(c => COLOR_LABELS[c] ?? c).join('、')

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-bg-surface p-6 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-4">
          儲存牌組
        </p>

        {/* Deck summary */}
        <div className="mb-4 rounded-lg border border-white/10 bg-bg-base px-3 py-2 text-xs text-white/40">
          {colorLabel} · {deckInfo.strategy} · {deckInfo.mainCount} main / {deckInfo.resourceCount} res
        </div>

        {/* Name input */}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="輸入牌組名稱…"
          className="w-full rounded-lg border border-white/10 bg-bg-base px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none mb-4"
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-lg border border-accent-gold/40 bg-accent-gold/10 py-2 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-30"
          >
            儲存
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            跳過
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/SaveDeckModal.tsx
git commit -m "feat(m9): add SaveDeckModal component"
```

---

### Task 4: Wire `/build` page

**Files:**
- Modify: `app/build/page.tsx`

**Context:** Current `app/build/page.tsx` has a `BuildPageContent` function component. It already:
- Imports `useMatchHistory` and calls `const { history } = useMatchHistory()`
- Has a `useEffect` that reads `?deck=<topDeckName>` to pre-fill from a top deck (around line 35)
- Calls `autofill(...)` inside `handleAutoBuild()` (line 76)

Changes needed:
1. Add imports for `useSavedDecks` and `SaveDeckModal`
2. Call `useSavedDecks()` and get `{ savedDecks, save }`
3. Add `saveModalOpen` state
4. Add a second `useEffect` for `?saved=<id>` loading (runs once on mount, independently of the `?deck=` effect)
5. Modify `handleAutoBuild` to call `setSaveModalOpen(true)` after generating
6. Add `handleSave` function
7. Add `<SaveDeckModal>` to JSX (just before closing `</div>` of the return)

- [ ] **Step 1: Read `app/build/page.tsx` in full**

Read the file so you know the exact current content before editing.

- [ ] **Step 2: Add new imports**

After the existing `import { useMatchHistory }` line (line 13), add:

```ts
import { useSavedDecks } from '../../hooks/useSavedDecks'
import SaveDeckModal from '../../components/SaveDeckModal'
```

- [ ] **Step 3: Add hook call and state inside `BuildPageContent`**

After `const { history } = useMatchHistory()` (line 20), add:

```ts
const { savedDecks, save } = useSavedDecks()
const [saveModalOpen, setSaveModalOpen] = useState(false)
```

- [ ] **Step 4: Add `?saved=` loading useEffect**

After the existing `?deck=` useEffect (ends around line 58), add a new effect:

```ts
// M9: pre-fill from ?saved=<id> URL param (runs once on mount)
useEffect(() => {
  const id = searchParams.get('saved')
  if (!id) return
  const found = savedDecks.find(d => d.id === id)
  if (!found) return
  setMainDeck(found.mainDeck)
  setResourceDeck(found.resourceDeck)
  setSelectedColors(found.colors)
  setStrategy(found.strategy)
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Update `handleAutoBuild`**

Replace the current `handleAutoBuild` (line 76–81):

```ts
function handleAutoBuild() {
  if (!strategy || selectedColors.length === 0) return
  const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors, history)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
  setSaveModalOpen(true)
}
```

- [ ] **Step 6: Add `handleSave` function**

After `handleAutoBuild`, add:

```ts
function handleSave(name: string) {
  save({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    colors: selectedColors,
    strategy: strategy!,
    mainDeck,
    resourceDeck,
    source: 'build',
  })
}
```

- [ ] **Step 7: Add `<SaveDeckModal>` to JSX**

Inside the `return (...)` of `BuildPageContent`, just before the closing `</div>` of the outer wrapper, add:

```tsx
<SaveDeckModal
  open={saveModalOpen}
  onClose={() => setSaveModalOpen(false)}
  onSave={handleSave}
  deckInfo={{
    colors: selectedColors,
    strategy: strategy ?? 'aggro',
    mainCount: Object.values(mainDeck).reduce((s, n) => s + n, 0),
    resourceCount: Object.values(resourceDeck).reduce((s, n) => s + n, 0),
  }}
/>
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If TypeScript complains about `strategy` being `null`, change `strategy!` to `strategy as Strategy` (import `Strategy` type is already in the imports at line 14).

- [ ] **Step 9: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 112 tests PASS

- [ ] **Step 10: Commit**

```bash
git add app/build/page.tsx
git commit -m "feat(m9): show save modal after auto-build; load saved deck via ?saved= param"
```

---

### Task 5: Wire `/counter` page

**Files:**
- Modify: `app/counter/page.tsx`

**Context:** Current `app/counter/page.tsx` mirrors `/build` in structure. It already imports `useMatchHistory`. Changes are the same as Task 4 except:
- `source: 'counter'` (not `'build'`)
- No `?saved=` loading useEffect (loading always goes to `/build`)
- `handleCounterBuild` is the function to modify (not `handleAutoBuild`)

- [ ] **Step 1: Read `app/counter/page.tsx` in full**

- [ ] **Step 2: Add new imports**

After the existing `import { useMatchHistory }` line (line 14), add:

```ts
import { useSavedDecks } from '../../hooks/useSavedDecks'
import SaveDeckModal from '../../components/SaveDeckModal'
```

- [ ] **Step 3: Add hook call and state inside `CounterPageContent`**

After `const { history } = useMatchHistory()` (line 21), add:

```ts
const { save } = useSavedDecks()
const [saveModalOpen, setSaveModalOpen] = useState(false)
```

- [ ] **Step 4: Update `handleCounterBuild`**

Replace the current `handleCounterBuild` (line 76–81):

```ts
function handleCounterBuild() {
  if (!targetDeck || selectedColors.length === 0 || !strategy) return
  const result = counterAutofill(mainDeck, resourceDeck, allCards, topDecks, targetDeck, selectedColors, strategy, history)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
  setSaveModalOpen(true)
}
```

- [ ] **Step 5: Add `handleSave` function**

After `handleCounterBuild`, add:

```ts
function handleSave(name: string) {
  save({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    colors: selectedColors,
    strategy: strategy!,
    mainDeck,
    resourceDeck,
    source: 'counter',
  })
}
```

- [ ] **Step 6: Add `<SaveDeckModal>` to JSX**

Inside the `return (...)` of `CounterPageContent`, just before the closing `</div>` of the outer wrapper (before `<TopDeckDrawer ...`), add:

```tsx
<SaveDeckModal
  open={saveModalOpen}
  onClose={() => setSaveModalOpen(false)}
  onSave={handleSave}
  deckInfo={{
    colors: selectedColors,
    strategy: strategy ?? 'aggro',
    mainCount: Object.values(mainDeck).reduce((s, n) => s + n, 0),
    resourceCount: Object.values(resourceDeck).reduce((s, n) => s + n, 0),
  }}
/>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 8: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 112 tests PASS

- [ ] **Step 9: Commit**

```bash
git add app/counter/page.tsx
git commit -m "feat(m9): show save modal after counter-build"
```

---

### Task 6: Create `app/decks/page.tsx`

**Files:**
- Create: `app/decks/page.tsx`

**Context:** This is a `'use client'` page. Uses `useSavedDecks()` for data and `getAllCards()` for card name lookup in `formatDeckExport`. `useRouter` from `next/navigation` handles navigation to `/build?saved=<id>`. The Copy button shows a brief "已複製！" feedback using local `copiedId` state + setTimeout.

- [ ] **Step 1: Create `app/decks/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSavedDecks } from '../../hooks/useSavedDecks'
import { getAllCards } from '../../lib/cards'
import { formatDeckExport } from '../../lib/savedDecks'

const COLOR_LABELS: Record<string, string> = {
  blue: '藍', red: '紅', green: '綠', white: '白', purple: '紫',
}

export default function DecksPage() {
  const router = useRouter()
  const { savedDecks, remove } = useSavedDecks()
  const allCards = useMemo(() => getAllCards(), [])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCopy(id: string) {
    const deck = savedDecks.find(d => d.id === id)
    if (!deck) return
    const text = formatDeckExport(deck, allCards)
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (savedDecks.length === 0) {
    return (
      <p className="text-sm italic text-white/30">
        未有儲存牌組。喺 Build 或 Counter 頁面生成後儲存吧！
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {savedDecks.map(deck => {
        const mainCount = Object.values(deck.mainDeck).reduce((s, n) => s + n, 0)
        const resourceCount = Object.values(deck.resourceDeck).reduce((s, n) => s + n, 0)
        const date = deck.createdAt.slice(0, 10)
        const colorLabel = deck.colors.map(c => COLOR_LABELS[c] ?? c).join('、')

        return (
          <div key={deck.id} className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{deck.name}</p>
                <p className="mt-0.5 text-xs text-white/30">
                  {colorLabel} · {deck.strategy} · {date} · {mainCount} main / {resourceCount} res
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push('/build?saved=' + deck.id)}
                  className="rounded border border-accent-gold/40 px-2.5 py-1 text-xs text-accent-gold hover:bg-accent-gold/10 transition-colors"
                >
                  載入
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(deck.id)}
                  className="rounded border border-white/10 px-2.5 py-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  {copiedId === deck.id ? '已複製！' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(deck.id)}
                  className="rounded border border-white/10 px-2.5 py-1 text-xs text-white/30 hover:text-red-400 transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 112 tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/decks/page.tsx
git commit -m "feat(m9): add /decks page with list, load, copy, delete actions"
```

---

### Task 7: Add Navbar "Decks" link + full verification

**Files:**
- Modify: `components/Navbar.tsx`

**Context:** Current Navbar ends with a "History" `<Link>` (lines 52–57). Add "Decks" immediately after it, using the same pattern.

- [ ] **Step 1: Add "Decks" link to `components/Navbar.tsx`**

After the "History" `<Link>` block (the closing `</Link>` around line 57), add:

```tsx
<Link
  href="/decks"
  className={`text-sm transition-colors ${pathname === '/decks' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  Decks
</Link>
```

- [ ] **Step 2: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web"
npm test -- --run 2>&1 | tail -8
```

Expected: 112 tests PASS

- [ ] **Step 3: Production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Generating static pages` with `/decks` in the route list. No prerender errors.

- [ ] **Step 4: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat(m9): add Decks nav link"
```

- [ ] **Step 5: Push to origin**

```bash
git push
```

Expected: all commits pushed to `main`.
