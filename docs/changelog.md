# Changelog

## 2026-05-01 — v4.1 Auto-flow turns + tighter multiplayer turn-lock

### Multiplayer fix
- DiceRoller now reads the lobby store directly. When it's not your turn, the
  Roll Dice button is replaced with a locked "{Opponent}'s Turn" label — no way
  to roll for someone else.
- All other action gates (tile-action, end-turn) were already gated, but they're
  no longer reachable since "End Turn" is now automatic.

### Turn auto-flow (no more "End Turn" clicks)
- After the dice roll lands you on a tile, the matching modal auto-opens 350 ms
  later. Stepping on Raid / Lucky Draw / Tax / Auction / Black Market triggers
  the modal immediately for the active player; opponents see the result via the
  event log + state sync.
- After the modal resolves, the turn auto-ends (~900 ms later) — no manual
  "End Turn" button to click. Removed the explicit End Turn UI from the dice panel.
- Tiles with no modal (Start) skip straight to resolve, then auto-end.

### Modal classification
- **Mandatory** (no X, no Skip, backdrop click ignored): Tax, Raid Zone,
  Lucky Draw / Chance, Sealed-Bid Auction, Black Market.
- **Optional** (X + Skip available): Buy Pack, Sell Cards, Insurance Office.
- Mandatory modals show a small "Required" badge in the title bar and a
  subtle amber ring so the player knows they must complete the action.

### Implementation
- `Modal.tsx` gained a `mandatory` prop. When true: hides the X button,
  ignores backdrop clicks, shows a "Required" badge, adds an amber outline.
- `GameScreen.tsx` now has two new `useEffect` hooks driving turn flow:
  one auto-opens the tile modal when `turnPhase === 'action'`; one auto-fires
  `endTurn()` when `turnPhase === 'resolve'`. Both gate on `isMyTurn` so only
  the active player's device dispatches.

## 2026-05-01 — v4 Real networked multiplayer (PeerJS / WebRTC)

### What's new
- **Three-button start screen**: Local Pass-and-Play, Host Online Game, Join Online Game.
- **Host flow**: creates a 6-character room code (e.g. `EHBSDR`) over PeerJS's free public broker; host runs the authoritative gameStore.
- **Join flow**: enter the code, set your name, connect. Joiners see all peers in the lobby in real time.
- **State sync**: host's gameStore subscribes to its own changes and broadcasts a snapshot to every connected peer on each tick. Joiners replace their local state with the snapshot — perfectly mirrored.
- **Action protocol**: joiners' button taps don't mutate local state; they ship a `NetAction` over the wire (`rollAndMove`, `buyCards`, `endTurn`, etc). Host runs the action and broadcasts the result.
- **Hand privacy**: each peer only sees their own hand. Other players' cards remain hidden (only count visible).
- **Turn lock**: action buttons are disabled when it's not the local player's turn — no one can "play for" someone else.
- **No more pass-and-play handoff online**: the curtain that hides hands between local turns is suppressed when `mode !== 'local'`.
- **Lobby gating**: Host's "Start Game" stays disabled until 2-4 peers connected; joiners see "Waiting for host…" until host starts.
- **Graceful disconnect**: peers leaving update the lobby live; "Leave" button tears down the connection cleanly.

### Architecture
- `src/online/peerNetwork.ts` — PeerJS client wrapper, host/join/teardown, broadcast loop, action dispatch
- `src/online/lobbyStore.ts` — Zustand store: mode (`local` / `host` / `join`), status, room code, peer list
- `src/online/protocol.ts` — wire message types (`hello`, `lobby`, `state`, `action`, `kick`) and shareable room code generator
- `src/components/screens/OnlineLobby.tsx` — pre-game lobby with copy-to-clipboard, peer list, start gate
- gameStore mutating actions wrapped with `forwardIfJoiner(...)` — joiners short-circuit and ship the action over the wire instead of touching local state

### Notes
- Uses PeerJS's free hosted broker for signaling. No backend needed.
- Verified end-to-end with two browser tabs: host and joiner mirror state, hand privacy holds, joiner cannot act on host's turn.

## 2026-05-01 — v3 Geometry, SVG art, walking tokens

### Board geometry
- Reshaped to a true 7×6 perimeter (no empty corners). Still 22 tiles; the
  centre opens to a 5×4 emblem area.
