// types/card.ts
export type CardColor = 'blue' | 'green' | 'red' | 'white' | 'purple'
export type CardType = 'unit' | 'pilot' | 'command' | 'base' | 'resource'
export type Strategy = 'aggro' | 'midrange' | 'control' | 'attrition'

export interface Card {
  // Identifiers
  id: string           // e.g. "GD01-015"
  name: string
  type: CardType
  rarity: string       // "C" | "U" | "R" | "LR" | "P"
  set: string          // e.g. "GD01"
  sourceTitle?: string // e.g. "Mobile Suit Gundam SEED"

  // Game stats
  colors: CardColor[]  // 1+ colors; colorless = []
  level: number | null
  cost: number | null
  ap?: number          // Unit / Base attack power
  hp?: number          // Unit / Base hit points
  isLR?: boolean

  // Pilot-specific fields
  apBoost?: number
  hpBoost?: number
  linkRequirement?: string
  blockIcon?: number

  // Classification & effects
  traits: string[]     // e.g. ["Earth Alliance"]
  keywords: string[]   // e.g. ["Deploy", "Burst"]
  zones?: string[]     // e.g. ["Space", "Earth"]
  text: string

  // Legality
  isBanned?: boolean
  isLimited?: boolean
}

export interface DeckEntry {
  id: string
  count: number
}

export interface Deck {
  colors: CardColor[]   // max 2
  main: DeckEntry[]     // total = 50
  resource: DeckEntry[] // total = 10
}

export interface TopDeck {
  name: string
  colors: CardColor[]
  keyCards: string[]
  strategy: Strategy
  tier: 'S' | 'A' | 'B' | 'C'
  list?: DeckEntry[]
  source: string
  date: string
  placement?: number
}

export interface MatchResult {
  id: string              // crypto.randomUUID()
  date: string            // ISO 8601
  deckName: string        // top deck name or custom name
  deckIsTopDeck: boolean  // true if deckName matches a TopDeck.name
  outcome: 'win' | 'loss'
  opponentDeck: string | null  // top deck name; null if not recorded
  notes: string           // free text; empty string if not provided
  deckId?: string         // ID of the SavedDeck used; undefined for pre-M10 records
}

export interface SavedDeck {
  id: string              // crypto.randomUUID()
  name: string            // user-given name
  createdAt: string       // ISO 8601
  colors: CardColor[]
  strategy: Strategy
  mainDeck: Record<string, number>
  resourceDeck: Record<string, number>
  source: 'build' | 'counter'
}
