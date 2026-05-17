import type { ChanceCard } from '../types/game'

// Playtest fix #7: "Give card" was strictly stronger than +/-3 coins; restrict to common/rare
// Playtest fix #7 also: "Take card" was too punishing; restrict to common/rare
export const CHANCE_CARDS: ChanceCard[] = [
  { id: 'ch-01', type: 'gain-coins', description: '+3 coins! Lucky find!', value: 3 },
  { id: 'ch-02', type: 'gain-coins', description: '+3 coins! Sponsor bonus!', value: 3 },
  { id: 'ch-03', type: 'gain-coins', description: '+2 coins! Side hustle pays out!', value: 2 },
  { id: 'ch-04', type: 'lose-coins', description: '-3 coins! Equipment tax!', value: 3 },
  { id: 'ch-05', type: 'lose-coins', description: '-2 coins! Broken seal!', value: 2 },
  { id: 'ch-06', type: 'take-card', description: 'Take 1 Common/Rare card from an opponent!' },
  { id: 'ch-07', type: 'give-card', description: 'Give 1 Common/Rare card to an opponent!' },
]
