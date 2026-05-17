import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { GameCard } from '../cards/GameCard'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { COLLECTION_CONFIG } from '../../types/card'

export function CollectionLeaderModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const pendingLeaderCollection = useUIStore((s) => s.pendingLeaderCollection)
  const setPendingLeaderCollection = useUIStore((s) => s.setPendingLeaderCollection)
  const setCollectionLeader = useGameStore((s) => s.setCollectionLeader)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const player = players[currentPlayerIndex]
  const isOpen = activeModal === 'collection-leader-picker' && pendingLeaderCollection !== null

  const collectionCards = pendingLeaderCollection
    ? player.hand.filter((c) => c.collection === pendingLeaderCollection)
    : []

  const collectionLabel = pendingLeaderCollection
    ? COLLECTION_CONFIG[pendingLeaderCollection]?.label ?? pendingLeaderCollection
    : ''

  const handleConfirm = () => {
    if (!selectedCardId || !pendingLeaderCollection) return
    setCollectionLeader(pendingLeaderCollection, selectedCardId)
    setSelectedCardId(null)
    setPendingLeaderCollection(null)
    closeModal()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={`👑 Collection Leader — ${collectionLabel}`}
      mandatory
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-400 text-center">
          You have 4+ cards from this collection! Designate one as Leader — its income is doubled.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {collectionCards.map((card) => (
            <GameCard
              key={card.id}
              card={card}
              size="sm"
              selected={selectedCardId === card.id}
              onClick={() => setSelectedCardId(card.id)}
            />
          ))}
        </div>
        <div className="flex justify-center">
          <Button
            variant="gold"
            disabled={!selectedCardId}
            onClick={handleConfirm}
          >
            Designate Leader
          </Button>
        </div>
      </div>
    </Modal>
  )
}
