import { ShoppingBag } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { BOOSTER_COST, HAND_LIMIT } from '../../types/player'

export function BuyModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const openPackOpening = useUIStore((s) => s.openPackOpening)
  const buyCards = useGameStore((s) => s.buyCards)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const deck = useGameStore((s) => s.deck)

  const player = players[currentPlayerIndex]
  const canBuy =
    player.coins >= BOOSTER_COST &&
    player.hand.length < HAND_LIMIT &&
    deck.length > 0

  const handleBuy = () => {
    // Capture the card that will be bought (top of deck)
    const cardToBuy = deck[0]
    buyCards(1)
    closeModal()
    resolveTileAction()
    // Trigger pack opening animation with the bought card
    if (cardToBuy) {
      openPackOpening(cardToBuy)
    }
  }

  const handleSkip = () => {
    closeModal()
    resolveTileAction()
  }

  // Preview next card from deck
  const previewCard = deck[0]

  return (
    <Modal isOpen={activeModal === 'buy'} onClose={handleSkip} title="Booster Shop">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShoppingBag size={16} className="text-blue-400" />
          <span>Buy 1 card · {BOOSTER_COST} coins</span>
        </div>

        <div className="bg-game-bg/50 rounded-lg p-3 text-sm">
          <span className="text-yellow-400">💰 {player.coins} coins</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="text-blue-400">🃏 {player.hand.length}/{HAND_LIMIT} cards</span>
        </div>

        {/* Card preview (show back/mystery, not the actual card) */}
        {previewCard && (
          <div className="flex justify-center">
            <div className="w-32 h-48 rounded-xl border-2 border-slate-600 bg-gradient-to-b from-indigo-900 to-slate-900 flex items-center justify-center">
              <span className="text-4xl opacity-60">🎴</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={handleSkip}>
            Skip
          </Button>
          {canBuy && (
            <Button variant="primary" onClick={handleBuy}>
              Buy 1 ({BOOSTER_COST}💰)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
