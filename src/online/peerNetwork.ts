import Peer, { type DataConnection } from 'peerjs'
import { useLobbyStore } from './lobbyStore'
import { useGameStore } from '../stores/gameStore'
import {
  PEER_PREFIX,
  makeRoomCode,
  type LobbyPeer,
  type NetAction,
  type WireMessage,
} from './protocol'

// Singleton wrapper around the PeerJS client. The host accepts incoming
// connections and runs the authoritative gameStore. Joiners send actions over
// the wire instead of mutating their local store directly. The host's
// broadcasts replace the joiner's gameStore state on each tick.

let peer: Peer | null = null
const hostConnections = new Map<string, DataConnection>() // peerId → conn (host only)
let hostConnection: DataConnection | null = null // joiner only
let unsubGameStore: (() => void) | null = null

function setLobbyError(msg: string) {
  useLobbyStore.getState().setError(msg)
}

function broadcastFromHost(msg: WireMessage, exceptPeerId?: string) {
  for (const [pid, conn] of hostConnections.entries()) {
    if (pid === exceptPeerId) continue
    try {
      conn.send(msg)
    } catch {
      // ignore broken sockets — peer 'close' will clean up
    }
  }
}

function buildLobbyPeers(): LobbyPeer[] {
  const lobby = useLobbyStore.getState()
  const hostId = lobby.selfPeerId ?? ''
  const peers: LobbyPeer[] = [
    { peerId: hostId, name: lobby.selfName, isHost: true },
  ]
  for (const conn of hostConnections.values()) {
    const meta = (conn.metadata ?? {}) as { name?: string }
    peers.push({ peerId: conn.peer, name: meta.name ?? 'Player', isHost: false })
  }
  return peers
}

function pushLobbyToAll() {
  const peers = buildLobbyPeers()
  const lobby = useLobbyStore.getState()
  lobby.setPeers(peers)
  broadcastFromHost({ type: 'lobby', peers, hostPeerId: lobby.selfPeerId ?? '' })
}

export async function startHost(name: string): Promise<string> {
  await teardown()
  const code = makeRoomCode()
  const peerId = PEER_PREFIX + code
  const lobby = useLobbyStore.getState()
  lobby.setMode('host')
  lobby.setStatus('connecting')
  lobby.setSelfName(name)
  lobby.setRoomCode(code)

  return new Promise((resolve, reject) => {
    peer = new Peer(peerId)

    peer.on('open', (id) => {
      lobby.setSelfPeerId(id)
      lobby.setHostPeerId(id)
      lobby.setStatus('connected')
      lobby.setPeers([{ peerId: id, name, isHost: true }])
      resolve(code)
    })

    peer.on('error', (err) => {
      console.error('[host peer] error', err)
      if (err.type === 'unavailable-id') {
        // unlikely with random codes, but retry once
        setLobbyError('Room code already taken — please retry.')
      } else {
        setLobbyError(`Network error: ${err.message ?? err.type}`)
      }
      reject(err)
    })

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        hostConnections.set(conn.peer, conn)
      })
      conn.on('data', (raw) => {
        const msg = raw as WireMessage
        handleHostMessage(conn, msg)
      })
      conn.on('close', () => {
        hostConnections.delete(conn.peer)
        pushLobbyToAll()
      })
      conn.on('error', () => {
        hostConnections.delete(conn.peer)
        pushLobbyToAll()
      })
    })
  })
}

function handleHostMessage(conn: DataConnection, msg: WireMessage) {
  if (msg.type === 'hello') {
    // Stamp metadata so other peers can see the name
    ;(conn as any).metadata = { name: msg.name }
    pushLobbyToAll()
    // also sync current game state if game already in progress
    const state = useGameStore.getState()
    if (state.phase === 'playing' || state.phase === 'ended') {
      try {
        conn.send({ type: 'state', state: snapshot(state) })
      } catch {
        // ignore
      }
    }
    return
  }

  if (msg.type === 'action') {
    runActionOnHost(msg.action)
  }
}

// Joiner-side connection
export async function joinRoom(name: string, roomCode: string): Promise<void> {
  await teardown()
  const targetPeerId = PEER_PREFIX + roomCode.trim().toUpperCase()
  const lobby = useLobbyStore.getState()
  lobby.setMode('join')
  lobby.setStatus('connecting')
  lobby.setSelfName(name)
  lobby.setRoomCode(roomCode.trim().toUpperCase())
  lobby.setHostPeerId(targetPeerId)

  return new Promise((resolve, reject) => {
    peer = new Peer()

    peer.on('open', (id) => {
      lobby.setSelfPeerId(id)
      const conn = peer!.connect(targetPeerId, {
        reliable: true,
        metadata: { name },
      })
      hostConnection = conn

      conn.on('open', () => {
        lobby.setStatus('connected')
        conn.send({ type: 'hello', name })
        resolve()
      })

      conn.on('data', (raw) => {
        const msg = raw as WireMessage
        handleJoinerMessage(msg)
      })

      conn.on('close', () => {
        lobby.setStatus('disconnected')
        hostConnection = null
      })

      conn.on('error', (err) => {
        setLobbyError(`Connection error: ${err.message ?? 'unknown'}`)
      })
    })

    peer.on('error', (err) => {
      console.error('[joiner peer] error', err)
      if (err.type === 'peer-unavailable') {
        setLobbyError(`Room "${roomCode}" not found.`)
      } else {
        setLobbyError(`Network error: ${err.message ?? err.type}`)
      }
      reject(err)
    })
  })
}

