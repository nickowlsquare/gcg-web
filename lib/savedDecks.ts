import type { Card, SavedDeck } from '../types/card'

const COLOR_LABELS: Record<string, string> = {
  blue: '藍',
  red: '紅',
  green: '綠',
  white: '白',
  purple: '紫',
}

/** Returns new array with entry prepended (newest first). Does not mutate input. */
export function addSavedDeck(decks: SavedDeck[], entry: SavedDeck): SavedDeck[] {
  return [entry, ...decks]
}

/** Returns new array with the matching deck removed. Does not mutate input. */
export function removeSavedDeck(decks: SavedDeck[], id: string): SavedDeck[] {
  return decks.filter(d => d.id !== id)
}

/**
 * Returns a plain-text deck list for clipboard export.
 * Card names are looked up from allCards; falls back to card ID if not found.
 * Color labels: 藍=blue, 紅=red, 綠=green, 白=white, 紫=purple.
 * Date is the first 10 chars of deck.createdAt (YYYY-MM-DD).
 */
export function formatDeckExport(deck: SavedDeck, allCards: Card[]): string {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const date = deck.createdAt.slice(0, 10)
  const colorLabel = deck.colors.map(c => COLOR_LABELS[c] ?? c).join('、')

  const formatEntries = (entries: Record<string, number>): string =>
    Object.entries(entries)
      .map(([id, count]) => {
        const name = cardMap.get(id)?.name ?? id
        return `${count}x ${id} ${name}`
      })
      .join('\n')

  const mainTotal = Object.values(deck.mainDeck).reduce((s, n) => s + n, 0)
  const resourceTotal = Object.values(deck.resourceDeck).reduce((s, n) => s + n, 0)

  return [
    deck.name,
    `${colorLabel} · ${deck.strategy} · ${date}`,
    '',
    `Main Deck (${mainTotal}):`,
    formatEntries(deck.mainDeck),
    '',
    `Resource Deck (${resourceTotal}):`,
    formatEntries(deck.resourceDeck),
  ].join('\n')
}
