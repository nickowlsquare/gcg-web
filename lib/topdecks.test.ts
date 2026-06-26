import { describe, it, expect } from 'vitest'
import { getTopDecks } from './topdecks'
import { getAllCards } from './cards'

describe('getTopDecks', () => {
  it('returns a non-empty array', () => {
    const decks = getTopDecks()
    expect(decks.length).toBeGreaterThan(0)
  })

  it('each deck has required fields', () => {
    const decks = getTopDecks()
    for (const deck of decks) {
      expect(deck.name).toBeTruthy()
      expect(Array.isArray(deck.colors)).toBe(true)
      expect(typeof deck.strategy).toBe('string')
      expect(Array.isArray(deck.keyCards)).toBe(true)
      expect(Array.isArray(deck.list)).toBe(true)
      expect(deck.list!.length).toBeGreaterThan(0)
    }
  })

  it('covers all 4 strategies', () => {
    const decks = getTopDecks()
    const strategies = new Set(decks.map(d => d.strategy))
    expect(strategies.has('aggro')).toBe(true)
    expect(strategies.has('midrange')).toBe(true)
    expect(strategies.has('control')).toBe(true)
    expect(strategies.has('attrition')).toBe(true)
  })

  it('has at least 20 decks', () => {
    const decks = getTopDecks()
    expect(decks.length).toBeGreaterThanOrEqual(20)
  })

  it('all card IDs in deck lists exist in cards.json', () => {
    const allCards = getAllCards()
    const cardIds = new Set(allCards.map(c => c.id))
    const decks = getTopDecks()
    for (const deck of decks) {
      if (!deck.list) continue
      for (const entry of deck.list) {
        expect(
          cardIds.has(entry.id),
          `card "${entry.id}" in deck "${deck.name}" not found in cards.json`
        ).toBe(true)
      }
    }
  })
})
