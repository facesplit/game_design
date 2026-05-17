import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Wifi, Swords, Loader2, Power } from 'lucide-react'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { PlayerPiece } from '../board/PlayerPiece'
import { useLobbyStore } from '../../online/lobbyStore'
import { teardown } from '../../online/peerNetwork'
import { useGameStore } from '../../stores/gameStore'
import { PLAYER_COLORS } from '../../types/player'

// Online lobby — visible while mode is host/join and game phase is 'menu'.
// Shows room code, peer list, ready states. Host can start the game; joiners wait.
export function OnlineLobby() {
  const mode = useLobbyStore((s) => s.mode)
  const status = useLobbyStore((s) => s.status)
  const roomCode = useLobbyStore((s) => s.roomCode)
  const peers = useLobbyStore((s) => s.peers)
  const errorMessage = useLobbyStore((s) => s.errorMessage)
  const startGame = useGameStore((s) => s.startGame)
  const [copied, setCopied] = useState(false)

  if (mode === 'local') return null

  const isHost = mode === 'host'
  const canStart = isHost && peers.length >= 2 && peers.length <= 4

  const handleCopy = async () => {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const handleStart = () => {
    if (!isHost) return
    startGame(peers.map((p) => p.name))
  }

  const handleLeave = async () => {
    await teardown()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center gap-6 p-8 relative bg-anime-gradient"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, 6, 0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Wifi className="w-12 h-12 text-indigo-400 mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-black text-white mt-2">
          {isHost ? 'Hosting Game' : 'Joining Game'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {status === 'connecting' && 'Connecting to broker…'}
          {status === 'connected' && (isHost ? 'Share the code below — start when everyone is in.' : 'Connected. Waiting for host to start.')}
          {status === 'disconnected' && 'Disconnected.'}
          {status === 'error' && (errorMessage ?? 'Connection error.')}
        </p>
      </div>

      {roomCode && (
        <Panel className="p-6 flex flex-col items-center gap-3" glow>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Room Code</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black tracking-[0.4em] text-white font-mono">
              {roomCode}
            </span>
            {isHost && (
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-game-panel hover:bg-game-border text-slate-300 cursor-pointer transition-colors"
                aria-label="Copy room code"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            {isHost ? 'Share this with players on any network.' : 'Hold tight — others may join too.'}
          </p>
        </Panel>
      )}

      <Panel className="p-5 w-full max-w-md" glow>
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          Players in lobby ({peers.length}/4)
          {status === 'connecting' && <Loader2 size={12} className="animate-spin" />}
        </p>
        <div className="space-y-2">
          <AnimatePresence>
            {peers.map((p, i) => (
              <motion.div
                key={p.peerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-game-bg/60 border border-game-border"
              >
                <PlayerPiece color={PLAYER_COLORS[i] ?? '#6366f1'} size="sm" />
                <span className="font-bold text-white text-sm flex-1">{p.name}</span>
                {p.isHost && (
                  <span className="text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </motion.div>
            ))}
          </AnimatePresence>
          {peers.length < 2 && (
            <p className="text-xs text-slate-500 italic text-center py-2">
              Need at least 2 players to start.
            </p>
          )}
        </div>
      </Panel>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={handleLeave}>
          <Power size={16} className="inline mr-2" />
          Leave
        </Button>
        {isHost && (
          <Button variant="gold" size="lg" onClick={handleStart} disabled={!canStart}>
            <Swords size={18} className="inline mr-2" />
            Start Game
          </Button>
        )}
      </div>

      {errorMessage && (
        <p className="text-sm text-red-400 mt-2">{errorMessage}</p>
      )}
    </motion.div>
  )
}
