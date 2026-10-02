// zone: size of the catch bar (0-1). luck: rarity boost. speed: bite-wait multiplier. reel: progress speed.
export const RODS = [
  { id: 'bamboo', name: 'Bamboo Rod', icon: '🎋', zone: 0.25, luck: 0, speed: 1, reel: 1, price: 0, level: 1, color: '#c9a65b', desc: 'Light and humble. Every legend starts here.' },
  { id: 'oak', name: 'Oak Rod', icon: '🎣', zone: 0.28, luck: 0.12, speed: 0.9, reel: 1.06, price: 280, level: 3, color: '#8a5a32', desc: 'Sturdy hardwood with a better grip.' },
  { id: 'fiberglass', name: 'Fiberglass Rod', icon: '🎣', zone: 0.31, luck: 0.25, speed: 0.82, reel: 1.12, price: 950, level: 6, color: '#e2e6e8', desc: 'Flexible and forgiving.' },
  { id: 'carbon', name: 'Carbon Pro', icon: '🎣', zone: 0.33, luck: 0.4, speed: 0.74, reel: 1.2, price: 2600, level: 10, color: '#2d2d36', desc: 'Pro-grade. Feels like cheating.' },
  { id: 'coral', name: 'Coral Rod', icon: '🪸', zone: 0.35, luck: 0.6, speed: 0.68, reel: 1.26, price: 4800, gems: 15, level: 13, color: '#ff7f91', desc: 'Reef fish adore its colours.' },
  { id: 'ember', name: 'Ember Rod', icon: '🔥', zone: 0.37, luck: 0.8, speed: 0.62, reel: 1.32, price: 9500, gems: 30, level: 17, color: '#e85a2a', desc: 'Forged in volcano fire.' },
  { id: 'golden', name: 'Golden Rod', icon: '✨', zone: 0.4, luck: 1.05, speed: 0.56, reel: 1.4, price: 0, gems: 180, level: 21, color: '#f2c230', desc: 'Pure gold. Legends can\'t resist.' },
  { id: 'leviathan', name: "Leviathan's Rod", icon: '🔱', zone: 0.44, luck: 1.5, speed: 0.5, reel: 1.5, price: 0, level: 1, reward: true, color: '#3fb9b0', desc: 'Taken from Captain Blackfin. Hums with the sea\'s power.' },
];

export const BAITS = [
  { id: 'bait_worm', luck: 0, speed: 1, price: 20, pack: 10, level: 1 },
  { id: 'bait_shrimp', luck: 0.15, speed: 0.85, price: 60, pack: 10, level: 3 },
  { id: 'bait_glow', luck: 0.1, nightLuck: 0.5, speed: 0.8, price: 140, pack: 10, level: 6 },
  { id: 'bait_magic', luck: 0.6, speed: 0.7, price: 0, gems: 12, pack: 5, level: 10 },
];

export const WEAPONS = [
  { id: 'fists', name: 'Bare Hands', icon: '✊', dmg: 5, range: 1.7, price: 0, level: 1, color: '#000000', desc: 'Better than nothing.' },
  { id: 'stick', name: 'Driftwood Club', icon: '🏏', dmg: 10, range: 2.0, price: 0, level: 1, color: '#9b7a52', desc: 'A gift from the Mayor.' },
  { id: 'cutlass', name: 'Cutlass', icon: '🗡️', dmg: 17, range: 2.3, price: 650, level: 5, color: '#c8d0d8', desc: 'A proper sailor\'s blade.' },
  { id: 'coral_saber', name: 'Coral Saber', icon: '⚔️', dmg: 26, range: 2.4, price: 2300, level: 10, color: '#ff8fa0', desc: 'Light, sharp and beautiful.' },
  { id: 'ember_blade', name: 'Ember Blade', icon: '🔥', dmg: 38, range: 2.5, price: 6800, level: 15, color: '#ff6a2a', desc: 'Leaves a trail of sparks.' },
  { id: 'trident', name: 'Storm Trident', icon: '🔱', dmg: 52, range: 2.9, price: 0, gems: 220, level: 20, color: '#5fd3e0', desc: 'Commands the tides themselves.' },
];

