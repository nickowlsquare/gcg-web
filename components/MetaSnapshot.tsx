'use client'

import type { MetaSnapshot as MetaSnapshotData } from '../lib/meta'
import type { CardColor, Strategy } from '../types/card'

const STRATEGY_LABELS: Record<Strategy, string> = {
  aggro:     'Aggro',
  midrange:  'Midrange',
  control:   'Control',
  attrition: 'Attrition',
}

const COLOR_LABELS: Record<CardColor, string> = {
  blue:   'Blue',
  green:  'Green',
  red:    'Red',
  white:  'White',
  purple: 'Purple',
}

const COLOR_BAR: Record<CardColor, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

interface MetaSnapshotProps {
  snapshot: MetaSnapshotData
}

export default function MetaSnapshot({ snapshot }: MetaSnapshotProps) {
  const { strategyDist, colorDist, totalDecks } = snapshot

  const strategies = (Object.keys(strategyDist) as Strategy[])
    .sort((a, b) => strategyDist[b] - strategyDist[a])

  const colors = (Object.keys(colorDist) as CardColor[])
    .sort((a, b) => colorDist[b] - colorDist[a])

  return (
    <div className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
          Meta Snapshot
        </span>
        <span className="text-xs text-white/30">{totalDecks} decks tracked</span>
      </div>

      <div className="flex gap-8 flex-wrap">
        {/* Strategy distribution */}
        <div className="flex-1 min-w-[140px]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            Strategy
          </p>
          <div className="flex flex-col gap-2">
            {strategies.map(s => (
              <div key={s}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{STRATEGY_LABELS[s]}</span>
                  <span className="text-white/40">{Math.round(strategyDist[s] * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-accent-gold transition-all"
                    style={{ width: `${strategyDist[s] * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color distribution */}
        <div className="flex-1 min-w-[140px]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            Color
          </p>
          <div className="flex flex-col gap-2">
            {colors.map(c => (
              <div key={c}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{COLOR_LABELS[c]}</span>
                  <span className="text-white/40">{Math.round(colorDist[c] * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className={`h-1.5 rounded-full ${COLOR_BAR[c]} transition-all`}
                    style={{ width: `${colorDist[c] * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
