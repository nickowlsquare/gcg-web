import { describe, it, expect } from 'vitest'
import { autofill } from './autofill'
import type { Card, TopDeck } from '../types/card'

// ── helpers ──────────────────────────────────────────────────────────────────

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'TEST-001',
  name: 'Test Card',
  type: 'unit',
  rarity: 'C',
  set: 'TEST',
  colors: ['blue'],
  level: 3,
  cost: 3,
  ap: 3,
  hp: 3,
  traits: [],
  keywords: [],
  text: '',
  ...overrides,
})

/** Generate N unique cards all sharing the same overrides */
function makeCards(n: number, prefix: string, overrides: Partial<Card> = {}): Card[] {
  return Array.from({ length: n }, (_, i) =>
    makeCard({ id: `${prefix}-${i}`, name: `${prefix} ${i}`, ...overrides })
  )
}

/**
 * Large pool: 20 units + 10 pilots + 10 commands + 10 bases + 5 resources
 * all blue. At ≤4 copies each:
 *   main capacity  = (20+10+10+10) × 4 = 200 (easily fills 50)
 *   resource cap   = 5 × 4 = 20 (easily fills 10)
 */
function makeLargePool(): Card[] {
  return [
    ...makeCards(20, 'U',   { type: 'unit',     colors: ['blue'], cost: 3, ap: 3, hp: 3 }),
    ...makeCards(10, 'P',   { type: 'pilot',    colors: ['blue'], cost: 2, ap: 0, hp: 0 }),
    ...makeCards(10, 'CMD', { type: 'command',  colors: ['blue'], cost: 4, ap: 0, hp: 2 }),
    ...makeCards(10, 'B',   { type: 'base',     colors: ['blue'], cost: 5, ap: 1, hp: 4 }),
    ...makeCards(5,  'R',   { type: 'resource', colors: ['blue'], cost: 1, ap: 0, hp: 0 }),
  ]
}

