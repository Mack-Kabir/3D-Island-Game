import * as THREE from 'three';
import { Character } from './character.js';
import { dampAngle, rand, pick, wrapAngle } from '../core/utils.js';
import { inked, toon } from '../world/toon.js';

export class NPC {
  constructor(game, def, spot, world = game.world) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.char = new Character(def.look, { scale: def.scale ?? 1 });
    this.root = this.char.root;
    this.home = new THREE.Vector3(spot.x, 0, spot.z);
    this.homeYaw = spot.yaw ?? 0;
    this.root.position.set(spot.x, world.groundAt(spot.x, spot.z), spot.z);
    this.yaw = this.homeYaw;
    this.root.rotation.y = this.yaw;
    this.wanderR = spot.wander ?? def.wander ?? 1.8;
    this.target = null;
    this.wait = rand(1, 5);
    this.talking = false;
    this.radius = 0.45;
    this.pose = spot.pose ?? null;
  }
  get pos() {
    return this.root.position;
  }
  available() {
    const night = this.game.time.isNight();
    const s = this.def.schedule;
    if (s === 'night') return night;
    if (s === 'day') return !night;
    return true;
  }
  update(dt) {
    const vis = this.available();
    this.root.visible = vis;
    if (!vis) return;
    const g = this.game;
    const w = g.world;
    let speed = 0;
    const player = g.player;
    const toP = player ? Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) : 99;
    if (this.talking || (toP < 3.2 && !this.pose)) {
      const want = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
      this.yaw = dampAngle(this.yaw, want, 6, dt);
      this.target = null;
    } else if (this.pose) {
      this.yaw = dampAngle(this.yaw, this.homeYaw, 4, dt);
    } else if (this.target) {
      const dx = this.target.x - this.pos.x;
      const dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.2) {
        this.target = null;
        this.wait = rand(2, 7);
      } else {
        speed = 1.3;
        this.pos.x += (dx / d) * speed * dt;
        this.pos.z += (dz / d) * speed * dt;
        this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 6, dt);
      }
    } else {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (this.wanderR > 0.1) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * this.wanderR;
          this.target = new THREE.Vector3(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
        } else this.wait = 5;
      }
      if (this.wanderR <= 0.1) this.yaw = dampAngle(this.yaw, this.homeYaw, 3, dt);
    }
    this.pos.y = w.groundAt(this.pos.x, this.pos.z);
    this.root.rotation.y = this.yaw;
    this.char.update(dt, { speed, grounded: true, pose: this.talking ? null : this.pose });
  }
}

const PIRATE_LOOKS = [
  { gender: 'm', skin: 2, hair: 'short', hairColor: 0, top: 'pirate_vest', bottom: 'pirate_pants', hat: 'bandana_blue', acc: null, shoes: '#2a2534' },
  { gender: 'm', skin: 4, hair: 'buzz', hairColor: 0, top: 'sailor', bottom: 'pirate_pants', hat: 'pirate_hat', acc: 'eyepatch', shoes: '#2a2534' },
  { gender: 'f', skin: 1, hair: 'ponytail', hairColor: 5, top: 'pirate_vest', bottom: 'pirate_pants', hat: 'bandana_blue', acc: null, shoes: '#2a2534' },
  { gender: 'm', skin: 3, hair: 'curly', hairColor: 1, top: 'plaid_flannel', bottom: 'pirate_pants', hat: 'pirate_hat', acc: null, shoes: '#2a2534' },
  { gender: 'f', skin: 5, hair: 'bun', hairColor: 0, top: 'sailor', bottom: 'pirate_pants', hat: 'pirate_hat', acc: 'eyepatch', shoes: '#2a2534' },
];

