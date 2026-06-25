import type { Card } from '../types/card'
import CardTile from './CardTile'

interface CardGridProps {
  cards: Card[]
}

export default function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-2xl">🔍</p>
        <p className="mt-3 text-sm text-white/40">No cards match your filters.</p>
        <p className="text-xs text-white/25">Try removing some filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map(card => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  )
}
