import * as THREE from 'three';
import { Terrain } from './terrain.js';
import { Batcher, toon, inked, G, mat4 } from './toon.js';
import * as P from './props.js';
import { mulberry32, smoothstep, hashString, clamp } from '../core/utils.js';
import { NPCS } from '../data/npcs.js';
import { NPC, crabModel, gullModel } from '../entities/actors.js';
import { ITEMS } from '../data/items.js';

const PICKUP_TYPES = {
  palmora: [['shell', 5], ['starfish', 2], ['driftwood', 4], ['bottle', 0.4]],
  coralia: [['shell', 5], ['starfish', 3], ['coral_piece', 3], ['driftwood', 2], ['bottle', 0.5]],
  ember: [['obsidian', 3], ['driftwood', 3], ['shell', 2], ['bottle', 0.4]],
  skull: [['driftwood', 4], ['doubloon', 1], ['shell', 2], ['bottle', 0.6]],
};

/**
 * One loaded island: terrain, props, NPCs, pickups and everything the player
 * can bump into or interact with.
 */
export class IslandWorld {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.group = new THREE.Group();
    this.group.name = 'island-' + def.id;
    this.zones = [];
    this.paths = [];
    this.colliders = [];
    this.platforms = [];
    this.interactables = [];
    this.spots = {};
    this.npcs = [];
    this.enemies = [];
    this.pickups = [];
    this.digSpots = [];
    this.glowPoints = [];
    this.occupied = [];
    this.critters = [];
    this.dynamic = new THREE.Group();
    this.group.add(this.dynamic);
    this.rnd = mulberry32(def.seed);

    const layout = LAYOUTS[def.id];
    layout.zones(this);
    this.terrain = new Terrain(def, this.zones, this.paths);
    this.group.add(this.terrain.build());
    this.heightAt = (x, z) => this.terrain.heightAt(x, z);

