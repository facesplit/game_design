# Black Market / Collection Indicator / Leader Round Event — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Black Market (forced 1-for-1 trade), add collection indicator with Collection Leader ×2 and Stability bonus rules, and fix the hype event so it changes exactly once per round — triggered by the first player to pass START that round — while the 👑 badge remains a purely visual score-leader indicator.

**Architecture:** Types first, then pure engine logic, then store actions, then UI. The `calculateCardIncome` function gains a `player` parameter to check collection bonuses. A new `CollectionLeaderModal` handles the leader-card picker. `PlayerHUD` gains a collection indicator section and a 👑 badge.

**Tech Stack:** React 18 + TypeScript + Vite, Zustand, Tailwind CSS 4, Framer Motion, Lucide React. No test framework — verification is done in the browser via `npm run dev`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/player.ts` | Modify | Add `collectionLeaders` field; remove `CATCHUP_DEFICIT` |
| `src/types/game.ts` | Modify | Add `roundNumber` and `lastHypeChangeRound` to `GameState` |
| `src/stores/uiStore.ts` | Modify | Add `'collection-leader-picker'` modal type; add `pendingLeaderCollection` state |
| `src/engine/economy.ts` | Modify | `calculateCardIncome` gains `player` param; Collection Leader ×2; Stability nerf bypass |
| `src/stores/gameStore.ts` | Modify | Fix Black Market; init `collectionLeaders` + round counters; `setCollectionLeader` action; once-per-round hype event; increment `roundNumber` in `endTurn`; remove catch-up; gain/loss hooks |
| `src/components/modals/TileActionModals.tsx` | Modify | Black Market modal — forced trade UI |
| `src/components/modals/HypeChoiceModal.tsx` | Modify | Title/text update — "First Past START!" framing |
| `src/components/modals/CollectionLeaderModal.tsx` | Create | New picker modal for designating Collection Leader |
| `src/components/hud/PlayerHUD.tsx` | Modify | Collection indicator section + 👑 score-leader badge (visual only) |
| `src/components/screens/GameScreen.tsx` | Modify | Compute score leader for badge; pass `isLeader` + `activeHype` to PlayerHUD; mount CollectionLeaderModal |

---

### Task 1: Type Foundation

**Files:**
- Modify: `src/types/player.ts`
- Modify: `src/stores/uiStore.ts`

- [ ] **Step 1: Add `collectionLeaders` to Player and remove `CATCHUP_DEFICIT`**

Full replacement of `src/types/player.ts`:

```typescript
import type { Card } from './card'
import type { Collection } from './card'

export interface Player {
  id: string
  name: string
  color: string
  coins: number
  hand: Card[]
  position: number
  startPasses: number
  hasInsurance: boolean
  collectionLeaders: Partial<Record<Collection, string>>  // collection → card id of designated leader
}

export const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'] as const

export const HAND_LIMIT = 8
export const STARTING_COINS = 10
export const BOOSTER_COST = 3
export const TAX_AMOUNT = 5
// Playtest fix #1: shorten game from 6 → 4 START passes
export const START_PASSES_TO_END = 4
// Playtest fix #2: Leader card ability retune 2× → 1.5×
export const LEADER_INCOME_MULT = 1.5
// CATCHUP_DEFICIT removed — replaced by leader-only hype event mechanic (Task 4)
```

- [ ] **Step 2: Add `'collection-leader-picker'` to uiStore modal union and add `pendingLeaderCollection`**

Full replacement of `src/stores/uiStore.ts`:

```typescript
import { create } from 'zustand'
import type { Card } from '../types/card'
import type { Collection } from '../types/card'

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
  | 'collection-leader-picker'
  | null

interface UIState {
  activeModal: ModalType
  isDiceRolling: boolean
  isMoving: boolean
  selectedCardId: string | null
  packOpeningCard: Card | null
  pendingLeaderCollection: Collection | null

  openModal: (modal: ModalType) => void
  closeModal: () => void
  setDiceRolling: (rolling: boolean) => void
  setMoving: (moving: boolean) => void
  selectCard: (id: string | null) => void
  openPackOpening: (card: Card) => void
  closePackOpening: () => void
  setPendingLeaderCollection: (collection: Collection | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  isDiceRolling: false,
  isMoving: false,
  selectedCardId: null,
  packOpeningCard: null,
  pendingLeaderCollection: null,

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setDiceRolling: (rolling) => set({ isDiceRolling: rolling }),
  setMoving: (moving) => set({ isMoving: moving }),
  selectCard: (id) => set({ selectedCardId: id }),
  openPackOpening: (card) => set({ packOpeningCard: card }),
  closePackOpening: () => set({ packOpeningCard: null }),
  setPendingLeaderCollection: (collection) => set({ pendingLeaderCollection: collection }),
}))
```

- [ ] **Step 3: Add `roundNumber` and `lastHypeChangeRound` to `GameState` in `src/types/game.ts`**

Find the `export interface GameState` block and add these two fields after `suppressNextHypeAutoOpen`:

```typescript
  roundNumber: number             // increments each time currentPlayerIndex wraps to 0
  lastHypeChangeRound: number     // round number when hype event last changed; init -1