export class Pirate {
  constructor(game, x, z, opts = {}) {
    this.game = game;
    this.boss = !!opts.boss;
    this.kind = this.boss ? 'blackfin' : 'pirate';
    const look = this.boss
      ? { gender: 'm', skin: 2, hair: 'long', hairColor: 0, top: 'captain_coat', bottom: 'pirate_pants', hat: 'blackfin_hat', acc: 'eyepatch', shoes: '#1d1a24' }
      : pick(PIRATE_LOOKS);
    this.char = new Character(look, { scale: this.boss ? 1.4 : 1 });
    this.char.hold('weapon', this.boss ? 'ember_blade' : 'cutlass');
    this.root = this.char.root;
    this.home = new THREE.Vector3(x, 0, z);
    this.root.position.set(x, game.world.groundAt(x, z), z);
    this.yaw = Math.random() * 6;
    const lvl = opts.level ?? 1;
    this.maxHp = this.boss ? 650 : Math.round(55 + lvl * 6);
    this.hp = this.maxHp;
    this.dmg = this.boss ? 17 : 6 + Math.round(lvl * 0.5);
    this.speed = this.boss ? 3.9 : 3.3;
    this.state = 'idle';
    this.t = 0;
    this.wait = rand(1, 3);
    this.target = null;
    this.knock = new THREE.Vector3();
    this.radius = this.boss ? 0.7 : 0.45;
    this.dead = false;
    this.deadT = 0;
    this.chargeCd = 5;
    this.raid = !!opts.raid;
    this.aggro = this.raid ? 40 : this.boss ? 16 : 13;
    this.label = game.ui.addLabel(this.root, {
      offsetY: this.boss ? 3.1 : 2.3,
      cls: 'hp-label',
      html: this.boss ? '<b>Captain Blackfin</b><span class="hpbar"><i></i></span>' : '<span class="hpbar"><i></i></span>',
      maxDist: 26,
      alwaysVisible: this.boss,
    });
    this.updateBar();
  }
  get pos() {
    return this.root.position;
  }
  updateBar() {
    const i = this.label?.el.querySelector('i');
    if (i) i.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
    if (this.label) this.label.el.classList.toggle('hurt', this.hp < this.maxHp);
  }
  takeHit(dmg, from) {
    if (this.dead) return;
    this.hp -= dmg;
    this.char.hit();
    const dir = new THREE.Vector3(this.pos.x - from.x, 0, this.pos.z - from.z).normalize();
    this.knock.copy(dir).multiplyScalar(this.boss ? 3 : 8);
    this.updateBar();
    if (this.state !== 'charge') {
      this.state = 'hurt';
      this.t = 0;
    }
    if (this.hp <= 0) this.die();
  }
  die() {
    this.dead = true;
    this.state = 'dead';
    this.label?.remove();
    this.label = null;
    this.game.combat.onEnemyDefeated(this);
  }
  update(dt) {
    const g = this.game;
    const w = g.world;
    const ch = this.char;
    if (this.dead) {
      this.deadT += dt;
      this.root.rotation.x = Math.min(this.deadT * 4, Math.PI / 2) * -1;
      this.root.position.y -= dt * (this.deadT > 0.8 ? 1.2 : 0);
      ch.update(dt, { speed: 0 });
      return this.deadT < 2.2;
    }
    const p = g.player;
    const dx = p.pos.x - this.pos.x;
    const dz = p.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const faceP = Math.atan2(dx, dz);
    let speed = 0;
    this.t += dt;
    const playerAlive = g.combat.playerAlive() && g.canBeAttacked();
    if (this.boss) this.chargeCd -= dt;

    switch (this.state) {
      case 'idle': {
        if (playerAlive && dist < this.aggro) {
          this.state = 'chase';
          g.combat.onAggro(this);
          break;
        }
        if (this.target) {
          const tx = this.target.x - this.pos.x;
          const tz = this.target.z - this.pos.z;
          const d = Math.hypot(tx, tz);
          if (d < 0.3) this.target = null;
          else {
            speed = 1.5;
            this.move(tx / d, tz / d, speed, dt);
            this.yaw = dampAngle(this.yaw, Math.atan2(tx, tz), 5, dt);
          }
        } else {
          this.wait -= dt;
          if (this.wait < 0) {
            this.wait = rand(2, 5);
            const a = Math.random() * 6.28;
            this.target = new THREE.Vector3(this.home.x + Math.cos(a) * 5, 0, this.home.z + Math.sin(a) * 5);
          }
        }
        break;
      }
      case 'chase': {
        if (!playerAlive || dist > this.aggro * 1.8) {
          this.state = 'idle';
          this.target = this.home.clone();
          break;
        }
        this.yaw = dampAngle(this.yaw, faceP, 10, dt);
        if (this.boss && this.chargeCd <= 0 && dist > 4 && dist < 14) {
          this.state = 'chargeWind';
          this.t = 0;
          g.ui.floatText(this.pos.clone().setY(this.pos.y + 3.6), 'CHARGE!', 'warn');
          break;
        }
        if (dist < (this.boss ? 2.6 : 1.9)) {
          this.state = 'windup';
          this.t = 0;
          this.windDur = this.boss ? 0.6 : rand(0.45, 0.65);
          this.label?.el.classList.add('warn');
        } else {
          speed = this.speed;
          this.move(dx / dist, dz / dist, speed, dt);
        }
        break;
      }
      case 'windup': {
        this.yaw = dampAngle(this.yaw, faceP, 8, dt);
        ch.arms[1].shoulder.rotation.x = -2.2 * Math.min(this.t / this.windDur, 1);
        if (this.t >= this.windDur) {
          ch.play('swing', 0.4);
          g.audio.sfx('swing');
          this.label?.el.classList.remove('warn');
          const ang = Math.abs(wrapAngle(faceP - this.yaw));
          if (dist < (this.boss ? 3.2 : 2.5) && ang < 1.2) g.combat.damagePlayer(this.dmg, this.pos);
          this.state = 'cool';
          this.t = 0;
        }
        break;
      }
      case 'cool': {
        this.yaw = dampAngle(this.yaw, faceP, 4, dt);
        if (this.t > (this.boss ? 0.8 : rand(0.9, 1.4))) this.state = 'chase';
        break;
      }
      case 'hurt': {
        this.knock.multiplyScalar(Math.exp(-8 * dt));
        this.move(this.knock.x, this.knock.z, 1, dt);
        if (this.t > 0.35) this.state = 'chase';
        break;
      }
      case 'chargeWind': {
        this.yaw = dampAngle(this.yaw, faceP, 10, dt);
        this.char.body.rotation.x = 0.4;
        if (this.t > 0.8) {
          this.state = 'charge';
          this.t = 0;
          this.chargeDir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
          this.hitDuringCharge = false;
        }
        break;
      }
      case 'charge': {
        speed = 15;
        this.move(this.chargeDir.x, this.chargeDir.z, speed, dt);
        g.particles.burst(this.pos, { count: 1, color: '#e8dcc0', speed: 1, up: 1, life: 0.4 });
        if (!this.hitDuringCharge && dist < 1.8) {
          this.hitDuringCharge = true;
          g.combat.damagePlayer(this.dmg + 8, this.pos);
        }
        if (this.t > 0.55) {
          this.state = 'cool';
          this.t = 0;
          this.chargeCd = rand(5, 8);
          this.char.body.rotation.x = 0;
        }
        break;
      }
    }
    this.pos.y = w.groundAt(this.pos.x, this.pos.z);
    this.root.rotation.y = this.yaw;
    ch.update(dt, { speed, grounded: true });
    return true;
  }
  move(dx, dz, speed, dt) {
    const w = this.game.world;
    const nx = this.pos.x + dx * speed * dt;
    const nz = this.pos.z + dz * speed * dt;
    if (w.groundAt(nx, nz) > -0.8) {
      this.pos.x = nx;
      this.pos.z = nz;
    }
    w.resolveCollisions(this.pos, this.radius, this);
  }
  dispose() {
    this.label?.remove();
    this.char.dispose();
  }
}

