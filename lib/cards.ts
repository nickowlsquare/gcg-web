import type { Card, CardColor, CardType } from '../types/card'
import cardsData from '../data/cards.json'

export function getAllCards(): Card[] {
  return cardsData as Card[]
}

export function filterCards(
  cards: Card[],
  colors: CardColor[],
  types: CardType[]
): Card[] {
  return cards.filter(card => {
    const colorMatch =
      colors.length === 0 ||
      card.colors.some(c => colors.includes(c))

    const typeMatch =
      types.length === 0 ||
      types.includes(card.type)

    return colorMatch && typeMatch
  })
}
