'use client'

import { useState, useEffect, useRef } from 'react'
import type { CardColor, Strategy } from '../types/card'

interface SaveDeckModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
  deckInfo: {
    colors: CardColor[]
    strategy: Strategy
    mainCount: number
    resourceCount: number
  }
}

const COLOR_LABELS: Record<string, string> = {
  blue: '藍', red: '紅', green: '綠', white: '白', purple: '紫',
}

export default function SaveDeckModal({ open, onClose, onSave, deckInfo }: SaveDeckModalProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and reset name when modal opens
  useEffect(() => {
    if (open) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Escape key closes modal
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const colorLabel = deckInfo.colors.map(c => COLOR_LABELS[c] ?? c).join('、')

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-bg-surface p-6 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-gold mb-4">
          儲存牌組
        </p>

        {/* Deck summary */}
        <div className="mb-4 rounded-lg border border-white/10 bg-bg-base px-3 py-2 text-xs text-white/40">
          {colorLabel} · {deckInfo.strategy} · {deckInfo.mainCount} main / {deckInfo.resourceCount} res
        </div>

        {/* Name input */}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="輸入牌組名稱…"
          className="w-full rounded-lg border border-white/10 bg-bg-base px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none mb-4"
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-lg border border-accent-gold/40 bg-accent-gold/10 py-2 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-30"
          >
            儲存
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            跳過
          </button>
        </div>
      </div>
    </div>
  )
}
