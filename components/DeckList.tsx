import type { Card } from '../types/card'

const TYPE_SHORT: Record<string, string> = {
  unit: 'UNIT', pilot: 'PILOT', command: 'CMD', base: 'BASE', resource: 'RES',
}

const TYPE_COLOR: Record<string, string> = {
  unit:     'text-cardtype-unit',
  pilot:    'text-cardtype-pilot',
  command:  'text-cardtype-command',
  base:     'text-cardtype-base',
  resource: 'text-cardtype-resource',
}

interface DeckListProps {
  mainDeck: Record<string, number>
  resourceDeck: Record<string, number>
  allCards: Card[]
  onAdd: (card: Card, isResource: boolean) => void
  onRemove: (cardId: string, isResource: boolean) => void
  errors: string[]
}

function DeckRow({
  card,
  count,
  canAdd,
  onAdd,
  onRemove,
}: {
  card: Card
  count: number
  canAdd: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const isLR = card.isLR === true
  return (
    <div className={`flex items-center gap-2 rounded px-2 py-1.5 ${isLR ? 'bg-accent-gold/10' : 'bg-white/5'}`}>
      <span className={`text-xs flex-1 truncate ${isLR ? 'text-accent-gold' : 'text-white/80'}`}>
        {card.name}
      </span>
      <span className={`text-[9px] font-semibold shrink-0 ${TYPE_COLOR[card.type] ?? 'text-white/40'}`}>
        {TYPE_SHORT[card.type] ?? card.type.toUpperCase()}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center rounded bg-white/10 text-white/60 hover:bg-white/20 text-xs font-bold leading-none"
        >
          −
        </button>
        <span className={`w-4 text-center text-xs font-semibold ${isLR ? 'text-accent-gold' : 'text-white'}`}>
          {count}
        </span>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold leading-none
            ${canAdd
              ? 'bg-white/10 text-white/60 hover:bg-white/20'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function DeckList({
  mainDeck,
  resourceDeck,
  allCards,
  onAdd,
  onRemove,
  errors,
}: DeckListProps) {
  const cardMap = new Map(allCards.map(c => [c.id, c]))

  const mainTotal = Object.values(mainDeck).reduce((s, n) => s + n, 0)
  const resourceTotal = Object.values(resourceDeck).reduce((s, n) => s + n, 0)

  const mainEntries = Object.entries(mainDeck)
    .map(([id, count]) => ({ card: cardMap.get(id), count }))
    .filter((e): e is { card: Card; count: number } => e.card !== undefined)

  const resourceEntries = Object.entries(resourceDeck)
    .map(([id, count]) => ({ card: cardMap.get(id), count }))
    .filter((e): e is { card: Card; count: number } => e.card !== undefined)

  return (
    <div className="flex flex-col gap-2 min-h-0 flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* Main deck */}
        <div>
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-accent-gold">
            Main Deck ({mainTotal}/50)
          </p>
          {mainEntries.length === 0 ? (
            <p className="text-[10px] text-white/20 italic px-2">No cards added yet</p>
          ) : (
            <div className="space-y-1">
              {mainEntries.map(({ card, count }) => (
                <DeckRow
                  key={card.id}
                  card={card}
                  count={count}
                  canAdd={count < 4 && mainTotal < 50}
                  onAdd={() => onAdd(card, false)}
                  onRemove={() => onRemove(card.id, false)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resource deck */}
        <div>
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-accent-gold">
            Resource ({resourceTotal}/10)
          </p>
          {resourceEntries.length === 0 ? (
            <p className="text-[10px] text-white/20 italic px-2">No resource cards</p>
          ) : (
            <div className="space-y-1">
              {resourceEntries.map(({ card, count }) => (
                <DeckRow
                  key={card.id}
                  card={card}
                  count={count}
                  canAdd={count < 4 && resourceTotal < 10}
                  onAdd={() => onAdd(card, true)}
                  onRemove={() => onRemove(card.id, true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-[10px] text-red-400">{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}
