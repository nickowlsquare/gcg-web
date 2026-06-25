# M3 lib/autofill — Autofill Engine Design Spec

**Date:** 2026-06-25
**Milestone:** M3 — Autofill Engine

---

## Goal

Build `lib/strategy.ts` and `lib/autofill.ts` — a pure-function autofill engine that automatically fills a deck (from empty or partial state) using multi-dimensional weighted card scoring, with TopDeck frequency as a bonus signal.

---

## Architecture

Two focused modules with clear separation of concerns:

```
lib/strategy.ts   ← scoring logic: assigns a numeric score to each card
lib/autofill.ts   ← filling algorithm: greedily fills the deck using scores
```

Neither module has side effects or mutates inputs. No UI changes in M3 — the UI is wired in M4.

---

## lib/strategy.ts

### Function Signature

```ts
export function scoreCard(
  card: Card,
  strategy: Strategy,
  topDeckFrequency: Map<string, number>  // cardId → count of matching TopDecks containing this card
): number
```

### Scoring Dimensions

Each dimension contributes additively to the total score. Strategy weights control how much each dimension contributes.

| Dimension | Description |
|-----------|-------------|
| Cost curve | Low-cost cards score higher for Aggro; high-cost cards score higher for Control |
| AP weight | AP contribution scaled by strategy's AP weight |
| HP weight | HP contribution scaled by strategy's HP weight |
| Type bonus | Flat bonus per card type, strategy-dependent |
| TopDeck frequency | Cards appearing in more matching TopDecks score higher |
| Keyword bonus | Strategy-relevant keywords add flat bonus |

### Strategy Weights (`STRATEGY_WEIGHTS`)

```ts
export interface StrategyWeights {
  costBonus: (cost: number | null) => number  // cost-to-bonus curve
  apWeight: number
  hpWeight: number
  typeBonus: Partial<Record<CardType, number>>
  topDeckMultiplier: number
  keywordBonus: Partial<Record<string, number>>
}

export const STRATEGY_WEIGHTS: Record<Strategy, StrategyWeights>
```

**Cost bonus curves:**

| Cost | Aggro | Midrange | Control | Attrition |
|------|-------|----------|---------|-----------|
| 1–2  | +3    | +1       | 0       | 0         |
| 3–4  | 0     | +2       | +1      | +1        |
| 5+   | 0     | +1       | +3      | +2        |
| null | 0     | 0        | 0       | 0         |

**Stat weights:**

| Weight | Aggro | Midrange | Control | Attrition |
|--------|-------|----------|---------|-----------|
| AP     | ×2    | ×1       | ×0.5    | ×0.5      |
| HP     | ×0.5  | ×1       | ×1      | ×2        |

AP and HP are divided by 1000 before applying weights (GCG stats are in thousands).

**Type bonuses:**

| Type    | Aggro | Midrange | Control | Attrition |
|---------|-------|----------|---------|-----------|
| unit    | +2    | +1       | 0       | 0         |
| command | 0     | +1       | +3      | +2        |
| base    | 0     | +1       | +2      | +3        |
| pilot   | +1    | +1       | +1      | +1        |
| resource| 0     | 0        | 0       | 0         |

**TopDeck multiplier:** ×1.5 for all strategies (frequency × multiplier added to score).

**Keyword bonuses:** Strategy-relevant keywords add +1 per match:
- Aggro: `["Deploy", "Burst"]`
- Midrange: `["Deploy", "Link"]`
- Control: `["Barrier", "Shield"]`
- Attrition: `["Repair", "Recover"]`

(Keywords not in the list contribute 0.)

### Scoring Formula

```
score =
  costBonus(card.cost)
  + (card.ap ?? 0) / 1000 * apWeight
  + (card.hp ?? 0) / 1000 * hpWeight
  + (typeBonus[card.type] ?? 0)
  + topDeckFrequency.get(card.id) ?? 0) * topDeckMultiplier
  + sum of keywordBonus[kw] for kw in card.keywords
```

---

## lib/autofill.ts

### Function Signature

```ts
export function autofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[]
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> }
```

### Algorithm

1. **Build TopDeck frequency map** — count how many TopDecks (filtered to matching `strategy` and overlapping `colors`) contain each card ID. Result: `Map<string, number>`.

2. **Filter candidate cards** — keep only cards whose `colors` array fully overlaps with the selected `colors` (i.e., every color on the card must be in the selected colors). Cards with empty `colors` (colorless) are always included.

3. **Score all candidates** — call `scoreCard(card, strategy, topDeckFrequency)` for each candidate.

4. **Fill main deck** — greedy loop:
   - Exclude resource-type cards
   - Sort candidates by score descending
   - Add cards one by one respecting: count ≤ 4 per card, total ≤ 50, preserve existing cards
   - Type balance emerges naturally from scoring: type bonuses in `STRATEGY_WEIGHTS` ensure each strategy fills an appropriate mix of unit / command / base / pilot

5. **Fill resource deck** — greedy loop:
   - Only resource-type cards
   - Sort by score descending
   - Add cards one by one respecting: total ≤ 10, preserve existing cards

6. **Return** new `{ mainDeck, resourceDeck }` — never mutates inputs.

### Partial Deck Handling

- Existing cards in `mainDeck` / `resourceDeck` are preserved unchanged
- Only empty slots are filled (50 − current main total, 10 − current resource total)
- If the eligible card pool is too small to fill all slots, fill as many as possible (no error thrown — `checkDeck` from M2 will catch the resulting illegality)

### TopDeck Matching

A TopDeck matches if:
- `topDeck.strategy === strategy`
- At least one of `topDeck.colors` is in the selected `colors`
- `topDeck.list` is defined and non-empty (TopDecks without a list are skipped)

---

## Files

| Action | File |
|--------|------|
| Create | `lib/strategy.ts` |
| Create | `lib/strategy.test.ts` |
| Create | `lib/autofill.ts` |
| Create | `lib/autofill.test.ts` |

No existing files are modified.

---

## Testing

### `lib/strategy.test.ts`

- Aggro: low-cost card scores higher than high-cost card
- Control: high-cost card scores higher than low-cost card
- Aggro: high-AP card scores higher than low-AP card (vs Attrition)
- Attrition: high-HP card scores higher than low-HP card (vs Aggro)
- TopDeck frequency 2 scores higher than frequency 0 (same strategy)
- Command card scores higher for Control than for Aggro
- Keyword match adds to score; no-match keyword adds 0
- `scoreCard` does not mutate inputs
- `STRATEGY_WEIGHTS` is exported and has entries for all 4 strategies

### `lib/autofill.test.ts`

- Empty main + empty resource → output has exactly 50 main, 10 resource
- Partial main (20 cards) + empty resource → output has exactly 50 main, 10 resource; existing 20 cards preserved
- Output cards all have colors within the selected `colors`
- No card in output main deck exceeds count 4
- Cards present in matching TopDeck list appear in output (TopDeck signal works)
- autofill with no matching TopDecks still fills deck (falls back to pure scoring)
- Card pool too small → fills as many as possible, no throw
- Does not mutate `mainDeck`, `resourceDeck`, or `allCards` inputs
- Resource cards do not appear in main deck; non-resource cards do not appear in resource deck

---

## What M3 Does NOT Include

- UI trigger (button, page) — deferred to M4
- Banned/limited card filtering — deferred (per M2 spec)
- Strategy auto-detection from existing cards — deferred to a later milestone
