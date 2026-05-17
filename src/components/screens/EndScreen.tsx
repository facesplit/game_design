import { motion } from 'framer-motion'
import { Trophy, Home } from 'lucide-react'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { PlayerPiece } from '../board/PlayerPiece'
import { useGameStore } from '../../stores/gameStore'
import { calculateAllScores } from '../../engine/scoring'
import { cn } from '../../utils/cn'

export function EndScreen() {
  const players = useGameStore((s) => s.players)
  const winner = useGameStore((s) => s.winner)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  const scores = calculateAllScores(players)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center gap-8 p-8 bg-anime-gradient"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
        </motion.div>
        {winner && (
          <div className="flex justify-center mb-4">
            <PlayerPiece color={winner.color} size="lg" spinning />
          </div>
        )}
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300">
          {winner?.name} Wins!
        </h1>
      </motion.div>

      {/* Scoreboard */}
      <Panel className="p-6 w-full max-w-lg" glow>
        <h2 className="text-lg font-bold text-white mb-4 text-center">Final Scores</h2>
        <div className="space-y-3">
          {scores.map((score, i) => {
            const player = players.find((p) => p.id === score.playerId)!
            return (
              <motion.div
                key={score.playerId}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  i === 0
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-game-bg/50'
                )}
              >
                <span className={cn(
                  'text-2xl font-black w-8',
                  i === 0 ? 'text-amber-400' : 'text-slate-500'
                )}>
                  #{i + 1}
                </span>
                <PlayerPiece color={player.color} size="sm" spinning={i === 0} />
                <span className="font-bold text-white flex-1">{score.playerName}</span>
                <div className="text-right text-sm">
                  <div className="text-yellow-400">💰 {score.coins}</div>
                  <div className="text-blue-400">🃏 {score.cardValue}</div>
                  <div className="text-white font-bold border-t border-game-border mt-1 pt-1">
                    = {score.totalScore}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Panel>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="gold" size="lg" onClick={returnToMenu}>
          <Home size={20} className="mr-2 inline" />
          Main Menu
        </Button>
      </div>
    </motion.div>
  )
}
