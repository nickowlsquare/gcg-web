import { describe, it, expect } from 'vitest'
import { getDeckStats } from './deckStats'
import type { MatchResult, TopDeck } from '../types/card'

// Fixture: two top decks with known strategies
const topDecks: TopDeck[] = [
  {
    name: 'Blue Aggro',
    colors: ['blue'],
    keyCards: [],
    strategy: 'aggro',
    tier: 'A',
    source: 'test',
    date: '2026-01-01',
  },
  {
    name: 'Red Control',
    colors: ['red'],
    keyCards: [],
    strategy: 'control',
    tier: 'B',
    source: 'test',
    date: '2026-01-01',
  },
]

// Fixture: 5 match records
const history: MatchResult[] = [
  {
    id: '1',
    date: '2026-06-01T00:00:00.000Z',
    deckName: 'My Deck',
    deckIsTopDeck: false,
    outcome: 'win',
    opponentDeck: 'Blue Aggro',
    notes: '',
    deckId: 'deck-1',
  },
  {
    id: '2',
    date: '2026-06-02T00:00:00.000Z',
    deckName: 'My Deck',
    deckIsTopDeck: false,
    outcome: 'loss',
    opponentDeck: 'Red Control',
    notes: '',
    deckId: 'deck-1',
  },
  {
    id: '3',
    date: '2026-06-03T00:00:00.000Z',
    deckName: 'My Deck',
    deckIsTopDeck: false,
    outcome: 'win',
    opponentDeck: 'Blue Aggro',
    notes: '',
    deckId: 'deck-1',
  },
  {
    id: '4',
    date: '2026-06-04T00:00:00.000Z',
    deckName: 'Other Deck',
    deckIsTopDeck: false,
    outcome: 'win',
    opponentDeck: 'Blue Aggro',
    notes: '',
    deckId: 'deck-2',
  },
  {
    id: '5',
    date: '2026-06-05T00:00:00.000Z',
    deckName: 'Old Record',
    deckIsTopDeck: false,
    outcome: 'loss',
    opponentDeck: null,
    notes: '',
    // no deckId — pre-M10 record
  },
]

describe('getDeckStats', () => {
  it('returns zeros for unknown deckId', () => {
    const stats = getDeckStats('unknown', history, topDecks)
    expect(stats).toEqual({ wins: 0, losses: 0, winRate: 0, byStrategy: {} })
  })

  it('counts wins and losses correctly', () => {
    const stats = getDeckStats('deck-1', history, topDecks)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
  })

  it('computes winRate as a fraction 0–1', () => {
    const stats = getDeckStats('deck-1', history, topDecks)
    expect(stats.winRate).toBeCloseTo(2 / 3)
  })

  it('returns winRate 0 when no matches', () => {
    const stats = getDeckStats('deck-9', history, topDecks)
    expect(stats.winRate).toBe(0)
  })

  it('builds byStrategy breakdown from opponentDeck → strategy lookup', () => {
    const stats = getDeckStats('deck-1', history, topDecks)
    expect(stats.byStrategy['aggro']).toEqual({ wins: 2, losses: 0 })
    expect(stats.byStrategy['control']).toEqual({ wins: 0, losses: 1 })
  })

  it('ignores records with a different deckId', () => {
    const stats = getDeckStats('deck-1', history, topDecks)
    // deck-2 has 1 win vs Blue Aggro — should not appear in deck-1 stats
    expect(stats.wins + stats.losses).toBe(3)
  })

  it('ignores records with undefined deckId', () => {
    // record id='5' has no deckId — should never appear in any deck's stats
    const stats = getDeckStats('deck-1', history, topDecks)
    expect(stats.wins + stats.losses).toBe(3)
  })

  it('does not mutate the input history array', () => {
    const original = JSON.stringify(history)
    getDeckStats('deck-1', history, topDecks)
    expect(JSON.stringify(history)).toBe(original)
  })
})
