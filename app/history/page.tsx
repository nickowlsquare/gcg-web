'use client'

import { useState, useMemo } from 'react'
import { useMatchHistory } from '../../hooks/useMatchHistory'
import { getTopDecks } from '../../lib/topdecks'
import { getWinRate, buildLearnedTopDecks } from '../../lib/history'
import type { MatchResult } from '../../types/card'

export default function HistoryPage() {
  const { history, add } = useMatchHistory()
  const topDecks = useMemo(() => getTopDecks(), [])

  // Form visibility
  const [formOpen, setFormOpen] = useState(false)

  // Form fields
  const [deckSelection, setDeckSelection] = useState('')
  const [customName, setCustomName]       = useState('')
  const [outcome, setOutcome]             = useState<'win' | 'loss' | null>(null)
  const [opponentDeck, setOpponentDeck]   = useState('')
  const [notes, setNotes]                 = useState('')

  const topDeckNames = topDecks.map(d => d.name)
  const isCustom     = deckSelection === '__custom__'
  const deckName     = isCustom ? customName.trim() : deckSelection
  const deckIsTopDeck = !isCustom && deckSelection !== ''

  const stats        = getWinRate(history)
  const learnedCount = buildLearnedTopDecks(history, topDecks).length

  function handleSubmit() {
    if (!deckName || !outcome) return
    const entry: MatchResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      deckName,
      deckIsTopDeck,
      outcome,
      opponentDeck: opponentDeck || null,
      notes,
    }
    add(entry)
    // Reset form
    setDeckSelection('')
    setCustomName('')
    setOutcome(null)
    setOpponentDeck('')
    setNotes('')
    setFormOpen(false)
  }

  return (
    <div className="flex gap-6 items-start">

      {/* ── Left column — form + feed ── */}
      <div className="flex-[1.5] flex flex-col gap-4 min-w-0">

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setFormOpen(o => !o)}
          className="w-full rounded-lg border border-dashed border-accent-gold/50 py-2 text-sm text-accent-gold hover:bg-accent-gold/5 transition-colors"
        >
          {formOpen ? '✕ 收起' : '+ 記錄新對局'}
        </button>

        {/* Inline form */}
        {formOpen && (
          <div className="rounded-lg border border-white/10 bg-bg-surface p-4 flex flex-col gap-3">

            {/* Your deck */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                你的牌組
              </label>
              <select
                value={deckSelection}
                onChange={e => setDeckSelection(e.target.value)}
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
              >
                <option value="">選擇牌組…</option>
                {topDeckNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__custom__">自訂名稱…</option>
              </select>
              {isCustom && (
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="輸入牌組名稱"
                  className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
                />
              )}
            </div>

            {/* Opponent deck */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                對手牌組（可選）
              </label>
              <select
                value={opponentDeck}
                onChange={e => setOpponentDeck(e.target.value)}
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80"
              >
                <option value="">不填寫</option>
                {topDeckNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Outcome */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                結果
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome('win')}
                  className={`flex-1 rounded py-1.5 text-sm font-semibold transition-colors ${
                    outcome === 'win'
                      ? 'bg-green-700 text-white'
                      : 'border border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  勝
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('loss')}
                  className={`flex-1 rounded py-1.5 text-sm font-semibold transition-colors ${
                    outcome === 'loss'
                      ? 'bg-red-700 text-white'
                      : 'border border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  負
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold">
                備注（可選）
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="對局備注…"
                className="rounded border border-white/10 bg-bg-base px-2 py-1.5 text-sm text-white/80 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!deckName || !outcome}
              className="rounded-lg border border-accent-gold/40 bg-accent-gold/10 py-2 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-30"
            >
              確認記錄
            </button>
          </div>
        )}

        {/* Match feed */}
        {history.length === 0 ? (
          <p className="text-sm italic text-white/30">
            未有對局記錄。記錄第一場對局吧！
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(r => (
              <div
                key={r.id}
                className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">{r.deckName}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      r.outcome === 'win' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
                    }`}
                  >
                    {r.outcome === 'win' ? '勝' : '負'}
                  </span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-white/30">
                  {r.opponentDeck && <span>vs {r.opponentDeck}</span>}
                  <span>{new Date(r.date).toLocaleDateString('zh-HK')}</span>
                </div>
                {r.notes && (
                  <p className="mt-1 text-xs italic text-white/40">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right column — stats ── */}
      <div className="flex-1 flex flex-col gap-4 sticky top-20">

        {/* Win rate card */}
        <div className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            勝率
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-white/30">未有對局記錄</p>
          ) : (
            <>
              <p className="text-3xl font-black text-white">
                {Math.round(stats.rate * 100)}%
              </p>
              <p className="mt-1 text-xs text-white/40">
                {stats.wins}W / {stats.losses}L
              </p>
            </>
          )}
        </div>

        {/* Learning status card */}
        <div className="rounded-lg border border-white/10 bg-bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-2">
            學習狀態
          </p>
          {learnedCount === 0 ? (
            <p className="text-sm text-white/30">尚未有學習資料</p>
          ) : (
            <>
              <p className="text-sm text-white/80">
                ✦ 已從{' '}
                <span className="font-bold text-accent-gold">{learnedCount}</span>{' '}
                場勝局學習
              </p>
              <p className="mt-1 text-xs text-white/30">
                下次生成牌組將反映學習結果
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
