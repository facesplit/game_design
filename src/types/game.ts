import type { Player } from './player'
import type { Card } from './card'
import type { Tile } from './board'

export type GamePhase = 'menu' | 'setup' | 'playing' | 'ended'

export type TurnPhase = 'roll' | 'moving' | 'action' | 'resolve' | 'endTurn'

export interface ChanceCard {
  id: string
  type: 'gain-coins' | 'lose-coins' | 'take-card' | 'give-card'
  description: string
  value?: number
}

export interface HypeEvent {
  id: string
  buffCollection: string
  nerfCollection: string
  description: string
  artwork?: string
}

export interface LogEntry {
  id: string
  playerId: string
  message: string
  timestamp: number
  type: 'move' | 'buy' | 'sell' | 'event' | 'income' | 'loss' | 'system'
}

export interface GameState {
  phase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  turnPhase: TurnPhase
  board: Tile[]
  deck: Card[]
  discardPile: Card[]
  chanceDeck: ChanceCard[]
  hypeEvents: HypeEvent[]
  activeHype: HypeEvent | null
  endGameTriggered: boolean
  endGameTriggerPlayer: string | null
  eventLog: LogEntry[]
  winner: Player | null
  lastDiceRoll: number | null
  // Catch-up mechanic: when a trailing player passes START, they choose 1 of 2 hype events
  pendingHypeChoices: HypeEvent[]
  // Pass-and-play: blocks the screen between turns until next player taps "ready"
  showHandoff: boolean
  // After a manual hype choice we already showed the event — skip the auto-open in GameScreen
  suppressNextHypeAutoOpen: boolean
  roundNumber: number             // increments each time currentPlayerIndex wraps to 0
  lastHypeChangeRound: number     // round number when hype event last changed; init -1
}
