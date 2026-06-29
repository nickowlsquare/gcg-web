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
