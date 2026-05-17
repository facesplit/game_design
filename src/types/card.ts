export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Collection =
  | 'shadow-sorcery'
  | 'shinobi-legends'
  | 'bizarre-arcana'
  // Mocked collections — drop in your own art/names later. Disabled by default
  // (see ENABLED_COLLECTIONS in src/data/cards.ts) so the balanced 30-card deck
  // remains the default until you opt in.
  | 'demon-slayers'
  | 'hunter-trials'
  | 'stellar-magus'

export type CardAbility = 'leader' | 'stability' | null

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

export const RARITY_CONFIG: Record<Rarity, { income: number; sellPrice: number; label: string }> = {
  common: { income: 1, sellPrice: 2, label: 'Common' },
  rare: { income: 2, sellPrice: 3, label: 'Rare' },
  epic: { income: 4, sellPrice: 6, label: 'Epic' },
  legendary: { income: 6, sellPrice: 10, label: 'Legendary' },
}

export const COLLECTION_CONFIG: Record<Collection, { label: string; color: string }> = {
  'shadow-sorcery': { label: 'Shadow Sorcery', color: '#06b6d4' },
  'shinobi-legends': { label: 'Shinobi Legends', color: '#f97316' },
  'bizarre-arcana': { label: 'Bizarre Arcana', color: '#eab308' },
  // Mock collections (placeholder colors — easy to recolor on art delivery)
  'demon-slayers': { label: 'Demon Slayers', color: '#10b981' },
  'hunter-trials': { label: 'Hunter Trials', color: '#84cc16' },
  'stellar-magus': { label: 'Stellar Magus', color: '#e11d48' },
}
