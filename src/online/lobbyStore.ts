import { create } from 'zustand'
import type { LobbyPeer } from './protocol'

export type NetMode = 'local' | 'host' | 'join'
export type NetStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'

interface LobbyState {
  mode: NetMode
  status: NetStatus
  roomCode: string | null
  selfPeerId: string | null
  selfName: string
  peers: LobbyPeer[]
  hostPeerId: string | null
  errorMessage: string | null

  setMode: (mode: NetMode) => void
  setStatus: (status: NetStatus) => void
  setRoomCode: (code: string | null) => void
  setSelfPeerId: (id: string | null) => void
  setSelfName: (name: string) => void
  setPeers: (peers: LobbyPeer[]) => void
  setHostPeerId: (id: string | null) => void
  setError: (msg: string | null) => void
  reset: () => void
}

export const useLobbyStore = create<LobbyState>((set) => ({
  mode: 'local',
  status: 'idle',
  roomCode: null,
  selfPeerId: null,
  selfName: 'Player',
  peers: [],
  hostPeerId: null,
  errorMessage: null,

  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setSelfPeerId: (selfPeerId) => set({ selfPeerId }),
  setSelfName: (selfName) => set({ selfName }),
  setPeers: (peers) => set({ peers }),
  setHostPeerId: (hostPeerId) => set({ hostPeerId }),
  setError: (errorMessage) => set({ errorMessage, status: errorMessage ? 'error' : 'idle' }),
  reset: () =>
    set({
      mode: 'local',
      status: 'idle',
      roomCode: null,
      selfPeerId: null,
      peers: [],
      hostPeerId: null,
      errorMessage: null,
    }),
}))