```

- [ ] **Step 4: Run `npm run build` — expect specific errors only**

```bash
cd "C:\Users\user\Desktop\My_project\FINALS\Game Design\anime-arcana-exchange"
npm run build
```

Expected errors (to be fixed in Tasks 2–4):
- `collectionLeaders` missing in `startGame` player constructor
- `roundNumber` / `lastHypeChangeRound` missing in initial state and `startGame`
- `CATCHUP_DEFICIT` not found in `gameStore.ts`

Any other errors: fix now before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/types/player.ts src/types/game.ts src/stores/uiStore.ts
git commit -m "types: add collectionLeaders, roundNumber/lastHypeChangeRound to GameState, collection-leader-picker modal"
```

---

### Task 2: Economy Engine — Collection Leader ×2 and Stability

**Files:**
- Modify: `src/engine/economy.ts`

The `calculateCardIncome` function needs the `player` to check two new bonuses:
1. **Collection Leader**: if `player.collectionLeaders[card.collection] === card.id` → income ×2
2. **Collection Stability**: if player holds Legendary + Epic of the nerfed collection → ignore the −1

- [ ] **Step 1: Rewrite `src/engine/economy.ts`**

```typescript
import type { Player } from '../types/player'
import type { Card } from '../types/card'
import type { HypeEvent } from '../types/game'
import { LEADER_INCOME_MULT } from '../types/player'

export function calculateCardIncome(card: Card, activeHype: HypeEvent | null, player: Player): number {
  let income = card.income

  // Existing: legendary card 'leader' ability → 1.5× base income
  if (card.ability === 'leader') {
    income = Math.round(income * LEADER_INCOME_MULT)
  }

  // Existing: epic card 'stability' ability → +1 when any hype is active
  if (card.ability === 'stability' && activeHype) {
    income += 1
  }

  // New: Collection Leader designation → this card's income ×2
  if (player.collectionLeaders[card.collection] === card.id) {
    income *= 2
  }

  if (activeHype) {
    if (card.collection === activeHype.buffCollection) {
      income += 1
    } else if (card.collection === activeHype.nerfCollection) {
      // New: Collection Stability — Legendary + Epic of same collection → ignore nerf
      const hasLegendary = player.hand.some(
        (c) => c.collection === card.collection && c.rarity === 'legendary'
      )
      const hasEpic = player.hand.some(
        (c) => c.collection === card.collection && c.rarity === 'epic'
      )
      const hasStability = hasLegendary && hasEpic
      if (!hasStability) {
        income -= 1
      }
    }
  }

  return Math.max(0, income)
}

export function calculateStartIncome(player: Player, activeHype: HypeEvent | null): number {
  return player.hand.reduce((total, card) => total + calculateCardIncome(card, activeHype, player), 0)
}

export function calculateFinalScore(player: Player): number {
  const cardValue = player.hand.reduce((total, card) => {
    let price = card.sellPrice
    if (card.ability === 'leader') {
      price += Math.round(card.income * (LEADER_INCOME_MULT - 1))
    }
    return total + price
  }, 0)
  return player.coins + cardValue
}
```

- [ ] **Step 2: Run `npm run build`**

```bash
npm run build
```

Expected: same errors as Task 1 Step 3 (gameStore still has CATCHUP_DEFICIT and missing collectionLeaders init). No new errors from economy.ts.

- [ ] **Step 3: Commit**

```bash
git add src/engine/economy.ts
git commit -m "engine: calculateCardIncome gains player param — Collection Leader ×2 and Stability nerf bypass"
```

---

### Task 3: Game Store — Init, Black Market Fix, setCollectionLeader, Leader Event

**Files:**
- Modify: `src/stores/gameStore.ts`

Four changes in this file: (a) remove CATCHUP_DEFICIT import, (b) init collectionLeaders in startGame, (c) fix resolveBlackMarket, (d) add setCollectionLeader, (e) replace catch-up with leader-only event in rollAndMove.

- [ ] **Step 1: Fix the import line — remove CATCHUP_DEFICIT; add Collection type**

Find:
```typescript
import { STARTING_COINS, PLAYER_COLORS, HAND_LIMIT, BOOSTER_COST, TAX_AMOUNT, START_PASSES_TO_END, CATCHUP_DEFICIT } from '../types/player'
```
Replace with:
```typescript
import { STARTING_COINS, PLAYER_COLORS, HAND_LIMIT, BOOSTER_COST, TAX_AMOUNT, START_PASSES_TO_END } from '../types/player'
```

