import { TOTAL_TILES } from '../data/board'

export interface MoveResult {
  newPosition: number
  passedStart: boolean
}

export function calculateMovement(currentPosition: number, steps: number): MoveResult {
  const newPosition = (currentPosition + steps) % TOTAL_TILES
  const passedStart = currentPosition + steps >= TOTAL_TILES
  return { newPosition, passedStart }
}
