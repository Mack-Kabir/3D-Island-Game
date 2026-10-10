// Crops, fruit trees, seeds & saplings, soil-patch unlocks and irrigation.

/** Inventory items for everything you grow (added to ITEMS in shared/items.js). */
export const CROP_ITEMS = {
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

  // vegetables & grains
  carrot: { name: 'Carrot', icon: '🥕', type: 'crop', sell: 8, heal: 4, desc: 'Crunchy and sweet.' },
  wheat: { name: 'Wheat', icon: '🌾', type: 'crop', sell: 5, desc: 'Mill it into flour in your kitchen. Also makes animal feed.' },
  tomato: { name: 'Tomato', icon: '🍅', type: 'crop', sell: 10, heal: 4, desc: 'Sun-ripened and juicy.' },
  lettuce: { name: 'Lettuce', icon: '🥬', type: 'crop', sell: 9, heal: 3, desc: 'Crisp leaves for wraps and burgers.' },
  potato: { name: 'Potato', icon: '🥔', type: 'crop', sell: 9, desc: 'Fries, curries, chowders…' },
  corn: { name: 'Corn', icon: '🌽', type: 'crop', sell: 12, heal: 5, desc: 'Sweet corn. Pops into popcorn!' },
  onion: { name: 'Onion', icon: '🧅', type: 'crop', sell: 8, desc: 'Makes Grandma Rose cry. Happy tears.' },
  garlic: { name: 'Garlic', icon: '🧄', type: 'crop', sell: 10, desc: 'Keeps vampires — and pirates — away.' },
  pepper: { name: 'Bell Pepper', icon: '🫑', type: 'crop', sell: 14, heal: 4, desc: 'Bright and crunchy.' },
  rice: { name: 'Rice', icon: '🍚', type: 'crop', sell: 8, desc: 'Grows in wet soil. For sushi, curry and bento.' },
  basil: { name: 'Basil', icon: '🌿', type: 'crop', sell: 12, desc: 'Fragrant herb for pasta.' },
  pumpkin: { name: 'Pumpkin', icon: '🎃', type: 'crop', sell: 35, heal: 8, desc: 'Big, round and perfect for pie.' },
  // tree fruit
  lemon: { name: 'Lemon', icon: '🍋', type: 'fruit', sell: 16, heal: 3, desc: 'Sour! Makes the best lemonade.' },
  orange: { name: 'Orange', icon: '🍊', type: 'fruit', sell: 18, heal: 8, desc: 'Sunshine you can peel.' },
  apple: { name: 'Apple', icon: '🍎', type: 'fruit', sell: 20, heal: 8, desc: 'Crisp and red.' },
  cherry: { name: 'Cherry', icon: '🍒', type: 'fruit', sell: 15, heal: 5, desc: 'Always comes in pairs.' },
  peach: { name: 'Peach', icon: '🍑', type: 'fruit', sell: 24, heal: 10, desc: 'Soft, fuzzy and sweet.' },
  avocado: { name: 'Avocado', icon: '🥑', type: 'fruit', sell: 30, heal: 10, desc: 'Creamy green gold.' },
  cacao: { name: 'Cacao Pod', icon: '🌰', type: 'fruit', sell: 22, desc: 'Turn it into chocolate in your kitchen.' },
  coffee_beans: { name: 'Coffee Beans', icon: '🫘', type: 'fruit', sell: 20, desc: 'Brew them into coffee.' },

  // farm tools
  watering_can: { name: 'Watering Can', icon: '🚿', type: 'tool', sell: 0, desc: 'Watered crops grow 50% faster.' },
};