    this.batch = new Batcher();
    this.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#888888' });
    layout.build(this, this.batch);
    this.scatterNature(layout.nature ?? {});
    this.group.add(this.batch.build(this.glowMat));
    this.buildGlows();
    this.spawnNPCs();
    this.spawnCritters();
    this.refreshDaily();
    this.heightTex = this.terrain.heightTexture();
  }

  // ── layout helpers ─────────────────────────────────────
  flatten(x, z, r, h, f = 8) {
    this.zones.push({ x, z, r, h, f });
  }
  path(x1, z1, x2, z2, w = 2.2) {
    this.paths.push([x1, z1, x2, z2, w]);
  }
  occupy(x, z, r) {
    this.occupied.push({ x, z, r });
  }
  isFree(x, z, r) {
    for (const o of this.occupied) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return false;
    for (const zn of this.zones) if (Math.hypot(x - zn.x, z - zn.z) < zn.r + 1) return false;
    for (const p of this.paths) {
      const [x1, z1, x2, z2, w] = p;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const t = clamp(((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz || 1), 0, 1);
      if (Math.hypot(x - (x1 + dx * t), z - (z1 + dz * t)) < w + r + 0.5) return false;
    }
    return true;
  }
  slope(x, z) {
    return 1 - this.terrain.normalAt(x, z).y;
  }
  addCollider(c) {
    if (!c) return;
    if (c.type === 'box' || c.type === 'circle') this.colliders.push(c);
    else if (c.r) this.colliders.push({ type: 'circle', x: c.x, z: c.z, r: c.r });
  }
  circle(x, z, r, tree = false) {
    this.colliders.push({ type: 'circle', x, z, r, tree });
    this.occupy(x, z, r + 0.5);
  }
  interact(def) {
    const it = { r: 2.2, priority: 0, enabled: () => true, ...def };
    this.interactables.push(it);
    return it;
  }
  /** March from (x,z) along dir until reaching water; returns shoreline point. */
  findShore(x, z, dx, dz, level = 0.15) {
    const len = Math.hypot(dx, dz);
    dx /= len;
    dz /= len;
    for (let t = 0; t < 200; t += 0.5) {
      const h = this.heightAt(x + dx * t, z + dz * t);
      if (h < level) return { x: x + dx * t, z: z + dz * t, dx, dz };
    }
    return { x: x + dx * 60, z: z + dz * 60, dx, dz };
  }
  /** Builds a dock going out to sea and registers boarding. */
  makeDock(b, startX, startZ, dx, dz, opts = {}) {
    const shore = this.findShore(startX, startZ, dx, dz);
    const sx = shore.x - shore.dx * 2.5;
    const sz = shore.z - shore.dz * 2.5;
    let length = 14;
    for (let t = 6; t < 30; t += 1) {
      length = t;
      if (this.heightAt(sx + shore.dx * t, sz + shore.dz * t) < -2.2) break;
    }
    length = Math.max(12, length + 2);
    const rot = Math.atan2(shore.dx, shore.dz);
    const y = Math.max(this.heightAt(sx, sz), 0.6) + 0.35;
    const d = P.dock(b, sx, y, sz, rot, length);
    this.platforms.push(...d.platforms);
    this.dock = { start: new THREE.Vector3(sx, y, sz), end: d.end.clone(), rot, dir: new THREE.Vector3(shore.dx, 0, shore.dz), y };
    // moored boat
    const side = new THREE.Vector3(Math.cos(rot), 0, -Math.sin(rot));
    this.boatAnchor = d.end.clone().addScaledVector(side, (opts.boatSide ?? 1) * 6.5).addScaledVector(this.dock.dir, -6).setY(0.05);
    this.boatGroup = new THREE.Group();
    this.boatGroup.position.copy(this.boatAnchor);
    this.boatGroup.rotation.y = rot;
    this.dynamic.add(this.boatGroup);
    this.setBoatModel(this.game.boatTier());
    this.interact({
      pos: d.end.clone().addScaledVector(this.dock.dir, -6).addScaledVector(side, (opts.boatSide ?? 1) * 1.6),
      r: 2.0,
      priority: 1,
      enabled: () => this.game.boatTier() > 0,
      label: () => 'Board your boat & set sail',
      icon: '⛵',
      action: () => this.game.openTravel(),
    });
    for (const s of [-1, 1]) P.lamppost(b, sx + side.x * 1.9 * s, y - 0.1, sz + side.z * 1.9 * s, this.glowPoints);
    return this.dock;
  }
  setBoatModel(tier) {
    if (!this.boatGroup) return;
    this.boatGroup.clear();
    this.boatGroup.add(P.boatModel(tier));
  }

  scatterNature(n) {
    const r = this.rnd;
    const R = this.def.radius;
    const b = this.batch;
    const pal = this.def.palette;
    const place = (count, test, fn, rad) => {
      let placed = 0;
      for (let t = 0; t < count * 25 && placed < count; t++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * R * 1.05;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const h = this.heightAt(x, z);
        if (!test(h, x, z)) continue;
        if (!this.isFree(x, z, rad)) continue;
        fn(x, h, z);
        placed++;
      }
    };
    place(n.palms ?? 50, (h, x, z) => h > 0.35 && h < 2.2 && this.slope(x, z) < 0.12, (x, h, z) => {
      const s = 0.85 + r() * 0.45;
      P.palm(b, x, h - 0.1, z, s, r, n.palmPal);
      this.circle(x, z, 0.4 * s, true);
    }, 1.6);
    place(n.trees ?? 25, (h, x, z) => h > 1.6 && h < 9 && this.slope(x, z) < 0.18, (x, h, z) => {
      const s = 0.8 + r() * 0.5;
      P.roundTree(b, x, h - 0.1, z, s, r, { leaf: r() < 0.5 ? pal.grass2 : n.leaf ?? '#5f9a5c' });
      this.circle(x, z, 0.45 * s, true);
    }, 2.4);
    place(n.pines ?? 12, (h, x, z) => h > 4 && this.slope(x, z) < 0.3, (x, h, z) => {
      const s = 0.8 + r() * 0.6;
      P.pine(b, x, h - 0.1, z, s, r, { leaf: n.pineLeaf });
      this.circle(x, z, 0.4 * s, true);
    }, 1.8);
    place(n.bushes ?? 50, (h) => h > 1.3 && h < 10, (x, h, z) => {
      const flowers = r() < 0.4 ? ['#f2a2b8', '#ffffff', '#f7c95c', '#e86f8a'][Math.floor(r() * 4)] : null;
      P.bush(b, x, h - 0.05, z, 0.7 + r() * 0.6, r, r() < 0.5 ? pal.grass2 : '#6aa36a', flowers);
    }, 1.0);
    place(n.rocks ?? 30, (h) => h > -1.5 && h < 14, (x, h, z) => {
      const s = 0.6 + r() * 1.3;
      P.rock(b, x, h - 0.2, z, s, r, n.rockColor ?? pal.rock);
      if (s > 0.9) this.circle(x, z, 0.85 * s);
      this.stoneSpots = this.stoneSpots || [];
      this.stoneSpots.push(new THREE.Vector3(x, h, z));
    }, 1.4);

    // wild fruit trees (shake for fruit)
    const fruitTypes = n.fruitTrees ?? [['mango', '#f29a2e'], ['banana', '#f2d23a'], ['coconut', '#6b4a2e']];
    this.fruitTrees = [];
    let idx = 0;
    for (const [fruit, color] of fruitTypes) {
      place(n.fruitPer ?? 2, (h, x, z) => h > 1.6 && h < 6 && this.slope(x, z) < 0.15, (x, h, z) => {
        if (fruit === 'coconut') P.palm(b, x, h - 0.1, z, 1.1, r);
        else P.roundTree(b, x, h - 0.1, z, 1.05, r, { fruit: color });
        this.circle(x, z, 0.5, true);
        const tree = { fruit, idx: idx++, pos: new THREE.Vector3(x, h, z) };
        this.fruitTrees.push(tree);
        this.interact({
          pos: tree.pos,
          r: 2.6,
          icon: ITEMS[fruit].icon,
          label: () => (this.game.home.treeReady(this.id, tree.idx) ? `Shake ${ITEMS[fruit].name} tree` : `${ITEMS[fruit].name} tree (regrowing)`),
          action: () => this.game.home.shakeTree(this, tree),
        });
      }, 2.5);
    }

    // instanced grass tufts + flowers
    const tuft = new THREE.ConeGeometry(0.09, 0.55, 3);
    tuft.translate(0, 0.27, 0);
    const blades = [];
    for (let i = 0; i < 3; i++) {
      const g = tuft.clone();
      g.rotateZ((i - 1) * 0.35);
      g.rotateY(i * 2.1);
      blades.push(g.toNonIndexed());
    }
    const merged = new THREE.BufferGeometry();
    {
      const arrs = blades.map((g) => g.getAttribute('position').array);
      const total = arrs.reduce((s, a) => s + a.length, 0);
      const pos = new Float32Array(total);
      let o = 0;
      for (const a of arrs) {
        pos.set(a, o);
        o += a.length;
      }
      merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      merged.computeVertexNormals();
    }
    const count = n.grass ?? 1800;
    const grass = new THREE.InstancedMesh(merged, toon('#ffffff'), count);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let gi = 0;
    for (let t = 0; t < count * 4 && gi < count; t++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * R;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      const h = this.heightAt(x, z);
      if (h < 1.35 || this.slope(x, z) > 0.25) continue;
      const s = 0.7 + r() * 0.8;
      m.compose(new THREE.Vector3(x, h - 0.05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, 0)), new THREE.Vector3(s, s, s));
      grass.setMatrixAt(gi, m);
      const flower = r() < 0.06;
      c.set(flower ? ['#f2a2b8', '#ffffff', '#f7c95c'][Math.floor(r() * 3)] : r() < 0.5 ? pal.grass : pal.grass2).multiplyScalar(flower ? 1 : 0.92);
      grass.setColorAt(gi, c);
      gi++;
    }
    grass.count = gi;
    grass.receiveShadow = true;
    this.group.add(grass);
  }

  buildGlows() {
    this.glowSprites = [];
    for (const p of this.glowPoints) {
      const s = P.glowSprite(p, '#ffcf7a', 3.2);
      this.glowSprites.push(s);
      this.group.add(s);
    }
    // a few real lights at the brightest spots
    this.lights = [];
    const max = Math.min(this.glowPoints.length, 6);
    const pts = [...this.glowPoints].sort((a, b) => a.length() - b.length()).slice(0, max);
    for (const p of pts) {
      const l = new THREE.PointLight('#ffc070', 0, 14, 1.6);
      l.position.copy(p);
      this.group.add(l);
      this.lights.push(l);
    }
  }

  spawnNPCs() {
    for (const def of Object.values(NPCS)) {
      if (def.island !== this.id) continue;
      const spot = this.spots[def.spot];
      if (!spot) continue;
      const npc = new NPC(this.game, def, spot, this);
      this.npcs.push(npc);
      this.dynamic.add(npc.root);
      this.interact({
        pos: npc.root.position,
        r: 2.6,
        priority: 3,
        npc,
        icon: '💬',
        enabled: () => npc.available(),
        label: () => `Talk to ${def.name}`,
        action: () => this.game.dialogue.open(npc),
      });
      npc.label = this.game.ui.addLabel(npc.root, { offsetY: 2.35 * (def.scale ?? 1), cls: 'npc-label', html: '', maxDist: 16 });
    }
  }

  spawnCritters() {
    const r = this.rnd;
    for (let i = 0; i < 6; i++) {
      for (let t = 0; t < 40; t++) {
        const a = r() * Math.PI * 2;
        const d = this.def.radius * (0.4 + r() * 0.6);
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const h = this.heightAt(x, z);
        if (h > 0.2 && h < 1.0) {
          const m = crabModel();
          m.position.set(x, h, z);
          this.dynamic.add(m);
          this.critters.push({ kind: 'crab', m, home: new THREE.Vector3(x, h, z), t: r() * 10, dir: r() * 6 });
          break;
        }
      }
    }
    for (let i = 0; i < 5; i++) {
      const m = gullModel();
      this.dynamic.add(m);
      this.critters.push({ kind: 'gull', m, t: r() * 100, r: 20 + r() * 40, h: 14 + r() * 10, s: 0.15 + r() * 0.1, cx: (r() - 0.5) * 40, cz: (r() - 0.5) * 40 });
    }
  }

  /** Daily pickups and treasure spots (seeded per day). */
  refreshDaily() {
    for (const p of this.pickups) p.mesh.parent?.remove(p.mesh);
    for (const d of this.digSpots) d.mesh.parent?.remove(d.mesh);
    this.pickups = [];
    this.digSpots = [];
    const g = this.game;
    const day = g.state?.time.day ?? 1;
    const ws = g.worldState(this.id);
    if (ws.day !== day) {
      ws.day = day;
      ws.taken = [];
      ws.dug = [];
      ws.extra = [];
    }
    const rnd = mulberry32(hashString(this.id + ':' + day));
    const types = PICKUP_TYPES[this.id];
    const total = 26;
    for (let i = 0; i < total; i++) {
      const id = weighted(types, rnd);
      let pos = null;
      for (let t = 0; t < 60 && !pos; t++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * this.def.radius * 1.05;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const h = this.heightAt(x, z);
        const beach = h > 0.05 && h < 1.2;
        if (id === 'stone' ? h > 1.2 : beach) pos = new THREE.Vector3(x, h, z);
      }
      if (!pos) continue;
      if (ws.taken.includes(i)) continue;
      this.addPickup(i, id, pos);
    }
    // stones near rocks
    (this.stoneSpots || []).slice(0, 10).forEach((s, k) => {
      const i = 100 + k;
      if (ws.taken.includes(i) || rnd() < 0.3) return;
      const a = rnd() * 6.28;
      const x = s.x + Math.cos(a) * 1.8;
      const z = s.z + Math.sin(a) * 1.8;
      this.addPickup(i, 'stone', new THREE.Vector3(x, this.heightAt(x, z), z));
    });
    // treasure spots
    const spots = 2 + (g.state?.pet === 'puppy' ? 1 : 0);
    const cand = [];
    for (let t = 0; t < 200 && cand.length < spots; t++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * this.def.radius;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      const h = this.heightAt(x, z);
      if (h > 0.3 && h < 4 && this.slope(x, z) < 0.15 && this.isFree(x, z, 1)) cand.push(new THREE.Vector3(x, h, z));
    }
    cand.forEach((p, i) => {
      if (!ws.dug.includes(i)) this.addDigSpot(i, p);
    });
    (ws.extra || []).forEach((e, k) => {
      const i = 50 + k;
      if (!ws.dug.includes(i)) this.addDigSpot(i, new THREE.Vector3(e.x, this.heightAt(e.x, e.z), e.z));
    });
  }

  addPickup(i, id, pos) {
    const mesh = pickupMesh(id);
    mesh.position.copy(pos);
    mesh.position.y += 0.08;
    mesh.rotation.y = Math.random() * 6;
    this.dynamic.add(mesh);
    this.pickups.push({ i, id, mesh, pos: pos.clone(), bob: Math.random() * 6 });
  }
  addDigSpot(i, pos) {
    const mesh = new THREE.Group();
    const mat = toon('#8a2f2a');
    for (const a of [0.78, -0.78]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.22), mat);
      bar.rotation.y = a;
      mesh.add(bar);
    }
    mesh.position.copy(pos).setY(pos.y + 0.04);
    const n = this.terrain.normalAt(pos.x, pos.z);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    this.dynamic.add(mesh);
    const spot = { i, mesh, pos };
    this.digSpots.push(spot);
    spot.inter = this.interact({
      pos,
      r: 2.0,
      priority: 2,
      icon: '⛏️',
      enabled: () => this.digSpots.includes(spot),
      label: () => (this.game.hasItem('shovel') ? 'Dig for treasure' : 'X marks the spot (needs a Shovel)'),
      action: () => this.game.home.dig(this, spot),
    });
  }
  removeDigSpot(spot) {
    spot.mesh.parent?.remove(spot.mesh);
    this.digSpots = this.digSpots.filter((s) => s !== spot);
    this.interactables = this.interactables.filter((x) => x !== spot.inter);
  }

  /** Terrain height or dock height, whichever is higher. */
  groundAt(x, z) {
    let h = this.terrain.heightAt(x, z);
    for (const p of this.platforms) {
      const dx = x - p.x;
      const dz = z - p.z;
      const c = Math.cos(p.rot);
      const s = Math.sin(p.rot);
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      if (Math.abs(lx) <= p.hw && Math.abs(lz) <= p.hd) h = Math.max(h, p.y);
    }
    return h;
  }

  resolveCollisions(pos, radius, self = null) {
    for (const c of this.colliders) pushOut(pos, radius, c);
    for (const n of this.npcs) {
      if (n === self || !n.root.visible) continue;
      pushOut(pos, radius, { type: 'circle', x: n.pos.x, z: n.pos.z, r: n.radius });
    }
  }

  update(dt, t) {
    const g = this.game;
    const env = g.env.state;
    this.glowMat.color.setScalar(0.62 + env.glow * 0.55);
    for (const s of this.glowSprites) s.material.opacity = env.glow * 0.85;
    for (const l of this.lights) l.intensity = env.glow * 9;
    for (const n of this.npcs) n.update(dt);
    // pickups: bob + auto collect
    const p = g.player;
    for (let k = this.pickups.length - 1; k >= 0; k--) {
      const pk = this.pickups[k];
      pk.bob += dt * 2;
      pk.mesh.position.y = pk.pos.y + 0.12 + Math.sin(pk.bob) * 0.06;
      pk.mesh.rotation.y += dt * 0.8;
      if (p && g.mode === 'play' && Math.hypot(p.pos.x - pk.pos.x, p.pos.z - pk.pos.z) < 1.25 && Math.abs(p.pos.y - pk.pos.y) < 2) {
        this.pickups.splice(k, 1);
        pk.mesh.parent?.remove(pk.mesh);
        g.worldState(this.id).taken.push(pk.i);
        g.collectPickup(pk.id, pk.pos);
      }
    }
    // critters
    for (const c of this.critters) {
      c.t += dt;
      if (c.kind === 'crab') {
        const scared = p && Math.hypot(p.pos.x - c.m.position.x, p.pos.z - c.m.position.z) < 3;
        if (Math.sin(c.t * 0.7) > 0.3 || scared) {
          const sp = scared ? 3 : 0.8;
          const nx = c.m.position.x + Math.cos(c.dir) * sp * dt;
          const nz = c.m.position.z + Math.sin(c.dir) * sp * dt;
          const h = this.heightAt(nx, nz);
          if (h > 0.05 && h < 1.4 && Math.hypot(nx - c.home.x, nz - c.home.z) < 6) {
            c.m.position.set(nx, h, nz);
          } else c.dir += Math.PI * 0.7;
          c.m.rotation.y = -c.dir;
          c.m.position.y = this.heightAt(c.m.position.x, c.m.position.z) + Math.abs(Math.sin(c.t * 18)) * 0.03;
        }
        if (Math.random() < dt * 0.2) c.dir += (Math.random() - 0.5) * 2;
      } else {
        const a = c.t * c.s;
        c.m.position.set(c.cx + Math.cos(a) * c.r, c.h + Math.sin(c.t * 0.5) * 2, c.cz + Math.sin(a) * c.r);
        c.m.rotation.y = -a;
        c.m.rotation.z = 0.25;
        const wv = Math.sin(c.t * 4) * 0.4;
        c.m.userData.wings[0].rotation.z = wv;
        c.m.userData.wings[1].rotation.z = -wv;
      }
    }
    if (this.lavaLight) this.lavaLight.intensity = 30 + Math.sin(t * 2.3) * 6;
    if (this.extraUpdate) this.extraUpdate(dt, t);
  }

  minimap() {
    if (this._minimap) return this._minimap;
    const size = 220;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const pal = this.def.palette;
    const col = (hex) => new THREE.Color(hex);
    const water = col('#5fb4c8');
    const deep = col('#3f86a8');
    const sand = col(pal.sand);
    const grass = col(pal.grass);
    const rock = col(pal.rock);
    const ext = this.def.radius * 1.25;
    const tmp = new THREE.Color();
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const x = (i / size - 0.5) * 2 * ext;
        const z = (j / size - 0.5) * 2 * ext;
        const h = this.heightAt(x, z);
        if (h < 0) tmp.copy(water).lerp(deep, smoothstep(0, 4, -h));
        else if (h < 1.2) tmp.copy(sand);
        else if (h < 9) tmp.copy(grass).multiplyScalar(1 - (h - 1.2) * 0.03);
        else tmp.copy(rock);
        const k = (j * size + i) * 4;
        // convert linear -> sRGB-ish for the canvas
        img.data[k] = Math.pow(tmp.r, 1 / 2.2) * 255;
        img.data[k + 1] = Math.pow(tmp.g, 1 / 2.2) * 255;
        img.data[k + 2] = Math.pow(tmp.b, 1 / 2.2) * 255;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this._minimap = { canvas: c, ext, size };
    return this._minimap;
  }

  dispose() {
    for (const n of this.npcs) {
      n.label?.remove();
      n.char.dispose();
    }
    for (const e of this.enemies) e.dispose?.();
    this.group.traverse((o) => {
      if (o.isMesh || o.isInstancedMesh) {
        if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose?.();
      }
    });
    this.group.parent?.remove(this.group);
  }
}

