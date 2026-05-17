import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { COLLECTION_CONFIG } from '../../types/card'
import type { Rarity } from '../../types/card'
import { GameCard } from '../cards/GameCard'

// Multi-stage pack opening:
//   fly-in → shake → burst → flip → reveal
// Rarity drives the intensity of the reveal — legendary triggers screen shake
// and a heavier particle field; common is a quiet flip.

type Phase = 'fly-in' | 'shake' | 'burst' | 'flip' | 'reveal'

const RARITY_GLOW: Record<Rarity, string> = {
  common: 'rgba(156, 163, 175, 0.55)',
  rare: 'rgba(59, 130, 246, 0.7)',
  epic: 'rgba(168, 85, 247, 0.8)',
  legendary: 'rgba(245, 158, 11, 0.95)',
}

const RARITY_PARTICLES: Record<Rarity, number> = {
  common: 14,
  rare: 22,
  epic: 32,
  legendary: 50,
}

const RARITY_LABEL_COLOR: Record<Rarity, string> = {
  common: '#cbd5e1',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
}

export function PackOpeningOverlay() {
  const card = useUIStore((s) => s.packOpeningCard)
  const closePackOpening = useUIStore((s) => s.closePackOpening)
  const [phase, setPhase] = useState<Phase>('fly-in')

  useEffect(() => {
    if (!card) {
      setPhase('fly-in')
      return
    }
    setPhase('fly-in')
    const t1 = setTimeout(() => setPhase('shake'), 600)
    const t2 = setTimeout(() => setPhase('burst'), 1200)
    const t3 = setTimeout(() => setPhase('flip'), 1450)
    const t4 = setTimeout(() => setPhase('reveal'), 2050)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [card])

  if (!card) return null
  const collection = COLLECTION_CONFIG[card.collection]
  const glow = RARITY_GLOW[card.rarity]
  const particleCount = RARITY_PARTICLES[card.rarity]
  const isHighRarity = card.rarity === 'epic' || card.rarity === 'legendary'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          // Screen shake on legendary reveal
          x: card.rarity === 'legendary' && phase === 'burst' ? [0, -8, 8, -6, 6, -4, 4, 0] : 0,
        }}
        exit={{ opacity: 0 }}
        transition={{ x: { duration: 0.6 } }}
        className="fixed inset-0 z-[55] flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.85) 0%, rgba(0,0,0,0.95) 80%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Background spotlight that grows during reveal */}
        {phase !== 'fly-in' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: phase === 'reveal' ? 2.5 : 1.2 }}
            transition={{ duration: 1.2 }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 600,
              height: 600,
              background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Anime speed lines (high rarity) */}
        {isHighRarity && phase !== 'fly-in' && (
          <SpeedLines color={collection.color} />
        )}

        {/* PACK */}
        {(phase === 'fly-in' || phase === 'shake' || phase === 'burst') && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 600, rotate: -20 }}
            animate={
              phase === 'shake'
                ? {
                    scale: 1.05,
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    x: [0, -6, 6, -8, 8, -6, 6, -3, 3, 0],
                  }
                : phase === 'burst'
                ? { scale: 1.2, opacity: 0, y: -40 }
                : { scale: 1, opacity: 1, y: 0, rotate: 0 }
            }
            transition={{
              duration: phase === 'fly-in' ? 0.55 : phase === 'shake' ? 0.55 : 0.25,
              ease: 'easeOut',
              x: { duration: 0.55 },
            }}
            className="relative w-44 h-64 rounded-2xl overflow-hidden"
            style={{
              border: `2px solid ${collection.color}`,
              background: `linear-gradient(160deg, ${collection.color}55 0%, #0c0a1f 50%, ${collection.color}33 100%)`,
              boxShadow: `0 0 40px ${collection.color}aa, inset 0 0 30px ${collection.color}33`,
            }}
          >
            {/* Foil shimmer */}
            <motion.div
              animate={{ x: ['-100%', '120%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <span className="text-5xl">🎴</span>
              <span className="text-xs font-black text-white/85 uppercase tracking-[0.3em] text-center">
                Anime Arcana
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full"
                style={{ background: `${collection.color}33`, color: collection.color }}
              >
                Booster
              </span>
              <div
                className="absolute left-0 right-0 h-1 top-1/2"
                style={{
                  background: `linear-gradient(90deg, transparent, ${collection.color}, transparent)`,
                  boxShadow: `0 0 10px ${collection.color}`,
                }}
              />
            </div>
          </motion.div>
        )}

        {/* BURST PARTICLES */}
        {(phase === 'burst' || phase === 'flip') && (
          <ParticleBurst color={collection.color} count={particleCount} />
        )}

        {/* CARD FLIP */}
        {(phase === 'flip' || phase === 'reveal') && (
          <motion.div
            initial={{ scale: 0.5, rotateY: 180, opacity: 0 }}
            animate={{
              scale: 1,
              rotateY: 0,
              opacity: 1,
            }}
            transition={{ duration: 0.7, type: 'spring', damping: 16, stiffness: 220 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Rarity halo */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 30px ${glow}, 0 0 60px ${glow}`,
                  `0 0 50px ${glow}, 0 0 90px ${glow}`,
                  `0 0 30px ${glow}, 0 0 60px ${glow}`,
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-xl"
            >
              <GameCard card={card} size="lg" />
              {/* Holo shimmer for rare+ */}
              {card.rarity !== 'common' && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-xl mix-blend-screen"
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    background:
                      'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
                    backgroundSize: '200% 200%',
                  }}
                />
              )}
            </motion.div>

            {/* Rarity stars (legendary only) */}
            {card.rarity === 'legendary' && <LegendaryCrown color={collection.color} />}

            {/* Name + rarity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-white text-2xl font-black tracking-wide">{card.name}</p>
              <p
                className="text-sm font-bold uppercase tracking-[0.25em] mt-1"
                style={{ color: RARITY_LABEL_COLOR[card.rarity], textShadow: `0 0 10px ${RARITY_LABEL_COLOR[card.rarity]}99` }}
              >
                {card.rarity}
              </p>
              <p className="text-xs text-slate-400 mt-1">{collection.label}</p>
            </motion.div>

            {phase === 'reveal' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={closePackOpening}
                className="px-10 py-3 rounded-lg font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${collection.color}, ${collection.color}66)`,
                  border: `1px solid ${collection.color}`,
                  boxShadow: `0 0 24px ${collection.color}77`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Collect!
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function ParticleBurst({ color, count }: { color: string; count: number }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    const distance = 180 + Math.random() * 220
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: Math.random() * 720,
      scale: 0.4 + Math.random() * 0.9,
      delay: Math.random() * 0.1,
    }
  })
  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: p.delay }}
          className="absolute"
          style={{
            width: 18,
            height: 18,
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
            borderRadius: '50%',
            boxShadow: `0 0 14px ${color}`,
          }}
        />
      ))}
    </>
  )
}

function SpeedLines({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0, 0.5, 0], scaleX: 1 }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.06,
          }}
          className="absolute h-0.5"
          style={{
            top: `${(i * 7 + 6) % 100}%`,
            left: i % 2 === 0 ? 0 : '50%',
            right: i % 2 === 0 ? '50%' : 0,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            transformOrigin: i % 2 === 0 ? 'right center' : 'left center',
          }}
        />
      ))}
    </div>
  )
}

function LegendaryCrown({ color }: { color: string }) {
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -10, scale: 0 }}
          animate={{ opacity: 1, y: 0, scale: [0, 1.4, 1] }}
          transition={{ delay: i * 0.07, duration: 0.5, type: 'spring' }}
          className="text-3xl"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        >
          ★
        </motion.span>
      ))}
    </div>
  )
}
