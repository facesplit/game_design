import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

// First player to pass START each round picks 1 of 2 hype events for that round.
export function HypeChoiceModal() {
  const choices = useGameStore((s) => s.pendingHypeChoices)
  const pickHypeChoice = useGameStore((s) => s.pickHypeChoice)
  const isOpen = choices.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[61] flex items-center justify-center px-6"
          >
            <div
              className="rounded-3xl p-8 max-w-3xl w-full"
              style={{
                background:
                  'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.18))',
                border: '1px solid rgba(168,85,247,0.45)',
                boxShadow: '0 0 80px rgba(168,85,247,0.35)',
              }}
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: [-8, 8, -8] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="inline-block"
                >
                  <Flame className="w-12 h-12 text-amber-400 mx-auto" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mt-2">🔥 Set the Hype!</h2>
                <p className="text-slate-300 text-sm mt-1">
                  You're the first past START this round — pick the next Hype Event.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {choices.map((event, i) => (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => pickHypeChoice(event)}
                    className="relative rounded-2xl overflow-hidden text-left p-5 cursor-pointer"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,27,75,0.85))',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {event.artwork && (
                      <img
                        src={event.artwork}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-25"
                        draggable={false}
                      />
                    )}
                    <div className="relative">
                      <p className="text-xs uppercase text-purple-300 tracking-widest mb-2">
                        Option {i + 1}
                      </p>
                      <p className="text-white font-medium leading-relaxed">{event.description}</p>
                      <div className="mt-4 flex gap-3 text-xs">
                        <span className="text-green-400">📈 {event.buffCollection}</span>
                        <span className="text-red-400">📉 {event.nerfCollection}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
