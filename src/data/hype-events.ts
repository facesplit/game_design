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
