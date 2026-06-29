import type { MatchResult, TopDeck, Strategy } from '../types/card'

export interface DeckStats {
  wins: number
  losses: number
  winRate: number  // 0–1, e.g. 0.667 for 66.7%
  byStrategy: Partial<Record<Strategy, { wins: number; losses: number }>>
}

export function getDeckStats(
  deckId: string,
  history: MatchResult[],
  topDecks: TopDeck[]
): DeckStats {
  const strategyMap = new Map(topDecks.map(d => [d.name, d.strategy]))

  const relevant = history.filter(r => r.deckId === deckId)

  if (relevant.length === 0) {
    return { wins: 0, losses: 0, winRate: 0, byStrategy: {} }
  }

  let wins = 0
  let losses = 0
  const byStrategy: Partial<Record<Strategy, { wins: number; losses: number }>> = {}

  for (const r of relevant) {
    if (r.outcome === 'win') wins++
    else losses++

    if (r.opponentDeck) {
      const strategy = strategyMap.get(r.opponentDeck)
      if (strategy) {
        if (!byStrategy[strategy]) byStrategy[strategy] = { wins: 0, losses: 0 }
        if (r.outcome === 'win') byStrategy[strategy]!.wins++
        else byStrategy[strategy]!.losses++
      }
    }
  }

  const total = wins + losses
  return {
    wins,
    losses,
    winRate: total > 0 ? wins / total : 0,
    byStrategy,
  }
}
