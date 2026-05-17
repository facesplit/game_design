# Design Spec: Black Market · Collection Indicator · Leader Round Event

**Date:** 2026-05-17  
**Game:** Anime Arcana Exchange  
**Status:** Approved

---

## 1. Black Market — Mandatory 1-for-1 Swap

### Problem
Current behaviour allows drawing a card from the Black Market without discarding anything if the player has hand space. This creates a free card path that breaks economic balance.

### Rule Change
| Option | Before | After |
|--------|--------|-------|
| Take coins | +4 coins | unchanged |
| Draw a card | Draw top of deck; optionally discard 1 | **Must** discard 1 card from hand first, then draw top of deck |

- "Trade a Card" button is **disabled** when the player's hand is empty.
- The discard is not optional — confirm button stays disabled until a card is selected.

### Code Changes
- `BlackMarketModal.tsx`: rename button to "Trade a Card", require card selection (no optional path), disable button when `player.hand.length === 0`.
- `gameStore.ts resolveBlackMarket`: remove the `if (discardCardId)` guard for `choice === 'card'` — discard is always required.

---

## 2. Collection Indicator + New Collection Bonus Rules

### Two New Game Rules

#### 2a. Collection Leader
- **Trigger:** Player holds ≥4 cards from a single collection.
- **Bonus:** Player designates one of those cards as the **Collection Leader** → that card's income is ×2.
- **Constraints:** Only one Leader per collection per player. Designation can be changed via a **Collection Leader Picker modal** (new modal, opened by clicking the collection row in the HUD when ≥4 cards of that collection). The modal shows all cards from that collection in hand; clicking one sets it as Leader, closing the modal.
- **Loss (card count):** If the player drops below 4 cards of that collection (sold, raided, chance), the Leader designation for that collection is cleared automatically.
- **Loss (leader card itself):** If the specifically designated Leader card leaves the hand (sold, raided, taken), the designation is cleared. If the player still holds ≥4 of that collection after the loss, a new picker opens automatically.

#### 2b. Collection Stability
- **Trigger:** Player holds both the **Legendary** and the **Epic** of the same collection simultaneously.
- **Bonus:** The Hype Event nerf (-1 income per card) for that collection is completely **ignored** while the player holds both cards.
- **Loss:** Selling or losing either the Legendary or the Epic removes the Stability bonus immediately.

### Collection Indicator (PlayerHUD)

Placed between the stats grid and the START-pass progress bar dots.

**Layout per row:**
```
[●color] CollShortName  ×N  Base: X🪙  Hype: +N / -N  [👑] [🛡]
```

- **●color** — collection colour dot from `COLLECTION_CONFIG`
- **×N** — card count from that collection in hand
- **Base: X🪙** — sum of `card.income` for all cards of that collection (before hype, without Collection Leader ×2)
- **Hype: +N / -N** — total hype impact: `cardCount × (+1 or -1)` based on active hype; hidden if collection is not affected; shown as `🛡` instead if Stability is active
- **👑** — shown if Collection Leader is active on this collection
- **[no badge]** — if no bonus is active

**Example with active hype (Shadow Sorcery buffed, Shinobi nerfed):**
```
[cyan]  Shadow  ×4   Base: 10🪙   Hype: +4    👑
[orange] Shinobi ×2  Base: 4🪙    Hype: -2
[yellow] Bizarre ×3  Base: 6🪙                🛡
```

### Code Changes

**Types (`src/types/player.ts`):**
- Add `collectionLeaders: Partial<Record<Collection, string>>` to `Player` (maps collection → card id of designated leader).
- Initialize to `{}` in `startGame`.

**Engine (`src/engine/economy.ts`):**
- `calculateCardIncome(card, activeHype, player)` — add `player` parameter:
  - After existing `leader`/`stability` ability checks, add Collection Leader: if `player.collectionLeaders[card.collection] === card.id` → `income *= 2`.
  - Hype nerf branch: check Collection Stability. If player holds both legendary and epic of `card.collection`, skip the `-1`. Otherwise apply normally.