Leave `import { determineWinner } from '../engine/scoring'` unchanged — `calculateAllScores` is only needed in `GameScreen.tsx` (Task 7), not here.

Add at the top with other type imports:
```typescript
import type { Collection } from '../types/card'
```

- [ ] **Step 2: Add `collectionLeaders: {}` to the player constructor and `roundNumber`/`lastHypeChangeRound` to `set(...)` in `startGame`**

Find the player constructor inside `startGame` (the `playerNames.map(...)` block):
```typescript
return {
  id: `player-${i}`,
  name,
  color: PLAYER_COLORS[i],
  coins: STARTING_COINS,
  hand: [startCard],
  position: 0,
  startPasses: 0,
  hasInsurance: false,
}
```
Replace with:
```typescript
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
```

Also find the `set({` call inside `startGame` (the one that sets `phase: 'playing'`) and add the two round fields inside it:
```typescript
roundNumber: 0,
lastHypeChangeRound: -1,
```
(Place them after `suppressNextHypeAutoOpen: false`.)

Also add these two fields to the **initial state** object at the very top of `create<GameStore>((set, get) => ({` (alongside `phase: 'menu'`, etc.):
```typescript
roundNumber: 0,
lastHypeChangeRound: -1,
```

- [ ] **Step 3: Add `setCollectionLeader` to the `GameActions` interface**

Find the `interface GameActions` block and add inside it (e.g. after `buyInsurance`):
```typescript
setCollectionLeader: (collection: Collection, cardId: string) => void
```

- [ ] **Step 4: Implement `setCollectionLeader` in the store body**

Add inside `create<GameStore>((set, get) => ({`, after `buyInsurance`:
```typescript
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
  get().addLog(player.id, `${player.name} set ${collection} Collection Leader!`, 'event')
},
```

- [ ] **Step 5: Fix `resolveBlackMarket` — make discard always required for 'card' choice**

Find and replace the entire `resolveBlackMarket` action:

```typescript
resolveBlackMarket: (choice: 'coins' | 'card', discardCardId?: string) => {
  if (forwardIfJoiner({ name: 'resolveBlackMarket', choice, discardCardId })) return
  const state = get()
  const player = state.players[state.currentPlayerIndex]
  const updatedPlayers = [...state.players]

  if (choice === 'coins') {
    updatedPlayers[state.currentPlayerIndex] = { ...player, coins: player.coins + 4 }
    set({ players: updatedPlayers })
    get().addLog(player.id, `${player.name} took 4 coins from the Black Market.`, 'income')
  } else if (choice === 'card' && discardCardId && state.deck.length > 0) {
    const newCard = state.deck[0]
    const newDeck = state.deck.slice(1)
    const discardedCard = player.hand.find((c) => c.id === discardCardId)
    const newHand = [...player.hand.filter((c) => c.id !== discardCardId), newCard]

    updatedPlayers[state.currentPlayerIndex] = { ...player, hand: newHand }
    set({
      players: updatedPlayers,
      deck: newDeck,
      discardPile: discardedCard
        ? [...state.discardPile, discardedCard]
        : state.discardPile,
    })
    get().addLog(
      player.id,
      `${player.name} traded ${discardedCard?.name ?? '?'} for ${newCard.name} at the Black Market.`,
      'buy'
    )
  }
},
```

- [ ] **Step 6: Replace the catch-up block in `rollAndMove` with once-per-round event pick**

The rule: the **first player to pass START in each round** picks from 2 hype events. All subsequent players who pass START that round collect income only — no event change.

A "round" increments each time `currentPlayerIndex` wraps back to 0 (Step 6b below). `lastHypeChangeRound` records which round the event last changed.

Find this entire block inside `rollAndMove` (the comment starts with "// Hype on passing START"):
```typescript
// Hype on passing START — with playtest #8 catch-up: trailing player picks 1 of 2
if (passedStart) {
  const maxOpponentCoins = Math.max(
    ...updatedPlayers.filter((_, i) => i !== state.currentPlayerIndex).map((p) => p.coins),
    0
  )
  const isTrailing = maxOpponentCoins - updatedPlayer.coins >= CATCHUP_DEFICIT
  if (isTrailing) {
    const a = get().drawHypeEvent()
    const b = get().drawHypeEvent()
    const choices = [a, b].filter((e): e is HypeEvent => e !== null)
    if (choices.length > 0) {
      set({ pendingHypeChoices: choices })
      get().addLog('system', `${player.name} is trailing — pick 1 of 2 Hype Events!`, 'event')
    }
  } else {
    const hype = get().drawHypeEvent()
    if (hype) {
      set({ activeHype: hype })
      get().addLog('system', hype.description, 'event')
    }
  }
}
```

