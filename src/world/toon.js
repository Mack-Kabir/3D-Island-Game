import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** Ink colour used for every outline — the "hand drawn" line. */
export const INK = new THREE.Color('#2a2534');

let gradientTex = null;
/** Three-step cel shading ramp. */
export function gradientMap() {
  if (!gradientTex) {
    const data = new Uint8Array([150, 208, 255]);
    gradientTex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
    gradientTex.minFilter = THREE.NearestFilter;
    gradientTex.magFilter = THREE.NearestFilter;
    gradientTex.generateMipmaps = false;
    gradientTex.needsUpdate = true;
  }
  return gradientTex;
}

export function toon(color = '#ffffff', opts = {}) {
  return new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: gradientMap(), ...opts });
}

const outlineCache = new Map();
/** Inverted-hull outline: back faces pushed out along smooth normals, width roughly constant on screen. */
export function outlineMaterial(thickness = 0.035) {
  const key = thickness.toFixed(4);
  if (outlineCache.has(key)) return outlineCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float oDist = length((modelViewMatrix * vec4(position, 1.0)).xyz);
      transformed += normalize(normal) * ${key} * clamp(oDist * 0.06, 0.6, 3.2);`,
    );
  };
  m.customProgramCacheKey = () => 'outline-' + key;
  outlineCache.set(key, m);
  return m;
}

export function outlineGeometry(geom) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', geom.getAttribute('position').clone());
  if (geom.index) g.setIndex(geom.index.clone());
  const merged = mergeVertices(g, 1e-3);
  g.dispose();
  merged.computeVertexNormals();
  return merged;
}

const outlineGeoCache = new WeakMap();
export function withOutline(mesh, thickness = 0.03) {
  let og = outlineGeoCache.get(mesh.geometry);
  if (!og) {
    og = outlineGeometry(mesh.geometry);
    outlineGeoCache.set(mesh.geometry, og);
  }
  const o = new THREE.Mesh(og, outlineMaterial(thickness));
  o.name = 'outline';
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}

/** Toon mesh with outline in one call. */
export function inked(geom, color, thickness = 0.03, opts) {
  const mesh = new THREE.Mesh(geom, color instanceof THREE.Material ? color : toon(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (thickness > 0) withOutline(mesh, thickness);
  return mesh;
}

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
export function mat4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const m = new THREE.Matrix4();
  _p.set(x, y, z);
  _q.setFromEuler(_e.set(rx, ry, rz));
  _s.set(sx, sy, sz);
  return m.compose(_p, _q, _s);
}

/** Shared primitive geometries (cloned by the batcher). */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cyl12: new THREE.CylinderGeometry(1, 1, 1, 12),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cone6: new THREE.ConeGeometry(1, 1, 6),
  cone8: new THREE.ConeGeometry(1, 1, 8),
  sphere: new THREE.IcosahedronGeometry(1, 1),
  sphereHi: new THREE.SphereGeometry(1, 12, 10),
  rock: new THREE.DodecahedronGeometry(1, 0),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(1, 0.25, 6, 12),
};

/**
 * Collects static geometry with baked vertex colours and merges it into a
 * handful of meshes — keeps draw calls tiny no matter how many props we place.
 */
export class Batcher {
  constructor() {
    this.lists = { solid: [], plain: [], glow: [] };
    this.meshes = {};
  }
  add(geom, color, matrix, { flat = false, kind = 'solid' } = {}) {
    let g = geom.index ? geom.toNonIndexed() : geom.clone();
    for (const k of Object.keys(g.attributes)) {
      if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    }
    g.applyMatrix4(matrix);
    if (flat || !g.getAttribute('normal')) g.computeVertexNormals();
    const c = color instanceof THREE.Color ? color : new THREE.Color(color);
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.lists[kind].push(g);
    return g;
  }
  build(glowMaterial) {
    const group = new THREE.Group();
    group.name = 'static-batch';
    const make = (list, material, outline, shadow) => {
      if (!list.length) return null;
      const geom = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      list.length = 0;
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      group.add(mesh);
      if (outline) {
        const o = new THREE.Mesh(outlineGeometry(geom), outlineMaterial(outline));
        o.raycast = () => {};
        group.add(o);
      }
      return mesh;
    };
    const vc = toon('#ffffff', { vertexColors: true });
    this.meshes.solid = make(this.lists.solid, vc, 0.04, true);
    this.meshes.plain = make(this.lists.plain, vc, 0, false);
    this.meshes.glow = make(this.lists.glow, glowMaterial, 0, false);
    return group;
  }
}

let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,240,200,0.65)');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

const patternCache = new Map();
/** Procedural fabric patterns for clothing (floral, stripes, dots, plaid). */
export function patternTexture(kind, base, accent, accent2 = '#ffffff') {
  const key = `${kind}|${base}|${accent}|${accent2}`;
  if (patternCache.has(key)) return patternCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  if (kind === 'stripes') {
    ctx.fillStyle = accent;
    for (let y = 0; y < 128; y += 32) ctx.fillRect(0, y, 128, 14);
  } else if (kind === 'dots') {
    ctx.fillStyle = accent;
    for (let y = 8; y < 128; y += 32)
      for (let x = (y / 32) % 2 ? 24 : 8; x < 128; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (kind === 'plaid') {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = accent;
    for (let i = 0; i < 128; i += 32) {
      ctx.fillRect(i, 0, 12, 128);
      ctx.fillRect(0, i, 128, 12);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'floral') {
    const flower = (x, y, r, col) => {
      ctx.fillStyle = col;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.55, r * 0.35, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe37a';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    const leaf = (x, y, a) => {
      ctx.fillStyle = 'rgba(40,90,60,0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 4, a, 0, Math.PI * 2);
      ctx.fill();
    };
    const spots = [[20, 22], [84, 12], [52, 64], [110, 70], [18, 100], [80, 110]];
    spots.forEach(([x, y], i) => {
      leaf(x + 12, y + 8, i);
      flower(x, y, 12, i % 2 ? accent : accent2);
      // wrap copies for seamless tiling
      flower(x - 128, y, 12, i % 2 ? accent : accent2);
      flower(x, y - 128, 12, i % 2 ? accent : accent2);
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  patternCache.set(key, tex);
  return tex;
}
