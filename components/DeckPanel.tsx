import type { Card } from '../types/card'
import { getDeckStats, validateDeck } from '../lib/deck'
import DeckStatBar from './DeckStatBar'
import DeckList from './DeckList'

interface DeckPanelProps {
  mainDeck: Record<string, number>
  resourceDeck: Record<string, number>
  allCards: Card[]
  onAdd: (card: Card, isResource: boolean) => void
  onRemove: (cardId: string, isResource: boolean) => void
}

export default function DeckPanel({
  mainDeck,
  resourceDeck,
  allCards,
  onAdd,
  onRemove,
}: DeckPanelProps) {
  const mainTotal = Object.values(mainDeck).reduce((s, n) => s + n, 0)
  const resourceTotal = Object.values(resourceDeck).reduce((s, n) => s + n, 0)
  const stats = getDeckStats(mainDeck, allCards)
  const errors = validateDeck(mainDeck, resourceDeck, allCards)

  return (
    <aside className="w-72 shrink-0 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-accent-gold tracking-wide">牌組</span>
        <div className="flex gap-3 text-[10px] text-white/40">
          <span>主 <span className="text-white/70 font-semibold">{mainTotal}</span>/50</span>
          <span>資源 <span className="text-white/70 font-semibold">{resourceTotal}</span>/10</span>
        </div>
      </div>

      {/* Stats */}
      <DeckStatBar stats={stats} />

      {/* Deck list */}
      <div className="flex-1 min-h-0 rounded-lg border border-white/10 bg-bg-surface p-3 flex flex-col overflow-hidden">
        <DeckList
          mainDeck={mainDeck}
          resourceDeck={resourceDeck}
          allCards={allCards}
          onAdd={onAdd}
          onRemove={onRemove}
          errors={errors}
        />
      </div>
    </aside>
  )
}
