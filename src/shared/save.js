import { storageGet, storageSet, storageRemove } from './utils.js';
import { ROD_MIGRATION } from '../fishing/gear.js';
import { FREE_COSMETICS } from '../people/cosmetics.js';

const KEY = 'tidewander.save.v1';
const SETTINGS_KEY = 'tidewander.settings.v1';

export const DEFAULT_SETTINGS = {
  master: 0.8,
  music: 0.45,
  sfx: 0.8,
  ambient: 0.6,
  textSize: 'm',
  reduceMotion: false,
  highContrast: false,
  hints: true,
  clock: 'game',
  clock24: false,
  quality: 'high',
  sensitivity: 1,
  invertY: false,
  colorblindRarity: true,
};

export function newState(name, look) {
  return {
    version: 1,
    created: Date.now(),
    name: name || 'Islander',
    look,
    coins: 15,
    gems: 0,
    xp: 0,
    level: 1,
    hp: 100,
    island: 'palmora',
    pos: null,
    time: { day: 1, minutes: 8 * 60 },
    weather: { day: 1, kind: 'clear', rainStart: 0, rainEnd: 0 },
    inventory: {},
    rods: [],
    rod: null,
    bait: 'bait_worm',
    weapons: ['fists'],
    weapon: 'fists',
    boat: 'none',
    pets: [],
    pet: null,
    cosmetics: [...FREE_COSMETICS],
    quests: { active: {}, done: [], main: 'm1' },
    flags: {},
    fishdex: {},
    npcs: {},
    farm: { plots: [], animals: [], irrigation: 0, buildings: {}, feed: 0 },
    house: { level: 0, decor: [], tent: false },
    world: {},
    bounties: { day: 0, list: [] },
    tournament: { best: {}, wins: {} },
    stats: { caught: 0, sold: 0, earned: 0, pirates: 0, cooked: 0, harvested: 0, dug: 0, playSeconds: 0, perfect: 0 },
    lastLogin: null,
    streak: 0,
  };
}

export function saveGame(state) {
  if (!state) return false;
  state.saved = Date.now();
  return storageSet(KEY, state);
}
export function loadGame() {
  const s = storageGet(KEY, null);
  if (!s || s.version !== 1) return null;
  // older saves: farm animals & irrigation arrived later
  s.farm = s.farm || { plots: [] };
  s.farm.animals = s.farm.animals || [];
  s.farm.irrigation = s.farm.irrigation || 0;
  s.farm.buildings = s.farm.buildings || {};
  s.farm.feed = s.farm.feed || 0;
  // saves from before the wash-ashore intro already had their tent and kitchen
  s.house = s.house || { level: 0, decor: [] };
  if (s.house.tent === undefined) {
    s.house.tent = true;
    s.farm.buildings.kitchen = s.farm.buildings.kitchen || 'built';
  }
  // rods from older versions map onto the new line-up
  s.rods = [...new Set((s.rods || []).map((r) => ROD_MIGRATION[r] || r))];
  if (ROD_MIGRATION[s.rod]) s.rod = ROD_MIGRATION[s.rod];
  return s;
}
export function hasSave() {
  return !!loadGame();
}
export function deleteSave() {
  storageRemove(KEY);
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(storageGet(SETTINGS_KEY, {}) || {}) };
}
export function saveSettings(s) {
  storageSet(SETTINGS_KEY, s);
}
