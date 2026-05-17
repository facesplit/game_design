import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BoardTile } from './BoardTile'
import { PlayerTokenLayer, boardPxSize } from './PlayerTokenLayer'
import { useGameStore } from '../../stores/gameStore'
import { getTilePosition, BOARD_COLS, BOARD_ROWS } from '../../data/board'

const GAP = 8

export function GameBoard() {
  const board = useGameStore((s) => s.board)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const currentPlayer = players[currentPlayerIndex]
  const activeHype = useGameStore((s) => s.activeHype)

  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(110)

  // Measure the container so the player-token layer can use exact pixel coords.
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const candidateW = (w - GAP * (BOARD_COLS - 1)) / BOARD_COLS
      const candidateH = (h - GAP * (BOARD_ROWS - 1)) / BOARD_ROWS
      setCellSize(Math.floor(Math.min(candidateW, candidateH)))
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const { width: boardW, height: boardH } = boardPxSize(cellSize, GAP)

  return (
    <div
      style={{
        perspective: '1400px',
        perspectiveOrigin: '50% 30%',
        width: 'min(92vmin, 920px)',
        maxWidth: '100%',
        aspectRatio: `${BOARD_COLS} / ${BOARD_ROWS}`,
      }}
      className="relative"
    >
      <motion.div
        initial={{ rotateX: 28, opacity: 0 }}
        animate={{ rotateX: 14, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 60%',
        }}
      >
        {/* Outer holographic frame */}
        <div
          className="absolute -inset-3 rounded-3xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.13) 50%, rgba(236,72,153,0.13) 100%)',
            boxShadow:
              '0 0 90px rgba(99,102,241,0.22), inset 0 0 90px rgba(168,85,247,0.10)',
            border: '1px solid rgba(255,255,255,0.10)',
            transform: 'translateZ(-12px)',
          }}
        />

        {/* Inner board surface */}
        <div
          className="absolute inset-0 rounded-2xl p-2"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(30,27,75,0.85) 0%, rgba(2,6,23,0.97) 80%)',
            border: '1px solid rgba(99,102,241,0.22)',
            boxShadow: '0 24px 48px -16px rgba(0,0,0,0.7)',
          }}
        >
          {/* Grid + tokens share a coordinate space */}
          <div
            ref={containerRef}
            className="relative w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            <div
              className="absolute"
              style={{
                width: boardW,
                height: boardH,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Tile grid */}
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${BOARD_COLS}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${BOARD_ROWS}, ${cellSize}px)`,
                  gap: `${GAP}px`,
                }}
              >
                {/* Centre emblem — explicit grid placement so it spans inner area */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    gridColumn: '2 / span 5',
                    gridRow: '2 / span 4',
                  }}
                >
                  <CenterEmblem activeHype={activeHype?.description} />
                </div>

                {/* Each tile is explicitly placed by (row, col); auto-flow is irrelevant */}
                {board.map((tile) => {
                  const pos = getTilePosition(tile.index)
                  return (
                    <motion.div
                      key={tile.index}
                      initial={{ opacity: 0, scale: 0.6, rotateY: 30 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: tile.index * 0.03, type: 'spring', damping: 18 }}
                      style={{
                        transformStyle: 'preserve-3d',
                        gridColumn: pos.col + 1,
                        gridRow: pos.row + 1,
                      }}
                    >
                      <BoardTile tile={tile} isActive={currentPlayer?.position === tile.index} />
                    </motion.div>
                  )
                })}
              </div>

              {/* Player tokens overlay */}
              <PlayerTokenLayer cellSize={cellSize} gap={GAP} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CenterEmblem({ activeHype }: { activeHype?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', damping: 18 }}
      className="text-center pointer-events-none select-none"
      style={{ transform: 'translateZ(20px)' }}
    >
      <motion.div
        animate={{
          textShadow: [
            '0 0 24px rgba(99,102,241,0.55)',
            '0 0 36px rgba(168,85,247,0.65)',
            '0 0 24px rgba(99,102,241,0.55)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          ANIME
        </h1>
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 -mt-2">
          ARCANA
        </h2>
        <h3 className="text-3xl font-bold text-purple-300/90 tracking-[0.3em] mt-1">
          EXCHANGE
        </h3>
      </motion.div>
      {activeHype && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-purple-200/85 mt-4 px-6 max-w-[300px] mx-auto leading-snug"
        >
          🔥 {activeHype}
        </motion.p>
      )}
    </motion.div>
  )
}
