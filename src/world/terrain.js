import * as THREE from 'three';
import { makeNoise2D, fbm, smoothstep, lerp, clamp } from '../core/utils.js';
import { toon } from './toon.js';

/**
 * Heightfield island. `zones` flatten areas (village squares, homestead),
 * `paths` paint dirt trails into the vertex colours.
 */
export class Terrain {
  constructor(def, zones = [], paths = []) {
    this.def = def;
    this.zones = zones;
    this.paths = paths;
    this.noise = makeNoise2D(def.seed);
    this.noise2 = makeNoise2D(def.seed + 101);
    this.noise3 = makeNoise2D(def.seed + 202);
    this.size = def.radius * 2.7;
    this.seg = 230;
    this.N = this.seg + 1;
    this.cell = this.size / this.seg;
    this.min = -this.size / 2;
    this.heights = new Float32Array(this.N * this.N);
  }

  rawHeight(x, z) {
    const d = this.def;
    const r = d.radius;
    const n1 = fbm(this.noise, x * 0.011, z * 0.011, 3);
    const dist = Math.hypot(x * (d.stretch ?? 1), z) / r + n1 * 0.24;
    const mask = 1 - smoothstep(0.48, 1.0, dist);
    let land = d.base + (fbm(this.noise2, x * 0.024, z * 0.024, 4) * 0.5 + 0.5) * d.hill;
    for (const p of d.peaks || []) {
      const dx = x - p.x;
      const dz = z - p.z;
      const dd = dx * dx + dz * dz;
      land += p.h * Math.exp(-dd / (2 * p.s * p.s));
      if (p.crater) land -= p.crater * Math.exp(-dd / (2 * (p.s * 0.28) ** 2));
    }
    let h = lerp(-9, land, mask);
    // widen beaches and shallow lagoons
    if (h < 0) h = h > -4 ? h * 0.5 : -2 + (h + 4) * 1.2;
    else h = h < 2 ? h * 0.6 : 1.2 + (h - 2);
    for (const zn of this.zones) {
      const dd = Math.hypot(x - zn.x, z - zn.z);
      const w = 1 - smoothstep(zn.r, zn.r + (zn.f ?? 8), dd);
      if (w > 0) h = lerp(h, zn.h, w);
    }
    return h;
  }

