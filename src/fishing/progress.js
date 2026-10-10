import { TIERS, tierIndex } from './fish.js';
import { BOATS_BY_ID } from './gear.js';

const NEW_SPECIES_GEMS = { junk: 0, common: 0, uncommon: 1, rare: 2, epic: 4, legendary: 10, mythic: 30 };

/**
 * Your fishing progress: recording catches in the Fishdex (records, new-species gems)
 * and which boat you own. Mixed into Game (game.js), so `this` is the game.
 */
export const FishingProgressMethods = {
  recordCatch(f, weight, opts = {}) {
    const { perfect } = opts;
    const s = this.state;
    const dex = s.fishdex[f.id];
    const isNew = !dex;
    const record = !!dex && weight > dex.best;
    s.fishdex[f.id] = { count: (dex?.count || 0) + 1, best: Math.max(dex?.best || 0, weight) };
    this.addItem('fish_' + f.id, 1, true);
    if (f.id === 'pearl_oyster' && Math.random() < 0.4) this.addItem('pearl', 1);
    s.stats.caught++;
    const xp = TIERS[f.tier].xp + (isNew ? 10 : 0);
    let perfectBonus = 0;
    if (perfect && f.tier !== 'junk') {
      perfectBonus = Math.max(2, Math.round(f.price * 0.2));
      s.stats.perfect++;
      this.give({ coins: perfectBonus }, { quiet: true });
    }
    this.addXP(xp);
    if (isNew && NEW_SPECIES_GEMS[f.tier]) this.give({ gems: NEW_SPECIES_GEMS[f.tier] }, { quiet: true });
    const found = Object.keys(s.fishdex).length;
    if (isNew && found % 5 === 0) {
      setTimeout(() => {
        this.ui.banner('Fishdex Milestone!', `${found} species discovered · +5 gems`, '📘');
        this.give({ gems: 5 }, { quiet: true });
      }, 1200);
    }
    const points = this.competition.onCatch(f, weight);
    this.audio.sfx(tierIndex(f.tier) >= 3 ? 'catchRare' : 'catch');
    if (tierIndex(f.tier) >= 4) this.particles.burst(this.player.pos.clone().setY(this.player.pos.y + 1.5), { count: 50, color: TIERS[f.tier].color, speed: 5, up: 6, life: 1.4 });
    this.events.emit('catch', { fish: f, weight, night: this.time.isNight(), island: this.world.id, perfect, bait: opts.bait, boat: opts.boat, rod: opts.rod });
    this.ui.refreshHud();
    return { isNew, record, xp, perfectBonus, points };
  },

  boatTierOf(id) {
    return BOATS_BY_ID[id]?.tier ?? 0;
  },
  boatTier() {
    return this.state ? this.boatTierOf(this.state.boat) : 0;
  },
};
