import { describe, it, expect } from 'vitest'
import { addMatchResult, getWinRate, buildLearnedTopDecks } from './history'
import type { MatchResult, TopDeck } from '../types/card'

function makeResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    id: '1',
    date: '2026-06-29T00:00:00.000Z',
    deckName: 'Blue Control',
    deckIsTopDeck: true,
    outcome: 'win',
    opponentDeck: null,
    notes: '',
    ...overrides,
  }
}

const blueControlTopDeck: TopDeck = {
  name: 'Blue Control',
  colors: ['blue'],
  strategy: 'control',
  tier: 'A',
  keyCards: [],
  list: [{ id: 'GD01-001', count: 4 }],
  source: 'test',
  date: '2026-06-01',
}

// 2 wins for Blue Control (top deck), 1 win for custom deck, 1 loss
const fixture: MatchResult[] = [
  makeResult({ id: '1', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'win'  }),
  makeResult({ id: '2', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'win'  }),
  makeResult({ id: '3', deckName: 'My Custom Deck', deckIsTopDeck: false, outcome: 'win' }),
  makeResult({ id: '4', deckName: 'Blue Control', deckIsTopDeck: true,  outcome: 'loss' }),
]

describe('addMatchResult', () => {
  it('prepends entry to history', () => {
    const entry = makeResult({ id: 'new' })
    const result = addMatchResult(fixture, entry)
    expect(result[0]).toBe(entry)
    expect(result.length).toBe(fixture.length + 1)
  })
})

describe('getWinRate', () => {
  it('returns correct wins/losses/rate', () => {
    const { wins, losses, rate } = getWinRate(fixture)
    expect(wins).toBe(3)
    expect(losses).toBe(1)
    expect(rate).toBeCloseTo(0.75)
  })

  it('returns rate 0 for empty history', () => {
    const { wins, losses, rate } = getWinRate([])
    expect(wins).toBe(0)
    expect(losses).toBe(0)
    expect(rate).toBe(0)
  })
})

describe('buildLearnedTopDecks', () => {
  it('returns one copy per qualifying win', () => {
    const learned = buildLearnedTopDecks(fixture, [blueControlTopDeck])
    // 2 wins for 'Blue Control' (top deck) → 2 copies
    expect(learned).toHaveLength(2)
    expect(learned[0].name).toBe('Blue Control')
    expect(learned[1].name).toBe('Blue Control')
  })

  it('excludes custom-named decks (deckIsTopDeck false)', () => {
    const learned = buildLearnedTopDecks(fixture, [blueControlTopDeck])
    // 'My Custom Deck' win is excluded even though outcome is 'win'
    expect(learned.every(d => d.name === 'Blue Control')).toBe(true)
  })
})
