# M14 — Card Data Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **⚠️ DATA ENTRY TASKS (3–9):** The official card site (`gundam-gcg.com`) renders cards via JavaScript. WebFetch cannot retrieve card listings. Tasks 3–9 require a real browser (Chrome MCP or computer-use) to browse the site, or a human to provide card data. If you are a subagent without browser access, implement Tasks 1–2 and mark Tasks 3–9 as NEEDS_CONTEXT so the parent session can handle them.

**Goal:** Expand `data/cards.json` from 48 cards to cover all of GD01–GD04, EB01, and ST01–ST10, and update the TypeScript schema + UI to support three new card types (`ex_base`, `ex_resource`, `unit_token`).

**Architecture:** Schema changes first (types.ts → FilterSidebar → CardTile → CardDetailDrawer), then a validation test, then card data added set by set in priority order. Each set is one commit. Existing 48 cards are preserved unchanged. No new pages or routes.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v3, Vitest.

---

## File Map

| Action | Path | What changes |
|--------|------|-------------|
| Modify | `types/card.ts` | Add `ex_base \| ex_resource \| unit_token` to `CardType` |
| Modify | `components/FilterSidebar.tsx` | Add `resource`, `ex_base`, `ex_resource`, `unit_token` to TYPES |
| Modify | `components/CardTile.tsx` | CARD_TYPE_COLORS + stats conditions for new types |
| Modify | `components/CardDetailDrawer.tsx` | CARD_TYPE_COLORS + stats conditions for new types |
| Modify | `lib/cards.test.ts` | Add required-fields validation test |
| Modify | `data/cards.json` | Add ~420 cards across 6 phases |

---

## Task 1: Schema + UI updates for new card types

**Files:**
- Modify: `types/card.ts`
- Modify: `components/FilterSidebar.tsx`
- Modify: `components/CardTile.tsx`
- Modify: `components/CardDetailDrawer.tsx`

### Background

Current `CardType` = `'unit' | 'pilot' | 'command' | 'base' | 'resource'`. Three new types exist in GD04/EB01/ST sets: EX BASE, EX RESOURCE, UNIT TOKEN. The UI also currently omits `resource` from the FilterSidebar TYPES list.

`CardColor` already includes `red | white | purple` — no color changes needed.

**Tailwind token reference** (`tailwind.config.ts`):
```
cardtype.unit    = #3b7dd8
cardtype.pilot   = #4a9f5c
cardtype.command = #d47a2a
cardtype.base    = #7a4ab0
cardtype.resource= #888888
```
No token exists for the new types — they reuse existing tokens or use Tailwind's amber scale.

---

- [ ] **Step 1: Update `types/card.ts`**

Open `types/card.ts`. Change line 3:

```ts
// Before:
export type CardType = 'unit' | 'pilot' | 'command' | 'base' | 'resource'

// After:
export type CardType =
  | 'unit' | 'pilot' | 'command' | 'base' | 'resource'
  | 'ex_base' | 'ex_resource' | 'unit_token'
```

No other changes to this file.

- [ ] **Step 2: Update `components/FilterSidebar.tsx`**

The `TYPES` array currently has only 4 entries and is missing `resource` entirely. Replace the full `TYPES` constant (lines 13–18):

```ts
const TYPES: { value: CardType; label: string; textColor: string; borderColor: string }[] = [
  { value: 'unit',       label: 'Unit',        textColor: 'text-cardtype-unit',     borderColor: 'border-cardtype-unit/40'     },
  { value: 'pilot',      label: 'Pilot',       textColor: 'text-cardtype-pilot',    borderColor: 'border-cardtype-pilot/40'    },
  { value: 'command',    label: 'Command',     textColor: 'text-cardtype-command',  borderColor: 'border-cardtype-command/40'  },
  { value: 'base',       label: 'Base',        textColor: 'text-cardtype-base',     borderColor: 'border-cardtype-base/40'     },
  { value: 'resource',   label: 'Resource',    textColor: 'text-cardtype-resource', borderColor: 'border-cardtype-resource/40' },
  { value: 'ex_base',    label: 'EX Base',     textColor: 'text-cardtype-base',     borderColor: 'border-cardtype-base/40'     },
  { value: 'ex_resource',label: 'EX Resource', textColor: 'text-cardtype-resource', borderColor: 'border-cardtype-resource/40' },
  { value: 'unit_token', label: 'Token',       textColor: 'text-amber-400',         borderColor: 'border-amber-400/40'         },
]
```

