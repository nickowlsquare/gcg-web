# M9 /decks Page — Design Spec

**Date:** 2026-06-29
**Milestone:** M9 — Saved Decks

---

## Goal

Let users save generated decks by name after building in `/build` or `/counter`. Saved decks persist in `localStorage`, can be loaded back into `/build`, copied to clipboard as plain text, or deleted. A new `/decks` page lists all saved decks. No backend required.

---

## Architecture

| Action | File | Change |
|--------|------|--------|
| Modify | `types/card.ts` | Add `SavedDeck` interface |
| Create | `lib/savedDecks.ts` | Pure functions: `addSavedDeck`, `removeSavedDeck`, `formatDeckExport` |
| Create | `lib/savedDecks.test.ts` | Vitest tests |
| Create | `hooks/useSavedDecks.ts` | localStorage read/write hook |
| Create | `components/SaveDeckModal.tsx` | Modal shown after Auto Build / Counter Build |
| Modify | `app/build/page.tsx` | Show modal after autofill; read `?saved=<id>` param on mount |
| Modify | `app/counter/page.tsx` | Show modal after counterAutofill |
| Create | `app/decks/page.tsx` | `/decks` page — list, load, copy, delete |
| Modify | `components/Navbar.tsx` | Add "Decks" link after "History" |

All logic is pure functions in `lib/savedDecks.ts`. The hook owns storage. Pages only call and render.

---

## Data Layer

### `types/card.ts` — new interface

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

---

## `lib/savedDecks.ts`

### Exports

```ts
export function addSavedDeck(
  decks: SavedDeck[],
  entry: SavedDeck
): SavedDeck[]
// Returns new array with entry prepended (newest first). Does not mutate input.

export function removeSavedDeck(
  decks: SavedDeck[],
  id: string
): SavedDeck[]
// Returns new array with the matching deck removed. Does not mutate input.

export function formatDeckExport(
  deck: SavedDeck,
  allCards: Card[]
): string
// Returns a plain-text deck list, e.g.:
//
// My Blue Control
// 藍 · Control · 2026-06-29
//
// Main Deck (50):
// 4x GD01-001 Gundam RX-78
// ...
//
// Resource Deck (10):
// 4x GD01-010 Luna II Base
//
// Card lookup: allCards.find(c => c.id === cardId)?.name ?? cardId
// Color display: 藍=blue, 紅=red, 綠=green, 白=white (comma-joined if multiple)
// Date display: deck.createdAt formatted as YYYY-MM-DD (first 10 chars of ISO string)
```

---

## `lib/savedDecks.test.ts`

Fixture: 2 saved decks (`deck1` and `deck2`), a small `allCards` array with 2 cards.

```ts
describe('addSavedDeck', () => {
  it('prepends entry to list')
  it('does not mutate the input array')
})

describe('removeSavedDeck', () => {
  it('removes deck by id')
  it('does not mutate the input array')
  it('returns unchanged array when id not found')
})

describe('formatDeckExport', () => {
  it('includes deck name, color label, strategy, date')
  it('includes card names from allCards lookup')
  it('falls back to card id when card not found in allCards')
})
```

---

## `hooks/useSavedDecks.ts`

```ts
'use client'

const STORAGE_KEY = 'gcg-saved-decks'

export function useSavedDecks() {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
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

Only this hook touches `localStorage`. `lib/savedDecks.ts` is pure and storage-agnostic.

---

## `components/SaveDeckModal.tsx`

```ts
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
```

**Behaviour:**
- Renders `null` when `open` is false
- Shows deck summary (colors, strategy, card count)
- Text input for deck name (auto-focused on open)
- 「儲存」button — disabled when name is empty; calls `onSave(name.trim())` then `onClose()`
- 「跳過」button — calls `onClose()` without saving
- Pressing Escape calls `onClose()`

---

## `/build` Integration

```ts
// app/build/page.tsx

const { history } = useMatchHistory()
const { savedDecks, save } = useSavedDecks()
const [saveModalOpen, setSaveModalOpen] = useState(false)

// On mount: if ?saved=<id> in URL, load that deck
useEffect(() => {
  const id = searchParams.get('saved')
  if (!id) return
  const found = savedDecks.find(d => d.id === id)
  if (!found) return
  setMainDeck(found.mainDeck)
  setResourceDeck(found.resourceDeck)
  setSelectedColors(found.colors)
  setStrategy(found.strategy)
}, [])  // runs once on mount

function handleAutoBuild() {
  if (!strategy || selectedColors.length === 0) return
  const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors, history)
  setMainDeck(result.mainDeck)
  setResourceDeck(result.resourceDeck)
  setSaveModalOpen(true)  // prompt after generating
}

// SaveDeckModal onSave:
const handleSave = (name: string) => {
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

The existing `?deck=<topDeckName>` param is unaffected — different param name (`saved` vs `deck`).

---

## `/counter` Integration

Same pattern as `/build`. After `handleCounterBuild()` succeeds → `setSaveModalOpen(true)`. `source: 'counter'`.

The counter page does **not** read `?saved=` — loading a saved deck always goes to `/build`.

---

## `/decks` Page

`app/decks/page.tsx` — `'use client'`, uses `useSavedDecks()` and reads cards via `useMemo(() => getCards(), [])` (same pattern as `/build`).

### Layout

Full-width list, newest first. Each deck card shows:

```
┌──────────────────────────────────────────────────┐
│  My Blue Control                      [載入] [Copy] [刪除] │
│  藍 · Control · 2026-06-29  ·  50 main / 10 res  │
└──────────────────────────────────────────────────┘
```

### Actions

- **載入** → `router.push('/build?saved=' + deck.id)`
- **Copy** → `navigator.clipboard.writeText(formatDeckExport(deck, allCards))` → button briefly shows「已複製！」
- **刪除** → `remove(deck.id)`

### Empty state

「未有儲存牌組。喺 Build 或 Counter 頁面生成後儲存吧！」

---

## `components/Navbar.tsx`

Add "Decks" link after "History":

```tsx
<Link
  href="/decks"
  className={`text-sm transition-colors ${pathname === '/decks' ? 'text-white' : 'text-white/60 hover:text-white'}`}
>
  Decks
</Link>
```

---

## What M9 Does NOT Include

- Editing a saved deck's name after saving
- Reordering saved decks
- Importing deck lists from text
- Server-side persistence — localStorage only
- Per-deck match history integration (M10+)
