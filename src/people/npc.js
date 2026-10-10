import * as THREE from 'three';
import { Character } from './character.js';
import { dampAngle, rand } from '../shared/utils.js';

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
