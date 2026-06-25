import type { Card } from '../types/card'

const CARD_TYPE_COLORS: Record<string, string> = {
  unit:     'text-cardtype-unit    bg-cardtype-unit/10    border-cardtype-unit/30',
  pilot:    'text-cardtype-pilot   bg-cardtype-pilot/10   border-cardtype-pilot/30',
  command:  'text-cardtype-command bg-cardtype-command/10 border-cardtype-command/30',
  base:     'text-cardtype-base    bg-cardtype-base/10    border-cardtype-base/30',
  resource: 'text-cardtype-resource bg-cardtype-resource/10 border-cardtype-resource/30',
}

const GAME_COLOR_DOTS: Record<string, string> = {
  blue:   'bg-game-blue',
  green:  'bg-game-green',
  red:    'bg-game-red',
  white:  'bg-game-white',
  purple: 'bg-game-purple',
}

interface CardTileProps {
  card: Card
}

export default function CardTile({ card }: CardTileProps) {
  const typeStyle = CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.resource
  const isLR = card.isLR === true

  return (
    <div
      className={`
        relative flex flex-col gap-2 rounded-lg border p-3
        bg-bg-surface transition-all duration-150
        hover:bg-bg-elevated hover:scale-[1.02]
        ${isLR ? 'border-accent-gold/50' : 'border-white/10'}
      `}
    >
      {isLR && (
        <span className="absolute -top-2 -right-2 rounded-full bg-accent-gold px-1.5 py-0.5 text-[9px] font-bold text-bg-base leading-none">
          LR
        </span>
      )}

      <span className={`self-start rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
        {card.type}
      </span>

      <p className="text-xs font-semibold leading-tight text-white line-clamp-2 min-h-[2rem]">
        {card.name}
      </p>

      <p className="font-mono text-[10px] text-white/30">{card.id}</p>

      <div className="flex items-center gap-2 mt-auto">
        {card.level != null && (
          <span className="text-[10px] text-white/50">
            L{card.level}
            {card.cost != null && <span className="text-white/30"> / C{card.cost}</span>}
          </span>
        )}

        {(card.type === 'unit' || card.type === 'base') && card.ap != null && (
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

      <div className="flex gap-1">
        {card.colors.map(color => (
          <span
            key={color}
            className={`h-1.5 w-1.5 rounded-full ${GAME_COLOR_DOTS[color] ?? 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
