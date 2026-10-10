import * as THREE from 'three';
import { inked, toon } from './toon.js';
import { ITEMS } from '../shared/items.js';
import { clamp, lerp } from '../shared/utils.js';
import { fishMesh } from '../fishing/models.js';

const FRUIT_LOOKS = {
  mango: { color: '#f29a2e', sx: 1, sy: 1.25, sz: 1 },
  banana: { color: '#f2d23a', sx: 0.55, sy: 1.6, sz: 0.55 },
  coconut: { color: '#6b4a2e', sx: 1, sy: 1, sz: 1 },
  strawberry: { color: '#e2434b', sx: 0.8, sy: 1, sz: 0.8 },
  pineapple: { color: '#e7b53a', sx: 0.9, sy: 1.35, sz: 0.9, crown: true },
  watermelon: { color: '#3f8f3a', sx: 1.3, sy: 1, sz: 1.1 },
  sugarcane: { color: '#a8c46a', sx: 0.35, sy: 2, sz: 0.35 },
  dragonfruit: { color: '#e0457f', sx: 0.9, sy: 1.2, sz: 0.9, crown: true },
};

/** A small 3D model (fruit, fish) or a floating emoji sprite for any item. */
export function itemMesh(id, fish = null) {
  if (fish) return fishMesh(fish);
  const f = FRUIT_LOOKS[id];
  if (f) {
    const g = new THREE.Group();
    const m = inked(new THREE.SphereGeometry(0.18, 12, 9), f.color, 0.015);
    m.scale.set(f.sx, f.sy, f.sz);
    m.castShadow = false;
    g.add(m);
    if (f.crown) {
      const c = inked(new THREE.ConeGeometry(0.1, 0.22, 5), '#5f9a5c', 0.012);
      c.position.y = 0.18 * f.sy + 0.06;
      g.add(c);
    }
    if (id === 'strawberry') {
      const c = inked(new THREE.ConeGeometry(0.1, 0.06, 6), '#5f9a5c', 0.01);
      c.position.y = 0.18;
      g.add(c);
    }
    return g;
  }
  return emojiSprite(ITEMS[id]?.icon || '✨');
}

const spriteCache = new Map();
export function emojiSprite(emoji, size = 0.7) {
  let mat = spriteCache.get(emoji);
  if (!mat) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = '96px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 72);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    spriteCache.set(emoji, mat);
  }
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size);
  return s;
}

/** Treasure chest that rises from the sand and pops open. */
export function chestMesh() {
  const g = new THREE.Group();
  const base = inked(new THREE.BoxGeometry(0.7, 0.4, 0.45), '#8a5a32', 0.02);
  base.position.y = 0.2;
  g.add(base);
  const band = inked(new THREE.BoxGeometry(0.72, 0.08, 0.47), '#e8b520', 0);
  band.position.y = 0.32;
  g.add(band);
  const lid = new THREE.Group();
  lid.position.set(0, 0.4, -0.22);
  const top = inked(new THREE.CylinderGeometry(0.225, 0.225, 0.7, 10, 1, false, 0, Math.PI), '#9a6a3a', 0.02);
  top.rotation.z = Math.PI / 2;
  top.position.z = 0.22;
  lid.add(top);
  g.add(lid);
  const gold = inked(new THREE.SphereGeometry(0.2, 8, 6), '#f7d24a', 0);
  gold.scale.set(1.4, 0.5, 0.9);
  gold.position.y = 0.4;
  g.add(gold);
  g.userData.lid = lid;
  return g;
}

/**
 * Little animations for collecting things: items arc into the player's hands,
 * fruit drops from trees, catches are held up proudly.
 */
export class FX {
  constructor(game) {
    this.game = game;
    this.items = [];
    this._v = new THREE.Vector3();
  }
  hand() {
    const p = this.game.player;
    const v = new THREE.Vector3();
    if (p.char.rightHand) p.char.rightHand.getWorldPosition(v);
    else v.copy(p.pos).setY(p.pos.y + 1);
    return v;
  }
  overHead() {
    const p = this.game.player;
    return this._v.set(p.pos.x, p.pos.y + 2.35 * p.root.scale.y, p.pos.z);
  }
  /** Turn a flat card toward the camera (around Y), with a little wiggle. */
  faceCamera(o, wiggle = 0) {
    const c = this.game.camera.position;
    o.rotation.set(0, Math.atan2(c.x - o.position.x, c.z - o.position.z), wiggle, 'YXZ');
  }
  add(obj) {
    this.game.scene.add(obj);
  }

  /** Arc an object from `from` into the player's hand. */
  collect(obj, from, { delay = 0, dur = 0.5, hold = 0, onDone, pickup = true } = {}) {
    this.add(obj);
    obj.position.copy(from);
    const s0 = obj.scale.clone();
    this.items.push({ kind: 'collect', obj, from: from.clone(), t: -delay, dur, hold, onDone, s0, pickup, started: false });
  }

