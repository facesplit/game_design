import { motion, AnimatePresence } from 'framer-motion'
import { Hand, Eye, EyeOff } from 'lucide-react'
import { Button } from '../ui/Button'
import { PlayerPiece } from '../board/PlayerPiece'
import { useGameStore } from '../../stores/gameStore'

// Local pass-and-play handoff: blocks the screen between turns so the next
// player can sit down before their hand is revealed. Mirrors the "pass the
// device" pattern from Catan/Settlers companion apps.
export function HandoffOverlay() {
  const showHandoff = useGameStore((s) => s.showHandoff)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const beginNextTurnAfterHandoff = useGameStore((s) => s.beginNextTurnAfterHandoff)
  const player = players[currentPlayerIndex]

  return (
    <AnimatePresence>
      {showHandoff && player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.99) 70%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: player.color,
                  boxShadow: `0 0 8px ${player.color}`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, -40],
                  scale: [0.5, 1.4, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 30 }}
            transition={{ type: 'spring', damping: 18, stiffness: 240 }}
            className="relative text-center px-8 py-10 rounded-3xl"
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: `1px solid ${player.color}40`,
              boxShadow: `0 0 80px ${player.color}40, inset 0 0 60px ${player.color}15`,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center mb-4"
            >
              <PlayerPiece color={player.color} size="lg" spinning />
            </motion.div>

            <p className="text-slate-400 text-sm uppercase tracking-[0.3em] mb-2 flex items-center gap-2 justify-center">
              <EyeOff size={14} /> Pass the device
            </p>
            <h1
              className="text-4xl md:text-5xl font-black"
              style={{ color: player.color, textShadow: `0 0 24px ${player.color}90` }}
            >
              {player.name}
            </h1>
            <p className="text-slate-300 mt-2 mb-8 text-base">
              It's your turn — your hand is hidden until you're ready.
            </p>

            <Button variant="gold" size="lg" onClick={beginNextTurnAfterHandoff}>
              <span className="flex items-center gap-2">
                <Eye size={18} />
                Reveal My Turn
                <Hand size={18} />
              </span>
            </Button>

            <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
              Cards visible only to {player.name}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
