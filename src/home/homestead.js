import * as THREE from 'three';
import { MAX_PLOTS, plotsForLevel } from '../farm/crops.js';
import { ITEMS } from '../shared/items.js';
import { HOUSES, DECOR } from './houses.js';
import { Batcher } from '../world/toon.js';
import * as P from '../world/props.js';
import { kitchen, kitchenRuined } from '../kitchen/models.js';
import { campClearing, decorModel } from './models.js';
import { pick } from '../shared/utils.js';
import { animateAnimal } from '../farm/animalModels.js';
import { FieldMethods } from '../farm/field.js';
import { BarnyardMethods } from '../farm/barnyard.js';
import { ForagingMethods } from '../world/foraging.js';

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
  }
  detach() {
    if (this.group) this.group.parent?.remove(this.group);
    if (this.world) this.world.interactables = this.world.interactables.filter((i) => !i.home);
    if (this.world) this.world.colliders = this.world.colliders.filter((c) => !c.home && !c.decor);
    this.group = null;
    this.world = null;
    this.animals = [];
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
    // a brand-new islander has no tent yet — Mayor Mike has one pitched for them
    const pitched = lvl > 0 || this.s.house.tent !== false;
    if (lvl === 0 && !pitched) {
      campClearing(b, hx, y, hz);
      door = null;
    } else if (lvl === 0) {
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
    // the kitchen sits right beside the house, opening onto the farm — in ruins until Bob fixes it
    const kx = hx - halfW - 3.6;
    const kz = hz - 0.2;
    const kitchenOk = this.isBuilt('kitchen');
    const k = kitchenOk ? kitchen(b, kx, w.heightAt(kx, kz), kz, 0, w.glowPoints) : kitchenRuined(b, kx, w.heightAt(kx, kz), kz, 0);
    for (const c of k.colliders) w.colliders.push({ ...c, home: true });
    this.kitchenPos = k.front;
    this.firePos = kitchenOk ? k.front.clone().setZ(k.front.z - 2.6) : null;
    this.chimney = k.chimney;
    if (kitchenOk) {
      this.kitchenSign = P.signBoard('KITCHEN', k.signPos, 0, { bg: '#fbe2c8', w: 2.2 });
      this.group.add(this.kitchenSign);
    } else this.kitchenSign = null;
    this.houseMesh = b.build(w.glowMat);
    this.group.add(this.houseMesh);
    if (collider) w.colliders.push({ ...collider, home: true });
    this.door = door;
    if (this.world) this.world.spots.homeDoor = door;
    if (door) {
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
        action: () => {
          this.game.ui.openPanel('home');
          this.game.events.emit('home', {});
        },
      });
    }
    if (kitchenOk) {
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
    } else {
      const q = this.game.quests;
      const msg = () => (q.isActive('m4k') ? 'The old kitchen is in ruins. Bring Bob 6 Driftwood and 3 Stone and he\'ll rebuild it.' : 'The old kitchen is in ruins. Grandma Rose and Bob the builder could help you fix it up one day.');
      w.interact({
        pos: this.kitchenPos,
        r: 3.0,
        priority: 3,
        home: true,
        homeHouse: true,
        icon: '🍳',
        tipH: 1.4,
        tip: () => ({ title: 'Broken Kitchen', desc: msg() }),
        label: () => 'Broken kitchen',
        action: () => this.game.ui.toast(msg(), 'info'),
      });
    }
  }

  /** Mayor Mike pitches a tent for the new islander. */
  pitchTent() {
    if (this.s.house.tent !== false) return;
    this.s.house.tent = true;
    if (this.group) {
      this.buildHouse();
      const d = this.door;
      if (d) this.game.particles.burst(d.clone().setY(d.y + 1.5), { count: 40, color: '#fbf3e2', speed: 4, up: 4, life: 1.0 });
    }
    this.game.ui.toast('⛺ Mayor Mike had a tent pitched for you on the west meadow!', 'good');
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
}
Object.assign(HomeSystem.prototype, FieldMethods, BarnyardMethods, ForagingMethods);
