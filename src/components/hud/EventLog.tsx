import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Panel } from '../ui/Panel'
import { useGameStore } from '../../stores/gameStore'
import { cn } from '../../utils/cn'
import type { LogEntry } from '../../types/game'

const logTypeColors: Record<LogEntry['type'], string> = {
  move: 'text-blue-400',
  buy: 'text-green-400',
  sell: 'text-yellow-400',
  event: 'text-purple-400',
  income: 'text-emerald-400',
  loss: 'text-red-400',
  system: 'text-indigo-300',
}

export function EventLog() {
  const eventLog = useGameStore((s) => s.eventLog)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [eventLog.length])

  const recentLogs = eventLog.slice(-30)

  return (
    <Panel className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-game-border">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Log</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: '200px' }}>
        <AnimatePresence initial={false}>
          {recentLogs.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn('text-[11px] leading-tight', logTypeColors[entry.type])}
            >
              {entry.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  )
}