/** Companion pets that follow the player. */
export class Pet {
  constructor(game, id) {
    this.game = game;
    this.id = id;
    this.root = new THREE.Group();
    this.model = buildPetModel(id);
    this.root.add(this.model);
    this.vel = new THREE.Vector3();
    this.phase = 0;
    this.flying = id === 'parrot';
    const p = game.player.pos;
    this.root.position.set(p.x + 1, p.y, p.z - 1);
  }
  update(dt) {
    const g = this.game;
    const p = g.player;
    const back = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const side = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const target = p.pos.clone().addScaledVector(back, 1.4).addScaledVector(side, 0.9);
    const pos = this.root.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 25) pos.set(target.x, pos.y, target.z);
    let speed = 0;
    if (d > 0.4) {
      speed = Math.min(d * 2.5, 9);
      pos.x += (dx / d) * speed * dt;
      pos.z += (dz / d) * speed * dt;
      this.root.rotation.y = dampAngle(this.root.rotation.y, Math.atan2(dx, dz), 8, dt);
    } else {
      this.root.rotation.y = dampAngle(this.root.rotation.y, p.yaw, 3, dt);
    }
    this.phase += dt * (speed > 0.5 ? 12 : 2);
    const ground = Math.max(g.world.groundAt(pos.x, pos.z), -0.1);
    if (this.flying) {
      pos.y = p.pos.y + 1.9 + Math.sin(this.phase * 0.5) * 0.15;
      const wings = this.model.userData.wings;
      if (wings) wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(this.phase * 2.5) * 0.6)));
    } else {
      pos.y = ground + (speed > 0.5 ? Math.abs(Math.sin(this.phase)) * 0.18 : 0);
    }
    const tail = this.model.userData.tail;
    if (tail) tail.rotation.z = Math.sin(this.phase * 0.8) * 0.5;
  }
  dispose() {
    this.root.parent?.remove(this.root);
  }
}

