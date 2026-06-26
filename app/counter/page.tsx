'use client'

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAllCards, filterCards } from '../../lib/cards'
import { addCard, removeCard } from '../../lib/deck'
import { getTopDecks } from '../../lib/topdecks'
import { getCounterStrategy, counterAutofill } from '../../lib/counter'
import CounterBuildBar from '../../components/CounterBuildBar'
import FilterSidebar from '../../components/FilterSidebar'
import CardGrid from '../../components/CardGrid'
import DeckPanel from '../../components/DeckPanel'
import TopDeckDrawer from '../../components/TopDeckDrawer'
import type { Card, CardColor, CardType, Strategy, TopDeck } from '../../types/card'

function CounterPageContent() {
  const searchParams = useSearchParams()
  const allCards = useMemo(() => getAllCards(), [])
  const topDecks = useMemo(() => getTopDecks(), [])

  const [targetDeck, setTargetDeck] = useState<TopDeck | null>(null)
  const [showTargetDrawer, setShowTargetDrawer] = useState(false)
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([])
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [suggestedStrategy, setSuggestedStrategy] = useState<Strategy | null>(null)
  const [mainDeck, setMainDeck] = useState<Record<string, number>>({})
  const [resourceDeck, setResourceDeck] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')

  // Pre-select target from ?target= URL param (runs once on mount)
  useEffect(() => {
    const targetName = searchParams.get('target')
    if (!targetName) return
    const found = topDecks.find(d => d.name === targetName)
    if (!found) return
    setTargetDeck(found)
    const suggested = getCounterStrategy(found.strategy)
    setSuggestedStrategy(suggested)
    setStrategy(suggested)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTargetChange(deck: TopDeck) {
    setTargetDeck(deck)
    const suggested = getCounterStrategy(deck.strategy)
    setSuggestedStrategy(suggested)
    setStrategy(suggested)
    setMainDeck({})
    setResourceDeck({})
  }

  function handleClearTarget() {
    setTargetDeck(null)
    setSuggestedStrategy(null)
    setStrategy(null)
    setMainDeck({})
    setResourceDeck({})
  }

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

  function handleCounterBuild() {
    if (!targetDeck || selectedColors.length === 0 || !strategy) return
    const result = counterAutofill(mainDeck, resourceDeck, allCards, topDecks, targetDeck, selectedColors, strategy)
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
      <CounterBuildBar
        targetDeck={targetDeck}
        allTopDecks={topDecks}
        selectedColors={selectedColors}
        strategy={strategy}
        suggestedStrategy={suggestedStrategy}
        onTargetChange={handleTargetChange}
        onClearTarget={handleClearTarget}
        onViewTarget={() => setShowTargetDrawer(true)}
        onColorToggle={toggleColor}
        onStrategyChange={setStrategy}
        onCounterBuild={handleCounterBuild}
        disabled={!targetDeck || !strategy || selectedColors.length === 0}
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

      {/* Target deck drawer (view only — no load action from /counter) */}
      <TopDeckDrawer
        deck={showTargetDrawer ? targetDeck : null}
        allCards={allCards}
        onClose={() => setShowTargetDrawer(false)}
        onLoad={() => {}}
      />
    </div>
  )
}

export default function CounterPage() {
  return (
    <Suspense fallback={null}>
      <CounterPageContent />
    </Suspense>
  )
}
