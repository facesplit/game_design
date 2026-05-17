# Cards, Pack Animation & Bugfixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix buy limit and raid bugs, integrate card/hype artwork, and add pack opening animation.

**Architecture:** Sequential changes — bugfixes first, then data/asset integration, then animation overlay. Each task builds on the previous. All state goes through Zustand stores. Animations use Framer Motion.

**Tech Stack:** React 18, TypeScript, Zustand, Framer Motion, Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/modals/BuyModal.tsx` | Modify | Limit to 1 card, trigger pack animation |
| `src/stores/gameStore.ts` | Modify | `resolveRaid` returns result object, `buyCards` returns bought cards |
| `src/components/modals/TileActionModals.tsx` | Modify | RaidModal shows dice + outcome, HypeModal shows artwork |
| `src/types/card.ts` | Modify | Add `artwork?: string` to Card interface |
| `src/types/game.ts` | Modify | Add `artwork?: string` to HypeEvent interface |
| `src/data/cards.ts` | Modify | Update Shadow Sorcery names/rarities, add artwork imports |
| `src/data/hype-events.ts` | Modify | Add artwork imports to events |
| `src/components/cards/GameCard.tsx` | Modify | Render artwork image or gradient placeholder |
| `src/assets/cards/shadow-sorcery/` | Create dir | Card artwork PNGs |
| `src/assets/hype-events/` | Create dir | Hype event artwork PNGs |
| `src/stores/uiStore.ts` | Modify | Add `'pack-opening'` modal type + `packOpeningCard` state |
| `src/components/modals/PackOpeningOverlay.tsx` | Create | Pack burst animation overlay |
| `src/components/screens/GameScreen.tsx` | Modify | Mount PackOpeningOverlay |

---

## Task 1: Bugfix — Buy Limit 1 Card

**Files:**
- Modify: `src/components/modals/BuyModal.tsx`

- [ ] **Step 1: Change maxBuyable cap from 2 to 1**

In `src/components/modals/BuyModal.tsx`, replace the entire component body:

```tsx
import { ShoppingBag } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { GameCard } from '../cards/GameCard'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { BOOSTER_COST, HAND_LIMIT } from '../../types/player'