function buildPetModel(id) {
  const g = new THREE.Group();
  const O = 0.018;
  if (id === 'kitten' || id === 'puppy') {
    const fur = id === 'kitten' ? '#f0a35a' : '#b98a5a';
    const body = inked(new THREE.CapsuleGeometry(0.17, 0.3, 3, 8), fur, O);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.32;
    g.add(body);
    const head = inked(new THREE.SphereGeometry(0.19, 10, 8), fur, O);
    head.position.set(0, 0.52, 0.27);
    g.add(head);
    for (const sx of [-1, 1]) {
      const ear = id === 'kitten' ? inked(new THREE.ConeGeometry(0.07, 0.14, 4), fur, O) : inked(new THREE.SphereGeometry(0.08, 6, 5), '#7a5a3a', O);
      ear.position.set(sx * 0.11, id === 'kitten' ? 0.7 : 0.52, 0.25);
      if (id === 'puppy') ear.scale.set(0.6, 1.4, 0.8);
      g.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.075, 0.56, 0.44);
      g.add(eye);
      for (const fz of [0.15, -0.15]) {
        const leg = inked(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), fur, O);
        leg.position.set(sx * 0.09, 0.1, fz);
        g.add(leg);
      }
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
    nose.position.set(0, 0.5, 0.46);
    g.add(nose);
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.4, -0.3);
    const tail = inked(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 6), fur, O);
    tail.position.y = 0.15;
    tail.rotation.x = -0.4;
    tailPivot.add(tail);
    g.add(tailPivot);
    g.userData.tail = tailPivot;
  } else if (id === 'parrot') {
    const body = inked(new THREE.SphereGeometry(0.17, 10, 8), '#d9443a', O);
    body.scale.set(1, 1.25, 1);
    g.add(body);
    const head = inked(new THREE.SphereGeometry(0.12, 8, 6), '#d9443a', O);
    head.position.set(0, 0.22, 0.05);
    g.add(head);
    const beak = inked(new THREE.ConeGeometry(0.04, 0.12, 4), '#f2c230', O);
    beak.rotation.x = Math.PI / 2 + 0.4;
    beak.position.set(0, 0.2, 0.17);
    g.add(beak);
    const wings = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.14, 0.05, 0);
      const wing = inked(new THREE.BoxGeometry(0.3, 0.04, 0.2), '#3fa0d9', O);
      wing.position.x = sx * 0.15;
      pivot.add(wing);
      g.add(pivot);
      wings.push(pivot);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.07, 0.25, 0.12);
      g.add(eye);
    }
    const tail = inked(new THREE.BoxGeometry(0.1, 0.03, 0.3), '#3f9e4d', O);
    tail.position.set(0, -0.12, -0.2);
    tail.rotation.x = 0.5;
    g.add(tail);
    g.userData.wings = wings;
  } else if (id === 'turtle') {
    const shell = inked(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#4f8a4a', O);
    shell.scale.set(1, 0.7, 1.15);
    shell.position.y = 0.12;
    g.add(shell);
    const under = inked(new THREE.CylinderGeometry(0.3, 0.28, 0.06, 10), '#d9c48f', O);
    under.scale.z = 1.15;
    under.position.y = 0.12;
    g.add(under);
    const head = inked(new THREE.SphereGeometry(0.1, 8, 6), '#8fbf7a', O);
    head.position.set(0, 0.2, 0.4);
    g.add(head);
    for (const sx of [-1, 1]) {
      for (const fz of [0.22, -0.22]) {
        const leg = inked(new THREE.SphereGeometry(0.07, 6, 4), '#8fbf7a', O);
        leg.position.set(sx * 0.25, 0.08, fz);
        leg.scale.set(1.3, 0.6, 1);
        g.add(leg);
      }
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.05, 0.24, 0.48);
      g.add(eye);
    }
  }
  return g;
}

/** Simple animal model used for ambient wildlife (crabs, seagulls). */
export function crabModel() {
  const g = new THREE.Group();
  const body = inked(new THREE.SphereGeometry(0.18, 8, 6), '#e0604c', 0.015);
  body.scale.set(1.3, 0.6, 1);
  body.position.y = 0.12;
  g.add(body);
  for (const sx of [-1, 1]) {
    const claw = inked(new THREE.SphereGeometry(0.07, 6, 4), '#e0604c', 0.012);
    claw.position.set(sx * 0.22, 0.14, 0.15);
    g.add(claw);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
    eye.position.set(sx * 0.06, 0.24, 0.12);
    g.add(eye);
  }
  return g;
}

export function gullModel() {
  const g = new THREE.Group();
  const body = inked(new THREE.SphereGeometry(0.2, 8, 6), '#f4f1e8', 0.015);
  body.scale.set(0.8, 0.7, 1.5);
  g.add(body);
  const wings = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    const w = inked(new THREE.BoxGeometry(0.7, 0.03, 0.22), '#e8e4da', 0.012);
    w.position.x = sx * 0.35;
    pivot.add(w);
    g.add(pivot);
    wings.push(pivot);
  }
  const beak = inked(new THREE.ConeGeometry(0.04, 0.14, 4), '#f2c230', 0.01);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.03, 0.33);
  g.add(beak);
  g.userData.wings = wings;
  return g;
}

export { toon };
