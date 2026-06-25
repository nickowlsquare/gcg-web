import { describe, it, expect } from 'vitest'
import { filterCards } from './cards'
import type { Card } from '../types/card'

const mockCards: Card[] = [
  {
    id: 'TEST-001', name: 'Blue Unit', type: 'unit',
    colors: ['blue'], level: 2, cost: 1, ap: 2, hp: 2,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-002', name: 'Red Pilot', type: 'pilot',
    colors: ['red'], level: 3, cost: 1,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-003', name: 'Green LR Unit', type: 'unit',
    colors: ['green'], level: 3, cost: 2, ap: 3, hp: 2,
    rarity: 'LR', isLR: true, set: 'TEST', traits: [], keywords: [], text: '',
  },
  {
    id: 'TEST-004', name: 'Blue Command', type: 'command',
    colors: ['blue'], level: 3, cost: 2,
    rarity: 'C', set: 'TEST', traits: [], keywords: [], text: '',
  },
]

describe('filterCards', () => {
  it('returns all cards when no filters are active', () => {
    const result = filterCards(mockCards, [], [])
    expect(result).toHaveLength(4)
  })

  it('filters by single color', () => {
    const result = filterCards(mockCards, ['blue'], [])
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['TEST-001', 'TEST-004'])
  })

  it('filters by multiple colors (OR logic)', () => {
    const result = filterCards(mockCards, ['blue', 'red'], [])
    expect(result).toHaveLength(3)
    expect(result.map(c => c.id)).toContain('TEST-001')
    expect(result.map(c => c.id)).toContain('TEST-002')
    expect(result.map(c => c.id)).toContain('TEST-004')
  })

  it('filters by single type', () => {
    const result = filterCards(mockCards, [], ['unit'])
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['TEST-001', 'TEST-003'])
  })

  it('filters by color AND type simultaneously', () => {
    const result = filterCards(mockCards, ['blue'], ['unit'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('TEST-001')
  })

  it('returns empty array when no cards match', () => {
    const result = filterCards(mockCards, ['purple'], ['base'])
    expect(result).toHaveLength(0)
  })

  it('does not mutate the input array', () => {
    const original = [...mockCards]
    filterCards(mockCards, ['blue'], [])
    expect(mockCards).toEqual(original)
  })
})
