# Balance Rationale — Anime Arcana Exchange v2

This document explains *why* each tunable lives where it does. Every number
below is a deliberate choice, not a guess. When you tweak something, update the
matching section so the next person knows the trade-off.

---

## 1. Game length: `START_PASSES_TO_END = 4`

**Source:** Playtest report — half the survey respondents called the game
"too long" at 6 START passes (avg 43 min, max 55 min).

**Math:**
- Average dice = 3.5; board = 22 tiles ⇒ 1 lap = 22/3.5 ≈ 6.3 turns.
- 4 laps × 6.3 = 25.2 turns per player.
- Per-turn human time observed in playtest: 35–55 s.
- **Projection: 4 passes × 6.3 turns × 45 s ≈ 19 min per player**, total
  20–25 min for a 2-player session — right inside the user's stated comfort
  band (15–25 min).

**Dial it back to 6** if a future expansion adds more cards (more progression
needs more laps); **drop to 3** for a "blitz" mode.

---

## 2. Leader ability: `LEADER_INCOME_MULT = 1.5`

**Source:** Playtest finding — "early-Legendary predicts winner" rate was 60%
with the original 2× multiplier.

**Math (rounded to integers):**
| Rarity | Income (no Leader) | Leader 2× (old) | Leader 1.5× (new) |
|---|---|---|---|
| Epic | 4 | 8 | 6 |
| Legendary | 6 | 12 | 9 |

A 9-income Legendary collected on turn 3 yields ~36 extra coins by lap 4 vs. a
non-Leader card; a 12-income Legendary yielded ~48 (≈ 33% bigger lead). The
1.5× target is to push the predict-win rate into the 35–40 % zone — strong but
not deterministic.

**Sell-price bonus** also uses `(income × 0.5)` so the Leader's value at scoring
time scales the same way.

---

## 3. Legendary gate (until first START pass)

**Source:** Same finding as #2. Even with a 1.5× Leader, drawing one on turn 2
is still a strong head start.

**Mechanic:** if **every** player has `startPasses === 0`, BUY PACK swaps any
top-of-deck Legendary with the deepest non-Legendary. Once a player completes a
lap, the deck behaves normally.

**Rationale:** the first lap is "exploration" — no one has any economy yet, so a
Legendary draw amplifies a random advantage. After lap 1 every player has
~6–10 coins of starting income, so a Legendary is impactful but not decisive.

**Edge case:** the starting card (1 random card at setup) is **not** gated. A
1/30 chance of a starting Legendary across 4 players ≈ 12 % is mild, and giving
all four a guaranteed common-only start would feel scripted.

---

## 4. Hand limit: `HAND_LIMIT = 8`

**Source:** Stayed from v1 — playtest never flagged the cap.

**Math:** 8 cards × max sell value (10 for legendary) = 80 coins ceiling. Combined
with ~30 income coins per lap × 4 laps = ~120 coin liquidity, the deck never
clogs hand-management decisions.

---

## 5. Economy: starting coins, BUY PACK cost, TAX

| Tunable | Value | Why |
|---|---|---|
| `STARTING_COINS` | 10 | Lets a player BUY twice or BUY+SELL once on lap 1. |
| `BOOSTER_COST` | 3 | One booster = 1 turn of income from a Common (×3 turns to break even). |
| `TAX_AMOUNT` | 5 | 5 coins ≈ value of 1.5 Common cards → "pay coins" and "discard 1 Rare" feel comparable. |

**TAX choice symmetry:** with a 2-coin Common sell price, paying 5 coins ≈
discarding 2 Commons. The "pay coins" path is mildly preferable when ahead;
"discard card" is preferable when broke. Keeps the tile a real decision.

---

## 6. RAID ZONE outcomes (1-3 / 4-5 / 6)

**Old expected loss per visit:**
- 1-3: −3 coins → 50 %
- 4-5: −1 card → 33 %
- 6: nothing → 17 %

**Average loss per visit ≈ 1.5 coins + 0.33 cards.**
With 2/22 raid tiles and 22 turns/lap, that's 2 visits/lap → ~3 coins + 0.66
cards lost per lap. Fits the "annoying but not crippling" target.

**Insurance break-even:** Pay 3 coins, save expected 1.5 coins from the next
raid = net −1.5 coins on average. Worth it only when you hold high-value cards
at risk → makes Insurance a *strategic* purchase, not a flat upgrade.

---

## 7. Chance deck (v2 distribution)

| Card | Count | Reasoning |
|---|---|---|
| +3 coins | 2 | Most common positive outcome; small enough to not swing late game. |
| +2 coins | 1 | Adds variance without inflating economy. |
| −3 coins | 1 | Symmetric punishment. |
| −2 coins | 1 | Soft punishment (felt unfair to playtester). |
| Take card | 1 | Restricted to Common/Rare (playtest fix #7) — strongest positive but no longer game-deciding. |
| Give card | 1 | Same restriction — keeps the social tension. |

**Old distribution had 8 cards with 2× take-card and 2× give-card** — ratio of
50 % "card transfer" was perceived as far too punishing per session 5's outcome.
The new ratio is 28 %.

---

## 8. Auction: sealed-bid

**Why not open bidding:** with 2 players, an open ascending bid trivially
collapses to "+1 coin over the opponent" → 8/10 playtest sessions degraded to
"minimum-bid convention". Sealed-bid is a single decision per player with no
information leak, so it works at any player count.

**Tie rule:** highest bid wins; identical highest bids resolved by player
order. Documented in the game-rules.md so this isn't surprising.

---

## 9. Catch-up mechanic: pick 1 of 2 Hype Events

**Trigger:** at START pass, if max(opponents.coins) − you.coins ≥ 15.

**Why 15 coins:** matches the "snowball detected" threshold from the playtest —
that's roughly 1 Legendary lead, or 2-3 Hype Events of bad luck.

**Why "pick 1 of 2 Hype Events" rather than coins:** giving the trailing player
direct coins feels like welfare and breaks the simulation. Letting them choose
the next economy weather lets a smart trailing player out-think a lucky leader.
The unchosen event returns to the queue, so no card is wasted.

---

## 10. Hype Events

6 events, each pairing a buff and nerf among the 3 collections — every
combination represented exactly once. Income changes are ±1 (small enough that
a single Common buffed = 2 income, not double; a Legendary buffed = 7 instead
of 6). Stability ability adds another +1 *while* a hype is active, capping the
Stability bonus at one collection's worth.

---

## 11. Mock collections (disabled by default)

Three placeholder collections (`demon-slayers`, `hunter-trials`,
`stellar-magus`) are defined in `src/data/cards.ts` but excluded from
`ENABLED_COLLECTIONS`. Default deck stays at 30 cards (3 collections × 10) so
the balance numbers above remain valid.

**Effect of enabling more collections:**
- More collections ⇒ same hand-limit, but Hype Events should expand to cover
  the new buffs/nerfs, OR the catch-up mechanic should weight by collection count.
- More legendaries in deck ⇒ longer Legendary gate before they appear.

If you opt in a 4th collection, also add 4 more Hype Events (one buffing the
new collection vs. each existing one) to keep buff/nerf pairing symmetric.
