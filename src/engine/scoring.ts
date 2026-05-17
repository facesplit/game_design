import type { Player } from '../types/player'
import { LEADER_INCOME_MULT } from '../types/player'

export interface PlayerScore {
  playerId: string
  playerName: string
  coins: number
  cardValue: number
  totalScore: number
}

export function calculateAllScores(players: Player[]): PlayerScore[] {
  return players
    .map((player) => {
      const cardValue = player.hand.reduce((total, card) => {
        let price = card.sellPrice
        if (card.ability === 'leader') {
          price += Math.round(card.income * (LEADER_INCOME_MULT - 1))
        }
        return total + price
      }, 0)
      return {
        playerId: player.id,
        playerName: player.name,
        coins: player.coins,
        cardValue,
        totalScore: player.coins + cardValue,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
}

export function determineWinner(players: Player[]): Player {
  const scores = calculateAllScores(players)
  return players.find((p) => p.id === scores[0].playerId)!
}
