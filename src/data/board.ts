import type { Tile, TileType, BoardPosition } from '../types/board'

interface TileDef {
  type: TileType
  label: string
}

const TILE_SEQUENCE: TileDef[] = [
  { type: 'start', label: 'START' },
  { type: 'buy-pack', label: 'Buy Pack' },
  { type: 'tax', label: 'Tax' },
  { type: 'sell-cards', label: 'Sell Cards' },
  { type: 'raid-zone', label: 'Raid Zone' },
  { type: 'buy-pack', label: 'Buy Pack' },
  { type: 'chance', label: 'Lucky Draw' },
  { type: 'sell-cards', label: 'Sell Cards' },
  { type: 'auction', label: 'Auction' },
  { type: 'buy-pack', label: 'Buy Pack' },
  // Playtest fix #6: PARKING → free Chance draw (was a dead tile)
  { type: 'chance', label: 'Lucky Draw' },
  { type: 'buy-pack', label: 'Buy Pack' },
  { type: 'tax', label: 'Tax' },
  { type: 'sell-cards', label: 'Sell Cards' },
  { type: 'raid-zone', label: 'Raid Zone' },
  { type: 'chance', label: 'Lucky Draw' },
  { type: 'insurance-office', label: 'Insurance' },
  { type: 'buy-pack', label: 'Buy Pack' },
  { type: 'black-market', label: 'Black Market' },
  { type: 'sell-cards', label: 'Sell Cards' },
  { type: 'chance', label: 'Lucky Draw' },
  { type: 'buy-pack', label: 'Buy Pack' },
]

export const BOARD_TILES: Tile[] = TILE_SEQUENCE.map((def, index) => ({
  index,
  type: def.type,
  label: def.label,
}))

export const TOTAL_TILES = BOARD_TILES.length // 22

// Board layout: 7×6 rectangular circuit, all four corners filled.
// Top:    tiles 0-6  (row 0, left → right)
// Right:  tiles 7-10 (col 6, row 1 → 4)
// Bottom: tiles 11-17 (row 5, right → left)
// Left:   tiles 18-21 (col 0, row 4 → 1)
//
// Center area for the logo: rows 1-4 × cols 1-5 (5×4 = 20 free cells).
export const BOARD_COLS = 7
export const BOARD_ROWS = 6

export function getTilePosition(index: number): BoardPosition {
  if (index <= 6) {
    return { row: 0, col: index, side: 'top' }
  } else if (index <= 10) {
    return { row: index - 6, col: 6, side: 'right' }
  } else if (index <= 17) {
    return { row: 5, col: 17 - index, side: 'bottom' }
  } else {
    return { row: 5 - (index - 17), col: 0, side: 'left' }
  }
}

export const TILE_ICONS: Record<TileType, string> = {
  'start': '🏁',
  'buy-pack': '🎴',
  'sell-cards': '💰',
  'tax': '📋',
  'raid-zone': '⚔️',
  'chance': '❓',
  'auction': '🔨',
  'black-market': '🕶️',
  'insurance-office': '🛡️',
  'parking': '⏸️',
}
