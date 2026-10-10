import { el, formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { TIER_ORDER } from '../fishing/fish.js';

// Little building blocks shared by every menu panel.
export const h = el;
export const btn = (text, onclick, cls = '', disabled = false, attrs = {}) => h('button', { class: `btn ${cls}`, onclick, disabled, ...attrs, html: text });
export const price = (coins, gems) => [coins ? `<span class="price coin">🪙 ${formatNum(coins)}</span>` : '', gems ? `<span class="price gem">💎 ${formatNum(gems)}</span>` : '', !coins && !gems ? '<span class="price free">Free</span>' : ''].join('');
export const empty = (text, icon = '🌊') => h('div', { class: 'empty' }, [h('div', { class: 'empty-icon', text: icon }), h('p', { text })]);
export const section = (title, ...kids) => h('section', { class: 'sec' }, [title ? h('h3', { text: title }) : null, ...kids]);

export const TYPE_ORDER = ['fish', 'fruit', 'crop', 'animal', 'ingredient', 'product', 'seed', 'farm', 'bait', 'material', 'collectible', 'treasure', 'decor', 'special', 'tool', 'trophy'];
export const TYPE_LABEL = { fish: 'Fish', fruit: 'Fruit', crop: 'Vegetables & Grains', animal: 'Animal Goods', ingredient: 'Kitchen Basics', farm: 'Farm Supplies', product: 'Food', seed: 'Seeds', bait: 'Bait', material: 'Materials', collectible: 'Collectibles', treasure: 'Treasure', decor: 'Decor', special: 'Special', tool: 'Tools', trophy: 'Trophies' };

export function sortedInventory(state, filter) {
  return Object.entries(state.inventory)
    .filter(([id, n]) => n > 0 && ITEMS[id] && (!filter || filter(ITEMS[id], id)))
    .sort((a, b) => {
      const ia = ITEMS[a[0]];
      const ib = ITEMS[b[0]];
      const t = TYPE_ORDER.indexOf(ia.type) - TYPE_ORDER.indexOf(ib.type);
      if (t) return t;
      if (ia.type === 'fish') return TIER_ORDER.indexOf(ib.tier) - TIER_ORDER.indexOf(ia.tier);
      return ia.name.localeCompare(ib.name);
    });
}
