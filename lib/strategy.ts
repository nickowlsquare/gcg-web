import type { Card, CardType, Strategy } from '../types/card'

export interface StrategyWeights {
  costBonus: (cost: number | null) => number
  apWeight: number
  hpWeight: number
  typeBonus: Partial<Record<CardType, number>>
  topDeckMultiplier: number
  keywordBonus: Partial<Record<string, number>>
}

export const STRATEGY_WEIGHTS: Record<Strategy, StrategyWeights> = {
  aggro: {
    costBonus: (cost) =>
      cost === null ? 0 : cost <= 2 ? 3 : cost <= 4 ? 0 : 0,
    apWeight: 0.5,
    hpWeight: 0.1,
    typeBonus: { unit: 2, pilot: 1, command: 0, base: 0, resource: 0 },
    topDeckMultiplier: 1.5,
    keywordBonus: { Deploy: 1, Burst: 1 },
  },
  midrange: {
    costBonus: (cost) =>
      cost === null ? 0 : cost <= 2 ? 1 : cost <= 4 ? 2 : 1,
    apWeight: 0.3,
    hpWeight: 0.3,
    typeBonus: { unit: 1, pilot: 1, command: 1, base: 1, resource: 0 },
    topDeckMultiplier: 1.5,
    keywordBonus: { Deploy: 1, Link: 1 },
  },
  control: {
    costBonus: (cost) =>
      cost === null ? 0 : cost <= 2 ? 0 : cost <= 4 ? 1 : 3,
    apWeight: 0.1,
    hpWeight: 0.3,
    typeBonus: { unit: 0, pilot: 1, command: 3, base: 2, resource: 0 },
    topDeckMultiplier: 1.5,
    keywordBonus: { Barrier: 1, Shield: 1 },
  },
  attrition: {
    costBonus: (cost) =>
      cost === null ? 0 : cost <= 2 ? 0 : cost <= 4 ? 1 : 2,
    apWeight: 0.1,
    hpWeight: 0.5,
    typeBonus: { unit: 0, pilot: 1, command: 2, base: 3, resource: 0 },
    topDeckMultiplier: 1.5,
    keywordBonus: { Repair: 1, Recover: 1 },
  },
}

export function scoreCard(
  card: Card,
  strategy: Strategy,
  topDeckFrequency: Map<string, number>
): number {
  const w = STRATEGY_WEIGHTS[strategy]
  return (
    w.costBonus(card.cost) +
    (card.ap ?? 0) * w.apWeight +
    (card.hp ?? 0) * w.hpWeight +
    (w.typeBonus[card.type] ?? 0) +
    (topDeckFrequency.get(card.id) ?? 0) * w.topDeckMultiplier +
    card.keywords.reduce((sum, kw) => sum + (w.keywordBonus[kw] ?? 0), 0)
  )
}
