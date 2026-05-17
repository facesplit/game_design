# Cards, Pack Animation & Bugfixes — Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Overview

Fix two bugs (buy limit, raid), integrate real card artwork for Shadow Sorcery collection, add placeholder cards for other collections, integrate Hype Event artwork, and add pack opening animation.

## 1. Bugfixes

### 1.1 Buy Limit — Max 1 Card Per Purchase

**Current:** `BuyModal.tsx` allows buying up to 2 cards per turn.
**Change:**
- `maxBuyable` capped at `1` instead of `2`
- Remove "Buy 2" button — only "Buy 1 (3 coins)" and "Skip"
- Preview shows only 1 next card from deck instead of 2
- `buyCards(count)` in store remains unchanged, UI only calls `buyCards(1)`

**Files:** `src/components/modals/BuyModal.tsx`

### 1.2 Raid — Show Dice Roll & Outcome

**Current:** `RaidModal` calls `resolveRaid()` which internally rolls dice and applies penalty, but modal shows no feedback — just switches to "Continue".

**Change:**
- `resolveRaid()` in store returns `{ roll: number, outcome: 'coins' | 'card' | 'safe', lostCardName?: string }` instead of `void`
- RaidModal after "Face the Raid!" shows:
  1. Dice roll animation (reuse DiceRoller visual style)
  2. Result: roll number + outcome text ("Rolled 2 — lost 3 coins!" / "Rolled 4 — lost Megumi!" / "Rolled 6 — escaped!")
  3. "Continue" button appears after result display
- Color coding: red for losses, green for "escaped"

**Files:** `src/stores/gameStore.ts`, `src/components/modals/TileActionModals.tsx`

## 2. Card Artwork Integration

### 2.1 Shadow Sorcery (Магическая Битва) — Real Artwork

Source: `design/Collections/Mga/`

| Rarity | Card Name | Art File | Income | Sell Price |
|--------|-----------|----------|--------|------------|
| Common (gold frame) | Мегуми | `Мегуми.png` | +1 | 2 |
| Common | Чосо | `Чосо.png` | +1 | 2 |
| Common | Кугисаки | `Кугисаки.png` | +1 | 2 |
| Common | Дзёго | `Дзёго.png` | +1 | 2 |
| Common | Нанами | `Нанами.png` | +1 | 2 |
| Rare (blue frame) | Юта | `Юта.png` | +2 | 3 |
| Rare | Итадори | `Итадори.png` | +2 | 3 |
| Rare | Тодо | `Тодо.png` | +2 | 3 |
| Epic (purple frame) | Годжо Сатору | `Годжо Сатору.png` | +4 | 6 | stability |
| Legendary (gold frame) | Тоджи | `Тоджи.png` | +6 | 10 | leader |

**Data changes in `src/data/cards.ts`:**
- Remove Maki — replace with Дзёго (common)
- Нанами: change from rare to common
- Replace English names with Russian (matching artwork)
- Distribution: 5 common / 3 rare / 1 epic / 1 legendary

**Card artwork already contains frame, name, and bonus** — `GameCard.tsx` renders the image filling the card area.

### 2.2 Shinobi Legends & Bizarre Arcana — Placeholders

- Collection-colored gradient background instead of artwork
- Character name centered
- Rarity indicator at top
- Stats (income, sell price) displayed normally
- Orange gradient for Shinobi Legends, yellow for Bizarre Arcana

### 2.3 Technical Implementation

- Copy card images to `src/assets/cards/shadow-sorcery/`
- Add `artwork?: string` field to `Card` interface (import path)
- `GameCard.tsx` — if `artwork` exists, render `<img>`, otherwise render gradient placeholder
- Hype event images to `src/assets/hype-events/`

**Files:** `src/types/card.ts`, `src/data/cards.ts`, `src/components/cards/GameCard.tsx`, `src/assets/`

## 3. Hype Event Artwork

Source: `design/Hype event/`

| File | Event (buffCollection → nerfCollection) |
|------|----------------------------------------|
| `MgaUpNarutoDown.png` | shadow-sorcery ↑, shinobi-legends ↓ |
| `MgaUpJojoDown.png` | shadow-sorcery ↑, bizarre-arcana ↓ |
| `NarutoUpMgaDown.png` | shinobi-legends ↑, shadow-sorcery ↓ |
| `NarutoUpJojoDown.png` | shinobi-legends ↑, bizarre-arcana ↓ |
| `JojoUpMgaDown.png` | bizarre-arcana ↑, shadow-sorcery ↓ |
| `JojoUpNarutoDown.png` | bizarre-arcana ↑, shinobi-legends ↓ |

**HypeModal changes:**
- Replace text description with full event artwork image
- Image takes main space in modal
- "Continue" button below image
- Add `artwork: string` field to `HypeEvent` interface

**Files:** `src/types/card.ts` (HypeEvent type), `src/data/hype-events.ts`, `src/components/modals/TileActionModals.tsx`

## 4. Pack Opening Animation

### Flow

When player clicks "Buy 1" in BuyModal:

1. **Buy modal closes** → fullscreen overlay opens (dark backdrop)
2. **Pack appears** (0.3s) — booster pack centered, styled in card's collection color
3. **Pack shakes** (0.5s) — vibration + growing glow
4. **Pack bursts** (0.4s) — pack splits apart, CSS particles scatter
5. **Card flies out** (0.5s) — card scales from small to full size + rarity-colored glow
6. **Card displayed** — player sees the obtained card (artwork or placeholder), name, rarity
7. **Click "Collect"** — card flies away, overlay closes

### Technical Details

- New component: `PackOpeningOverlay.tsx` in `src/components/modals/`
- Animations via Framer Motion (already in project)
- Particles: 8-12 CSS elements with `motion.div`, random directions
- Glow colors: common — yellow, rare — blue, epic — purple, legendary — gold with pulse
- State managed via `uiStore` (new modal type `'pack-opening'`)
- Pack is non-interactive — animation auto-plays, only final "Collect" requires click

### Pack Design

- Rectangle ~60% card height
- Collection gradient + "Anime Arcana" logo centered
- Seal/tear line horizontally across center

**Files:** `src/components/modals/PackOpeningOverlay.tsx` (new), `src/stores/uiStore.ts`, `src/components/screens/GameScreen.tsx`, `src/components/modals/BuyModal.tsx`

## Implementation Order

1. Bugfix: Buy limit (1 card max)
2. Bugfix: Raid dice roll visualization
3. Card data update (names, rarities, artwork paths)
4. Card artwork integration (copy assets, update GameCard.tsx)
5. Hype Event artwork integration
6. Pack opening animation
