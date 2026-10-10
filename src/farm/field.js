import * as THREE from 'three';
import { G, mat4 } from '../world/toon.js';
import { CROPS, MAX_PLOTS, plotsForLevel } from './crops.js';
import { ITEMS } from '../shared/items.js';
import { ANIMALS } from './animals.js';
import { Batcher } from '../world/toon.js';
import { randInt } from '../shared/utils.js';
import { itemMesh } from '../world/fx.js';
import { cropModel } from './models.js';

const COLS = 10;
const GAP = 2.4;
const FERT = { fertilizer: { level: 1, speed: 1.4, bonus: 1 }, super_fertilizer: { level: 2, speed: 1.8, bonus: 2 } };
const FERT_BY_LEVEL = { 1: FERT.fertilizer, 2: FERT.super_fertilizer };

/**
 * The farm field at your homestead: soil patches that unlock with your level, planting,
 * watering, fertilising, harvesting, irrigation, and crop/animal growth over time.
 * Mixed into HomeSystem (home/homestead.js), so `this` is the homestead.
 */
export const FieldMethods = {
  /** Soil patches unlock with your level (never fewer than you already farm). */
  plotCount() {
    return Math.min(MAX_PLOTS, Math.max(plotsForLevel(this.s.level), this.s.farm.plots.length));
  },
  ensurePlots() {
    const n = this.plotCount();
    while (this.s.farm.plots.length < n) this.s.farm.plots.push({ crop: null });
  },
  /** Level at which plot #i unlocks. */
  plotLevel(i) {
    let l = 1;
    while (plotsForLevel(l) <= i && l < 99) l++;
    return l;
  },
  irrigation() {
    return this.s.farm.irrigation || 0;
  },
  isWatered(p) {
    return this.irrigation() >= 1 || this.game.weather.raining() || p.watered === this.s.time.day;
  },

  // ── growth ─────────────────────────────────────
  grow(minutes) {
    const s = this.s;
    if (!s) return;
    let changed = false;
    for (const p of s.farm.plots) {
      if (!p.crop) continue;
      const c = CROPS[p.crop];
      const watered = this.isWatered(p);
      const fert = FERT_BY_LEVEL[p.fert];
      const rate = ((watered ? (this.irrigation() >= 2 ? 2 : 1.5) : 1) * (fert ? fert.speed : 1)) / 60;
      if (p.progress < 1) {
        const before = p.progress;
        p.progress = Math.min(1, p.progress + (minutes * rate) / c.hours);
        if (Math.floor(before * 3) !== Math.floor(p.progress * 3)) changed = true;
        if (p.progress >= 1) {
          changed = true;
          p.ready = true;
        }
      } else if (c.regrow && !p.ready) {
        p.regrow = (p.regrow || 0) + (minutes * rate) / c.regrow;
        if (p.regrow >= 1) {
          p.regrow = 0;
          p.ready = true;
          changed = true;
        }
      }
    }
    let animalsChanged = false;
    for (const a of s.farm.animals || []) {
      if (a.ready) continue;
      if (!a.fed) {
        // hungry animals eat from the feeder by themselves (bees need nothing)
        if (!ANIMALS[a.type].feed) a.fed = true;
        else if (this.isBuilt('feeder') && (s.farm.feed || 0) > 0) {
          s.farm.feed--;
          a.fed = true;
          a.progress = 0;
          animalsChanged = true;
        } else continue;
      }
      a.progress = (a.progress || 0) + minutes / 60 / ANIMALS[a.type].hours;
      if (a.progress >= 1) {
        a.ready = true;
        animalsChanged = true;
      }
    }
    if (changed && this.group) this.rebuildCrops();
    if (animalsChanged && this.group) {
      this.rebuildAnimals();
      this.rebuildPens();
    }
  },
  plotPos(i) {
    const H = this.center;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return new THREE.Vector3(H.x + (col - (COLS - 1) / 2) * GAP, 0, H.z + 2 + row * GAP);
  },
  /** Plots in the 3×3 block around plot i (for watering, planting and harvesting in one go). */
  neighbours(i) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const c = col + dc;
        const r = row + dr;
        const j = r * COLS + c;
        if (c < 0 || c >= COLS || r < 0 || j >= this.s.farm.plots.length) continue;
        out.push(j);
      }
    }
    return out.sort((a, b) => (a === i ? -1 : b === i ? 1 : 0));
  },

  // ── farm field ─────────────────────────────────
  rebuildCrops() {
    if (!this.cropGroup) return;
    this.cropGroup.clear();
    this.world.interactables = this.world.interactables.filter((i) => !i.plot && i.plot !== 0 && !i.lockedPlot);
    this.ensurePlots();
    const s = this.s;
    const b = new Batcher();
    const irr = this.irrigation();
    s.farm.plots.forEach((p, i) => {
      const pos = this.plotPos(i);
      pos.y = this.world.heightAt(pos.x, pos.z);
      const wet = this.isWatered(p) && p.crop;
      b.add(G.box, wet ? '#5a3c28' : '#8a6040', mat4(pos.x, pos.y + 0.08, pos.z, 0, 0, 0, 2.0, 0.18, 2.0));
      if (p.fert) {
        // fertilised soil: a sprinkle of pale granules
        for (let k = 0; k < 6; k++) b.add(G.box, p.fert === 2 ? '#f7d24a' : '#e8e2d0', mat4(pos.x - 0.7 + (k % 3) * 0.7, pos.y + 0.18, pos.z - 0.5 + Math.floor(k / 3) * 1.0, 0, k, 0, 0.12, 0.03, 0.12), { kind: 'plain' });
      }
      if (irr >= 2) b.add(G.box, '#3f6fa8', mat4(pos.x, pos.y + 0.19, pos.z + 0.85, 0, 0, 0, 2.0, 0.05, 0.06), { kind: 'plain' });
      if (p.crop) cropModel(b, p, pos);
      this.world.interact({
        pos,
        r: 1.3,
        priority: 1,
        home: true,
        plot: i,
        icon: p.ready ? '🧺' : p.crop ? '🚿' : '🌱',
        tipH: 0.4,
        tip: () => {
          const pl = this.s.farm.plots[i];
          if (!pl?.crop) return { title: 'Empty soil patch', desc: 'Press E to plant seeds — nearby empty patches get planted too.\nBuy seeds from Chloe at the fruit stand.' };
          const c = CROPS[pl.crop];
          const fert = pl.fert ? `\n${pl.fert === 2 ? '💫 Super fertilised' : '🧴 Fertilised'}: faster growth and a bigger harvest.` : '';
          return { title: c.name, desc: pl.ready ? 'Ripe! Press E to harvest (nearby ripe crops too).' : `${this.plotLabel(i)}\n${c.hours}h to grow${c.regrow ? `, then fruits every ${c.regrow}h` : ''}. Watered crops grow faster.${fert}` };
        },
        label: () => this.plotLabel(i),
        action: () => this.usePlot(i),
      });
    });
    // a peek at the next patches you'll unlock
    for (let i = s.farm.plots.length; i < Math.min(MAX_PLOTS, s.farm.plots.length + 4); i++) {
      const pos = this.plotPos(i);
      pos.y = this.world.heightAt(pos.x, pos.z);
      b.add(G.box, '#9cbf7a', mat4(pos.x, pos.y + 0.04, pos.z, 0, 0, 0, 2.0, 0.08, 2.0), { kind: 'plain' });
      for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) b.add(G.box, '#c8a77a', mat4(pos.x + dx, pos.y + 0.2, pos.z + dz, 0, 0, 0, 0.1, 0.4, 0.1));
      const lvl = this.plotLevel(i);
      this.world.interact({
        pos,
        r: 1.2,
        priority: 0,
        home: true,
        lockedPlot: true,
        icon: '🔒',
        tipH: 0.4,
        tip: { title: 'Locked soil patch', desc: `Unlocks at level ${lvl}. Earn XP by fishing, farming, cooking and quests.\nYou'll have up to ${MAX_PLOTS} patches in the end!` },
        label: () => `Locked — unlocks at level ${lvl}`,
        action: () => this.game.ui.toast(`This soil patch unlocks at level ${lvl}.`, 'info'),
      });
    }
    // sprinkler posts once the farm has irrigation
    if (irr >= 1) {
      this.sprinklers = [];
      for (const r of [0, 2, 4]) {
        for (const c of [1, 4, 7]) {
          const a = this.plotPos(r * COLS + c);
          const x = a.x + GAP / 2;
          const z = a.z + (r === 4 ? -GAP / 2 : GAP / 2);
          const y = this.world.heightAt(x, z);
          b.add(G.cyl6, '#7a8a9a', mat4(x, y + 0.45, z, 0, 0, 0, 0.06, 0.9, 0.06));
          b.add(G.cyl8, '#3f8fd0', mat4(x, y + 0.95, z, 0, 0, 0, 0.14, 0.12, 0.14));
          this.sprinklers.push(new THREE.Vector3(x, y + 1.0, z));
        }
      }
    } else this.sprinklers = [];
    this.cropGroup.add(b.build(this.world.glowMat));
  },

  plotLabel(i) {
    const p = this.s.farm.plots[i];
    const g = this.game;
    if (!p.crop) return 'Plant seeds';
    const c = CROPS[p.crop];
    if (p.ready) {
      const n = this.neighbours(i).filter((j) => this.s.farm.plots[j].ready).length;
      return n > 1 ? `Harvest ${n} crops` : `Harvest ${c.name}`;
    }
    const pct = Math.floor((p.progress < 1 ? p.progress : p.regrow || 0) * 100);
    const watered = this.isWatered(p);
    if (!watered && g.hasItem('watering_can')) return `Water ${c.name} (${pct}%)`;
    if (!p.fert && this.fertilizers().length) return `Fertilize ${c.name} (${pct}%)`;
    return `${c.name} growing… ${pct}%${watered ? ' 💧' : ''}${p.fert ? ' ✨' : ''}`;
  },
  fertilizers() {
    return Object.keys(FERT).filter((id) => (this.s.inventory[id] || 0) > 0);
  },

  // ── single-patch farm actions (used by E and by the drag-to-farm tools) ──
  plantAt(i, seedId) {
    const g = this.game;
    const s = this.s;
    const p = s.farm.plots[i];
    if (!p || p.crop || (s.inventory[seedId] || 0) <= 0) return false;
    const crop = ITEMS[seedId].crop;
    g.removeItem(seedId, 1, true);
    Object.assign(p, { crop, progress: 0, ready: false, regrow: 0, watered: g.weather.raining() ? s.time.day : null, fert: 0 });
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.3), { count: 8, color: '#8a6040', speed: 1.5, up: 2 });
    g.events.emit('plant', { crop });
    g.addXP(3);
    return true;
  },
  waterAt(i) {
    const g = this.game;
    const p = this.s.farm.plots[i];
    if (!p?.crop || p.ready || this.isWatered(p) || !g.hasItem('watering_can')) return false;
    p.watered = this.s.time.day;
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.6), { count: 10, color: '#7fd3f0', speed: 1.2, up: 1.5 });
    g.events.emit('water', { count: 1 });
    return true;
  },
  fertilizeAt(i, id) {
    const g = this.game;
    const p = this.s.farm.plots[i];
    if (!p?.crop || p.ready || p.fert || (this.s.inventory[id] || 0) <= 0) return false;
    g.removeItem(id, 1, true);
    p.fert = FERT[id].level;
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.5), { count: 14, color: p.fert === 2 ? '#f7d24a' : '#fbf3e2', speed: 1.5, up: 2.5 });
    g.events.emit('fertilize', { id });
    return true;
  },
  /** Harvest one ripe patch. Returns { item, n } or null. */
  harvestAt(i, delay = 0) {
    const g = this.game;
    const s = this.s;
    const q = s.farm.plots[i];
    if (!q?.ready) return null;
    const c = CROPS[q.crop];
    const bonus = FERT_BY_LEVEL[q.fert]?.bonus ?? 0;
    const n = randInt(c.yield[0], c.yield[1]) + bonus;
    const spot = this.plotPos(i).setY(this.center.y + (c.kind === 'tree' ? 3 : 0.5));
    for (let k = 0; k < Math.min(n, 3); k++) {
      g.fx.collect(itemMesh(c.item), spot.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6)), { delay: delay + k * 0.1, dur: 0.5, pickup: delay === 0 && k === 0 });
    }
    g.addItem(c.item, n, true);
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.8), { count: 10, color: c.color, speed: 2, up: 3 });
    s.stats.harvested += n;
    g.events.emit('harvest', { crop: q.crop, count: 1 });
    g.addXP(c.kind === 'tree' ? 10 : 5 + Math.round(c.hours / 2));
    q.fert = 0;
    if (c.regrow) {
      q.ready = false;
      q.regrow = 0;
    } else Object.assign(q, { crop: null, progress: 0, ready: false });
    return { item: c.item, n };
  },
  /** Rebuild the field soon (many quick actions while dragging → one rebuild). */
  queueRebuild() {
    if (this._rebuildT) return;
    this._rebuildT = setTimeout(() => {
      this._rebuildT = null;
      this.rebuildCrops();
    }, 120);
  },

  usePlot(i) {
    const g = this.game;
    const s = this.s;
    const p = s.farm.plots[i];
    if (!p.crop) {
      // pick a seed, plant this patch, then keep painting with the seed (drag over more patches)
      g.farmTools.chooseSeed((id) => {
        if (this.plantAt(i, id)) {
          g.player.char.play('plant', 0.6);
          g.audio.sfx('plant');
          this.rebuildCrops();
        }
      });
      return;
    }
    if (p.ready) {
      let total = 0;
      const got = {};
      for (const j of this.neighbours(i)) {
        const r = this.harvestAt(j, total * 0.04);
        if (!r) continue;
        got[r.item] = (got[r.item] || 0) + r.n;
        total += r.n;
      }
      g.ui.toast(`Harvested ${Object.entries(got).map(([id, n]) => `${n}× ${ITEMS[id].icon} ${ITEMS[id].name}`).join(', ')}`, 'good');
      g.audio.sfx('harvest');
      this.rebuildCrops();
      return;
    }
    // growing: water first (soaks the patches around too), then fertilise
    if (!this.isWatered(p) && g.hasItem('watering_can')) {
      let n = 0;
      for (const j of this.neighbours(i)) if (this.waterAt(j)) n++;
      g.audio.sfx('water');
      g.player.char.play('plant', 0.5);
      if (n > 1) g.ui.toast(`💧 Watered ${n} crops`, 'info');
      this.rebuildCrops();
      return;
    }
    const ferts = this.fertilizers();
    if (!p.fert && ferts.length) {
      g.ui.openPicker({
        title: `Fertilize ${CROPS[p.crop].name}?`,
        items: ferts,
        onPick: (id) => {
          if (!this.fertilizeAt(i, id)) return;
          g.audio.sfx('plant');
          g.player.char.play('plant', 0.5);
          g.ui.toast(`${ITEMS[id].icon} ${CROPS[p.crop].name} fertilised: faster growth, bigger harvest!`, 'good');
          this.rebuildCrops();
        },
      });
      return;
    }
    if (!g.hasItem('watering_can') && !this.isWatered(p)) g.ui.toast('Growing… A watering can (or sprinklers) makes crops grow 50% faster.', 'info');
    else g.ui.toast(`${CROPS[p.crop].name}: ${this.plotLabel(i)}`, 'info');
  },

  /** Which soil patch (index) is at this world point, if any. */
  plotAtPoint(x, z) {
    const H = this.center;
    if (!H) return -1;
    const col = Math.round((x - H.x) / GAP + (COLS - 1) / 2);
    const row = Math.round((z - H.z - 2) / GAP);
    if (col < 0 || col >= COLS || row < 0) return -1;
    const i = row * COLS + col;
    if (i >= this.s.farm.plots.length) return -1;
    const pp = this.plotPos(i);
    return Math.abs(pp.x - x) < 1.15 && Math.abs(pp.z - z) < 1.15 ? i : -1;
  },

  setIrrigation(level) {
    this.s.farm.irrigation = Math.max(this.irrigation(), level);
    if (this.group) this.rebuildCrops();
  },
};