- [ ] **Step 3: Update `components/CardTile.tsx` — CARD_TYPE_COLORS**

The `CARD_TYPE_COLORS` map (lines 7–13) currently has 5 entries. Replace it:

```ts
const CARD_TYPE_COLORS: Record<string, string> = {
  unit:        'text-cardtype-unit     bg-cardtype-unit/10     border-cardtype-unit/30',
  pilot:       'text-cardtype-pilot    bg-cardtype-pilot/10    border-cardtype-pilot/30',
  command:     'text-cardtype-command  bg-cardtype-command/10  border-cardtype-command/30',
  base:        'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  resource:    'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  ex_base:     'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  ex_resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  unit_token:  'text-amber-400         bg-amber-400/10         border-amber-400/30',
}
```

- [ ] **Step 4: Update `components/CardTile.tsx` — stats display**

Find the stats row section (around line 174):

```tsx
// Before:
{(card.type === 'unit' || card.type === 'base') && card.ap != null && (
```

```tsx
// After:
{(['unit', 'base', 'ex_base', 'unit_token'] as string[]).includes(card.type) && card.ap != null && (
```

- [ ] **Step 5: Update `components/CardDetailDrawer.tsx` — CARD_TYPE_COLORS**

Same replacement as CardTile (lines 7–13):

```ts
const CARD_TYPE_COLORS: Record<string, string> = {
  unit:        'text-cardtype-unit     bg-cardtype-unit/10     border-cardtype-unit/30',
  pilot:       'text-cardtype-pilot    bg-cardtype-pilot/10    border-cardtype-pilot/30',
  command:     'text-cardtype-command  bg-cardtype-command/10  border-cardtype-command/30',
  base:        'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  resource:    'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  ex_base:     'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  ex_resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  unit_token:  'text-amber-400         bg-amber-400/10         border-amber-400/30',
}
```

- [ ] **Step 6: Update `components/CardDetailDrawer.tsx` — stats display**

Find the Stats section (around line 100):

```tsx
// Before:
{(card.type === 'unit' || card.type === 'base') && card.ap != null && (
```

```tsx
// After:
{(['unit', 'base', 'ex_base', 'unit_token'] as string[]).includes(card.type) && card.ap != null && (
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd "/Users/nickckck/GCG Web" && npx tsc --noEmit
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 8: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

Expected: all 141 existing tests pass.

- [ ] **Step 9: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add types/card.ts components/FilterSidebar.tsx components/CardTile.tsx components/CardDetailDrawer.tsx
git commit -m "feat: add ex_base, ex_resource, unit_token card types + update UI"
```

---

## Task 2: Required-fields validation test

**Files:**
- Modify: `lib/cards.test.ts`

### Background

We need a test that catches cards added with missing required fields. This test reads the real `data/cards.json` via `getAllCards()` and asserts every card has non-empty `id`, `name`, `type`, and `colors`.

- [ ] **Step 1: Write the failing test**

Open `lib/cards.test.ts`. Add a new `describe` block at the end of the file (after the `searchCards` describe block):

```ts
import { getAllCards } from './cards'

describe('getAllCards data integrity', () => {
  it('every card has non-empty id, name, type, and colors', () => {
    const cards = getAllCards()
    for (const card of cards) {
      expect(card.id, `card missing id`).toBeTruthy()
      expect(card.name, `card ${card.id} missing name`).toBeTruthy()
      expect(card.type, `card ${card.id} missing type`).toBeTruthy()
      expect(card.colors.length, `card ${card.id} has no colors`).toBeGreaterThan(0)
    }
  })
})
```

