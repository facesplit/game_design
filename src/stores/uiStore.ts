import { create } from 'zustand'
import type { Card } from '../types/card'
import type { Collection } from '../types/card'

type ModalType =
  | 'buy'
  | 'sell'
  | 'chance'
  | 'hype'
  | 'auction'
  | 'raid'
  | 'tax'
  | 'black-market'
  | 'insurance'
  | 'hand-limit'
  | 'collection-leader-picker'
  | null

interface UIState {
  activeModal: ModalType
  isDiceRolling: boolean
  isMoving: boolean
  selectedCardId: string | null
  packOpeningCard: Card | null
  pendingLeaderCollection: Collection | null

  openModal: (modal: ModalType) => void
  closeModal: () => void
  setDiceRolling: (rolling: boolean) => void
  setMoving: (moving: boolean) => void
  selectCard: (id: string | null) => void
  openPackOpening: (card: Card) => void
  closePackOpening: () => void
  setPendingLeaderCollection: (collection: Collection | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  isDiceRolling: false,
  isMoving: false,
  selectedCardId: null,
  packOpeningCard: null,
  pendingLeaderCollection: null,

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setDiceRolling: (rolling) => set({ isDiceRolling: rolling }),
  setMoving: (moving) => set({ isMoving: moving }),
  selectCard: (id) => set({ selectedCardId: id }),
  openPackOpening: (card) => set({ packOpeningCard: card }),
  closePackOpening: () => set({ packOpeningCard: null }),
  setPendingLeaderCollection: (collection) => set({ pendingLeaderCollection: collection }),
}))
