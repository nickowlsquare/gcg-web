'use client'

import type { TopDeck, Card, CardType, Strategy } from '../types/card'

const TYPE_ORDER: CardType[] = ['unit', 'pilot', 'command', 'base', 'resource']

const TYPE_LABEL: Record<CardType, string> = {
  unit:     'Unit',
  pilot:    'Pilot',
  command:  'Command',
  base:     'Base',
  resource: 'Resource',
}

const TYPE_COLOR: Record<CardType, string> = {
  unit:     'text-cardtype-unit',
  pilot:    'text-cardtype-pilot',
  command:  'text-cardtype-command',
  base:     'text-cardtype-base',
  resource: 'text-white/40',
}

const STRATEGY_LABEL: Record<Strategy, string> = {
  aggro:     'Aggro',
  midrange:  'Midrange',
  control:   'Control',
  attrition: 'Attrition',
}

interface TopDeckDrawerProps {
  deck: TopDeck | null
  allCards: Card[]
  onClose: () => void
  onLoad: (deck: TopDeck) => void
  onCounter?: (deck: TopDeck) => void
}

export default function TopDeckDrawer({ deck, allCards, onClose, onLoad, onCounter }: TopDeckDrawerProps) {
  if (!deck) return null

  const cardMap = new Map(allCards.map(c => [c.id, c]))

  // Group list entries by card type
  const byType: Partial<Record<CardType, { name: string; count: number }[]>> = {}
  for (const entry of deck.list ?? []) {
    const card = cardMap.get(entry.id)
    const type: CardType = card?.type ?? 'unit'
    const name = card?.name ?? entry.id
    if (!byType[type]) byType[type] = []
    byType[type]!.push({ name, count: entry.count })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-bg-base border-l border-white/10 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{deck.name}</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {STRATEGY_LABEL[deck.strategy]} · {deck.source} · {deck.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Card list (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {TYPE_ORDER.map(type => {
            const entries = byType[type]
            if (!entries || entries.length === 0) return null
            const subtotal = entries.reduce((s, e) => s + e.count, 0)
            return (
              <div key={type}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${TYPE_COLOR[type]}`}>
                  {TYPE_LABEL[type]} ({subtotal})
                </p>
                <div className="space-y-1">
                  {entries.map((e, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-white/70 truncate">{e.name}</span>
                      <span className="text-white/30 ml-2 shrink-0">×{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => onLoad(deck)}
            className="w-full rounded-lg border border-accent-gold/50 py-2.5 text-sm font-semibold text-accent-gold hover:bg-accent-gold/10 transition-colors"
          >
            載入到 Build
          </button>
          {onCounter && (
            <button
              type="button"
              onClick={() => onCounter(deck)}
              className="w-full rounded-lg border border-white/20 py-2 text-sm font-semibold text-white/50 hover:text-white/80 hover:border-white/40 transition-colors"
            >
              Counter 此 Deck
            </button>
          )}
        </div>
      </div>
    </>
  )
}
