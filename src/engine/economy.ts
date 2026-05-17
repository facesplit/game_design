import type { Player } from '../types/player'
import type { Card } from '../types/card'
import type { HypeEvent } from '../types/game'
import { LEADER_INCOME_MULT } from '../types/player'

export function calculateCardIncome(card: Card, activeHype: HypeEvent | null, player: Player): number {
  let income = card.income

  // Existing: legendary card 'leader' ability → 1.5× base income
  if (card.ability === 'leader') {
    income = Math.round(income * LEADER_INCOME_MULT)
  }

  // Existing: epic card 'stability' ability → +1 when any hype is active
  if (card.ability === 'stability' && activeHype) {
    income += 1
  }

  // New: Collection Leader designation → this card's income ×2
  if (player.collectionLeaders[card.collection] === card.id) {
    income *= 2
  }

  if (activeHype) {
    if (card.collection === activeHype.buffCollection) {
      income += 1
    } else if (card.collection === activeHype.nerfCollection) {
      // New: Collection Stability — Legendary + Epic of same collection → ignore nerf
      const hasLegendary = player.hand.some(
        (c) => c.collection === card.collection && c.rarity === 'legendary'
      )
      const hasEpic = player.hand.some(
        (c) => c.collection === card.collection && c.rarity === 'epic'
      )
      const hasStability = hasLegendary && hasEpic
      if (!hasStability) {
        income -= 1
      }
    }
  }

  return Math.max(0, income)
}

export function calculateStartIncome(player: Player, activeHype: HypeEvent | null): number {
  return player.hand.reduce((total, card) => total + calculateCardIncome(card, activeHype, player), 0)
}

export function calculateFinalScore(player: Player): number {
  const cardValue = player.hand.reduce((total, card) => {
    let price = card.sellPrice
    if (card.ability === 'leader') {
      price += Math.round(card.income * (LEADER_INCOME_MULT - 1))
    }
    return total + price
  }, 0)
  return player.coins + cardValue
}
