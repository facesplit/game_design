export type TileType =
  | 'start'
  | 'buy-pack'
  | 'sell-cards'
  | 'tax'
  | 'raid-zone'
  | 'chance'
  | 'auction'
  | 'black-market'
  | 'insurance-office'
  | 'parking'

export interface Tile {
  index: number
  type: TileType
  label: string
}

export interface BoardPosition {
  row: number
  col: number
  side: 'top' | 'right' | 'bottom' | 'left'
}