Note: `getAllCards` is already imported at the top of this describe block. Confirm the import exists at line 2: `import { filterCards, searchCards } from './cards'`. Add `getAllCards` to that import:

```ts
import { filterCards, searchCards, getAllCards } from './cards'
```

- [ ] **Step 2: Run test to verify it passes (it should, existing cards are valid)**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run lib/cards.test.ts
```

Expected: PASS — all 48 existing cards have the required fields.

- [ ] **Step 3: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add lib/cards.test.ts
git commit -m "test: add data integrity validation for all cards"
```

---

## Task 3: Data entry — GD01 Newtype Rising (fill to complete set)

**Files:**
- Modify: `data/cards.json`

### Background

GD01 currently has 13 cards in `data/cards.json`. The complete set has approximately 60 cards. Browse `https://gundam-gcg.com/en/cards/` and filter by **Newtype Rising [GD01]** to see all cards.

**⚠️ Browser required:** The card list loads via JavaScript. Use Chrome MCP (`mcp__Claude_in_Chrome__navigate` + `mcp__Claude_in_Chrome__get_page_text`) or computer-use to read the page. If neither is available, ask the parent session to provide card data.

### Card JSON format

Each card object in `data/cards.json` follows this structure. All fields shown are required unless marked optional (`?`):

```json
{
  "id": "GD01-014",
  "name": "Card Name",
  "type": "unit",
  "colors": ["blue"],
  "level": 3,
  "cost": 2,
  "ap": 3,
  "hp": 2,
  "rarity": "C",
  "set": "GD01",
  "sourceTitle": "Mobile Suit Gundam",
  "traits": ["Mobile Suit", "Earth Federation"],
  "keywords": ["Deploy"],
  "text": "Full ability text here.",
  "isLR": false,
  "isBanned": false,
  "isLimited": false
}
```

**Field mapping from official site to JSON:**

| Site label | JSON field | Notes |
|-----------|-----------|-------|
| Card No. | `id` | e.g. "GD01-014" |
| Card Name | `name` | Exact English name |
| Type | `type` | Map: UNIT→unit, PILOT→pilot, COMMAND→command, BASE→base, RESOURCE→resource, EX BASE→ex_base, EX RESOURCE→ex_resource, UNIT TOKEN→unit_token |
| Color | `colors` | Array; BLUE→blue, GREEN→green, RED→red, WHITE→white, PURPLE→purple |
| Level | `level` | integer or null |
| Cost | `cost` | integer or null |
| AP | `ap` | integer; omit field if not shown |
| HP (DEF) | `hp` | integer; omit field if not shown |
| AP Boost | `apBoost` | pilot only; integer |
| HP Boost | `hpBoost` | pilot only; integer |
| Rarity | `rarity` | "C", "U", "R", "LR", "P" |
| Trait | `traits` | Array of strings |
| Keyword | `keywords` | Array of strings |
| Link | `linkRequirement` | unit only; the pilot name string; omit if none |
| Ability text | `text` | Full text block |
| isLR | `isLR` | true only if rarity === "LR" |

**Omit-if-absent fields:** `ap`, `hp`, `apBoost`, `hpBoost`, `linkRequirement`, `zones`, `blockIcon`, `sourceTitle`. Only include if the card actually has them.

Set `isBanned: false` and `isLimited: false` for all new GD01 cards unless officially listed otherwise.

### Steps

- [ ] **Step 1: Browse GD01 card list**

Navigate to `https://gundam-gcg.com/en/cards/` and apply filter: Product = "Newtype Rising [GD01]". Note the total card count shown.

- [ ] **Step 2: Identify cards missing from data/cards.json**

