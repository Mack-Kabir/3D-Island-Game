import * as THREE from 'three';
import { Character } from '../people/character.js';
import { dampAngle, rand, pick, wrapAngle } from '../shared/utils.js';

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
