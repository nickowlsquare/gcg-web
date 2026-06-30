import type { Card } from '../types/card'

export interface CurveData {
  buckets: number[]  // length 5: index 0 = value 1, index 4 = value 5+
  labels: string[]   // always ['1', '2', '3', '4', '5+']
  average: number    // weighted mean of included cards; 0 if no valid cards
}

export function computeCurve(
  field: 'cost' | 'level',
  mainDeck: Record<string, number>,
  allCards: Card[]
): CurveData {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const buckets = [0, 0, 0, 0, 0]
  let totalCount = 0
  let totalValue = 0

  for (const [cardId, count] of Object.entries(mainDeck)) {
    const card = cardMap.get(cardId)
    if (!card) continue
    const value = card[field]
    if (value === null || value === undefined || value <= 0) continue

    const idx = Math.min(Math.max(value - 1, 0), 4)
    buckets[idx] += count
    totalCount += count
    totalValue += value * count
  }

  return {
    buckets,
    labels: ['1', '2', '3', '4', '5+'],
    average: totalCount > 0 ? totalValue / totalCount : 0,
  }
}