Existing GD01 IDs in `data/cards.json`:
`GD01-001, GD01-002, GD01-003, GD01-004, GD01-005, GD01-006, GD01-007, GD01-008, GD01-009, GD01-010, GD01-011, GD01-012, GD01-013`

Record all GD01 card IDs shown on site that are NOT in the above list.

- [ ] **Step 3: For each missing card, transcribe data and append to `data/cards.json`**

Add each new card object after the last existing card in the JSON array. Maintain alphabetical-by-ID order within the set (GD01-014, GD01-015, … etc.). Keep the existing 13 cards unchanged.

Example of a new entry (insert before the closing `]`):

```json
  {
    "id": "GD01-014",
    "name": "Gundam Mk-II",
    "type": "unit",
    "colors": ["blue"],
    "level": 3,
    "cost": 3,
    "ap": 3,
    "hp": 3,
    "rarity": "U",
    "set": "GD01",
    "sourceTitle": "Mobile Suit Zeta Gundam",
    "traits": ["Mobile Suit", "AEUG"],
    "keywords": ["Deploy"],
    "text": "【Deploy】When this unit is deployed, draw 1 card.",
    "isBanned": false,
    "isLimited": false
  }
```

- [ ] **Step 4: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 5: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

Expected: all tests pass including the new data integrity test.

- [ ] **Step 6: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: complete GD01 Newtype Rising card data"
```

---

## Task 4: Data entry — GD02 Dual Impact (fill to complete set)

**Files:**
- Modify: `data/cards.json`

### Background

GD02 currently has 6 cards. Complete set has approximately 60 cards. Browse `https://gundam-gcg.com/en/cards/` filtered by **Dual Impact [GD02]**.

**Use the same JSON format and field mapping as Task 3.**

Existing GD02 IDs in `data/cards.json`:
`GD02-001, GD02-002, GD02-003, GD02-004, GD02-005, GD02-006`

- [ ] **Step 1: Browse GD02 card list at `https://gundam-gcg.com/en/cards/` (Product = Dual Impact [GD02])**

- [ ] **Step 2: Identify and transcribe all cards with IDs NOT in the existing GD02 list above**

Append each new card object to `data/cards.json`. Place GD02 cards grouped together, sorted by ID.

- [ ] **Step 3: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 4: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: complete GD02 Dual Impact card data"
```

---

## Task 5: Data entry — GD03 Steel Requiem (fill to complete set)

**Files:**
- Modify: `data/cards.json`

### Background

GD03 currently has 5 cards. Complete set has approximately 60 cards. Browse `https://gundam-gcg.com/en/cards/` filtered by **Steel Requiem [GD03]**.

**Use the same JSON format and field mapping as Task 3.**

Existing GD03 IDs in `data/cards.json`:
`GD03-001, GD03-002, GD03-003, GD03-004, GD03-005`

- [ ] **Step 1: Browse GD03 card list at `https://gundam-gcg.com/en/cards/` (Product = Steel Requiem [GD03])**

- [ ] **Step 2: Identify and transcribe all cards with IDs NOT in the existing GD03 list above**

- [ ] **Step 3: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

- [ ] **Step 4: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: complete GD03 Steel Requiem card data"
```

---

## Task 6: Data entry — GD04 Phantom Aria (new set, all cards)

**Files:**
- Modify: `data/cards.json`

### Background

GD04 has 0 cards currently. This is the newest booster set. Browse `https://gundam-gcg.com/en/cards/` filtered by **Phantom Aria [GD04]**.

**Use the same JSON format and field mapping as Task 3.**

GD04 may contain `ex_base`, `ex_resource`, or `unit_token` type cards — use the new type values added in Task 1.

- [ ] **Step 1: Browse GD04 card list at `https://gundam-gcg.com/en/cards/` (Product = Phantom Aria [GD04])**

Note the full card count. Record whether any EX BASE, EX RESOURCE, or UNIT TOKEN type cards appear.

