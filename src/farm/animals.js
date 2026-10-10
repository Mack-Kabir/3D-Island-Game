// Farm animals, the buildings Bob builds for them, animal feed and farm supplies.

/** Inventory items for animal goods and farm supplies (added to ITEMS in shared/items.js). */
export const ANIMAL_ITEMS = {
  // animal goods
  egg: { name: 'Egg', icon: '🥚', type: 'animal', sell: 12, desc: 'Fresh from your chickens.' },
  milk: { name: 'Milk', icon: '🥛', type: 'animal', sell: 18, heal: 6, desc: 'From your cow. Makes butter and cheese.' },
  honey: { name: 'Honey', icon: '🍯', type: 'animal', sell: 30, heal: 8, desc: 'Golden honey from your bee hive.' },
  wool: { name: 'Wool', icon: '🧶', type: 'animal', sell: 40, desc: 'Soft wool from your sheep. Sells well.' },
  goat_milk: { name: 'Goat Milk', icon: '🍶', type: 'animal', sell: 26, heal: 6, desc: 'Creamy milk from your goats. Makes goat cheese.' },
  truffle: { name: 'Truffle', icon: '🍄', type: 'animal', sell: 120, desc: 'Sniffed out by your truffle pig. A gourmet treasure!' },
  // farming supplies
  animal_feed: { name: 'Animal Feed', icon: '🪣', type: 'farm', sell: 2, desc: 'Put it in your Feeder — your animals eat from it. Make feed from crops at the Feeder, or buy it from Chloe.' },
  fertilizer: { name: 'Fertilizer', icon: '🧴', type: 'farm', sell: 5, desc: 'Use on a growing crop: grows 40% faster and gives +1 harvest.' },
  super_fertilizer: { name: 'Super Fertilizer', icon: '💫', type: 'farm', sell: 15, desc: 'Use on a growing crop: grows 80% faster and gives +2 harvest.' },
};

// Farm animals live in pens at your homestead. Feed them (except bees) and collect their goods.
export const ANIMALS = {
  chicken: { name: 'Chicken', icon: '🐔', level: 3, price: 250, max: 4, hours: 4, product: 'egg', yield: [1, 2], feed: true, desc: 'Lays eggs every 4 hours after a meal.' },
  cow: { name: 'Cow', icon: '🐄', level: 6, price: 900, max: 3, hours: 8, product: 'milk', yield: [1, 2], feed: true, desc: 'Gives milk every 8 hours after a meal.' },
  bee: { name: 'Bee Hive', icon: '🐝', level: 8, price: 1200, max: 3, hours: 10, product: 'honey', yield: [1, 2], feed: false, desc: 'Makes honey every 10 hours. Bees feed themselves!' },
  sheep: { name: 'Sheep', icon: '🐑', level: 10, price: 1600, max: 3, hours: 12, product: 'wool', yield: [1, 2], feed: true, desc: 'Grows wool every 12 hours after a meal.' },
  pig: { name: 'Truffle Pig', icon: '🐖', level: 13, price: 3000, max: 2, hours: 14, product: 'truffle', yield: [1, 1], feed: true, desc: 'Sniffs out a truffle every 14 hours after a meal.' },
};
ANIMALS.goat = { name: 'Goat', icon: '🐐', level: 7, price: 700, max: 3, hours: 9, product: 'goat_milk', yield: [1, 2], feed: true, desc: 'Gives goat milk every 9 hours after a meal.' };
for (const [id, b] of Object.entries({ chicken: 'coop', cow: 'barn', goat: 'goatpen', bee: 'hives', sheep: 'fold', pig: 'sty' })) ANIMALS[id].building = b;

// Farm buildings. Bob builds them. "ruined" ones start broken and are repaired through Bob's requests.
export const FARM_BUILDINGS = {
  kitchen: { name: 'Kitchen', icon: '🍳', start: 'ruined', level: 1, quest: 'm4k', home: true, desc: 'The old outdoor kitchen beside your home is in ruins. Grandma Rose and Bob will help you fix it up.' },
  coop: { name: 'Chicken Coop', icon: '🐔', animal: 'chicken', start: 'ruined', level: 3, quest: 's_coop', desc: 'The old coop is falling apart. Help Bob rebuild it.' },
  feeder: { name: 'Feeder', icon: '🪣', start: 'none', level: 3, cost: { coins: 120, driftwood: 6, stone: 3 }, desc: 'Holds Animal Feed. Your animals eat from it automatically. Turn crops into feed here.' },
  barn: { name: 'Cow Barn', icon: '🐄', animal: 'cow', start: 'ruined', level: 6, quest: 's_barn', desc: 'A storm wrecked the old barn. Bob can rebuild it.' },
  goatpen: { name: 'Goat Pen', icon: '🐐', animal: 'goat', start: 'none', level: 7, cost: { coins: 900, driftwood: 25, stone: 15 }, desc: 'A rocky pen for goats.' },
  hives: { name: 'Bee Hives', icon: '🐝', animal: 'bee', start: 'none', level: 8, cost: { coins: 1100, driftwood: 15, stone: 10 }, desc: 'Three wooden hives for honey bees.' },
  fold: { name: 'Sheep Fold', icon: '🐑', animal: 'sheep', start: 'none', level: 10, cost: { coins: 1500, driftwood: 35, stone: 20 }, desc: 'A cosy fold for woolly sheep.' },
  sty: { name: 'Pig Sty', icon: '🐖', animal: 'pig', start: 'none', level: 13, cost: { coins: 2500, gems: 5, driftwood: 45, stone: 30 }, desc: 'A muddy home for a truffle-hunting pig.' },
};
/** Feed you can make at the Feeder from your crops. */
export const FEED_RECIPES = [
  { id: 'wheat', inputs: { wheat: 2 }, feed: 3, level: 2 },
  { id: 'carrot', inputs: { carrot: 2 }, feed: 2, level: 1 },
  { id: 'corn', inputs: { corn: 1 }, feed: 2, level: 4 },
  { id: 'potato', inputs: { potato: 2 }, feed: 3, level: 4 },
  { id: 'pumpkin', inputs: { pumpkin: 1 }, feed: 5, level: 9 },
];
export const FEEDER_CAPACITY = 40;
