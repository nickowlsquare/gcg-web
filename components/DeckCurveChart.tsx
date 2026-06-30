'use client'

import { useState } from 'react'
import type { Card } from '../types/card'
import { computeCurve } from '../lib/deckCharts'

interface Props {
  mainDeck: Record<string, number>
  allCards: Card[]
}

export default function DeckCurveChart({ mainDeck, allCards }: Props) {
  const [tab, setTab] = useState<'cost' | 'level'>('cost')

  const { buckets, labels, average } = computeCurve(tab, mainDeck, allCards)
  const maxBucket = Math.max(...buckets, 1)
  const isEmpty = buckets.every(b => b === 0)

  const barColor = tab === 'cost' ? '#8b7535' : '#4a7a9b'
  const avgLabel = tab === 'cost' ? '平均費用' : '平均等級'

  return (
    <div className="rounded-lg border border-white/10 bg-bg-surface px-3 pt-2 pb-3">
      {/* Tab bar */}
      <div role="tablist" className="flex border-b border-white/10 mb-3">
        {(['cost', 'level'] as const).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={[
              'px-3 py-1 text-xs font-medium transition-colors',
              tab === t
                ? t === 'cost'
                  ? 'text-accent-gold border-b-2 border-accent-gold -mb-px'
                  : 'text-blue-400 border-b-2 border-blue-400 -mb-px'
                : 'text-white/30 hover:text-white/50',
            ].join(' ')}
          >
            {t === 'cost' ? '費用' : '等級'}
          </button>
        ))}
      </div>

      {/* Chart area */}
      {isEmpty ? (
        <p className="text-center text-xs text-white/20 py-4">加牌後顯示曲線</p>
      ) : (
        <>
          <div className="flex items-end gap-1 h-16">
            {buckets.map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  aria-label={`${labels[i]}: ${count}`}
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${(count / maxBucket) * 100}%`,
                    backgroundColor: barColor,
                    minHeight: count > 0 ? '3px' : '0',
                  }}
                />
                <span className="text-[9px] text-white/30">{labels[i]}</span>
              </div>
            ))}
          </div>

          {/* Average */}
          <p className="mt-2 text-[10px] text-white/40 border-t border-white/5 pt-2">
            {avgLabel}：<span style={{ color: barColor }}>{average.toFixed(1)}</span>
          </p>
        </>
      )}
    </div>
  )
}
