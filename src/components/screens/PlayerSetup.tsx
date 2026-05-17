import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowLeft, Swords } from 'lucide-react'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { PlayerPiece } from '../board/PlayerPiece'
import { useGameStore } from '../../stores/gameStore'
import { PLAYER_COLORS } from '../../types/player'
import { cn } from '../../utils/cn'

export function PlayerSetup() {
  const [playerCount, setPlayerCount] = useState(2)
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const startGame = useGameStore((s) => s.startGame)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  const handleStart = () => {
    startGame(names.slice(0, playerCount))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full flex flex-col items-center justify-center gap-8 p-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 justify-center">
          <Users className="text-indigo-400" />
          Player Setup
        </h1>
        <p className="text-slate-400 mt-2">Choose number of players and set names</p>
      </div>

      {/* Player count selector */}
      <Panel className="p-6 w-full max-w-md" glow>
        <p className="text-sm text-slate-400 mb-3 text-center">Number of Players</p>
        <div className="flex gap-3 justify-center">
          {[2, 3, 4].map((count) => (
            <motion.button
              key={count}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPlayerCount(count)}
              className={cn(
                'w-16 h-16 rounded-xl text-2xl font-bold transition-all cursor-pointer',
                playerCount === count
                  ? 'bg-game-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                  : 'bg-game-panel text-slate-400 border border-game-border hover:border-game-accent'
              )}
            >
              {count}
            </motion.button>
          ))}
        </div>
      </Panel>

      {/* Player name inputs */}
      <Panel className="p-6 w-full max-w-md space-y-4" glow>
        {Array.from({ length: playerCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <PlayerPiece color={PLAYER_COLORS[i]} size="md" />
            <input
              type="text"
              value={names[i]}
              onChange={(e) => {
                const newNames = [...names]
                newNames[i] = e.target.value
                setNames(newNames)
              }}
              className="flex-1 bg-game-bg border border-game-border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-game-accent transition-colors"
              placeholder={`Player ${i + 1}`}
            />
          </motion.div>
        ))}
      </Panel>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button variant="ghost" onClick={returnToMenu}>
          <ArrowLeft size={18} className="mr-2 inline" />
          Back
        </Button>
        <Button variant="gold" size="lg" onClick={handleStart}>
          <Swords size={20} className="mr-2 inline" />
          Start Game!
        </Button>
      </div>
    </motion.div>
  )
}
