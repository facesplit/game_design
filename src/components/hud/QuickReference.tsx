import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'

// Playtest fix #4: in-game quick-reference card. Cuts onboarding from ~5min to <1min.
// Tile effects + rarity table accessible from the corner of the screen.
const TILE_REF: { type: string; emoji: string; name: string; effect: string }[] = [
  { type: 'start', emoji: '🏁', name: 'Start', effect: 'Collect income from cards + draw a Hype Event.' },
  { type: 'buy-pack', emoji: '🎴', name: 'Buy Pack', effect: 'Buy 1 card from the deck for 3💰.' },
  { type: 'sell-cards', emoji: '💰', name: 'Sell Cards', effect: 'Sell up to 2 cards at fixed prices.' },
  { type: 'tax', emoji: '📋', name: 'Tax', effect: 'Pay 5💰 OR discard 1 card.' },
  { type: 'raid-zone', emoji: '⚔️', name: 'Raid Zone', effect: '1-3: lose 3💰 · 4-5: lose 1 card · 6: safe.' },
  { type: 'chance', emoji: '❓', name: 'Lucky Draw', effect: 'Draw a Chance card. May gain/lose coins or trade a Common/Rare.' },
  { type: 'auction', emoji: '🔨', name: 'Auction', effect: 'Sealed bids — highest wins, pays their bid.' },
  { type: 'black-market', emoji: '🕶️', name: 'Black Market', effect: 'Take 4💰 OR draw a card then discard 1.' },
  { type: 'insurance-office', emoji: '🛡️', name: 'Insurance', effect: 'Pay 3💰 — blocks one Raid loss (one-shot).' },
]

const RARITY_REF: { name: string; income: string; sell: string; color: string }[] = [
  { name: 'Common', income: '+1', sell: '2💰', color: '#9ca3af' },
  { name: 'Rare', income: '+2', sell: '3💰', color: '#3b82f6' },
  { name: 'Epic', income: '+4', sell: '6💰', color: '#a855f7' },
  { name: 'Legendary', income: '+6', sell: '10💰', color: '#f59e0b' },
]

export function QuickReference() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(168,85,247,0.9))',
          boxShadow: '0 0 24px rgba(99,102,241,0.55)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
        aria-label="Quick rules reference"
      >
        <HelpCircle size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              className="fixed top-4 right-4 bottom-4 z-50 w-[380px] max-w-[95vw] overflow-y-auto rounded-2xl"
              style={{
                background:
                  'linear-gradient(180deg, rgba(15,23,42,0.97), rgba(2,6,23,0.97))',
                border: '1px solid rgba(99,102,241,0.4)',
                boxShadow: '0 0 60px rgba(99,102,241,0.25)',
              }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/8 bg-game-surface/90 backdrop-blur">
                <h3 className="text-lg font-bold text-white">Quick Reference</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close reference"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <section>
                  <h4 className="text-xs uppercase tracking-widest text-purple-300 mb-3">
                    Tile Effects
                  </h4>
                  <div className="space-y-2">
                    {TILE_REF.map((t) => (
                      <div
                        key={t.type}
                        className="flex gap-3 p-2 rounded-lg bg-white/3 border border-white/5"
                      >
                        <span className="text-xl">{t.emoji}</span>
                        <div>
                          <p className="text-sm text-white font-semibold">{t.name}</p>
                          <p className="text-xs text-slate-400 leading-snug">{t.effect}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-widest text-purple-300 mb-3">
                    Card Rarity
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="text-slate-400">Rarity</div>
                    <div className="text-slate-400">Income</div>
                    <div className="text-slate-400">Sell</div>
                    {RARITY_REF.map((r) => (
                      <div key={r.name} className="contents">
                        <div className="font-bold py-1.5 rounded" style={{ color: r.color, background: `${r.color}15` }}>
                          {r.name}
                        </div>
                        <div className="text-green-400 font-bold py-1.5">{r.income}</div>
                        <div className="text-amber-300 font-bold py-1.5">{r.sell}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="text-xs text-slate-300/90 leading-relaxed">
                  <h4 className="text-xs uppercase tracking-widest text-purple-300 mb-2">
                    Win Condition
                  </h4>
                  <p>
                    Game ends after the first player passes <b>START 4 times</b>. Remaining players
                    finish the round. Highest <i>coins + card sell value</i> wins.
                  </p>
                </section>

                <section className="text-xs text-slate-300/90 leading-relaxed space-y-1">
                  <h4 className="text-xs uppercase tracking-widest text-purple-300 mb-2">
                    Card Abilities
                  </h4>
                  <p>
                    <span className="text-amber-300 font-bold">★ Leader</span> — income ×1.5
                    (rounded). Boosts sell value by the same bonus.
                  </p>
                  <p>
                    <span className="text-cyan-300 font-bold">◆ Stability</span> — +1 income while a
                    Hype Event is active.
                  </p>
                </section>

                <section className="text-xs text-slate-300/90 leading-relaxed">
                  <h4 className="text-xs uppercase tracking-widest text-purple-300 mb-2">
                    Catch-Up
                  </h4>
                  <p>
                    A player who is 15+ coins behind picks 1 of 2 Hype Events on their START pass.
                    Legendary cards are gated until at least one player has passed START.
                  </p>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
