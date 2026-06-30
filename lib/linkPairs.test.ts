import { describe, it, expect } from 'vitest'
import { getLinkPilots } from './linkPairs'
import type { Card } from '../types/card'

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: 'TEST-001',
    name: 'Test Card',
    type: 'unit',
    rarity: 'C',
    set: 'GD01',
    colors: ['blue'],
    level: 3,
    cost: 3,
    traits: [],
    keywords: [],
    text: '',
    ...overrides,
  }
}

describe('getLinkPilots', () => {
  it('returns matching pilot when linkRequirement matches pilot name', () => {
    const unit = makeCard({ id: 'U1', type: 'unit', linkRequirement: 'Amuro Ray' })
    const pilot = makeCard({ id: 'P1', name: 'Amuro Ray', type: 'pilot' })
    const result = getLinkPilots(unit, [unit, pilot])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('P1')
  })

  it('returns empty array when matching pilot is not in allCards', () => {
    const unit = makeCard({ type: 'unit', linkRequirement: 'Full Frontal' })
    const result = getLinkPilots(unit, [unit])
    expect(result).toEqual([])
  })

  it('returns empty array when card has no linkRequirement', () => {
    const unit = makeCard({ type: 'unit' })
    const result = getLinkPilots(unit, [])
    expect(result).toEqual([])
  })

  it('returns empty array when card type is not unit', () => {
    const pilot = makeCard({ type: 'pilot', linkRequirement: 'Amuro Ray' })
    const result = getLinkPilots(pilot, [pilot])
    expect(result).toEqual([])
  })

  it('returns all pilots when multiple pilots share the same name', () => {
    const unit = makeCard({ type: 'unit', linkRequirement: 'Suletta Mercury' })
    const p1 = makeCard({ id: 'P1', name: 'Suletta Mercury', type: 'pilot' })
    const p2 = makeCard({ id: 'P2', name: 'Suletta Mercury', type: 'pilot' })
    const result = getLinkPilots(unit, [unit, p1, p2])
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['P1', 'P2'])
  })
})
