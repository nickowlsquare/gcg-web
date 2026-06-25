'use client'

import { useState, useMemo, useCallback } from 'react'
import { getAllCards, filterCards } from '../../lib/cards'
import { addCard, removeCard } from '../../lib/deck'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import DeckPanel from '../../components/DeckPanel'
import type { Card, CardColor, CardType } from '../../types/card'

export default function BuilderPage() {
  const allCards = useMemo(() => getAllCards(), [])

  const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
  const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])

  const filteredCards = useMemo(() => {
    const byFilter = filterCards(allCards, selectedColors, selectedTypes)
    if (!search.trim()) return byFilter
    const q = search.trim().toLowerCase()
    return byFilter.filter(c => c.name.toLowerCase().includes(q))
  }, [allCards, selectedColors, selectedTypes, search])

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

  const handleAdd = useCallback((card: Card, isResource: boolean) => {
    if (isResource) {
      setResourceDeck(prev => addCard(prev, card, true))
    } else {
      setMainDeck(prev => addCard(prev, card, false))
    }
  }, [])

  const handleRemove = useCallback((cardId: string, isResource: boolean) => {
    if (isResource) {
      setResourceDeck(prev => removeCard(prev, cardId))
    } else {
      setMainDeck(prev => removeCard(prev, cardId))
    }
  }, [])

  const mainTotal = Object.values(mainDeck).reduce((s, n) => s + n, 0)

  function canAddToMain(card: Card): boolean {
    const count = mainDeck[card.id] ?? 0
    return count < 4 && mainTotal < 50
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      {/* Left: card browser */}
      <div className="flex flex-col gap-4 min-w-0 flex-1 lg:overflow-hidden">
        {/* Search bar */}
        <div className="relative shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋卡牌..."
            className="w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-4 flex-1 min-h-0 lg:overflow-hidden">
          {/* Filter sidebar */}
          <FilterSidebar
            selectedColors={selectedColors}
            selectedTypes={selectedTypes}
            onColorToggle={toggleColor}
            onTypeToggle={toggleType}
            onClearAll={() => { setSelectedColors([]); setSelectedTypes([]) }}
            totalCards={allCards.length}
            filteredCount={filteredCards.length}
          />

          {/* Card grid (scrollable) */}
          <div className="flex-1 min-w-0 lg:overflow-y-auto">
            <CardGrid
              cards={filteredCards}
              deckCounts={mainDeck}
              onAdd={(card) => handleAdd(card, false)}
              canAdd={canAddToMain}
            />
          </div>
        </div>
      </div>

      {/* Right: deck panel */}
      <DeckPanel
        mainDeck={mainDeck}
        resourceDeck={resourceDeck}
        allCards={allCards}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  )
}
