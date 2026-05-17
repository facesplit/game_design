# Architecture

## Overview
Anime Arcana Exchange is a local browser-based anime board/card game. Built with React+TS+Vite, state managed by Zustand, animations by Framer Motion.

## Layer Separation
```
┌─────────────────────────────┐
│     Screens (pages/views)    │
├─────────────────────────────┤
│  Components (UI, board, HUD) │
├─────────────────────────────┤
│   Stores (Zustand state)     │
├─────────────────────────────┤
│   Engine (pure game logic)   │
├─────────────────────────────┤
│   Data (cards, board, events)│
├─────────────────────────────┤
│   Types (TypeScript defs)    │
└─────────────────────────────┘
```

## Engine
Pure functions with no UI dependencies. Handles dice rolls, movement, economy, card operations, tile effects, auction logic, event resolution, scoring.

## Stores
- `gameStore` — core game state: players, board, deck, turn phase, event log
- `uiStore` — UI-only state: active modals, animations, selections

## Component Organization
- `ui/` — reusable primitives (Button, Modal, Panel, Badge, GlowCard)
- `board/` — game board rendering (GameBoard, BoardTile, PlayerToken)
- `cards/` — card display (GameCard, CardStack, CardReveal)
- `hud/` — player info display (PlayerHUD, TurnIndicator, CoinCounter, EventLog)
- `modals/` — action modals (Buy, Sell, Chance, Hype, Auction, Raid, Tax)
- `screens/` — full page views (Start, PlayerSetup, Game, End)

## Data Flow
1. User action → Store action dispatched
2. Store calls Engine function (pure logic)
3. Engine returns new state
4. Store updates → React re-renders
5. Framer Motion handles transitions
