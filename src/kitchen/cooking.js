import { emojiSprite } from '../world/fx.js';
import { ITEMS } from '../shared/items.js';
import { RECIPES, RECIPE_ALIASES, FISH_INPUTS } from './recipes.js';

/**
 * Cooking: counting ingredients, choosing which fish go into a dish, and cooking it.
 * Mixed into Game (game.js), so `this` is the game.
 */
export const CookingMethods = {
  ingredientCount(k) {
    const inv = this.state.inventory;
    if (FISH_INPUTS[k]) return fishFor(k, inv).reduce((sum, id) => sum + inv[id], 0);
    return inv[RECIPE_ALIASES[k] || k] || 0;
  },
  canCook(r) {
    return Object.entries(r.inputs).every(([k, n]) => this.ingredientCount(k) >= n);
  },
  /**
   * Which fish to use for a fish input: the player's pick ({ fishId: count }) if it's valid,
   * otherwise the cheapest fish in the bag.
   */
  fishPlan(k, n, pick) {
    const inv = this.state.inventory;
    if (pick) {
      const total = Object.values(pick).reduce((a, b) => a + b, 0);
      const ok = total === n && Object.entries(pick).every(([id, c]) => c >= 0 && (inv[id] || 0) >= c && FISH_INPUTS[k].test(ITEMS[id] || {}));
      if (ok) return Object.fromEntries(Object.entries(pick).filter(([, c]) => c > 0));
    }
    const plan = {};
    let left = n;
    for (const id of fishFor(k, inv)) {
      const take = Math.min(left, inv[id]);
      if (take) plan[id] = take;
      left -= take;
      if (!left) break;
    }
    return left ? null : plan;
  },
  /** Cook a recipe once. opts.fish = { anyFish: { fish_sardine: 1 } } chooses the fish to use. */
  cook(id, opts = {}) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r || !this.canCook(r) || this.state.level < r.level) return false;
    const plans = {};
    for (const [k, n] of Object.entries(r.inputs)) {
      if (!FISH_INPUTS[k]) continue;
      plans[k] = this.fishPlan(k, n, opts.fish?.[k]);
      if (!plans[k]) return false;
    }
    for (const [k, n] of Object.entries(r.inputs)) {
      if (FISH_INPUTS[k]) for (const [f, c] of Object.entries(plans[k])) this.removeItem(f, c, true);
      else this.removeItem(RECIPE_ALIASES[k] || k, n, true);
    }
    this.addItem(r.out, r.qty || 1, true);
    if (this.home.firePos && this.world?.id === 'palmora') {
      const from = this.home.firePos.clone().setY(this.home.firePos.y + 1);
      this.particles.burst(from, { count: 16, color: '#f4f1e8', speed: 0.8, up: 3, life: 1.2, gravity: -1 });
      this.fx.collect(emojiSprite(ITEMS[r.out].icon, 0.8), from, { dur: 0.7 });
    }
    this.state.stats.cooked++;
    this.audio.sfx('harvest');
    // basics (flour, sugar…) give a little XP, real dishes more
    this.addXP(r.cat === 'basics' ? 4 + r.level : 10 + r.level * 4);
    this.events.emit('cook', { recipe: r.out });
    return true;
  },
};

/** Fish in the bag that fit a fish input, cheapest first. */
export function fishFor(key, inventory) {
  const f = FISH_INPUTS[key];
  return Object.keys(inventory)
    .filter((id) => inventory[id] > 0 && ITEMS[id] && f.test(ITEMS[id]))
    .sort((a, b) => ITEMS[a].sell - ITEMS[b].sell);
}
