'use client'

import { useState, useMemo } from 'react'
import { getAllCards, filterCards, searchCards } from '../../lib/cards'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import CardDetailDrawer from '../../components/CardDetailDrawer'
import type { Card, CardColor, CardType } from '../../types/card'

export default function CardsPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCards = useMemo(
    () => searchCards(filterCards(allCards, selectedColors, selectedTypes), searchQuery),
    [allCards, selectedColors, selectedTypes, searchQuery]
  )

  function toggleColor(color: CardColor) {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  function toggleType(type: CardType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function handleCardClick(card: Card) {
    setSelectedCard(prev => prev?.id === card.id ? null : card)
  }

  return (
    <div className="flex gap-6">
      <FilterSidebar
        selectedColors={selectedColors}
        selectedTypes={selectedTypes}
        onColorToggle={toggleColor}
        onTypeToggle={toggleType}
        onClearAll={() => { setSelectedColors([]); setSelectedTypes([]) }}
        totalCards={allCards.length}
        filteredCount={filteredCards.length}
      />
      <div className="flex-1 min-w-0">
        <h1 className="mb-4 text-lg font-bold text-accent-gold tracking-wide">Card Library</h1>

        {/* Search bar */}
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜尋卡名、Traits、Keywords…"
          className="mb-4 w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none"
        />

        <CardGrid
          cards={filteredCards}
          allCards={allCards}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Card detail drawer — always mounted, open/close via CSS transition */}
      <CardDetailDrawer
        card={selectedCard}
        allCards={allCards}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  )
}
