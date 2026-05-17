import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { GameCard } from '../cards/GameCard'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'

export function SellModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const sellCards = useGameStore((s) => s.sellCards)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [selected, setSelected] = useState<string[]>([])

  const player = players[currentPlayerIndex]

  const toggleCard = (cardId: string) => {
    if (selected.includes(cardId)) {
      setSelected(selected.filter((id) => id !== cardId))
    } else if (selected.length < 2) {
      setSelected([...selected, cardId])
    }
  }

  const totalValue = player.hand
    .filter((c) => selected.includes(c.id))
    .reduce((sum, c) => sum + c.sellPrice, 0)

  const handleSell = () => {
    if (selected.length > 0) {
      sellCards(selected)
    }
    setSelected([])
    closeModal()
    resolveTileAction()
  }

  const handleSkip = () => {
    setSelected([])
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal isOpen={activeModal === 'sell'} onClose={handleSkip} title="Sell Cards">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <DollarSign size={16} className="text-yellow-400" />
          <span>Sell up to 2 cards at fixed prices</span>
        </div>

        {player.hand.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No cards to sell</p>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {player.hand.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                size="sm"
                selected={selected.includes(card.id)}
                onClick={() => toggleCard(card.id)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-yellow-400">
            {selected.length > 0 ? `Total: +${totalValue} 💰` : 'Select cards to sell'}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              variant="gold"
              onClick={handleSell}
              disabled={selected.length === 0}
            >
              Sell ({selected.length})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
