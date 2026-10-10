import { FISH_ITEMS } from '../fishing/fish.js';
import { BAIT_ITEMS } from '../fishing/gear.js';
import { CROP_ITEMS } from '../farm/crops.js';
import { ANIMAL_ITEMS } from '../farm/animals.js';
import { KITCHEN_ITEMS } from '../kitchen/recipes.js';
import { DECOR_ITEMS } from '../home/houses.js';

/**
 * Every item in the game, by id. The basics live here; each feature adds its own items:
 * fish (fishing/fish.js), lures (fishing/gear.js), crops & seeds (farm/crops.js),
 * animal goods & farm supplies (farm/animals.js), ingredients & dishes (kitchen/recipes.js)
 * and decorations (home/houses.js).
 */
// type: fish | fruit | crop | animal | ingredient | product | farm | material | collectible | treasure | seed | bait | tool | decor | special | trophy
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

  // Tools
  shovel: { name: 'Shovel', icon: '⛏️', type: 'tool', sell: 0, desc: 'Dig up treasure at X marks.' },

  // Trophies
  trophy_bronze: { name: 'Bronze Cup', icon: '🥉', type: 'trophy', sell: 0, desc: 'Bronze League champion.' },
  trophy_silver: { name: 'Silver Cup', icon: '🥈', type: 'trophy', sell: 0, desc: 'Silver League champion.' },
  trophy_gold: { name: 'Gold Cup', icon: '🏆', type: 'trophy', sell: 0, desc: 'Gold League champion!' },
};
Object.assign(ITEMS, FISH_ITEMS, BAIT_ITEMS, CROP_ITEMS, ANIMAL_ITEMS, KITCHEN_ITEMS, DECOR_ITEMS);

export function itemIcon(id) {
  return ITEMS[id]?.icon ?? '❔';
}
