'use client'

import type { CardColor, Strategy } from '../types/card'

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

interface AutoBuildBarProps {
  selectedColors: CardColor[]
  strategy: Strategy | null
  onColorToggle: (color: CardColor) => void
  onStrategyChange: (strategy: Strategy) => void
  onAutoBuild: () => void
  disabled: boolean
}

export default function AutoBuildBar({
  selectedColors,
  strategy,
  onColorToggle,
  onStrategyChange,
  onAutoBuild,
  disabled,
}: AutoBuildBarProps) {
  return (
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

      {/* Divider */}
      <div className="h-5 w-px bg-white/10 hidden sm:block" />

      {/* Strategy pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mr-1">
          Strategy
        </span>
        {STRATEGIES.map(({ value, label }) => {
          const active = strategy === value
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
              {label}
            </button>
          )
        })}
      </div>

      {/* Auto Build button — pushed to right */}
      <button
        type="button"
        onClick={onAutoBuild}
        disabled={disabled}
        className={`
          ml-auto rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
          ${disabled
            ? 'border-white/10 text-white/20 cursor-not-allowed'
            : 'border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10'
          }
        `}
      >
        Auto Build
      </button>
    </div>
  )
}
