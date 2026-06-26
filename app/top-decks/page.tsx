'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCards } from '../../lib/cards'
import { getTopDecks } from '../../lib/topdecks'
import TopDeckCard from '../../components/TopDeckCard'
import TopDeckDrawer from '../../components/TopDeckDrawer'
import type { CardColor, Strategy, TopDeck } from '../../types/card'

const COLORS: { value: CardColor; dot: string; label: string }[] = [
  { value: 'blue',   dot: 'bg-game-blue',   label: 'Blue'   },
  { value: 'green',  dot: 'bg-game-green',  label: 'Green'  },
  { value: 'red',    dot: 'bg-game-red',    label: 'Red'    },
  { value: 'white',  dot: 'bg-game-white',  label: 'White'  },
  { value: 'purple', dot: 'bg-game-purple', label: 'Purple' },
]

const STRATEGIES: { value: Strategy; label: string }[] = [
  { value: 'aggro',     label: 'Aggro'     },
  { value: 'midrange',  label: 'Midrange'  },
  { value: 'control',   label: 'Control'   },
  { value: 'attrition', label: 'Attrition' },
]

export default function TopDecksPage() {
  const router = useRouter()
  const allCards = useMemo(() => getAllCards(), [])
  const topDecks = useMemo(() => getTopDecks(), [])

  const [selectedColors, setSelectedColors] = useState<CardColor[]>([])
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([])
  const [activeTopDeck, setActiveTopDeck] = useState<TopDeck | null>(null)

  function toggleColor(color: CardColor) {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  function toggleStrategy(strategy: Strategy) {
    setSelectedStrategies(prev =>
      prev.includes(strategy) ? prev.filter(s => s !== strategy) : [...prev, strategy]
    )
  }

  const filteredDecks = useMemo(() => {
    return topDecks.filter(deck => {
      // Color filter: deck must include ALL selected colors
      if (selectedColors.length > 0) {
        const hasAllColors = selectedColors.every(c => deck.colors.includes(c))
        if (!hasAllColors) return false
      }
      // Strategy filter: deck must match ANY selected strategy
      if (selectedStrategies.length > 0 && !selectedStrategies.includes(deck.strategy)) {
        return false
      }
      return true
    })
  }, [topDecks, selectedColors, selectedStrategies])

  function handleLoad(deck: TopDeck) {
    const params = new URLSearchParams({ deck: deck.name })
    router.push(`/build?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
        {/* Color dots */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
            Color
          </span>
          {COLORS.map(({ value, dot, label }) => {
            const active = selectedColors.includes(value)
            return (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => toggleColor(value)}
                className={`
                  h-5 w-5 rounded-full transition-all ${dot}
                  ${active
                    ? 'opacity-100 ring-2 ring-white/60 ring-offset-1 ring-offset-bg-surface'
                    : 'opacity-30 hover:opacity-60'
                  }
                `}
              />
            )
          })}
        </div>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        {/* Strategy pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
            Strategy
          </span>
          {STRATEGIES.map(({ value, label }) => {
            const active = selectedStrategies.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleStrategy(value)}
                className={`
                  rounded-full px-3 py-1 text-xs font-medium transition-colors
                  ${active
                    ? 'bg-accent-gold text-bg-base'
                    : 'border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40'
                  }
                `}
              >
                {label}
              </button>
            )
          })}
        </div>

        {(selectedColors.length > 0 || selectedStrategies.length > 0) && (
          <button
            type="button"
            onClick={() => { setSelectedColors([]); setSelectedStrategies([]) }}
            className="ml-auto text-xs text-white/30 hover:text-white/60 border border-white/10 rounded px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30">
        Showing <span className="text-white/60 font-semibold">{filteredDecks.length}</span> / {topDecks.length} decks
      </p>

      {/* Deck grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDecks.map(deck => (
          <TopDeckCard
            key={deck.name}
            deck={deck}
            onClick={() => setActiveTopDeck(deck)}
          />
        ))}
        {filteredDecks.length === 0 && (
          <p className="col-span-full text-sm text-white/30 py-8 text-center">
            No decks match the selected filters.
          </p>
        )}
      </div>

      {/* Drawer */}
      <TopDeckDrawer
        deck={activeTopDeck}
        allCards={allCards}
        onClose={() => setActiveTopDeck(null)}
        onLoad={handleLoad}
        onCounter={(deck) => {
          const params = new URLSearchParams({ target: deck.name })
          router.push(`/counter?${params.toString()}`)
        }}
      />
    </div>
  )
}
