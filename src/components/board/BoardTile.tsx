import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import type { Tile, TileType } from '../../types/board'
import { TileArt } from './TileArt'

const tileGlow: Record<TileType, string> = {
  'start': 'shadow-[0_0_24px_rgba(245,158,11,0.55)]',
  'buy-pack': 'shadow-[0_0_22px_rgba(59,130,246,0.5)]',
  'sell-cards': 'shadow-[0_0_22px_rgba(245,158,11,0.5)]',
  'tax': 'shadow-[0_0_22px_rgba(34,197,94,0.55)]',
  'raid-zone': 'shadow-[0_0_24px_rgba(239,68,68,0.6)]',
  'chance': 'shadow-[0_0_24px_rgba(168,85,247,0.55)]',
  'auction': 'shadow-[0_0_24px_rgba(236,72,153,0.55)]',
  'black-market': 'shadow-[0_0_22px_rgba(99,102,241,0.45)]',
  'insurance-office': 'shadow-[0_0_22px_rgba(6,182,212,0.55)]',
  'parking': 'shadow-[0_0_22px_rgba(168,85,247,0.45)]',
}

interface BoardTileProps {
  tile: Tile
  isActive: boolean
}

export function BoardTile({ tile, isActive }: BoardTileProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.04, zIndex: 5 }}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={isActive ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      className={cn(
        'relative w-full h-full rounded-xl overflow-hidden cursor-pointer',
        'ring-1 ring-white/10',
        tileGlow[tile.type],
        isActive && 'ring-2 ring-amber-300 z-10'
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <TileArt type={tile.type} label={tile.label} />

      {isActive && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute inset-0 ring-2 ring-amber-300 rounded-xl pointer-events-none"
          style={{ boxShadow: '0 0 28px rgba(252,211,77,0.7) inset' }}
        />
      )}
    </motion.div>
  )
}
