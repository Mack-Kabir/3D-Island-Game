import * as THREE from 'three';
import { COSMETICS } from '../people/cosmetics.js';
import { rand, randInt, pick } from '../shared/utils.js';
import { itemMesh } from './fx.js';

/**
 * Foraging on every island: shaking wild fruit trees and digging up treasure.
 * Mixed into HomeSystem (home/homestead.js), so `this` is the homestead.
 */
export const ForagingMethods = {
  // ── wild trees & treasure (all islands) ────────
  treeReady(island, idx) {
    const ws = this.game.worldState(island);
    const last = ws.trees?.[idx];
    return last === undefined || this.game.time.abs() - last > 12 * 60;
  },
  shakeTree(world, tree) {
    const g = this.game;
    if (!this.treeReady(world.id, tree.idx)) {
      g.ui.toast('This tree needs time to regrow its fruit.', 'info');
      return;
    }
    const ws = g.worldState(world.id);
    ws.trees = ws.trees || {};
    ws.trees[tree.idx] = g.time.abs();
    const n = randInt(1, 3);
    g.audio.sfx('shake');
    g.player.char.play('swing', 0.4);
    g.particles.burst(tree.pos.clone().setY(tree.pos.y + 3), { count: 18, color: '#6aa86a', speed: 2.5, up: 1, gravity: 4, life: 1.2 });
    // fruit tumbles out of the canopy, bounces, then the player picks it up
    let landed = 0;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const from = tree.pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.9, tree.fruit === 'coconut' ? 5 : 3.2, Math.sin(a) * 0.9));
      g.fx.drop(itemMesh(tree.fruit), from, world.heightAt(from.x, from.z), {
        delay: k * 0.15,
        onDone: () => {
          g.addItem(tree.fruit, 1, true);
          g.audio.sfx('pickup');
          if (++landed === n) {
            g.ui.itemToast(tree.fruit, n);
            g.events.emit('collect', { item: tree.fruit });
            g.addXP(2);
          }
        },
      });
    }
  },
  dig(world, spot) {
    const g = this.game;
    if (!g.hasItem('shovel')) {
      g.ui.toast('You need a Shovel — Chloe sells them.', 'warn');
      return;
    }
    g.worldState(world.id).dug.push(spot.i);
    world.removeDigSpot(spot);
    g.player.char.play('dig', 0.8);
    g.audio.sfx('dig');
    g.particles.burst(spot.pos.clone().setY(spot.pos.y + 0.3), { count: 24, color: '#d9c08f', speed: 3, up: 4 });
    this.s.stats.dug++;
    g.events.emit('collect', { item: 'treasure' });
    g.fx.chest(spot.pos.clone(), () => this.treasureLoot(world.id));
  },
  treasureLoot(island) {
    const g = this.game;
    const r = Math.random();
    const deep = island === 'skull' ? 2 : island === 'ember' ? 1.5 : island === 'coralia' ? 1.2 : 1;
    const loot = { coins: Math.round(rand(25, 70) * deep), xp: 25 };
    let extra = '';
    if (r < 0.35) loot.gems = randInt(2, 6);
    if (r > 0.6) {
      const pool = island === 'skull' ? ['doubloon', 'doubloon', 'ruby', 'pearl'] : ['pearl', 'starfish', 'bait_magic', 'bottle', 'doubloon'];
      const it = pick(pool);
      loot.items = { [it]: it === 'bait_magic' ? 3 : 1 };
    }
    if (r > 0.93) {
      const locked = Object.values(COSMETICS).filter((c) => !g.state.cosmetics.includes(c.id) && !c.reward && (c.price > 0 || c.gems > 0));
      if (locked.length) {
        const c = pick(locked);
        loot.cosmetics = [c.id];
        extra = ` and a ${c.name}!`;
      }
    }
    g.ui.banner('Treasure!', `You dug up a chest${extra}`, '💰');
    g.audio.sfx('chest');
    g.give(loot);
  },
};