- [ ] **Step 2: Transcribe all GD04 cards and append to `data/cards.json`**

Set `"set": "GD04"` on all new cards.

- [ ] **Step 3: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

- [ ] **Step 4: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: add GD04 Phantom Aria card data"
```

---

## Task 7: Data entry — EB01 Eternal Nexus (new set, all cards)

**Files:**
- Modify: `data/cards.json`

### Background

EB01 has 0 cards currently. This is the first extra booster. Browse `https://gundam-gcg.com/en/cards/` filtered by **Eternal Nexus [EB01]**.

**Use the same JSON format and field mapping as Task 3.** Set `"set": "EB01"` on all new cards.

- [ ] **Step 1: Browse EB01 card list at `https://gundam-gcg.com/en/cards/` (Product = Eternal Nexus [EB01])**

- [ ] **Step 2: Transcribe all EB01 cards and append to `data/cards.json`**

- [ ] **Step 3: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

- [ ] **Step 4: Run tests**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: add EB01 Eternal Nexus card data"
```

---

## Task 8: Data entry — ST01–ST10 starter decks (fill existing + add new)

**Files:**
- Modify: `data/cards.json`

### Background

Starter decks ST01–ST10 collectively have ~200 cards. Currently we have 24 starter deck cards:
- ST01: 12 cards (`ST01-001` through `ST01-012`)
- ST02: 8 cards (`ST02-001` through `ST02-008`)
- ST03: 4 cards (`ST03-001` through `ST03-004`)
- ST04–ST10: 0 cards

Browse each starter deck on `https://gundam-gcg.com/en/cards/` filtering by each ST set name.

**Use the same JSON format and field mapping as Task 3.**

Starter deck IDs to keep unchanged:
- ST01: `ST01-001` to `ST01-012`
- ST02: `ST02-001` to `ST02-008`
- ST03: `ST03-001` to `ST03-004`

- [ ] **Step 1: Browse and transcribe missing ST01 cards** (those beyond ST01-012 if any exist)

Filter: Heroic Beginnings [ST01]

- [ ] **Step 2: Browse and transcribe missing ST02 cards** (those beyond ST02-008)

Filter by product code ST02. On `gundam-gcg.com/en/cards/`, select the ST02 starter deck from the product dropdown.

- [ ] **Step 3: Browse and transcribe missing ST03 cards** (those beyond ST03-004)

Filter by product code ST03. On `gundam-gcg.com/en/cards/`, select the ST03 starter deck from the product dropdown.

- [ ] **Step 4: Browse and transcribe all ST04 cards** (set: "ST04")

- [ ] **Step 5: Browse and transcribe all ST05 cards** (set: "ST05")

- [ ] **Step 6: Browse and transcribe all ST06 cards** (set: "ST06")

- [ ] **Step 7: Browse and transcribe all ST07 cards** (set: "ST07")

- [ ] **Step 8: Browse and transcribe all ST08 cards** (set: "ST08")

- [ ] **Step 9: Browse and transcribe all ST09 cards** (set: "ST09")

- [ ] **Step 10: Browse and transcribe all ST10 cards** (set: "ST10")

- [ ] **Step 11: Validate JSON syntax**

```bash
cd "/Users/nickckck/GCG Web" && node -e "require('./data/cards.json'); console.log('JSON valid')"
```

- [ ] **Step 12: Run full test suite**

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 13: Run build**

```bash
cd "/Users/nickckck/GCG Web" && npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 14: Commit**

```bash
cd "/Users/nickckck/GCG Web"
git add data/cards.json
git commit -m "data: add ST01-ST10 starter deck card data"
```

---

## Final verification

After all tasks complete:

```bash
cd "/Users/nickckck/GCG Web" && npm test -- --run && npm run build
```

Expected:
- All tests pass (142+ tests)
- Build succeeds
- `data/cards.json` contains 400+ cards

Then push:

```bash
git push
```
