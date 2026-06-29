import type { MatchResult, TopDeck } from '../types/card'

/** Returns new array with entry prepended (newest first). Does not mutate input. */
export function addMatchResult(
  history: MatchResult[],
  entry: MatchResult
): MatchResult[] {
  return [entry, ...history]
}

/**
 * Computes win/loss counts and win rate.
 * rate is in the range 0–1 (multiply by 100 to display as percentage).
 * Returns rate 0 when history is empty.
 */
export function getWinRate(
  history: MatchResult[]
): { wins: number; losses: number; rate: number } {
  const wins = history.filter(r => r.outcome === 'win').length
  const losses = history.filter(r => r.outcome === 'loss').length
  const total = wins + losses
  return { wins, losses, rate: total === 0 ? 0 : wins / total }
}

/**
 * Builds a list of TopDeck copies from winning results where deckIsTopDeck is true.
 * A deck won N times produces N copies — each copy increases that deck's frequency weight
 * when merged into buildTopDeckFrequency.
 * Custom-named decks (deckIsTopDeck false) are excluded — they have no card list.
 */
export function buildLearnedTopDecks(
  history: MatchResult[],
  allTopDecks: TopDeck[]
): TopDeck[] {
  const result: TopDeck[] = []
  for (const entry of history) {
    if (entry.outcome !== 'win' || !entry.deckIsTopDeck) continue
    const found = allTopDecks.find(d => d.name === entry.deckName)
    if (found) result.push(found)
  }
  return result
}