Replace with:
```typescript
// Hype on passing START — the FIRST player to pass START in a given round picks from 2
// hype events. All other players who pass START that same round collect income only.
if (passedStart) {
  const isFirstThisRound = state.roundNumber > state.lastHypeChangeRound

  if (isFirstThisRound) {
    const a = get().drawHypeEvent()
    const b = get().drawHypeEvent()
    const choices = [a, b].filter((e): e is HypeEvent => e !== null)
    if (choices.length > 0) {
      set({ pendingHypeChoices: choices, lastHypeChangeRound: state.roundNumber })
      get().addLog('system', `${player.name} passed START first — pick the Hype Event!`, 'event')
    }
  }
  // else: another player already changed the event this round — just collect income
}
```

- [ ] **Step 6b: Increment `roundNumber` in `endTurn` when the last player finishes their turn**

In `endTurn`, find:
```typescript
const nextIndex = (state.currentPlayerIndex + 1) % state.players.length
```

After this line, add:
```typescript
const isEndOfRound = nextIndex === 0
```

Then find the `set({` call at the end of `endTurn` (the one that sets `currentPlayerIndex`) and add:
```typescript
roundNumber: isEndOfRound ? state.roundNumber + 1 : state.roundNumber,
```

- [ ] **Step 7: Run `npm run build` — expect clean build**

```bash
npm run build
```

Expected: clean build. If TypeScript complains about `Collection` type usage or any missing property, fix it before continuing.

- [ ] **Step 8: Add two collection-leader helper functions above the `useGameStore = create(...)` call**

These helpers encapsulate the logic for checking leader unlock/loss after any card change:

```typescript
function openLeaderPicker(collection: Collection) {
  useUIStore.getState().setPendingLeaderCollection(collection)
  useUIStore.getState().openModal('collection-leader-picker')
}

function checkLeaderUnlock(newHand: Card[], oldHand: Card[], leaders: Partial<Record<Collection, string>>): Partial<Record<Collection, string>> {
  const updated = { ...leaders }
  const collections = [...new Set(newHand.map((c) => c.collection))] as Collection[]
  for (const col of collections) {
    const newCount = newHand.filter((c) => c.collection === col).length
    const oldCount = oldHand.filter((c) => c.collection === col).length
    if (newCount >= 4 && oldCount < 4 && !updated[col]) {
      openLeaderPicker(col)
    }
  }
  return updated
}

function checkLeaderOnLoss(newHand: Card[], lostCards: Card[], leaders: Partial<Record<Collection, string>>): Partial<Record<Collection, string>> {
  const updated = { ...leaders }
  for (const lost of lostCards) {
    const col = lost.collection as Collection
    const newCount = newHand.filter((c) => c.collection === col).length
    if (newCount < 4) {
      delete updated[col]
    } else if (updated[col] === lost.id) {
      delete updated[col]
      openLeaderPicker(col)
    }
  }
  return updated
}
```

Also add `import type { Card } from '../types/card'` if not already imported (it already is).

- [ ] **Step 9: Wire `checkLeaderUnlock` into `buyCards`**

In `buyCards`, after `set({ players: updatedPlayers, deck: newDeck })`, replace the existing log calls with:

```typescript
const postBuyPlayer = updatedPlayers[state.currentPlayerIndex]
const updatedLeaders = checkLeaderUnlock(postBuyPlayer.hand, player.hand, player.collectionLeaders)
if (Object.keys(updatedLeaders).length !== Object.keys(player.collectionLeaders).length) {
  const allPlayers = [...updatedPlayers]
  allPlayers[state.currentPlayerIndex] = { ...postBuyPlayer, collectionLeaders: updatedLeaders }
  set({ players: allPlayers })
}
newCards.forEach((card) => {
  get().addLog(player.id, `${player.name} bought ${card.name} (${card.rarity}) for ${BOOSTER_COST}`, 'buy')
})
```

- [ ] **Step 10: Wire `checkLeaderOnLoss` into `sellCards`**

In `sellCards`, find where `updatedPlayers[state.currentPlayerIndex]` is set. Replace:

```typescript
updatedPlayers[state.currentPlayerIndex] = {
  ...player,
  coins: player.coins + totalEarned,
  hand: remainingHand,
}
```

With:

```typescript
const updatedLeaders = checkLeaderOnLoss(remainingHand, soldCards, player.collectionLeaders)
updatedPlayers[state.currentPlayerIndex] = {
  ...player,
  coins: player.coins + totalEarned,
  hand: remainingHand,
  collectionLeaders: updatedLeaders,
}
```

- [ ] **Step 11: Wire `checkLeaderOnLoss` into `payTax` (card method)**

In `payTax`, inside the `else if (cardId)` branch, after `const card = player.hand.find(...)`, replace:

```typescript
updatedPlayers[state.currentPlayerIndex] = {
  ...player,
  hand: player.hand.filter((c) => c.id !== cardId),
}
set({ discardPile: [...state.discardPile, card] })
get().addLog(player.id, `${player.name} discarded ${card.name} to pay tax.`, 'loss')
```