function weighted(list, rnd) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [id, w] of list) {
    x -= w;
    if (x <= 0) return id;
  }
  return list[0][0];
}

const pickupGeo = {};
function pickupMesh(id) {
  const g = new THREE.Group();
  const add = (geom, color, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) => {
    const m = inked(geom, color, 0.02);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, 0, rz);
    m.castShadow = false;
    g.add(m);
  };
  const geo = (k, f) => (pickupGeo[k] ||= f());
  switch (id) {
    case 'shell':
      add(geo('shell', () => new THREE.ConeGeometry(0.22, 0.3, 7)), '#f3d3c4', 0, 0.08, 0, 1, 0.5, 1, Math.PI / 2);
      break;
    case 'starfish': {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const m = inked(geo('arm', () => new THREE.ConeGeometry(0.07, 0.3, 4)), '#f0846a', 0.015);
        m.rotation.set(Math.PI / 2, 0, -a);
        m.position.set(Math.sin(a) * 0.12, 0.05, Math.cos(a) * 0.12);
        m.rotation.order = 'ZXY';
        g.add(m);
      }
      break;
    }
    case 'driftwood':
      add(geo('drift', () => new THREE.CylinderGeometry(0.09, 0.12, 1.1, 6)), '#b8a080', 0, 0.1, 0, 1, 1, 1, 0, Math.PI / 2);
      break;
    case 'stone':
      add(G.rock, '#a3a3ab', 0, 0.12, 0, 0.25, 0.18, 0.22);
      break;
    case 'coral_piece':
      add(geo('coral', () => new THREE.CylinderGeometry(0.04, 0.06, 0.4, 5)), '#ff7f91', 0, 0.2, 0, 1, 1, 1, 0.3);
      add(geo('coral', () => new THREE.CylinderGeometry(0.04, 0.06, 0.4, 5)), '#ff7f91', 0.08, 0.18, 0, 0.8, 0.8, 0.8, -0.4);
      break;
    case 'obsidian':
      add(G.rock, '#3a2f4a', 0, 0.12, 0, 0.2, 0.25, 0.18);
      break;
    case 'doubloon':
      add(geo('coin', () => new THREE.CylinderGeometry(0.15, 0.15, 0.04, 12)), '#f2c230', 0, 0.12, 0, 1, 1, 1, Math.PI / 2 - 0.4);
      break;
    case 'bottle':
      add(geo('bottle', () => new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8)), '#7fd3a9', 0, 0.1, 0, 1, 1, 1, 0, Math.PI / 2);
      add(geo('cork', () => new THREE.CylinderGeometry(0.045, 0.045, 0.1, 6)), '#a98060', 0.25, 0.1, 0, 1, 1, 1, 0, Math.PI / 2);
      break;
    default:
      add(G.sphere, '#ffffff', 0, 0.15, 0, 0.15);
  }
  return g;
}

