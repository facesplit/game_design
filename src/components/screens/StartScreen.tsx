import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Users, Wifi, LogIn, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'
import { PlayerPiece } from '../board/PlayerPiece'
import { useGameStore } from '../../stores/gameStore'
import { useLobbyStore } from '../../online/lobbyStore'
import { startHost, joinRoom, bindHostBroadcast } from '../../online/peerNetwork'
import { PLAYER_COLORS } from '../../types/player'

type ModeChoice = 'menu' | 'local' | 'host' | 'join'

export function StartScreen() {
  const startSetup = useGameStore((s) => s.startSetup)
  const setLobbyMode = useLobbyStore((s) => s.setMode)
  const lobbyError = useLobbyStore((s) => s.errorMessage)
  const setLobbyError = useLobbyStore((s) => s.setError)
  const [choice, setChoice] = useState<ModeChoice>('menu')
  const [hostName, setHostName] = useState('Host')
  const [joinName, setJoinName] = useState('Player')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  const goLocal = () => {
    setLobbyMode('local')
    startSetup()
  }

  const goHost = async () => {
    setBusy(true)
    setLobbyError(null)
    try {
      await startHost(hostName.trim() || 'Host')
      bindHostBroadcast()
      // Host stays on this screen, advancing to OnlineLobby (rendered by App)
    } catch {
      // error is shown via lobbyError
    } finally {
      setBusy(false)
    }
  }

  const goJoin = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    setLobbyError(null)
    try {
      await joinRoom(joinName.trim() || 'Player', joinCode.trim())
      // Joiner waits in lobby
    } catch {
      // error visible via lobbyError
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center gap-8 bg-anime-gradient relative overflow-hidden"
    >
      {/* particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
        className="text-center relative"
      >
        <motion.div
          animate={{
            textShadow: [
              '0 0 20px rgba(99,102,241,0.5)',
              '0 0 40px rgba(168,85,247,0.5)',
              '0 0 20px rgba(99,102,241,0.5)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h1 className="text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            ANIME ARCANA
          </h1>
          <h2 className="text-4xl font-bold text-amber-400 tracking-[0.3em] -mt-2">EXCHANGE</h2>
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mt-4"
        />
        <p className="text-slate-400 mt-4 text-lg flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          Premium Anime Card Trading Board Game
          <Sparkles size={16} className="text-purple-400" />
        </p>
      </motion.div>

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {choice === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-3"
            >
              <Button variant="gold" size="lg" onClick={goLocal} className="flex items-center gap-3">
                <Users size={20} />
                Local Pass-and-Play
              </Button>
              <Button variant="primary" size="lg" onClick={() => setChoice('host')} className="flex items-center gap-3">
                <Wifi size={20} />
                Host Online Game
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setChoice('join')} className="flex items-center gap-3">
                <LogIn size={20} />
                Join Online Game
              </Button>
            </motion.div>
          )}

          {choice === 'host' && (
            <motion.div
              key="host"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-3 rounded-2xl p-6 bg-game-surface/80 border border-game-border backdrop-blur"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wifi size={20} className="text-indigo-400" />
                Host a Game
              </h3>
              <p className="text-xs text-slate-400">
                Creates a shareable room code over WebRTC. No account, no server. You'll be Player 1.
              </p>
              <label className="text-xs uppercase tracking-widest text-slate-400">Your name</label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="bg-game-bg border border-game-border rounded-lg px-4 py-2.5 text-white"
                placeholder="Host"
              />
              {lobbyError && <p className="text-xs text-red-400">{lobbyError}</p>}
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" onClick={() => setChoice('menu')}>
                  <ArrowLeft size={16} className="inline mr-1" />
                  Back
                </Button>
                <Button variant="gold" onClick={goHost} disabled={busy} className="flex-1">
                  {busy ? 'Connecting…' : 'Create Room'}
                </Button>
              </div>
            </motion.div>
          )}

          {choice === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-3 rounded-2xl p-6 bg-game-surface/80 border border-game-border backdrop-blur"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LogIn size={20} className="text-indigo-400" />
                Join a Game
              </h3>
              <p className="text-xs text-slate-400">
                Ask the host for the room code (6 characters).
              </p>
              <label className="text-xs uppercase tracking-widest text-slate-400">Your name</label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="bg-game-bg border border-game-border rounded-lg px-4 py-2.5 text-white"
                placeholder="Player"
              />
              <label className="text-xs uppercase tracking-widest text-slate-400">Room code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-game-bg border border-game-border rounded-lg px-4 py-2.5 text-white font-mono text-center tracking-[0.4em] text-xl"
                placeholder="ABCDEF"
                maxLength={6}
              />
              {lobbyError && <p className="text-xs text-red-400">{lobbyError}</p>}
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" onClick={() => setChoice('menu')}>
                  <ArrowLeft size={16} className="inline mr-1" />
                  Back
                </Button>
                <Button
                  variant="gold"
                  onClick={goJoin}
                  disabled={busy || joinCode.trim().length < 4}
                  className="flex-1"
                >
                  {busy ? 'Connecting…' : 'Join Room'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-6 relative z-10"
      >
        {PLAYER_COLORS.map((color, i) => (
          <motion.div
            key={color}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PlayerPiece color={color} size="md" spinning />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-slate-500 text-sm relative z-10"
      >
        2-4 Players · Local + Online · ~15-25 min · <kbd className="text-xs">Play</kbd> a button above
      </motion.p>
    </motion.div>
  )
}