With:

```typescript
const newHand = player.hand.filter((c) => c.id !== cardId)
const updatedLeaders = checkLeaderOnLoss(newHand, card ? [card] : [], player.collectionLeaders)
updatedPlayers[state.currentPlayerIndex] = {
  ...player,
  hand: newHand,
  collectionLeaders: updatedLeaders,
}
set({ discardPile: [...state.discardPile, ...(card ? [card] : [])] })
get().addLog(player.id, `${player.name} discarded ${card?.name ?? '?'} to pay tax.`, 'loss')
```

- [ ] **Step 12: Run `npm run build` — must be clean**

```bash
npm run build
```

No errors expected. Fix any TypeScript issues before committing.

- [ ] **Step 13: Commit**

```bash
git add src/stores/gameStore.ts
git commit -m "store: fix Black Market forced trade, leader-only hype event, collection leader gain/loss hooks"
```

---

### Task 4: Black Market Modal — Forced Trade UI

**Files:**
- Modify: `src/components/modals/TileActionModals.tsx`

The store already enforces the rule. This task updates the UI to match: rename the button, make discard mandatory (no optional path), disable when hand is empty.

- [ ] **Step 1: Replace the `BlackMarketModal` function in `TileActionModals.tsx`**

Find the `// Black Market Modal` comment and the `export function BlackMarketModal()` that follows. Replace the entire function with:

```tsx
// Black Market Modal — forced 1-for-1 trade
export function BlackMarketModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const resolveBlackMarket = useGameStore((s) => s.resolveBlackMarket)
  const resolveTileAction = useGameStore((s) => s.resolveTileAction)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const [phase, setPhase] = useState<'choose' | 'trade'>('choose')
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null)

  const player = players[currentPlayerIndex]
  const canTrade = player.hand.length > 0

  const handleClose = () => {
    setPhase('choose')
    setSelectedDiscard(null)
    closeModal()
    resolveTileAction()
  }

  return (
    <Modal
      isOpen={activeModal === 'black-market'}
      onClose={handleClose}
      title="🕶️ Black Market"
      mandatory
    >
      <div className="space-y-4 text-center">
        {phase === 'choose' && (
          <>
            <p className="text-sm text-slate-400">Choose your deal:</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="gold"
                onClick={() => { resolveBlackMarket('coins'); handleClose() }}
              >
                Take +4 💰
              </Button>
              <Button
                variant="primary"
                onClick={() => setPhase('trade')}
                disabled={!canTrade}
              >
                Trade a Card 🔄
              </Button>
            </div>
            {!canTrade && (
              <p className="text-xs text-slate-500 italic">
                No cards in hand — trade option unavailable.
              </p>
            )}
          </>
        )}

        {phase === 'trade' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">Select a card to trade away:</p>
            <p className="text-xs text-slate-500">
              You'll receive a random card from the deck in return.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {player.hand.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  size="sm"
                  selected={selectedDiscard === card.id}
                  onClick={() => setSelectedDiscard(card.id)}
                />
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => { setPhase('choose'); setSelectedDiscard(null) }}
              >
                Back
              </Button>
              <Button
                variant="danger"
                disabled={!selectedDiscard}
                onClick={() => {
                  resolveBlackMarket('card', selectedDiscard!)
                  handleClose()
                }}
              >
                Confirm Trade
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Start dev server and verify Black Market in browser**

```bash
npm run dev
```

Test checklist:
1. Land on Black Market tile with an empty hand → "Trade a Card" button is greyed out / disabled.
2. Land with cards in hand → both buttons are active.
3. Click "Trade a Card" → hand cards appear; no card selected → "Confirm Trade" disabled.
4. Select a card → "Confirm Trade" enabled → click → the selected card leaves hand, a new card appears.
5. Verify event log shows "traded X for Y".
6. Click "+4 💰" → coins increase by 4, no card change.

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/TileActionModals.tsx
git commit -m "feat: Black Market modal — forced 1-for-1 trade, disabled when hand is empty"
```

---

### Task 5: HypeChoiceModal — Update Text for First-Past-START Mechanic

**Files:**
- Modify: `src/components/modals/HypeChoiceModal.tsx`

The modal already handles the 2-choice pick flow correctly. Just update the title and subtitle from "catch-up" framing to "first past START" framing. The 👑 crown has nothing to do with this — it is a score-leader badge only.

- [ ] **Step 1: Update title and subtitle in `HypeChoiceModal.tsx`**

Find:
```tsx
<h2 className="text-3xl font-black text-white mt-2">Catch-up Hype Pick!</h2>
<p className="text-slate-300 text-sm mt-1">
  You're trailing — pick the hype event that helps you most.
</p>
```

