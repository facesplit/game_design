import type { Card, Collection, Rarity } from '../types/card'

// Shadow Sorcery artwork
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

// Shinobi Legends artwork
import gaara from '../assets/cards/shinobi-legends/gaara.png'
import rockLee from '../assets/cards/shinobi-legends/rock-lee.png'
import hinata from '../assets/cards/shinobi-legends/hinata.png'
import sakura from '../assets/cards/shinobi-legends/sakura.png'
import sai from '../assets/cards/shinobi-legends/sai.png'
import naruto from '../assets/cards/shinobi-legends/naruto.png'
import sasuke from '../assets/cards/shinobi-legends/sasuke.png'
import kakashi from '../assets/cards/shinobi-legends/kakashi.png'
import itachi from '../assets/cards/shinobi-legends/itachi.png'
import madara from '../assets/cards/shinobi-legends/madara.png'

// Bizarre Arcana artwork
import joseph from '../assets/cards/bizarre-arcana/joseph.png'
import abdul from '../assets/cards/bizarre-arcana/abdul.png'
import iggy from '../assets/cards/bizarre-arcana/iggy.png'
import polnareff from '../assets/cards/bizarre-arcana/polnareff.png'
import jotaro from '../assets/cards/bizarre-arcana/jotaro.png'
import diavolo from '../assets/cards/bizarre-arcana/diavolo.png'
import kira from '../assets/cards/bizarre-arcana/kira.png'
import gyro from '../assets/cards/bizarre-arcana/gyro.png'
import pucci from '../assets/cards/bizarre-arcana/pucci.png'
import dio from '../assets/cards/bizarre-arcana/dio.png'

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

// Shinobi Legends (Наруто) — 10 cards
const shinobiLegends: Card[] = [
  makeCard('sl-01', 'Гаара', 'shinobi-legends', 'common', null, gaara),
  makeCard('sl-02', 'Рок Ли', 'shinobi-legends', 'common', null, rockLee),
  makeCard('sl-03', 'Хината', 'shinobi-legends', 'common', null, hinata),
  makeCard('sl-04', 'Сакура', 'shinobi-legends', 'common', null, sakura),
  makeCard('sl-05', 'Сай', 'shinobi-legends', 'common', null, sai),
  makeCard('sl-06', 'Наруто', 'shinobi-legends', 'rare', null, naruto),
  makeCard('sl-07', 'Саске', 'shinobi-legends', 'rare', null, sasuke),
  makeCard('sl-08', 'Какаши', 'shinobi-legends', 'rare', null, kakashi),
  makeCard('sl-09', 'Итачи', 'shinobi-legends', 'epic', 'stability', itachi),
  makeCard('sl-10', 'Мадара', 'shinobi-legends', 'legendary', 'leader', madara),
]

// Bizarre Arcana (ДжоДжо) — 10 cards
const bizarreArcana: Card[] = [
  makeCard('ba-01', 'Джозеф', 'bizarre-arcana', 'common', null, joseph),
  makeCard('ba-02', 'Абдул', 'bizarre-arcana', 'common', null, abdul),
  makeCard('ba-03', 'Игги', 'bizarre-arcana', 'common', null, iggy),
  makeCard('ba-04', 'Польнареф', 'bizarre-arcana', 'common', null, polnareff),
  makeCard('ba-05', 'Джотаро', 'bizarre-arcana', 'common', null, jotaro),
  makeCard('ba-06', 'Дьяволо', 'bizarre-arcana', 'rare', null, diavolo),
  makeCard('ba-07', 'Кира Йошикаге', 'bizarre-arcana', 'rare', null, kira),
  makeCard('ba-08', 'Джайро Цеппели', 'bizarre-arcana', 'rare', null, gyro),
  makeCard('ba-09', 'Пуччи', 'bizarre-arcana', 'epic', 'stability', pucci),
  makeCard('ba-10', 'Dio over heaven', 'bizarre-arcana', 'legendary', 'leader', dio),
]

