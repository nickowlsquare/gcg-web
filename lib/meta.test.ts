import { describe, it, expect } from 'vitest'
import { getMetaSnapshot } from './meta'
import type { TopDeck } from '../types/card'

/** Minimal TopDeck factory for test fixtures */
function mockDeck(overrides: Partial<TopDeck> = {}): TopDeck {
  return {
    name: 'Test',
    colors: ['blue'],
    strategy: 'aggro',
    tier: 'C',
    keyCards: [],
    list: [],
    source: 'test',
    date: '2026-01-01',
    ...overrides,
  }
}

// Fixture: 4 decks — 3 control (2 blue, 1 white), 1 aggro (red)
// Expected: dominantStrategy = 'control' (3/4), dominantColor = 'blue' (2/4)
const fixture = [
  mockDeck({ name: 'A', strategy: 'control', colors: ['blue'],  tier: 'S' }),
  mockDeck({ name: 'B', strategy: 'control', colors: ['blue'],  tier: 'A' }),
  mockDeck({ name: 'C', strategy: 'aggro',   colors: ['red'],   tier: 'B' }),
  mockDeck({ name: 'D', strategy: 'control', colors: ['white'], tier: 'C' }),
]

describe('getMetaSnapshot', () => {
  it('returns correct dominantStrategy', () => {
    const snap = getMetaSnapshot(fixture)
    expect(snap.dominantStrategy).toBe('control')
  })

  it('returns correct dominantColor', () => {
    const snap = getMetaSnapshot(fixture)
    // blue appears in 2 decks; white and red each in 1
    expect(snap.dominantColor).toBe('blue')
  })

  it('strategyDist values sum to 1.0', () => {
    const snap = getMetaSnapshot(fixture)
    const sum = Object.values(snap.strategyDist).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('totalDecks equals input array length', () => {
    const snap = getMetaSnapshot(fixture)
    expect(snap.totalDecks).toBe(4)
  })
})