  build() {
    const { N, cell, min, def } = this;
    const pal = def.palette;
    const positions = new Float32Array(N * N * 3);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = min + i * cell;
        const z = min + j * cell;
        const h = this.rawHeight(x, z);
        const k = j * N + i;
        this.heights[k] = h;
        positions[k * 3] = x;
        positions[k * 3 + 1] = h;
        positions[k * 3 + 2] = z;
      }
    }
    const idx = new Uint32Array(this.seg * this.seg * 6);
    let t = 0;
    for (let j = 0; j < this.seg; j++) {
      for (let i = 0; i < this.seg; i++) {
        const a = j * N + i; // 00
        const b = j * N + i + 1; // 10
        const c = (j + 1) * N + i; // 01
        const d = (j + 1) * N + i + 1; // 11
        idx[t++] = a; idx[t++] = c; idx[t++] = d;
        idx[t++] = a; idx[t++] = d; idx[t++] = b;
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex(new THREE.BufferAttribute(idx, 1));
    geom.computeVertexNormals();

    // vertex colours
    const normals = geom.getAttribute('normal');
    const colors = new Float32Array(N * N * 3);
    const C = (hex) => new THREE.Color(hex);
    const sand = C(pal.sand);
    const wetSand = C(pal.sand).multiplyScalar(0.82);
    const seabed = C(pal.seabed ?? '#4f9c9a');
    const grass = C(pal.grass);
    const grass2 = C(pal.grass2);
    const rock = C(pal.rock);
    const path = C(pal.path);
    const peak = pal.peak ? C(pal.peak) : null;
    const tmp = new THREE.Color();
    for (let k = 0; k < N * N; k++) {
      const x = positions[k * 3];
      const h = positions[k * 3 + 1];
      const z = positions[k * 3 + 2];
      const ny = normals.getY(k);
      const n = fbm(this.noise3, x * 0.06, z * 0.06, 2) * 0.5 + 0.5;
      if (h < 0) {
        tmp.copy(wetSand).lerp(seabed, smoothstep(0.0, 5, -h));
      } else if (h < 0.35) {
        tmp.copy(wetSand).lerp(sand, smoothstep(0.05, 0.35, h));
      } else {
        tmp.copy(sand);
        const g = smoothstep(1.05, 1.5, h + (n - 0.5) * 0.5);
        const gc = new THREE.Color().copy(grass).lerp(grass2, smoothstep(0.35, 0.65, n));
        tmp.lerp(gc, g);
        const steep = smoothstep(0.86, 0.7, ny);
        tmp.lerp(rock, steep * (h > 0.6 ? 1 : 0.3));
        if (peak && def.peakAbove) tmp.lerp(peak, smoothstep(def.peakAbove, def.peakAbove + 4, h));
        // dirt paths
        if (this.paths.length && h > 0.4) {
          let best = 99;
          for (const p of this.paths) best = Math.min(best, segDist(x, z, p) - (p[4] ?? 2.2));
          const pw = 1 - smoothstep(-0.4, 0.6, best + (n - 0.5) * 0.8);
          if (pw > 0) tmp.lerp(path, pw);
        }
      }
      // subtle painterly speckle
      const s = 1 + (n - 0.5) * 0.08;
      colors[k * 3] = tmp.r * s;
      colors[k * 3 + 1] = tmp.g * s;
      colors[k * 3 + 2] = tmp.b * s;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geom, toon('#ffffff', { vertexColors: true }));
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    this.mesh = mesh;
    return mesh;
  }

  /** Exact height on the rendered triangles. */
  heightAt(x, z) {
    const { N, cell, min } = this;
    const fx = (x - min) / cell;
    const fz = (z - min) / cell;
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= this.seg || j >= this.seg) return -12;
    const u = fx - i;
    const v = fz - j;
    const H = this.heights;
    const h00 = H[j * N + i];
    const h10 = H[j * N + i + 1];
    const h01 = H[(j + 1) * N + i];
    const h11 = H[(j + 1) * N + i + 1];
    if (u <= v) return h00 + (h11 - h01) * u + (h01 - h00) * v;
    return h00 + (h10 - h00) * u + (h11 - h10) * v;
  }

  normalAt(x, z) {
    const e = 0.6;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return new THREE.Vector3(-hx, 2 * e, -hz).normalize();
  }

  /** Height texture for the water shader (shore foam + depth tint). */
  heightTexture() {
    const res = 256;
    const data = new Uint8Array(res * res);
    let minH = Infinity;
    let maxH = -Infinity;
    for (const h of this.heights) {
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    minH = Math.max(minH, -14);
    maxH = Math.min(maxH, 6); // precision near sea level matters most
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x = this.min + ((i + 0.5) / res) * this.size;
        const z = this.min + ((j + 0.5) / res) * this.size;
        const h = clamp(this.heightAt(x, z), minH, maxH);
        data[j * res + i] = Math.round(((h - minH) / (maxH - minH)) * 255);
      }
    }
    const tex = new THREE.DataTexture(data, res, res, THREE.RedFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return { tex, minH, maxH, minX: this.min, minZ: this.min, size: this.size };
  }
}

export function segDist(x, z, p) {
  const [x1, z1, x2, z2] = p;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const l2 = dx * dx + dz * dz || 1;
  const t = clamp(((x - x1) * dx + (z - z1) * dz) / l2, 0, 1);
  return Math.hypot(x - (x1 + dx * t), z - (z1 + dz * t));
}
