import { describe, it, expect } from 'vitest'
import { getCounterStrategy, counterScore, counterAutofill } from './counter'
import { getAllCards } from './cards'
import { getTopDecks } from './topdecks'
import type { TopDeck } from '../types/card'

/** Minimal TopDeck factory for test fixtures */
function mockDeck(overrides: Partial<TopDeck> = {}): TopDeck {
  return {
    name: 'Test Deck',
    colors: ['blue'],
    strategy: 'aggro',
    tier: 'C',
    keyCards: [],
    list: [],
    source: 'sample',
    date: '2026-01-01',
    ...overrides,
  }
}

describe('getCounterStrategy', () => {
  it('returns attrition for aggro', () => {
    expect(getCounterStrategy('aggro')).toBe('attrition')
  })
  it('returns control for midrange', () => {
    expect(getCounterStrategy('midrange')).toBe('control')
  })
  it('returns aggro for control', () => {
    expect(getCounterStrategy('control')).toBe('aggro')
  })
  it('returns aggro for attrition', () => {
    expect(getCounterStrategy('attrition')).toBe('aggro')
  })
})

describe('counterScore', () => {
  const allCards = getAllCards()
  const emptyFreq = new Map<string, number>()

  it('gives Barrier cards a higher score than non-Barrier when target has many Burst cards', () => {
    // GD01-009 (Amuro Ray) has Burst keyword; GD01-021 (Nu Gundam) has Burst — 4+4=8 Burst copies
    const burstTarget = mockDeck({
      strategy: 'midrange',
      list: [
        { id: 'GD01-009', count: 4 }, // has Burst
        { id: 'GD01-021', count: 4 }, // has Burst
      ],
    })
    // GD02-001 Xi Gundam has ['Barrier', 'High-Maneuver'] — Barrier present
    const barrierCard = allCards.find(c => c.id === 'GD02-001')!
    // GD01-018 ReZEL has no Barrier
    const normalCard = allCards.find(c => c.id === 'GD01-018')!

    const barrierScore = counterScore(barrierCard, 'control', burstTarget, emptyFreq, allCards)
    const normalScore  = counterScore(normalCard,  'control', burstTarget, emptyFreq, allCards)

    expect(barrierScore).toBeGreaterThan(normalScore)
  })

  it('gives high-HP cards a higher bonus when target meanUnitAP > 3', () => {
    // GD01-021 Nu Gundam AP=6, GD03-093 Zeong AP=5 → meanUnitAP = (6*4 + 5*4) / 8 = 5.5
    const highAPTarget = mockDeck({
      strategy: 'aggro',
      list: [
        { id: 'GD01-021', count: 4 }, // unit, AP 6
        { id: 'GD03-093', count: 4 }, // unit, AP 5
      ],
    })
    // GD02-002 Penelope: unit, HP=5, Burst+Deploy — high HP and Barrier bonus from meanUnitAP
    const highHPCard = allCards.find(c => c.id === 'GD02-002')!
    // GD01-103 Minovsky Craft Strike: command, no HP
    const commandCard = allCards.find(c => c.id === 'GD01-103')!

    const highHPScore  = counterScore(highHPCard,  'attrition', highAPTarget, emptyFreq, allCards)
    const commandScore = counterScore(commandCard, 'attrition', highAPTarget, emptyFreq, allCards)

    expect(highHPScore).toBeGreaterThan(commandScore)
  })

  it('gives Repair/Recover cards a higher bonus when target is aggro', () => {
    const aggroTarget = mockDeck({
      strategy: 'aggro',
      list: [{ id: 'ST03-002', count: 4 }],
    })
    // ST01-008 Aerial (Permet Score Six) has Repair keyword
    const repairCard = allCards.find(c => c.id === 'ST01-008')!
    // GD01-019 Delta Plus has no Blocker/Repair/Recover
    const normalCard  = allCards.find(c => c.id === 'GD01-019')!

    const repairScore = counterScore(repairCard, 'attrition', aggroTarget, emptyFreq, allCards)
    const normalScore = counterScore(normalCard, 'attrition', aggroTarget, emptyFreq, allCards)

    expect(repairScore).toBeGreaterThan(normalScore)
  })
})

describe('counterAutofill', () => {
  const allCards  = getAllCards()
  const topDecks  = getTopDecks()
  const aggroTarget = mockDeck({
    strategy: 'aggro',
    list: [{ id: 'ST03-002', count: 4 }],
  })

  it('returns mainDeck with total ≤ 50', () => {
    const { mainDeck } = counterAutofill({}, {}, allCards, topDecks, aggroTarget, ['blue'], 'attrition')
    const total = Object.values(mainDeck).reduce((s, n) => s + n, 0)
    expect(total).toBeLessThanOrEqual(50)
  })

  it('returns resourceDeck with total ≤ 10', () => {
    const { resourceDeck } = counterAutofill({}, {}, allCards, topDecks, aggroTarget, ['blue'], 'attrition')
    const total = Object.values(resourceDeck).reduce((s, n) => s + n, 0)
    expect(total).toBeLessThanOrEqual(10)
  })

  it('only includes cards matching the selected colors', () => {
    const { mainDeck } = counterAutofill({}, {}, allCards, topDecks, aggroTarget, ['blue'], 'attrition')
    const cardMap = new Map(allCards.map(c => [c.id, c]))
    for (const id of Object.keys(mainDeck)) {
      const card = cardMap.get(id)!
      expect(
        card.colors.length === 0 || card.colors.includes('blue'),
        `card ${id} (colors: ${card.colors}) should be blue or colorless`
      ).toBe(true)
    }
  })
})