function pushOut(pos, radius, c) {
  if (c.type === 'circle') {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = radius + c.r;
    if (d < min && d > 1e-5) {
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
    return;
  }
  // oriented box
  const cs = Math.cos(c.rot);
  const sn = Math.sin(c.rot);
  const dx = pos.x - c.x;
  const dz = pos.z - c.z;
  let lx = dx * cs - dz * sn;
  let lz = dx * sn + dz * cs;
  const qx = clamp(lx, -c.hw, c.hw);
  const qz = clamp(lz, -c.hd, c.hd);
  let ox = lx - qx;
  let oz = lz - qz;
  const d = Math.hypot(ox, oz);
  if (d >= radius) return;
  if (d > 1e-5) {
    lx = qx + (ox / d) * radius;
    lz = qz + (oz / d) * radius;
  } else {
    // inside: push out along shallowest axis
    const px = c.hw - Math.abs(lx);
    const pz = c.hd - Math.abs(lz);
    if (px < pz) lx = Math.sign(lx || 1) * (c.hw + radius);
    else lz = Math.sign(lz || 1) * (c.hd + radius);
  }
  // back to world: inverse of (lx = dx*c - dz*s, lz = dx*s + dz*c)
  pos.x = c.x + lx * cs + lz * sn;
  pos.z = c.z - lx * sn + lz * cs;
}

// ════════════════════════════════════════════════════════════
//  Island layouts
// ════════════════════════════════════════════════════════════
const LAYOUTS = {
  palmora: {
    nature: { palms: 55, trees: 26, pines: 10, bushes: 60, rocks: 26, grass: 2200 },
    zones(w) {
      w.flatten(0, 6, 15, 2.3, 10); // plaza
      w.flatten(-38, -6, 13, 2.6, 9); // homestead
      w.flatten(25, 14, 6, 2.3, 6); // Bo
      w.path(0, 6, 0, 46, 2.0);
      w.path(0, 6, -38, -6, 1.8);
      w.path(0, 6, 25, 14, 1.6);
      w.path(8, -4, 28, -30, 1.4);
    },
    build(w, b) {
      const h = (x, z) => w.heightAt(x, z);
      const glow = w.glowPoints;
      // plaza
      w.addCollider(P.well(b, 0, h(0, 4), 4));
      w.circle(0, 4, 1.5);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const x = Math.cos(a) * 11.5;
        const z = 6 + Math.sin(a) * 11.5;
        P.lamppost(b, x, h(x, z), z, glow);
        w.circle(x, z, 0.25);
      }
      // houses around the plaza
      const mayor = P.house(b, 0, h(0, -10), -10, { w: 6.5, d: 5, h: 3.4, wall: '#f4e9d0', roof: '#4f7fa8', chimney: true, rot: 0 });
      w.addCollider(mayor.collider);
      w.occupy(0, -10, 6);
      const luna = P.house(b, -16, h(-16, 2), 2, { w: 5, d: 4.5, h: 3, wall: '#f6dbe6', roof: '#b9a3e0', rot: Math.PI / 2, awning: '#f2a2b8' });
      w.addCollider(luna.collider);
      w.occupy(-16, 2, 5);
      const nana = P.house(b, 16, h(16, 2), 2, { w: 5, d: 4.5, h: 3, wall: '#fbeccc', roof: '#d9734f', rot: -Math.PI / 2, chimney: true });
      w.addCollider(nana.collider);
      w.occupy(16, 2, 5);
      const bo = P.house(b, 28, h(28, 14), 14, { w: 5.5, d: 5, h: 3.2, wall: '#e2cfa8', roof: '#7a6a5a', rot: -Math.PI / 2, roofStyle: 'thatch' });
      w.addCollider(bo.collider);
      w.occupy(28, 14, 5);
      for (let i = 0; i < 3; i++) P.crate(b, 24 + i * 0.9, h(24, 18), 19 - i * 0.3, 0.8, i);
      P.barrel(b, 22.5, h(22.5, 9.5), 9.5);
      w.circle(24.9, 18.6, 1.4);
      // Coco's fruit stand
      w.addCollider(P.stall(b, -7, h(-7, 13), 13, 0, ['#f2a2b8', '#fbf3e2'], ['#e2434b', '#e7b53a', '#f2d23a', '#3f8f3a', '#f29a2e']).collider);
      w.occupy(-7, 13, 3);
      // bounty board
      w.addCollider(P.board(b, 8, h(8, 15), 15, -0.3).collider);
      w.interact({ pos: new THREE.Vector3(8, h(8, 15), 16), r: 2.6, icon: '📋', priority: 1, label: () => 'Read the bounty board', action: () => w.game.ui.openPanel('quests', { tab: 'bounties' }) });
      P.signpost(b, 3, h(3, 22), 22, 0.4);

      // homestead
      const hx = -38;
      const hz = -6;
      w.homestead = { x: hx, z: hz, y: 2.6 };
      P.fence(b, hx - 11, hz - 10, hx + 11, hz - 10, h);
      P.fence(b, hx - 11, hz - 10, hx - 11, hz + 11, h);
      P.fence(b, hx - 11, hz + 11, hx - 3, hz + 11, h);
      P.signpost(b, hx + 9, h(hx + 9, hz + 12), hz + 12, -0.5);

      // dock & waterfront
      const dock = w.makeDock(b, 0, 30, 0, 1);
      const s = dock.start;
      const side = new THREE.Vector3(Math.cos(dock.rot), 0, -Math.sin(dock.rot));
      const mk = s.clone().addScaledVector(side, -5.5).addScaledVector(dock.dir, -3);
      w.addCollider(P.stall(b, mk.x, h(mk.x, mk.z), mk.z, dock.rot, ['#58b4a5', '#fbf3e2'], ['#9bb7c9', '#e0604c', '#5d8fae']).collider);
      w.occupy(mk.x, mk.z, 3);
      const fk = s.clone().addScaledVector(side, 7).addScaledVector(dock.dir, -6);
      const finn = P.house(b, fk.x, h(fk.x, fk.z), fk.z, { w: 4.2, d: 3.8, h: 2.7, wall: '#d8e6e8', roof: '#3f6fa8', rot: dock.rot, roofStyle: 'thatch' });
      w.addCollider(finn.collider);
      w.occupy(fk.x, fk.z, 4.5);
      P.barrel(b, fk.x - 2.6, h(fk.x - 2.6, fk.z + 2.5), fk.z + 2.5);
      w.spots.marina = { x: mk.x - dock.dir.x * 1.4, z: mk.z - dock.dir.z * 1.4, yaw: dock.rot, wander: 0 };
      w.spots.finn = { x: fk.x + dock.dir.x * 3.2 - side.x * 1.2, z: fk.z + dock.dir.z * 3.2 - side.z * 1.2, yaw: dock.rot, wander: 1 };
      w.spots.reyes = { x: s.x + side.x * 2.6, z: s.z + side.z * 2.6, yaw: dock.rot + Math.PI / 2, wander: 0.5 };

      // lighthouse on the hill
      const lx = 31;
      const lz = -34;
      const lh = P.lighthouse(b, lx, h(lx, lz) - 0.3, lz, glow);
      w.circle(lx, lz, lh.r);

      // Moth's night camp on the west beach
      const west = w.findShore(-12, 22, -1, 0.35);
      const mx = west.x + 4;
      const mz = west.z - 1.4;
      P.campfire(b, mx, h(mx, mz), mz, glow);
      w.circle(mx, mz, 0.7);
      P.tent(b, mx + 2.5, h(mx + 2.5, mz - 2.5), mz - 2.5, 0.8, '#3a2f6b', '#ffe48a');
      w.circle(mx + 2.5, mz - 2.5, 1.6);
      w.spots.moth = { x: mx + 1.6, z: mz + 1.0, yaw: -2.2, wander: 0 };

      w.spots.mayor = { x: 0, z: -5.2, yaw: 0, wander: 1.5 };
      w.spots.luna = { x: -11.5, z: 2, yaw: Math.PI / 2, wander: 1 };
      w.spots.nana = { x: 11.5, z: 2, yaw: -Math.PI / 2, wander: 1 };
      w.spots.bo = { x: 23.5, z: 14, yaw: -Math.PI / 2, wander: 1.2 };
      w.spots.coco = { x: -7, z: 11.4, yaw: 0, wander: 0 };
      w.spots.pip = { x: 4, z: 8, yaw: 0, wander: 7 };
      w.arrival = dock.end.clone();
      w.spawn = new THREE.Vector3(0, 0, 18);
    },
  },

  coralia: {
    nature: { palms: 60, trees: 10, pines: 0, bushes: 35, rocks: 18, grass: 1300, fruitTrees: [['coconut', '#6b4a2e'], ['banana', '#f2d23a']], fruitPer: 3 },
    zones(w) {
      w.flatten(0, 2, 11, 1.9, 8);
      w.flatten(20, -6, 5, 1.9, 6);
      w.path(0, 2, 0, 40, 1.8);
      w.path(0, 2, 20, -6, 1.5);
    },
    build(w, b) {
      const h = (x, z) => w.heightAt(x, z);
      const glow = w.glowPoints;
      const r = w.rnd;
      // stilt huts
      const huts = [[-10, -5, 0.7, '#7fd3c9'], [10, -6, -0.6, '#f2a2b8'], [-12, 9, 1.8, '#f7c95c']];
      for (const [x, z, rot, roof] of huts) {
        const hh = P.house(b, x, h(x, z), z, { w: 4, d: 3.6, h: 2.6, wall: '#f6ecd6', roof, rot, roofStyle: 'thatch', stilts: 0.8 });
        w.addCollider(hh.collider);
        w.occupy(x, z, 4.5);
      }
      const shelly = P.house(b, 20, h(20, -6), -6, { w: 4.4, d: 4, h: 2.8, wall: '#e0f6f2', roof: '#ff7f91', rot: -1.2, roofStyle: 'thatch', awning: '#58b4a5' });
      w.addCollider(shelly.collider);
      w.spots.shelly = { x: 16.5, z: -4.6, yaw: -1.2, wander: 1 };
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        P.torch(b, Math.cos(a) * 8, h(Math.cos(a) * 8, 2 + Math.sin(a) * 8), 2 + Math.sin(a) * 8, glow);
        w.circle(Math.cos(a) * 8, 2 + Math.sin(a) * 8, 0.25);
      }
      P.campfire(b, 0, h(0, 2), 2, glow);
      w.circle(0, 2, 0.8);
      // tournament pier
      const dock = w.makeDock(b, 0, 20, 0, 1, { boatSide: -1 });
      const side = new THREE.Vector3(Math.cos(dock.rot), 0, -Math.sin(dock.rot));
      for (let i = 0; i < 4; i++) {
        const p = dock.start.clone().addScaledVector(dock.dir, 3 + i * 3.5);
        P.flag(b, p.x + side.x * 1.4, dock.y - 0.05, p.z + side.z * 1.4, ['#d9534f', '#f7c95c', '#58b4a5', '#9150c9'][i], 3);
      }
      const ms = dock.start.clone().addScaledVector(side, -3).addScaledVector(dock.dir, -1.5);
      w.spots.mo = { x: ms.x, z: ms.z, yaw: dock.rot + Math.PI, wander: 0.4 };
      w.competitionSpots = [];
      for (let i = 0; i < 3; i++) {
        const p = dock.end.clone().addScaledVector(side, (i - 1) * 2.2).addScaledVector(dock.dir, 0.9);
        w.competitionSpots.push({ x: p.x, z: p.z, yaw: dock.rot });
      }
      const west = w.findShore(-6, 0, -1, 0.2);
      w.spots.kai = { x: west.x + 4, z: west.z, yaw: -Math.PI / 2, wander: 3 };
      // coral in shallows
      for (let i = 0, n = 0; i < 1500 && n < 120; i++) {
        const a = r() * Math.PI * 2;
        const d = w.def.radius * (0.5 + r() * 0.7);
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const hh = h(x, z);
        if (hh < -0.5 && hh > -2.6) {
          P.coral(b, x, hh, z, r);
          n++;
        }
      }
      w.arrival = dock.end.clone();
      w.spawn = new THREE.Vector3(0, 0, 10);
    },
  },

  ember: {
    nature: { palms: 22, trees: 18, pines: 30, bushes: 30, rocks: 55, grass: 1000, rockColor: '#5e5860', leaf: '#5a7a4a', pineLeaf: '#3f6a4a', fruitTrees: [['mango', '#f29a2e']], fruitPer: 3, palmPal: { trunk: '#6b5a50', leaf: '#5f8a5a' } },
    zones(w) {
      w.flatten(0, 32, 12, 3.0, 10);
      w.flatten(22, 40, 6, 2.6, 5);
      w.path(0, 32, 0, 60, 1.8);
      w.path(0, 32, 22, 40, 1.5);
      w.path(0, 30, 0, 10, 1.4);
    },
    build(w, b) {
      const h = (x, z) => w.heightAt(x, z);
      const glow = w.glowPoints;
      const forge = P.house(b, -9, h(-9, 27), 27, { w: 6, d: 5, h: 3.2, wall: '#5a4a48', roof: '#2a2534', trim: '#3a2a28', rot: 0.4, chimney: true, door: '#3a2a28' });
      w.addCollider(forge.collider);
      w.occupy(-9, 27, 6);
      P.campfire(b, -4.5, h(-4.5, 29.5), 29.5, glow); // anvil fire
      w.circle(-4.5, 29.5, 0.7);
      P.barrel(b, -12.5, h(-12.5, 31), 31);
      w.spots.ash = { x: -5.5, z: 31.5, yaw: 0.4, wander: 0.8 };
      const sage = P.house(b, 10, h(10, 26), 26, { w: 4.5, d: 4.2, h: 2.8, wall: '#e6d8f0', roof: '#7d5ba6', rot: -0.5, roofStyle: 'thatch' });
      w.addCollider(sage.collider);
      w.occupy(10, 26, 5);
      w.spots.sage = { x: 7.5, z: 29.5, yaw: -0.5, wander: 1 };
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 9;
        const z = 32 + Math.sin(a) * 9;
        P.torch(b, x, h(x, z), z, glow);
        w.circle(x, z, 0.25);
      }
      // hot spring (heals)
      P.hotSpring(b, 22, h(22, 40), 40);
      w.interact({ pos: new THREE.Vector3(22, h(22, 40), 40), r: 3.6, icon: '♨️', priority: 1, label: () => 'Soak in the hot spring (heal)', action: () => w.game.combat.healFull('The hot spring soothes your wounds.') });
      // lava in the crater
      const peak = w.def.peaks[0];
      const cy = h(peak.x, peak.z);
      const lava = new THREE.Mesh(new THREE.CircleGeometry(6.5, 24), new THREE.MeshBasicMaterial({ color: '#ff6a2a' }));
      lava.rotation.x = -Math.PI / 2;
      lava.position.set(peak.x, cy + 0.6, peak.z);
      w.group.add(lava);
      const lavaGlow = P.glowSprite(new THREE.Vector3(peak.x, cy + 3, peak.z), '#ff7a3a', 26);
      lavaGlow.material.opacity = 0.7;
      w.group.add(lavaGlow);
      w.lavaLight = new THREE.PointLight('#ff6a2a', 30, 40, 1.5);
      w.lavaLight.position.set(peak.x, cy + 4, peak.z);
      w.group.add(w.lavaLight);
      // smoke puffs
      const smoke = [];
      const smokeMat = toon('#9a8f96');
      for (let i = 0; i < 8; i++) {
        const m = inked(new THREE.IcosahedronGeometry(1, 1), smokeMat, 0.05);
        m.castShadow = false;
        w.group.add(m);
        smoke.push({ m, t: i / 8 });
      }
      w.extraUpdate = (dt) => {
        for (const s of smoke) {
          s.t = (s.t + dt * 0.04) % 1;
          const sc = 2 + s.t * 7;
          s.m.scale.setScalar(sc);
          s.m.position.set(peak.x + s.t * 18, cy + 4 + s.t * 40, peak.z - s.t * 6);
        }
      };
      const dock = w.makeDock(b, 0, 44, 0, 1);
      w.arrival = dock.end.clone();
      w.spawn = new THREE.Vector3(0, 0, 38);
    },
  },

  skull: {
    nature: { palms: 30, trees: 12, pines: 8, bushes: 25, rocks: 40, grass: 900, rockColor: '#7a7470', fruitTrees: [['coconut', '#6b4a2e']], fruitPer: 3 },
    zones(w) {
      w.flatten(0, 0, 13, 2.4, 9);
      w.flatten(4, 26, 6, 2.0, 6);
      w.path(0, 0, 4, 40, 1.8);
    },
    build(w, b) {
      const h = (x, z) => w.heightAt(x, z);
      const glow = w.glowPoints;
      const sr = P.skullRock(b, -12, h(-12, -14) - 0.5, -14, 1.1);
      w.addCollider(sr.collider);
      w.occupy(-12, -14, 7);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        const x = Math.cos(a) * 9;
        const z = Math.sin(a) * 9;
        const t = P.tent(b, x, h(x, z), z, -a + Math.PI / 2, i % 2 ? '#5a4a40' : '#7a3a3a', '#2a2534');
        w.addCollider(t.collider);
        w.occupy(x, z, 2.5);
      }
      P.campfire(b, 0, h(0, 0), 0, glow);
      w.circle(0, 0, 0.8);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        P.torch(b, Math.cos(a) * 13, h(Math.cos(a) * 13, Math.sin(a) * 13), Math.sin(a) * 13, glow);
      }
      for (let i = 0; i < 4; i++) P.barrel(b, -3 + i * 0.9, h(-3, 5), 5 + (i % 2) * 0.6);
      w.circle(-1.6, 5.3, 1.8);
      P.flag(b, 3, h(3, -4), -4, '#2a2534', 6);
      const east = w.findShore(10, 6, 1, 0.3);
      const wr = P.shipwreck(b, east.x + 1, h(east.x + 1, east.z) - 0.6, east.z, 0.4);
      w.addCollider(wr.collider);
      w.occupy(east.x, east.z, 7);
      w.addCollider(P.stall(b, 4, h(4, 26), 26, Math.PI, ['#2a2534', '#d9534f'], ['#f2c230', '#f2c230']).collider);
      w.spots.patch = { x: 4, z: 27.6, yaw: 0, wander: 0.6 };
      w.pirateSpots = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const d = i < 4 ? 6 : 20 + (i % 3) * 6;
        w.pirateSpots.push({ x: Math.cos(a) * d, z: Math.sin(a) * d });
      }
      w.bossSpot = { x: 0, z: -4 };
      const dock = w.makeDock(b, 4, 30, 0, 1);
      w.arrival = dock.end.clone();
      w.spawn = new THREE.Vector3(4, 0, 30);
    },
  },
};