Replace with:
```tsx
<h2 className="text-3xl font-black text-white mt-2">🔥 Set the Hype!</h2>
<p className="text-slate-300 text-sm mt-1">
  You're the first past START this round — pick the next Hype Event.
</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/HypeChoiceModal.tsx
git commit -m "ui: HypeChoiceModal — update title/text for leader-picks mechanic"
```

---

### Task 6: Collection Leader Picker Modal

**Files:**
- Create: `src/components/modals/CollectionLeaderModal.tsx`
- Modify: `src/components/screens/GameScreen.tsx`

New modal that appears when a player first reaches ≥4 cards from a collection (or loses their designated leader card while still holding ≥4). Shows the eligible cards; clicking one designates it as Collection Leader (income ×2).

- [ ] **Step 1: Create `src/components/modals/CollectionLeaderModal.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { GameCard } from '../cards/GameCard'
import { COLLECTION_CONFIG } from '../../types/card'
import type { Collection } from '../../types/card'

export function CollectionLeaderModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const pendingLeaderCollection = useUIStore((s) => s.pendingLeaderCollection)
  const setPendingLeaderCollection = useUIStore((s) => s.setPendingLeaderCollection)
  const closeModal = useUIStore((s) => s.closeModal)
  const setCollectionLeader = useGameStore((s) => s.setCollectionLeader)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)

  const player = players[currentPlayerIndex]
  const collection = pendingLeaderCollection as Collection | null

  const collectionCards = collection
    ? player.hand.filter((c) => c.collection === collection)
    : []

  const cfg = collection ? COLLECTION_CONFIG[collection] : null

  if (activeModal !== 'collection-leader-picker' || !collection || !cfg) return null

  const handlePick = (cardId: string) => {
    setCollectionLeader(collection, cardId)
    setPendingLeaderCollection(null)
    closeModal()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur z-[60]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[61] flex items-center justify-center px-6"
      >
        <div
          className="rounded-3xl p-8 max-w-2xl w-full"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}16, rgba(15,23,42,0.97))`,
            border: `1px solid ${cfg.color}44`,
            boxShadow: `0 0 60px ${cfg.color}28`,
          }}
        >
          <div className="text-center mb-6">
            <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: cfg.color }} />
            <h2 className="text-2xl font-black text-white">Collection Leader!</h2>
            <p className="text-slate-300 text-sm mt-1">
              You have 4+{' '}
              <span style={{ color: cfg.color }} className="font-bold">
                {cfg.label}
              </span>{' '}
              cards. Pick one as Leader — its income is doubled.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {collectionCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handlePick(card.id)}
                className="cursor-pointer text-center"
              >
                <GameCard card={card} size="md" />
                <p className="text-xs text-amber-300 mt-1 font-bold">
                  {card.income}🪙 → {card.income * 2}🪙
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
```

- [ ] **Step 2: Mount `CollectionLeaderModal` in `GameScreen.tsx`**

Add import at the top of `src/components/screens/GameScreen.tsx`:
```tsx
import { CollectionLeaderModal } from '../modals/CollectionLeaderModal'
```

In the JSX, add `<CollectionLeaderModal />` directly after `<HypeChoiceModal />`:
```tsx
<HypeChoiceModal />
<CollectionLeaderModal />
```

- [ ] **Step 3: Run `npm run build`**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Verify in browser**

1. Start a game, buy packs until you have 4 cards from the same collection (e.g. 4× Shadow Sorcery).
2. The Collection Leader Picker modal appears automatically.
3. Click any card — modal closes, a 👑 appears in the collection indicator (next task) and the log shows "set X Collection Leader!".
4. Sell a card from that collection (dropping to 3) → no modal (leader cleared automatically).
5. Buy back to 4 of that collection → modal reappears since no leader is set.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/CollectionLeaderModal.tsx src/components/screens/GameScreen.tsx
git commit -m "feat: Collection Leader Picker modal — designate leader card for ×2 income"
```

---

### Task 7: PlayerHUD — Collection Indicator + Leader Badge

**Files:**
- Modify: `src/components/hud/PlayerHUD.tsx`
- Modify: `src/components/screens/GameScreen.tsx`

Add the per-collection breakdown row (base income, hype total, badges) and the 👑 leader badge to PlayerHUD. GameScreen computes who the current leader is and passes `isLeader` + `activeHype` down.

