import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'

// Listens for income/loss events in the log and floats a brief overlay number
// near the active player. Pure visual feedback — no game-state effect.
interface Floater {
  id: number
  amount: number
  positive: boolean
  color: string
  x: number
  y: number
}

export function CoinFloater() {
  const eventLog = useGameStore((s) => s.eventLog)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [floaters, setFloaters] = useState<Floater[]>([])

  useEffect(() => {
    if (eventLog.length === 0) return
    const last = eventLog[eventLog.length - 1]

    let amount = 0
    let positive = false
    if (last.type === 'income') {
      const m = last.message.match(/Earned (\d+) coins|gained (\d+) coins|\+(\d+)/)
      if (m) {
        amount = parseInt(m[1] ?? m[2] ?? m[3] ?? '0', 10)
        positive = true
      }
    } else if (last.type === 'loss') {
      const m = last.message.match(/lost (\d+) coins|paid (\d+)/)
      if (m) {
        amount = parseInt(m[1] ?? m[2] ?? '0', 10)
        positive = false
      }
    }

    if (amount > 0) {
      const player = players[currentPlayerIndex]
      const id = Date.now() + Math.random()
      setFloaters((prev) => [
        ...prev,
        {
          id,
          amount,
          positive,
          color: player?.color ?? '#fff',
          x: 50 + (Math.random() - 0.5) * 8,
          y: 60,
        },
      ])
      setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 1500)
    }
  }, [eventLog, players, currentPlayerIndex])

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.1, y: -120 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute text-3xl font-black"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: 'translate(-50%, 0)',
              color: f.positive ? '#fcd34d' : '#fca5a5',
              textShadow: f.positive
                ? '0 0 12px rgba(252,211,77,0.85), 0 2px 0 #78350f'
                : '0 0 10px rgba(252,165,165,0.85), 0 2px 0 #7f1d1d',
            }}
          >
            {f.positive ? '+' : '−'}
            {f.amount} 💰
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
