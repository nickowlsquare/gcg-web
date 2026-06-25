import topDecksData from '../data/topdecks.json'
import type { TopDeck } from '../types/card'

export function getTopDecks(): TopDeck[] {
  return topDecksData as TopDeck[]
}
