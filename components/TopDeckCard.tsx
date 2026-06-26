'use client'

import type { TopDeck, CardColor, Strategy } from '../types/card'

const COLOR_DOT: Record<CardColor, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

const STRATEGY_LABEL: Record<Strategy, string> = {
  aggro:     'Aggro',
  midrange:  'Midrange',
  control:   'Control',
  attrition: 'Attrition',
}

const STRATEGY_COLOR: Record<Strategy, string> = {
  aggro:     'text-red-400 border-red-400/40',
  midrange:  'text-green-400 border-green-400/40',
  control:   'text-blue-400 border-blue-400/40',
  attrition: 'text-purple-400 border-purple-400/40',
}

interface TopDeckCardProps {
  deck: TopDeck
  onClick: () => void
}

export default function TopDeckCard({ deck, onClick }: TopDeckCardProps) {
  const mainTotal = deck.list
    ? deck.list.reduce((sum, e) => sum + e.count, 0)
    : 0
  const strategyStyle = STRATEGY_COLOR[deck.strategy]

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-white/10 bg-bg-surface p-4 hover:border-accent-gold/40 hover:bg-white/5 transition-colors"
    >
      {/* Name */}
      <p className="text-sm font-semibold text-white mb-2 truncate">{deck.name}</p>

      {/* Colors + Strategy */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {deck.colors.map(c => (
            <span key={c} className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[c]}`} />
          ))}
        </div>
        <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${strategyStyle}`}>
          {STRATEGY_LABEL[deck.strategy]}
        </span>
      </div>

      {/* Key cards */}
      <div className="flex flex-wrap gap-1 mb-3">
        {deck.keyCards.slice(0, 4).map(id => (
          <span key={id} className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/50 font-mono">
            {id}
          </span>
        ))}
      </div>

      {/* Stats + Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/30">
          {mainTotal} cards
        </span>
        <span className="text-[10px] text-white/20">{deck.source} · {deck.date}</span>
      </div>
    </button>
  )
}
