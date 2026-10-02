import * as THREE from 'three';
import { inked, toon } from '../world/toon.js';
import { CROPS, ITEMS } from '../data/items.js';
import { HOUSES, DECOR } from '../data/gear.js';
import { COSMETICS } from '../data/cosmetics.js';
import { Batcher } from '../world/toon.js';
import * as P from '../world/props.js';
import { rand, randInt, pick } from '../core/utils.js';

/**
 * Homestead (Palmora only): house, farm plots, decorations. Also handles wild
 * fruit trees and treasure digging on every island.
 */
export class HomeSystem {
  constructor(game) {
    this.game = game;
    this.group = null;
    game.events.on('minutes', (m) => this.grow(m));
    game.events.on('newDay', () => this.onNewDay());
  }
  get s() {
    return this.game.state;
  }

  plotCount() {
    return HOUSES[this.s.house.level].plots;
  }
  ensurePlots() {
    const n = this.plotCount();
    while (this.s.farm.plots.length < n) this.s.farm.plots.push({ crop: null });
  }

  // ── growth ─────────────────────────────────────
  grow(minutes) {
    const s = this.s;
    if (!s) return;
    const rain = this.game.weather.raining();
    let changed = false;
    for (const p of s.farm.plots) {
      if (!p.crop) continue;
      const c = CROPS[p.crop];
      const watered = rain || p.watered === s.time.day;
      const rate = (watered ? 1.5 : 1) / 60;
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
    if (changed && this.group) this.rebuildCrops();
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
    this.cropGroup = new THREE.Group();
    this.group.add(this.cropGroup);
    this.rebuildCrops();
    this.decorGroup = new THREE.Group();
    this.group.add(this.decorGroup);
    this.rebuildDecor();
    world.spots.homeDoor = this.door;
  }
  detach() {
    if (this.group) this.group.parent?.remove(this.group);
    if (this.world) this.world.interactables = this.world.interactables.filter((i) => !i.home);
    this.group = null;
    this.world = null;
  }

  plotPos(i) {
    const H = this.center;
    const col = i % 4;
    const row = Math.floor(i / 4);
    return new THREE.Vector3(H.x - 3.6 + col * 2.4, 0, H.z + 1.5 + row * 2.4);
  }

  buildHouse() {
    const w = this.world;
    const lvl = this.s.house.level;
    if (this.houseMesh) this.houseMesh.parent?.remove(this.houseMesh);
    w.colliders = w.colliders.filter((c) => !c.home);
    w.interactables = w.interactables.filter((i) => !i.homeHouse);
    const H = this.center;
    const hx = H.x;
    const hz = H.z - 6;
    const y = w.heightAt(hx, hz);
    const b = new Batcher();
    let door;
    let collider;
    if (lvl === 0) {
      const t = P.tent(b, hx, y, hz, 0, '#e8dcc0', '#58b4a5');
      collider = { ...t.collider, r: 1.8 };
      door = new THREE.Vector3(hx, y, hz + 2.6);
      P.campfire(b, hx + 3, y, hz + 2.5, []);
      w.colliders.push({ type: 'circle', x: hx + 3, z: hz + 2.5, r: 0.7, home: true });
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
      if (lvl >= 3) {
        // side wing
        const wing = P.house(b, hx + opts.w / 2 + 2.2, y, hz - 0.8, { w: 3.6, d: 4, h: opts.h * 0.8, wall: opts.wall, roof: opts.roof });
        w.colliders.push({ ...wing.collider, home: true });
      }
      P.campfire(b, hx + opts.w / 2 + 1.5, y, hz + opts.d / 2 + 2.5, []);
      w.colliders.push({ type: 'circle', x: hx + opts.w / 2 + 1.5, z: hz + opts.d / 2 + 2.5, r: 0.7, home: true });
      this.firePos = new THREE.Vector3(hx + opts.w / 2 + 1.5, y, hz + opts.d / 2 + 2.5);
    }
    if (lvl === 0) this.firePos = new THREE.Vector3(hx + 3, y, hz + 2.5);
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
      label: () => `${HOUSES[this.s.house.level].name} — home menu`,
      action: () => this.game.ui.openPanel('home'),
    });
    w.interact({
      pos: this.firePos,
      r: 2.4,
      priority: 2,
      home: true,
      homeHouse: true,
      icon: '🍳',
      label: () => 'Cook at the campfire',
      action: () => this.game.ui.openPanel('cook'),
    });
  }

  rebuildCrops() {
    if (!this.cropGroup) return;
    this.cropGroup.clear();
    this.world.interactables = this.world.interactables.filter((i) => !i.plot);
    this.ensurePlots();
    const s = this.s;
    s.farm.plots.forEach((p, i) => {
      const pos = this.plotPos(i);
      pos.y = this.world.heightAt(pos.x, pos.z);
      const watered = p.watered === s.time.day || this.game.weather.raining();
      const soil = inked(SOIL_GEO, watered && p.crop ? '#5a3c28' : '#8a6040', 0.02);
      soil.position.copy(pos).setY(pos.y + 0.08);
      soil.castShadow = false;
      this.cropGroup.add(soil);
      if (p.crop) this.cropGroup.add(cropModel(p, pos));
      this.world.interact({
        pos,
        r: 1.3,
        priority: 1,
        home: true,
        plot: i,
        icon: p.ready ? '🧺' : p.crop ? '🚿' : '🌱',
        label: () => this.plotLabel(i),
        action: () => this.usePlot(i),
      });
    });
  }

  plotLabel(i) {
    const p = this.s.farm.plots[i];
    if (!p.crop) return 'Plant seeds';
    const c = CROPS[p.crop];
    if (p.ready) return `Harvest ${c.name}`;
    const pct = Math.floor((p.progress < 1 ? p.progress : p.regrow || 0) * 100);
    const watered = p.watered === this.s.time.day || this.game.weather.raining();
    if (!watered && this.game.hasItem('watering_can')) return `Water ${c.name} (${pct}%)`;
    return `${c.name} growing… ${pct}%${watered ? ' 💧' : ''}`;
  }

  usePlot(i) {
    const g = this.game;
    const p = this.s.farm.plots[i];
    if (!p.crop) {
      const seeds = Object.keys(this.s.inventory).filter((id) => ITEMS[id]?.type === 'seed' && this.s.inventory[id] > 0);
      if (!seeds.length) {
        g.ui.toast('No seeds! Buy some at Coco\'s fruit stand.', 'warn');
        return;
      }
      g.ui.openPicker({
        title: 'Plant what?',
        items: seeds,
        onPick: (id) => {
          g.removeItem(id, 1, true);
          p.crop = ITEMS[id].crop;
          p.progress = 0;
          p.ready = false;
          p.regrow = 0;
          p.watered = g.weather.raining() ? this.s.time.day : null;
          g.player.char.play('plant', 0.6);
          g.audio.sfx('plant');
          g.particles.burst(this.plotPos(i).setY(this.center.y + 0.3), { count: 10, color: '#8a6040', speed: 1.5, up: 2 });
          g.events.emit('plant', { crop: p.crop });
          g.addXP(3);
          this.rebuildCrops();
        },
      });
      return;
    }
    const c = CROPS[p.crop];
    if (p.ready) {
      const n = randInt(c.yield[0], c.yield[1]);
      g.addItem(c.item, n);
      g.ui.toast(`Harvested ${n}× ${ITEMS[c.item].icon} ${ITEMS[c.item].name}`, 'good');
      g.audio.sfx('harvest');
      g.player.char.play('plant', 0.5);
      g.particles.burst(this.plotPos(i).setY(this.center.y + 0.8), { count: 14, color: c.color, speed: 2, up: 3 });
      this.s.stats.harvested += n;
      g.events.emit('harvest', { crop: p.crop, count: 1 });
      g.addXP(c.kind === 'tree' ? 10 : 6 + Math.round(c.hours / 2));
      if (c.regrow) {
        p.ready = false;
        p.regrow = 0;
      } else {
        p.crop = null;
        p.progress = 0;
        p.ready = false;
      }
      this.rebuildCrops();
      return;
    }
    if (!g.hasItem('watering_can')) {
      g.ui.toast('Growing… A watering can makes crops grow 50% faster.', 'info');
      return;
    }
    if (p.watered === this.s.time.day || g.weather.raining()) {
      g.ui.toast('Already watered today 💧', 'info');
      return;
    }
    p.watered = this.s.time.day;
    g.audio.sfx('water');
    g.player.char.play('plant', 0.5);
    g.particles.burst(this.plotPos(i).setY(this.center.y + 0.6), { count: 16, color: '#7fd3f0', speed: 1.2, up: 1.5 });
    this.rebuildCrops();
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
    this.ensurePlots();
    if (this.world) {
      this.buildHouse();
      this.rebuildCrops();
      g.particles.burst(this.center.clone().setY(this.center.y + 2), { count: 60, color: '#fbf3e2', speed: 6, up: 6, life: 1.2 });
    }
    g.audio.sfx('build');
    g.ui.banner('Home Upgraded!', `${h.name} — ${h.plots} farm plots`, '🏠');
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
    g.addItem(tree.fruit, n);
    g.audio.sfx('shake');
    g.particles.burst(tree.pos.clone().setY(tree.pos.y + 3), { count: 18, color: '#6aa86a', speed: 2.5, up: 1, gravity: 4, life: 1.2 });
    g.ui.toast(`Shook loose ${n}× ${ITEMS[tree.fruit].icon} ${ITEMS[tree.fruit].name}`, 'good');
    g.events.emit('collect', { item: tree.fruit });
    g.addXP(2);
  }
  dig(world, spot) {
    const g = this.game;
    if (!g.hasItem('shovel')) {
      g.ui.toast('You need a Shovel — Coco sells them.', 'warn');
      return;
    }
    g.worldState(world.id).dug.push(spot.i);
    world.removeDigSpot(spot);
    g.player.char.play('dig', 0.8);
    g.audio.sfx('dig');
    g.particles.burst(spot.pos.clone().setY(spot.pos.y + 0.3), { count: 24, color: '#d9c08f', speed: 3, up: 4 });
    this.s.stats.dug++;
    g.events.emit('collect', { item: 'treasure' });
    setTimeout(() => this.treasureLoot(world.id), 600);
  }
  treasureLoot(island) {
    const g = this.game;
    const r = Math.random();
    const deep = island === 'skull' ? 2 : island === 'ember' ? 1.5 : island === 'coralia' ? 1.2 : 1;
    const loot = { coins: Math.round(rand(60, 180) * deep), xp: 25 };
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

const SOIL_GEO = new THREE.BoxGeometry(2.0, 0.18, 2.0);

function cropModel(p, pos) {
  const c = CROPS[p.crop];
  const g = new THREE.Group();
  g.position.copy(pos).setY(pos.y + 0.15);
  const stage = p.progress >= 1 ? 3 : p.progress > 0.5 ? 2 : p.progress > 0.15 ? 1 : 0;
  const leaf = '#5f9a5c';
  if (stage === 0) {
    for (let i = 0; i < 3; i++) {
      const s = inked(new THREE.ConeGeometry(0.05, 0.25, 4), '#7bb36b', 0.012);
      s.position.set((i - 1) * 0.25, 0.12, (i % 2) * 0.2 - 0.1);
      g.add(s);
    }
    return g;
  }
  if (c.kind === 'tree') {
    const sc = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.85;
    const b = new Batcher();
    if (c.tree === 'palm' || c.tree === 'banana') P.palm(b, 0, 0, 0, sc, Math.random, c.tree === 'banana' ? { leaf: '#7fbf6a' } : undefined);
    else P.roundTree(b, 0, 0, 0, sc, Math.random, { fruit: null });
    const mesh = b.build(null);
    g.add(mesh);
    if (p.ready) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const f = inked(new THREE.SphereGeometry(0.16, 8, 6), c.color, 0.015);
        f.position.set(Math.cos(a) * 1.2 * sc, (c.tree === 'round' ? 2.8 : 5.4) * sc, Math.sin(a) * 1.2 * sc);
        g.add(f);
      }
    }
    return g;
  }
  const h = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.75;
  if (c.kind === 'cane') {
    for (let i = 0; i < 4; i++) {
      const s = inked(new THREE.CylinderGeometry(0.05, 0.06, h * 2.2, 5), stage === 3 ? '#b8c46a' : '#8fbf7a', 0.012);
      s.position.set((i % 2) * 0.4 - 0.2, h * 1.1, Math.floor(i / 2) * 0.4 - 0.2);
      g.add(s);
    }
  } else if (c.kind === 'cactus') {
    const s = inked(new THREE.CylinderGeometry(0.16, 0.2, h * 1.8, 6), '#6faa5c', 0.015);
    s.position.y = h * 0.9;
    g.add(s);
    if (stage === 3) {
      for (const dx of [-0.25, 0.25]) {
        const f = inked(new THREE.SphereGeometry(0.17, 8, 6), c.color, 0.015);
        f.scale.y = 1.3;
        f.position.set(dx, h * 1.6, 0.1);
        g.add(f);
      }
    }
  } else {
    const bush = inked(new THREE.IcosahedronGeometry(0.45 * h + 0.15, 1), leaf, 0.015);
    bush.position.y = 0.3 * h + 0.1;
    bush.scale.y = c.kind === 'pine' ? 1.5 : 0.8;
    g.add(bush);
    if (stage === 3) {
      if (c.kind === 'melon') {
        const m = inked(new THREE.SphereGeometry(0.32, 10, 8), c.color, 0.02);
        m.scale.set(1.2, 0.9, 1);
        m.position.set(0.35, 0.25, 0.3);
        g.add(m);
      } else if (c.kind === 'pine') {
        const m = inked(new THREE.SphereGeometry(0.22, 8, 6), c.color, 0.02);
        m.scale.y = 1.4;
        m.position.y = 0.85;
        g.add(m);
        const crown = inked(new THREE.ConeGeometry(0.12, 0.3, 5), '#5f9a5c', 0.015);
        crown.position.y = 1.25;
        g.add(crown);
      } else {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const f = inked(new THREE.SphereGeometry(0.08, 6, 5), c.color, 0.01);
          f.position.set(Math.cos(a) * 0.38, 0.35 + (i % 2) * 0.12, Math.sin(a) * 0.38);
          g.add(f);
        }
      }
    }
  }
  return g;
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
