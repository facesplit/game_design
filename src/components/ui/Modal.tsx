import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  // Mandatory modals can't be dismissed: no X button, backdrop click is ignored.
  // Use for tiles whose effect must resolve (Tax, Raid, Lucky Draw, Auction, Black Market).
  mandatory?: boolean
}

export function Modal({ isOpen, onClose, title, children, className, mandatory }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={mandatory ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'bg-game-surface border border-game-border rounded-2xl',
              'shadow-[0_0_60px_rgba(99,102,241,0.15)]',
              'max-h-[85vh] overflow-y-auto',
              'min-w-[400px] max-w-[600px]',
              mandatory && 'ring-1 ring-amber-500/40',
              className
            )}
          >
            <div className="flex items-center justify-between p-5 border-b border-game-border">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {!mandatory && (
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              )}
              {mandatory && (
                <span className="text-[10px] uppercase tracking-widest text-amber-300/80">
                  Required
                </span>
              )}
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
