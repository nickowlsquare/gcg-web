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
    const { [cardId]: _, ...rest } = deck
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

export function validateDeck(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[]
): string[] {
  const errors: string[] = []
  const mainTotal = totalCount(mainDeck)
  const resourceTotal = totalCount(resourceDeck)

  if (mainTotal > 50) {
    errors.push(`主牌組超過 50 張（目前 ${mainTotal} 張）`)
  }
  if (resourceTotal > 10) {
    errors.push(`資源牌組超過 10 張（目前 ${resourceTotal} 張）`)
  }

  const allDeck = { ...mainDeck, ...resourceDeck }
  const colors = getDeckColors(allDeck, allCards)
  if (colors.length > 2) {
    const colorLabels: Record<string, string> = {
      blue: 'Blue', green: 'Green', red: 'Red', white: 'White', purple: 'Purple',
    }
    errors.push(`超過 2 種顏色（目前：${colors.map(c => colorLabels[c] ?? c).join('、')}）`)
  }

  return errors
}
