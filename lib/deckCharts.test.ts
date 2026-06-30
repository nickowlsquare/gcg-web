import { describe, it, expect } from 'vitest'
import { computeCurve } from './deckCharts'
import type { Card } from '../types/card'

function makeCard(id: string, cost: number | null, level: number | null): Card {
  return {
    id, name: id, type: 'unit', rarity: 'C', set: 'GD01',
    colors: ['blue'], level, cost, traits: [], keywords: [], text: '',
  }
}

describe('computeCurve', () => {
  it('returns all-zero buckets and average 0 for empty deck', () => {
    const result = computeCurve('cost', {}, [])
    expect(result.buckets).toEqual([0, 0, 0, 0, 0])
    expect(result.labels).toEqual(['1', '2', '3', '4', '5+'])
    expect(result.average).toBe(0)
  })

  it('puts a cost-3 card (×2) into bucket[2]', () => {
    const cards = [makeCard('A', 3, 2)]
    const result = computeCurve('cost', { A: 2 }, cards)
    expect(result.buckets).toEqual([0, 0, 2, 0, 0])
    expect(result.average).toBe(3)
  })

  it('reads level field when field is "level"', () => {
    const cards = [makeCard('A', 3, 2)]
    const result = computeCurve('level', { A: 3 }, cards)
    expect(result.buckets).toEqual([0, 3, 0, 0, 0])
    expect(result.average).toBe(2)
  })

  it('excludes null-cost cards from buckets and average', () => {
    const cards = [makeCard('A', null, 2), makeCard('B', 2, 1)]
    const result = computeCurve('cost', { A: 5, B: 2 }, cards)
    expect(result.buckets).toEqual([0, 2, 0, 0, 0])
    expect(result.average).toBe(2)
  })

  it('puts cost >= 5 into bucket[4]', () => {
    const cards = [makeCard('A', 5, 1), makeCard('B', 7, 1)]
    const result = computeCurve('cost', { A: 1, B: 2 }, cards)
    expect(result.buckets).toEqual([0, 0, 0, 0, 3])
    // average uses real values: (5 + 7 + 7) / 3
    expect(result.average).toBeCloseTo(19 / 3)
  })

  it('calculates weighted average correctly across different costs', () => {
    const cards = [makeCard('A', 2, 1), makeCard('B', 4, 2)]
    const result = computeCurve('cost', { A: 3, B: 1 }, cards)
    expect(result.buckets).toEqual([0, 3, 0, 1, 0])
    // (2*3 + 4*1) / 4 = 10/4 = 2.5
    expect(result.average).toBe(2.5)
  })

  it('silently skips unknown card IDs', () => {
    const result = computeCurve('cost', { 'UNKNOWN-999': 3 }, [])
    expect(result.buckets).toEqual([0, 0, 0, 0, 0])
    expect(result.average).toBe(0)
  })

  it('excludes cards with value <= 0 from buckets and average', () => {
    const cards = [makeCard('A', 0, -1), makeCard('B', 2, 1)]
    const result = computeCurve('cost', { A: 3, B: 2 }, cards)
    expect(result.buckets).toEqual([0, 2, 0, 0, 0])
    expect(result.average).toBe(2)
  })
})
