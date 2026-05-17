import { motion } from 'framer-motion'
import { Coins, CreditCard, Shield, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Panel } from '../ui/Panel'
import { PlayerPiece } from '../board/PlayerPiece'
import type { Player } from '../../types/player'
import type { HypeEvent } from '../../types/game'
import type { Collection } from '../../types/card'
import { BOARD_TILES } from '../../data/board'
import { START_PASSES_TO_END } from '../../types/player'
import { COLLECTION_CONFIG } from '../../types/card'

interface PlayerHUDProps {
  player: Player
  isActive: boolean
  compact?: boolean
  isLeader?: boolean
  activeHype?: HypeEvent | null
}

export function PlayerHUD({ player, isActive, compact, isLeader, activeHype }: PlayerHUDProps) {
  const currentTile = BOARD_TILES[player.position]

  // Per-collection summary
  const collectionMap = new Map<Collection, { count: number; hasLegendary: boolean; hasEpic: boolean }>()
  for (const card of player.hand) {
    const entry = collectionMap.get(card.collection) ?? { count: 0, hasLegendary: false, hasEpic: false }
    entry.count += 1
    if (card.rarity === 'legendary') entry.hasLegendary = true
    if (card.rarity === 'epic') entry.hasEpic = true
    collectionMap.set(card.collection, entry)
  }

  const collectionEntries = Array.from(collectionMap.entries())

  return (
    <motion.div layout>
      <Panel
        className={cn(
          'p-3 transition-all',
          isActive && 'ring-2 shadow-lg',
          compact && 'p-2'
        )}
        style={{
          '--tw-ring-color': isActive ? player.color : 'transparent',
          boxShadow: isActive ? `0 0 20px ${player.color}30` : undefined,
        } as React.CSSProperties}
        glow={isActive}
      >
        <div className="flex items-center gap-2 mb-2">
          <PlayerPiece color={player.color} size="sm" spinning={isActive} />
          <span className={cn('font-bold text-sm', isActive ? 'text-white' : 'text-slate-300')}>
            {player.name}
          </span>
          {isLeader && (
            <span title="Score leader" className="text-sm leading-none">👑</span>
          )}
          {isActive && !isLeader && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] bg-game-accent/30 text-indigo-300 px-1.5 py-0.5 rounded-full ml-auto"
            >
              TURN
            </motion.span>
          )}
          {isActive && isLeader && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] bg-game-accent/30 text-indigo-300 px-1.5 py-0.5 rounded-full ml-auto"
            >
              TURN
            </motion.span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-yellow-400">
            <Coins size={12} />
            <span className="font-bold">{player.coins}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <CreditCard size={12} />
            <span>{player.hand.length}/8</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={12} />
            <span className="truncate">{currentTile?.label}</span>
          </div>
          {player.hasInsurance && (
            <div className="flex items-center gap-1 text-cyan-400">
              <Shield size={12} />
              <span>Insured</span>
            </div>
          )}
        </div>

        {/* Collection indicator */}
        {collectionEntries.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-slate-700/50 pt-1.5">
            {collectionEntries.map(([collection, info]) => {
              const config = COLLECTION_CONFIG[collection]
              const hasLeaderDesignated = !!player.collectionLeaders[collection]
              const hasStability = info.hasLegendary && info.hasEpic

              let hypeImpact = 0
              if (activeHype) {
                if (collection === activeHype.buffCollection) {
                  hypeImpact = info.count
                } else if (collection === activeHype.nerfCollection) {
                  hypeImpact = hasStability ? 0 : -info.count
                }
              }

              return (
                <div key={collection} className="flex items-center gap-1 text-[10px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: config?.color ?? '#888' }}
                  />
                  <span className="text-slate-400 truncate flex-1 min-w-0">
                    {config?.label ?? collection}
                  </span>
                  <span className="text-slate-500 flex-shrink-0">×{info.count}</span>
                  {hasLeaderDesignated && (
                    <span className="flex-shrink-0" title="Collection Leader (income ×2)">👑</span>
                  )}
                  {hasStability && (
                    <span className="flex-shrink-0" title="Collection Stability (nerf immune)">🛡️</span>
                  )}
                  {hypeImpact !== 0 && (
                    <span className={cn('flex-shrink-0 font-bold', hypeImpact > 0 ? 'text-green-400' : 'text-red-400')}>
                      {hypeImpact > 0 ? `+${hypeImpact}` : hypeImpact}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* START passes progress bar */}
        <div className="mt-2 flex gap-0.5">
          {Array.from({ length: START_PASSES_TO_END }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                i < player.startPasses
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                  : 'bg-slate-700/60'
              )}
            />
          ))}
        </div>
      </Panel>
    </motion.div>
  )
}
