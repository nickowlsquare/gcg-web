import { describe, it, expect } from 'vitest'
import { scoreCard, STRATEGY_WEIGHTS } from './strategy'
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
  ap: 3,
  hp: 3,
  traits: [],
  keywords: [],
  text: '',
  ...overrides,
})

const emptyFreq = new Map<string, number>()

describe('STRATEGY_WEIGHTS', () => {
  it('is exported and has entries for all 4 strategies', () => {
    expect(STRATEGY_WEIGHTS.aggro).toBeDefined()
    expect(STRATEGY_WEIGHTS.midrange).toBeDefined()
    expect(STRATEGY_WEIGHTS.control).toBeDefined()
    expect(STRATEGY_WEIGHTS.attrition).toBeDefined()
  })
})

describe('scoreCard — cost preference', () => {
  it('Aggro: low-cost card (cost 2) scores higher than high-cost card (cost 6), same stats', () => {
    const lowCost = makeCard({ id: 'LOW', cost: 2, ap: 3, hp: 3 })
    const highCost = makeCard({ id: 'HIGH', cost: 6, ap: 3, hp: 3 })
    expect(scoreCard(lowCost, 'aggro', emptyFreq)).toBeGreaterThan(
      scoreCard(highCost, 'aggro', emptyFreq)
    )
  })

  it('Aggro: mid-cost card (cost 4) scores same as high-cost card (cost 6), both get 0 bonus', () => {
    const midCost = makeCard({ id: 'MID', cost: 4, ap: 3, hp: 3 })
    const highCost = makeCard({ id: 'HIGH2', cost: 6, ap: 3, hp: 3 })
    expect(scoreCard(midCost, 'aggro', emptyFreq)).toBe(
      scoreCard(highCost, 'aggro', emptyFreq)
    )
  })

  it('Control: high-cost card (cost 6) scores higher than low-cost card (cost 2), same stats', () => {
    const lowCost = makeCard({ id: 'LOW', cost: 2, ap: 3, hp: 3 })
    const highCost = makeCard({ id: 'HIGH', cost: 6, ap: 3, hp: 3 })
    expect(scoreCard(highCost, 'control', emptyFreq)).toBeGreaterThan(
      scoreCard(lowCost, 'control', emptyFreq)
    )
  })
})

describe('scoreCard — stat weights', () => {
  it('Aggro: high-AP card scores higher than high-HP card (same cost, same type)', () => {
    const highAP = makeCard({ id: 'HAP', cost: 3, ap: 6, hp: 2 })
    const highHP = makeCard({ id: 'HHP', cost: 3, ap: 2, hp: 6 })
    expect(scoreCard(highAP, 'aggro', emptyFreq)).toBeGreaterThan(
      scoreCard(highHP, 'aggro', emptyFreq)
    )
  })

  it('Attrition: high-HP card scores higher than high-AP card (same cost, same type)', () => {
    const highAP = makeCard({ id: 'HAP', cost: 3, ap: 6, hp: 2 })
    const highHP = makeCard({ id: 'HHP', cost: 3, ap: 2, hp: 6 })
    expect(scoreCard(highHP, 'attrition', emptyFreq)).toBeGreaterThan(
      scoreCard(highAP, 'attrition', emptyFreq)
    )
  })
})

describe('scoreCard — type bonuses', () => {
  it('Command card scores higher for Control than for Aggro (same cost, ap, hp)', () => {
    const cmd = makeCard({ id: 'CMD', type: 'command', cost: 3, ap: 3, hp: 3 })
    expect(scoreCard(cmd, 'control', emptyFreq)).toBeGreaterThan(
      scoreCard(cmd, 'aggro', emptyFreq)
    )
  })

  it('Unit card scores higher for Aggro than for Control (same cost, ap, hp)', () => {
    const unit = makeCard({ id: 'UNIT', type: 'unit', cost: 3, ap: 3, hp: 3 })
    expect(scoreCard(unit, 'aggro', emptyFreq)).toBeGreaterThan(
      scoreCard(unit, 'control', emptyFreq)
    )
  })

  it('Base card scores higher for Attrition than for Aggro (same cost, ap, hp)', () => {
    const base = makeCard({ id: 'BASE', type: 'base', cost: 4, ap: 3, hp: 3 })
    expect(scoreCard(base, 'attrition', emptyFreq)).toBeGreaterThan(
      scoreCard(base, 'aggro', emptyFreq)
    )
  })
})

describe('scoreCard — TopDeck frequency', () => {
  it('Card with topDeckFrequency 2 scores higher than same card with frequency 0', () => {
    const card = makeCard({ id: 'FREQ', cost: 3, ap: 3, hp: 3 })
    const freqMap = new Map<string, number>([['FREQ', 2]])
    expect(scoreCard(card, 'aggro', freqMap)).toBeGreaterThan(
      scoreCard(card, 'aggro', emptyFreq)
    )
  })

  it('Card A (frequency 3) scores higher than Card B (frequency 1) when stats are identical', () => {
    const cardA = makeCard({ id: 'A', cost: 3, ap: 3, hp: 3 })
    const cardB = makeCard({ id: 'B', cost: 3, ap: 3, hp: 3 })
    const freqMap = new Map<string, number>([['A', 3], ['B', 1]])
    expect(scoreCard(cardA, 'midrange', freqMap)).toBeGreaterThan(
      scoreCard(cardB, 'midrange', freqMap)
    )
  })
})

describe('scoreCard — keyword bonuses', () => {
  it('Aggro: card with Deploy keyword scores higher than identical card without it', () => {
    const withKw = makeCard({ id: 'KW', cost: 3, ap: 3, hp: 3, keywords: ['Deploy'] })
    const noKw = makeCard({ id: 'NKW', cost: 3, ap: 3, hp: 3, keywords: [] })
    expect(scoreCard(withKw, 'aggro', emptyFreq)).toBeGreaterThan(
      scoreCard(noKw, 'aggro', emptyFreq)
    )
  })

  it('Unrecognised keyword contributes 0 (same score as card without it)', () => {
    const withKw = makeCard({ id: 'KW', cost: 3, ap: 3, hp: 3, keywords: ['UNKNOWN_KW'] })
    const noKw = makeCard({ id: 'NKW', cost: 3, ap: 3, hp: 3, keywords: [] })
    expect(scoreCard(withKw, 'aggro', emptyFreq)).toBe(
      scoreCard(noKw, 'aggro', emptyFreq)
    )
  })

  it('Control: Barrier keyword adds bonus', () => {
    const withBarrier = makeCard({ id: 'B', cost: 5, ap: 2, hp: 4, type: 'command', keywords: ['Barrier'] })
    const noBarrier = makeCard({ id: 'NB', cost: 5, ap: 2, hp: 4, type: 'command', keywords: [] })
    expect(scoreCard(withBarrier, 'control', emptyFreq)).toBeGreaterThan(
      scoreCard(noBarrier, 'control', emptyFreq)
    )
  })
})

describe('scoreCard — immutability', () => {
  it('does not mutate the card', () => {
    const card = makeCard({ id: 'MUT', keywords: ['Deploy'], colors: ['blue'] })
    const keywordsBefore = [...card.keywords]
    scoreCard(card, 'aggro', emptyFreq)
    expect(card.keywords).toEqual(keywordsBefore)
  })

  it('does not mutate topDeckFrequency map', () => {
    const freq = new Map<string, number>([['TEST-001', 2]])
    const sizeBefore = freq.size
    scoreCard(makeCard(), 'aggro', freq)
    expect(freq.size).toBe(sizeBefore)
    expect(freq.get('TEST-001')).toBe(2)
  })
})
