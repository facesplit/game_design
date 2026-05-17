import type { Card } from '../types/card'
import { HAND_LIMIT, BOOSTER_COST } from '../types/player'

export function canBuyCard(coins: number, handSize: number): boolean {
  return coins >= BOOSTER_COST && handSize < HAND_LIMIT
}

export function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return { drawn, remaining }
}

export function sellCard(card: Card): number {
  return card.sellPrice
}

export function isHandFull(handSize: number): boolean {
  return handSize >= HAND_LIMIT
}
