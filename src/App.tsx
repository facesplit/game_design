import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './stores/gameStore'
import { useLobbyStore } from './online/lobbyStore'
import { StartScreen } from './components/screens/StartScreen'
import { PlayerSetup } from './components/screens/PlayerSetup'
import { GameScreen } from './components/screens/GameScreen'
import { EndScreen } from './components/screens/EndScreen'
import { OnlineLobby } from './components/screens/OnlineLobby'

function App() {
  const phase = useGameStore((s) => s.phase)
  const netMode = useLobbyStore((s) => s.mode)
  const netStatus = useLobbyStore((s) => s.status)
  const showOnlineLobby =
    phase === 'menu' && netMode !== 'local' && (netStatus === 'connected' || netStatus === 'connecting')

  return (
    <div className="h-full bg-anime-gradient">
      <AnimatePresence mode="wait">
        {showOnlineLobby && <OnlineLobby key="lobby" />}
        {!showOnlineLobby && phase === 'menu' && <StartScreen key="start" />}
        {phase === 'setup' && <PlayerSetup key="setup" />}
        {phase === 'playing' && <GameScreen key="game" />}
        {phase === 'ended' && <EndScreen key="end" />}
      </AnimatePresence>
    </div>
  )
}

export default App
