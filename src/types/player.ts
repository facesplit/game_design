import type { Card } from './card'
import type { Collection } from './card'

export interface Player {
  id: string
  name: string
  color: string
  coins: number
  hand: Card[]
  position: number
  startPasses: number
  hasInsurance: boolean
  collectionLeaders: Partial<Record<Collection, string>>  // collection → card id of designated leader
}

export const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'] as const

export const HAND_LIMIT = 8
export const STARTING_COINS = 10
export const BOOSTER_COST = 3
export const TAX_AMOUNT = 5
// Playtest fix #1: shorten game from 6 → 4 START passes
export const START_PASSES_TO_END = 4
// Playtest fix #2: Leader card ability retune 2× → 1.5×
export const LEADER_INCOME_MULT = 1.5
// CATCHUP_DEFICIT removed — replaced by once-per-round first-past-START hype event mechanic
