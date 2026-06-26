'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCards } from '../../lib/cards'
import { getTopDecks } from '../../lib/topdecks'
import { getMetaSnapshot } from '../../lib/meta'
import MetaSnapshot from '../../components/MetaSnapshot'
import TopDeckDrawer from '../../components/TopDeckDrawer'
import type { CardColor, TopDeck } from '../../types/card'

const COLOR_DOT: Record<CardColor, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

const TIERS = ['S', 'A', 'B', 'C'] as const
type Tier = typeof TIERS[number]

const TIER_STYLES: Record<Tier, { label: string; chip: string }> = {
  S: {
    label: 'text-yellow-400',
    chip:  'border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/10',
  },
  A: {
    label: 'text-slate-300',
    chip:  'border-white/20 text-white/70 hover:bg-white/5',
  },
  B: {
    label: 'text-amber-600',
    chip:  'border-white/10 text-white/50 hover:bg-white/5',
  },
  C: {
    label: 'text-white/30',
    chip:  'border-white/10 text-white/30 hover:bg-white/5',
  },
}

export default function TierListPage() {
  const router = useRouter()
  const allCards = useMemo(() => getAllCards(), [])
  const topDecks = useMemo(() => getTopDecks(), [])
  const snapshot = useMemo(() => getMetaSnapshot(topDecks), [topDecks])

  const [activeDeck, setActiveDeck] = useState<TopDeck | null>(null)

  const byTier = useMemo(
    () =>
      Object.fromEntries(
        TIERS.map(t => [t, topDecks.filter(d => d.tier === t)])
      ) as Record<Tier, TopDeck[]>,
    [topDecks]
  )

  return (
    <div className="flex flex-col gap-6">
      <MetaSnapshot snapshot={snapshot} />

      <div className="flex flex-col gap-5">
        {TIERS.map(tier => {
          const decks = byTier[tier]
          const styles = TIER_STYLES[tier]
          return (
            <div key={tier} className="flex items-start gap-4">
              {/* Tier label */}
              <div className={`w-10 shrink-0 text-center text-3xl font-black leading-none pt-1 ${styles.label}`}>
                {tier}
              </div>

              {/* Deck chips */}
              <div className="flex flex-wrap gap-2">
                {decks.length === 0 && (
                  <span className="text-xs text-white/20 italic pt-1.5">No decks</span>
                )}
                {decks.map(deck => (
                  <button
                    key={deck.name}
                    type="button"
                    onClick={() => setActiveDeck(deck)}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${styles.chip}`}
                  >
                    <span>{deck.name}</span>
                    <span className="flex gap-0.5">
                      {deck.colors.map(c => (
                        <span
                          key={c}
                          className={`h-2 w-2 rounded-full ${COLOR_DOT[c]}`}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Deck drawer — view + counter action */}
      <TopDeckDrawer
        deck={activeDeck}
        allCards={allCards}
        onClose={() => setActiveDeck(null)}
        onLoad={() => {}}
        onCounter={(deck) => {
          const params = new URLSearchParams({ target: deck.name })
          router.push(`/counter?${params.toString()}`)
        }}
      />
    </div>
  )
}
