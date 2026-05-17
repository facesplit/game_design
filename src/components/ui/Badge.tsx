import { cn } from '../../utils/cn'
import type { Rarity } from '../../types/card'

const rarityStyles: Record<Rarity, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

interface BadgeProps {
  rarity: Rarity
  className?: string
}

export function Badge({ rarity, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border uppercase tracking-wider',
        rarityStyles[rarity],
        className
      )}
    >
      {rarity}
    </span>
  )
}
