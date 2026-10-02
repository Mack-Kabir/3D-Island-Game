import * as THREE from 'three';
import { glowTexture } from './toon.js';

/** Rain streaks that follow the camera. */
export class Rain {
  constructor(scene) {
    const count = 1600;
    const pos = new Float32Array(count * 6);
    this.offsets = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.offsets[i * 3] = (Math.random() - 0.5) * 70;
      this.offsets[i * 3 + 1] = Math.random() * 40;
      this.offsets[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: '#cfe0ee', transparent: true, opacity: 0, depthWrite: false });
    this.lines = new THREE.LineSegments(geom, this.mat);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 5;
    scene.add(this.lines);
    this.count = count;
  }
  update(dt, center, intensity) {
    this.mat.opacity = intensity * 0.55;
    this.lines.visible = intensity > 0.02;
    if (!this.lines.visible) return;
    const pos = this.lines.geometry.getAttribute('position');
    const arr = pos.array;
    const o = this.offsets;
    for (let i = 0; i < this.count; i++) {
      o[i * 3 + 1] -= dt * 38;
      o[i * 3] -= dt * 4;
      if (o[i * 3 + 1] < -2) {
        o[i * 3 + 1] += 40;
        o[i * 3] = (Math.random() - 0.5) * 70;
      }
      const x = center.x + o[i * 3];
      const y = center.y + o[i * 3 + 1] - 6;
      const z = center.z + o[i * 3 + 2];
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x + 0.1;
      arr[i * 6 + 4] = y + 0.9;
      arr[i * 6 + 5] = z;
    }
    pos.needsUpdate = true;
  }
}

/** Night-time fireflies drifting around the player. */
export class Fireflies {
  constructor(scene) {
    const count = 90;
    this.count = count;
    this.seeds = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      y: 0.6 + Math.random() * 3,
      p: Math.random() * 10,
      s: 0.3 + Math.random() * 0.6,
    }));
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.mat = new THREE.PointsMaterial({
      size: 0.5,
      map: glowTexture(),
      color: '#e8ff9a',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.points = new THREE.Points(geom, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  update(dt, t, center, amount, heightAt) {
    this.mat.opacity = amount * 0.95;
    this.points.visible = amount > 0.02;
    if (!this.points.visible) return;
    const arr = this.points.geometry.getAttribute('position').array;
    this.seeds.forEach((s, i) => {
      const x = center.x + s.x + Math.sin(t * s.s + s.p) * 2;
      const z = center.z + s.z + Math.cos(t * s.s * 0.8 + s.p) * 2;
      const ground = heightAt ? Math.max(heightAt(x, z), 0) : 0;
      arr[i * 3] = x;
      arr[i * 3 + 1] = ground + s.y + Math.sin(t * 1.3 + s.p) * 0.4;
      arr[i * 3 + 2] = z;
    });
    this.points.geometry.getAttribute('position').needsUpdate = true;
  }
}

/** Pooled little particle bursts: splashes, poofs, sparkles, leaves. */
export class Particles {
  constructor(scene) {
    this.max = 400;
    this.items = [];
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.max * 3), 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.max * 3), 3));
    this.mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      alphaTest: 0.05,
    });
    this.points = new THREE.Points(geom, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
    scene.add(this.points);
    this._c = new THREE.Color();
  }
  burst(pos, { count = 12, color = '#ffffff', speed = 3, up = 3, life = 0.8, gravity = 9, spread = 1 } = {}) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      if (this.items.length >= this.max) this.items.shift();
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.items.push({
        x: pos.x + (Math.random() - 0.5) * 0.3 * spread,
        y: pos.y,
        z: pos.z + (Math.random() - 0.5) * 0.3 * spread,
        vx: Math.cos(a) * s,
        vy: up * (0.5 + Math.random() * 0.8),
        vz: Math.sin(a) * s,
        life,
        max: life,
        gravity,
        c,
      });
    }
  }
  update(dt) {
    const pos = this.points.geometry.getAttribute('position');
    const col = this.points.geometry.getAttribute('color');
    let n = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
    }
    for (const p of this.items) {
      const f = p.life / p.max;
      pos.setXYZ(n, p.x, p.y, p.z);
      col.setXYZ(n, p.c.r * f + (1 - f) * 0.9, p.c.g * f + (1 - f) * 0.9, p.c.b * f + (1 - f) * 0.9);
      n++;
    }
    this.points.geometry.setDrawRange(0, n);
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }
}
