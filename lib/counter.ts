import type { Card, CardColor, Strategy, TopDeck, MatchResult } from '../types/card'
import { scoreCard } from './strategy'
import { buildTopDeckFrequency, cardFitsColors, greedyFill } from './autofill'
import { buildLearnedTopDecks } from './history'

// ─── Internal types ───────────────────────────────────────────────────────────

interface ThreatProfile {
  /** keyword → total copies across all deck entries */
  dominantKeywords: Map<string, number>
  /** mean AP of unit cards (weighted by copy count); 0 if no units */
  meanUnitAP: number
  /** mean HP of unit cards (weighted by copy count); 0 if no units */
  meanUnitHP: number
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function analyzeTargetDeck(targetDeck: TopDeck, allCards: Card[]): ThreatProfile {
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  const dominantKeywords = new Map<string, number>()
  const unitAPs: number[] = []
  const unitHPs: number[] = []

  for (const entry of targetDeck.list ?? []) {
    const card = cardMap.get(entry.id)
    if (!card) continue

    // Weight keywords by copy count
    for (const kw of card.keywords) {
      dominantKeywords.set(kw, (dominantKeywords.get(kw) ?? 0) + entry.count)
    }

    if (card.type === 'unit') {
      for (let i = 0; i < entry.count; i++) {
        if (card.ap !== undefined) unitAPs.push(card.ap)
        if (card.hp !== undefined) unitHPs.push(card.hp)
      }
    }
  }

  const mean = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length

  return {
    dominantKeywords,
    meanUnitAP: mean(unitAPs),
    meanUnitHP: mean(unitHPs),
  }
}

function keywordCounterBonus(
  card: Card,
  profile: ThreatProfile,
  targetStrategy: Strategy
): number {
  let bonus = 0
  const { dominantKeywords, meanUnitAP } = profile

  // Burst count ≥ 3 → Barrier cards: +2
  if ((dominantKeywords.get('Burst') ?? 0) >= 3 && card.keywords.includes('Barrier')) {
    bonus += 2
  }

  // Deploy count ≥ 3 → high HP (≥ 4): +1
  if ((dominantKeywords.get('Deploy') ?? 0) >= 3 && (card.hp ?? 0) >= 4) {
    bonus += 1
  }

  // meanUnitAP > 3 → Barrier cards: +1, high HP (≥ 4) cards: +1
  if (meanUnitAP > 3) {
    if (card.keywords.includes('Barrier')) bonus += 1
    if ((card.hp ?? 0) >= 4) bonus += 1
  }

  // Target is aggro → Blocker/Repair/Recover cards: +2
  if (targetStrategy === 'aggro') {
    const antiAggro = ['Blocker', 'Repair', 'Recover']
    if (card.keywords.some(kw => antiAggro.includes(kw))) {
      bonus += 2
    }
  }

  return bonus
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Returns the recommended counter strategy for a given target strategy.
 * This is a heuristic — players can always override.
 */
export function getCounterStrategy(targetStrategy: Strategy): Strategy {
  const table: Record<Strategy, Strategy> = {
    aggro:     'attrition', // grind out fast attacks with high-HP + sustain
    midrange:  'control',   // disrupt the value engine
    control:   'aggro',     // apply pressure before they set up
    attrition: 'aggro',     // finish before they out-grind you
  }
  return table[targetStrategy]
}

/**
 * Score a card as a counter pick: base strategy score + keyword counter bonus.
 *
 * @param card        - The card to score
 * @param strategy    - The counter player's chosen strategy
 * @param targetDeck  - The deck being countered (used to compute threat profile)
 * @param topDeckFreq - Pre-computed top-deck frequency map (from buildTopDeckFrequency)
 * @param allCards    - Full card pool (for resolving target deck card details)
 */
export function counterScore(
  card: Card,
  strategy: Strategy,
  targetDeck: TopDeck,
  topDeckFreq: Map<string, number>,
  allCards: Card[]
): number {
  const profile = analyzeTargetDeck(targetDeck, allCards)
  return (
    scoreCard(card, strategy, topDeckFreq) +
    keywordCounterBonus(card, profile, targetDeck.strategy)
  )
}

/**
 * Auto-fill a counter deck against a specific target deck.
 * Same greedy fill algorithm as autofill(), using counterScore for ranking.
 */
export function counterAutofill(
  mainDeck: Record<string, number>,
  resourceDeck: Record<string, number>,
  allCards: Card[],
  topDecks: TopDeck[],
  targetDeck: TopDeck,
  colors: CardColor[],
  strategy: Strategy,
  matchHistory?: MatchResult[]
): { mainDeck: Record<string, number>; resourceDeck: Record<string, number> } {
  const learnedDecks = matchHistory ? buildLearnedTopDecks(matchHistory, topDecks) : []
  const allDecks = [...topDecks, ...learnedDecks]
  const topDeckFreq = buildTopDeckFrequency(allDecks, strategy, colors)

  // Pre-compute threat profile once (avoid re-analysis per card)
  const profile = analyzeTargetDeck(targetDeck, allCards)

  const eligible = allCards.filter(c => cardFitsColors(c, colors))
  const mainCandidates     = eligible.filter(c => c.type !== 'resource')
  const resourceCandidates = eligible.filter(c => c.type === 'resource')

  // Sort by counter score descending
  const scorer = (card: Card) =>
    scoreCard(card, strategy, topDeckFreq) +
    keywordCounterBonus(card, profile, targetDeck.strategy)

  const sortedMain     = [...mainCandidates].sort((a, b) => scorer(b) - scorer(a))
  const sortedResource = [...resourceCandidates].sort((a, b) => scorer(b) - scorer(a))

  return {
    mainDeck:     greedyFill(mainDeck,     sortedMain,     50, 4),
    resourceDeck: greedyFill(resourceDeck, sortedResource, 10, 4),
  }
}
