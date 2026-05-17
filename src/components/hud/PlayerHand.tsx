import { motion } from 'framer-motion'
import { Panel } from '../ui/Panel'
import { GameCard } from '../cards/GameCard'
import type { Player } from '../../types/player'

interface PlayerHandProps {
  player: Player
}

export function PlayerHand({ player }: PlayerHandProps) {
  if (player.hand.length === 0) {
    return (
      <Panel className="p-4 text-center">
        <p className="text-slate-500 text-sm">No cards in hand</p>
      </Panel>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {player.hand.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <GameCard card={card} size="sm" />
        </motion.div>
      ))}
    </div>
  )
}
