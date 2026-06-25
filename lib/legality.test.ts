import { describe, it, expect } from 'vitest'
import { checkDeck } from './legality'
import type { LegalityResult } from './legality'
import type { Card } from '../types/card'

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'TEST-001',
  name: 'Test Card',
  type: 'unit',
  rarity: 'C',
  set: 'TEST',
  colors: ['blue'],
  level: 3,
  cost: 3,
  ap: 3000,
  hp: 3000,
  traits: [],
  keywords: [],
  text: '',
  ...overrides,
})

// Builds a Record with `count` unique 1-copy entries
function buildDeck(count: number, prefix = 'C', overrides: Partial<Card> = {}): {
  deck: Record<string, number>
  cards: Card[]
} {
  const deck: Record<string, number> = {}
  const cards: Card[] = []
  for (let i = 0; i < count; i++) {
    const id = `${prefix}-${i}`
    deck[id] = 1
    cards.push(makeCard({ id, ...overrides }))
  }
  return { deck, cards }
}

// Full legal main deck: 28 units, 8 pilots, 9 commands, 5 bases = 50
function makeLegalMain(): { deck: Record<string, number>; cards: Card[] } {
  const deck: Record<string, number> = {}
  const cards: Card[] = []
  const add = (prefix: string, type: Card['type'], n: number) => {
    for (let i = 0; i < n; i++) {
      const id = `${prefix}-${i}`
      deck[id] = 1
      cards.push(makeCard({ id, type }))
    }
  }
  add('U', 'unit', 28)
  add('P', 'pilot', 8)
  add('CMD', 'command', 9)
  add('B', 'base', 5)
  return { deck, cards }
}

// Full legal resource deck: 10 resource cards
function makeLegalResource(): { deck: Record<string, number>; cards: Card[] } {
  return buildDeck(10, 'R', { type: 'resource', colors: ['blue'] })
}

// --- isLegal ---

