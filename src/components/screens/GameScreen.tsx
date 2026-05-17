import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GameBoard } from '../board/GameBoard'
import { PlayerHUD } from '../hud/PlayerHUD'
import { PlayerHand } from '../hud/PlayerHand'
import { DiceRoller } from '../hud/DiceRoller'
import { EventLog } from '../hud/EventLog'
import { Panel } from '../ui/Panel'
import { BuyModal } from '../modals/BuyModal'
import { PackOpeningOverlay } from '../modals/PackOpeningOverlay'
import { SellModal } from '../modals/SellModal'
import { HypeChoiceModal } from '../modals/HypeChoiceModal'
import {
  TaxModal,
  RaidModal,
  ChanceModal,
  BlackMarketModal,
  InsuranceModal,
  AuctionModal,
  HypeModal,
} from '../modals/TileActionModals'
import { HandoffOverlay } from './HandoffOverlay'
import { QuickReference } from '../hud/QuickReference'
import { CoinFloater } from '../hud/CoinFloater'
import { TurnRibbon } from '../hud/TurnRibbon'
import { CollectionLeaderModal } from '../modals/CollectionLeaderModal'
import { useLobbyStore } from '../../online/lobbyStore'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { BOARD_TILES } from '../../data/board'
import { calculateFinalScore } from '../../engine/economy'
import type { TileType } from '../../types/board'

const tileToModal: Partial<Record<TileType, string>> = {
  'buy-pack': 'buy',
  'sell-cards': 'sell',
  'tax': 'tax',
  'raid-zone': 'raid',
  'chance': 'chance',
  'auction': 'auction',
  'black-market': 'black-market',
  'insurance-office': 'insurance',
}

