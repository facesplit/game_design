import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { GameCard } from '../cards/GameCard'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { TAX_AMOUNT } from '../../types/player'

// Tax Modal
export function TaxModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const payTax = useGameStore((s) => s.payTax)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const player = players[currentPlayerIndex]

  const handleClose = () => {
    setSelectedCard(null)
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal isOpen={activeModal === 'tax'} onClose={handleClose} title="Tax Office" mandatory>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Pay {TAX_AMOUNT} coins or discard 1 card. <span className="text-amber-300">Required.</span>
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="danger"
            onClick={() => { payTax('coins'); handleClose() }}
            disabled={player.coins < TAX_AMOUNT}
          >
            Pay {TAX_AMOUNT} 💰
          </Button>
          {player.hand.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedCard) {
                  payTax('card', selectedCard)
                  handleClose()
                }
              }}
              disabled={!selectedCard}
            >
              Discard Card
            </Button>
          )}
        </div>
        {player.hand.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {player.hand.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                size="sm"
                selected={selectedCard === card.id}
                onClick={() => setSelectedCard(card.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// Raid Modal
export function RaidModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const resolveRaid = useGameStore((s) => s.resolveRaid)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const [phase, setPhase] = useState<'ready' | 'rolling' | 'result'>('ready')
  const [animatingValue, setAnimatingValue] = useState(1)
  const [result, setResult] = useState<{ roll: number; outcome: string; lostCardName?: string } | null>(null)

  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

  const handleResolve = () => {
    setPhase('rolling')
    let count = 0
    const interval = setInterval(() => {
      setAnimatingValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 12) {
        clearInterval(interval)
        const raidResult = resolveRaid()
        setResult(raidResult)
        setAnimatingValue(raidResult.roll)
        setPhase('result')
      }
    }, 80)
  }

  const handleClose = () => {
    setPhase('ready')
    setResult(null)
    closeModal()
    resolveTileAction()
  }

  const getOutcomeText = () => {
    if (!result) return ''
    if (result.outcome === 'insured') return '🛡️ Insurance blocked the raid!'
    if (result.outcome === 'coins') return `Rolled ${result.roll} — lost 3 coins!`
    if (result.outcome === 'card') return `Rolled ${result.roll} — lost ${result.lostCardName}!`
    return `Rolled ${result.roll} — escaped unharmed!`
  }

  const getOutcomeColor = () => {
    if (!result) return 'text-white'
    if (result.outcome === 'safe' || result.outcome === 'insured') return 'text-green-400'
    return 'text-red-400'
  }

  return (
    <Modal
      isOpen={activeModal === 'raid'}
      onClose={handleClose}
      title="⚔️ Raid Zone!"
      mandatory
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-300">
          Roll to determine your fate!
        </p>
        <p className="text-xs text-slate-400">
          1-3: Lose 3 coins · 4-5: Lose 1 card · 6: Safe!
        </p>

        {/* Dice display */}
        {(phase === 'rolling' || phase === 'result') && (
          <div className="text-6xl select-none py-2" style={{
            filter: phase === 'rolling'
              ? 'drop-shadow(0 0 12px rgba(239,68,68,0.6))'
              : 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
          }}>
            {diceFaces[animatingValue - 1]}
          </div>
        )}

        {/* Outcome text */}
        {phase === 'result' && result && (
          <p className={`text-lg font-bold ${getOutcomeColor()}`}>
            {getOutcomeText()}
          </p>
        )}

        {phase === 'ready' && (
          <Button variant="danger" onClick={handleResolve}>
            Face the Raid!
          </Button>
        )}
        {phase === 'rolling' && (
          <p className="text-sm text-slate-500 animate-pulse">Rolling...</p>
        )}
        {phase === 'result' && (
          <Button variant="secondary" onClick={handleClose}>
            Continue
          </Button>
        )}
      </div>
    </Modal>
  )
}

// Chance Modal
export function ChanceModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const drawChanceCard = useGameStore((s) => s.drawChanceCard)
  const resolveChance = useGameStore((s) => s.resolveChance)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [drawnCard, setDrawnCard] = useState<ReturnType<typeof drawChanceCard>>(null)
  const [needsTarget, setNeedsTarget] = useState(false)

  const otherPlayers = players.filter((_, i) => i !== currentPlayerIndex)

  const handleDraw = () => {
    const card = drawChanceCard()
    setDrawnCard(card)
    if (card && (card.type === 'take-card' || card.type === 'give-card')) {
      if (otherPlayers.length > 0) {
        setNeedsTarget(true)
      } else {
        resolveChance(card)
      }
    } else if (card) {
      resolveChance(card)
    }
  }

  const handleSelectTarget = (targetId: string) => {
    if (drawnCard) {
      resolveChance(drawnCard, targetId)
      setNeedsTarget(false)
      setDrawnCard(null)
      closeModal()
      resolveTileAction()
    }
  }

  const handleChanceClose = () => {
    setDrawnCard(null)
    setNeedsTarget(false)
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal
      isOpen={activeModal === 'chance'}
      onClose={handleChanceClose}
      title="❓ Lucky Draw!"
      mandatory
    >
      <div className="space-y-4 text-center">
        {!drawnCard ? (
          <Button variant="primary" onClick={handleDraw}>
            Draw Chance Card
          </Button>
        ) : (
          <>
            <p className="text-lg text-white font-bold">{drawnCard.description}</p>
            {needsTarget ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Choose a player:</p>
                {otherPlayers.map((p) => (
                  <Button key={p.id} variant="secondary" onClick={() => handleSelectTarget(p.id)}>
                    {p.name}
                  </Button>
                ))}
              </div>
            ) : (
              <Button variant="secondary" onClick={handleChanceClose}>
                Continue
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

// Black Market Modal
export function BlackMarketModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const resolveBlackMarket = useGameStore((s) => s.resolveBlackMarket)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [drewCard, setDrewCard] = useState(false)
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null)

  const player = players[currentPlayerIndex]

  const handleBlackMarketClose = () => {
    setDrewCard(false)
    setSelectedDiscard(null)
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal
      isOpen={activeModal === 'black-market'}
      onClose={handleBlackMarketClose}
      title="🕶️ Black Market"
      mandatory
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-400">Choose your deal:</p>
        {!drewCard ? (
          <div className="flex gap-3 justify-center">
            <Button
              variant="gold"
              onClick={() => { resolveBlackMarket('coins'); handleBlackMarketClose() }}
            >
              Take +4 💰
            </Button>
            <Button
              variant="primary"
              disabled={player.hand.length === 0}
              onClick={() => setDrewCard(true)}
            >
              Trade a Card
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Select a card to discard — you'll draw the top deck card:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {player.hand.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  size="sm"
                  selected={selectedDiscard === card.id}
                  onClick={() => setSelectedDiscard(card.id)}
                />
              ))}
            </div>
            <Button
              variant="danger"
              disabled={!selectedDiscard}
              onClick={() => {
                resolveBlackMarket('card', selectedDiscard!)
                handleBlackMarketClose()
              }}
            >
              Confirm Trade
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Insurance Modal
export function InsuranceModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const buyInsurance = useGameStore((s) => s.buyInsurance)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)

  const player = players[currentPlayerIndex]

  const handleInsuranceClose = () => {
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal isOpen={activeModal === 'insurance'} onClose={handleInsuranceClose} title="🛡️ Insurance Office">
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-400">
          Buy insurance to protect against Raid and Chance losses.
        </p>
        <p className="text-xs text-cyan-400">Cost: 3 coins · One-time use</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={handleInsuranceClose}>Skip</Button>
          <Button
            variant="primary"
            onClick={() => { buyInsurance(); handleInsuranceClose() }}
            disabled={player.coins < 3 || player.hasInsurance}
          >
            {player.hasInsurance ? 'Already Insured' : 'Buy Insurance (3💰)'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Auction Modal — Sealed-Bid format (playtest fix #3)
// Each player enters their bid in private, then all bids reveal together.
// At 2 players this still creates real tension (no "+1 coin" trivial loop).
export function AuctionModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const resolveAuction = useGameStore((s) => s.resolveAuction)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const deck = useGameStore((s) => s.deck)
  const [bids, setBids] = useState<Record<string, number>>({})
  const [phase, setPhase] = useState<'preview' | 'handoff' | 'bidding' | 'reveal'>('preview')
  const [activeBidder, setActiveBidder] = useState(0)
  const [draftBid, setDraftBid] = useState<number>(0)
  const auctionCard = deck[0]

  const reset = () => {
    setBids({})
    setPhase('preview')
    setActiveBidder(0)
    setDraftBid(0)
  }

  const handleAuctionClose = () => {
    reset()
    closeModal()
    resolveTileAction()
  }

  const startBidding = () => {
    setActiveBidder(0)
    setDraftBid(0)
    setPhase('handoff')
  }

  const submitBid = () => {
    const player = players[activeBidder]
    const next = { ...bids, [player.id]: Math.min(player.coins, Math.max(0, draftBid)) }
    setBids(next)
    if (activeBidder + 1 < players.length) {
      setActiveBidder(activeBidder + 1)
      setDraftBid(0)
      setPhase('handoff')
    } else {
      setPhase('reveal')
    }
  }

  const handleReveal = () => {
    const entries = Object.entries(bids)
    if (entries.length === 0) {
      handleAuctionClose()
      return
    }
    const winner = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
    if (winner[1] === 0) {
      // Everyone passed
      handleAuctionClose()
      return
    }
    resolveAuction(winner[0], winner[1])
    handleAuctionClose()
  }

  const bidder = players[activeBidder]

  return (
    <Modal
      isOpen={activeModal === 'auction'}
      onClose={handleAuctionClose}
      title="🔨 Sealed Bid Auction"
      mandatory
    >
      <div className="space-y-4">
        {auctionCard && phase !== 'reveal' && (
          <div className="flex justify-center">
            <GameCard card={auctionCard} size="md" />
          </div>
        )}

        {phase === 'preview' && (
          <>
            <p className="text-center text-sm text-slate-400">
              Each player secretly enters a bid. Highest bid wins and pays their bid.
              Tied highest bids are resolved by player order.
            </p>
            <Button variant="gold" onClick={startBidding} className="w-full">
              Begin Sealed Bidding
            </Button>
          </>
        )}

        {phase === 'handoff' && bidder && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(135deg, ${bidder.color}20, transparent)`,
              border: `1px solid ${bidder.color}40`,
            }}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">Pass device to</p>
            <p
              className="text-3xl font-black mt-1"
              style={{ color: bidder.color, textShadow: `0 0 16px ${bidder.color}80` }}
            >
              {bidder.name}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Bid will stay hidden from the others. ({bidder.coins} 💰 available)
            </p>
            <Button variant="primary" onClick={() => setPhase('bidding')} className="mt-4">
              I'm {bidder.name} — Show My Bid Field
            </Button>
          </div>
        )}

        {phase === 'bidding' && bidder && (
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-300">
              <span style={{ color: bidder.color }} className="font-bold">
                {bidder.name}
              </span>
              , enter your secret bid:
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setDraftBid(Math.max(0, draftBid - 1))}>
                −
              </Button>
              <input
                type="number"
                min={0}
                max={bidder.coins}
                value={draftBid}
                onChange={(e) => setDraftBid(Math.min(bidder.coins, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-32 bg-game-bg border border-game-border rounded px-3 py-2 text-white text-center text-xl font-bold"
              />
              <Button size="sm" variant="secondary" onClick={() => setDraftBid(Math.min(bidder.coins, draftBid + 1))}>
                +
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Max {bidder.coins}💰 — bid 0 to pass.
            </p>
            <Button variant="gold" onClick={submitBid} className="w-full">
              Submit Bid (sealed)
            </Button>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="space-y-3">
            <p className="text-center text-amber-300 font-bold uppercase tracking-widest">
              All bids in!
            </p>
            <div className="space-y-2">
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 text-sm text-white">{p.name}</span>
                  <span className="text-amber-300 font-bold">
                    {bids[p.id] || 0}💰
                  </span>
                </motion.div>
              ))}
            </div>
            <Button variant="gold" onClick={handleReveal} className="w-full">
              Award the Card
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Hype Event Modal
export function HypeModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const activeHype = useGameStore((s) => s.activeHype)

  return (
    <Modal isOpen={activeModal === 'hype'} onClose={closeModal} title="🔥 Hype Event!">
      <div className="space-y-4 text-center">
        {activeHype ? (
          <>
            {activeHype.artwork ? (
              <img
                src={activeHype.artwork}
                alt={activeHype.description}
                className="w-full max-w-sm mx-auto rounded-lg"
                draggable={false}
              />
            ) : (
              <>
                <p className="text-lg text-white font-bold">{activeHype.description}</p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-green-400">📈 {activeHype.buffCollection}</span>
                  <span className="text-red-400">📉 {activeHype.nerfCollection}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-slate-400">No active hype event</p>
        )}
        <Button variant="secondary" onClick={closeModal}>Continue</Button>
      </div>
    </Modal>
  )
}

// Parking Modal (nothing happens)
export function ParkingModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)

  return (
    <Modal isOpen={activeModal === 'parking' as any} onClose={closeModal} title="⏸️ Parking">
      <div className="text-center space-y-3">
        <p className="text-slate-400">Nothing happens. Take a breather.</p>
        <Button variant="secondary" onClick={closeModal}>Continue</Button>
      </div>
    </Modal>
  )
}
