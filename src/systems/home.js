import * as THREE from 'three';
import { inked, toon, G, mat4 } from '../world/toon.js';
import { CROPS, ITEMS, ANIMALS, IRRIGATION, MAX_PLOTS, plotsForLevel, FARM_BUILDINGS, FEEDER_CAPACITY } from '../data/items.js';
import { QUESTS } from '../data/quests.js';
import { HOUSES, DECOR } from '../data/gear.js';
import { COSMETICS } from '../data/cosmetics.js';
import { Batcher } from '../world/toon.js';
import * as P from '../world/props.js';
import { rand, randInt, pick } from '../core/utils.js';
import { itemMesh } from '../world/fx.js';
import { animalModel, animateAnimal } from '../world/animals.js';

const COLS = 10;
const GAP = 2.4;
// animal pens along the south edge of the homestead, keyed by building (x offset from centre, width)
const PENS = { coop: { dx: -10.4, w: 3.8, kind: 'coop' }, barn: { dx: -5.65, w: 5, kind: 'barn' }, goatpen: { dx: -0.8, w: 4, kind: 'goat' }, fold: { dx: 3.65, w: 4.2, kind: 'fold' }, sty: { dx: 8, w: 3.8, kind: 'sty' }, hives: { dx: 12.05, w: 3.6, kind: 'hives' } };
const FEEDER_AT = { dx: -13.2, dz: 12 };
const PEN_Z = 17.5;
const PEN_D = 4.5;
const FERT = { fertilizer: { level: 1, speed: 1.4, bonus: 1 }, super_fertilizer: { level: 2, speed: 1.8, bonus: 2 } };
const FERT_BY_LEVEL = { 1: FERT.fertilizer, 2: FERT.super_fertilizer };

/**
 * Homestead (Palmora only): house, kitchen, farm field, animal pens, decorations.
 * Also handles wild fruit trees and treasure digging on every island.
 */
export class HomeSystem {
  constructor(game) {
    this.game = game;
    this.group = null;
    this.t = 0;
    game.events.on('minutes', (m) => this.grow(m));
    game.events.on('newDay', () => this.onNewDay());
    game.events.on('level', ({ level }) => {
      if (plotsForLevel(level) > plotsForLevel(level - 1)) {
        if (this.group) this.rebuildCrops();
        game.ui.toast(`🌱 New soil patches unlocked at your homestead! (${this.plotCount()}/${MAX_PLOTS})`, 'good');
      }
    });
  }
  get s() {
    return this.game.state;
  }

