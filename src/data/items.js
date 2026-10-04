import { FISH, tierIndex } from './fish.js';

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
  berry_jam: { name: 'Berry Jam', icon: '🫙', type: 'product', sell: 52, heal: 15, desc: 'Grandma-approved.' },
  sugar_candy: { name: 'Cane Candy', icon: '🍬', type: 'product', sell: 45, heal: 10, desc: 'Sticky, sweet, addictive.' },
  fruit_salad: { name: 'Tropical Salad', icon: '🥗', type: 'product', sell: 140, heal: 40, desc: 'A rainbow in a bowl.' },
  fish_taco: { name: 'Fish Taco', icon: '🌮', type: 'product', sell: 95, heal: 45, desc: 'Grandma Rose\'s secret recipe.' },
  mango_smoothie: { name: 'Mango Smoothie', icon: '🥤', type: 'product', sell: 110, heal: 30, desc: 'Blended sunshine.' },
  melon_slush: { name: 'Melon Slush', icon: '🍧', type: 'product', sell: 160, heal: 35, desc: 'Brain freeze guaranteed.' },
  sushi_platter: { name: 'Sushi Platter', icon: '🍣', type: 'product', sell: 260, heal: 70, desc: 'Fresh from the reef.' },
  seafood_feast: { name: 'Seafood Feast', icon: '🦞', type: 'product', sell: 420, heal: 100, desc: 'Feeds a whole village.' },
  dragon_bowl: { name: 'Dragon Bowl', icon: '🍲', type: 'product', sell: 380, heal: 80, desc: 'Fiery and fabulous.' },
  health_tonic: { name: 'Health Tonic', icon: '🧪', type: 'product', sell: 20, heal: 80, desc: 'Sage\'s herbal brew.' },

  // Bait (consumed one per cast)
  bait_worm: { name: 'Worm', icon: '🪱', type: 'bait', sell: 1, desc: 'Basic bait. Wriggly and reliable.' },
  bait_cricket: { name: 'Cricket', icon: '🦗', type: 'bait', sell: 2, desc: 'Fish bite much faster, and less junk.' },
  bait_shrimp: { name: 'Shrimp Lure', icon: '🦐', type: 'bait', sell: 2, desc: 'More luck and a 15% chance of a better fish.' },
  bait_spinner: { name: 'Spinner Spoon', icon: '🥄', type: 'bait', sell: 4, desc: 'Flashes in the sun: big luck boost by day, half the junk.' },
  bait_glow: { name: 'Glow Lure', icon: '✨', type: 'bait', sell: 4, desc: 'Glows in the dark: huge luck at night and a 40% chance of a better fish.' },
  bait_squid: { name: 'Squid Strip', icon: '🦑', type: 'bait', sell: 5, desc: 'Deep-sea fish (🚤) bite twice as often. Great from a boat.' },
  bait_jig: { name: 'Storm Jig', icon: '🪶', type: 'bait', sell: 6, desc: 'Rain fish bite 2.5× more often in the rain.' },
  bait_magic: { name: 'Magic Lure', icon: '🪄', type: 'bait', sell: 10, desc: 'Huge luck boost and a 35% chance of a better fish. Almost no junk.' },

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