describe('checkDeck — isLegal', () => {
  it('returns isLegal: true for a fully legal deck', () => {
    const main = makeLegalMain()
    const res = makeLegalResource()
    const allCards = [...main.cards, ...res.cards]
    const result = checkDeck(main.deck, res.deck, allCards)
    expect(result.isLegal).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('isLegal is false when errors exist', () => {
    const result = checkDeck({}, {}, [])
    expect(result.isLegal).toBe(false)
  })

  it('isLegal: true ↔ errors.length === 0', () => {
    const main = makeLegalMain()
    const res = makeLegalResource()
    const allCards = [...main.cards, ...res.cards]
    const result = checkDeck(main.deck, res.deck, allCards)
    expect(result.isLegal).toBe(true)
  })
})

// --- Hard rule: main deck must be exactly 50 ---

describe('checkDeck — main deck count', () => {
  it('no error when main deck has exactly 50 cards', () => {
    const main = makeLegalMain()
    const res = makeLegalResource()
    const result = checkDeck(main.deck, res.deck, [...main.cards, ...res.cards])
    expect(result.errors.some(e => e.includes('主牌組'))).toBe(false)
  })

  it('error when main deck has 49 cards', () => {
    const { deck, cards } = buildDeck(49, 'C')
    const result = checkDeck(deck, {}, cards)
    const err = result.errors.find(e => e.includes('主牌組'))
    expect(err).toBeDefined()
    expect(err).toMatch(/49/)
  })

  it('error when main deck has 51 cards', () => {
    const { deck, cards } = buildDeck(51, 'C')
    const result = checkDeck(deck, {}, cards)
    const err = result.errors.find(e => e.includes('主牌組'))
    expect(err).toBeDefined()
    expect(err).toMatch(/51/)
  })
})

// --- Hard rule: resource deck must be exactly 10 ---

describe('checkDeck — resource deck count', () => {
  it('no error when resource deck has exactly 10 cards', () => {
    const main = makeLegalMain()
    const { deck: resDeck, cards: resCards } = buildDeck(10, 'R', { type: 'resource' })
    const result = checkDeck(main.deck, resDeck, [...main.cards, ...resCards])
    expect(result.errors.some(e => e.includes('資源'))).toBe(false)
  })

  it('error when resource deck has 9 cards', () => {
    const { deck, cards } = buildDeck(9, 'R', { type: 'resource' })
    const result = checkDeck({}, deck, cards)
    const err = result.errors.find(e => e.includes('資源'))
    expect(err).toBeDefined()
    expect(err).toMatch(/9/)
  })

  it('error when resource deck has 11 cards', () => {
    const { deck, cards } = buildDeck(11, 'R', { type: 'resource' })
    const result = checkDeck({}, deck, cards)
    const err = result.errors.find(e => e.includes('資源'))
    expect(err).toBeDefined()
    expect(err).toMatch(/11/)
  })
})

// --- Hard rule: max 4 copies per card in main deck ---

describe('checkDeck — 4-copy limit', () => {
  it('no error when a main deck card has exactly 4 copies', () => {
    const card = makeCard({ id: 'QUAD', name: 'Quad Card' })
    const result = checkDeck({ 'QUAD': 4 }, {}, [card])
    expect(result.errors.some(e => e.includes('QUAD') || e.includes('Quad'))).toBe(false)
  })

  it('error when a main deck card has 5 copies', () => {
    const card = makeCard({ id: 'OVER', name: 'Over Card' })
    const result = checkDeck({ 'OVER': 5 }, {}, [card])
    const err = result.errors.find(e => e.includes('Over Card'))
    expect(err).toBeDefined()
    expect(err).toMatch(/5/)
  })

  it('resource deck cards are exempt from 4-copy limit', () => {
    const card = makeCard({ id: 'RES', name: 'Resource Card', type: 'resource' })
    const result = checkDeck({}, { 'RES': 5 }, [card])
    expect(result.errors.some(e => e.includes('Resource Card') && e.includes('上限'))).toBe(false)
  })
})

// --- Hard rule: max 2 colors ---

describe('checkDeck — color limit', () => {
  it('no error with exactly 2 colors', () => {
    const cards = [
      makeCard({ id: 'B', colors: ['blue'] }),
      makeCard({ id: 'G', colors: ['green'] }),
    ]
    const result = checkDeck({ 'B': 1, 'G': 1 }, {}, cards)
    expect(result.errors.some(e => e.includes('顏色'))).toBe(false)
  })

  it('error with 3 colors', () => {
    const cards = [
      makeCard({ id: 'B', colors: ['blue'] }),
      makeCard({ id: 'G', colors: ['green'] }),
      makeCard({ id: 'R', colors: ['red'] }),
    ]
    const result = checkDeck({ 'B': 1, 'G': 1, 'R': 1 }, {}, cards)
    const err = result.errors.find(e => e.includes('顏色'))
    expect(err).toBeDefined()
  })

  it('color check spans both main and resource deck', () => {
    const mainCard = makeCard({ id: 'B', colors: ['blue'] })
    const resCard = makeCard({ id: 'R', colors: ['red'], type: 'resource' })
    const purpleCard = makeCard({ id: 'P', colors: ['purple'] })
    const result = checkDeck({ 'B': 1, 'P': 1 }, { 'R': 1 }, [mainCard, resCard, purpleCard])
    const err = result.errors.find(e => e.includes('顏色'))
    expect(err).toBeDefined()
  })
})

// --- Soft warnings: type ratios ---

describe('checkDeck — type ratio warnings', () => {
  it('no warnings when all type counts are in range', () => {
    const main = makeLegalMain()
    const res = makeLegalResource()
    const result = checkDeck(main.deck, res.deck, [...main.cards, ...res.cards])
    expect(result.warnings).toHaveLength(0)
  })

  it('Unit warning when count is 24 (below 25)', () => {
    const { deck, cards } = buildDeck(24, 'U', { type: 'unit' })
    const result = checkDeck(deck, {}, cards)
    const warn = result.warnings.find(w => w.includes('Unit'))
    expect(warn).toBeDefined()
    expect(warn).toMatch(/24/)
  })

  it('Unit warning when count is 29 (above 28)', () => {
    const { deck, cards } = buildDeck(29, 'U', { type: 'unit' })
    const result = checkDeck(deck, {}, cards)
    const warn = result.warnings.find(w => w.includes('Unit'))
    expect(warn).toBeDefined()
    expect(warn).toMatch(/29/)
  })

  it('no Unit warning when count is 25', () => {
    const { deck, cards } = buildDeck(25, 'U', { type: 'unit' })
    const result = checkDeck(deck, {}, cards)
    expect(result.warnings.some(w => w.includes('Unit'))).toBe(false)
  })

  it('Pilot warning when count is 5 (below 6)', () => {
    const { deck, cards } = buildDeck(5, 'P', { type: 'pilot' })
    const result = checkDeck(deck, {}, cards)
    expect(result.warnings.some(w => w.includes('Pilot'))).toBe(true)
  })

  it('Command warning when count is 11 (above 10)', () => {
    const { deck, cards } = buildDeck(11, 'CMD', { type: 'command' })
    const result = checkDeck(deck, {}, cards)
    expect(result.warnings.some(w => w.includes('Command'))).toBe(true)
  })

  it('Base warning when count is 3 (below 4)', () => {
    const { deck, cards } = buildDeck(3, 'B', { type: 'base' })
    const result = checkDeck(deck, {}, cards)
    expect(result.warnings.some(w => w.includes('Base'))).toBe(true)
  })

  it('warnings do not affect isLegal when otherwise legal', () => {
    const main = makeLegalMain()
    const res = makeLegalResource()
    // Replace one base with a unit to get 29 units (out of range) but still 50 total
    const modDeck = { ...main.deck }
    const baseKey = Object.keys(modDeck).find(k => k.startsWith('B-'))!
    delete modDeck[baseKey]
    modDeck['EXTRA'] = 1
    const modCards = main.cards.filter(c => c.id !== baseKey)
    modCards.push(makeCard({ id: 'EXTRA', type: 'unit' }))
    const allCards = [...modCards, ...res.cards]
    const result = checkDeck(modDeck, res.deck, allCards)
    // Should have warnings (29 units) but be legal (deck counts are correct, colors are fine)
    expect(result.warnings.some(w => w.includes('Unit'))).toBe(true)
    expect(result.isLegal).toBe(true)
  })

  it('warnings come from main deck only, not resource deck', () => {
    const { deck: resDeck, cards: resCards } = buildDeck(10, 'R', { type: 'unit' })
    const result = checkDeck({}, resDeck, resCards)
    expect(result.warnings.some(w => w.includes('Unit'))).toBe(false)
  })
})

// --- Immutability ---

describe('checkDeck — immutability', () => {
  it('does not mutate mainDeck', () => {
    const main = { 'TEST-001': 2 }
    checkDeck(main, {}, [makeCard()])
    expect(main).toEqual({ 'TEST-001': 2 })
  })

  it('does not mutate resourceDeck', () => {
    const res = { 'RES-001': 3 }
    checkDeck({}, res, [makeCard({ id: 'RES-001', type: 'resource' })])
    expect(res).toEqual({ 'RES-001': 3 })
  })
})
