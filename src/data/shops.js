import { RODS, BAITS, WEAPONS, BOATS, PETS, DECOR } from './gear.js';
import { COSMETICS } from './cosmetics.js';

// kind: item | rod | weapon | boat | cosmetic | pet
const rod = (id) => {
  const r = RODS.find((x) => x.id === id);
  return { kind: 'rod', id, price: r.price, gems: r.gems, level: r.level };
};
const bait = (id) => {
  const b = BAITS.find((x) => x.id === id);
  return { kind: 'item', id, qty: b.pack, price: b.price, gems: b.gems, level: b.level };
};
const weapon = (id) => {
  const w = WEAPONS.find((x) => x.id === id);
  return { kind: 'weapon', id, price: w.price, gems: w.gems, level: w.level };
};
const cos = (id) => {
  const c = COSMETICS[id];
  return { kind: 'cosmetic', id, price: c.price, gems: c.gems, level: 1 };
};
const item = (id, price, opts = {}) => ({ kind: 'item', id, price, qty: 1, level: 1, ...opts });

export const SHOPS = {
  tackle: {
    name: "Finn's Tackle", sells: ['fish'],
    stock: [rod('oak'), rod('fiberglass'), rod('carbon'), bait('bait_worm'), bait('bait_shrimp'), bait('bait_glow')],
  },
  fishmarket: { name: "Marina's Fish Market", sells: ['fish'], bonus: 0.1, stock: [item('grilled_fish', 60)] },
  general: {
    name: "Coco's Fruit Stand", sells: ['fruit', 'product', 'collectible'],
    stock: [
      item('seed_strawberry', 8, { qty: 4 }), item('seed_sugarcane', 12, { qty: 3 }), item('seed_pineapple', 24, { qty: 2 }),
      item('seed_watermelon', 40, { qty: 2, level: 4 }), item('seed_dragonfruit', 120, { qty: 2, level: 9 }),
      item('sapling_banana', 90, { level: 3 }), item('sapling_coconut', 130, { level: 4 }), item('sapling_mango', 200, { level: 6 }),
      item('shovel', 120, { once: true }), item('watering_can', 60, { once: true }),
    ],
  },
  boutique: {
    name: "Luna's Boutique", sells: [],
    stock: [
      ...['sailor', 'hawaiian_red', 'hawaiian_blue', 'dots_pink', 'hoodie_green', 'plaid_flannel', 'explorer', 'sundress_yellow', 'skirt_floral', 'sarong_blue', 'pants_white', 'board_shorts', 'cap_red', 'bandana_blue', 'flower_crown', 'beanie', 'sun_visor', 'sunglasses', 'lei', 'backpack', 'scarf'].map(cos),
      ...PETS.map((p) => ({ kind: 'pet', id: p.id, gems: p.gems, price: 0, level: p.level })),
    ],
  },
  builder: {
    name: "Bo's Workshop", sells: ['material'],
    stock: [
      item('driftwood', 16, { qty: 5, priceForQty: true }), item('stone', 22, { qty: 5, priceForQty: true }),
      ...Object.values(DECOR).map((d) => ({ kind: 'item', id: 'decor_' + d.id, price: d.price, gems: d.gems, level: d.level, qty: 1 })),
    ],
  },
  shipwright: { name: "Reyes' Shipyard", sells: [], stock: BOATS.filter((b) => b.tier > 0).map((b) => ({ kind: 'boat', id: b.id, price: b.price, gems: b.gems, level: b.level })) },
  reef: {
    name: "Shelly's Reef Shop", sells: ['fish', 'collectible'],
    stock: [rod('coral'), bait('bait_shrimp'), bait('bait_magic'), weapon('coral_saber'), cos('dress_mermaid')],
  },
  forge: {
    name: "Ash's Forge", sells: ['treasure', 'collectible'],
    stock: [weapon('cutlass'), weapon('coral_saber'), weapon('ember_blade'), rod('ember'), cos('ember_jacket')],
  },
  mystic: {
    name: "Sage's Hut", sells: ['fish', 'fruit'],
    stock: [item('health_tonic', 90, { qty: 1 }), bait('bait_glow'), bait('bait_magic'), item('seed_dragonfruit', 100, { qty: 2, level: 9 })],
  },
  night: {
    name: "Moth's Moonlit Wares", sells: ['fish', 'treasure'], bonus: 0.15,
    stock: [
      rod('golden'), weapon('trident'), bait('bait_magic'), item('bottle', 0, { gems: 3 }),
      cos('starry_robe'), cos('witch_hat'), cos('wings'), cos('captain_coat'), cos('captain_hat'),
      { kind: 'item', id: 'decor_fish_trophy', gems: 20, price: 0, level: 6, qty: 1 },
    ],
  },
  pirate: {
    name: "Patch's Plunder", sells: ['treasure', 'fish'],
    stock: [cos('pirate_hat'), cos('pirate_vest'), cos('pirate_pants'), cos('eyepatch'), item('health_tonic', 110), bait('bait_magic')],
  },
};
