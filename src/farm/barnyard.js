import * as THREE from 'three';
import { ITEMS } from '../shared/items.js';
import { ANIMALS, FARM_BUILDINGS, FEEDER_CAPACITY } from './animals.js';
import { QUESTS } from '../story/quests.js';
import { Batcher } from '../world/toon.js';
import { pen as penModel, penRuined, penSite, feeder as feederModel } from './models.js';
import { randInt, seeded } from '../shared/utils.js';
import { itemMesh } from '../world/fx.js';
import { animalModel } from './animalModels.js';

// animal pens along the south edge of the homestead, keyed by building (x offset from centre, width)
const PENS = { coop: { dx: -10.4, w: 3.8, kind: 'coop' }, barn: { dx: -5.65, w: 5, kind: 'barn' }, goatpen: { dx: -0.8, w: 4, kind: 'goat' }, fold: { dx: 3.65, w: 4.2, kind: 'fold' }, sty: { dx: 8, w: 3.8, kind: 'sty' }, hives: { dx: 12.05, w: 3.6, kind: 'hives' } };
const FEEDER_AT = { dx: -13.2, dz: 12 };
const PEN_Z = 17.5;
const PEN_D = 4.5;

/**
 * The barnyard: farm buildings Bob builds or repairs (incl. the kitchen), animal pens,
 * the feeder and the animals themselves.
 * Mixed into HomeSystem (home/homestead.js), so `this` is the homestead.
 */
export const BarnyardMethods = {
  // ── farm buildings & animals ───────────────────
  buildingState(id) {
    return this.s.farm.buildings?.[id] || FARM_BUILDINGS[id].start;
  },
  isBuilt(id) {
    return this.buildingState(id) === 'built';
  },
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
  },
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
  },
  /** Finish a building (Bob's work or a quest reward). */
  setBuilt(id) {
    const g = this.game;
    const b = FARM_BUILDINGS[id];
    this.s.farm.buildings = this.s.farm.buildings || {};
    const was = this.buildingState(id);
    this.s.farm.buildings[id] = 'built';
    if (this.group && id === 'kitchen') {
      this.buildHouse();
      g.particles.burst(this.kitchenPos.clone().setY(this.kitchenPos.y + 1.8), { count: 50, color: '#fbf3e2', speed: 5, up: 5, life: 1.1 });
    } else if (this.group) {
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
  },

  penCenter(id) {
    const H = this.center;
    const x = H.x + PENS[id].dx;
    const z = H.z + PEN_Z;
    return new THREE.Vector3(x, this.world.heightAt(x, z), z);
  },
  feederPos() {
    const x = this.center.x + FEEDER_AT.dx;
    const z = this.center.z + FEEDER_AT.dz;
    return new THREE.Vector3(x, this.world.heightAt(x, z), z);
  },
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
      if (st === 'built') penModel(b, c.x, c.y, c.z, pen.w, PEN_D, pen.kind, hAt);
      else if (st === 'ruined') penRuined(b, c.x, c.y, c.z, pen.w, PEN_D, hAt, seeded(c.x * 3.1));
      else penSite(b, c.x, c.y, c.z, pen.w, PEN_D, hAt);
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
      feederModel(b, f.x, f.y, f.z, Math.min(1, (this.s.farm.feed || 0) / FEEDER_CAPACITY));
      w.colliders.push({ type: 'box', x: f.x, z: f.z, hw: 0.9, hd: 0.5, rot: 0, pen: true, home: true });
    } else penSite(b, f.x, f.y, f.z, 2.2, 1.8, hAt);
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
  },
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
  },
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
  },

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
  },
  animalStatus(idx) {
    const an = this.s.farm.animals[idx];
    const a = ANIMALS[an.type];
    if (an.ready) return `Ready! Press E to collect ${ITEMS[a.product].name.toLowerCase()}.`;
    if (!an.fed) return this.isBuilt('feeder') ? 'Hungry — the feeder is empty. Add Animal Feed to the Feeder.' : 'Hungry — ask Bob to build a Feeder, then fill it with Animal Feed.';
    return `Making ${ITEMS[a.product].name.toLowerCase()}… ${Math.floor((an.progress || 0) * 100)}%`;
  },
  animalLabel(idx) {
    const an = this.s.farm.animals[idx];
    const a = ANIMALS[an.type];
    if (an.ready) return `Collect ${ITEMS[a.product].icon} ${ITEMS[a.product].name}`;
    if (!an.fed) return `${a.name} is hungry — ${this.isBuilt('feeder') ? 'fill the Feeder' : 'needs a Feeder'}`;
    return `${a.name} — ${Math.floor((an.progress || 0) * 100)}%`;
  },
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
  },
  /** A new animal joins the farm (bought from Chloe or a reward). */
  addAnimal(type) {
    this.s.farm.animals.push({ type, fed: false, progress: 0, ready: false });
    this.grow(0);
    if (this.group) this.rebuildAnimals();
  },
  animalCount(type) {
    return (this.s.farm.animals || []).filter((a) => a.type === type).length;
  },
};