// ── Farm produce, animal goods, kitchen ingredients & farming supplies ──────────
Object.assign(ITEMS, {
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
  // animal goods
  egg: { name: 'Egg', icon: '🥚', type: 'animal', sell: 12, desc: 'Fresh from your chickens.' },
  milk: { name: 'Milk', icon: '🥛', type: 'animal', sell: 18, heal: 6, desc: 'From your cow. Makes butter and cheese.' },
  honey: { name: 'Honey', icon: '🍯', type: 'animal', sell: 30, heal: 8, desc: 'Golden honey from your bee hive.' },
  wool: { name: 'Wool', icon: '🧶', type: 'animal', sell: 40, desc: 'Soft wool from your sheep. Sells well.' },
  goat_milk: { name: 'Goat Milk', icon: '🍶', type: 'animal', sell: 26, heal: 6, desc: 'Creamy milk from your goats. Makes goat cheese.' },
  truffle: { name: 'Truffle', icon: '🍄', type: 'animal', sell: 120, desc: 'Sniffed out by your truffle pig. A gourmet treasure!' },
  // kitchen basics
  flour: { name: 'Flour', icon: '🥣', type: 'ingredient', sell: 18, desc: 'Milled wheat. The base of breads and cakes.' },
  sugar: { name: 'Cane Sugar', icon: '🧂', type: 'ingredient', sell: 24, desc: 'Sweetens drinks and desserts.' },
  butter: { name: 'Butter', icon: '🧈', type: 'ingredient', sell: 45, desc: 'Churned from fresh milk.' },
  cheese: { name: 'Cheese', icon: '🧀', type: 'ingredient', sell: 65, desc: 'Aged island cheese.' },
  tomato_sauce: { name: 'Tomato Sauce', icon: '🥫', type: 'ingredient', sell: 60, desc: 'Tomatoes and garlic, simmered.' },
  chocolate: { name: 'Chocolate', icon: '🍫', type: 'ingredient', sell: 120, heal: 10, desc: 'Made from your own cacao.' },
  goat_cheese: { name: 'Goat Cheese', icon: '🫓', type: 'ingredient', sell: 75, desc: 'Tangy and crumbly.' },
  coffee: { name: 'Coffee', icon: '☕', type: 'ingredient', sell: 75, heal: 5, desc: 'Fresh brewed. Wakes up the whole island.' },
  // farming supplies
  animal_feed: { name: 'Animal Feed', icon: '🪣', type: 'farm', sell: 2, desc: 'Put it in your Feeder — your animals eat from it. Make feed from crops at the Feeder, or buy it from Chloe.' },
  fertilizer: { name: 'Fertilizer', icon: '🧴', type: 'farm', sell: 5, desc: 'Use on a growing crop: grows 40% faster and gives +1 harvest.' },
  super_fertilizer: { name: 'Super Fertilizer', icon: '💫', type: 'farm', sell: 15, desc: 'Use on a growing crop: grows 80% faster and gives +2 harvest.' },
  // new dishes
  lemonade: { name: 'Lemonade', icon: '🍹', type: 'product', sell: 72, heal: 15, desc: 'Fresh squeezed. Perfect on a hot day.' },
  orange_juice: { name: 'Orange Juice', icon: '🫗', type: 'product', sell: 75, heal: 18, desc: 'Breakfast of champions.' },
  honey_tea: { name: 'Honey Lemon Tea', icon: '🍵', type: 'product', sell: 85, heal: 20, desc: 'Soothing and sweet.' },
  mango_boba: { name: 'Mango Boba', icon: '🧋', type: 'product', sell: 135, heal: 22, desc: 'Chewy, creamy, tropical.' },
  mocha: { name: 'Mocha Latte', icon: '🫖', type: 'product', sell: 340, heal: 30, desc: 'Coffee, chocolate and milk. Pure luxury.' },
  fries: { name: 'Island Fries', icon: '🍟', type: 'product', sell: 38, heal: 15, desc: 'Golden and crispy.' },
  veggie_skewer: { name: 'Veggie Skewer', icon: '🍡', type: 'product', sell: 50, heal: 18, desc: 'Grilled carrots and tomatoes on a stick.' },
  garden_wrap: { name: 'Garden Wrap', icon: '🌯', type: 'product', sell: 70, heal: 22, desc: 'Fresh veggies rolled up tight.' },
  popcorn: { name: 'Butter Popcorn', icon: '🍿', type: 'product', sell: 110, heal: 12, desc: 'Movie night on the beach!' },
  candy_apple: { name: 'Candy Apple', icon: '🍭', type: 'product', sell: 60, heal: 10, desc: 'Shiny, sticky, delicious.' },
  rice_ball: { name: 'Rice Ball', icon: '🍙', type: 'product', sell: 55, heal: 20, desc: 'Wrapped in seaweed.' },
  bread: { name: 'Fresh Bread', icon: '🍞', type: 'product', sell: 50, heal: 20, desc: 'Warm from the oven.' },
  avocado_toast: { name: 'Avocado Toast', icon: '🥪', type: 'product', sell: 150, heal: 30, desc: 'Trendy AND tasty.' },
  omelette: { name: 'Veggie Omelette', icon: '🍳', type: 'product', sell: 85, heal: 30, desc: 'Fluffy eggs with onion.' },
  pancakes: { name: 'Pancakes', icon: '🥞', type: 'product', sell: 125, heal: 30, desc: 'A tall, golden stack.' },
  waffles: { name: 'Honey Waffles', icon: '🧇', type: 'product', sell: 215, heal: 35, desc: 'Crispy squares drizzled with honey.' },
  croissant: { name: 'Croissant', icon: '🥐', type: 'product', sell: 130, heal: 20, desc: 'Flaky and buttery.' },
  fish_chips: { name: 'Fish & Chips', icon: '🍤', type: 'product', sell: 120, heal: 45, desc: 'Crispy fish, golden fries.' },
  fish_stew: { name: "Fisherman's Stew", icon: '🥘', type: 'product', sell: 150, heal: 50, desc: 'Ross swears by it.' },
  fish_burger: { name: 'Fish Burger', icon: '🍔', type: 'product', sell: 220, heal: 50, desc: 'Island-style burger.' },
  veggie_curry: { name: 'Veggie Curry', icon: '🍛', type: 'product', sell: 190, heal: 50, desc: 'Warm, spicy and filling.' },
  corn_chowder: { name: 'Corn Chowder', icon: '🫕', type: 'product', sell: 175, heal: 45, desc: 'Creamy corn soup.' },
  dumplings: { name: 'Veggie Dumplings', icon: '🥟', type: 'product', sell: 185, heal: 40, desc: 'Steamed little pockets of joy.' },
  spaghetti: { name: 'Spaghetti', icon: '🍝', type: 'product', sell: 235, heal: 55, desc: 'Tomato sauce and fresh basil.' },
  pizza: { name: 'Island Pizza', icon: '🍕', type: 'product', sell: 310, heal: 60, desc: 'Cheesy, saucy, perfect.' },
  bento: { name: 'Bento Box', icon: '🍱', type: 'product', sell: 285, heal: 60, desc: 'A little bit of everything.' },
  truffle_noodles: { name: 'Truffle Noodles', icon: '🍜', type: 'product', sell: 540, heal: 70, desc: 'The fanciest dish on the islands.' },
  cookies: { name: 'Butter Cookies', icon: '🍪', type: 'product', sell: 105, heal: 15, desc: 'Grandma-approved.' },
  cupcake: { name: 'Strawberry Cupcake', icon: '🧁', type: 'product', sell: 160, heal: 20, desc: 'Pink frosting on top.' },
  ice_cream: { name: 'Cherry Ice Cream', icon: '🍨', type: 'product', sell: 195, heal: 20, desc: 'Cold, creamy, cherry on top.' },
  custard: { name: 'Honey Custard', icon: '🍮', type: 'product', sell: 175, heal: 25, desc: 'Wobbly and wonderful.' },
  donut: { name: 'Glazed Donut', icon: '🍩', type: 'product', sell: 180, heal: 20, desc: 'Sweet, round, irresistible.' },
  peach_parfait: { name: 'Peach Parfait', icon: '🍦', type: 'product', sell: 205, heal: 25, desc: 'Layers of peach, honey and cream.' },
  pumpkin_pie: { name: 'Pumpkin Pie', icon: '🥧', type: 'product', sell: 270, heal: 40, desc: 'A slice of autumn.' },
  cake: { name: 'Strawberry Cake', icon: '🎂', type: 'product', sell: 490, heal: 50, desc: 'A celebration in every bite.' },
  chocolate_cake: { name: 'Chocolate Cake', icon: '🍰', type: 'product', sell: 540, heal: 50, desc: 'Rich, dark, decadent.' },
  goat_salad: { name: 'Goat Cheese Salad', icon: '🫒', type: 'product', sell: 165, heal: 35, desc: 'Fresh greens with tangy goat cheese.' },
  sardine_bagel: { name: 'Sardine Bagel', icon: '🥯', type: 'product', sell: 70, heal: 25, desc: 'Grilled sardines on a toasted bagel.' },
  smoked_mackerel: { name: 'Smoked Mackerel', icon: '🥓', type: 'product', sell: 75, heal: 30, desc: 'Slow-smoked with sweet onions.' },
  fish_cakes: { name: 'Fish Cakes', icon: '🍥', type: 'product', sell: 120, heal: 35, desc: 'Crispy cakes of fish, potato and egg.' },
  calamari: { name: 'Calamari Rings', icon: '🥨', type: 'product', sell: 135, heal: 30, desc: 'Golden squid rings with a squeeze of lemon.' },
  lemon_flounder: { name: 'Lemon Butter Flounder', icon: '🍽️', type: 'product', sell: 150, heal: 40, desc: 'A delicate fillet in lemon butter.' },
  tuna_steak: { name: 'Seared Tuna Steak', icon: '🥩', type: 'product', sell: 210, heal: 55, desc: 'Garlic-butter seared tuna. Fancy!' },
  snapper_curry: { name: 'Snapper Curry Box', icon: '🥡', type: 'product', sell: 230, heal: 55, desc: 'Red snapper in a spicy pepper curry.' },
  grilled_octopus: { name: 'Grilled Octopus', icon: '🐙', type: 'product', sell: 330, heal: 50, desc: 'Charred, tender, with lemon and garlic.' },
  oyster_platter: { name: 'Oyster Platter', icon: '🦪', type: 'product', sell: 480, heal: 40, desc: 'Fresh pearl oysters on ice. Very posh.' },
  swordfish_wrap: { name: 'Swordfish Wrap', icon: '🥙', type: 'product', sell: 560, heal: 70, desc: 'Grilled swordfish rolled with fresh veggies.' },
  deluxe_sashimi: { name: 'Deluxe Sashimi', icon: '🥢', type: 'product', sell: 380, heal: 50, desc: 'Paper-thin slices of a rare fish.' },
  island_banquet: { name: 'Island Banquet', icon: '🏝️', type: 'product', sell: 1400, heal: 100, desc: 'A feast fit for the whole archipelago.' },
});

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
  if (!ITEMS[key]) {
    ITEMS[key] = {
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

// Irrigation upgrades for the whole farm (bought from Chloe).
export const IRRIGATION = [
  { level: 0, name: 'Watering can', desc: 'Water plots by hand.' },
  { level: 1, id: 'sprinklers', name: 'Sprinkler System', icon: '💦', reqLevel: 6, price: 900, desc: 'Every plot is watered automatically, every day.' },
  { level: 2, id: 'drip', name: 'Drip Irrigation', icon: '🚰', reqLevel: 12, price: 3200, gems: 10, desc: 'Watered crops grow twice as fast (instead of +50%).' },
];

// Kitchen recipes. cat: basics | drinks | snacks | meals | desserts | feasts. qty: how many you make.
// Inputs can be any item id, 'anyFish' (cheapest fish first) or 'seaweed'.
export const RECIPE_CATS = [
  { id: 'all', name: 'All', icon: '📖' },
  { id: 'basics', name: 'Basics', icon: '🥣' },
  { id: 'drinks', name: 'Drinks', icon: '🍹' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' },
  { id: 'meals', name: 'Meals', icon: '🍲' },
  { id: 'desserts', name: 'Desserts', icon: '🧁' },
  { id: 'feasts', name: 'Feasts', icon: '🦞' },
];
export const RECIPES = [
  // basics
  { id: 'flour', cat: 'basics', inputs: { wheat: 3 }, out: 'flour', level: 2 },
  { id: 'sugar', cat: 'basics', inputs: { sugarcane: 2 }, out: 'sugar', level: 2 },
  { id: 'tomato_sauce', cat: 'basics', inputs: { tomato: 3, garlic: 1 }, out: 'tomato_sauce', level: 5 },
  { id: 'butter', cat: 'basics', inputs: { milk: 2 }, out: 'butter', level: 6 },
  { id: 'cheese', cat: 'basics', inputs: { milk: 3 }, out: 'cheese', level: 7 },
  { id: 'goat_cheese', cat: 'basics', inputs: { goat_milk: 2 }, out: 'goat_cheese', level: 7 },
  { id: 'chocolate', cat: 'basics', inputs: { cacao: 3, sugar: 1 }, out: 'chocolate', level: 12 },
  { id: 'coffee', cat: 'basics', inputs: { coffee_beans: 3 }, out: 'coffee', level: 13 },
  // drinks
  { id: 'coconut_juice', cat: 'drinks', inputs: { coconut: 2 }, out: 'coconut_juice', level: 1 },
  { id: 'lemonade', cat: 'drinks', inputs: { lemon: 2, sugar: 1 }, out: 'lemonade', level: 5 },
  { id: 'mango_smoothie', cat: 'drinks', inputs: { mango: 2, banana: 1 }, out: 'mango_smoothie', level: 4 },
  { id: 'orange_juice', cat: 'drinks', inputs: { orange: 3 }, out: 'orange_juice', level: 6 },
  { id: 'melon_slush', cat: 'drinks', inputs: { watermelon: 1, sugarcane: 2 }, out: 'melon_slush', level: 6 },
  { id: 'honey_tea', cat: 'drinks', inputs: { honey: 1, lemon: 1 }, out: 'honey_tea', level: 8 },
  { id: 'mango_boba', cat: 'drinks', inputs: { mango: 1, milk: 1, sugar: 1 }, out: 'mango_boba', level: 9 },
  { id: 'mocha', cat: 'drinks', inputs: { coffee: 1, chocolate: 1, milk: 1 }, out: 'mocha', level: 15 },
  // snacks
  { id: 'berry_jam', cat: 'snacks', inputs: { strawberry: 3 }, out: 'berry_jam', level: 1 },
  { id: 'sugar_candy', cat: 'snacks', inputs: { sugarcane: 3 }, out: 'sugar_candy', level: 2 },
  { id: 'veggie_skewer', cat: 'snacks', inputs: { carrot: 2, tomato: 1 }, out: 'veggie_skewer', level: 3 },
  { id: 'fries', cat: 'snacks', inputs: { potato: 2 }, out: 'fries', level: 4 },
  { id: 'garden_wrap', cat: 'snacks', inputs: { lettuce: 1, tomato: 1, carrot: 1 }, out: 'garden_wrap', level: 4 },
  { id: 'bread', cat: 'snacks', inputs: { flour: 2 }, out: 'bread', level: 2 },
  { id: 'goat_salad', cat: 'snacks', inputs: { lettuce: 1, tomato: 1, goat_cheese: 1 }, out: 'goat_salad', level: 8 },
  { id: 'fruit_salad', cat: 'snacks', inputs: { pineapple: 1, mango: 1, banana: 1, strawberry: 2 }, out: 'fruit_salad', level: 5 },
  { id: 'rice_ball', cat: 'snacks', inputs: { rice: 2, seaweed: 1 }, out: 'rice_ball', level: 6 },
  { id: 'popcorn', cat: 'snacks', inputs: { corn: 2, butter: 1 }, out: 'popcorn', level: 7 },
  { id: 'candy_apple', cat: 'snacks', inputs: { apple: 1, sugar: 1 }, out: 'candy_apple', level: 7 },
  { id: 'avocado_toast', cat: 'snacks', inputs: { avocado: 1, bread: 1 }, out: 'avocado_toast', level: 11 },
  // meals
  { id: 'grilled_fish', cat: 'meals', inputs: { anyFish: 1 }, out: 'grilled_fish', level: 1 },
  { id: 'sardine_bagel', cat: 'snacks', inputs: { fish_sardine: 2, flour: 1 }, out: 'sardine_bagel', level: 3 },
  { id: 'smoked_mackerel', cat: 'meals', inputs: { fish_mackerel: 2, onion: 1 }, out: 'smoked_mackerel', level: 5 },
  { id: 'fish_cakes', cat: 'meals', inputs: { commonFish: 2, potato: 1, egg: 1 }, out: 'fish_cakes', level: 6 },
  { id: 'calamari', cat: 'snacks', inputs: { fish_squid: 1, flour: 1, lemon: 1 }, out: 'calamari', level: 6 },
  { id: 'lemon_flounder', cat: 'meals', inputs: { fish_flounder: 1, butter: 1, lemon: 1 }, out: 'lemon_flounder', level: 7 },
  { id: 'tuna_steak', cat: 'meals', inputs: { fish_tuna: 1, butter: 1, garlic: 1 }, out: 'tuna_steak', level: 7 },
  { id: 'snapper_curry', cat: 'meals', inputs: { fish_snapper: 1, rice: 2, pepper: 1, onion: 1 }, out: 'snapper_curry', level: 8 },
  { id: 'grilled_octopus', cat: 'meals', inputs: { fish_octopus: 1, garlic: 1, lemon: 1 }, out: 'grilled_octopus', level: 9 },
  { id: 'oyster_platter', cat: 'feasts', inputs: { fish_pearl_oyster: 2, lemon: 1 }, out: 'oyster_platter', level: 9 },
  { id: 'deluxe_sashimi', cat: 'meals', inputs: { rareFish: 1, rice: 1, seaweed: 1 }, out: 'deluxe_sashimi', level: 10 },
  { id: 'swordfish_wrap', cat: 'feasts', inputs: { fish_swordfish: 1, flour: 1, lettuce: 1, tomato: 1 }, out: 'swordfish_wrap', level: 12 },
  { id: 'fish_taco', cat: 'meals', inputs: { anyFish: 1, pineapple: 1 }, out: 'fish_taco', level: 3 },
  { id: 'omelette', cat: 'meals', inputs: { egg: 2, onion: 1 }, out: 'omelette', level: 5 },
  { id: 'fish_chips', cat: 'meals', inputs: { anyFish: 1, potato: 2 }, out: 'fish_chips', level: 5 },
  { id: 'fish_stew', cat: 'meals', inputs: { anyFish: 2, tomato: 1, onion: 1 }, out: 'fish_stew', level: 6 },
  { id: 'pancakes', cat: 'meals', inputs: { flour: 1, egg: 1, milk: 1 }, out: 'pancakes', level: 7 },
  { id: 'veggie_curry', cat: 'meals', inputs: { rice: 2, potato: 1, carrot: 1, onion: 1 }, out: 'veggie_curry', level: 7 },
  { id: 'sushi_platter', cat: 'meals', inputs: { anyFish: 3, seaweed: 1 }, out: 'sushi_platter', level: 8 },
  { id: 'croissant', cat: 'meals', inputs: { flour: 2, butter: 1 }, out: 'croissant', level: 8 },
  { id: 'spaghetti', cat: 'meals', inputs: { flour: 2, tomato_sauce: 1, basil: 1 }, out: 'spaghetti', level: 8 },
  { id: 'corn_chowder', cat: 'meals', inputs: { corn: 2, milk: 1, potato: 1 }, out: 'corn_chowder', level: 9 },
  { id: 'fish_burger', cat: 'meals', inputs: { flour: 1, anyFish: 1, lettuce: 1, tomato: 1 }, out: 'fish_burger', level: 9 },
  { id: 'waffles', cat: 'meals', inputs: { flour: 1, egg: 1, butter: 1, honey: 1 }, out: 'waffles', level: 9 },
  { id: 'pizza', cat: 'meals', inputs: { flour: 2, tomato_sauce: 1, cheese: 1 }, out: 'pizza', level: 9 },
  { id: 'dumplings', cat: 'meals', inputs: { flour: 1, carrot: 1, onion: 1, garlic: 1 }, out: 'dumplings', level: 10 },
  { id: 'bento', cat: 'meals', inputs: { rice: 2, anyFish: 1, egg: 1, carrot: 1 }, out: 'bento', level: 11 },
  { id: 'dragon_bowl', cat: 'meals', inputs: { dragonfruit: 2, coconut: 1, anyFish: 1 }, out: 'dragon_bowl', level: 12 },
  { id: 'truffle_noodles', cat: 'meals', inputs: { flour: 2, truffle: 1, butter: 1 }, out: 'truffle_noodles', level: 14 },
  // desserts
  { id: 'cookies', cat: 'desserts', inputs: { flour: 1, sugar: 1, butter: 1 }, out: 'cookies', level: 6 },
  { id: 'cupcake', cat: 'desserts', inputs: { flour: 1, egg: 1, sugar: 1, strawberry: 2 }, out: 'cupcake', level: 8 },
  { id: 'ice_cream', cat: 'desserts', inputs: { milk: 2, sugar: 1, cherry: 2 }, out: 'ice_cream', level: 9 },
  { id: 'custard', cat: 'desserts', inputs: { milk: 1, egg: 2, honey: 1 }, out: 'custard', level: 10 },
  { id: 'pumpkin_pie', cat: 'desserts', inputs: { pumpkin: 1, flour: 1, egg: 1, sugar: 1 }, out: 'pumpkin_pie', level: 10 },
  { id: 'donut', cat: 'desserts', inputs: { flour: 1, sugar: 1, egg: 1, butter: 1 }, out: 'donut', level: 11 },
  { id: 'peach_parfait', cat: 'desserts', inputs: { peach: 2, milk: 1, honey: 1 }, out: 'peach_parfait', level: 11 },
  { id: 'cake', cat: 'desserts', inputs: { flour: 2, egg: 2, butter: 1, sugar: 2, strawberry: 2 }, out: 'cake', level: 13 },
  { id: 'chocolate_cake', cat: 'desserts', inputs: { flour: 2, egg: 2, chocolate: 1, milk: 1 }, out: 'chocolate_cake', level: 14 },
  // feasts
  { id: 'seafood_feast', cat: 'feasts', inputs: { anyFish: 5, coconut: 1, pineapple: 1 }, out: 'seafood_feast', level: 10 },
  { id: 'island_banquet', cat: 'feasts', inputs: { pizza: 1, fruit_salad: 1, cake: 1, lemonade: 1 }, out: 'island_banquet', level: 16 },
];
// seaweed is caught as "fish_seaweed" — map recipe key to it
export const RECIPE_ALIASES = { seaweed: 'fish_seaweed' };

/** Recipe inputs that accept a choice of fish. In the kitchen you pick exactly which fish to use. */
export const FISH_INPUTS = {
  anyFish: { name: 'Any fish', icon: '🐟', desc: 'Any fish (not junk) — you choose which.', test: (it) => it.type === 'fish' && it.tier !== 'junk' },
  commonFish: { name: 'Common fish', icon: '🐟', desc: 'Any common fish — sardines, bream, mackerel…', test: (it) => it.type === 'fish' && it.tier === 'common' },
  rareFish: { name: 'Rare fish', icon: '🐠', desc: 'Any rare (or rarer) fish.', test: (it) => it.type === 'fish' && tierIndex(it.tier) >= tierIndex('rare') },
};
/** Fish in the bag that fit a fish input, cheapest first. */
export function fishFor(key, inventory) {
  const f = FISH_INPUTS[key];
  return Object.keys(inventory)
    .filter((id) => inventory[id] > 0 && ITEMS[id] && f.test(ITEMS[id]))
    .sort((a, b) => ITEMS[a].sell - ITEMS[b].sell);
}

export function itemIcon(id) {
  return ITEMS[id]?.icon ?? '❔';
}
