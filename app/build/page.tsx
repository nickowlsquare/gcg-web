'use client'

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAllCards, filterCards } from '../../lib/cards'
import { addCard, removeCard } from '../../lib/deck'
import { autofill } from '../../lib/autofill'
import { getTopDecks } from '../../lib/topdecks'
import AutoBuildBar from '../../components/AutoBuildBar'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import DeckPanel from '../../components/DeckPanel'
import type { Card, CardColor, CardType, Strategy } from '../../types/card'

function BuildPageContent() {
  const searchParams = useSearchParams()
  const allCards = useMemo(() => getAllCards(), [])
  const topDecks = useMemo(() => getTopDecks(), [])

  // Deck state
  const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
  const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})

  // Browser filter state
  const [search, setSearch] = useState('')
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])

  // M4: strategy state
  const [strategy, setStrategy] = useState<Strategy | null>(null)

  // M5: pre-fill from ?deck= URL param (runs once on mount)
  useEffect(() => {
    const deckName = searchParams.get('deck')
    if (!deckName) return
    const found = topDecks.find(d => d.name === deckName)
    if (!found?.list) return

    const cardMap = new Map(allCards.map(c => [c.id, c]))
    const newMain: Record<string, number> = {}
    const newResource: Record<string, number> = {}

    for (const entry of found.list) {
      const card = cardMap.get(entry.id)
      if (card?.type === 'resource') {
        newResource[entry.id] = entry.count
      } else {
        newMain[entry.id] = entry.count
      }
    }

    setMainDeck(newMain)
    setResourceDeck(newResource)
    setSelectedColors(found.colors.slice(0, 2) as CardColor[])
    setStrategy(found.strategy)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Color toggle with 2-color limit
  function toggleColor(color: CardColor) {
    setSelectedColors(prev => {
      if (prev.includes(color)) return prev.filter(c => c !== color)
      if (prev.length >= 2) return prev
      return [...prev, color]
    })
  }

  function toggleType(type: CardType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // Auto Build handler
  function handleAutoBuild() {
    if (!strategy || selectedColors.length === 0) return
    const result = autofill(mainDeck, resourceDeck, allCards, topDecks, strategy, selectedColors)
    setMainDeck(result.mainDeck)
    setResourceDeck(result.resourceDeck)
  }

  const filteredCards = useMemo(() => {
    const byFilter = filterCards(allCards, selectedColors, selectedTypes)
    if (!search.trim()) return byFilter
    const q = search.trim().toLowerCase()
    return byFilter.filter(c => c.name.toLowerCase().includes(q))
  }, [allCards, selectedColors, selectedTypes, search])

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
    <div className="flex flex-col gap-4">
      <AutoBuildBar
        selectedColors={selectedColors}
        strategy={strategy}
        onColorToggle={toggleColor}
        onStrategyChange={setStrategy}
        onAutoBuild={handleAutoBuild}
        disabled={!strategy || selectedColors.length === 0}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
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
    </div>
  )
}

export default function BuildPage() {
  return (
    <Suspense fallback={null}>
      <BuildPageContent />
    </Suspense>
  )
}
