# Hype Modal & Tile Action Bugfixes — Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Overview

Fix two bugs: (1) Hype Event modal not showing when passing START, (2) tile action button can be clicked multiple times per turn.

## Bug 1: Hype Event Modal Not Opening

**Root cause:** `rollAndMove()` in gameStore sets `activeHype` but never opens the hype modal. The uiStore `openModal('hype')` is never called.

**Fix:**
- In `GameScreen.tsx`, add a `useEffect` that watches `activeHype`
- Use a `useRef` to track the previous value of `activeHype`
- When `activeHype` changes from its previous value to a non-null value, call `openModal('hype')`
- This decouples the two stores cleanly — gameStore sets data, UI reacts

**Files:** `src/components/screens/GameScreen.tsx`

## Bug 2: Tile Action Button Clickable Multiple Times

**Root cause:** After interacting with a tile modal (buy, sell, raid, etc.), the modal closes but `turnPhase` stays `'action'`, so the action button remains clickable.

**Fix:**
- Add `resolveTileAction()` action to gameStore that transitions `turnPhase` from `'action'` to `'resolve'`
- Every tile action modal calls `resolveTileAction()` when closing (after action or skip)
- In `'resolve'` phase, only "End Turn" button is shown (action button already hidden)

**Affected modals:**
- `BuyModal` — on buy and on skip
- `SellModal` — on sell and on skip
- `TaxModal` — on pay and on discard
- `RaidModal` — on continue after result
- `ChanceModal` — on continue after resolution
- `BlackMarketModal` — on take coins and on card swap
- `InsuranceModal` — on buy and on skip
- `AuctionModal` — on resolve

**Files:** `src/stores/gameStore.ts`, `src/components/modals/BuyModal.tsx`, `src/components/modals/SellModal.tsx`, `src/components/modals/TileActionModals.tsx`

## Implementation Order

1. Add `resolveTileAction` to gameStore
2. Update all modals to call `resolveTileAction` on close
3. Add useEffect for hype modal auto-open in GameScreen
