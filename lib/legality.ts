import type { Card, CardColor, CardType } from '../types/card'
import { getDeckColors } from './deck'

export interface LegalityResult {
  isLegal: boolean
  errors: string[]
  warnings: string[]
}

const COLOR_LABELS: Record<string, string> = {
  blue: 'Blue', green: 'Green', red: 'Red', white: 'White', purple: 'Purple',
}

const TYPE_RANGES: { type: CardType; label: string; min: number; max: number }[] = [
  { type: 'unit',    label: 'Unit',    min: 25, max: 28 },
  { type: 'pilot',   label: 'Pilot',   min: 6,  max: 8  },
  { type: 'command', label: 'Command', min: 8,  max: 10 },
  { type: 'base',    label: 'Base',    min: 4,  max: 6  },
]

function totalCount(deck: Record<string, number>): number {
  return Object.values(deck).reduce((sum, n) => sum + n, 0)
}

export function checkDeck(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[]
): LegalityResult {
  const errors: string[] = []
  const warnings: string[] = []
  const cardMap = new Map(allCards.map(c => [c.id, c]))

  // Hard rule 1: main deck must be exactly 50
  const mainTotal = totalCount(mainDeck)
  if (mainTotal !== 50) {
    errors.push(`主牌組需要 50 張（目前 ${mainTotal} 張）`)
  }

  // Hard rule 2: resource deck must be exactly 10
  const resourceTotal = totalCount(resourceDeck)
  if (resourceTotal !== 10) {
    errors.push(`資源牌組需要 10 張（目前 ${resourceTotal} 張）`)
  }

  // Hard rule 3: max 4 copies per card in main deck (resources exempt)
  for (const [id, count] of Object.entries(mainDeck)) {
    if (count > 4) {
      const card = cardMap.get(id)
      const name = card ? card.name : id
      errors.push(`${name} 超過 4 份上限（目前 ${count} 份）`)
    }
  }

  // Hard rule 4: max 2 colors across both decks
  const allDeck = { ...mainDeck, ...resourceDeck }
  const colors = getDeckColors(allDeck, allCards)
  if (colors.length > 2) {
    errors.push(`超過 2 種顏色（目前：${colors.map(c => COLOR_LABELS[c] ?? c).join('、')}）`)
  }

  // Soft rule: card type ratios (main deck only, skip if main deck is empty)
  if (mainTotal > 0) {
    const typeCounts: Partial<Record<CardType, number>> = {}
    for (const [id, count] of Object.entries(mainDeck)) {
      const card = cardMap.get(id)
      if (!card) continue
      typeCounts[card.type] = (typeCounts[card.type] ?? 0) + count
    }

    for (const { type, label, min, max } of TYPE_RANGES) {
      const count = typeCounts[type] ?? 0
      if (count < min || count > max) {
        warnings.push(`${label} 建議 ${min}–${max} 張（目前 ${count} 張）`)
      }
    }
  }

  return { isLegal: errors.length === 0, errors, warnings }
}
