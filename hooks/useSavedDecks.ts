'use client'

import { useState } from 'react'
import { addSavedDeck, removeSavedDeck } from '../lib/savedDecks'
import type { SavedDeck } from '../types/card'

const STORAGE_KEY = 'gcg-saved-decks'

export function useSavedDecks() {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
    // Guard against SSR prerender — localStorage is client-only.
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedDeck[]) : []
  })

  const save = (entry: SavedDeck) => {
    const next = addSavedDeck(savedDecks, entry)
    setSavedDecks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const remove = (id: string) => {
    const next = removeSavedDeck(savedDecks, id)
    setSavedDecks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { savedDecks, save, remove }
}