- `calculateStartIncome(player, activeHype)` — pass `player` to each `calculateCardIncome` call.

**Store (`src/stores/gameStore.ts`):**
- Add action `setCollectionLeader(collection: Collection, cardId: string)`.
- After any card gain (buyCards, resolveBlackMarket, resolveChance take-card, resolveAuction) — check if player now has ≥4 of any collection and no leader set for it → call `useUIStore.getState().openModal('collection-leader-picker')` and store the pending collection in `uiStore` so the picker knows which collection to show.
- After any card loss — if collection drops below 4 → clear `collectionLeaders[collection]`. If lost card was the Leader card and count still ≥4 → also open the picker for a new choice.

**Component (`src/components/hud/PlayerHUD.tsx`):**
- Compute collection groups from `player.hand` grouped by `card.collection`.
- For each group compute: count, base income sum, hype impact total, has leader, has stability.
- Render compact rows as described above.
- On row click (if count ≥4): open a picker modal to choose/change Collection Leader.

---

## 3. Leader-only Round Event (Bug Fix + Design Change)

### Problem
Currently every player who passes START draws and applies a new hype event. This makes the event change unpredictably and gives every player equal influence over the meta.

### Rule Change
| Player type | Passes START — Before | Passes START — After |
|-------------|----------------------|---------------------|
| Leader (highest score) | Draws 1 hype event automatically | **Picks from 2 hype events** |
| Trailing (≥15 behind) | Picks from 2 hype events (catch-up) | Just income, no event |
| Middle player | Draws 1 hype event automatically | Just income, no event |

**Leader definition:** Player with the highest total score = `coins + sum(card.sellPrice)` at the moment of passing START, computed with `calculateAllScores()`.

**"Once per round"** is automatically guaranteed — a player can only pass START once per lap (22-tile board).

The old **catch-up mechanic is removed**. The leader now holds strategic power over the meta.

### Leader Indicator
- A **👑 badge** is displayed on the active leader's `PlayerHUD` card.
- The badge updates reactively whenever scores change.

### Code Changes

**`src/stores/gameStore.ts rollAndMove`:**

Replace the existing `isTrailing` / catch-up block with:
```
const scores = calculateAllScores(updatedPlayers)
const leaderId = scores[0].playerId
const isLeader = updatedPlayer.id === leaderId

if (isLeader) {
  const a = get().drawHypeEvent()
  const b = get().drawHypeEvent()
  const choices = [a, b].filter((e): e is HypeEvent => e !== null)
  if (choices.length > 0) {
    set({ pendingHypeChoices: choices })
    get().addLog('system', `${player.name} leads — pick a Hype Event!`, 'event')
  }
}
// non-leaders: no event, only income
```

Remove `CATCHUP_DEFICIT` constant from `player.ts` (no longer used).

**`src/components/hud/PlayerHUD.tsx`:**
- Accept `isLeader: boolean` prop (or compute from scores passed from parent).
- Render 👑 badge next to player name when `isLeader`.

**`src/components/screens/GameScreen.tsx`:**
- Compute leader id via `calculateAllScores` and pass `isLeader` down to each `PlayerHUD`.

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `src/types/player.ts` | Add `collectionLeaders` field; remove `CATCHUP_DEFICIT` |
| `src/types/card.ts` | No change |
| `src/engine/economy.ts` | `calculateCardIncome` gains `player` param; Collection Leader ×2; Stability nerf bypass |
| `src/stores/gameStore.ts` | Black Market forced discard; `setCollectionLeader` action; leader-only hype event; remove catch-up |
| `src/components/hud/PlayerHUD.tsx` | Collection indicator section; 👑 leader badge |
| `src/components/screens/GameScreen.tsx` | Compute + pass `isLeader` to PlayerHUD |
| `src/components/modals/TileActionModals.tsx` | Black Market modal: force discard, disable button |
| `src/components/modals/CollectionLeaderModal.tsx` | New modal: picker for designating Collection Leader |
| `src/stores/uiStore.ts` | Add `pendingLeaderCollection: Collection \| null` for picker context |
