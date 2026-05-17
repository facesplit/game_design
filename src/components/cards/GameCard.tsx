import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { Badge } from '../ui/Badge'
import type { Card } from '../../types/card'
import { COLLECTION_CONFIG } from '../../types/card'

interface GameCardProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

const rarityBorder: Record<string, string> = {
  common: 'border-gray-400/40',
  rare: 'border-blue-400/50',
  epic: 'border-purple-400/60',
  legendary: 'border-amber-400/70',
}

const rarityGradient: Record<string, string> = {
  common: 'from-gray-800 to-gray-900',
  rare: 'from-blue-900 to-slate-900',
  epic: 'from-purple-900 to-slate-900',
  legendary: 'from-amber-900/50 via-yellow-900/30 to-slate-900',
}

const sizeClasses = {
  sm: 'w-24 h-36',
  md: 'w-32 h-48',
  lg: 'w-40 h-60',
}

export function GameCard({ card, onClick, selected, size = 'md', showDetails = true }: GameCardProps) {
  const collection = COLLECTION_CONFIG[card.collection]

  // Cards with artwork: render the full image (it already contains frame, name, stats)
  if (card.artwork) {
    return (
      <motion.div
        whileHover={{ y: -8, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          'relative rounded-xl overflow-hidden cursor-pointer',
          selected && 'ring-2 ring-white ring-offset-2 ring-offset-game-bg',
          sizeClasses[size]
        )}
      >
        <img
          src={card.artwork}
          alt={card.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>
    )
  }

  // Placeholder cards: gradient background with text
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 cursor-pointer card-shine overflow-hidden',
        `bg-gradient-to-b ${rarityGradient[card.rarity]}`,
        rarityBorder[card.rarity],
        `glow-${card.rarity}`,
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-game-bg',
        sizeClasses[size]
      )}
    >
      {/* Collection color gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${collection.color}40 0%, transparent 60%)`,
        }}
      />

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between p-2">
        {/* Top: income badge */}
        <div className="flex justify-between items-start">
          <span className="bg-black/50 text-green-400 text-xs font-bold px-1.5 py-0.5 rounded">
            +{card.income}
          </span>
          {card.ability && (
            <span className="bg-black/50 text-amber-300 text-[10px] px-1 py-0.5 rounded uppercase">
              {card.ability === 'leader' ? '★' : '◆'}
            </span>
          )}
        </div>

        {/* Center: character name */}
        <div className="flex-1 flex items-center justify-center px-1">
          <span
            className="text-sm font-bold text-center leading-tight opacity-80"
            style={{ color: collection.color }}
          >
            {card.name}
          </span>
        </div>

        {/* Bottom: rarity and sell price */}
        {showDetails && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge rarity={card.rarity} className="text-[9px] px-1" />
              <span className="text-yellow-400 text-[10px] font-bold">
                💰{card.sellPrice}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
