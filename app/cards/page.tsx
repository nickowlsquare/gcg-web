'use client'

import { useState, useMemo } from 'react'
import { getAllCards, filterCards } from '../../lib/cards'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import LinkPanel from '../../components/LinkPanel'
import type { Card, CardColor, CardType } from '../../types/card'

export default function CardsPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
  const [selectedLinkCard, setSelectedLinkCard] = useState<Card | null>(null)

  const filteredCards = useMemo(
    () => filterCards(allCards, selectedColors, selectedTypes),
    [allCards, selectedColors, selectedTypes]
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
    if (card.type !== 'unit' || !card.linkRequirement) return
    setSelectedLinkCard(prev => prev?.id === card.id ? null : card)
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

        {/* Link panel — shown when a linkable unit is selected */}
        {selectedLinkCard && (
          <div className="mb-4">
            <LinkPanel
              card={selectedLinkCard}
              allCards={allCards}
              onClose={() => setSelectedLinkCard(null)}
            />
          </div>
        )}

        <CardGrid
          cards={filteredCards}
          allCards={allCards}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  )
}
