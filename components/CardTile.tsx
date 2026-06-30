'use client'

import { useState } from 'react'
import type { Card, CardType } from '../types/card'
import { getLinkPilots } from '../lib/linkPairs'

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

const GAME_COLOR_DOTS: Record<string, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

function getCardImageUrl(id: string): string {
  return `https://gundambay.com/static/images/cards/${id}.webp`
}

interface CardTileProps {
  card: Card
  deckCount?: number
  onAdd?: () => void
  canAdd?: boolean
  allCards?: Card[]
  mainDeck?: Record<string, number>
  onClick?: () => void
}

export default function CardTile({
  card,
  deckCount,
  onAdd,
  canAdd = true,
  allCards,
  mainDeck,
  onClick,
}: CardTileProps) {
  const [imgError, setImgError] = useState(false)
  const typeStyle = CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource
  const isLR = card.isLR === true

  // Compute link info for hover overlay
  const linkPilots = allCards && card.type === 'unit' && card.linkRequirement
    ? getLinkPilots(card, allCards)
    : null
  const linkPilot = linkPilots?.[0] ?? null
  const linkInDeck = linkPilot && mainDeck != null
    ? (mainDeck[linkPilot.id] ?? 0) > 0
    : null

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd?.()
  }

  return (
    <div
      className={`
        relative flex flex-col rounded-lg border overflow-hidden
        bg-bg-surface transition-all duration-150
        hover:bg-bg-elevated hover:scale-[1.02]
        ${isLR ? 'border-accent-gold/50' : 'border-white/10'}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Deck count badge */}
      {deckCount && deckCount > 0 && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-accent-gold/90 px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none shadow">
          ×{deckCount}
        </span>
      )}

      {/* LR badge */}
      {isLR && (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-accent-gold px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none shadow">
          LR
        </span>
      )}

      {/* Card image */}
      <div className={`relative w-full aspect-[5/7] bg-bg-elevated overflow-hidden ${onAdd ? 'group' : ''}`}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getCardImageUrl(card.id)}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback when image not available */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
              {card.type}
            </span>
            <p className="text-[10px] text-white/40 text-center leading-tight mt-1">{card.name}</p>
          </div>
        )}

        {/* Hover overlay with add button + link row */}
        {onAdd && (
          <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-2">
            <button
              type="button"
              disabled={!canAdd}
              onClick={handleAddClick}
              className={`
                w-12 h-12 rounded-full font-bold text-lg transition-all
                flex items-center justify-center
                ${
                  canAdd
                    ? 'bg-accent-gold text-bg-base hover:scale-110 active:scale-95 cursor-pointer'
                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                }
              `}
            >
              +
            </button>

            {/* Compact link row */}
            {linkPilots !== null && (
              <div className="text-[10px] text-center leading-tight">
                <span className="text-white/50">Link: </span>
                {linkPilot ? (
                  <>
                    <span className="text-white/90">{linkPilot.name}</span>
                    {linkInDeck != null && (
                      <span className={linkInDeck ? ' text-green-400' : ' text-white/30'}>
                        {linkInDeck ? ' ✓' : ' ✗'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-white/30">{card.linkRequirement} — 未有資料</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex flex-col gap-1.5 p-2">
        {/* Type badge (only shown when image loads) */}
        {!imgError && (
          <span className={`self-start rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
            {card.type}
          </span>
        )}

        {/* Card name */}
        <p className="text-xs font-semibold leading-tight text-white line-clamp-2">
          {card.name}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-1">
          {card.level != null && (
            <span className="text-[10px] text-white/50">
              L{card.level}
              {card.cost != null && <span className="text-white/30"> / C{card.cost}</span>}
            </span>
          )}

          {(['unit', 'base', 'ex_base', 'unit_token'] as CardType[]).includes(card.type) && card.ap != null && (
            <span className="ml-auto text-[10px] text-white/70">
              {card.ap}/{card.hp}
            </span>
          )}

          {card.type === 'pilot' && card.apBoost != null && (
            <span className="ml-auto text-[10px] text-cardtype-pilot">
              +{card.apBoost}/+{card.hpBoost}
            </span>
          )}
        </div>

        {/* Color dots */}
        <div className="flex gap-1">
          {card.colors.map(color => (
            <span
              key={color}
              className={`h-1.5 w-1.5 rounded-full ${GAME_COLOR_DOTS[color] ?? 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