- [ ] **Step 1: Rewrite `src/components/hud/PlayerHUD.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Coins, CreditCard, Shield, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Panel } from '../ui/Panel'
import { PlayerPiece } from '../board/PlayerPiece'
import type { Player } from '../../types/player'
import { BOARD_TILES, START_PASSES_TO_END } from '../../data/board'
import { COLLECTION_CONFIG } from '../../types/card'
import type { Collection } from '../../types/card'
import type { HypeEvent } from '../../types/game'
import { useUIStore } from '../../stores/uiStore'
import { useGameStore } from '../../stores/gameStore'
import { START_PASSES_TO_END as PASSES_TO_END } from '../../types/player'

interface PlayerHUDProps {
  player: Player
  isActive: boolean
  isLeader?: boolean
  compact?: boolean
  activeHype?: HypeEvent | null
}

export function PlayerHUD({ player, isActive, isLeader, compact, activeHype }: PlayerHUDProps) {
  const currentTile = BOARD_TILES[player.position]
  const openModal = useUIStore((s) => s.openModal)
  const setPendingLeaderCollection = useUIStore((s) => s.setPendingLeaderCollection)
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const isCurrentPlayer = players[currentPlayerIndex]?.id === player.id

  // Build collection breakdown
  type CollGroup = {
    collection: Collection
    count: number
    baseIncome: number
    hypeImpact: number
    hasStability: boolean
    hasLeader: boolean
  }

  const seen = new Set<Collection>()
  const collectionGroups: CollGroup[] = []

  for (const card of player.hand) {
    const col = card.collection as Collection
    if (seen.has(col)) continue
    seen.add(col)

    const cards = player.hand.filter((c) => c.collection === col)
    const hasLegendary = cards.some((c) => c.rarity === 'legendary')
    const hasEpic = cards.some((c) => c.rarity === 'epic')
    const hasStability = hasLegendary && hasEpic

    let hypeImpact = 0
    if (activeHype) {
      if (col === activeHype.buffCollection) {
        hypeImpact = cards.length
      } else if (col === activeHype.nerfCollection && !hasStability) {
        hypeImpact = -cards.length
      }
    }

    collectionGroups.push({
      collection: col,
      count: cards.length,
      baseIncome: cards.reduce((s, c) => s + c.income, 0),
      hypeImpact,
      hasStability,
      hasLeader: !!player.collectionLeaders[col],
    })
  }

  const handleCollectionClick = (col: Collection, count: number) => {
    if (!isCurrentPlayer || count < 4) return
    setPendingLeaderCollection(col)
    openModal('collection-leader-picker')
  }

  return (
    <motion.div layout>
      <Panel
        className={cn(
          'p-3 transition-all',
          isActive && 'ring-2 shadow-lg',
          compact && 'p-2'
        )}
        style={{
          '--tw-ring-color': isActive ? player.color : 'transparent',
          boxShadow: isActive ? `0 0 20px ${player.color}30` : undefined,
        } as React.CSSProperties}
        glow={isActive}
      >
        {/* Name row */}
        <div className="flex items-center gap-2 mb-2">
          <PlayerPiece color={player.color} size="sm" spinning={isActive} />
          <span className={cn('font-bold text-sm', isActive ? 'text-white' : 'text-slate-300')}>
            {player.name}
          </span>
          {isLeader && (
            <span className="text-base leading-none" title="Score leader">👑</span>
          )}
          {isActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] bg-game-accent/30 text-indigo-300 px-1.5 py-0.5 rounded-full ml-auto"
            >
              TURN
            </motion.span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-yellow-400">
            <Coins size={12} />
            <span className="font-bold">{player.coins}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <CreditCard size={12} />
            <span>{player.hand.length}/8</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={12} />
            <span className="truncate">{currentTile?.label}</span>
          </div>
          {player.hasInsurance && (
            <div className="flex items-center gap-1 text-cyan-400">
              <Shield size={12} />
              <span>Insured</span>
            </div>
          )}
        </div>

        {/* Collection indicator */}
        {collectionGroups.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {collectionGroups.map((group) => {
              const cfg = COLLECTION_CONFIG[group.collection]
              const clickable = isCurrentPlayer && group.count >= 4
              return (
                <div
                  key={group.collection}
                  onClick={() => handleCollectionClick(group.collection, group.count)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] rounded px-1 py-0.5',
                    clickable && 'cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors'
                  )}
                  title={clickable ? 'Click to change Collection Leader' : undefined}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-slate-300 flex-1 min-w-0 truncate">
                    {cfg.label.split(' ')[0]}
                  </span>
                  <span className="text-slate-500">×{group.count}</span>
                  <span className="text-slate-400 ml-0.5">{group.baseIncome}🪙</span>
                  {group.hypeImpact > 0 && (
                    <span className="text-green-400 font-bold">+{group.hypeImpact}</span>
                  )}
                  {group.hypeImpact < 0 && (
                    <span className="text-red-400 font-bold">{group.hypeImpact}</span>
                  )}
                  {group.hasStability && activeHype?.nerfCollection === group.collection && (
                    <span title="Stability — hype nerf ignored">🛡</span>
                  )}
                  {group.hasLeader && (
                    <span title="Collection Leader active — one card earns ×2">👑</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* START-pass progress bar */}
        <div className="mt-2 flex gap-0.5">
          {Array.from({ length: PASSES_TO_END }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                i < player.startPasses
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                  : 'bg-slate-700/60'
              )}
            />
          ))}
        </div>
      </Panel>
    </motion.div>
  )
}
```

