import type { CardType } from '../types/card'

const TYPE_CONFIG: {
  key: CardType
  label: string
  color: string
  range: string
}[] = [
  { key: 'unit',    label: 'Unit',    color: 'text-cardtype-unit',    range: '25–28' },
  { key: 'pilot',   label: 'Pilot',   color: 'text-cardtype-pilot',   range: '6–8'   },
  { key: 'command', label: 'Cmd',     color: 'text-cardtype-command', range: '8–10'  },
  { key: 'base',    label: 'Base',    color: 'text-cardtype-base',    range: '4–6'   },
]

interface DeckStatBarProps {
  stats: {
    typeCounts: Record<CardType, number>
    costCurve: Record<number, number>
  }
}

export default function DeckStatBar({ stats }: DeckStatBarProps) {
  const { typeCounts, costCurve } = stats

  const maxCost = Math.max(...Object.keys(costCurve).map(Number), 6)
  const maxCount = Math.max(...Object.values(costCurve), 1)
  const costs = Array.from({ length: maxCost }, (_, i) => i + 1)

  return (
    <div className="rounded-lg border border-white/10 bg-bg-surface p-3 space-y-3">

      {/* Type counts */}
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-accent-gold">
          Card Types
        </p>
        <div className="grid grid-cols-4 gap-1">
          {TYPE_CONFIG.map(({ key, label, color, range }) => (
            <div key={key} className="text-center">
              <p className={`text-base font-bold ${color}`}>{typeCounts[key] ?? 0}</p>
              <p className="text-[9px] text-white/40">{label}</p>
              <p className="text-[8px] text-white/20">{range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cost curve */}
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-accent-gold">
          Cost Curve
        </p>
        <div className="flex items-end gap-1 h-12">
          {costs.map(cost => {
            const count = costCurve[cost] ?? 0
            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={cost} className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className="w-full rounded-t bg-game-blue/60 transition-all duration-300 min-h-[2px]"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[8px] text-white/30">{cost}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
