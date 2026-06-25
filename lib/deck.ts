import type { Card, CardColor, CardType } from '../types/card'

function totalCount(deck: Record<string, number>): number {
  return Object.values(deck).reduce((sum, n) => sum + n, 0)
}

export function addCard(
  deck: Record<string, number>,
  card: Card,
  isResource: boolean
): Record<string, number> {
  const current = deck[card.id] ?? 0
  if (current >= 4) return deck
  const total = totalCount(deck)
  if (!isResource && total >= 50) return deck
  if (isResource && total >= 10) return deck
  return { ...deck, [card.id]: current + 1 }
}

export function removeCard(
  deck: Record<string, number>,
  cardId: string
): Record<string, number> {
  const current = deck[cardId]
  if (current === undefined) return deck
  if (current <= 1) {
    const rest = { ...deck }
    delete rest[cardId]
    return rest
  }
  return { ...deck, [cardId]: current - 1 }
}

export function getDeckStats(
  deck: Record<string, number>,
  allCards: Card[]
): { typeCounts: Record<CardType, number>; costCurve: Record<number, number> } {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const typeCounts: Record<CardType, number> = {
    unit: 0, pilot: 0, command: 0, base: 0, resource: 0,
  }
  const costCurve: Record<number, number> = {}

  for (const [id, count] of Object.entries(deck)) {
    const card = cardMap.get(id)
    if (!card) continue
    typeCounts[card.type] = (typeCounts[card.type] ?? 0) + count
    if (card.cost != null) {
      costCurve[card.cost] = (costCurve[card.cost] ?? 0) + count
    }
  }

  return { typeCounts, costCurve }
}

export function getDeckColors(
  deck: Record<string, number>,
  allCards: Card[]
): CardColor[] {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const colorSet = new Set<CardColor>()
  for (const id of Object.keys(deck)) {
    const card = cardMap.get(id)
    if (card) card.colors.forEach(c => colorSet.add(c))
  }
  return Array.from(colorSet)
}