export function GameScreen() {
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const turnPhase = useGameStore((s) => s.turnPhase)
  const endTurn = useGameStore((s) => s.endTurn)
  const activeHype = useGameStore((s) => s.activeHype)
  const endGameTriggered = useGameStore((s) => s.endGameTriggered)
  const showHandoff = useGameStore((s) => s.showHandoff)
  const openModal = useUIStore((s) => s.openModal)

  // In online mode, the player whose hand we display is the local user
  // (matched by the lobby `selfName`). In local mode it's the active player.
  const netMode = useLobbyStore((s) => s.mode)
  const selfName = useLobbyStore((s) => s.selfName)
  const isOnline = netMode !== 'local'
  const localUser = isOnline ? players.find((p) => p.name === selfName) : null
  const handOwner = isOnline ? localUser ?? players[currentPlayerIndex] : players[currentPlayerIndex]
  const isMyTurn = !isOnline || players[currentPlayerIndex]?.name === selfName

  const currentPlayer = players[currentPlayerIndex]
  const currentTile = BOARD_TILES[currentPlayer?.position ?? 0]

  // Compute score leader for the 👑 badge (visual only — does not affect game logic)
  const leaderPlayerId = players.length > 0
    ? players.reduce((best, p) => calculateFinalScore(p) >= calculateFinalScore(best) ? p : best, players[0]).id
    : null
  const turnPhaseStore = useGameStore((s) => s.turnPhase)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const pendingHypeChoices = useGameStore((s) => s.pendingHypeChoices)
  const activeModal = useUIStore((s) => s.activeModal)

  const suppressNextHypeAutoOpen = useGameStore((s) => s.suppressNextHypeAutoOpen)
  const prevHypeRef = useRef(activeHype)
  useEffect(() => {
    if (activeHype && activeHype !== prevHypeRef.current) {
      if (suppressNextHypeAutoOpen) {
        useGameStore.setState({ suppressNextHypeAutoOpen: false })
      } else {
        openModal('hype' as any)
      }
    }
    prevHypeRef.current = activeHype
  }, [activeHype, openModal, suppressNextHypeAutoOpen])

  // Auto-open the matching modal as soon as the active player lands on an
  // action tile. For tiles with no modal (start), pass straight through to the
  // resolve phase. Only the active player's device fires this — joiners watch.
  useEffect(() => {
    if (!isMyTurn) return
    if (turnPhaseStore !== 'action') return
    if (pendingHypeChoices.length > 0) return
    if (activeModal) return // something already open

    const modalType = currentTile ? tileToModal[currentTile.type] : undefined
    if (modalType) {
      // Small delay so the player sees their token finish moving before the modal pops
      const t = setTimeout(() => openModal(modalType as any), 350)
      return () => clearTimeout(t)
    } else {
      // No tile-action (e.g. START) — skip straight to resolve so auto-end can fire
      const t = setTimeout(() => resolveTileAction(), 600)
      return () => clearTimeout(t)
    }
  }, [
    isMyTurn,
    turnPhaseStore,
    pendingHypeChoices.length,
    activeModal,
    currentTile,
    openModal,
    resolveTileAction,
  ])

  // Auto-end the turn once the action has resolved. Only the active player
  // dispatches this so we don't fire twice in online mode.
  useEffect(() => {
    if (!isMyTurn) return
    if (turnPhaseStore !== 'resolve') return
    if (activeModal) return // wait until any lingering modal is closed
    if (pendingHypeChoices.length > 0) return

    const t = setTimeout(() => endTurn(), 900)
    return () => clearTimeout(t)
  }, [isMyTurn, turnPhaseStore, activeModal, pendingHypeChoices.length, endTurn])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex gap-4 p-4 overflow-hidden"
    >
      {/* Left sidebar — players + active hype */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
        {players.map((player, i) => (
          <PlayerHUD
            key={player.id}
            player={player}
            isActive={i === currentPlayerIndex}
            compact
            isLeader={player.id === leaderPlayerId}
            activeHype={activeHype}
          />
        ))}

        {activeHype && (
          <Panel className="p-3 mt-2 border-purple-500/40">
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">
              🔥 Active Hype
            </p>
            <p className="text-[11px] text-slate-200 mt-1 leading-snug">{activeHype.description}</p>
          </Panel>
        )}

        {endGameTriggered && (
          <Panel className="p-3 mt-2 border-red-500/50">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
              Final Round
            </p>
            <p className="text-[11px] text-red-200/80 mt-1">
              Game ends after current round.
            </p>
          </Panel>
        )}
      </div>

      {/* Center — board + dice */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-0">
        <TurnRibbon />
        <GameBoard />

        <Panel className="px-6 py-3 flex items-center gap-6" glow>
          <DiceRoller />

          {turnPhase !== 'roll' && (
            <div className="flex flex-col items-center gap-1 min-w-[120px]">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                Tile
              </span>
              <span className="text-sm font-bold text-white">{currentTile?.label}</span>
              <span className="text-[10px] text-slate-500 italic">
                {turnPhase === 'action'
                  ? isMyTurn
                    ? 'Resolving…'
                    : 'Watching…'
                  : 'Wrapping up'}
              </span>
            </div>
          )}
        </Panel>
      </div>

      {/* Right sidebar — hand + log */}
      <div className="w-60 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        <Panel className="p-3" glow>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
            {handOwner?.name}'s Hand{isOnline && ' (you)'}
          </h3>
          {handOwner && !showHandoff && <PlayerHand player={handOwner} />}
          {showHandoff && (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Hand hidden until {currentPlayer?.name} taps "Reveal"
            </p>
          )}
          {isOnline && !isMyTurn && (
            <p className="text-[10px] text-amber-300 italic text-center mt-2">
              Waiting for {currentPlayer?.name}'s turn…
            </p>
          )}
        </Panel>
        <div className="flex-1 min-h-0">
          <EventLog />
        </div>
      </div>

      <BuyModal />
      <SellModal />
      <TaxModal />
      <RaidModal />
      <ChanceModal />
      <BlackMarketModal />
      <InsuranceModal />
      <AuctionModal />
      <HypeModal />
      <HypeChoiceModal />
      <CollectionLeaderModal />
      <PackOpeningOverlay />
      <HandoffOverlay />
      <CoinFloater />
      <QuickReference />
    </motion.div>
  )
}