  /** Fruit falls from a tree canopy, bounces, then flies to the player. */
  drop(obj, from, groundY, { delay = 0, onDone } = {}) {
    this.add(obj);
    obj.position.copy(from);
    this.items.push({
      kind: 'drop', obj, t: -delay, vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 1.5 + Math.random(), (Math.random() - 0.5) * 2.5), groundY, bounces: 0, rest: 0, onDone,
    });
  }

  /** Hold something above the player's head (catches, treasure). */
  holdUp(obj, dur = 1.6, from = null) {
    this.add(obj);
    const it = { kind: 'hold', obj, t: 0, dur, from: from?.clone() ?? null, s0: obj.scale.clone() };
    this.items.push(it);
    this.game.player.char.play('holdup', dur + (from ? 0.5 : 0));
    return it;
  }

  /** Treasure chest rises from the ground and opens, then calls back. */
  chest(pos, onOpen) {
    const c = chestMesh();
    c.position.copy(pos).setY(pos.y - 0.6);
    this.add(c);
    this.items.push({ kind: 'chest', obj: c, base: pos.clone(), t: 0, onOpen, opened: false });
  }

  update(dt) {
    const g = this.game;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const o = it.obj;
      let done = false;
      if (it.kind === 'collect') {
        if (it.t < 0) continue;
        if (!it.started) {
          it.started = true;
          if (it.pickup) g.player.char.play('pickup', it.dur + 0.15);
        }
        const k = clamp(it.t / it.dur, 0, 1);
        const e = k * k * (3 - 2 * k);
        const to = this.hand();
        o.position.set(lerp(it.from.x, to.x, e), lerp(it.from.y, to.y, e) + Math.sin(k * Math.PI) * 0.9, lerp(it.from.z, to.z, e));
        o.rotation.y += dt * 8;
        o.scale.copy(it.s0).multiplyScalar(1 + Math.sin(k * Math.PI) * 0.35 - k * 0.5);
        if (k >= 1) {
          g.particles.burst(to, { count: 8, color: '#fff6c0', speed: 1.5, up: 2, life: 0.5 });
          done = true;
        }
      } else if (it.kind === 'drop') {
        if (it.t < 0) continue;
        if (it.rest > 0) {
          it.rest -= dt;
          if (it.rest <= 0) {
            // fly into the player's hands
            this.items.splice(i, 1);
            this.collect(o, o.position.clone(), { dur: 0.45, onDone: it.onDone });
            continue;
          }
        } else {
          it.vel.y -= 14 * dt;
          o.position.addScaledVector(it.vel, dt);
          o.rotation.x += dt * 6;
          if (o.position.y <= it.groundY + 0.15) {
            o.position.y = it.groundY + 0.15;
            if (it.bounces < 1) {
              it.vel.y = -it.vel.y * 0.4;
              it.vel.x *= 0.5;
              it.vel.z *= 0.5;
              it.bounces++;
              g.particles.burst(o.position, { count: 4, color: '#d9c08f', speed: 1, up: 1, life: 0.3 });
            } else {
              it.vel.set(0, 0, 0);
              it.rest = 0.35;
            }
          }
        }
      } else if (it.kind === 'hold') {
        const head = this.overHead();
        const fly = it.from ? 0.5 : 0;
        if (it.t < fly) {
          const k = it.t / fly;
          o.position.set(lerp(it.from.x, head.x, k), lerp(it.from.y, head.y, k) + Math.sin(k * Math.PI) * 2.2, lerp(it.from.z, head.z, k));
          if (o.userData.billboard) this.faceCamera(o, Math.sin(k * Math.PI * 2) * 0.6);
          else o.rotation.z += dt * 10;
        } else {
          const tt = it.t - fly;
          o.position.set(head.x, head.y + Math.sin(tt * 6) * 0.04, head.z);
          if (o.userData.billboard) this.faceCamera(o, Math.sin(tt * 9) * 0.22);
          else o.rotation.set(0, g.player.yaw + Math.PI / 2, Math.sin(tt * 9) * 0.25);
          if (tt > it.dur) {
            g.particles.burst(head, { count: 14, color: '#fff6c0', speed: 2, up: 2.5, life: 0.6 });
            done = true;
          }
        }
      } else if (it.kind === 'chest') {
        const rise = clamp(it.t / 0.6, 0, 1);
        o.position.y = it.base.y - 0.6 + rise * 0.6;
        if (it.t > 0.7) {
          const lid = o.userData.lid;
          lid.rotation.x = -clamp((it.t - 0.7) / 0.3, 0, 1) * 1.9;
          if (!it.opened && it.t > 0.85) {
            it.opened = true;
            g.particles.burst(it.base.clone().setY(it.base.y + 0.5), { count: 40, color: '#f7d24a', speed: 3, up: 5, life: 1 });
            it.onOpen?.();
          }
        }
        if (it.t > 2.6) {
          o.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
          if (it.t > 3) done = true;
        }
      }
      if (done) {
        o.parent?.remove(o);
        this.items.splice(i, 1);
        it.onDone?.();
      }
    }
  }
}

export { toon };
