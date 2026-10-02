import { FISH } from './fish.js';

// type: fish | fruit | product | material | collectible | treasure | seed | bait | tool | decor | special | trophy
export const ITEMS = {
  // Materials & collectibles
  driftwood: { name: 'Driftwood', icon: '🪵', type: 'material', sell: 4, desc: 'Washed-up wood. Used for building.' },
  stone: { name: 'Stone', icon: '🪨', type: 'material', sell: 5, desc: 'A sturdy stone. Used for building.' },
  shell: { name: 'Seashell', icon: '🐚', type: 'collectible', sell: 7, desc: 'You can hear the ocean in it.' },
  starfish: { name: 'Starfish', icon: '⭐', type: 'collectible', sell: 20, desc: 'A lucky little star of the sea.' },
  coral_piece: { name: 'Coral Piece', icon: '🪸', type: 'collectible', sell: 28, desc: 'Bright coral from the reef.' },
  obsidian: { name: 'Obsidian', icon: '🔮', type: 'collectible', sell: 45, desc: 'Volcanic glass from Ember Isle.' },
  pearl: { name: 'Pearl', icon: '🫧', type: 'treasure', sell: 240, desc: 'Lustrous and rare.' },
  doubloon: { name: 'Pirate Doubloon', icon: '🪙', type: 'treasure', sell: 65, desc: 'Gold coin with a skull stamp.' },
  ruby: { name: 'Ruby', icon: '♦️', type: 'treasure', sell: 400, desc: 'A blood-red gem.' },
  bottle: { name: 'Message in a Bottle', icon: '🍾', type: 'special', sell: 0, use: 'bottle', desc: 'Open it to reveal a hidden treasure spot nearby.' },

  // Fruits
  strawberry: { name: 'Strawberry', icon: '🍓', type: 'fruit', sell: 12, heal: 6, desc: 'Sweet and juicy.' },
  pineapple: { name: 'Pineapple', icon: '🍍', type: 'fruit', sell: 42, heal: 12, desc: 'Spiky outside, sunny inside.' },
  watermelon: { name: 'Watermelon', icon: '🍉', type: 'fruit', sell: 72, heal: 18, desc: 'Summer in a fruit.' },
  sugarcane: { name: 'Sugarcane', icon: '🎋', type: 'fruit', sell: 10, desc: 'Great for candy.' },
  banana: { name: 'Banana', icon: '🍌', type: 'fruit', sell: 18, heal: 8, desc: 'Potassium power.' },
  mango: { name: 'Mango', icon: '🥭', type: 'fruit', sell: 30, heal: 10, desc: 'King of tropical fruits.' },
  coconut: { name: 'Coconut', icon: '🥥', type: 'fruit', sell: 22, heal: 8, desc: 'Hard to open. Worth it.' },
  dragonfruit: { name: 'Dragon Fruit', icon: '🐉', type: 'fruit', sell: 90, heal: 20, desc: 'Only grows near Ember Isle\'s heat.' },

  // Seeds & saplings
  seed_strawberry: { name: 'Strawberry Seeds', icon: '🌱', type: 'seed', crop: 'strawberry', sell: 2, desc: 'Grows in 6 hours. Harvest 3.' },
  seed_sugarcane: { name: 'Sugarcane Cutting', icon: '🌱', type: 'seed', crop: 'sugarcane', sell: 3, desc: 'Grows in 8 hours. Harvest 3.' },
  seed_pineapple: { name: 'Pineapple Crown', icon: '🌱', type: 'seed', crop: 'pineapple', sell: 6, desc: 'Grows in 10 hours.' },
  seed_watermelon: { name: 'Watermelon Seeds', icon: '🌱', type: 'seed', crop: 'watermelon', sell: 10, desc: 'Grows in 14 hours.' },
  seed_dragonfruit: { name: 'Dragon Fruit Cutting', icon: '🌱', type: 'seed', crop: 'dragonfruit', sell: 30, desc: 'Grows in 20 hours.' },
  sapling_banana: { name: 'Banana Sapling', icon: '🌴', type: 'seed', crop: 'banana', sell: 20, desc: 'A tree! Fruits every 12 hours, forever.' },
  sapling_coconut: { name: 'Coconut Sapling', icon: '🌴', type: 'seed', crop: 'coconut', sell: 30, desc: 'A palm tree. Fruits every 12 hours.' },
  sapling_mango: { name: 'Mango Sapling', icon: '🌳', type: 'seed', crop: 'mango', sell: 45, desc: 'A mango tree. Fruits every 12 hours.' },

  // Cooked products
  grilled_fish: { name: 'Grilled Fish', icon: '🍢', type: 'product', sell: 30, heal: 35, desc: 'Simple and smoky.' },
  coconut_juice: { name: 'Coconut Juice', icon: '🧃', type: 'product', sell: 55, heal: 25, desc: 'Ice cold. Pure island.' },
  berry_jam: { name: 'Berry Jam', icon: '🍯', type: 'product', sell: 52, heal: 15, desc: 'Grandma-approved.' },
  sugar_candy: { name: 'Cane Candy', icon: '🍬', type: 'product', sell: 45, heal: 10, desc: 'Sticky, sweet, addictive.' },
  fruit_salad: { name: 'Tropical Salad', icon: '🥗', type: 'product', sell: 140, heal: 40, desc: 'A rainbow in a bowl.' },
  fish_taco: { name: 'Fish Taco', icon: '🌮', type: 'product', sell: 95, heal: 45, desc: 'Nana\'s secret recipe.' },
  mango_smoothie: { name: 'Mango Smoothie', icon: '🥤', type: 'product', sell: 110, heal: 30, desc: 'Blended sunshine.' },
  melon_slush: { name: 'Melon Slush', icon: '🍧', type: 'product', sell: 160, heal: 35, desc: 'Brain freeze guaranteed.' },
  sushi_platter: { name: 'Sushi Platter', icon: '🍣', type: 'product', sell: 260, heal: 70, desc: 'Fresh from the reef.' },
  seafood_feast: { name: 'Seafood Feast', icon: '🦞', type: 'product', sell: 420, heal: 100, desc: 'Feeds a whole village.' },
  dragon_bowl: { name: 'Dragon Bowl', icon: '🍲', type: 'product', sell: 380, heal: 80, desc: 'Fiery and fabulous.' },
  health_tonic: { name: 'Health Tonic', icon: '🧪', type: 'product', sell: 20, heal: 80, desc: 'Sage\'s herbal brew.' },

  // Bait (consumed one per cast)
  bait_worm: { name: 'Worms', icon: '🪱', type: 'bait', sell: 1, desc: 'Basic bait. Fish love it.' },
  bait_shrimp: { name: 'Shrimp Bait', icon: '🦐', type: 'bait', sell: 2, desc: '+Luck, faster bites.' },
  bait_glow: { name: 'Glow Bait', icon: '✨', type: 'bait', sell: 4, desc: 'Big luck boost at night.' },
  bait_magic: { name: 'Magic Lure', icon: '🪄', type: 'bait', sell: 10, desc: 'Huge luck boost. Attracts legends.' },

  // Tools
  shovel: { name: 'Shovel', icon: '⛏️', type: 'tool', sell: 0, desc: 'Dig up treasure at X marks.' },
  watering_can: { name: 'Watering Can', icon: '🚿', type: 'tool', sell: 0, desc: 'Watered crops grow 50% faster.' },

  // Trophies
  trophy_bronze: { name: 'Bronze Cup', icon: '🥉', type: 'trophy', sell: 0, desc: 'Bronze League champion.' },
  trophy_silver: { name: 'Silver Cup', icon: '🥈', type: 'trophy', sell: 0, desc: 'Silver League champion.' },
  trophy_gold: { name: 'Gold Cup', icon: '🏆', type: 'trophy', sell: 0, desc: 'Gold League champion!' },
};