function totalCount(deck: Record<string, number>): number {
  return Object.values(deck).reduce((s, n) => s + n, 0)
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('autofill — fills empty decks', () => {
  it('fills empty main and resource to exactly 50 + 10', () => {
    const result = autofill({}, {}, makeLargePool(), [], 'aggro', ['blue'])
    expect(totalCount(result.mainDeck)).toBe(50)
    expect(totalCount(result.resourceDeck)).toBe(10)
  })
})

describe('autofill — partial deck handling', () => {
  it('fills partial main (20 cards) to 50, preserving all existing cards', () => {
    const pool = makeLargePool()
    // 20 unique unit cards, 1 copy each
    const existing: Record<string, number> = {}
    pool.filter(c => c.type === 'unit').slice(0, 20).forEach(c => { existing[c.id] = 1 })

    const result = autofill(existing, {}, pool, [], 'aggro', ['blue'])

    expect(totalCount(result.mainDeck)).toBe(50)
    // Every existing card is still in the deck with at least its original count
    for (const [id, count] of Object.entries(existing)) {
      expect(result.mainDeck[id]).toBeGreaterThanOrEqual(count)
    }
  })

  it('does not touch resource deck when it is already full (10 cards)', () => {
    const pool = makeLargePool()
    const existing: Record<string, number> = {}
    pool.filter(c => c.type === 'resource').forEach(c => { existing[c.id] = 2 })
    // 5 × 2 = 10 resource cards

    const result = autofill({}, existing, pool, [], 'aggro', ['blue'])

    expect(totalCount(result.resourceDeck)).toBe(10)
    // Existing resource cards preserved
    for (const [id, count] of Object.entries(existing)) {
      expect(result.resourceDeck[id]).toBe(count)
    }
  })
})

describe('autofill — color filtering', () => {
  it('does not include cards whose colors fall outside the selected colors', () => {
    const pool = [
      ...makeCards(20, 'BLU', { type: 'unit',     colors: ['blue'], cost: 3, ap: 3, hp: 3 }),
      ...makeCards(20, 'RED', { type: 'unit',     colors: ['red'],  cost: 2, ap: 5, hp: 5 }),
      ...makeCards(5,  'R',   { type: 'resource', colors: ['blue'], cost: 1, ap: 0, hp: 0 }),
    ]
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'])
    const cardMap = new Map(pool.map(c => [c.id, c]))

    for (const id of Object.keys(result.mainDeck)) {
      const card = cardMap.get(id)!
      expect(card.colors.every(c => (['blue'] as string[]).includes(c))).toBe(true)
    }
  })

  it('includes colorless cards regardless of selected colors', () => {
    const pool = [
      ...makeCards(20, 'U',  { type: 'unit',     colors: [],  cost: 3, ap: 3, hp: 3 }),
      ...makeCards(5,  'R',  { type: 'resource', colors: [],  cost: 1, ap: 0, hp: 0 }),
    ]
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'])
    expect(totalCount(result.mainDeck)).toBeGreaterThan(0)
  })
})

describe('autofill — 4-copy limit', () => {
  it('no card in output main deck has count > 4', () => {
    const result = autofill({}, {}, makeLargePool(), [], 'aggro', ['blue'])
    for (const count of Object.values(result.mainDeck)) {
      expect(count).toBeLessThanOrEqual(4)
    }
  })
})

describe('autofill — card type separation', () => {
  it('resource cards do not appear in main deck', () => {
    const pool = makeLargePool()
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'])
    const cardMap = new Map(pool.map(c => [c.id, c]))
    for (const id of Object.keys(result.mainDeck)) {
      expect(cardMap.get(id)!.type).not.toBe('resource')
    }
  })

  it('non-resource cards do not appear in resource deck', () => {
    const pool = makeLargePool()
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'])
    const cardMap = new Map(pool.map(c => [c.id, c]))
    for (const id of Object.keys(result.resourceDeck)) {
      expect(cardMap.get(id)!.type).toBe('resource')
    }
  })
})

describe('autofill — TopDeck signal', () => {
  it('cards in a matching TopDeck appear in the output main deck', () => {
    const pool = makeLargePool()
    const featuredCard = pool[0]  // first unit in pool
    const topDeck: TopDeck = {
      name: 'Test Aggro',
      colors: ['blue'],
      keyCards: [],
      strategy: 'aggro',
      tier: 'C',
      list: [{ id: featuredCard.id, count: 4 }],
      source: 'test',
      date: '2026-06-25',
    }
    const result = autofill({}, {}, pool, [topDeck], 'aggro', ['blue'])
    expect(result.mainDeck[featuredCard.id]).toBeGreaterThan(0)
  })

  it('TopDeck with wrong strategy does not boost cards (deck still fills)', () => {
    const pool = makeLargePool()
    const topDeck: TopDeck = {
      name: 'Control Deck',
      colors: ['blue'],
      keyCards: [],
      strategy: 'control',   // does not match 'aggro'
      tier: 'C',
      list: pool.slice(0, 5).map(c => ({ id: c.id, count: 4 })),
      source: 'test',
      date: '2026-06-25',
    }
    const result = autofill({}, {}, pool, [topDeck], 'aggro', ['blue'])
    expect(totalCount(result.mainDeck)).toBe(50)
  })

  it('TopDeck without a list is skipped (deck still fills)', () => {
    const pool = makeLargePool()
    const topDeck: TopDeck = {
      name: 'No List Deck',
      colors: ['blue'],
      keyCards: [],
      strategy: 'aggro',
      tier: 'C',
      // list is undefined
      source: 'test',
      date: '2026-06-25',
    }
    const result = autofill({}, {}, pool, [topDeck], 'aggro', ['blue'])
    expect(totalCount(result.mainDeck)).toBe(50)
  })
})

describe('autofill — small pool', () => {
  it('fills as many as possible when pool is too small — no error thrown', () => {
    // 5 unique non-resource cards × 4 copies max = 20 main deck cards max
    const pool = makeCards(5, 'SM', { type: 'unit', colors: ['blue'], cost: 2, ap: 4, hp: 3 })
    expect(() => autofill({}, {}, pool, [], 'aggro', ['blue'])).not.toThrow()
    const result = autofill({}, {}, pool, [], 'aggro', ['blue'])
    expect(totalCount(result.mainDeck)).toBe(20)
    expect(totalCount(result.resourceDeck)).toBe(0)
  })
})

describe('autofill — immutability', () => {
  it('does not mutate mainDeck input', () => {
    const main = { 'U-0': 1 }
    autofill(main, {}, makeLargePool(), [], 'aggro', ['blue'])
    expect(main).toEqual({ 'U-0': 1 })
  })

  it('does not mutate resourceDeck input', () => {
    const res = { 'R-0': 2 }
    autofill({}, res, makeLargePool(), [], 'aggro', ['blue'])
    expect(res).toEqual({ 'R-0': 2 })
  })

  it('does not mutate allCards input', () => {
    const pool = makeLargePool()
    const idsBefore = pool.map(c => c.id)
    autofill({}, {}, pool, [], 'aggro', ['blue'])
    expect(pool.map(c => c.id)).toEqual(idsBefore)
  })
})