function handleJoinerMessage(msg: WireMessage) {
  if (msg.type === 'lobby') {
    useLobbyStore.getState().setPeers(msg.peers)
    useLobbyStore.getState().setHostPeerId(msg.hostPeerId)
    return
  }
  if (msg.type === 'state') {
    // Replace local game state with host's snapshot
    useGameStore.setState(msg.state)
    return
  }
  if (msg.type === 'kick') {
    setLobbyError(msg.reason)
    return
  }
}

// Joiner: send an action over the wire. Host: run locally.
export function dispatchNetAction(action: NetAction) {
  const lobby = useLobbyStore.getState()
  if (lobby.mode === 'local') return false
  if (lobby.mode === 'host') {
    runActionOnHost(action)
    return true
  }
  // joiner
  if (hostConnection && hostConnection.open) {
    hostConnection.send({ type: 'action', action })
    return true
  }
  return false
}

function runActionOnHost(action: NetAction) {
  const store = useGameStore.getState()
  switch (action.name) {
    case 'rollAndMove':
      store.rollAndMove()
      break
    case 'endTurn':
      store.endTurn()
      break
    case 'buyCards':
      store.buyCards(action.count)
      break
    case 'sellCards':
      store.sellCards(action.cardIds)
      break
    case 'discardCards':
      store.discardCards(action.cardIds)
      break
    case 'payTax':
      store.payTax(action.method, action.cardId)
      break
    case 'resolveBlackMarket':
      store.resolveBlackMarket(action.choice, action.discardCardId)
      break
    case 'resolveAuction':
      store.resolveAuction(action.winnerId, action.amount)
      break
    case 'buyInsurance':
      store.buyInsurance()
      break
    case 'resolveRaid':
      store.resolveRaid()
      break
    case 'beginNextTurnAfterHandoff':
      store.beginNextTurnAfterHandoff()
      break
    case 'resolveTileAction':
      store.resolveTileAction()
      break
    case 'pickHypeChoice': {
      const event = store.hypeEvents.find((e) => e.id === action.eventId) ?? store.pendingHypeChoices.find((e) => e.id === action.eventId)
      if (event) store.pickHypeChoice(event)
      break
    }
    case 'resolveChance': {
      const card = store.chanceDeck.find((c) => c.id === action.cardId)
      if (card) store.resolveChance(card, action.targetPlayerId)
      break
    }
    case 'drawChanceCard': {
      store.drawChanceCard()
      break
    }
  }
  // Broadcast new state after action
  broadcastState()
}

function snapshot(state: ReturnType<typeof useGameStore.getState>) {
  // Strip out methods — we only ship serializable state.
  const {
    phase,
    players,
    currentPlayerIndex,
    turnPhase,
    board,
    deck,
    discardPile,
    chanceDeck,
    hypeEvents,
    activeHype,
    endGameTriggered,
    endGameTriggerPlayer,
    eventLog,
    winner,
    lastDiceRoll,
    pendingHypeChoices,
    showHandoff,
    suppressNextHypeAutoOpen,
  } = state
  return {
    phase,
    players,
    currentPlayerIndex,
    turnPhase,
    board,
    deck,
    discardPile,
    chanceDeck,
    hypeEvents,
    activeHype,
    endGameTriggered,
    endGameTriggerPlayer,
    eventLog,
    winner,
    lastDiceRoll,
    pendingHypeChoices,
    showHandoff,
    suppressNextHypeAutoOpen,
  }
}

export function broadcastState() {
  const state = useGameStore.getState()
  const snap = snapshot(state)
  broadcastFromHost({ type: 'state', state: snap as any })
}

// Subscribe gameStore so host auto-broadcasts on any change.
export function bindHostBroadcast() {
  if (unsubGameStore) unsubGameStore()
  unsubGameStore = useGameStore.subscribe(() => {
    if (useLobbyStore.getState().mode !== 'host') return
    broadcastState()
  })
}

export async function teardown() {
  hostConnections.clear()
  hostConnection = null
  if (unsubGameStore) {
    unsubGameStore()
    unsubGameStore = null
  }
  if (peer) {
    try {
      peer.destroy()
    } catch {
      // ignore
    }
    peer = null
  }
  useLobbyStore.getState().reset()
}
