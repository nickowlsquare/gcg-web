# M11 — Cost Curve + Level Distribution Design

## Goal

Add a Cost Curve and Level distribution bar chart to the DeckPanel. The chart visualises how many cards fall into each cost/level bucket, with tab switching between the two views.

## Architecture

A pure function `computeCurve` transforms deck + card data into chart-ready buckets. A `DeckCurveChart` component owns tab state and renders div-based bars. `DeckPanel` integrates the component with one line of JSX — no existing logic changes.

## Tech Stack

Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest. No external charting library.

---

## Section 1 — Data Layer: `lib/deckCharts.ts`

### Interface

```ts
export interface CurveData {
  buckets: number[]   // length 5: [count@1, count@2, count@3, count@4, count@5+]
  labels: string[]    // always ['1', '2', '3', '4', '5+']
  average: number     // weighted mean of included cards; 0 if no valid cards
}

export function computeCurve(
  field: 'cost' | 'level',
  mainDeck: Record<string, number>,  // cardId → count
  allCards: Card[]
): CurveData
```

### Logic

- For each `(cardId, count)` in `mainDeck`, look up the card in `allCards`.
- Read `card.cost` or `card.level` depending on `field`.
- If the value is `null`, skip the card entirely (excluded from buckets and average).
- Bucket assignment: value 1 → index 0, value 2 → index 1, value 3 → index 2, value 4 → index 3, value ≥ 5 → index 4.
- `average` = Σ(value × count) / Σ(count) across included cards only. Returns `0` if no valid cards.
- Returns `{ buckets, labels: ['1','2','3','4','5+'], average }`.

### Tests (`lib/deckCharts.test.ts`)

- Empty deck → all-zero buckets, average 0
- Single card cost 3 × 2 copies → bucket[2] = 2, average 3
- Card with null cost → excluded from all buckets and average
- Cost ≥ 5 → lands in bucket[4]
- Mixed cost and level fields → `field` param controls which is read
- Average calculation with multiple cost values

---

## Section 2 — Component: `components/DeckCurveChart.tsx`

### Props

```ts
interface Props {
  mainDeck: Record<string, number>
  allCards: Card[]
}
```

### Behaviour

- Internal state: `const [tab, setTab] = useState<'cost' | 'level'>('cost')`
- On each render: calls `computeCurve(tab, mainDeck, allCards)` — no memoisation needed (small data).
- `maxBucket = Math.max(...buckets, 1)` — prevents divide-by-zero on empty deck.
- Each bar height: `(count / maxBucket) * 100%` via inline style.
- If `mainDeck` is empty (all buckets zero): renders a placeholder `"加牌後顯示曲線"` message instead of bars.

### Visual Design

```
┌─────────────────────────────────┐
│  [費用]  [等級]   ← tab bar     │
├─────────────────────────────────┤
│        █                        │
│        █    █                   │
│   █    █    █    █              │
│   1    2    3    4    5+        │
├─────────────────────────────────┤
│  平均費用：2.8                  │
└─────────────────────────────────┘
```

- Active tab underline style; inactive tab muted.
- 費用 tab → gold bars `#8b7535` / Tailwind `accent-gold`.
- 等級 tab → blue bars `#4a7a9b`.
- Average line: `平均費用：X.X` or `平均等級：X.X` depending on active tab.
- Div-based bars with `align-items: flex-end` flex container; no SVG, no canvas, no library.

---

## Section 3 — Integration: `components/DeckPanel.tsx`

### Change

Import `DeckCurveChart` and insert it between the Main Deck heading and the card list:

```tsx
{mainTotal > 0 && (
  <DeckCurveChart mainDeck={mainDeck} allCards={allCards} />
)}
```

- `mainDeck` and `allCards` are already available as props — no new props required.
- `mainTotal` is already computed in DeckPanel — reuse it as the guard condition.
- No changes to existing deck logic, stats, or validation.

---

## Error Handling

- Card not found in `allCards` (stale ID): skip silently — same pattern as existing deck logic.
- `null` cost/level: excluded from all calculations — explicit design choice, not an error.

## Testing

- `lib/deckCharts.test.ts`: unit tests for `computeCurve` covering all bucket assignments, null exclusion, average calculation, and edge cases.
- `DeckCurveChart`: no separate test file — logic lives in `computeCurve`; component is pure rendering.
- Integration verified manually via `/build` page with a loaded deck.
