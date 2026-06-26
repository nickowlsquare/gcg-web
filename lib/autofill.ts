import type { Card, CardColor, Strategy, TopDeck } from '../types/card'
import { scoreCard } from './strategy'

function totalCount(deck: Record<string, number>): number {
  return Object.values(deck).reduce((sum, n) => sum + n, 0)
}

/**
 * Build a frequency map: cardId → number of matching TopDecks that contain it.
 * A TopDeck matches if strategy matches, at least one color overlaps, and list is non-empty.
 */
export function buildTopDeckFrequency(
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[]
): Map<string, number> {
  const freq = new Map<string, number>()
  for (const td of topDecks) {
    if (td.strategy !== strategy) continue
    if (!td.list || td.list.length === 0) continue
    if (!td.colors.some(c => colors.includes(c))) continue
    for (const entry of td.list) {
      freq.set(entry.id, (freq.get(entry.id) ?? 0) + 1)
    }
  }
  return freq
}

/**
 * Returns true if the card's colors are all within the selected colors.
 * Colorless cards (empty colors array) always pass.
 */
export function cardFitsColors(card: Card, colors: CardColor[]): boolean {
  if (card.colors.length === 0) return true
  return card.colors.every(c => colors.includes(c))
}

/**
 * Greedily fill `deck` with cards from `sorted` (highest score first).
 * Respects `limit` (total cards) and `maxPerCard` (copies per card).
 * Returns a new deck — does not mutate input.
 */
export function greedyFill(
  deck: Record<string, number>,
  sorted: Card[],
  limit: number,
  maxPerCard: number
): Record<string, number> {
  const result = { ...deck }
  for (const card of sorted) {
    const remaining = limit - totalCount(result)
    if (remaining <= 0) break
    const existing = result[card.id] ?? 0
    const canAdd = Math.min(maxPerCard - existing, remaining)
    if (canAdd > 0) {
      result[card.id] = existing + canAdd
    }
  }
  return result
}

export function autofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  strategy: Strategy,
  colors: CardColor[]
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> } {
  const topDeckFrequency = buildTopDeckFrequency(topDecks, strategy, colors)

  // Filter by color fit; split by type
  const eligible = allCards.filter(c => cardFitsColors(c, colors))
  const mainCandidates = eligible.filter(c => c.type !== 'resource')
  const resourceCandidates = eligible.filter(c => c.type === 'resource')

  // Sort by score descending
  const byScore = (a: Card, b: Card) =>
    scoreCard(b, strategy, topDeckFrequency) - scoreCard(a, strategy, topDeckFrequency)

  const sortedMain = [...mainCandidates].sort(byScore)
  const sortedResource = [...resourceCandidates].sort(byScore)

  const newMain = greedyFill(mainDeck, sortedMain, 50, 4)
  const newResource = greedyFill(resourceDeck, sortedResource, 10, 4)

  return { mainDeck: newMain, resourceDeck: newResource }
}
