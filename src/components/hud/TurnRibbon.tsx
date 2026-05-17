import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { PlayerPiece } from '../board/PlayerPiece'

// Top-of-screen ribbon: shows ALL players in turn order, current highlighted.
// Reinforces the local-multiplayer presence so the player knows who's next.
export function TurnRibbon() {
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)

  if (players.length === 0) return null

  return (
    <div
      className="flex items-center justify-center gap-1 mx-auto px-3 py-1.5 rounded-full"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.85), rgba(2,6,23,0.85))',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 24px rgba(99,102,241,0.2)',
      }}
    >
      {players.map((player, i) => (
        <div key={player.id} className="flex items-center gap-1">
          <motion.div
            animate={
              i === currentPlayerIndex
                ? { scale: [1, 1.06, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-1.5 pr-2 pl-1 py-0.5 rounded-full"
            style={{
              background: i === currentPlayerIndex
                ? `linear-gradient(135deg, ${player.color}55, ${player.color}22)`
                : 'transparent',
              border: i === currentPlayerIndex
                ? `1px solid ${player.color}88`
                : '1px solid transparent',
              boxShadow: i === currentPlayerIndex ? `0 0 14px ${player.color}77` : 'none',
            }}
          >
            <div className="w-5 h-5">
              <PlayerPiece color={player.color} size="xs" spinning={i === currentPlayerIndex} />
            </div>
            <span
              className={`text-xs font-bold ${i === currentPlayerIndex ? 'text-white' : 'text-slate-400'}`}
            >
              {player.name}
            </span>
            <span className="text-[10px] text-amber-300 font-bold">
              {player.coins}💰
            </span>
          </motion.div>
          {i < players.length - 1 && (
            <ChevronRight size={12} className="text-slate-600" />
          )}
        </div>
      ))}
    </div>
  )
}