export const BOATS = [
  { id: 'none', name: 'No Boat', tier: 0 },
  { id: 'raft', name: 'Bamboo Raft', icon: '🛶', tier: 1, price: 600, level: 3, desc: 'Gets you to Coralia Reef.', reaches: 'coralia' },
  { id: 'sailboat', name: 'Sailboat', icon: '⛵', tier: 2, price: 3200, level: 8, desc: 'Strong enough for Ember Isle.', reaches: 'ember' },
  { id: 'galleon', name: 'Galleon', icon: '🚢', tier: 3, price: 8500, gems: 25, level: 12, desc: 'Brave the waters of Skull Cay.', reaches: 'skull' },
];

export const PETS = [
  { id: 'kitten', name: 'Kitten', icon: '🐱', gems: 40, level: 2, perk: '+10% fishing luck', luck: 0.1, desc: 'Watches the water with you.' },
  { id: 'puppy', name: 'Puppy', icon: '🐶', gems: 40, level: 2, perk: 'Sniffs out an extra treasure spot daily', desc: 'Loves digging.' },
  { id: 'parrot', name: 'Parrot', icon: '🦜', gems: 60, level: 5, perk: '+10% coins when selling', sellBonus: 0.1, desc: 'Haggles on your behalf. Squawk!' },
  { id: 'turtle', name: 'Sea Turtle', icon: '🐢', gems: 80, level: 8, perk: '+15 max HP and faster healing', hp: 15, desc: 'Slow and steady.' },
];

export const HOUSES = [
  { level: 0, name: 'Tent', plots: 4, desc: 'A cozy tent. Better than sand.' },
  { level: 1, name: 'Beach Hut', plots: 6, cost: { coins: 300, driftwood: 10, stone: 5 }, reqLevel: 2, desc: 'Four walls and a roof!' },
  { level: 2, name: 'Bungalow', plots: 9, cost: { coins: 1800, driftwood: 30, stone: 20 }, reqLevel: 6, desc: 'A real home with a porch.' },
  { level: 3, name: 'Island Villa', plots: 12, cost: { coins: 6500, gems: 15, driftwood: 60, stone: 45 }, reqLevel: 11, desc: 'The envy of the archipelago.' },
  { level: 4, name: 'Seaside Manor', plots: 16, cost: { coins: 18000, gems: 50, driftwood: 100, stone: 90 }, reqLevel: 18, desc: 'Fit for a legend.' },
];

export const DECOR = {
  lantern: { name: 'Paper Lantern', icon: '🏮', price: 90, level: 1 },
  flowerpot: { name: 'Flower Pot', icon: '🌺', price: 45, level: 1 },
  fence: { name: 'Fence', icon: '🚧', price: 30, level: 1 },
  campfire: { name: 'Campfire', icon: '🔥', price: 140, level: 2 },
  tiki: { name: 'Tiki Torch', icon: '🗿', price: 170, level: 3 },
  bench: { name: 'Bench', icon: '🪑', price: 120, level: 2 },
  hammock: { name: 'Hammock', icon: '🌴', price: 280, level: 4 },
  umbrella: { name: 'Beach Umbrella', icon: '⛱️', price: 200, level: 3 },
  flamingo: { name: 'Lawn Flamingo', icon: '🦩', price: 320, level: 5 },
  fish_trophy: { name: 'Fish Trophy', icon: '🐟', price: 0, gems: 20, level: 6 },
};
for (const [id, d] of Object.entries(DECOR)) d.id = id;

export const RODS_BY_ID = Object.fromEntries(RODS.map((r) => [r.id, r]));
export const BAITS_BY_ID = Object.fromEntries(BAITS.map((r) => [r.id, r]));
export const WEAPONS_BY_ID = Object.fromEntries(WEAPONS.map((r) => [r.id, r]));
export const BOATS_BY_ID = Object.fromEntries(BOATS.map((r) => [r.id, r]));
export const PETS_BY_ID = Object.fromEntries(PETS.map((r) => [r.id, r]));

// Decorations live in the inventory until placed at home.
import { ITEMS } from './items.js';
for (const d of Object.values(DECOR)) {
  ITEMS['decor_' + d.id] = { name: d.name, icon: d.icon, type: 'decor', decor: d.id, sell: Math.floor((d.price || 100) * 0.3), desc: 'Decoration — place it at your home.' };
}
