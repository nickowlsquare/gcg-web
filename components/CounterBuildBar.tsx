'use client'

import type { CardColor, Strategy, TopDeck } from '../types/card'

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

const COLOR_DOT: Record<CardColor, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

interface CounterBuildBarProps {
  targetDeck: TopDeck | null
  allTopDecks: TopDeck[]
  selectedColors: CardColor[]
  strategy: Strategy | null
  suggestedStrategy: Strategy | null
  onTargetChange: (deck: TopDeck) => void
  onClearTarget: () => void
  onViewTarget: () => void
  onColorToggle: (c: CardColor) => void
  onStrategyChange: (s: Strategy) => void
  onCounterBuild: () => void
  disabled: boolean
}

export default function CounterBuildBar({
  targetDeck,
  allTopDecks,
  selectedColors,
  strategy,
  suggestedStrategy,
  onTargetChange,
  onClearTarget,
  onViewTarget,
  onColorToggle,
  onStrategyChange,
  onCounterBuild,
  disabled,
}: CounterBuildBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
      {/* Target deck section */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
          Target
        </span>
        {targetDeck ? (
          <>
            <span className="text-sm text-white font-medium truncate max-w-[120px]">
              {targetDeck.name}
            </span>
            <div className="flex gap-0.5">
              {targetDeck.colors.map(c => (
                <span key={c} className={`h-2 w-2 rounded-full ${COLOR_DOT[c]}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={onViewTarget}
              className="text-[10px] text-white/40 hover:text-white/70 border border-white/10 rounded px-1.5 py-0.5 transition-colors"
            >
              查看
            </button>
            <button
              type="button"
              onClick={onClearTarget}
              className="text-[10px] text-white/40 hover:text-white/70 border border-white/10 rounded px-1.5 py-0.5 transition-colors"
            >
              變更
            </button>
          </>
        ) : (
          <select
            onChange={e => {
              const found = allTopDecks.find(d => d.name === e.target.value)
              if (found) onTargetChange(found)
            }}
            defaultValue=""
            className="rounded border border-white/20 bg-bg-base text-xs text-white/60 px-2 py-1 focus:outline-none focus:border-accent-gold/40"
          >
            <option value="" disabled>選擇目標 Deck...</option>
            {allTopDecks.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="h-5 w-px bg-white/10 hidden sm:block" />

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
              onClick={() => onColorToggle(value)}
              className={`
                h-5 w-5 rounded-full transition-all
                ${dot}
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
          const active      = strategy === value
          const isSuggested = value === suggestedStrategy
          return (
            <button
              key={value}
              type="button"
              onClick={() => onStrategyChange(value)}
              className={`
                rounded-full px-3 py-1 text-xs font-medium transition-colors
                ${active
                  ? 'bg-accent-gold text-bg-base'
                  : 'border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40'
                }
              `}
            >
              {label}{isSuggested ? ' *' : ''}
            </button>
          )
        })}
      </div>

      {/* Counter Build button */}
      <button
        type="button"
        onClick={onCounterBuild}
        disabled={disabled}
        className={`
          ml-auto rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
          ${disabled
            ? 'border-white/10 text-white/20 cursor-not-allowed'
            : 'border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10'
          }
        `}
      >
        Counter Build
      </button>
    </div>
  )
}