// Every fish is also an inventory item.
for (const f of FISH) {
  ITEMS['fish_' + f.id] = { name: f.name, type: 'fish', fish: f.id, sell: f.price, tier: f.tier, desc: f.desc };
}

export const CROPS = {
  strawberry: { name: 'Strawberry', hours: 6, yield: [3, 4], item: 'strawberry', color: '#e2434b', kind: 'bush' },
  sugarcane: { name: 'Sugarcane', hours: 8, yield: [3, 4], item: 'sugarcane', color: '#a8c46a', kind: 'cane' },
  pineapple: { name: 'Pineapple', hours: 10, yield: [1, 2], item: 'pineapple', color: '#e7b53a', kind: 'pine' },
  watermelon: { name: 'Watermelon', hours: 14, yield: [1, 2], item: 'watermelon', color: '#3f8f3a', kind: 'melon' },
  dragonfruit: { name: 'Dragon Fruit', hours: 20, yield: [2, 3], item: 'dragonfruit', color: '#e0457f', kind: 'cactus' },
  banana: { name: 'Banana Tree', hours: 16, regrow: 12, yield: [2, 3], item: 'banana', color: '#f2d23a', kind: 'tree', tree: 'banana' },
  coconut: { name: 'Coconut Palm', hours: 18, regrow: 12, yield: [2, 3], item: 'coconut', color: '#7a5230', kind: 'tree', tree: 'palm' },
  mango: { name: 'Mango Tree', hours: 22, regrow: 12, yield: [2, 4], item: 'mango', color: '#f29a2e', kind: 'tree', tree: 'round' },
};

// Cooking recipes. 'anyFish' accepts any non-junk fish.
export const RECIPES = [
  { id: 'grilled_fish', inputs: { anyFish: 1 }, out: 'grilled_fish', level: 1 },
  { id: 'coconut_juice', inputs: { coconut: 2 }, out: 'coconut_juice', level: 1 },
  { id: 'berry_jam', inputs: { strawberry: 3 }, out: 'berry_jam', level: 1 },
  { id: 'sugar_candy', inputs: { sugarcane: 3 }, out: 'sugar_candy', level: 2 },
  { id: 'fish_taco', inputs: { anyFish: 1, pineapple: 1 }, out: 'fish_taco', level: 3 },
  { id: 'mango_smoothie', inputs: { mango: 2, banana: 1 }, out: 'mango_smoothie', level: 4 },
  { id: 'fruit_salad', inputs: { pineapple: 1, mango: 1, banana: 1, strawberry: 2 }, out: 'fruit_salad', level: 5 },
  { id: 'melon_slush', inputs: { watermelon: 1, sugarcane: 2 }, out: 'melon_slush', level: 6 },
  { id: 'sushi_platter', inputs: { anyFish: 3, seaweed: 1 }, out: 'sushi_platter', level: 8 },
  { id: 'dragon_bowl', inputs: { dragonfruit: 2, coconut: 1, anyFish: 1 }, out: 'dragon_bowl', level: 12 },
  { id: 'seafood_feast', inputs: { anyFish: 5, coconut: 1, pineapple: 1 }, out: 'seafood_feast', level: 10 },
];
// seaweed is caught as "fish_seaweed" — map recipe key to it
export const RECIPE_ALIASES = { seaweed: 'fish_seaweed' };

export function itemIcon(id) {
  return ITEMS[id]?.icon ?? '❔';
}
