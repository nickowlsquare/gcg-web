import type { CardColor, Strategy, TopDeck } from '../types/card'

export interface MetaSnapshot {
  /** Strategy with the highest deck count proportion */
  dominantStrategy: Strategy
  /** Color with the highest deck count proportion */
  dominantColor: CardColor
  /** Proportion of decks per strategy (0–1). All values sum to 1.0. */
  strategyDist: Record<Strategy, number>
  /**
   * Proportion of decks that include each color (0–1).
   * Can sum > 1 because multi-color decks count for each of their colors.
   */
  colorDist: Record<CardColor, number>
  /** Total number of decks in the corpus */
  totalDecks: number
}

/**
 * Compute a meta snapshot from the deck corpus.
 * Returns defensive defaults if topDecks is empty.
 */
export function getMetaSnapshot(topDecks: TopDeck[]): MetaSnapshot {
  if (topDecks.length === 0) {
    return {
      dominantStrategy: 'aggro',
      dominantColor: 'blue',
      strategyDist: { aggro: 0, midrange: 0, control: 0, attrition: 0 },
      colorDist: { blue: 0, green: 0, red: 0, white: 0, purple: 0 },
      totalDecks: 0,
    }
  }

  const total = topDecks.length

  // Count decks per strategy
  const strategyCounts: Record<Strategy, number> = {
    aggro: 0, midrange: 0, control: 0, attrition: 0,
  }
  for (const deck of topDecks) {
    strategyCounts[deck.strategy]++
  }

  // Count decks per color (multi-color decks increment each color)
  const colorCounts: Record<CardColor, number> = {
    blue: 0, green: 0, red: 0, white: 0, purple: 0,
  }
  for (const deck of topDecks) {
    for (const color of deck.colors) {
      colorCounts[color]++
    }
  }

  const strategyDist = Object.fromEntries(
    (Object.keys(strategyCounts) as Strategy[]).map(k => [k, strategyCounts[k] / total])
  ) as Record<Strategy, number>

  const colorDist = Object.fromEntries(
    (Object.keys(colorCounts) as CardColor[]).map(k => [k, colorCounts[k] / total])
  ) as Record<CardColor, number>

  const dominantStrategy = (Object.keys(strategyDist) as Strategy[]).reduce(
    (a, b) => strategyDist[a] >= strategyDist[b] ? a : b
  )

  const dominantColor = (Object.keys(colorDist) as CardColor[]).reduce(
    (a, b) => colorDist[a] >= colorDist[b] ? a : b
  )

  return { dominantStrategy, dominantColor, strategyDist, colorDist, totalDecks: total }
}
