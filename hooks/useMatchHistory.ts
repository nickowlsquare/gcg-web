'use client'

import { useState } from 'react'
import { addMatchResult } from '../lib/history'
import type { MatchResult } from '../types/card'

const STORAGE_KEY = 'gcg-match-history'

export function useMatchHistory() {
  const [history, setHistory] = useState<MatchResult[]>(() => {
    // Lazy initializer — only runs once on client mount.
    // Safe because this hook is only used in 'use client' components.
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MatchResult[]) : []
  })

  const add = (entry: MatchResult) => {
    const next = addMatchResult(history, entry)
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const clear = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { history, add, clear }
}
