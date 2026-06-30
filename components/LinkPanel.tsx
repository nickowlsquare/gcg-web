import type { Card } from '../types/card'
import { getLinkPilots } from '../lib/linkPairs'

interface Props {
  card: Card
  allCards: Card[]
  mainDeck?: Record<string, number>
  onClose?: () => void
}

export default function LinkPanel({ card, allCards, mainDeck, onClose }: Props) {
  if (!card.linkRequirement) return null

  const pilots = getLinkPilots(card, allCards)

  return (
    <div className="rounded-lg border border-accent-gold/30 bg-bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase">
          Link 效果：即時攻擊
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white text-lg leading-none"
            aria-label="關閉"
          >
            ×
          </button>
        )}
      </div>

      {/* Pilot list */}
      {pilots.length > 0 ? (
        <div className="flex flex-col gap-2">
          {pilots.map(pilot => {
            const inDeck = mainDeck != null ? (mainDeck[pilot.id] ?? 0) > 0 : null
            return (
              <div
                key={pilot.id}
                className="flex items-center justify-between rounded border border-white/10 bg-bg-elevated px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{pilot.name}</span>
                  <span className="text-[9px] text-accent-gold">{pilot.rarity}</span>
                  {pilot.apBoost != null && (
                    <span className="text-[10px] text-cardtype-pilot">
                      AP+{pilot.apBoost} HP+{pilot.hpBoost}
                    </span>
                  )}
                </div>
                {inDeck != null && (
                  <span className={inDeck ? 'text-xs text-green-400' : 'text-xs text-white/30'}>
                    {inDeck ? '✓ 已在牌組' : '✗ 未在牌組'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-white/30">
          「{card.linkRequirement}」— 卡牌資料未有
        </p>
      )}
    </div>
  )
}
