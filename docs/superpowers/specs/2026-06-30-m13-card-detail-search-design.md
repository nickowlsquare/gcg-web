# M13 — Card Detail Drawer + Search Design

## Goal

Two improvements to the `/cards` browsing experience:
1. **Card Detail Drawer** — click any card → right-side drawer with full card info (art, stats, traits, link info, ability text)
2. **Search Bar** — text search above the card grid, filtering by name + traits + keywords in real time

## Architecture

A new `searchCards` pure function is added to `lib/cards.ts` (piped after `filterCards`). A new `CardDetailDrawer` component handles all card detail display, reusing the existing `LinkPanel` for link info. The `/cards` page gains `searchQuery` state and replaces the M12 `selectedLinkCard` state with a broader `selectedCard` state that opens the drawer for any card.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest. No new dependencies.

---

## Scope Notes

- **Search scope:** `card.name` + `card.traits[]` + `card.keywords[]`; case-insensitive; empty query = no-op
- **Drawer trigger:** click any card on `/cards`; clicking same card again closes (toggle)
- **Drawer replaces M12 LinkPanel click:** `selectedLinkCard` state removed; `CardDetailDrawer` includes `LinkPanel` internally for linkable units
- **No debounce:** 48-card dataset, pure client-side filter is instant
- **`filterCards` unchanged:** existing tests and callers unaffected
- **`/build` page unaffected:** hover link row (M12) stays as-is

---

## Section 1 — Data Layer: `lib/cards.ts`

### New function

```ts
export function searchCards(cards: Card[], query: string): Card[]
```

### Logic

- If `query.trim() === ''` → return `cards` unchanged
- Lowercase `query.trim()` once
- For each card: match if `card.name.toLowerCase().includes(q)` OR any element of `card.traits` includes `q` OR any element of `card.keywords` includes `q`
- Returns filtered `Card[]`

### Usage pattern

```ts
const results = searchCards(filterCards(allCards, colors, types), query)
```

### Tests (`lib/cards.test.ts` — 6 new tests)

1. Empty query returns all cards unchanged
2. Query matching card name returns that card
3. Query matching a trait returns cards with that trait
4. Query matching a keyword returns cards with that keyword
5. Search is case-insensitive (uppercase query matches lowercase data)
6. Query with no matches returns `[]`

---

## Section 2 — Component: `components/CardDetailDrawer.tsx`

### Props

```ts
interface Props {
  card: Card | null      // null = drawer closed
  allCards: Card[]
  onClose: () => void
}
```

### Behaviour

- `card === null` → returns `null` (safe to always mount)
- Layout: right-side fixed panel, ~320px wide, slide-in animation via Tailwind `translate-x` transition
- Backdrop: semi-transparent overlay behind drawer, clicking it calls `onClose`

### Content (top to bottom)

1. **Header** — card name + `×` close button (`aria-label="關閉"`)
2. **Artwork** — full-width `<img>` using same URL pattern as CardTile (`gundambay.com/static/images/cards/${id}.webp`); same `onError` fallback (show type badge + name)
3. **Badges row** — LR badge (gold, if `card.isLR`), type badge (colour-coded), set/id in muted text
4. **Stats** — depends on `card.type`:
   - `unit` / `base`: AP, HP, Cost, Level
   - `pilot`: AP Boost, HP Boost, Cost, Level
   - `command` / `resource`: Cost, Level
5. **Traits + Keywords** — rendered as pill tags (if non-empty arrays)
6. **Link section** — `<LinkPanel card={card} allCards={allCards} />` — only renders when `card.linkRequirement` exists (LinkPanel already returns null otherwise)
7. **Ability text** — `card.text` full text, muted colour, line-height for readability

### Error handling

- Missing artwork → same fallback div as CardTile (type badge + name)
- Missing `traits` / `keywords` → skip section (already optional fields)
- Missing `linkRequirement` → LinkPanel returns null silently

---

## Section 3 — Integration: `app/cards/page.tsx`

### State changes

```ts
// Remove:
const [selectedLinkCard, setSelectedLinkCard] = useState<Card | null>(null)

// Add:
const [selectedCard, setSelectedCard] = useState<Card | null>(null)
const [searchQuery, setSearchQuery] = useState('')
```

### Filtered cards

```ts
const filteredCards = useMemo(
  () => searchCards(filterCards(allCards, selectedColors, selectedTypes), searchQuery),
  [allCards, selectedColors, selectedTypes, searchQuery]
)
```

### Click handler

```ts
function handleCardClick(card: Card) {
  setSelectedCard(prev => prev?.id === card.id ? null : card)
}
```

No type guard needed — any card can be clicked.

### Render additions

```tsx
{/* Search bar — above grid */}
<input
  type="search"
  value={searchQuery}
  onChange={e => setSearchQuery(e.target.value)}
  placeholder="搜尋卡名、Traits、Keywords…"
  className="mb-4 w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none"
/>

{/* Card detail drawer */}
<CardDetailDrawer
  card={selectedCard}
  allCards={allCards}
  onClose={() => setSelectedCard(null)}
/>
```

`CardGrid` already has `onCardClick` prop from M12 — just update handler reference.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/cards.ts` | Add `searchCards` export |
| Modify | `lib/cards.test.ts` | Add 6 search tests |
| Create | `components/CardDetailDrawer.tsx` | Full card detail drawer |
| Modify | `app/cards/page.tsx` | Search state + drawer state + render |

---

## Error Handling

- `searchCards` with empty/whitespace query → returns input unchanged, no error
- `card.traits` or `card.keywords` undefined/empty → no match attempted on those fields, no crash
- Artwork 404 → `onError` fallback (same as CardTile)
- `card.text` empty string → section still renders (empty string is valid)

## Testing

- `lib/cards.test.ts`: 6 new unit tests for `searchCards`
- `CardDetailDrawer`: no separate test — rendering logic is pure, card data already tested
- Integration verified manually: click any card on /cards → drawer slides in; type in search → grid filters live
