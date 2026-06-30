'use client'

import type { CardColor, CardType } from '../types/card'

const COLORS: { value: CardColor; label: string; dot: string }[] = [
  { value: 'blue',   label: 'Blue',   dot: 'bg-game-blue'   },
  { value: 'green',  label: 'Green',  dot: 'bg-game-green'  },
  { value: 'red',    label: 'Red',    dot: 'bg-game-red'    },
  { value: 'white',  label: 'White',  dot: 'bg-game-white'  },
  { value: 'purple', label: 'Purple', dot: 'bg-game-purple' },
]

const TYPES: { value: CardType; label: string; textColor: string; borderColor: string }[] = [
  { value: 'unit',       label: 'Unit',        textColor: 'text-cardtype-unit',     borderColor: 'border-cardtype-unit/40'     },
  { value: 'pilot',      label: 'Pilot',       textColor: 'text-cardtype-pilot',    borderColor: 'border-cardtype-pilot/40'    },
  { value: 'command',    label: 'Command',     textColor: 'text-cardtype-command',  borderColor: 'border-cardtype-command/40'  },
  { value: 'base',       label: 'Base',        textColor: 'text-cardtype-base',     borderColor: 'border-cardtype-base/40'     },
  { value: 'resource',   label: 'Resource',    textColor: 'text-cardtype-resource', borderColor: 'border-cardtype-resource/40' },
  { value: 'ex_base',    label: 'EX Base',     textColor: 'text-cardtype-base',     borderColor: 'border-cardtype-base/40'     },
  { value: 'ex_resource',label: 'EX Resource', textColor: 'text-cardtype-resource', borderColor: 'border-cardtype-resource/40' },
  { value: 'unit_token', label: 'Token',       textColor: 'text-amber-400',         borderColor: 'border-amber-400/40'         },
]

interface FilterSidebarProps {
  selectedColors: CardColor[]
  selectedTypes: CardType[]
  onColorToggle: (color: CardColor) => void
  onTypeToggle: (type: CardType) => void
  onClearAll: () => void
  totalCards: number
  filteredCount: number
}

export default function FilterSidebar({
  selectedColors,
  selectedTypes,
  onColorToggle,
  onTypeToggle,
  onClearAll,
  totalCards,
  filteredCount,
}: FilterSidebarProps) {
  return (
    <aside className="w-48 shrink-0">
      <div className="sticky top-20 rounded-lg border border-white/10 bg-bg-surface p-4 space-y-5">
        <p className="text-xs text-white/40">
          Showing <span className="text-white/70 font-semibold">{filteredCount}</span> / {totalCards} cards
        </p>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
            Color
          </p>
          <div className="flex flex-col gap-1.5">
            {COLORS.map(({ value, label, dot }) => {
              const active = selectedColors.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => onColorToggle(value)}
                  className={`
                    flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors
                    ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}
                  `}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dot} ${active ? 'opacity-100' : 'opacity-40'}`} />
                  {label}
                  {active && <span className="ml-auto text-white/30">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
            Type
          </p>
          <div className="flex flex-col gap-1.5">
            {TYPES.map(({ value, label, textColor, borderColor }) => {
              const active = selectedTypes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => onTypeToggle(value)}
                  className={`
                    rounded border px-2 py-1.5 text-xs text-left transition-colors
                    ${active
                      ? `${textColor} ${borderColor} bg-white/10`
                      : 'border-transparent text-white/40 hover:text-white/60'
                    }
                  `}
                >
                  {label}
                  {active && <span className="float-right text-white/40">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {(selectedColors.length > 0 || selectedTypes.length > 0) && (
          <button
            onClick={onClearAll}
            className="w-full rounded border border-white/10 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </aside>
  )
}
