import { create } from 'zustand'
import type { LogEntry, ChanceCard, HypeEvent, GameState } from '../types/game'
import type { Player } from '../types/player'
import type { Card } from '../types/card'
import type { Collection } from '../types/card'
import { STARTING_COINS, PLAYER_COLORS, HAND_LIMIT, BOOSTER_COST, TAX_AMOUNT, START_PASSES_TO_END } from '../types/player'
import { BOARD_TILES } from '../data/board'
import { ALL_CARDS } from '../data/cards'
import { CHANCE_CARDS } from '../data/chance'
import { HYPE_EVENTS } from '../data/hype-events'
import { shuffleArray, pickAndRemove } from '../utils/random'
import { rollDice } from '../engine/dice'
import { calculateMovement } from '../engine/movement'
import { calculateStartIncome } from '../engine/economy'
import { determineWinner } from '../engine/scoring'
import { useLobbyStore } from '../online/lobbyStore'
import { useUIStore } from './uiStore'
import { dispatchNetAction } from '../online/peerNetwork'
import type { NetAction } from '../online/protocol'

// In online mode, joiners forward mutating actions to the host instead of
// running them locally. Returns true if the action was forwarded (caller should
// short-circuit). Host and local mode return false (caller proceeds normally).
function forwardIfJoiner(action: NetAction): boolean {
  if (useLobbyStore.getState().mode === 'join') {
    dispatchNetAction(action)
    return true
  }
  return false
}

interface GameActions {
  // Phase transitions
  startSetup: () => void
  startGame: (playerNames: string[]) => void
  returnToMenu: () => void

  // Turn actions
  rollAndMove: () => void
  executeTileAction: () => void
  resolveTileAction: () => void
  endTurn: () => void

  // Card actions
  buyCards: (count: number) => void
  sellCards: (cardIds: string[]) => void
  discardCards: (cardIds: string[]) => void

  // Event actions
  resolveChance: (card: ChanceCard, targetPlayerId?: string) => void
  resolveRaid: () => { roll: number; outcome: 'coins' | 'card' | 'safe' | 'insured'; lostCardName?: string }
  payTax: (method: 'coins' | 'card', cardId?: string) => void
  resolveBlackMarket: (choice: 'coins' | 'card', discardCardId?: string) => void
  resolveAuction: (winnerId: string, amount: number) => void
  buyInsurance: () => void
  setCollectionLeader: (collection: Collection, cardId: string) => void
  // Pick one of the offered hype events (first past START this round)
  pickHypeChoice: (event: HypeEvent) => void
  // Pass-and-play handoff
  beginNextTurnAfterHandoff: () => void

  // Utility
  addLog: (playerId: string, message: string, type: LogEntry['type']) => void
  getCurrentPlayer: () => Player
  drawChanceCard: () => ChanceCard | null
  drawHypeEvent: () => HypeEvent | null
}

type GameStore = GameState & GameActions

let logCounter = 0

function checkLeaderUnlock(player: Player): void {
  const collectionCounts = new Map<string, number>()
  player.hand.forEach((card) => {
    collectionCounts.set(card.collection, (collectionCounts.get(card.collection) ?? 0) + 1)
  })
  for (const [collection, count] of collectionCounts.entries()) {
    if (count >= 4 && !player.collectionLeaders[collection as Collection]) {
      useUIStore.getState().setPendingLeaderCollection(collection as Collection)
      useUIStore.getState().openModal('collection-leader-picker')
      break
    }
  }
}