  /** Soil patches unlock with your level (never fewer than you already farm). */
  plotCount() {
    return Math.min(MAX_PLOTS, Math.max(plotsForLevel(this.s.level), this.s.farm.plots.length));
  }
  ensurePlots() {
    const n = this.plotCount();
    while (this.s.farm.plots.length < n) this.s.farm.plots.push({ crop: null });
  }
  /** Level at which plot #i unlocks. */
  plotLevel(i) {
    let l = 1;
    while (plotsForLevel(l) <= i && l < 99) l++;
    return l;
  }
  irrigation() {
    return this.s.farm.irrigation || 0;
  }
  isWatered(p) {
    return this.irrigation() >= 1 || this.game.weather.raining() || p.watered === this.s.time.day;
  }

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
  }
  onNewDay() {
    if (this.group) this.rebuildCrops();
  }

  // ── world attachment ───────────────────────────
  attach(world) {
    this.detach();
    if (world.id !== 'palmora' || !world.homestead || !this.s) return;
    this.world = world;
    this.group = new THREE.Group();
    world.dynamic.add(this.group);
    const H = world.homestead;
    this.center = new THREE.Vector3(H.x, world.heightAt(H.x, H.z), H.z);
    this.ensurePlots();
    this.buildHouse();
    this.penGroup = new THREE.Group();
    this.group.add(this.penGroup);
    this.rebuildPens();
    this.cropGroup = new THREE.Group();
    this.group.add(this.cropGroup);
    this.rebuildCrops();
    this.animalGroup = new THREE.Group();
    this.group.add(this.animalGroup);
    this.rebuildAnimals();
    this.decorGroup = new THREE.Group();
    this.group.add(this.decorGroup);
    this.rebuildDecor();
    world.spots.homeDoor = this.door;
  }
  detach() {
    if (this.group) this.group.parent?.remove(this.group);
    if (this.world) this.world.interactables = this.world.interactables.filter((i) => !i.home);
    if (this.world) this.world.colliders = this.world.colliders.filter((c) => !c.home && !c.decor);
    this.group = null;
    this.world = null;
    this.animals = [];
  }

  plotPos(i) {
    const H = this.center;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return new THREE.Vector3(H.x + (col - (COLS - 1) / 2) * GAP, 0, H.z + 2 + row * GAP);
  }
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
  }

  buildHouse() {
    const w = this.world;
    const lvl = this.s.house.level;
    if (this.houseMesh) this.houseMesh.parent?.remove(this.houseMesh);
    if (this.kitchenSign) this.kitchenSign.parent?.remove(this.kitchenSign);
    w.colliders = w.colliders.filter((c) => !c.home);
    w.interactables = w.interactables.filter((i) => !i.homeHouse);
    const H = this.center;
    const hx = H.x;
    const hz = H.z - 6;
    const y = w.heightAt(hx, hz);
    const b = new Batcher();
    let door;
    let collider;
    let halfW = 1.8;
    if (lvl === 0) {
      const t = P.tent(b, hx, y, hz, 0, '#e8dcc0', '#58b4a5');
      collider = { ...t.collider, r: 1.8 };
      door = new THREE.Vector3(hx, y, hz + 2.6);
    } else {
      const opts = [
        null,
        { w: 4.6, d: 4, h: 2.6, wall: '#efe0bf', roof: '#c8a050', roofStyle: 'thatch' },
        { w: 6, d: 5, h: 3, wall: '#f6ecd6', roof: '#58b4a5', chimney: true, awning: '#f0846a' },
        { w: 7.5, d: 6, h: 3.6, wall: '#fbf3e2', roof: '#d9734f', chimney: true, awning: '#58b4a5' },
        { w: 9, d: 7, h: 4.2, wall: '#fffaf0', roof: '#3f6fa8', chimney: true, awning: '#f7c95c' },
      ][lvl];
      const hh = P.house(b, hx, y, hz, opts);
      collider = hh.collider;
      door = hh.door;
      halfW = opts.w / 2;
      if (lvl >= 3) {
        // side wing
        const wing = P.house(b, hx + opts.w / 2 + 2.2, y, hz - 0.8, { w: 3.6, d: 4, h: opts.h * 0.8, wall: opts.wall, roof: opts.roof });
        w.colliders.push({ ...wing.collider, home: true });
      }
    }
    // the kitchen sits right beside the house, opening onto the farm
    const kx = hx - halfW - 3.6;
    const kz = hz - 0.2;
    const k = P.kitchen(b, kx, w.heightAt(kx, kz), kz, 0, w.glowPoints);
    for (const c of k.colliders) w.colliders.push({ ...c, home: true });
    this.kitchenPos = k.front;
    this.firePos = k.front.clone().setZ(k.front.z - 2.6);
    this.chimney = k.chimney;
    this.kitchenSign = P.signBoard('KITCHEN', k.signPos, 0, { bg: '#fbe2c8', w: 2.2 });
    this.group.add(this.kitchenSign);
    this.houseMesh = b.build(w.glowMat);
    this.group.add(this.houseMesh);
    w.colliders.push({ ...collider, home: true });
    this.door = door;
    w.interact({
      pos: door,
      r: 2.4,
      priority: 2,
      home: true,
      homeHouse: true,
      icon: '🏠',
      tipH: 2.5,
      tip: () => ({ title: `Your ${HOUSES[this.s.house.level].name}`, desc: 'Your home! Press E to sleep, change clothes, save or upgrade your house.' }),
      label: () => `${HOUSES[this.s.house.level].name} — home menu`,
      action: () => this.game.ui.openPanel('home'),
    });
    w.interact({
      pos: this.kitchenPos,
      r: 3.0,
      priority: 3,
      home: true,
      homeHouse: true,
      icon: '🍳',
      tipH: 2,
      tip: { title: 'Your Kitchen', desc: 'Cook your crops, fruit, fish and animal goods into food (press E).\nFood sells for much more than raw ingredients — new recipes unlock as you level up.' },
      label: () => 'Cook in your kitchen',
      action: () => this.game.ui.openPanel('kitchen'),
    });
  }

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
  }

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
  }
  fertilizers() {
    return Object.keys(FERT).filter((id) => (this.s.inventory[id] || 0) > 0);
  }

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
  }
  waterAt(i) {
    const g = this.game;
    const p = this.s.farm.plots[i];
    if (!p?.crop || p.ready || this.isWatered(p) || !g.hasItem('watering_can')) return false;
    p.watered = this.s.time.day;
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.6), { count: 10, color: '#7fd3f0', speed: 1.2, up: 1.5 });
    g.events.emit('water', { count: 1 });
    return true;
  }
  fertilizeAt(i, id) {
    const g = this.game;
    const p = this.s.farm.plots[i];
    if (!p?.crop || p.ready || p.fert || (this.s.inventory[id] || 0) <= 0) return false;
    g.removeItem(id, 1, true);
    p.fert = FERT[id].level;
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.5), { count: 14, color: p.fert === 2 ? '#f7d24a' : '#fbf3e2', speed: 1.5, up: 2.5 });
    g.events.emit('fertilize', { id });
    return true;
  }
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
  }
  /** Rebuild the field soon (many quick actions while dragging → one rebuild). */
  queueRebuild() {
    if (this._rebuildT) return;
    this._rebuildT = setTimeout(() => {
      this._rebuildT = null;
      this.rebuildCrops();
    }, 120);
  }

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
  }

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
  }

  // ── farm buildings & animals ───────────────────
  buildingState(id) {
    return this.s.farm.buildings?.[id] || FARM_BUILDINGS[id].start;
  }
  isBuilt(id) {
    return this.buildingState(id) === 'built';
  }
  /** Can Bob construct this building right now? (ruined ones are repaired through his requests) */
  canConstruct(id) {
    const b = FARM_BUILDINGS[id];
    const s = this.s;
    if (this.isBuilt(id)) return { ok: false, why: 'Already built' };
    if (b.quest) return { ok: false, why: `Repaired through Bob's request "${QUESTS[b.quest].title}"` };
    if (s.level < b.level) return { ok: false, why: `Requires level ${b.level}` };
    const c = b.cost;
    if ((c.coins || 0) > s.coins) return { ok: false, why: 'Not enough coins' };
    if ((c.gems || 0) > s.gems) return { ok: false, why: 'Not enough gems' };
    for (const k of ['driftwood', 'stone']) if ((c[k] || 0) > (s.inventory[k] || 0)) return { ok: false, why: `Need ${c[k]} ${ITEMS[k].name}` };
    return { ok: true };
  }
  construct(id) {
    const g = this.game;
    const chk = this.canConstruct(id);
    if (!chk.ok) {
      g.ui.toast(chk.why, 'warn');
      return false;
    }
    const c = FARM_BUILDINGS[id].cost;
    g.spend(c.coins || 0, c.gems || 0);
    if (c.driftwood) g.removeItem('driftwood', c.driftwood, true);
    if (c.stone) g.removeItem('stone', c.stone, true);
    this.setBuilt(id);
    g.addXP(40 + FARM_BUILDINGS[id].level * 10);
    return true;
  }
  /** Finish a building (Bob's work or a quest reward). */
  setBuilt(id) {
    const g = this.game;
    const b = FARM_BUILDINGS[id];
    this.s.farm.buildings = this.s.farm.buildings || {};
    const was = this.buildingState(id);
    this.s.farm.buildings[id] = 'built';
    if (this.group) {
      this.rebuildPens();
      this.rebuildAnimals();
      const at = id === 'feeder' ? this.feederPos() : this.penCenter(id);
      g.particles.burst(at.clone().setY(at.y + 1.2), { count: 50, color: '#fbf3e2', speed: 5, up: 5, life: 1.1 });
    }
    g.audio.sfx('build');
    g.ui.banner(was === 'ruined' ? 'Rebuilt!' : 'Built!', `${b.icon} ${b.name}${b.animal ? ` — buy ${ANIMALS[b.animal].name.toLowerCase()}s from Chloe` : ''}`, '🔨');
    g.events.emit('construct', { id });
    g.quests.refresh();
    g.save();
  }

  penCenter(id) {
    const H = this.center;
    const x = H.x + PENS[id].dx;
    const z = H.z + PEN_Z;
    return new THREE.Vector3(x, this.world.heightAt(x, z), z);
  }
  feederPos() {
    const x = this.center.x + FEEDER_AT.dx;
    const z = this.center.z + FEEDER_AT.dz;
    return new THREE.Vector3(x, this.world.heightAt(x, z), z);
  }
  rebuildPens() {
    if (!this.penGroup) return;
    const g = this.game;
    const w = this.world;
    this.penGroup.clear();
    w.colliders = w.colliders.filter((c) => !c.pen);
    w.interactables = w.interactables.filter((i) => !i.site);
    const b = new Batcher();
    const hAt = (x, z) => w.heightAt(x, z);
    for (const [id, pen] of Object.entries(PENS)) {
      const c = this.penCenter(id);
      const st = this.buildingState(id);
      const B = FARM_BUILDINGS[id];
      if (st === 'built') P.pen(b, c.x, c.y, c.z, pen.w, PEN_D, pen.kind, hAt);
      else if (st === 'ruined') P.penRuined(b, c.x, c.y, c.z, pen.w, PEN_D, hAt, seeded(c.x * 3.1));
      else P.penSite(b, c.x, c.y, c.z, pen.w, PEN_D, hAt);
      if (st !== 'built') {
        const why = st === 'ruined' ? `Broken down. Bob can rebuild it${B.level > this.s.level ? ` once you reach level ${B.level}` : ' — talk to him about it'}.` : `An empty building site. Bob can build it for you (level ${B.level}).`;
        w.interact({
          pos: c.clone().setZ(c.z - PEN_D / 2 + 0.4),
          r: 2.2,
          priority: 0,
          home: true,
          site: id,
          icon: B.icon,
          tipH: 1,
          tip: { title: `${B.name}${st === 'ruined' ? ' (broken)' : ' (not built)'}`, desc: `${why}\nBob's workshop is east of the village square.` },
          label: () => `${B.name} — ${st === 'ruined' ? 'broken' : 'not built'} (Bob can help)`,
          action: () => g.ui.toast(st === 'ruined' ? `The ${B.name.toLowerCase()} is broken. Talk to Bob the builder about rebuilding it.` : `Ask Bob the builder to build a ${B.name} (level ${B.level}).`, 'info'),
        });
      }
    }
    // the feeder
    const f = this.feederPos();
    if (this.isBuilt('feeder')) {
      P.feeder(b, f.x, f.y, f.z, Math.min(1, (this.s.farm.feed || 0) / FEEDER_CAPACITY));
      w.colliders.push({ type: 'box', x: f.x, z: f.z, hw: 0.9, hd: 0.5, rot: 0, pen: true, home: true });
    } else P.penSite(b, f.x, f.y, f.z, 2.2, 1.8, hAt);
    w.interact({
      pos: f.clone().setZ(f.z + 1.4),
      r: 2.0,
      priority: 1,
      home: true,
      site: 'feeder',
      icon: '🪣',
      tipH: 1.2,
      tip: () => (this.isBuilt('feeder') ? { title: 'Feeder', desc: `Holds ${this.s.farm.feed || 0}/${FEEDER_CAPACITY} Animal Feed. Your animals eat from it on their own.\nPress E to add feed or make feed from crops.` } : { title: 'Feeder (not built)', desc: 'Your animals need a feeder to eat from. Ask Bob the builder to build one (level 3).' }),
      label: () => (this.isBuilt('feeder') ? `Feeder — ${this.s.farm.feed || 0}/${FEEDER_CAPACITY} feed` : 'Feeder site — Bob can build it'),
      action: () => (this.isBuilt('feeder') ? g.ui.openPanel('feeder') : g.ui.toast('Ask Bob the builder to build a Feeder (level 3).', 'info')),
    });
    this.penGroup.add(b.build(w.glowMat));
  }
  /** Move feed from the bag into the feeder. */
  fillFeeder(n) {
    const s = this.s;
    const room = FEEDER_CAPACITY - (s.farm.feed || 0);
    const k = Math.min(n, room, s.inventory.animal_feed || 0);
    if (k <= 0) return 0;
    this.game.removeItem('animal_feed', k, true);
    s.farm.feed = (s.farm.feed || 0) + k;
    this.game.audio.sfx('eat');
    this.grow(0);
    if (this.group) {
      this.rebuildPens();
      this.rebuildAnimals();
    }
    return k;
  }
  /** Turn crops into feed, straight into the feeder. */
  makeFeed(r, times = 1) {
    const g = this.game;
    const s = this.s;
    let made = 0;
    for (let i = 0; i < times; i++) {
      if ((s.farm.feed || 0) + r.feed > FEEDER_CAPACITY) break;
      if (!Object.entries(r.inputs).every(([k, n]) => (s.inventory[k] || 0) >= n)) break;
      for (const [k, n] of Object.entries(r.inputs)) g.removeItem(k, n, true);
      s.farm.feed = (s.farm.feed || 0) + r.feed;
      made += r.feed;
    }
    if (made) {
      g.events.emit('makefeed', { count: made });
      g.audio.sfx('harvest');
      if (this.group) {
        const at = this.feederPos();
        g.particles.burst(at.setY(at.y + 1.6), { count: 14, color: '#e3c25a', speed: 1.5, up: 2 });
      }
      this.grow(0);
      if (this.group) {
        this.rebuildPens();
        this.rebuildAnimals();
      }
    }
    return made;
  }

  rebuildAnimals() {
    if (!this.animalGroup) return;
    const w = this.world;
    this.animalGroup.clear();
    w.interactables = w.interactables.filter((i) => i.animal === undefined && !i.pen);
    this.animals = [];
    const list = this.s.farm.animals;
    for (const [type, a] of Object.entries(ANIMALS)) {
      const bid = a.building;
      if (!this.isBuilt(bid)) continue;
      const pen = PENS[bid];
      const c = this.penCenter(bid);
      const mine = list.map((x, idx) => ({ x, idx })).filter((o) => o.x.type === type);
      if (!mine.length) {
        const locked = this.s.level < a.level;
        w.interact({
          pos: c.clone().setZ(c.z - PEN_D / 2 + 0.4),
          r: 2.2,
          priority: 0,
          home: true,
          pen: type,
          icon: a.icon,
          tipH: 1,
          tip: { title: `${FARM_BUILDINGS[bid].name} (empty)`, desc: `${a.desc}\n${locked ? `Unlocks at level ${a.level}. ` : ''}Buy one from Chloe at the fruit stand for 🪙 ${a.price}.` },
          label: () => `${FARM_BUILDINGS[bid].name} — buy ${a.name.toLowerCase()}s at Chloe's (🪙 ${a.price})`,
          action: () => this.game.ui.toast(`Buy ${a.name.toLowerCase()}s from Chloe's fruit stand${locked ? ` once you reach level ${a.level}` : ''}.`, 'info'),
        });
        continue;
      }
      mine.forEach(({ x: an, idx }, k) => {
        const m = animalModel(type);
        const spread = (k - (mine.length - 1) / 2) * Math.min(1.1, (pen.w - 1) / Math.max(1, mine.length - 1));
        const home = type === 'bee' ? c.clone().set(c.x - pen.w / 2 + 0.9 + k * ((pen.w - 1.8) / 2), c.y, c.z + PEN_D / 2 - 0.95 - 0.3) : c.clone().add(new THREE.Vector3(spread, 0, -0.3));
        m.position.copy(home);
        m.userData.home = type === 'bee' ? null : home;
        m.userData.range = pen.w - 1.4;
        this.animalGroup.add(m);
        // a bubble with the product (ready) or a little feed bucket (hungry)
        if (an.ready || (!an.fed && a.feed)) {
          const tag = an.ready ? itemMesh(a.product) : itemMesh('animal_feed');
          tag.scale.multiplyScalar(an.ready ? 0.8 : 0.55);
          tag.position.set(0, type === 'cow' ? 2.0 : type === 'bee' ? 2.2 : 1.3, 0);
          tag.userData.bubble = true;
          m.add(tag);
        }
        this.animals.push(m);
        w.interact({
          pos: m.position,
          r: type === 'cow' ? 2.0 : 1.6,
          priority: 1,
          home: true,
          animal: idx,
          icon: an.ready ? ITEMS[a.product].icon : a.icon,
          tipH: type === 'cow' ? 1.6 : 1,
          tip: () => ({ title: a.name, desc: `${a.desc}\n${this.animalStatus(idx)}` }),
          label: () => this.animalLabel(idx),
          action: () => this.useAnimal(idx),
        });
      });
    }
  }
  animalStatus(idx) {
    const an = this.s.farm.animals[idx];
    const a = ANIMALS[an.type];
    if (an.ready) return `Ready! Press E to collect ${ITEMS[a.product].name.toLowerCase()}.`;
    if (!an.fed) return this.isBuilt('feeder') ? 'Hungry — the feeder is empty. Add Animal Feed to the Feeder.' : 'Hungry — ask Bob to build a Feeder, then fill it with Animal Feed.';
    return `Making ${ITEMS[a.product].name.toLowerCase()}… ${Math.floor((an.progress || 0) * 100)}%`;
  }
  animalLabel(idx) {
    const an = this.s.farm.animals[idx];
    const a = ANIMALS[an.type];
    if (an.ready) return `Collect ${ITEMS[a.product].icon} ${ITEMS[a.product].name}`;
    if (!an.fed) return `${a.name} is hungry — ${this.isBuilt('feeder') ? 'fill the Feeder' : 'needs a Feeder'}`;
    return `${a.name} — ${Math.floor((an.progress || 0) * 100)}%`;
  }
  useAnimal(idx) {
    const g = this.game;
    const s = this.s;
    const an = s.farm.animals[idx];
    const a = ANIMALS[an.type];
    const m = this.animals.find((x) => this.world.interactables.some((it) => it.animal === idx && it.pos === x.position));
    const at = (m?.position ?? this.penCenter(a.building)).clone().setY((m?.position.y ?? 0) + 0.8);
    if (!an.ready) {
      g.ui.toast(`${a.icon} ${this.animalStatus(idx)}`, an.fed ? 'info' : 'warn');
      return;
    }
    const n = randInt(a.yield[0], a.yield[1]);
    for (let k = 0; k < n; k++) g.fx.collect(itemMesh(a.product), at.clone(), { delay: k * 0.12, dur: 0.5, pickup: k === 0 });
    g.addItem(a.product, n, true);
    g.ui.itemToast(a.product, n);
    // seasoned farmers also get a little fertilizer from the pens
    if (a.feed && s.level >= 8) {
      const sup = s.level >= 14 && Math.random() < 0.08;
      if (sup || Math.random() < 0.25) {
        const id = sup ? 'super_fertilizer' : 'fertilizer';
        g.addItem(id, 1, true);
        setTimeout(() => g.ui.itemToast(id, 1), 400);
      }
    }
    g.audio.sfx('harvest');
    g.events.emit('harvest', { crop: an.type, count: 1 });
    g.events.emit('collect', { item: a.product });
    g.addXP(6 + Math.round(a.hours));
    an.ready = false;
    an.progress = 0;
    an.fed = false;
    this.grow(0); // eat from the feeder straight away if there's food
    this.rebuildAnimals();
    this.rebuildPens();
  }
  /** A new animal joins the farm (bought from Chloe or a reward). */
  addAnimal(type) {
    this.s.farm.animals.push({ type, fed: false, progress: 0, ready: false });
    this.grow(0);
    if (this.group) this.rebuildAnimals();
  }
  animalCount(type) {
    return (this.s.farm.animals || []).filter((a) => a.type === type).length;
  }
  setIrrigation(level) {
    this.s.farm.irrigation = Math.max(this.irrigation(), level);
    if (this.group) this.rebuildCrops();
  }

  /** Per-frame: animals wander and peck, sprinklers spray, the kitchen chimney smokes. */
  update(dt) {
    if (!this.group || !this.world) return;
    const g = this.game;
    this.t += dt;
    const near = g.player && g.player.pos.distanceTo(this.center) < 45;
    if (!near) return;
    for (const m of this.animals || []) {
      animateAnimal(m, this.t, dt);
      m.position.y = this.world.heightAt(m.position.x, m.position.z);
      for (const c of m.children) if (c.userData.bubble) c.position.y += Math.sin(this.t * 3) * 0.002;
    }
    this.sprayT = (this.sprayT || 0) - dt;
    if (this.sprayT <= 0 && this.sprinklers?.length) {
      this.sprayT = 0.25;
      g.particles.burst(pick(this.sprinklers), { count: 5, color: '#a8e4f8', speed: 2.2, up: 2.2, life: 0.7 });
    }
    this.smokeT = (this.smokeT || 0) - dt;
    if (this.smokeT <= 0 && this.chimney) {
      this.smokeT = 0.6;
      g.particles.burst(this.chimney, { count: 2, color: '#e8e4dc', speed: 0.3, up: 1.2, life: 2, gravity: -0.6 });
    }
  }

  // ── house upgrades ─────────────────────────────
  nextHouse() {
    return HOUSES[this.s.house.level + 1] || null;
  }
  canUpgrade() {
    const h = this.nextHouse();
    if (!h) return { ok: false, why: 'Your home is fully upgraded!' };
    if (this.s.level < h.reqLevel) return { ok: false, why: `Requires level ${h.reqLevel}` };
    const c = h.cost;
    if ((c.coins || 0) > this.s.coins) return { ok: false, why: 'Not enough coins' };
    if ((c.gems || 0) > this.s.gems) return { ok: false, why: 'Not enough gems' };
    for (const k of ['driftwood', 'stone']) if ((c[k] || 0) > (this.s.inventory[k] || 0)) return { ok: false, why: `Need ${c[k]} ${ITEMS[k].name}` };
    return { ok: true };
  }
  upgrade() {
    const g = this.game;
    const chk = this.canUpgrade();
    if (!chk.ok) {
      g.ui.toast(chk.why, 'warn');
      return false;
    }
    const h = this.nextHouse();
    const c = h.cost;
    g.spend(c.coins || 0, c.gems || 0);
    if (c.driftwood) g.removeItem('driftwood', c.driftwood, true);
    if (c.stone) g.removeItem('stone', c.stone, true);
    this.s.house.level = h.level;
    if (this.world) {
      this.buildHouse();
      this.rebuildCrops();
      g.particles.burst(this.center.clone().setY(this.center.y + 2), { count: 60, color: '#fbf3e2', speed: 6, up: 6, life: 1.2 });
    }
    g.audio.sfx('build');
    g.ui.banner('Home Upgraded!', h.name, '🏠');
    g.addXP(60 * h.level);
    g.events.emit('build', { level: h.level });
    g.quests.refresh();
    g.save();
    return true;
  }

  // ── decorations ────────────────────────────────
  rebuildDecor() {
    if (!this.decorGroup) return;
    this.decorGroup.clear();
    this.world.colliders = this.world.colliders.filter((c) => !c.decor);
    this.world.interactables = this.world.interactables.filter((i) => !i.decor);
    this.s.house.decor.forEach((d, idx) => {
      const m = decorModel(d.id);
      m.position.set(d.x, this.world.heightAt(d.x, d.z), d.z);
      m.rotation.y = d.rot || 0;
      this.decorGroup.add(m);
      if (m.userData.glow) {
        const sprite = P.glowSprite(m.position.clone().add(new THREE.Vector3(0, m.userData.glow, 0)), '#ffcf7a', 2.5);
        sprite.userData.decorGlow = true;
        this.decorGroup.add(sprite);
      }
      const r = { lantern: 0.3, hammock: 1.4, bench: 0.8, umbrella: 0.3, campfire: 0.7 }[d.id] ?? 0.4;
      this.world.colliders.push({ type: 'circle', x: d.x, z: d.z, r, decor: true });
      this.world.interact({
        pos: m.position,
        r: 1.6,
        priority: 0,
        home: true,
        decor: idx,
        icon: DECOR[d.id].icon,
        label: () => `Pick up ${DECOR[d.id].name}`,
        action: () => {
          this.s.house.decor.splice(idx, 1);
          this.game.addItem('decor_' + d.id, 1);
          this.rebuildDecor();
        },
      });
    });
  }
  updateDecorGlow(glow) {
    if (!this.decorGroup) return;
    for (const c of this.decorGroup.children) if (c.userData.decorGlow) c.material.opacity = glow * 0.8;
  }
  /** Start placement mode for a decor item from the bag. */
  startPlacing(decorId) {
    const g = this.game;
    if (!this.world) {
      g.ui.toast('Decorations can only be placed at your Palmora homestead.', 'warn');
      return;
    }
    const p = g.player.pos;
    if (p.distanceTo(this.center) > 16) {
      g.ui.toast('Walk to your homestead to place decorations.', 'warn');
      return;
    }
    g.ui.closePanel();
    this.placing = { id: decorId, rot: 0, ghost: decorModel(decorId) };
    this.placing.ghost.traverse((o) => {
      if (o.material && !o.name) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.65;
      }
    });
    this.group.add(this.placing.ghost);
    g.ui.setPlacementHint(true);
  }
  updatePlacing() {
    const pl = this.placing;
    if (!pl) return;
    const g = this.game;
    const f = g.player.forward();
    const pos = g.player.pos.clone().addScaledVector(f, 2.2);
    pos.y = this.world.heightAt(pos.x, pos.z);
    pl.ghost.position.copy(pos);
    pl.ghost.rotation.y = pl.rot + g.player.yaw;
    const okDist = pos.distanceTo(this.center) < 13;
    pl.ok = okDist && pos.y > 0.6;
    pl.ghost.traverse((o) => o.material?.color && !o.name && o.material.emissive?.setRGB(pl.ok ? 0 : 0.6, 0, 0));
    if (g.input.pressed('KeyR')) pl.rot += Math.PI / 4;
    if (g.input.pressed('KeyE') || g.input.mouse.clicked) {
      if (!pl.ok) {
        g.ui.toast('Too far from your home — place it inside the fence.', 'warn');
        return;
      }
      g.removeItem('decor_' + pl.id, 1, true);
      this.s.house.decor.push({ id: pl.id, x: pos.x, z: pos.z, rot: pl.ghost.rotation.y });
      this.cancelPlacing();
      this.rebuildDecor();
      g.audio.sfx('build');
      g.particles.burst(pos.clone().setY(pos.y + 0.5), { count: 16, color: '#fbf3e2', speed: 3, up: 3 });
      g.save();
    } else if (g.input.pressed('Escape')) this.cancelPlacing();
  }
  cancelPlacing() {
    if (!this.placing) return;
    this.placing.ghost.parent?.remove(this.placing.ghost);
    this.placing = null;
    this.game.ui.setPlacementHint(false);
  }

  // ── wild trees & treasure (all islands) ────────
  treeReady(island, idx) {
    const ws = this.game.worldState(island);
    const last = ws.trees?.[idx];
    return last === undefined || this.game.time.abs() - last > 12 * 60;
  }
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
  }
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
  }
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
  }
}

