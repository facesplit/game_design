import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const variants = {
  primary: 'bg-game-accent hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  secondary: 'bg-game-panel hover:bg-game-border text-slate-200 border border-game-border',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  gold: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)]',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-colors cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </motion.button>
  )
}
