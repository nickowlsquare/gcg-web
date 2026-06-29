'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCards } from '../../lib/cards'
import { useSavedDecks } from '../../hooks/useSavedDecks'
import { formatDeckExport } from '../../lib/savedDecks'
import { useMatchHistory } from '../../hooks/useMatchHistory'
import { useActiveDeck } from '../../hooks/useActiveDeck'
import { getDeckStats } from '../../lib/deckStats'
import { getTopDecks } from '../../lib/topdecks'
import type { SavedDeck } from '../../types/card'

const COLOR_LABELS: Record<string, string> = {
  blue: '藍',
  red: '紅',
  green: '綠',
  white: '白',
  purple: '紫',
}

export default function DecksPage() {
  const allCards = useMemo(() => getAllCards(), [])
  const { savedDecks, remove } = useSavedDecks()
  const router = useRouter()
  const { history } = useMatchHistory()
  const { activeDeckId } = useActiveDeck()
  const topDecks = useMemo(() => getTopDecks(), [])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  async function handleCopy(deck: SavedDeck) {
    try {
      const text = formatDeckExport(deck, allCards)
      await navigator.clipboard.writeText(text)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      setCopiedId(deck.id)
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard permission denied or page not focused — silently ignore
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-black tracking-tight text-white">我的牌組</h1>

      {savedDecks.length === 0 ? (
        <p className="text-center text-sm italic text-white/30 py-12">
          未有儲存牌組。喺 Build 或 Counter 頁面生成後儲存吧！
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {savedDecks.map(deck => {
            const colorLabel = deck.colors.map(c => COLOR_LABELS[c] ?? c).join('、')
            const date = deck.createdAt.slice(0, 10)
            const mainCount = Object.values(deck.mainDeck).reduce((s, n) => s + n, 0)
            const resourceCount = Object.values(deck.resourceDeck).reduce((s, n) => s + n, 0)
            const isCopied = copiedId === deck.id

            return (
              <div
                key={deck.id}
                className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3"
              >
                {/* Top row: name + actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-white/90 truncate">
                      {deck.name}
                    </span>
                    {activeDeckId === deck.id && (
                      <span className="shrink-0 rounded border border-accent-gold/50 bg-accent-gold/10 px-1.5 py-0.5 text-[10px] text-accent-gold">
                        使用中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/build?saved=${deck.id}`)}
                      className="rounded border border-accent-gold/40 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20"
                    >
                      載入
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(deck)}
                      className={`rounded border px-3 py-1 text-xs font-semibold transition-colors ${
                        isCopied
                          ? 'border-green-600/50 bg-green-700/20 text-green-400'
                          : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {isCopied ? '已複製！' : '複製'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(deck.id)}
                      className="rounded border border-red-700/40 bg-red-900/10 px-3 py-1 text-xs font-semibold text-red-400/70 transition-colors hover:bg-red-900/20 hover:text-red-400"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                {/* Bottom row: metadata */}
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-white/30">
                  {colorLabel && <><span className="text-white/40">·</span> <span>{colorLabel}</span></>}
                  <span className="text-white/40">·</span>
                  <span>{deck.strategy}</span>
                  <span className="text-white/40">·</span>
                  <span>{date}</span>
                  <span className="text-white/40">·</span>
                  <span>{mainCount} main / {resourceCount} res</span>
                </div>

                {/* Stats row */}
                {(() => {
                  const stats = getDeckStats(deck.id, history, topDecks)
                  const total = stats.wins + stats.losses
                  if (total === 0) {
                    return (
                      <p className="mt-1.5 border-t border-white/5 pt-1.5 text-xs text-white/25">
                        未有比賽記錄
                      </p>
                    )
                  }
                  return (
                    <div className="mt-1.5 border-t border-white/5 pt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="text-green-400">{stats.wins}勝</span>
                      <span className="text-red-400">{stats.losses}負</span>
                      <span className="text-accent-gold">{Math.round(stats.winRate * 100)}%</span>
                      {Object.entries(stats.byStrategy).map(([strat, s]) => (
                        <span key={strat} className="text-white/40">
                          · vs {strat}: <span className="text-green-400/80">{s.wins}W</span>{' '}
                          <span className="text-red-400/80">{s.losses}L</span>
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
