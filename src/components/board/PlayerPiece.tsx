import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface PlayerPieceProps {
  color: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  shape?: 'sphere' | 'crystal' | 'cube' | 'pyramid'
  spinning?: boolean
}

const sizeClasses: Record<NonNullable<PlayerPieceProps['size']>, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
}

// Each player gets a distinct shape derived from their color slot
function shapeFor(color: string): NonNullable<PlayerPieceProps['shape']> {
  const map: Record<string, NonNullable<PlayerPieceProps['shape']>> = {
    '#ef4444': 'sphere',
    '#3b82f6': 'crystal',
    '#22c55e': 'pyramid',
    '#f59e0b': 'cube',
  }
  return map[color] ?? 'sphere'
}

export function PlayerPiece({ color, name, size = 'md', shape, spinning }: PlayerPieceProps) {
  const finalShape = shape ?? shapeFor(color)
  return (
    <div
      className={cn('relative inline-block', sizeClasses[size])}
      style={{ perspective: '120px' }}
      title={name}
    >
      <motion.div
        animate={spinning ? { rotateY: 360 } : { rotateY: [0, 12, 0, -12, 0] }}
        transition={
          spinning
            ? { duration: 3, repeat: Infinity, ease: 'linear' }
            : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        }
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {finalShape === 'sphere' && <Sphere color={color} />}
        {finalShape === 'crystal' && <Crystal color={color} />}
        {finalShape === 'pyramid' && <Pyramid color={color} />}
        {finalShape === 'cube' && <Cube color={color} />}
      </motion.div>
    </div>
  )
}

function Sphere({ color }: { color: string }) {
  return (
    <div
      className="w-full h-full rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 25%, #fff 0%, ${color} 35%, ${color} 60%, #000 110%)`,
        boxShadow: `0 0 18px ${color}cc, inset -3px -4px 8px rgba(0,0,0,0.55), inset 3px 3px 5px ${color}99`,
      }}
    />
  )
}

function Crystal({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0, 100% 35%, 80% 100%, 20% 100%, 0 35%)',
          background: `linear-gradient(135deg, #fff 0%, ${color} 25%, ${color} 70%, #1e293b 100%)`,
          filter: `drop-shadow(0 0 14px ${color}cc)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0, 70% 35%, 50% 70%, 30% 35%)',
          background: `linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))`,
        }}
      />
    </div>
  )
}

function Pyramid({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          background: `linear-gradient(135deg, ${color}, #000 130%)`,
          filter: `drop-shadow(0 0 12px ${color}cc)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0, 100% 100%, 50% 100%)',
          background: `linear-gradient(135deg, rgba(0,0,0,0.35), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0, 53% 0, 56% 100%, 50% 100%)',
          background: `rgba(255,255,255,0.6)`,
        }}
      />
    </div>
  )
}

function Cube({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
      <div
        className="absolute inset-0 rounded-md"
        style={{
          background: `linear-gradient(135deg, ${color}, #1f2937 130%)`,
          boxShadow: `0 0 18px ${color}aa, inset -4px -6px 8px rgba(0,0,0,0.55), inset 3px 4px 5px ${color}cc`,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-1/3 rounded-t-md"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))`,
        }}
      />
    </div>
  )
}