export function BuyModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const buyCards = useGameStore((s) => s.buyCards)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const deck = useGameStore((s) => s.deck)

  const player = players[currentPlayerIndex]
  const canBuy =
    player.coins >= BOOSTER_COST &&
    player.hand.length < HAND_LIMIT &&
    deck.length > 0

  const handleBuy = () => {
    buyCards(1)
    closeModal()
  }

  // Preview next card from deck
  const previewCard = deck[0]

  return (
    <Modal isOpen={activeModal === 'buy'} onClose={closeModal} title="Booster Shop">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShoppingBag size={16} className="text-blue-400" />
          <span>Buy 1 card · {BOOSTER_COST} coins</span>
        </div>

        <div className="bg-game-bg/50 rounded-lg p-3 text-sm">
          <span className="text-yellow-400">💰 {player.coins} coins</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="text-blue-400">🃏 {player.hand.length}/{HAND_LIMIT} cards</span>
        </div>

        {/* Card preview */}
        {previewCard && (
          <div className="flex justify-center">
            <GameCard card={previewCard} size="md" />
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={closeModal}>
            Skip
          </Button>
          {canBuy && (
            <Button variant="primary" onClick={handleBuy}>
              Buy 1 ({BOOSTER_COST}💰)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev` (if not already running)
Navigate to a "Buy Pack" tile and confirm:
- Only 1 card preview shown
- Only "Buy 1" and "Skip" buttons (no "Buy 2")
- After buying, modal closes with 1 card added to hand

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/BuyModal.tsx
git commit -m "fix: limit card purchase to 1 per buy action"
```

---

## Task 2: Bugfix — Raid Dice Roll & Outcome Display

**Files:**
- Modify: `src/stores/gameStore.ts` (lines 30-34, 318-350)
- Modify: `src/components/modals/TileActionModals.tsx` (lines 68-105)

- [ ] **Step 1: Change resolveRaid return type and implementation in gameStore**

In `src/stores/gameStore.ts`, change the `resolveRaid` type in the `GameActions` interface (line 34):

```typescript
// Old:
resolveRaid: () => void

// New:
resolveRaid: () => { roll: number; outcome: 'coins' | 'card' | 'safe' | 'insured'; lostCardName?: string }
```

Then replace the `resolveRaid` implementation (lines 318-350):

```typescript
  resolveRaid: () => {
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
```

- [ ] **Step 2: Update RaidModal to show dice animation and outcome**

Replace the `RaidModal` function in `src/components/modals/TileActionModals.tsx` (lines 68-105):

```tsx
// Raid Modal
export function RaidModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const resolveRaid = useGameStore((s) => s.resolveRaid)
  const [phase, setPhase] = useState<'ready' | 'rolling' | 'result'>('ready')
  const [animatingValue, setAnimatingValue] = useState(1)
  const [result, setResult] = useState<{ roll: number; outcome: string; lostCardName?: string } | null>(null)

  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

  const handleResolve = () => {
    setPhase('rolling')
    let count = 0
    const interval = setInterval(() => {
      setAnimatingValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 12) {
        clearInterval(interval)
        const raidResult = resolveRaid()
        setResult(raidResult)
        setAnimatingValue(raidResult.roll)
        setPhase('result')
      }
    }, 80)
  }

  const handleClose = () => {
    setPhase('ready')
    setResult(null)
    closeModal()
  }

  const getOutcomeText = () => {
    if (!result) return ''
    if (result.outcome === 'insured') return '🛡️ Insurance blocked the raid!'
    if (result.outcome === 'coins') return `Rolled ${result.roll} — lost 3 coins!`
    if (result.outcome === 'card') return `Rolled ${result.roll} — lost ${result.lostCardName}!`
    return `Rolled ${result.roll} — escaped unharmed!`
  }

  const getOutcomeColor = () => {
    if (!result) return 'text-white'
    if (result.outcome === 'safe' || result.outcome === 'insured') return 'text-green-400'
    return 'text-red-400'
  }

  return (
    <Modal
      isOpen={activeModal === 'raid'}
      onClose={handleClose}
      title="⚔️ Raid Zone!"
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-300">
          Roll to determine your fate!
        </p>
        <p className="text-xs text-slate-400">
          1-3: Lose 3 coins · 4-5: Lose 1 card · 6: Safe!
        </p>

        {/* Dice display */}
        {(phase === 'rolling' || phase === 'result') && (
          <div className="text-6xl select-none py-2" style={{
            filter: phase === 'rolling'
              ? 'drop-shadow(0 0 12px rgba(239,68,68,0.6))'
              : 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
          }}>
            {diceFaces[animatingValue - 1]}
          </div>
        )}

        {/* Outcome text */}
        {phase === 'result' && result && (
          <p className={`text-lg font-bold ${getOutcomeColor()}`}>
            {getOutcomeText()}
          </p>
        )}

        {phase === 'ready' && (
          <Button variant="danger" onClick={handleResolve}>
            Face the Raid!
          </Button>
        )}
        {phase === 'rolling' && (
          <p className="text-sm text-slate-500 animate-pulse">Rolling...</p>
        )}
        {phase === 'result' && (
          <Button variant="secondary" onClick={handleClose}>
            Continue
          </Button>
        )}
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to a Raid Zone tile and confirm:
- Clicking "Face the Raid!" shows dice animation
- After animation, dice shows final number and outcome text
- Outcome text is red for losses, green for safe
- Coins/cards actually change in player HUD

- [ ] **Step 4: Commit**

```bash
git add src/stores/gameStore.ts src/components/modals/TileActionModals.tsx
git commit -m "fix: raid now shows dice roll animation and outcome"
```

---

## Task 3: Update Card Data — Names, Rarities, Artwork Paths

**Files:**
- Modify: `src/types/card.ts` (add `artwork` field)
- Modify: `src/data/cards.ts` (update Shadow Sorcery collection)

- [ ] **Step 1: Add artwork field to Card interface**

In `src/types/card.ts`, add `artwork` to the `Card` interface (after line 15):

```typescript
export interface Card {
  id: string
  name: string
  collection: Collection
  rarity: Rarity
  income: number
  sellPrice: number
  ability: CardAbility
  artworkPlaceholder: string
  artwork?: string
}
```

- [ ] **Step 2: Copy card artwork to assets**

```bash
mkdir -p "src/assets/cards/shadow-sorcery"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Мегуми.png" "src/assets/cards/shadow-sorcery/megumi.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Чосо.png" "src/assets/cards/shadow-sorcery/choso.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Кугисаки.png" "src/assets/cards/shadow-sorcery/kugisaki.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Дзёго.png" "src/assets/cards/shadow-sorcery/dzogo.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Нанами.png" "src/assets/cards/shadow-sorcery/nanami.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Юта.png" "src/assets/cards/shadow-sorcery/yuta.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Итадори.png" "src/assets/cards/shadow-sorcery/itadori.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Тодо.png" "src/assets/cards/shadow-sorcery/todo.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Годжо Сатору.png" "src/assets/cards/shadow-sorcery/gojo.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Collections/Mga/Тоджи.png" "src/assets/cards/shadow-sorcery/toji.png"
```

Run from the `anime-arcana-exchange/` directory.

- [ ] **Step 3: Update cards.ts with new names, rarities, and artwork imports**

Replace the entire `src/data/cards.ts`:

```typescript
import type { Card, Collection, Rarity } from '../types/card'

import megumi from '../assets/cards/shadow-sorcery/megumi.png'
import choso from '../assets/cards/shadow-sorcery/choso.png'
import kugisaki from '../assets/cards/shadow-sorcery/kugisaki.png'
import dzogo from '../assets/cards/shadow-sorcery/dzogo.png'
import nanami from '../assets/cards/shadow-sorcery/nanami.png'
import yuta from '../assets/cards/shadow-sorcery/yuta.png'
import itadori from '../assets/cards/shadow-sorcery/itadori.png'
import todo from '../assets/cards/shadow-sorcery/todo.png'
import gojo from '../assets/cards/shadow-sorcery/gojo.png'
import toji from '../assets/cards/shadow-sorcery/toji.png'

function makeCard(
  id: string,
  name: string,
  collection: Collection,
  rarity: Rarity,
  ability: Card['ability'] = null,
  artwork?: string
): Card {
  const incomeMap: Record<Rarity, number> = { common: 1, rare: 2, epic: 4, legendary: 6 }
  const sellMap: Record<Rarity, number> = { common: 2, rare: 3, epic: 6, legendary: 10 }
  return {
    id,
    name,
    collection,
    rarity,
    income: incomeMap[rarity],
    sellPrice: sellMap[rarity],
    ability,
    artworkPlaceholder: `/cards/${id}.png`,
    artwork,
  }
}

// Shadow Sorcery (Магическая Битва) — 10 cards
const shadowSorcery: Card[] = [
  makeCard('ss-01', 'Мегуми', 'shadow-sorcery', 'common', null, megumi),
  makeCard('ss-02', 'Чосо', 'shadow-sorcery', 'common', null, choso),
  makeCard('ss-03', 'Кугисаки', 'shadow-sorcery', 'common', null, kugisaki),
  makeCard('ss-04', 'Дзёго', 'shadow-sorcery', 'common', null, dzogo),
  makeCard('ss-05', 'Нанами', 'shadow-sorcery', 'common', null, nanami),
  makeCard('ss-06', 'Юта', 'shadow-sorcery', 'rare', null, yuta),
  makeCard('ss-07', 'Итадори', 'shadow-sorcery', 'rare', null, itadori),
  makeCard('ss-08', 'Тодо', 'shadow-sorcery', 'rare', null, todo),
  makeCard('ss-09', 'Годжо Сатору', 'shadow-sorcery', 'epic', 'stability', gojo),
  makeCard('ss-10', 'Тоджи', 'shadow-sorcery', 'legendary', 'leader', toji),
]

// Shinobi Legends (Naruto-inspired) — 10 cards
const shinobiLegends: Card[] = [
  makeCard('sl-01', 'Gaara', 'shinobi-legends', 'common'),
  makeCard('sl-02', 'Rock Lee', 'shinobi-legends', 'common'),
  makeCard('sl-03', 'Hinata', 'shinobi-legends', 'common'),
  makeCard('sl-04', 'Sakura', 'shinobi-legends', 'common'),
  makeCard('sl-05', 'Sai', 'shinobi-legends', 'common'),
  makeCard('sl-06', 'Naruto', 'shinobi-legends', 'rare'),
  makeCard('sl-07', 'Sasuke', 'shinobi-legends', 'rare'),
  makeCard('sl-08', 'Kakashi', 'shinobi-legends', 'rare'),
  makeCard('sl-09', 'Itachi', 'shinobi-legends', 'epic', 'stability'),
  makeCard('sl-10', 'Madara', 'shinobi-legends', 'legendary', 'leader'),
]

// Bizarre Arcana (JoJo-inspired) — 10 cards
const bizarreArcana: Card[] = [
  makeCard('ba-01', 'Speedwagon', 'bizarre-arcana', 'common'),
  makeCard('ba-02', 'Polnareff', 'bizarre-arcana', 'common'),
  makeCard('ba-03', 'Caesar', 'bizarre-arcana', 'common'),
  makeCard('ba-04', 'Kakyoin', 'bizarre-arcana', 'common'),
  makeCard('ba-05', 'Josuke', 'bizarre-arcana', 'common'),
  makeCard('ba-06', 'Jotaro', 'bizarre-arcana', 'rare'),
  makeCard('ba-07', 'Giorno', 'bizarre-arcana', 'rare'),
  makeCard('ba-08', 'Bruno', 'bizarre-arcana', 'rare'),
  makeCard('ba-09', 'Dio', 'bizarre-arcana', 'epic', 'stability'),
  makeCard('ba-10', 'Joseph', 'bizarre-arcana', 'legendary', 'leader'),
]

export const ALL_CARDS: Card[] = [...shadowSorcery, ...shinobiLegends, ...bizarreArcana]
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/card.ts src/data/cards.ts src/assets/cards/
git commit -m "feat: update Shadow Sorcery card data with Russian names and artwork"
```

---

## Task 4: Update GameCard to Render Artwork or Placeholder

**Files:**
- Modify: `src/components/cards/GameCard.tsx`

- [ ] **Step 1: Update GameCard to show artwork image when available**

Replace `src/components/cards/GameCard.tsx`:

```tsx
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { Badge } from '../ui/Badge'
import type { Card } from '../../types/card'
import { COLLECTION_CONFIG } from '../../types/card'

interface GameCardProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

const rarityBorder: Record<string, string> = {
  common: 'border-gray-400/40',
  rare: 'border-blue-400/50',
  epic: 'border-purple-400/60',
  legendary: 'border-amber-400/70',
}

const rarityGradient: Record<string, string> = {
  common: 'from-gray-800 to-gray-900',
  rare: 'from-blue-900 to-slate-900',
  epic: 'from-purple-900 to-slate-900',
  legendary: 'from-amber-900/50 via-yellow-900/30 to-slate-900',
}

const sizeClasses = {
  sm: 'w-24 h-36',
  md: 'w-32 h-48',
  lg: 'w-40 h-60',
}

export function GameCard({ card, onClick, selected, size = 'md', showDetails = true }: GameCardProps) {
  const collection = COLLECTION_CONFIG[card.collection]

  // Cards with artwork: render the full image (it already contains frame, name, stats)
  if (card.artwork) {
    return (
      <motion.div
        whileHover={{ y: -8, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          'relative rounded-xl overflow-hidden cursor-pointer',
          selected && 'ring-2 ring-white ring-offset-2 ring-offset-game-bg',
          sizeClasses[size]
        )}
      >
        <img
          src={card.artwork}
          alt={card.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>
    )
  }

  // Placeholder cards: gradient background with text
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 cursor-pointer card-shine overflow-hidden',
        `bg-gradient-to-b ${rarityGradient[card.rarity]}`,
        rarityBorder[card.rarity],
        `glow-${card.rarity}`,
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-game-bg',
        sizeClasses[size]
      )}
    >
      {/* Collection color gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${collection.color}40 0%, transparent 60%)`,
        }}
      />

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between p-2">
        {/* Top: income badge */}
        <div className="flex justify-between items-start">
          <span className="bg-black/50 text-green-400 text-xs font-bold px-1.5 py-0.5 rounded">
            +{card.income}
          </span>
          {card.ability && (
            <span className="bg-black/50 text-amber-300 text-[10px] px-1 py-0.5 rounded uppercase">
              {card.ability === 'leader' ? '★' : '◆'}
            </span>
          )}
        </div>

        {/* Center: character name */}
        <div className="flex-1 flex items-center justify-center px-1">
          <span
            className="text-sm font-bold text-center leading-tight opacity-80"
            style={{ color: collection.color }}
          >
            {card.name}
          </span>
        </div>

        {/* Bottom: rarity and sell price */}
        {showDetails && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge rarity={card.rarity} className="text-[9px] px-1" />
              <span className="text-yellow-400 text-[10px] font-bold">
                💰{card.sellPrice}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Run dev server, start a game. Confirm:
- Shadow Sorcery cards show full artwork images
- Shinobi Legends / Bizarre Arcana cards show gradient placeholder with name centered
- Cards display correctly in hand, buy modal, auction, etc.

- [ ] **Step 3: Commit**

```bash
git add src/components/cards/GameCard.tsx
git commit -m "feat: GameCard renders artwork images or gradient placeholders"
```

---

## Task 5: Integrate Hype Event Artwork

**Files:**
- Modify: `src/types/game.ts` (add artwork to HypeEvent)
- Modify: `src/data/hype-events.ts` (add artwork imports)
- Modify: `src/components/modals/TileActionModals.tsx` (HypeModal shows image)

- [ ] **Step 1: Copy hype event artwork to assets**

```bash
mkdir -p "src/assets/hype-events"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/MgaUpNarutoDown.png" "src/assets/hype-events/mga-up-naruto-down.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/MgaUpJojoDown.png" "src/assets/hype-events/mga-up-jojo-down.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/NarutoUpMgaDown.png" "src/assets/hype-events/naruto-up-mga-down.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/NarutoUpJojoDown.png" "src/assets/hype-events/naruto-up-jojo-down.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/JojoUpMgaDown.png" "src/assets/hype-events/jojo-up-mga-down.png"
cp "/c/Users/user/Desktop/My_project/Game Design/design/Hype event/JojoUpNarutoDown.png" "src/assets/hype-events/jojo-up-naruto-down.png"
```

Run from the `anime-arcana-exchange/` directory.

- [ ] **Step 2: Add artwork field to HypeEvent interface**

In `src/types/game.ts`, update the `HypeEvent` interface:

```typescript
export interface HypeEvent {
  id: string
  buffCollection: string
  nerfCollection: string
  description: string
  artwork?: string
}
```

- [ ] **Step 3: Update hype-events.ts with artwork imports**

Replace `src/data/hype-events.ts`:

```typescript
import type { HypeEvent } from '../types/game'

import mgaUpNarutoDown from '../assets/hype-events/mga-up-naruto-down.png'
import mgaUpJojoDown from '../assets/hype-events/mga-up-jojo-down.png'
import narutoUpMgaDown from '../assets/hype-events/naruto-up-mga-down.png'
import narutoUpJojoDown from '../assets/hype-events/naruto-up-jojo-down.png'
import jojoUpMgaDown from '../assets/hype-events/jojo-up-mga-down.png'
import jojoUpNarutoDown from '../assets/hype-events/jojo-up-naruto-down.png'

export const HYPE_EVENTS: HypeEvent[] = [
  {
    id: 'he-01',
    buffCollection: 'shadow-sorcery',
    nerfCollection: 'shinobi-legends',
    description: 'Shadow Sorcery is trending! +1 income. Shinobi Legends loses hype. -1 income.',
    artwork: mgaUpNarutoDown,
  },
  {
    id: 'he-02',
    buffCollection: 'shinobi-legends',
    nerfCollection: 'shadow-sorcery',
    description: 'Shinobi Legends goes viral! +1 income. Shadow Sorcery cools down. -1 income.',
    artwork: narutoUpMgaDown,
  },
  {
    id: 'he-03',
    buffCollection: 'bizarre-arcana',
    nerfCollection: 'shadow-sorcery',
    description: 'Bizarre Arcana hype surge! +1 income. Shadow Sorcery fades. -1 income.',
    artwork: jojoUpMgaDown,
  },
  {
    id: 'he-04',
    buffCollection: 'shadow-sorcery',
    nerfCollection: 'bizarre-arcana',
    description: 'Shadow Sorcery comeback! +1 income. Bizarre Arcana drops. -1 income.',
    artwork: mgaUpJojoDown,
  },
  {
    id: 'he-05',
    buffCollection: 'shinobi-legends',
    nerfCollection: 'bizarre-arcana',
    description: 'Shinobi Legends dominates! +1 income. Bizarre Arcana crashes. -1 income.',
    artwork: narutoUpJojoDown,
  },
  {
    id: 'he-06',
    buffCollection: 'bizarre-arcana',
    nerfCollection: 'shinobi-legends',
    description: 'Bizarre Arcana explodes! +1 income. Shinobi Legends stalls. -1 income.',
    artwork: jojoUpNarutoDown,
  },
]
```

- [ ] **Step 4: Update HypeModal to show artwork**

In `src/components/modals/TileActionModals.tsx`, replace the `HypeModal` function (lines 350-374):

```tsx
// Hype Event Modal
export function HypeModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const activeHype = useGameStore((s) => s.activeHype)

  return (
    <Modal isOpen={activeModal === 'hype'} onClose={closeModal} title="🔥 Hype Event!">
      <div className="space-y-4 text-center">
        {activeHype ? (
          <>
            {activeHype.artwork ? (
              <img
                src={activeHype.artwork}
                alt={activeHype.description}
                className="w-full max-w-sm mx-auto rounded-lg"
                draggable={false}
              />
            ) : (
              <>
                <p className="text-lg text-white font-bold">{activeHype.description}</p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-green-400">📈 {activeHype.buffCollection}</span>
                  <span className="text-red-400">📉 {activeHype.nerfCollection}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-slate-400">No active hype event</p>
        )}
        <Button variant="secondary" onClick={closeModal}>Continue</Button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 5: Verify in browser**

Start a game, pass START to trigger a hype event. Confirm:
- Hype modal shows the artwork image instead of text
- "Continue" button below the image
- Image is properly sized and centered

- [ ] **Step 6: Commit**

```bash
git add src/types/game.ts src/data/hype-events.ts src/components/modals/TileActionModals.tsx src/assets/hype-events/
git commit -m "feat: integrate hype event artwork into modal"
```

---

## Task 6: Pack Opening Animation — UI Store & Overlay Component

**Files:**
- Modify: `src/stores/uiStore.ts` (add pack-opening state)
- Create: `src/components/modals/PackOpeningOverlay.tsx`
- Modify: `src/components/modals/BuyModal.tsx` (trigger animation instead of closing)
- Modify: `src/components/screens/GameScreen.tsx` (mount overlay)

- [ ] **Step 1: Add pack-opening state to uiStore**

Replace `src/stores/uiStore.ts`:

```typescript
import { create } from 'zustand'
import type { Card } from '../types/card'

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
  | null

interface UIState {
  activeModal: ModalType
  isDiceRolling: boolean
  isMoving: boolean
  selectedCardId: string | null
  packOpeningCard: Card | null

  openModal: (modal: ModalType) => void
  closeModal: () => void
  setDiceRolling: (rolling: boolean) => void
  setMoving: (moving: boolean) => void
  selectCard: (id: string | null) => void
  openPackOpening: (card: Card) => void
  closePackOpening: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  isDiceRolling: false,
  isMoving: false,
  selectedCardId: null,
  packOpeningCard: null,

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setDiceRolling: (rolling) => set({ isDiceRolling: rolling }),
  setMoving: (moving) => set({ isMoving: moving }),
  selectCard: (id) => set({ selectedCardId: id }),
  openPackOpening: (card) => set({ packOpeningCard: card }),
  closePackOpening: () => set({ packOpeningCard: null }),
}))
```

- [ ] **Step 2: Update BuyModal to trigger pack animation**

Replace `src/components/modals/BuyModal.tsx`:

```tsx
import { ShoppingBag } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { GameCard } from '../cards/GameCard'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { BOOSTER_COST, HAND_LIMIT } from '../../types/player'

export function BuyModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const openPackOpening = useUIStore((s) => s.openPackOpening)
  const buyCards = useGameStore((s) => s.buyCards)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const deck = useGameStore((s) => s.deck)

  const player = players[currentPlayerIndex]
  const canBuy =
    player.coins >= BOOSTER_COST &&
    player.hand.length < HAND_LIMIT &&
    deck.length > 0

  const handleBuy = () => {
    // Capture the card that will be bought (top of deck)
    const cardToBuy = deck[0]
    buyCards(1)
    closeModal()
    // Trigger pack opening animation with the bought card
    if (cardToBuy) {
      openPackOpening(cardToBuy)
    }
  }

  // Preview next card from deck
  const previewCard = deck[0]

  return (
    <Modal isOpen={activeModal === 'buy'} onClose={closeModal} title="Booster Shop">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShoppingBag size={16} className="text-blue-400" />
          <span>Buy 1 card · {BOOSTER_COST} coins</span>
        </div>

        <div className="bg-game-bg/50 rounded-lg p-3 text-sm">
          <span className="text-yellow-400">💰 {player.coins} coins</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="text-blue-400">🃏 {player.hand.length}/{HAND_LIMIT} cards</span>
        </div>

        {/* Card preview (show back/mystery, not the actual card) */}
        {previewCard && (
          <div className="flex justify-center">
            <div className="w-32 h-48 rounded-xl border-2 border-slate-600 bg-gradient-to-b from-indigo-900 to-slate-900 flex items-center justify-center">
              <span className="text-4xl opacity-60">🎴</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={closeModal}>
            Skip
          </Button>
          {canBuy && (
            <Button variant="primary" onClick={handleBuy}>
              Buy 1 ({BOOSTER_COST}💰)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: Create PackOpeningOverlay component**

Create `src/components/modals/PackOpeningOverlay.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { COLLECTION_CONFIG } from '../../types/card'
import { GameCard } from '../cards/GameCard'

type Phase = 'pack' | 'shake' | 'burst' | 'reveal' | 'display'

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(234, 179, 8, 0.6)',
  rare: 'rgba(59, 130, 246, 0.7)',
  epic: 'rgba(168, 85, 247, 0.7)',
  legendary: 'rgba(245, 158, 11, 0.8)',
}

export function PackOpeningOverlay() {
  const card = useUIStore((s) => s.packOpeningCard)
  const closePackOpening = useUIStore((s) => s.closePackOpening)
  const [phase, setPhase] = useState<Phase>('pack')

  useEffect(() => {
    if (!card) {
      setPhase('pack')
      return
    }

    // Auto-advance through animation phases
    setPhase('pack')
    const t1 = setTimeout(() => setPhase('shake'), 300)
    const t2 = setTimeout(() => setPhase('burst'), 800)
    const t3 = setTimeout(() => setPhase('reveal'), 1200)
    const t4 = setTimeout(() => setPhase('display'), 1700)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [card])

  if (!card) return null

  const collection = COLLECTION_CONFIG[card.collection]
  const glowColor = RARITY_GLOW[card.rarity]

  // Generate particles for burst effect
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2
    const distance = 120 + Math.random() * 80
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.7,
    }
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      >
        {/* Pack phases: pack, shake, burst */}
        {(phase === 'pack' || phase === 'shake') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              phase === 'shake'
                ? {
                    scale: 1,
                    opacity: 1,
                    x: [0, -4, 4, -6, 6, -4, 4, -2, 2, 0],
                    transition: { x: { duration: 0.5, ease: 'easeInOut' } },
                  }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.3 }}
            className="relative w-36 h-52 rounded-xl border-2 overflow-hidden"
            style={{
              borderColor: collection.color,
              background: `linear-gradient(135deg, ${collection.color}30 0%, #1e293b 50%, ${collection.color}20 100%)`,
              boxShadow: phase === 'shake' ? `0 0 30px ${collection.color}60` : 'none',
            }}
          >
            {/* Pack design */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">🎴</span>
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Anime Arcana
              </span>
              {/* Seal line */}
              <div
                className="absolute left-0 right-0 h-0.5 top-1/2"
                style={{ background: `linear-gradient(90deg, transparent, ${collection.color}, transparent)` }}
              />
            </div>
          </motion.div>
        )}

        {/* Burst particles */}
        {phase === 'burst' && (
          <>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: p.scale * 0.3,
                  opacity: 0,
                  rotate: p.rotation,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute w-6 h-8 rounded"
                style={{
                  background: `linear-gradient(135deg, ${collection.color}, ${collection.color}40)`,
                }}
              />
            ))}
          </>
        )}

        {/* Card reveal */}
        {(phase === 'reveal' || phase === 'display') && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Glow behind card */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${glowColor}`,
                  `0 0 40px ${glowColor}`,
                  `0 0 20px ${glowColor}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="rounded-xl"
            >
              <GameCard card={card} size="lg" />
            </motion.div>

            {/* Card name and rarity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-white text-lg font-bold">{card.name}</p>
              <p className="text-sm capitalize" style={{ color: collection.color }}>
                {card.rarity} · {COLLECTION_CONFIG[card.collection].label}
              </p>
            </motion.div>

            {/* Collect button */}
            {phase === 'display' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={closePackOpening}
                className="px-8 py-3 rounded-lg font-bold text-white transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${collection.color}80, ${collection.color}40)`,
                  border: `1px solid ${collection.color}60`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Collect!
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Mount PackOpeningOverlay in GameScreen**

In `src/components/screens/GameScreen.tsx`, add the import and mount:

Add to imports (after line 11):
```typescript
import { PackOpeningOverlay } from '../modals/PackOpeningOverlay'
```

Add before the closing `</motion.div>` of the GameScreen return (before line 138):
```tsx
      <PackOpeningOverlay />
```

- [ ] **Step 5: Verify in browser**

Start a game, land on Buy Pack, buy a card. Confirm:
- Buy modal shows mystery card back (not preview)
- After clicking "Buy 1", buy modal closes
- Pack opening overlay appears with dark backdrop
- Pack appears → shakes → bursts with particles → card reveals with glow
- Card name and rarity shown below
- "Collect!" button appears, clicking it closes the overlay
- Shadow Sorcery cards show real artwork, others show gradient placeholder

- [ ] **Step 6: Commit**

```bash
git add src/stores/uiStore.ts src/components/modals/BuyModal.tsx src/components/modals/PackOpeningOverlay.tsx src/components/screens/GameScreen.tsx
git commit -m "feat: add pack opening animation with burst effect and card reveal"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ 1.1 Buy limit (Task 1)
- ✅ 1.2 Raid dice + outcome (Task 2)
- ✅ 2.1 Shadow Sorcery artwork (Task 3 + 4)
- ✅ 2.2 Placeholder cards (Task 4)
- ✅ 2.3 Technical implementation (Tasks 3 + 4)
- ✅ 3. Hype Event artwork (Task 5)
- ✅ 4. Pack Opening Animation (Task 6)

**Placeholder scan:** No TBD/TODO found. All steps have complete code.

**Type consistency:**
- `Card.artwork?: string` — used in types/card.ts, data/cards.ts, GameCard.tsx, PackOpeningOverlay.tsx ✅
- `HypeEvent.artwork?: string` — used in types/game.ts, hype-events.ts, HypeModal ✅
- `resolveRaid` returns `{ roll, outcome, lostCardName? }` — consistent between gameStore and RaidModal ✅
- `packOpeningCard: Card | null` + `openPackOpening`/`closePackOpening` — consistent between uiStore, BuyModal, PackOpeningOverlay ✅
