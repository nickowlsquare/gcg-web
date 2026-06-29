'use client'

import { useState } from 'react'

const STORAGE_KEY = 'gcg-active-deck'

export function useActiveDeck() {
  const [activeDeckId, setId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
  })

  const setActiveDeckId = (id: string) => {
    setId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const clearActiveDeck = () => {
    setId(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { activeDeckId, setActiveDeckId, clearActiveDeck }
}