function checkLeaderOnLoss(player: Player, removedCardIds: string[], remainingHand: Card[]): Player {
  const updatedLeaders = { ...player.collectionLeaders }
  for (const collection of Object.keys(updatedLeaders) as Collection[]) {
    const leaderId = updatedLeaders[collection]
    if (leaderId && removedCardIds.includes(leaderId)) {
      delete updatedLeaders[collection]
      const remainingOfCollection = remainingHand.filter((c) => c.collection === collection).length
      if (remainingOfCollection >= 4) {
        useUIStore.getState().setPendingLeaderCollection(collection)
        useUIStore.getState().openModal('collection-leader-picker')
      }
    }
  }
  return { ...player, collectionLeaders: updatedLeaders }
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  phase: 'menu',
  players: [],
  currentPlayerIndex: 0,
  turnPhase: 'roll',
  board: BOARD_TILES,
  deck: [],
  discardPile: [],
  chanceDeck: [],
  hypeEvents: [],
  activeHype: null,
  endGameTriggered: false,
  endGameTriggerPlayer: null,
  eventLog: [],
  winner: null,
  lastDiceRoll: null,
  pendingHypeChoices: [],
  showHandoff: false,
  suppressNextHypeAutoOpen: false,
  roundNumber: 0,
  lastHypeChangeRound: -1,

  // Phase transitions
  startSetup: () => set({ phase: 'setup' }),

  startGame: (playerNames: string[]) => {
    const shuffledDeck = shuffleArray([...ALL_CARDS])
    const shuffledChance = shuffleArray([...CHANCE_CARDS])
    const shuffledHype = shuffleArray([...HYPE_EVENTS])

    const players: Player[] = playerNames.map((name, i) => {
      const startCard = shuffledDeck.pop()!
      return {
        id: `player-${i}`,
        name,
        color: PLAYER_COLORS[i],
        coins: STARTING_COINS,
        hand: [startCard],
        position: 0,
        startPasses: 0,
        hasInsurance: false,
        collectionLeaders: {},
      }
    })

    logCounter = 0
    set({
      phase: 'playing',
      players,
      currentPlayerIndex: 0,
      turnPhase: 'roll',
      deck: shuffledDeck,
      discardPile: [],
      chanceDeck: shuffledChance,
      hypeEvents: shuffledHype,
      activeHype: null,
      endGameTriggered: false,
      endGameTriggerPlayer: null,
      eventLog: [],
      winner: null,
      lastDiceRoll: null,
      pendingHypeChoices: [],
      showHandoff: false,
      suppressNextHypeAutoOpen: false,
      roundNumber: 0,
      lastHypeChangeRound: -1,
    })

    get().addLog('system', 'Game started!', 'system')
    players.forEach((p) => {
      get().addLog(p.id, `${p.name} received ${p.hand[0].name} (${p.hand[0].rarity})`, 'buy')
    })
  },

  returnToMenu: () => set({ phase: 'menu' }),

  // Turn actions
  rollAndMove: () => {
    if (forwardIfJoiner({ name: 'rollAndMove' })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const dice = rollDice()
    const { newPosition, passedStart } = calculateMovement(player.position, dice)

    const updatedPlayers = [...state.players]
    const updatedPlayer = { ...player, position: newPosition }

    if (passedStart) {
      updatedPlayer.startPasses += 1
      const income = calculateStartIncome(updatedPlayer, state.activeHype)
      updatedPlayer.coins += income
      get().addLog(player.id, `${player.name} passed START! Earned ${income} coins from cards.`, 'income')

      if (updatedPlayer.startPasses >= START_PASSES_TO_END && !state.endGameTriggered) {
        set({ endGameTriggered: true, endGameTriggerPlayer: player.id })
        get().addLog('system', `${player.name} triggered endgame! (${START_PASSES_TO_END} START passes)`, 'system')
      }
    }

    updatedPlayers[state.currentPlayerIndex] = updatedPlayer

    set({
      players: updatedPlayers,
      lastDiceRoll: dice,
      turnPhase: 'action',
    })

    get().addLog(player.id, `${player.name} rolled ${dice} and moved to ${state.board[newPosition].label}`, 'move')

    // Hype event on passing START — first player this round picks from 2 choices
    if (passedStart) {
      const currentRound = get().roundNumber
      const isFirstThisRound = currentRound > get().lastHypeChangeRound
      if (isFirstThisRound) {
        // Mark BEFORE drawing so any re-entrant call in the same round is blocked
        set({ lastHypeChangeRound: currentRound })
        const a = get().drawHypeEvent()
        const b = get().drawHypeEvent()
        const choices = [a, b].filter((e): e is HypeEvent => e !== null)
        if (choices.length > 0) {
          set({ pendingHypeChoices: choices })
          get().addLog('system', `${player.name} passed START first — pick the Hype Event!`, 'event')
        }
      }
    }
  },

  executeTileAction: () => {
    // This is handled by the UI based on the current tile type
    // The UI opens the appropriate modal
  },

  resolveTileAction: () => {
    if (forwardIfJoiner({ name: 'resolveTileAction' })) return
    const state = get()
    if (state.turnPhase === 'action') {
      set({ turnPhase: 'resolve' })
    }
  },

  endTurn: () => {
    if (forwardIfJoiner({ name: 'endTurn' })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]

    // Check hand limit
    if (player.hand.length > HAND_LIMIT) {
      // UI should handle this before allowing end turn
      return
    }

    if (state.endGameTriggered) {
      const triggerPlayerIndex = state.players.findIndex((p) => p.id === state.endGameTriggerPlayer)
      const lastPlayerIndex = triggerPlayerIndex === 0
        ? state.players.length - 1
        : triggerPlayerIndex - 1

      if (state.currentPlayerIndex === lastPlayerIndex) {
        const winner = determineWinner(state.players)
        set({ phase: 'ended', winner })
        get().addLog('system', `Game over! ${winner.name} wins!`, 'system')
        return
      }
    }

    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length
    const isEndOfRound = nextIndex === 0
    // Pass-and-play handoff only makes sense in local mode; in online mode each
    // player has their own device so we skip the "hide your hand" curtain.
    const isOnline = useLobbyStore.getState().mode !== 'local'
    const showHandoff = !isOnline && state.players.length > 1
    set({
      currentPlayerIndex: nextIndex,
      turnPhase: 'roll',
      lastDiceRoll: null,
      showHandoff,
      roundNumber: isEndOfRound ? state.roundNumber + 1 : state.roundNumber,
    })
  },

  beginNextTurnAfterHandoff: () => {
    if (forwardIfJoiner({ name: 'beginNextTurnAfterHandoff' })) return
    set({ showHandoff: false })
  },

  pickHypeChoice: (event: HypeEvent) => {
    if (forwardIfJoiner({ name: 'pickHypeChoice', eventId: event.id })) return
    const state = get()
    // Return the unchosen events to the bottom of the hype event queue
    const remaining = state.pendingHypeChoices.filter((e) => e.id !== event.id)
    set({
      activeHype: event,
      hypeEvents: [...state.hypeEvents, ...remaining],
      pendingHypeChoices: [],
    })
    get().addLog('system', `Chose: ${event.description}`, 'event')
    // Skip auto-opening the regular HypeModal: this choice already revealed the event
    set({ suppressNextHypeAutoOpen: true })
  },

  // Card actions
  buyCards: (count: number) => {
    if (forwardIfJoiner({ name: 'buyCards', count })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const totalCost = count * BOOSTER_COST
    if (player.coins < totalCost) return
    if (player.hand.length + count > HAND_LIMIT) return
    if (state.deck.length < count) return

    // Playtest fix #9: Legendary gate — until any player passes START at least once,
    // legendary cards cannot come out of BUY PACK. Push them deeper into the deck.
    const newDeck = [...state.deck]
    const noOnePassed = state.players.every((p) => p.startPasses === 0)
    if (noOnePassed) {
      for (let i = 0; i < count; i++) {
        if (newDeck[i]?.rarity === 'legendary') {
          // swap with the deepest non-legendary in the remaining deck
          for (let j = newDeck.length - 1; j > i; j--) {
            if (newDeck[j].rarity !== 'legendary') {
              ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
              break
            }
          }
        }
      }
    }

    const newCards: Card[] = []
    for (let i = 0; i < count; i++) {
      newCards.push(newDeck.shift()!)
    }

    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayerIndex] = {
      ...player,
      coins: player.coins - totalCost,
      hand: [...player.hand, ...newCards],
    }

    set({ players: updatedPlayers, deck: newDeck })
    newCards.forEach((card) => {
      get().addLog(player.id, `${player.name} bought ${card.name} (${card.rarity}) for ${BOOSTER_COST}`, 'buy')
    })
    checkLeaderUnlock(updatedPlayers[state.currentPlayerIndex])
  },

  sellCards: (cardIds: string[]) => {
    if (forwardIfJoiner({ name: 'sellCards', cardIds })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    let totalEarned = 0
    const soldCards: Card[] = []
    const remainingHand = player.hand.filter((card) => {
      if (cardIds.includes(card.id)) {
        totalEarned += card.sellPrice
        soldCards.push(card)
        return false
      }
      return true
    })

    const updatedPlayers = [...state.players]
    const playerAfterLoss = checkLeaderOnLoss(player, cardIds, remainingHand)
    updatedPlayers[state.currentPlayerIndex] = {
      ...playerAfterLoss,
      coins: player.coins + totalEarned,
      hand: remainingHand,
    }

    set({
      players: updatedPlayers,
      discardPile: [...state.discardPile, ...soldCards],
    })
    soldCards.forEach((card) => {
      get().addLog(player.id, `${player.name} sold ${card.name} for ${card.sellPrice}`, 'sell')
    })
  },

  discardCards: (cardIds: string[]) => {
    if (forwardIfJoiner({ name: 'discardCards', cardIds })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const discarded: Card[] = []
    const remainingHand = player.hand.filter((card) => {
      if (cardIds.includes(card.id)) {
        discarded.push(card)
        return false
      }
      return true
    })

    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayerIndex] = { ...player, hand: remainingHand }
    set({
      players: updatedPlayers,
      discardPile: [...state.discardPile, ...discarded],
    })
  },

  // Event actions
  resolveChance: (card: ChanceCard, targetPlayerId?: string) => {
    if (forwardIfJoiner({ name: 'resolveChance', cardId: card.id, targetPlayerId })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const updatedPlayers = [...state.players]
    const pIdx = state.currentPlayerIndex

    switch (card.type) {
      case 'gain-coins':
        updatedPlayers[pIdx] = { ...player, coins: player.coins + (card.value || 0) }
        get().addLog(player.id, `${player.name} gained ${card.value} coins from Chance!`, 'income')
        break
      case 'lose-coins':
        updatedPlayers[pIdx] = { ...player, coins: Math.max(0, player.coins - (card.value || 0)) }
        get().addLog(player.id, `${player.name} lost ${card.value} coins from Chance!`, 'loss')
        break
      case 'take-card':
        // Playtest fix #7: only common/rare can be transferred via Chance
        if (targetPlayerId) {
          const targetIdx = state.players.findIndex((p) => p.id === targetPlayerId)
          if (targetIdx !== -1) {
            const eligible = state.players[targetIdx].hand.filter(
              (c) => c.rarity === 'common' || c.rarity === 'rare'
            )
            if (eligible.length > 0) {
              const { item: takenCard } = pickAndRemove(eligible)
              const remaining = state.players[targetIdx].hand.filter((c) => c.id !== takenCard.id)
              updatedPlayers[targetIdx] = { ...state.players[targetIdx], hand: remaining }
              updatedPlayers[pIdx] = { ...player, hand: [...player.hand, takenCard] }
              get().addLog(player.id, `${player.name} took ${takenCard.name} from ${state.players[targetIdx].name}!`, 'event')
            } else {
              get().addLog(player.id, `${state.players[targetIdx].name} has no common/rare cards to take.`, 'event')
            }
          }
        }
        break
      case 'give-card':
        if (targetPlayerId) {
          const eligible = player.hand.filter((c) => c.rarity === 'common' || c.rarity === 'rare')
          const targetIdx = state.players.findIndex((p) => p.id === targetPlayerId)
          if (eligible.length > 0 && targetIdx !== -1) {
            const { item: givenCard } = pickAndRemove(eligible)
            const remaining = player.hand.filter((c) => c.id !== givenCard.id)
            updatedPlayers[pIdx] = { ...player, hand: remaining }
            updatedPlayers[targetIdx] = { ...state.players[targetIdx], hand: [...state.players[targetIdx].hand, givenCard] }
            get().addLog(player.id, `${player.name} gave ${givenCard.name} to ${state.players[targetIdx].name}!`, 'event')
          } else {
            get().addLog(player.id, `No common/rare cards to give.`, 'event')
          }
        }
        break
    }

    set({ players: updatedPlayers })
  },

  resolveRaid: () => {
    if (forwardIfJoiner({ name: 'resolveRaid' })) {
      // joiner: return a placeholder; real result arrives via state broadcast
      return { roll: 0, outcome: 'safe' as const }
    }
    const state = get()
    const player = state.players[state.currentPlayerIndex]

    if (player.hasInsurance) {
      const updatedPlayers = [...state.players]
      updatedPlayers[state.currentPlayerIndex] = { ...player, hasInsurance: false }
      set({ players: updatedPlayers })
      get().addLog(player.id, `${player.name}'s insurance blocked the raid!`, 'event')
      return { roll: 0, outcome: 'insured' as const }
    }

    const raidRoll = rollDice()
    const updatedPlayers = [...state.players]

    if (raidRoll <= 3) {
      updatedPlayers[state.currentPlayerIndex] = { ...player, coins: Math.max(0, player.coins - 3) }
      get().addLog(player.id, `Raid! ${player.name} rolled ${raidRoll} — lost 3 coins!`, 'loss')
      set({ players: updatedPlayers })
      return { roll: raidRoll, outcome: 'coins' as const }
    } else if (raidRoll <= 5) {
      if (player.hand.length > 0) {
        const { item: lostCard, remaining } = pickAndRemove(player.hand)
        updatedPlayers[state.currentPlayerIndex] = { ...player, hand: remaining }
        set({ players: updatedPlayers, discardPile: [...state.discardPile, lostCard] })
        get().addLog(player.id, `Raid! ${player.name} rolled ${raidRoll} — lost ${lostCard.name}!`, 'loss')
        return { roll: raidRoll, outcome: 'card' as const, lostCardName: lostCard.name }
      } else {
        get().addLog(player.id, `Raid! ${player.name} rolled ${raidRoll} — no cards to lose!`, 'event')
        set({ players: updatedPlayers })
        return { roll: raidRoll, outcome: 'safe' as const }
      }
    } else {
      get().addLog(player.id, `Raid! ${player.name} rolled ${raidRoll} — escaped unharmed!`, 'event')
      set({ players: updatedPlayers })
      return { roll: raidRoll, outcome: 'safe' as const }
    }
  },

  payTax: (method: 'coins' | 'card', cardId?: string) => {
    if (forwardIfJoiner({ name: 'payTax', method, cardId })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const updatedPlayers = [...state.players]

    if (method === 'coins') {
      updatedPlayers[state.currentPlayerIndex] = {
        ...player,
        coins: Math.max(0, player.coins - TAX_AMOUNT),
      }
      get().addLog(player.id, `${player.name} paid ${TAX_AMOUNT} coins in tax.`, 'loss')
    } else if (cardId) {
      const card = player.hand.find((c) => c.id === cardId)
      if (card) {
        const remainingHand = player.hand.filter((c) => c.id !== cardId)
        const playerAfterLoss = checkLeaderOnLoss(player, [cardId], remainingHand)
        updatedPlayers[state.currentPlayerIndex] = {
          ...playerAfterLoss,
          hand: remainingHand,
        }
        set({ discardPile: [...state.discardPile, card] })
        get().addLog(player.id, `${player.name} discarded ${card.name} to pay tax.`, 'loss')
      }
    }

    set({ players: updatedPlayers })
  },

  resolveBlackMarket: (choice: 'coins' | 'card', discardCardId?: string) => {
    if (forwardIfJoiner({ name: 'resolveBlackMarket', choice, discardCardId })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const updatedPlayers = [...state.players]

    if (choice === 'coins') {
      updatedPlayers[state.currentPlayerIndex] = { ...player, coins: player.coins + 4 }
      get().addLog(player.id, `${player.name} took 4 coins from the Black Market.`, 'income')
    } else if (discardCardId && state.deck.length > 0) {
      const discardedCard = player.hand.find((c) => c.id === discardCardId)
      if (!discardedCard) return
      const newCard = state.deck[0]
      const newDeck = state.deck.slice(1)
      const newHand = [...player.hand.filter((c) => c.id !== discardCardId), newCard]
      updatedPlayers[state.currentPlayerIndex] = { ...player, hand: newHand }
      set({ deck: newDeck, discardPile: [...state.discardPile, discardedCard] })
      get().addLog(player.id, `${player.name} traded ${discardedCard.name} for ${newCard.name} at the Black Market.`, 'buy')
    }

    set({ players: updatedPlayers })
  },

  resolveAuction: (winnerId: string, amount: number) => {
    if (forwardIfJoiner({ name: 'resolveAuction', winnerId, amount })) return
    const state = get()
    if (state.deck.length === 0) return

    const card = state.deck[0]
    const newDeck = state.deck.slice(1)
    const updatedPlayers = [...state.players]
    const winnerIdx = updatedPlayers.findIndex((p) => p.id === winnerId)

    if (winnerIdx !== -1) {
      const winner = updatedPlayers[winnerIdx]
      updatedPlayers[winnerIdx] = {
        ...winner,
        coins: winner.coins - amount,
        hand: [...winner.hand, card],
      }
      get().addLog(winnerId, `${winner.name} won auction for ${card.name} — paid ${amount} coins!`, 'buy')
    }

    set({ players: updatedPlayers, deck: newDeck })
  },

  buyInsurance: () => {
    if (forwardIfJoiner({ name: 'buyInsurance' })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const cost = 3
    if (player.coins < cost || player.hasInsurance) return

    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayerIndex] = {
      ...player,
      coins: player.coins - cost,
      hasInsurance: true,
    }

    set({ players: updatedPlayers })
    get().addLog(player.id, `${player.name} bought insurance for ${cost} coins.`, 'buy')
  },

  setCollectionLeader: (collection: Collection, cardId: string) => {
    if (forwardIfJoiner({ name: 'setCollectionLeader', collection, cardId })) return
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayerIndex] = {
      ...player,
      collectionLeaders: { ...player.collectionLeaders, [collection]: cardId },
    }
    set({ players: updatedPlayers })
    get().addLog(player.id, `${player.name} designated a Collection Leader for ${collection}.`, 'event')
  },

  // Utility
  addLog: (playerId, message, type) => {
    set((state) => ({
      eventLog: [
        ...state.eventLog,
        { id: `log-${logCounter++}`, playerId, message, timestamp: Date.now(), type },
      ],
    }))
  },

  getCurrentPlayer: () => {
    const state = get()
    return state.players[state.currentPlayerIndex]
  },

  drawChanceCard: () => {
    if (forwardIfJoiner({ name: 'drawChanceCard' })) return null
    const state = get()
    if (state.chanceDeck.length === 0) {
      set({ chanceDeck: shuffleArray([...CHANCE_CARDS]) })
    }
    const deck = get().chanceDeck
    const card = deck[0]
    set({ chanceDeck: deck.slice(1) })
    return card || null
  },

  drawHypeEvent: () => {
    const state = get()
    if (state.hypeEvents.length === 0) {
      set({ hypeEvents: shuffleArray([...HYPE_EVENTS]) })
    }
    const events = get().hypeEvents
    const event = events[0]
    set({ hypeEvents: events.slice(1) })
    return event || null
  },
}))
