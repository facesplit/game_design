import type { GameState } from '../types/game'

// Wire protocol between host and joiners. All messages are JSON-serializable.
//
// Connection flow:
//   1. Joiner opens a peer connection to host's peerId.
//   2. Joiner sends `hello` { name }.
//   3. Host adds joiner to lobby, broadcasts `lobby` to everyone.
//   4. When host taps Start, host sends `state` to all peers (game phase = 'playing').
//   5. Joiner mirrors snapshots into their local gameStore.
//   6. Joiner sends `action` to host. Host runs the matching gameStore method
//      and broadcasts a fresh `state`.

export interface LobbyPeer {
  peerId: string
  name: string
  isHost: boolean
}

export type WireMessage =
  | { type: 'hello'; name: string }
  | { type: 'lobby'; peers: LobbyPeer[]; hostPeerId: string }
  | { type: 'state'; state: GameState; recipientPlayerId?: string }
  | { type: 'action'; action: NetAction }
  | { type: 'kick'; reason: string }

// Mirror of the actions that joiners can request the host to run on their behalf.
// We don't expose every gameStore method — only the ones a non-host player can
// trigger during their turn. Host runs the action server-side and broadcasts.
export type NetAction =
  | { name: 'rollAndMove' }
  | { name: 'endTurn' }
  | { name: 'buyCards'; count: number }
  | { name: 'sellCards'; cardIds: string[] }
  | { name: 'discardCards'; cardIds: string[] }
  | { name: 'payTax'; method: 'coins' | 'card'; cardId?: string }
  | { name: 'resolveBlackMarket'; choice: 'coins' | 'card'; discardCardId?: string }
  | { name: 'resolveAuction'; winnerId: string; amount: number }
  | { name: 'buyInsurance' }
  | { name: 'resolveChance'; cardId: string; targetPlayerId?: string }
  | { name: 'resolveRaid' }
  | { name: 'pickHypeChoice'; eventId: string }
  | { name: 'beginNextTurnAfterHandoff' }
  | { name: 'drawChanceCard' }
  | { name: 'resolveTileAction' }
  | { name: 'setCollectionLeader'; collection: string; cardId: string }

// Friendly room codes are derived from the peerId. PeerJS auto-generates UUIDs
// that aren't memorable, so we mint our own short code for sharing and keep a
// registry mapping code → peerId on the broker (just by using the code as the
// peerId itself — PeerJS lets you choose the id).
export function makeRoomCode(): string {
  // 6 chars from an unambiguous alphabet (no 0/O/1/I/L)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

// PeerJS prefers a small namespace prefix to avoid collisions with random
// strangers grabbing the same id.
export const PEER_PREFIX = 'aae-v1-'
