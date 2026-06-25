import { describe, it, expect } from 'vitest'
import { addCard, removeCard, getDeckStats, getDeckColors } from './deck'
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

// addCard
describe('addCard', () => {
  it('adds a card to an empty deck', () => {
    const card = makeCard()
    const result = addCard({}, card, false)
    expect(result['TEST-001']).toBe(1)
  })

  it('increments count if card already in deck', () => {
    const card = makeCard()
    const deck = { 'TEST-001': 2 }
    const result = addCard(deck, card, false)
    expect(result['TEST-001']).toBe(3)
  })

  it('does not exceed 4 copies of a card', () => {
    const card = makeCard()
    const deck = { 'TEST-001': 4 }
    const result = addCard(deck, card, false)
    expect(result['TEST-001']).toBe(4)
  })

  it('does not exceed 50 cards in main deck', () => {
    const card = makeCard({ id: 'NEW-001' })
    const deck50: Record<string, number> = {}
    for (let i = 0; i < 12; i++) {
      deck50[`CARD-${i}`] = 4
    }
    deck50['CARD-12'] = 2 // 12*4 + 2 = 50
    const result = addCard(deck50, card, false)
    expect(result['NEW-001']).toBeUndefined()
  })

  it('does not exceed 10 cards in resource deck', () => {
    const card = makeCard({ id: 'NEW-RES', type: 'resource' })
    const deck: Record<string, number> = {}
    for (let i = 0; i < 3; i++) {
      deck[`RES-${i}`] = 3
    }
    deck['RES-3'] = 1 // total = 9+1 = 10
    const result = addCard(deck, card, true)
    expect(result['NEW-RES']).toBeUndefined()
  })

  it('does not mutate the original deck', () => {
    const card = makeCard()
    const deck = { 'TEST-001': 1 }
    addCard(deck, card, false)
    expect(deck['TEST-001']).toBe(1)
  })
})

// removeCard
describe('removeCard', () => {
  it('decrements card count by 1', () => {
    const result = removeCard({ 'TEST-001': 3 }, 'TEST-001')
    expect(result['TEST-001']).toBe(2)
  })

  it('removes the key when count reaches 0', () => {
    const result = removeCard({ 'TEST-001': 1 }, 'TEST-001')
    expect('TEST-001' in result).toBe(false)
  })

  it('returns deck unchanged if card not present', () => {
    const deck = { 'OTHER-001': 2 }
    const result = removeCard(deck, 'TEST-001')
    expect(result).toEqual(deck)
  })

  it('does not mutate the original deck', () => {
    const deck = { 'TEST-001': 2 }
    removeCard(deck, 'TEST-001')
    expect(deck['TEST-001']).toBe(2)
  })
})

// getDeckStats
describe('getDeckStats', () => {
  it('counts card types correctly', () => {
    const cards = [
      makeCard({ id: 'U1', type: 'unit' }),
      makeCard({ id: 'U2', type: 'unit' }),
      makeCard({ id: 'P1', type: 'pilot' }),
    ]
    const deck = { 'U1': 3, 'U2': 2, 'P1': 1 }
    const { typeCounts } = getDeckStats(deck, cards)
    expect(typeCounts.unit).toBe(5)
    expect(typeCounts.pilot).toBe(1)
    expect(typeCounts.command).toBe(0)
    expect(typeCounts.base).toBe(0)
  })

  it('builds cost curve correctly', () => {
    const cards = [
      makeCard({ id: 'C2', cost: 2 }),
      makeCard({ id: 'C3', cost: 3 }),
    ]
    const deck = { 'C2': 4, 'C3': 2 }
    const { costCurve } = getDeckStats(deck, cards)
    expect(costCurve[2]).toBe(4)
    expect(costCurve[3]).toBe(2)
    expect(costCurve[1]).toBeUndefined()
  })

  it('ignores cards not in the cards array', () => {
    const cards = [makeCard({ id: 'U1' })]
    const deck = { 'U1': 2, 'GHOST': 1 }
    const { typeCounts } = getDeckStats(deck, cards)
    expect(typeCounts.unit).toBe(2)
  })
})

// getDeckColors
describe('getDeckColors', () => {
  it('returns deduplicated colors from deck', () => {
    const cards = [
      makeCard({ id: 'B1', colors: ['blue'] }),
      makeCard({ id: 'B2', colors: ['blue', 'green'] }),
    ]
    const deck = { 'B1': 2, 'B2': 1 }
    const colors = getDeckColors(deck, cards)
    expect(colors.sort()).toEqual(['blue', 'green'])
  })

  it('returns empty array for empty deck', () => {
    expect(getDeckColors({}, [])).toEqual([])
  })
})
