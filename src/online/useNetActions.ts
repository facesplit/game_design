import { useGameStore } from '../stores/gameStore'
import { useLobbyStore } from './lobbyStore'
import { dispatchNetAction } from './peerNetwork'
import type { NetAction } from './protocol'

// Wrapper hook that returns gameStore action handlers but routes through the
// network layer when in online mode. Local mode falls through to direct
// gameStore calls.
//
// Usage: replace `const rollAndMove = useGameStore((s) => s.rollAndMove)` with
// `const { rollAndMove } = useNetActions()`.

export function useNetActions() {
  const mode = useLobbyStore((s) => s.mode)

  function dispatch<T extends NetAction>(action: T, fallback: () => void) {
    if (mode === 'local') {
      fallback()
      return
    }
    dispatchNetAction(action)
  }

  const store = () => useGameStore.getState()

  return {
    rollAndMove: () => dispatch({ name: 'rollAndMove' }, () => store().rollAndMove()),
    endTurn: () => dispatch({ name: 'endTurn' }, () => store().endTurn()),
    buyCards: (count: number) =>
      dispatch({ name: 'buyCards', count }, () => store().buyCards(count)),
    sellCards: (cardIds: string[]) =>
      dispatch({ name: 'sellCards', cardIds }, () => store().sellCards(cardIds)),
    discardCards: (cardIds: string[]) =>
      dispatch({ name: 'discardCards', cardIds }, () => store().discardCards(cardIds)),
    payTax: (method: 'coins' | 'card', cardId?: string) =>
      dispatch({ name: 'payTax', method, cardId }, () => store().payTax(method, cardId)),
    resolveBlackMarket: (choice: 'coins' | 'card', discardCardId?: string) =>
      dispatch(
        { name: 'resolveBlackMarket', choice, discardCardId },
        () => store().resolveBlackMarket(choice, discardCardId)
      ),
    resolveAuction: (winnerId: string, amount: number) =>
      dispatch(
        { name: 'resolveAuction', winnerId, amount },
        () => store().resolveAuction(winnerId, amount)
      ),
    buyInsurance: () => dispatch({ name: 'buyInsurance' }, () => store().buyInsurance()),
    resolveRaid: () => {
      // Raid returns a value — local-mode UI uses it directly. Online clients
      // get the result reflected in eventLog/state next snapshot.
      if (mode === 'local') return store().resolveRaid()
      dispatchNetAction({ name: 'resolveRaid' })
      return null
    },
    beginNextTurnAfterHandoff: () =>
      dispatch({ name: 'beginNextTurnAfterHandoff' }, () => store().beginNextTurnAfterHandoff()),
    resolveTileAction: () =>
      dispatch({ name: 'resolveTileAction' }, () => store().resolveTileAction()),
    pickHypeChoice: (eventId: string) => {
      if (mode === 'local') {
        const e =
          store().pendingHypeChoices.find((x) => x.id === eventId) ??
          store().hypeEvents.find((x) => x.id === eventId)
        if (e) store().pickHypeChoice(e)
        return
      }
      dispatchNetAction({ name: 'pickHypeChoice', eventId })
    },
    resolveChance: (cardId: string, targetPlayerId?: string) => {
      if (mode === 'local') {
        const c = store().chanceDeck.find((x) => x.id === cardId)
        if (c) store().resolveChance(c, targetPlayerId)
        return
      }
      dispatchNetAction({ name: 'resolveChance', cardId, targetPlayerId })
    },
    drawChanceCard: () => {
      if (mode === 'local') return store().drawChanceCard()
      dispatchNetAction({ name: 'drawChanceCard' })
      return null
    },
  }
}