- [ ] **Step 2: Update `GameScreen.tsx` — compute leader, pass `isLeader` and `activeHype` to PlayerHUD**

Add import at the top of `src/components/screens/GameScreen.tsx`:
```tsx
import { calculateAllScores } from '../../engine/scoring'
```

Inside the `GameScreen` function body, before the `return`, add:
```tsx
const leaderPlayerId = players.length > 0 ? calculateAllScores(players)[0]?.playerId : null
```

Find the `{players.map((player, i) => (` block and update `<PlayerHUD>`:
```tsx
{players.map((player, i) => (
  <PlayerHUD
    key={player.id}
    player={player}
    isActive={i === currentPlayerIndex}
    isLeader={player.id === leaderPlayerId}
    activeHype={activeHype}
    compact
  />
))}
```

- [ ] **Step 3: Fix the duplicate `START_PASSES_TO_END` import in PlayerHUD if TypeScript complains**

The rewritten PlayerHUD imports `START_PASSES_TO_END` from both `../../data/board` and `../../types/player`. Remove the `../../data/board` one — it does not export `START_PASSES_TO_END`. The correct import line should be:

```tsx
import { BOARD_TILES } from '../../data/board'
import { START_PASSES_TO_END } from '../../types/player'
import { COLLECTION_CONFIG } from '../../types/card'
```

Remove the `PASSES_TO_END` alias — just use `START_PASSES_TO_END` directly in the JSX:
```tsx
{Array.from({ length: START_PASSES_TO_END }).map((_, i) => (
```

- [ ] **Step 4: Run `npm run build` — must be clean**

```bash
npm run build
```

Fix any TypeScript errors before committing.

- [ ] **Step 5: Start dev server and verify everything in browser**

```bash
npm run dev
```

Full feature verification:
1. **Leader badge**: Player with more coins + card value shows 👑 in their HUD card. Badge moves when the other player overtakes.
2. **Collection indicator**: Buy 2 Shadow Sorcery cards → "Shadow ×2 2🪙" row appears. Buy more → count updates.
3. **Hype impact**: After a hype event sets Shadow Sorcery as buff, with 3 Shadow cards → indicator shows "+3" in green. With 2 nerfed Shinobi cards → shows "-2" in red.
4. **Stability badge**: Hold Legendary + Epic of same collection when nerf applies → "🛡" shown instead of red number.
5. **Leader badge in indicator**: Hold ≥4 of a collection, designate leader → "👑" appears on that collection row.
6. **Clickable row**: With ≥4 cards in one collection, clicking the collection row (as the active player) reopens the picker to change leader.
7. **Leader event**: Score leader passes START → "Leader's Choice!" modal with 2 hype options. Non-leader passes START → just income, no modal.

- [ ] **Step 6: Commit**

```bash
git add src/components/hud/PlayerHUD.tsx src/components/screens/GameScreen.tsx
git commit -m "feat: collection indicator with hype totals and badges, leader badge in PlayerHUD"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Black Market forced discard — 'card' always requires discardCardId | Task 3 Step 5 |
| "Trade a Card" button disabled when hand empty | Task 4 Step 1 |
| Collection Leader (≥4 cards → choose one → income ×2) | Tasks 2, 3 Steps 3–4, 6 |
| Collection Stability (Legendary + Epic → ignore nerf) | Task 2 Step 1 |
| Collection indicator: base income per collection | Task 7 Step 1 |
| Collection indicator: hype total (+N / -N) | Task 7 Step 1 |
| Collection indicator: 🛡 when Stability active | Task 7 Step 1 |
| Collection indicator: 👑 when leader active | Task 7 Step 1 |
| Collection indicator: clickable to change leader when ≥4 | Task 7 Step 1 |
| Collection Leader Picker modal | Task 6 |
| Hype event changes once per round — first player to pass START picks from 2 | Task 3 Step 6 |
| `roundNumber` increments in `endTurn` at end of each round | Task 3 Step 6b |
| `lastHypeChangeRound` prevents second player from changing event same round | Task 3 Step 6 |
| Remove catch-up mechanic | Task 3 Step 6 |
| Remove CATCHUP_DEFICIT constant | Task 1 Step 1 |
| `roundNumber`/`lastHypeChangeRound` added to GameState type | Task 1 Step 3 |
| 👑 badge = purely visual score-leader indicator on PlayerHUD | Task 7 Steps 1–2 |
| HypeChoiceModal text updated — "First Past START" framing, not leader | Task 5 |
| Leader card loss → clear designation + reopen picker if ≥4 remain | Task 3 Step 8 + Steps 10–11 |

All spec requirements covered. ✓
