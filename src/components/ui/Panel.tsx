import { cn } from '../../utils/cn'

interface PanelProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  style?: React.CSSProperties
}

export function Panel({ children, className, glow, style }: PanelProps) {
  return (
    <div
      className={cn(
        'bg-game-surface/80 border border-game-border rounded-xl backdrop-blur-sm',
        glow && 'shadow-[0_0_20px_rgba(99,102,241,0.1)]',
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
