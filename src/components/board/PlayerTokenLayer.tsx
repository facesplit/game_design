import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import { getTilePosition, BOARD_COLS, BOARD_ROWS, TOTAL_TILES } from '../../data/board'
import { PlayerPiece } from './PlayerPiece'
import type { Player } from '../../types/player'

// Pixel-space layer rendered above the grid. Each token animates tile-by-tile
// when its owner's `position` changes; if cellSize changes (resize) we snap to
// the new position without animation.
interface Props {
  cellSize: number // px width of each grid cell
  gap: number // px gap between cells
}

export function PlayerTokenLayer({ cellSize, gap }: Props) {
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {players.map((player, i) => (
        <Token
          key={player.id}
          player={player}
          isActive={i === currentPlayerIndex}
          cellSize={cellSize}
          gap={gap}
          stackOffsetIndex={i}
        />
      ))}
    </div>
  )
}

function Token({
  player,
  isActive,
  cellSize,
  gap,
  stackOffsetIndex,
}: {
  player: Player
  isActive: boolean
  cellSize: number
  gap: number
  stackOffsetIndex: number
}) {
  const controls = useAnimationControls()
  const lastPositionRef = useRef(player.position)
  const lastCellSizeRef = useRef(cellSize)

  // Trigger movement animation when position changes; snap on resize.
  useEffect(() => {
    const target = positionToPx(player.position, cellSize, gap, stackOffsetIndex)

    // Resize-only update: snap, no animation.
    if (
      player.position === lastPositionRef.current &&
      cellSize !== lastCellSizeRef.current
    ) {
      controls.set({ x: target.x, y: target.y })
      lastCellSizeRef.current = cellSize
      return
    }

    // Position-only change: animate tile-by-tile through the path.
    if (player.position !== lastPositionRef.current) {
      const steps: number[] = []
      let cur = lastPositionRef.current
      while (cur !== player.position) {
        cur = (cur + 1) % TOTAL_TILES
        steps.push(cur)
      }
      const waypoints = steps.map((idx) => positionToPx(idx, cellSize, gap, stackOffsetIndex))
      const xs = waypoints.map((w) => w.x)
      const ys = waypoints.map((w) => w.y)
      const stepDuration = 0.18
      const totalDuration = stepDuration * steps.length

      controls
        .start({
          x: xs,
          y: ys,
          transition: {
            duration: totalDuration,
            times: steps.map((_, i) => (i + 1) / steps.length),
            ease: 'easeInOut',
          },
        })
        .then(() => {
          lastPositionRef.current = player.position
          lastCellSizeRef.current = cellSize
        })
      return
    }

    // No-op (initial mount or both unchanged after first run).
    controls.set({ x: target.x, y: target.y })
    lastCellSizeRef.current = cellSize
  }, [player.position, cellSize, gap, stackOffsetIndex, controls])

  const tokenSize = cellSize * 0.42

  return (
    <motion.div
      animate={controls}
      initial={positionToPx(player.position, cellSize, gap, stackOffsetIndex)}
      className="absolute top-0 left-0"
      style={{
        width: tokenSize,
        height: tokenSize,
        zIndex: isActive ? 30 : 20 + stackOffsetIndex,
        transformStyle: 'preserve-3d',
        filter: isActive
          ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.55))',
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <PlayerPiece color={player.color} size="md" spinning={isActive} />
      </div>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
        style={{
          bottom: -16,
          background: `linear-gradient(135deg, ${player.color}cc, ${player.color}88)`,
          color: '#fff',
          boxShadow: `0 0 10px ${player.color}aa`,
          border: '1px solid rgba(255,255,255,0.2)',
          opacity: isActive ? 1 : 0.7,
        }}
        animate={isActive ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {player.name}
      </motion.div>
    </motion.div>
  )
}

function positionToPx(tileIndex: number, cellSize: number, gap: number, stackOffsetIndex: number) {
  const pos = getTilePosition(tileIndex)
  const cellW = cellSize + gap
  const tokenSize = cellSize * 0.42
  const cx = pos.col * cellW + cellSize / 2 - tokenSize / 2
  const cy = pos.row * cellW + cellSize / 2 - tokenSize / 2

  // 2×2 fan-out so 4 stacked tokens never overlap
  const corner = stackOffsetIndex % 4
  const offsets = [
    { dx: -cellSize * 0.2, dy: -cellSize * 0.16 },
    { dx: cellSize * 0.2, dy: -cellSize * 0.16 },
    { dx: -cellSize * 0.2, dy: cellSize * 0.18 },
    { dx: cellSize * 0.2, dy: cellSize * 0.18 },
  ][corner]

  return { x: cx + offsets.dx, y: cy + offsets.dy }
}

export function boardPxSize(cellSize: number, gap: number) {
  return {
    width: BOARD_COLS * (cellSize + gap) - gap,
    height: BOARD_ROWS * (cellSize + gap) - gap,
  }
}
