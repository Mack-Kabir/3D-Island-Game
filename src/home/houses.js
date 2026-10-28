// Your house: the upgrade ladder from tent to manor, and decorations for your homestead.

export const HOUSES = [
  { level: 0, name: 'Tent', desc: 'A cozy tent. Better than sand.' },
  { level: 1, name: 'Beach Hut', cost: { coins: 300, driftwood: 10, stone: 5 }, reqLevel: 2, desc: 'Four walls and a roof!' },
  { level: 2, name: 'Bungalow', cost: { coins: 1800, driftwood: 30, stone: 20 }, reqLevel: 6, desc: 'A real home with a porch.' },
  { level: 3, name: 'Island Villa', cost: { coins: 6500, gems: 15, driftwood: 60, stone: 45 }, reqLevel: 11, desc: 'The envy of the archipelago.' },
  { level: 4, name: 'Seaside Manor', cost: { coins: 18000, gems: 50, driftwood: 100, stone: 90 }, reqLevel: 18, desc: 'Fit for a legend.' },
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

// Decorations live in the inventory until placed at home (added to ITEMS in shared/items.js).
export const DECOR_ITEMS = {};
for (const d of Object.values(DECOR)) {
  DECOR_ITEMS['decor_' + d.id] = { name: d.name, icon: d.icon, type: 'decor', decor: d.id, sell: Math.floor((d.price || 100) * 0.3), desc: 'Decoration — place it at your home.' };
}
