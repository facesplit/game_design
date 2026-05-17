import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Lock } from 'lucide-react'
import { Button } from '../ui/Button'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { useLobbyStore } from '../../online/lobbyStore'

// 3D-styled CSS dice. Each face has a number 1-6.
// Rotations target each face on a unit cube; transitions use spring for a satisfying tumble.
const FACE_ROTATIONS: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: 0, ry: -90 },
  3: { rx: 90, ry: 0 },
  4: { rx: -90, ry: 0 },
  5: { rx: 0, ry: 90 },
  6: { rx: 180, ry: 0 },
}

export function DiceRoller() {
  const turnPhase = useGameStore((s) => s.turnPhase)
  const lastDiceRoll = useGameStore((s) => s.lastDiceRoll)
  const rollAndMove = useGameStore((s) => s.rollAndMove)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const isDiceRolling = useUIStore((s) => s.isDiceRolling)
  const setDiceRolling = useUIStore((s) => s.setDiceRolling)
  const lobbyMode = useLobbyStore((s) => s.mode)
  const selfName = useLobbyStore((s) => s.selfName)
  const [animatingValue, setAnimatingValue] = useState(1)
  const [tumble, setTumble] = useState(0)

  const isOnline = lobbyMode !== 'local'
  const isMyTurn = !isOnline || players[currentPlayerIndex]?.name === selfName

  const handleRoll = () => {
    if (!isMyTurn) return
    setDiceRolling(true)
    setTumble((t) => t + 1)
    let count = 0
    const interval = setInterval(() => {
      setAnimatingValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 10) {
        clearInterval(interval)
        rollAndMove()
        setDiceRolling(false)
      }
    }, 80)
  }

  const displayValue = isDiceRolling ? animatingValue : lastDiceRoll || 1
  const rot = FACE_ROTATIONS[displayValue]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ perspective: '600px' }}>
        <motion.div
          className="relative w-20 h-20"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateX: rot.rx + tumble * 720,
            rotateY: rot.ry + tumble * 540,
          }}
          transition={{ type: 'spring', damping: 14, stiffness: 100 }}
        >
          <DiceFace pips={1} transform="translateZ(40px)" />
          <DiceFace pips={6} transform="rotateX(180deg) translateZ(40px)" />
          <DiceFace pips={3} transform="rotateX(-90deg) translateZ(40px)" />
          <DiceFace pips={4} transform="rotateX(90deg) translateZ(40px)" />
          <DiceFace pips={2} transform="rotateY(90deg) translateZ(40px)" />
          <DiceFace pips={5} transform="rotateY(-90deg) translateZ(40px)" />
        </motion.div>

        <AnimatePresence>
          {isDiceRolling && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow:
                  '0 0 36px rgba(245,158,11,0.7), 0 0 80px rgba(168,85,247,0.4)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {turnPhase === 'roll' && (
        <Button
          variant="gold"
          size="lg"
          onClick={handleRoll}
          disabled={isDiceRolling || !isMyTurn}
          className="flex items-center gap-2"
        >
          {!isMyTurn ? <Lock size={16} /> : <Dices size={18} />}
          {!isMyTurn
            ? `${players[currentPlayerIndex]?.name ?? 'Opponent'}'s Turn`
            : 'Roll Dice'}
        </Button>
      )}

      {lastDiceRoll && !isDiceRolling && turnPhase !== 'roll' && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-slate-400"
        >
          Rolled: <span className="text-white font-bold">{lastDiceRoll}</span>
        </motion.p>
      )}
    </div>
  )
}

function DiceFace({ pips, transform }: { pips: number; transform: string }) {
  const positions = pipPositions(pips)
  return (
    <div
      className="absolute inset-0 rounded-xl border border-amber-300/30 flex items-center justify-center"
      style={{
        transform,
        background:
          'linear-gradient(135deg, #fffbeb 0%, #fde68a 30%, #f59e0b 90%, #b45309 130%)',
        boxShadow:
          'inset 0 0 12px rgba(180,83,9,0.4), 0 0 18px rgba(245,158,11,0.4)',
      }}
    >
      <div className="relative w-3/4 h-3/4 grid grid-cols-3 grid-rows-3">
        {positions.map((pos) => (
          <div
            key={pos}
            className="rounded-full"
            style={{
              gridColumn: (pos % 3) + 1,
              gridRow: Math.floor(pos / 3) + 1,
              background: 'radial-gradient(circle, #1f2937 0%, #0f172a 90%)',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4)',
              alignSelf: 'center',
              justifySelf: 'center',
              width: '60%',
              height: '60%',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// 3x3 grid: positions are 0-8 (TL, TC, TR, ML, MC, MR, BL, BC, BR)
function pipPositions(pips: number): number[] {
  switch (pips) {
    case 1:
      return [4]
    case 2:
      return [0, 8]
    case 3:
      return [0, 4, 8]
    case 4:
      return [0, 2, 6, 8]
    case 5:
      return [0, 2, 4, 6, 8]
    case 6:
      return [0, 2, 3, 5, 6, 8]
    default:
      return []
  }
}