// level: when its seeds/sapling go on sale. hours: time to grow. regrow: trees fruit again every N hours.
export const CROPS = {
  strawberry: { name: 'Strawberry', level: 1, hours: 6, yield: [3, 4], item: 'strawberry', color: '#e2434b', kind: 'bush' },
  carrot: { name: 'Carrot', level: 1, hours: 5, yield: [3, 4], item: 'carrot', color: '#f08a2c', kind: 'root' },
  wheat: { name: 'Wheat', level: 2, hours: 4, yield: [3, 5], item: 'wheat', color: '#e3c25a', kind: 'stalk' },
  sugarcane: { name: 'Sugarcane', level: 2, hours: 8, yield: [3, 4], item: 'sugarcane', color: '#a8c46a', kind: 'cane' },
  tomato: { name: 'Tomato', level: 3, hours: 7, yield: [3, 4], item: 'tomato', color: '#e2434b', kind: 'bush' },
  lettuce: { name: 'Lettuce', level: 3, hours: 5, yield: [2, 3], item: 'lettuce', color: '#8fd06a', kind: 'leafy' },
  potato: { name: 'Potato', level: 4, hours: 8, yield: [3, 5], item: 'potato', color: '#c9a26b', kind: 'root' },
  corn: { name: 'Corn', level: 4, hours: 9, yield: [2, 4], item: 'corn', color: '#f2d23a', kind: 'stalk' },
  pineapple: { name: 'Pineapple', level: 5, hours: 10, yield: [1, 2], item: 'pineapple', color: '#e7b53a', kind: 'pine' },
  onion: { name: 'Onion', level: 5, hours: 6, yield: [2, 4], item: 'onion', color: '#d9b48a', kind: 'root' },
  garlic: { name: 'Garlic', level: 5, hours: 6, yield: [2, 3], item: 'garlic', color: '#f1ead8', kind: 'root' },
  pepper: { name: 'Bell Pepper', level: 6, hours: 9, yield: [2, 3], item: 'pepper', color: '#4f9a3c', kind: 'bush' },
  rice: { name: 'Rice', level: 6, hours: 10, yield: [3, 5], item: 'rice', color: '#c8d48a', kind: 'stalk' },
  basil: { name: 'Basil', level: 7, hours: 5, yield: [2, 3], item: 'basil', color: '#3f8f3a', kind: 'leafy' },
  watermelon: { name: 'Watermelon', level: 8, hours: 14, yield: [1, 2], item: 'watermelon', color: '#3f8f3a', kind: 'melon' },
  pumpkin: { name: 'Pumpkin', level: 9, hours: 16, yield: [1, 2], item: 'pumpkin', color: '#e8862a', kind: 'melon' },
  dragonfruit: { name: 'Dragon Fruit', level: 12, hours: 20, yield: [2, 3], item: 'dragonfruit', color: '#e0457f', kind: 'cactus' },
  banana: { name: 'Banana Tree', level: 3, hours: 16, regrow: 12, yield: [2, 3], item: 'banana', color: '#f2d23a', kind: 'tree', tree: 'banana' },
  coconut: { name: 'Coconut Palm', level: 4, hours: 18, regrow: 12, yield: [2, 3], item: 'coconut', color: '#7a5230', kind: 'tree', tree: 'palm' },
  lemon: { name: 'Lemon Tree', level: 5, hours: 16, regrow: 10, yield: [2, 4], item: 'lemon', color: '#f2e04a', kind: 'tree', tree: 'round' },
  mango: { name: 'Mango Tree', level: 6, hours: 22, regrow: 12, yield: [2, 4], item: 'mango', color: '#f29a2e', kind: 'tree', tree: 'round' },
  orange: { name: 'Orange Tree', level: 6, hours: 18, regrow: 11, yield: [2, 4], item: 'orange', color: '#f08a2c', kind: 'tree', tree: 'round' },
  apple: { name: 'Apple Tree', level: 7, hours: 20, regrow: 12, yield: [2, 4], item: 'apple', color: '#d9342b', kind: 'tree', tree: 'round' },
  cherry: { name: 'Cherry Tree', level: 9, hours: 20, regrow: 12, yield: [3, 5], item: 'cherry', color: '#b0182a', kind: 'tree', tree: 'round' },
  peach: { name: 'Peach Tree', level: 10, hours: 22, regrow: 13, yield: [2, 4], item: 'peach', color: '#f7a27a', kind: 'tree', tree: 'round' },
  avocado: { name: 'Avocado Tree', level: 11, hours: 24, regrow: 14, yield: [2, 3], item: 'avocado', color: '#4f7a2a', kind: 'tree', tree: 'round' },
  cacao: { name: 'Cacao Tree', level: 12, hours: 24, regrow: 14, yield: [2, 3], item: 'cacao', color: '#8a4a2a', kind: 'tree', tree: 'round' },
  coffee: { name: 'Coffee Bush', level: 13, hours: 20, regrow: 12, yield: [3, 4], item: 'coffee_beans', color: '#7a2a2a', kind: 'tree', tree: 'round' },
};
// Seeds & saplings for every crop (sold by Chloe from the crop's level).
const SEED_PRICE = { strawberry: 8, carrot: 6, wheat: 4, sugarcane: 12, tomato: 10, lettuce: 8, potato: 10, corn: 14, pineapple: 24, onion: 9, garlic: 10, pepper: 16, rice: 9, basil: 12, watermelon: 40, pumpkin: 45, dragonfruit: 120 };
const SAPLING_PRICE = { banana: 90, coconut: 130, lemon: 160, mango: 200, orange: 190, apple: 230, cherry: 280, peach: 320, avocado: 380, cacao: 420, coffee: 450 };
export const SEED_PRICES = { ...SEED_PRICE, ...SAPLING_PRICE };
for (const [id, c] of Object.entries(CROPS)) {
  const tree = c.kind === 'tree';
  const key = (tree ? 'sapling_' : 'seed_') + id;
  if (!CROP_ITEMS[key]) {
    CROP_ITEMS[key] = {
      name: tree ? `${c.name.replace(/ (Tree|Bush|Palm)$/, '')} Sapling` : `${c.name} Seeds`,
      icon: tree ? (c.tree === 'round' ? '🌳' : '🌴') : '🌱',
      type: 'seed',
      crop: id,
      sell: Math.max(1, Math.round((SEED_PRICES[id] || 10) / 4)),
      desc: tree ? `A tree! Fruits every ${c.regrow} hours, forever.` : `Grows in ${c.hours} hours. Harvest ${c.yield[0]}–${c.yield[1]}.`,
    };
  }
  c.seed = key;
}

/** Soil patches unlock as you level up: 6 at level 1, +2 per level, 50 at most. */
export const MAX_PLOTS = 50;
export const plotsForLevel = (level) => Math.min(MAX_PLOTS, 4 + level * 2);

// Irrigation upgrades for the whole farm (bought from Chloe).
export const IRRIGATION = [
  { level: 0, name: 'Watering can', desc: 'Water plots by hand.' },
  { level: 1, id: 'sprinklers', name: 'Sprinkler System', icon: '💦', reqLevel: 6, price: 900, desc: 'Every plot is watered automatically, every day.' },
  { level: 2, id: 'drip', name: 'Drip Irrigation', icon: '🚰', reqLevel: 12, price: 3200, gems: 10, desc: 'Watered crops grow twice as fast (instead of +50%).' },
];