- Added a forward 3D tilt (`perspective(1400px) rotateX(14deg)`) — the front
  row reads larger so it draws the eye to the active player.

### Custom-drawn tile artwork
- Replaced cropped PNG tile faces with hand-drawn SVG illustrations
  (`src/components/board/TileArt.tsx`). Each tile has a unique scene, unified
  frame, anime speed-lines, and rarity-style label band.
- Tiles are now resolution-independent — they stay crisp at any zoom.

### Movement & presence
- New `PlayerTokenLayer` renders pieces in pixel space above the grid;
  tokens **walk tile-by-tile** along the path with a step duration of 180 ms.
- Stacked tokens fan out into a 2×2 corner pattern so up to 4 pieces never overlap.
- Each token wears a coloured name pill below it; the active token's pill
  bounces and the piece spins.
- Top-of-screen `TurnRibbon` shows all players in turn order with their coin
  counts. Current player is highlighted.

### Pack opening v2
- Five-stage flow: fly-in → shake → burst → flip → reveal.
- Particle count + glow scale with rarity (50 particles + screen-shake +
  legendary star crown for legendaries).
- Holo shimmer overlays rare+ cards. Anime speed-lines on epic+.

### Mock collections
- Three placeholder collections (`demon-slayers`, `hunter-trials`,
  `stellar-magus`) defined in `src/data/cards.ts`. Disabled by default via
  `ENABLED_COLLECTIONS`. Drop in art and add the key to enable.

### Documentation
- New `docs/balance-rationale.md` — explains every tunable with the math
  behind it (game length, Leader multiplier, raid expected loss, auction
  format, catch-up trigger, etc).

## 2026-05-01 — v2 Polish & Playtest Fixes

### Visual / Game-feel
- Extracted illustrated tile artwork from the source design image; tiles now render as full painted panels with neon glow per tile-type.
- Enlarged board to `min(78vmin, 760px)` (was 490px), with a 7×7 grid and central animated emblem.
- Added `PlayerPiece` 3D-styled tokens (sphere / crystal / pyramid / cube) — one shape per player slot, with floating wobble and active-turn spin.
- Replaced flat dice with a CSS 3D cube that tumbles on roll.
- Added a `CoinFloater` that pops `+N 💰` / `−N 💰` over the active player on income/loss events.
- Active tile pulses with an amber neon ring; tile entry has a stagger-animated reveal.
- Start, setup, and end screens now showcase the player pieces.

### Pass-and-play / Multiplayer
- Added `HandoffOverlay` between turns so the next player can pick up the device without seeing the previous hand.
- Hand panel hides while handoff is active; reveal requires explicit confirmation.

### Quick Reference (Playtest fix #4)
- New corner `?` button opens an in-game reference covering tile effects, rarity table, abilities, and win condition. Cuts onboarding from ~5min to <1min.

### Balance / Rules (driven by 10-session playtest report)
- **Fix #1**: Game length — `START_PASSES_TO_END` 6 → 4. Projected average duration drops from ~43min to ~29min.
- **Fix #2**: Leader ability — income multiplier 2× → 1.5× (rounded). Sell-value bonus scaled accordingly.
- **Fix #3**: AUCTION rebuilt as **sealed-bid** with per-player privacy hand-off (works at 2 players).
- **Fix #5**: INSURANCE clarified as one-shot in the in-game reference; Black Market flow buttons made explicit.
- **Fix #6**: PARKING dead square replaced with a Lucky Draw tile.
- **Fix #7**: "Take/Give card" Chance cards restricted to **Common/Rare** only — Epic/Legendary protected.
- **Fix #8**: Catch-up — players 15+ coins behind pick 1 of 2 Hype Events on START pass.
- **Fix #9**: Legendary gate — Legendaries cannot appear in BUY PACK until any player has passed START once.

## 2026-04-06 — Project Initialized
- Scaffolded Vite + React + TypeScript project
- Installed dependencies: Zustand, Framer Motion, Howler.js, Tailwind CSS 4, Lucide React
- Created project structure with types/, data/, engine/, stores/, components/, hooks/, utils/
- Created CLAUDE.md, Dockerfile, docker-compose.yml
- Created docs: architecture, roadmap, game-rules, changelog