/** Adds one crop (at its growth stage) to the farm's batched mesh. */
function cropModel(b, p, pos) {
  const c = CROPS[p.crop];
  const x = pos.x;
  const z = pos.z;
  const y = pos.y + 0.15;
  const at = (dx, dy, dz, sx, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => mat4(x + dx, y + dy, z + dz, rx, ry, rz, sx, sy, sz);
  const stage = p.progress >= 1 ? 3 : p.progress > 0.5 ? 2 : p.progress > 0.15 ? 1 : 0;
  const leaf = '#5f9a5c';
  const ripe = stage === 3 && (p.ready || !c.regrow);
  if (stage === 0) {
    for (let i = 0; i < 3; i++) b.add(G.cone4, '#7bb36b', at((i - 1) * 0.3, 0.12, (i % 2) * 0.25 - 0.12, 0.06, 0.25, 0.06));
    return;
  }
  if (c.kind === 'tree') {
    const sc = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.85;
    const rnd = seeded(x * 13.1 + z * 7.7);
    if (c.tree === 'palm' || c.tree === 'banana') P.palm(b, x, pos.y, z, sc, rnd, c.tree === 'banana' ? { leaf: '#7fbf6a' } : undefined);
    else P.roundTree(b, x, pos.y, z, sc, rnd, { fruit: null, leaf: p.crop === 'cherry' ? '#6fa86a' : undefined });
    if (p.ready) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        b.add(G.sphere, c.color, at(Math.cos(a) * 1.25 * sc, (c.tree === 'round' ? 2.8 : 5.4) * sc + (i % 2) * 0.3, Math.sin(a) * 1.25 * sc, 0.17));
      }
    }
    return;
  }
  const h = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.75;
  const grid = (fn) => {
    for (let i = 0; i < 4; i++) fn((i % 2) * 0.8 - 0.4, Math.floor(i / 2) * 0.8 - 0.4, i);
  };
  switch (c.kind) {
    case 'cane':
      grid((dx, dz) => b.add(G.cyl6, ripe ? '#b8c46a' : '#8fbf7a', at(dx * 0.6, h * 1.1, dz * 0.6, 0.06, h * 2.2, 0.06)));
      break;
    case 'stalk': {
      // wheat, corn & rice: rows of stalks with golden heads when ripe
      const tall = p.crop === 'corn' ? 1.5 : 1;
      for (let i = 0; i < 9; i++) {
        const dx = (i % 3) * 0.55 - 0.55;
        const dz = Math.floor(i / 3) * 0.55 - 0.55;
        b.add(G.cyl6, ripe ? '#c8b45a' : '#7fb36b', at(dx, h * 0.6 * tall, dz, 0.03, h * 1.2 * tall, 0.03));
        if (stage >= 2) b.add(p.crop === 'corn' ? G.sphere : G.cone4, ripe ? c.color : '#9fc47a', at(dx, h * 1.25 * tall, dz, p.crop === 'corn' ? 0.08 : 0.06, p.crop === 'corn' ? 0.18 : 0.16, p.crop === 'corn' ? 0.08 : 0.06));
      }
      break;
    }
    case 'root':
      // leafy tops with the root peeking out of the soil
      grid((dx, dz) => {
        b.add(G.cone4, '#6faa5c', at(dx, 0.18 * h + 0.1, dz, 0.1, 0.4 * h + 0.1, 0.1));
        b.add(G.cone4, '#7fbf6a', at(dx + 0.08, 0.15 * h + 0.08, dz + 0.05, 0.07, 0.3 * h + 0.1, 0.07, 0, 0, 0.4));
        if (ripe) b.add(G.sphere, c.color, at(dx, 0.02, dz, 0.13, p.crop === 'carrot' ? 0.1 : 0.11, 0.13));
      });
      break;
    case 'leafy':
      grid((dx, dz) => {
        b.add(G.sphere, c.color, at(dx, 0.12 + h * 0.12, dz, 0.18 + h * 0.15, 0.14 + h * 0.1, 0.18 + h * 0.15));
        if (stage >= 2) b.add(G.sphere, leaf, at(dx + 0.06, 0.2 + h * 0.15, dz - 0.05, 0.1 + h * 0.08));
      });
      break;
    case 'cactus':
      b.add(G.cyl6, '#6faa5c', at(0, h * 0.9, 0, 0.18, h * 1.8, 0.18));
      if (ripe) for (const dx of [-0.25, 0.25]) b.add(G.sphere, c.color, at(dx, h * 1.6, 0.1, 0.17, 0.22, 0.17));
      break;
    default: {
      // bushes, pineapples and melons
      b.add(G.sphere, leaf, at(0, 0.3 * h + 0.1, 0, 0.45 * h + 0.15, (0.45 * h + 0.15) * (c.kind === 'pine' ? 1.5 : 0.8), 0.45 * h + 0.15));
      if (!ripe) break;
      if (c.kind === 'melon') {
        b.add(G.sphereHi, c.color, at(0.35, 0.25, 0.3, 0.38, 0.29, 0.32));
        b.add(G.sphereHi, c.color, at(-0.45, 0.2, -0.3, 0.28, 0.22, 0.26));
      } else if (c.kind === 'pine') {
        b.add(G.sphere, c.color, at(0, 0.85, 0, 0.22, 0.31, 0.22));
        b.add(G.cone6, '#5f9a5c', at(0, 1.25, 0, 0.12, 0.3, 0.12));
      } else {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          b.add(G.sphere, c.color, at(Math.cos(a) * 0.4, 0.35 + (i % 2) * 0.14, Math.sin(a) * 0.4, p.crop === 'pepper' ? 0.1 : 0.08, p.crop === 'pepper' ? 0.13 : 0.08));
        }
      }
    }
  }
}
/** Small deterministic RNG so a tree looks the same every time the farm is rebuilt. */
function seeded(seed) {
  let t = Math.abs(Math.floor(seed * 1000)) || 1;
  return () => {
    t = (t * 16807) % 2147483647;
    return (t - 1) / 2147483646;
  };
}

