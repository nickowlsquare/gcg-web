# M12 — Link Connection Diagram Design

## Goal

Display Link pairing information for any Unit card with a `linkRequirement` field. The Link mechanic gives a unit immediate attack when paired with its required Pilot; without it, the unit must wait a turn. Players need to see which Pilot a unit links with and whether that Pilot is already in their deck.

## Architecture

A pure function `getLinkPilots` resolves the link relationship from card data. A `LinkPanel` component displays the pilot list with optional in-deck status. Integration is additive: `/cards` gets a click handler + panel, and `CardTile`'s existing hover overlay gets a compact link row for `/build`. No new routes or Navbar changes.

## Tech Stack

Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest. No new dependencies.

---

## Scope Notes

- **Trigger:** Click on `/cards` page; hover on `/build` page (inside existing CardTile hover overlay)
- **Unit scope:** Any `Card` with `type === 'unit'` and a non-empty `linkRequirement` field (currently 7 cards, both LR and non-LR)
- **Display:** List of all matching Pilots + in-deck status (where deck context is available)
- **Missing pilots:** If a Pilot named in `linkRequirement` is not in `allCards` (e.g. Full Frontal, Char Aznable, Heero Yuy), show graceful fallback — no error

---

## Section 1 — Data Layer: `lib/linkPairs.ts`

### Interface

```ts
export function getLinkPilots(card: Card, allCards: Card[]): Card[]
```

### Logic

- If `card.type !== 'unit'` or `!card.linkRequirement` → return `[]`
- Filter `allCards` for `c.type === 'pilot' && c.name === card.linkRequirement`
- If no match found (pilot not in card data) → return `[]` (graceful degradation)
- Returns `Card[]` — may contain multiple results (future-proof for multi-pilot links)

### Tests (`lib/linkPairs.test.ts`)

1. Unit with `linkRequirement` and matching pilot → returns that pilot card
2. Unit with `linkRequirement` but no matching pilot in allCards → returns `[]`
3. Unit without `linkRequirement` → returns `[]`
4. Pilot card passed as first argument → returns `[]`
5. Multiple pilots with same name → returns all matches (edge case)

---

## Section 2 — Component: `components/LinkPanel.tsx`

### Props

```ts
interface Props {
  card: Card                           // the unit being inspected
  allCards: Card[]
  mainDeck?: Record<string, number>    // undefined on /cards (no deck context)
}
```

### Behaviour

Calls `getLinkPilots(card, allCards)` and renders:

**If pilots found:**
- Header: `Link 效果：即時攻擊` (gold, uppercase label)
- For each pilot:
  - Pilot name + rarity badge (e.g. LR, R)
  - AP boost / HP boost values
  - If `mainDeck` provided: `✓ 已在牌組` (green) or `✗ 未在牌組` (muted)
  - If `mainDeck` is `undefined`: omit in-deck status entirely

**If no pilots found (missing card data):**
- Shows: `「{card.linkRequirement}」— 卡牌資料未有` in muted grey
- No error thrown

**If card has no `linkRequirement`:** component returns `null` (callers should guard before mounting, but component is safe regardless)

---

## Section 3 — Integration

### `/cards` page (`app/cards/page.tsx`)

- Add `const [selectedLinkCard, setSelectedLinkCard] = useState<Card | null>(null)` 
- On click of any Unit card with `linkRequirement`: `setSelectedLinkCard(card)`
- Clicking anywhere else (or pressing ×): `setSelectedLinkCard(null)`
- Render `<LinkPanel card={selectedLinkCard} allCards={allCards} />` in a panel below or beside the card grid — no `mainDeck` passed (no deck context on this page)
- Cards without `linkRequirement` receive no click handler (no cursor change, no selection)

### `/build` page — `components/CardTile.tsx`

- `CardTile` already has a hover overlay with dark background, count badge, and +/− buttons
- Add a `mainDeck` prop to `CardTile` (pass down from `/build` page where it already exists)
- Inside the hover overlay, append a compact Link row **only if** `card.linkRequirement` exists:
  ```
  Link: [Pilot Name]  ✓/✗
  ```
  - Calls `getLinkPilots(card, allCards)` to get pilot name(s)
  - If pilot found and in `mainDeck`: `✓ 已在牌組` (green)
  - If pilot found but not in `mainDeck`: `✗ 未在牌組` (muted)
  - If pilot not in card data: shows `[linkRequirement name] — 未有資料` (grey)
- No change to hover trigger logic or existing overlay layout

### Files Changed

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/linkPairs.ts` | Pure `getLinkPilots` function |
| Create | `lib/linkPairs.test.ts` | Vitest unit tests |
| Create | `components/LinkPanel.tsx` | Full link panel for /cards |
| Modify | `app/cards/page.tsx` | Click handler + LinkPanel mount |
| Modify | `components/CardTile.tsx` | Compact link row in hover overlay |

---

## Error Handling

- Pilot not in card data → empty `[]` from `getLinkPilots`; UI shows fallback text, no crash
- Card with no `linkRequirement` → `getLinkPilots` returns `[]`; LinkPanel returns `null`; CardTile shows no link row
- `mainDeck` is `undefined` → in-deck status omitted silently

## Testing

- `lib/linkPairs.test.ts`: 5 unit tests covering all cases
- `LinkPanel`: no separate test — logic is in `getLinkPilots`; component is pure rendering
- Integration verified manually: click unit on /cards shows panel; hover unit on /build shows link row
