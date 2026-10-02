import * as THREE from 'three';
import { Character } from './character.js';
import { dampAngle, damp } from '../core/utils.js';

export class Player {
  constructor(game, look) {
    this.game = game;
    this.char = new Character(look);
    this.root = this.char.root;
    this.pos = this.root.position;
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.grounded = true;
    this.radius = 0.4;
    this.pose = null;
    this.locked = false;
    this.splashT = 0;
    this.stepT = 0;
  }

  setLook(look) {
    this.char.setLook(look);
  }

  forward() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  teleport(x, z, yaw = this.yaw) {
    const w = this.game.world;
    this.pos.set(x, w ? w.groundAt(x, z) : 0, z);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.root.rotation.y = yaw;
  }

  update(dt) {
    const g = this.game;
    const w = g.world;
    const input = g.input;
    let mx = 0;
    let mz = 0;
    const canMove = g.canMove() && !this.locked;
    if (canMove) {
      const a = input.axis();
      const cy = g.cam.yaw;
      // camera-relative: forward is away from the camera
      const fx = -Math.sin(cy);
      const fz = -Math.cos(cy);
      const rx = Math.cos(cy);
      const rz = -Math.sin(cy);
      mx = fx * a.y + rx * a.x;
      mz = fz * a.y + rz * a.x;
    }
    const len = Math.hypot(mx, mz);
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight') || input.virtual.has('Sprint');
    const ground = w.groundAt(this.pos.x, this.pos.z);
    const wading = ground < -0.15;
    let speed = (sprint ? 8.2 : 4.9) * (wading ? 0.6 : 1);
    if (g.state?.petBoost) speed *= 1.0;
    const tvx = len > 0.01 ? (mx / Math.max(len, 1)) * speed : 0;
    const tvz = len > 0.01 ? (mz / Math.max(len, 1)) * speed : 0;
    this.vel.x = damp(this.vel.x, tvx, 12, dt);
    this.vel.z = damp(this.vel.z, tvz, 12, dt);

    if (canMove && this.grounded && input.pressed('Space') && !g.fishing.active) {
      this.vel.y = 7.2;
      this.grounded = false;
      g.audio.sfx('jump');
    }
    this.vel.y -= 22 * dt;

    // horizontal move with deep-water blocking
    const nx = this.pos.x + this.vel.x * dt;
    const nz = this.pos.z + this.vel.z * dt;
    const deep = (x, z) => w.groundAt(x, z) < -1.1;
    if (!deep(nx, nz)) {
      this.pos.x = nx;
      this.pos.z = nz;
    } else if (!deep(nx, this.pos.z)) {
      this.pos.x = nx;
      this.vel.z = 0;
    } else if (!deep(this.pos.x, nz)) {
      this.pos.z = nz;
      this.vel.x = 0;
    } else {
      this.vel.x = 0;
      this.vel.z = 0;
    }
    w.resolveCollisions(this.pos, this.radius);

    this.pos.y += this.vel.y * dt;
    const gy = w.groundAt(this.pos.x, this.pos.z);
    if (this.pos.y <= gy) {
      if (!this.grounded && this.vel.y < -9) g.particles.burst(this.pos, { count: 6, color: '#e8dcc0', speed: 2, up: 1 });
      this.pos.y = gy;
      this.vel.y = 0;
      this.grounded = true;
    } else if (this.pos.y > gy + 0.25) {
      this.grounded = false;
    } else if (this.vel.y <= 0) {
      this.pos.y = gy;
      this.vel.y = 0;
      this.grounded = true;
    }

    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (hs > 0.5 && len > 0.01) this.yaw = dampAngle(this.yaw, Math.atan2(this.vel.x, this.vel.z), 14, dt);
    this.root.rotation.y = this.yaw;

    // splashes & footsteps
    if (hs > 1 && this.grounded) {
      this.stepT -= dt * hs;
      if (this.stepT <= 0) {
        this.stepT = 2.2;
        if (wading) {
          g.particles.burst(new THREE.Vector3(this.pos.x, 0.05, this.pos.z), { count: 5, color: '#e8fbff', speed: 1.5, up: 2.2, life: 0.5 });
          g.audio.sfx('splashSmall');
        } else g.audio.sfx('step');
      }
    }

    this.char.update(dt, { speed: hs, grounded: this.grounded, pose: this.pose });
  }
}