export function decorModel(id) {
  const g = new THREE.Group();
  const add = (geom, color, x, y, z, o = 0.02) => {
    const m = inked(geom, color, o);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  switch (id) {
    case 'lantern': {
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), '#3a3040', 0, 0.8, 0);
      const l = add(new THREE.SphereGeometry(0.28, 10, 8), '#ff8a5c', 0, 1.75, 0);
      l.scale.y = 1.2;
      l.material.emissive = new THREE.Color('#ff7a3a');
      l.material.emissiveIntensity = 0.6;
      g.userData.glow = 1.75;
      break;
    }
    case 'flowerpot':
      add(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 8), '#c8604a', 0, 0.2, 0);
      add(new THREE.IcosahedronGeometry(0.32, 1), '#5f9a5c', 0, 0.55, 0);
      for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.08, 6, 4), ['#f2a2b8', '#f7c95c', '#ffffff'][i % 3], Math.cos(i) * 0.25, 0.7, Math.sin(i) * 0.25, 0.01);
      break;
    case 'fence':
      for (const x of [-0.8, 0, 0.8]) add(new THREE.BoxGeometry(0.14, 1, 0.14), '#c8a77a', x, 0.5, 0);
      add(new THREE.BoxGeometry(1.8, 0.1, 0.08), '#b8976a', 0, 0.7, 0);
      add(new THREE.BoxGeometry(1.8, 0.1, 0.08), '#b8976a', 0, 0.35, 0);
      break;
    case 'campfire': {
      for (let i = 0; i < 6; i++) add(new THREE.DodecahedronGeometry(0.2, 0), '#7f7f8a', Math.cos(i) * 0.5, 0.1, Math.sin(i) * 0.5, 0.012);
      const f = add(new THREE.ConeGeometry(0.28, 0.7, 6), '#ffb347', 0, 0.4, 0);
      f.material.emissive = new THREE.Color('#ff7a2a');
      f.material.emissiveIntensity = 0.8;
      g.userData.glow = 0.5;
      break;
    }
    case 'tiki': {
      add(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6), '#7a5a40', 0, 0.9, 0);
      add(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 6), '#5a4030', 0, 1.9, 0);
      const f = add(new THREE.ConeGeometry(0.16, 0.5, 6), '#ffb347', 0, 2.3, 0);
      f.material.emissive = new THREE.Color('#ff7a2a');
      g.userData.glow = 2.3;
      break;
    }
    case 'bench':
      add(new THREE.BoxGeometry(1.8, 0.12, 0.6), '#a98060', 0, 0.5, 0);
      add(new THREE.BoxGeometry(1.8, 0.5, 0.1), '#a98060', 0, 0.85, -0.28);
      for (const x of [-0.75, 0.75]) add(new THREE.BoxGeometry(0.12, 0.5, 0.5), '#7a5a40', x, 0.25, 0);
      break;
    case 'hammock': {
      for (const x of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.1, 0.12, 2, 6), '#8a6a4a', x, 1, 0);
      const h = add(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#f0846a', 0, 1.2, 0);
      h.rotation.z = Math.PI / 2;
      h.material.side = THREE.DoubleSide;
      break;
    }
    case 'umbrella': {
      add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), '#f4f1e8', 0, 1.2, 0);
      const top = add(new THREE.ConeGeometry(1.4, 0.6, 8), '#58b4a5', 0, 2.3, 0);
      top.material.side = THREE.DoubleSide;
      break;
    }
    case 'flamingo': {
      for (const x of [-0.05, 0.05]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), '#e86f8a', x, 0.45, 0, 0.008);
      const b = add(new THREE.SphereGeometry(0.25, 10, 8), '#f29ab0', 0, 1.0, 0);
      b.scale.set(0.8, 0.8, 1.3);
      add(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6), '#f29ab0', 0, 1.35, 0.25, 0.01);
      add(new THREE.SphereGeometry(0.1, 8, 6), '#f29ab0', 0, 1.68, 0.3);
      add(new THREE.ConeGeometry(0.04, 0.15, 4), '#2a2534', 0, 1.62, 0.42, 0.008).rotation.x = 2;
      break;
    }
    case 'fish_trophy':
      add(new THREE.BoxGeometry(0.8, 0.8, 0.12), '#7a5a40', 0, 1.2, 0);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), '#7a5a40', 0, 0.4, 0);
      {
        const f = add(new THREE.SphereGeometry(0.25, 10, 8), '#e8b520', 0, 1.2, 0.12);
        f.scale.set(1.4, 0.7, 0.4);
        add(new THREE.ConeGeometry(0.15, 0.25, 4), '#e8b520', 0.42, 1.2, 0.12).rotation.z = Math.PI / 2;
      }
      break;
    default:
      add(new THREE.BoxGeometry(0.5, 0.5, 0.5), '#ffffff', 0, 0.25, 0);
  }
  return g;
}

export { toon };
