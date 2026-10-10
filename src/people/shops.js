import { RODS, BAITS, BOATS } from '../fishing/gear.js';
import { WEAPONS } from '../combat/weapons.js';
import { DECOR } from '../home/houses.js';
import { COSMETICS } from './cosmetics.js';
import { CROPS, SEED_PRICES, IRRIGATION } from '../farm/crops.js';
import { ANIMALS } from '../farm/animals.js';
import { PETS } from './pets.js';

// kind: item | rod | weapon | boat | cosmetic | pet | animal | irrigation
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
    name: "Ross's Tackle Shop", sells: ['fish'],
    stock: [rod('oak'), rod('carbon'), bait('bait_worm'), bait('bait_cricket'), bait('bait_shrimp'), bait('bait_spinner'), bait('bait_glow')],
  },
  fishmarket: { name: "Megan's Fish Market", sells: ['fish'], bonus: 0.1, stock: [item('grilled_fish', 60)] },
  general: {
    name: "Chloe's Fruit Stand", sells: ['fruit', 'crop', 'animal', 'ingredient', 'product', 'collectible'],
    stock: [
      item('watering_can', 60, { once: true }), item('shovel', 120, { once: true }),
      // seeds (packs of 4, or 2 for slow crops) and saplings, in unlock order
      ...Object.entries(CROPS)
        .filter(([, c]) => c.kind !== 'tree')
        .sort((a, b) => a[1].level - b[1].level)
        .map(([id, c]) => item(c.seed, SEED_PRICES[id], { qty: c.hours >= 10 ? 2 : 4, level: c.level })),
      ...Object.entries(CROPS)
        .filter(([, c]) => c.kind === 'tree')
        .sort((a, b) => a[1].level - b[1].level)
        .map(([id, c]) => item(c.seed, SEED_PRICES[id], { level: c.level })),
      item('animal_feed', 25, { qty: 5, level: 3 }), item('fertilizer', 60, { qty: 3, level: 4 }), item('super_fertilizer', 200, { qty: 3, level: 10 }),
      ...Object.entries(ANIMALS).map(([id, a]) => ({ kind: 'animal', id, price: a.price, level: a.level })),
      ...IRRIGATION.filter((x) => x.level > 0).map((x) => ({ kind: 'irrigation', id: x.id, level: x.reqLevel, irr: x.level, price: x.price, gems: x.gems })),
    ],
  },
  boutique: {
    name: "Lily's Boutique", sells: [],
    stock: [
      ...['sailor', 'hawaiian_red', 'hawaiian_blue', 'dots_pink', 'hoodie_green', 'plaid_flannel', 'explorer', 'sundress_yellow', 'skirt_floral', 'sarong_blue', 'pants_white', 'board_shorts', 'cap_red', 'bandana_blue', 'flower_crown', 'beanie', 'sun_visor', 'sunglasses', 'lei', 'backpack', 'scarf'].map(cos),
      ...PETS.map((p) => ({ kind: 'pet', id: p.id, gems: p.gems, price: 0, level: p.level })),
    ],
  },
  builder: {
    name: "Bob's Workshop", sells: ['material'],
    stock: [
      item('driftwood', 16, { qty: 5, priceForQty: true }), item('stone', 22, { qty: 5, priceForQty: true }),
      ...Object.values(DECOR).map((d) => ({ kind: 'item', id: 'decor_' + d.id, price: d.price, gems: d.gems, level: d.level, qty: 1 })),
    ],
  },
  shipwright: { name: "Captain Jack's Shipyard", sells: [], stock: [...BOATS.filter((b) => b.tier > 0).map((b) => ({ kind: 'boat', id: b.id, price: b.price, gems: b.gems, level: b.level })), rod('deepsea'), bait('bait_squid'), bait('bait_jig')] },
  reef: {
    name: "Sarah's Reef Shop", sells: ['fish', 'collectible'],
    stock: [rod('carbon'), bait('bait_shrimp'), bait('bait_squid'), bait('bait_magic'), weapon('coral_saber'), cos('dress_mermaid')],
  },
  forge: {
    name: "Hank's Forge", sells: ['treasure', 'collectible'],
    stock: [weapon('cutlass'), weapon('coral_saber'), weapon('ember_blade'), bait('bait_spinner'), cos('ember_jacket')],
  },
  mystic: {
    name: "Grace's Hut", sells: ['fish', 'fruit', 'crop'],
    stock: [item('health_tonic', 90, { qty: 1 }), bait('bait_glow'), bait('bait_jig'), bait('bait_magic'), item('seed_dragonfruit', 100, { qty: 2, level: 9 })],
  },
  night: {
    name: "Madison's Moonlit Wares", sells: ['fish', 'treasure'], bonus: 0.15,
    stock: [
      rod('golden'), weapon('trident'), bait('bait_magic'), item('bottle', 0, { gems: 3 }),
      cos('starry_robe'), cos('witch_hat'), cos('wings'), cos('captain_coat'), cos('captain_hat'),
      { kind: 'item', id: 'decor_fish_trophy', gems: 20, price: 0, level: 6, qty: 1 },
    ],
  },
  pirate: {
    name: "Pete's Plunder", sells: ['treasure', 'fish'],
    stock: [cos('pirate_hat'), cos('pirate_vest'), cos('pirate_pants'), cos('eyepatch'), item('health_tonic', 110), bait('bait_squid'), bait('bait_magic')],
  },
};

for (const [id, shop] of Object.entries(SHOPS)) shop.id = id;
