import type { Card } from '../types/card'

export function getLinkPilots(card: Card, allCards: Card[]): Card[] {
  if (card.type !== 'unit' || !card.linkRequirement) return []
  return allCards.filter(c => c.type === 'pilot' && c.name === card.linkRequirement)
}