// ─────────────────────────────────────────────────────────────────────────
// Mock collections (placeholder names; no artwork yet)
// To enable: add the collection key to ENABLED_COLLECTIONS below and drop
// art into src/assets/cards/<collection>/ following the existing pattern.
// ─────────────────────────────────────────────────────────────────────────

const demonSlayersMock: Card[] = [
  makeCard('ds-01', 'Slayer Apprentice', 'demon-slayers', 'common'),
  makeCard('ds-02', 'Wisteria Scout', 'demon-slayers', 'common'),
  makeCard('ds-03', 'Breath Trainee', 'demon-slayers', 'common'),
  makeCard('ds-04', 'Boar-mask Brawler', 'demon-slayers', 'common'),
  makeCard('ds-05', 'Lightning Disciple', 'demon-slayers', 'common'),
  makeCard('ds-06', 'Water Pillar Cadet', 'demon-slayers', 'rare'),
  makeCard('ds-07', 'Sun Lineage Heir', 'demon-slayers', 'rare'),
  makeCard('ds-08', 'Wind Hashira Initiate', 'demon-slayers', 'rare'),
  makeCard('ds-09', 'Flame Hashira', 'demon-slayers', 'epic', 'stability'),
  makeCard('ds-10', 'Demon King Eclipse', 'demon-slayers', 'legendary', 'leader'),
]

const hunterTrialsMock: Card[] = [
  makeCard('ht-01', 'Rookie Examinee', 'hunter-trials', 'common'),
  makeCard('ht-02', 'Aura Acolyte', 'hunter-trials', 'common'),
  makeCard('ht-03', 'Sky Diver', 'hunter-trials', 'common'),
  makeCard('ht-04', 'Card-trick Artist', 'hunter-trials', 'common'),
  makeCard('ht-05', 'Chain User', 'hunter-trials', 'common'),
  makeCard('ht-06', 'Phantom Fighter', 'hunter-trials', 'rare'),
  makeCard('ht-07', 'Spider Recruit', 'hunter-trials', 'rare'),
  makeCard('ht-08', 'Royal Ant Soldier', 'hunter-trials', 'rare'),
  makeCard('ht-09', 'Zoldyck Apprentice', 'hunter-trials', 'epic', 'stability'),
  makeCard('ht-10', 'Chimera Ant King', 'hunter-trials', 'legendary', 'leader'),
]

const stellarMagusMock: Card[] = [
  makeCard('sm-01', 'Mana Cadet', 'stellar-magus', 'common'),
  makeCard('sm-02', 'Wand Apprentice', 'stellar-magus', 'common'),
  makeCard('sm-03', 'Spell Scout', 'stellar-magus', 'common'),
  makeCard('sm-04', 'Black Bull Rookie', 'stellar-magus', 'common'),
  makeCard('sm-05', 'Magic Squad Page', 'stellar-magus', 'common'),
  makeCard('sm-06', 'Anti-magic Wielder', 'stellar-magus', 'rare'),
  makeCard('sm-07', 'Stellar Knight', 'stellar-magus', 'rare'),
  makeCard('sm-08', 'Time Mage', 'stellar-magus', 'rare'),
  makeCard('sm-09', 'Wizard King Cadet', 'stellar-magus', 'epic', 'stability'),
  makeCard('sm-10', 'Devil-Heart Sovereign', 'stellar-magus', 'legendary', 'leader'),
]

// Set this to control which collections appear in the shipped deck.
// Default: only the 3 fully-arted collections — keeps the 30-card balance.
export const ENABLED_COLLECTIONS: Collection[] = [
  'shadow-sorcery',
  'shinobi-legends',
  'bizarre-arcana',
  // 'demon-slayers',
  // 'hunter-trials',
  // 'stellar-magus',
]

const COLLECTION_DECKS: Record<Collection, Card[]> = {
  'shadow-sorcery': shadowSorcery,
  'shinobi-legends': shinobiLegends,
  'bizarre-arcana': bizarreArcana,
  'demon-slayers': demonSlayersMock,
  'hunter-trials': hunterTrialsMock,
  'stellar-magus': stellarMagusMock,
}

export const ALL_CARDS: Card[] = ENABLED_COLLECTIONS.flatMap((c) => COLLECTION_DECKS[c])
