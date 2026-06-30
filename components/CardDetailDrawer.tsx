'use client'

import { useState, useEffect } from 'react'
import type { Card } from '../types/card'
import LinkPanel from './LinkPanel'

const CARD_TYPE_COLORS: Record<string, string> = {
  unit:        'text-cardtype-unit     bg-cardtype-unit/10     border-cardtype-unit/30',
  pilot:       'text-cardtype-pilot    bg-cardtype-pilot/10    border-cardtype-pilot/30',
  command:     'text-cardtype-command  bg-cardtype-command/10  border-cardtype-command/30',
  base:        'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  resource:    'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  ex_base:     'text-cardtype-base     bg-cardtype-base/10     border-cardtype-base/30',
  ex_resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
  unit_token:  'text-amber-400         bg-amber-400/10         border-amber-400/30',
}

interface Props {
  card: Card | null
  allCards: Card[]
  onClose: () => void
}

export default function CardDetailDrawer({ card, allCards, onClose }: Props) {
  const [imgError, setImgError] = useState(false)

  // Reset image error when the selected card changes
  useEffect(() => { setImgError(false) }, [card?.id])

  const isOpen = card !== null
  const typeStyle = card ? (CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource) : ''

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`absolute right-0 top-0 h-full w-80 overflow-y-auto bg-bg-surface border-l border-white/10 transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {card && (
          <div className="flex flex-col gap-4 p-4">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold leading-tight text-white">{card.name}</h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-xl leading-none text-white/30 hover:text-white"
                aria-label="關閉"
              >
                ×
              </button>
            </div>

            {/* Artwork */}
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://gundambay.com/static/images/cards/${card.id}.webp`}
                alt={card.name}
                className="w-full rounded-lg object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex aspect-[5/7] w-full flex-col items-center justify-center gap-2 rounded-lg bg-bg-elevated">
                <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${typeStyle}`}>
                  {card.type}
                </span>
                <p className="px-4 text-center text-xs text-white/40">{card.name}</p>
              </div>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {card.isLR && (
                <span className="rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-bold text-bg-base">
                  LR
                </span>
              )}
              <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
                {card.type}
              </span>
              <span className="text-[10px] text-white/30">{card.set} · {card.id}</span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              {card.level != null && (
                <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                  Level {card.level}
                </span>
              )}
              {card.cost != null && (
                <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                  Cost {card.cost}
                </span>
              )}
              {(['unit', 'base', 'ex_base', 'unit_token'] as string[]).includes(card.type) && card.ap != null && (
                <>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                    AP {card.ap}
                  </span>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-white/70">
                    HP {card.hp}
                  </span>
                </>
              )}
              {card.type === 'pilot' && card.apBoost != null && card.hpBoost != null && (
                <>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-cardtype-pilot">
                    AP+{card.apBoost}
                  </span>
                  <span className="rounded border border-white/10 bg-bg-elevated px-2 py-1 text-xs text-cardtype-pilot">
                    HP+{card.hpBoost}
                  </span>
                </>
              )}
            </div>

            {/* Traits + Keywords */}
            {(card.traits.length > 0 || card.keywords.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {card.traits.map(trait => (
                  <span
                    key={trait}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60"
                  >
                    {trait}
                  </span>
                ))}
                {card.keywords.map(kw => (
                  <span
                    key={kw}
                    className="rounded-full border border-accent-gold/30 px-2 py-0.5 text-[10px] text-accent-gold/70"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Link section — LinkPanel returns null if no linkRequirement */}
            <LinkPanel card={card} allCards={allCards} />

            {/* Ability text */}
            {card.text && (
              <p className="whitespace-pre-wrap border-t border-white/10 pt-4 text-sm leading-relaxed text-white/60">
                {card.text}
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
