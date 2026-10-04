import * as THREE from 'three';
import { G, mat4, toon, inked, withOutline, glowTexture } from './toon.js';

const Mat = THREE.Matrix4;
const PRISM = new THREE.CylinderGeometry(1, 1, 1, 3);
/** Compose a part transform relative to a base matrix. */
function T(base, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new Mat().multiplyMatrices(base, mat4(x, y, z, rx, ry, rz, sx, sy, sz));
}

let leafGeo = null;
/** A drooping palm frond: a tapered, slightly thick blade that arcs down. */
function palmLeafGeometry() {
  if (leafGeo) return leafGeo;
  const segs = 6;
  const pos = [];
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = t * 3.1;
    const y = Math.sin(t * Math.PI * 0.8) * 0.7 - t * t * 1.5;
    const w = Math.sin(Math.min(t * 1.15, 1) * Math.PI) * 0.55 + 0.05;
    pts.push([x, y, w]);
  }
  const th = 0.06;
  for (let i = 0; i < segs; i++) {
    const [x0, y0, w0] = pts[i];
    const [x1, y1, w1] = pts[i + 1];
    // top surface (two triangles, folded slightly along the spine)
    const fold = 0.12;
    const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    quad([x0, y0 + th, 0], [x1, y1 + th, 0], [x1, y1 - fold * w1, w1], [x0, y0 - fold * w0, w0]);
    quad([x0, y0 + th, 0], [x0, y0 - fold * w0, -w0], [x1, y1 - fold * w1, -w1], [x1, y1 + th, 0]);
    // bottom
    quad([x0, y0 - th, 0], [x0, y0 - fold * w0 - th, w0], [x1, y1 - fold * w1 - th, w1], [x1, y1 - th, 0]);
    quad([x0, y0 - th, 0], [x1, y1 - th, 0], [x1, y1 - fold * w1 - th, -w1], [x0, y0 - fold * w0 - th, -w0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  leafGeo = g;
  return g;
}

export function palm(b, x, y, z, s = 1, rnd = Math.random, pal = {}) {
  const base = mat4(x, y, z, 0, rnd() * Math.PI * 2, 0, s);
  const lean = 0.25 + rnd() * 0.35;
  const segs = 6;
  let px = 0;
  let py = 0;
  const trunk = pal.trunk ?? '#a98a64';
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const r = 0.26 - t * 0.09;
    const ang = lean * (0.2 + t * 0.9);
    b.add(G.cyl8, i % 2 ? trunk : shade(trunk, 0.9), T(base, px, py + 0.5, 0, 0, 0, -ang, r, 1.05, r));
    px += Math.sin(ang) * 1.0;
    py += Math.cos(ang) * 1.0;
  }
  const leaf = palmLeafGeometry();
  const n = 7;
  const lc = pal.leaf ?? '#6aa86a';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
    b.add(leaf, i % 2 ? lc : shade(lc, 0.88), T(base, px, py, 0, 0, a, 0.15 + rnd() * 0.35, 1, 1, 1));
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    b.add(G.sphere, '#6b4a2e', T(base, px + Math.cos(a) * 0.22, py - 0.25, Math.sin(a) * 0.22, 0, 0, 0, 0.2));
  }
  return { r: 0.45 * s };
}

export function roundTree(b, x, y, z, s = 1, rnd = Math.random, opts = {}) {
  const base = mat4(x, y, z, 0, rnd() * Math.PI * 2, 0, s);
  const leaf = opts.leaf ?? '#5f9a5c';
  b.add(G.cyl6, opts.trunk ?? '#8a6a4a', T(base, 0, 1.2, 0, 0, 0, 0, 0.28, 2.4, 0.28));
  b.add(G.sphere, leaf, T(base, 0, 3.2, 0, 0, 0, 0, 1.7, 1.45, 1.7));
  b.add(G.sphere, shade(leaf, 1.08), T(base, 0.9, 2.7, 0.4, 0, 0, 0, 1.15, 1.0, 1.15));
  b.add(G.sphere, shade(leaf, 0.92), T(base, -0.8, 2.8, -0.5, 0, 0, 0, 1.2, 1.0, 1.2));
  if (opts.fruit) {
    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2;
      const yy = 2.5 + rnd() * 1.4;
      b.add(G.sphere, opts.fruit, T(base, Math.cos(a) * 1.55, yy, Math.sin(a) * 1.55, 0, 0, 0, 0.2));
    }
  }
  return { r: 0.5 * s };
}

export function pine(b, x, y, z, s = 1, rnd = Math.random, opts = {}) {
  const base = mat4(x, y, z, 0, rnd() * Math.PI, 0, s);
  const c = opts.leaf ?? '#4f7f5a';
  b.add(G.cyl6, '#6b4f3a', T(base, 0, 0.8, 0, 0, 0, 0, 0.22, 1.6, 0.22));
  b.add(G.cone8, c, T(base, 0, 2.2, 0, 0, 0, 0, 1.5, 2.2, 1.5));
  b.add(G.cone8, shade(c, 1.08), T(base, 0, 3.4, 0, 0, 0, 0, 1.15, 1.9, 1.15));
  b.add(G.cone8, shade(c, 1.15), T(base, 0, 4.4, 0, 0, 0, 0, 0.75, 1.5, 0.75));
  return { r: 0.45 * s };
}

export function bush(b, x, y, z, s = 1, rnd = Math.random, color = '#6aa36a', flowers = null) {
  const base = mat4(x, y, z, 0, rnd() * 6, 0, s);
  b.add(G.sphere, color, T(base, 0, 0.45, 0, 0, 0, 0, 0.9, 0.7, 0.9));
  b.add(G.sphere, shade(color, 1.1), T(base, 0.55, 0.35, 0.2, 0, 0, 0, 0.6, 0.5, 0.6));
  b.add(G.sphere, shade(color, 0.9), T(base, -0.5, 0.35, -0.2, 0, 0, 0, 0.65, 0.5, 0.65));
  if (flowers) {
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2;
      b.add(G.sphere, flowers, T(base, Math.cos(a) * 0.7, 0.55 + rnd() * 0.3, Math.sin(a) * 0.7, 0, 0, 0, 0.13));
    }
  }
}

export function rock(b, x, y, z, s = 1, rnd = Math.random, color = '#8d8f99') {
  const base = mat4(x, y, z, rnd() * 0.4, rnd() * 6, rnd() * 0.4, s);
  b.add(G.rock, color, T(base, 0, 0.35, 0, 0, 0, 0, 1, 0.7 + rnd() * 0.3, 0.9), { flat: true });
  if (rnd() < 0.5) b.add(G.rock, shade(color, 1.08), T(base, 0.8, 0.15, 0.3, 0, 1, 0, 0.5), { flat: true });
  return { r: 0.9 * s };
}

/**
 * A detailed little island house: plank siding, framed windows with shutters
 * and flower boxes, a framed door with a step, shingled roof and a porch lamp.
 * opts: w, d, h, wall, roof, trim, stilts, rot, chimney, awning, roofStyle, shutters, flowers
 */
export function house(b, x, y, z, opts = {}) {
  const { w = 5, d = 4.5, h = 3, wall = '#efe3c8', roof = '#c8604a', trim = '#7a5a40', rot = 0, stilts = 0, door = '#7a5236', roofStyle = 'gable' } = opts;
  const shutters = opts.shutters ?? shade(roof, 0.85);
  const flowers = opts.flowers ?? ['#f2a2b8', '#ffffff', '#f7c95c', '#e86f8a'];
  const base = mat4(x, y, z, 0, rot, 0);
  const fy = stilts;
  if (stilts > 0) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      b.add(G.cyl6, trim, T(base, sx * (w / 2 - 0.3), stilts / 2, sz * (d / 2 - 0.3), 0, 0, 0, 0.18, stilts + 0.2, 0.18));
    }
    b.add(G.box, shade(trim, 1.15), T(base, 0, fy - 0.1, 0.4, 0, 0, 0, w + 0.6, 0.2, d + 1.6));
    // deck railing
    for (const sx of [-1, 1]) b.add(G.box, trim, T(base, sx * (w / 2 + 0.25), fy + 0.45, d / 2 + 0.7, 0, 0, 0, 0.1, 0.9, 0.1));
    for (let i = 0; i < Math.ceil(stilts / 0.4); i++) b.add(G.box, trim, T(base, 0, fy - 0.3 - i * 0.4, d / 2 + 1.4 + i * 0.45, 0, 0, 0, 1.4, 0.15, 0.5));
  } else {
    // stone foundation
    b.add(G.box, '#9b958c', T(base, 0, 0.15, 0, 0, 0, 0, w + 0.3, 0.36, d + 0.3), { flat: true });
    for (let i = 0; i < Math.floor(w / 0.9); i++) b.add(G.box, '#857f78', T(base, -w / 2 + 0.45 + i * 0.9, 0.15, d / 2 + 0.16, 0, 0, 0, 0.8, 0.26, 0.04));
  }
  b.add(G.box, wall, T(base, 0, fy + h / 2 + 0.05, 0, 0, 0, 0, w, h, d));
  // plank siding lines
  const sid = shade(wall, 0.86);
  for (let yy = fy + 0.65; yy < fy + h; yy += 0.5) {
    b.add(G.box, sid, T(base, 0, yy, d / 2 + 0.012, 0, 0, 0, w - 0.1, 0.05, 0.02));
    b.add(G.box, sid, T(base, 0, yy, -d / 2 - 0.012, 0, 0, 0, w - 0.1, 0.05, 0.02));
    b.add(G.box, sid, T(base, w / 2 + 0.012, yy, 0, 0, 0, 0, 0.02, 0.05, d - 0.1));
    b.add(G.box, sid, T(base, -w / 2 - 0.012, yy, 0, 0, 0, 0, 0.02, 0.05, d - 0.1));
  }
  // corner posts + top beam
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    b.add(G.box, trim, T(base, sx * w / 2, fy + h / 2 + 0.05, sz * d / 2, 0, 0, 0, 0.24, h + 0.1, 0.24));
  }
  b.add(G.box, trim, T(base, 0, fy + h + 0.02, d / 2 + 0.02, 0, 0, 0, w + 0.2, 0.18, 0.12));
  b.add(G.box, trim, T(base, 0, fy + h + 0.02, -d / 2 - 0.02, 0, 0, 0, w + 0.2, 0.18, 0.12));

  if (roofStyle === 'gable') {
    const rw = w / 2 + 0.6;
    const ang = 0.55;
    const slabW = rw / Math.cos(ang);
    const midY = fy + h + Math.tan(ang) * rw / 2 + 0.05;
    for (const side of [-1, 1]) {
      b.add(G.box, side < 0 ? roof : shade(roof, 0.9), T(base, (side * rw) / 2, midY, 0, 0, 0, -side * ang, slabW, 0.22, d + 1.0));
      // shingle rows
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        const px = side * rw * (1 - t);
        const py = fy + h + Math.tan(ang) * rw * t + 0.2;
        b.add(G.box, shade(roof, 0.78), T(base, px, py, 0, 0, 0, -side * ang, 0.08, 0.06, d + 1.02));
      }
      // fascia board at the eave
      b.add(G.box, trim, T(base, side * (rw - 0.05), fy + h + 0.05, 0, 0, 0, 0, 0.12, 0.22, d + 1.05));
    }
    // ridge cap
    b.add(G.box, shade(roof, 0.7), T(base, 0, fy + h + Math.tan(ang) * rw + 0.14, 0, 0, 0, Math.PI / 4, 0.3, 0.3, d + 1.1));
    const gh = Math.tan(ang) * rw;
    b.add(PRISM, wall, T(base, 0, fy + h + 0.05 + 0.5 * (gh / 1.5), 0, -Math.PI / 2, 0, 0, rw / 0.866, d - 0.05, gh / 1.5));
    // round attic window
    b.add(G.cyl12, trim, T(base, 0, fy + h + gh * 0.38, d / 2 + 0.02, Math.PI / 2, 0, 0, 0.32, 0.06, 0.32));
    b.add(G.cyl12, '#ffd98a', T(base, 0, fy + h + gh * 0.38, d / 2 + 0.05, Math.PI / 2, 0, 0, 0.22, 0.04, 0.22), { kind: 'glow' });
  } else {
    // thatched pyramid with layered skirts
    const R = Math.max(w, d) * 0.85;
    b.add(G.cone4, roof, T(base, 0, fy + h + 1.05, 0, 0, Math.PI / 4, 0, R, 2.2, R));
    b.add(G.cone4, shade(roof, 0.88), T(base, 0, fy + h + 0.35, 0, 0, Math.PI / 4, 0, R * 1.05, 0.7, R * 1.05));
    b.add(G.cone4, shade(roof, 0.8), T(base, 0, fy + h + 2.15, 0, 0, Math.PI / 4, 0, R * 0.35, 0.5, R * 0.35));
  }

  // framed door with panels, a step and a knob
  b.add(G.box, trim, T(base, 0, fy + 1.05, d / 2 + 0.03, 0, 0, 0, 1.3, 2.15, 0.08));
  b.add(G.box, door, T(base, 0, fy + 1.0, d / 2 + 0.06, 0, 0, 0, 1.0, 1.9, 0.08));
  for (const py of [0.6, 1.4]) b.add(G.box, shade(door, 0.82), T(base, 0, fy + py, d / 2 + 0.11, 0, 0, 0, 0.7, 0.55, 0.02));
  b.add(G.sphere, '#e8c45a', T(base, 0.34, fy + 1.0, d / 2 + 0.13, 0, 0, 0, 0.06));
  if (!stilts) b.add(G.box, '#9b958c', T(base, 0, 0.12, d / 2 + 0.55, 0, 0, 0, 1.6, 0.24, 0.7), { flat: true });
  // porch lamp
  b.add(G.box, '#3a3040', T(base, 0.95, fy + 2.05, d / 2 + 0.12, 0, 0, 0, 0.08, 0.3, 0.1));
  b.add(G.box, '#ffe3a0', T(base, 0.95, fy + 2.1, d / 2 + 0.25, 0, 0, 0, 0.2, 0.26, 0.2), { kind: 'glow' });

  // framed windows with crossbars, shutters & flower boxes
  const winY = fy + h * 0.58;
  const addWindow = (lx, lz, faceRot) => {
    const W = T(base, lx, winY, lz, 0, faceRot, 0);
    const P = (px, py, pz, sx, sy, sz) => new THREE.Matrix4().multiplyMatrices(W, mat4(px, py, pz, 0, 0, 0, sx, sy, sz));
    b.add(G.box, '#ffd98a', P(0, 0, 0.02, 0.85, 0.85, 0.04), { kind: 'glow' });
    b.add(G.box, trim, P(0, 0.47, 0.06, 1.05, 0.1, 0.1));
    b.add(G.box, trim, P(0, -0.47, 0.06, 1.05, 0.1, 0.1));
    b.add(G.box, trim, P(0.48, 0, 0.06, 0.1, 0.9, 0.1));
    b.add(G.box, trim, P(-0.48, 0, 0.06, 0.1, 0.9, 0.1));
    b.add(G.box, trim, P(0, 0, 0.07, 0.06, 0.85, 0.06));
    b.add(G.box, trim, P(0, 0, 0.07, 0.85, 0.06, 0.06));
    for (const sx of [-1, 1]) {
      b.add(G.box, shutters, P(sx * 0.75, 0, 0.05, 0.4, 0.95, 0.06));
      for (const sy of [-0.25, 0, 0.25]) b.add(G.box, shade(shutters, 0.8), P(sx * 0.75, sy, 0.09, 0.32, 0.04, 0.02));
    }
    b.add(G.box, '#8a5a3a', P(0, -0.62, 0.2, 1.0, 0.22, 0.3));
    for (let i = 0; i < 4; i++) b.add(G.sphere, flowers[i % flowers.length], P(-0.36 + i * 0.24, -0.45, 0.22, 0.11, 0.11, 0.11));
    b.add(G.sphere, '#5f9a5c', P(0, -0.5, 0.2, 0.45, 0.12, 0.14));
  };
  if (w >= 5.4) for (const sx of [-1, 1]) addWindow(sx * (w / 2 - 1.1), d / 2, 0);
  addWindow(w / 2, 0, Math.PI / 2);
  addWindow(-w / 2, 0, -Math.PI / 2);
  if (d >= 4) addWindow(0, -d / 2, Math.PI);

  if (opts.chimney) {
    b.add(G.box, '#9a8a80', T(base, w / 4, fy + h + 1.3, -d / 4, 0, 0, 0, 0.55, 1.6, 0.55), { flat: true });
    b.add(G.box, '#7a6e66', T(base, w / 4, fy + h + 2.15, -d / 4, 0, 0, 0, 0.72, 0.16, 0.72));
  }
  if (opts.awning) {
    for (let i = 0; i < 5; i++) {
      b.add(G.box, i % 2 ? '#fbf3e2' : opts.awning, T(base, -w * 0.35 + (i + 0.5) * (w * 0.7) / 5, fy + 2.45, d / 2 + 0.7, 0.35, 0, 0, (w * 0.7) / 5, 0.08, 1.4));
    }
  }
  const doorWorld = new THREE.Vector3(0, fy, d / 2 + (stilts ? 2.2 : 1.2)).applyMatrix4(base);
  const signPos = new THREE.Vector3(0, fy + 2.55, d / 2 + 0.16).applyMatrix4(base);
  return { door: doorWorld, signPos, rot, collider: { type: 'box', x, z, hw: w / 2 + 0.2, hd: d / 2 + 0.2, rot } };
}

/** Market stall with a striped awning, crates, baskets and hanging goods. */
export function stall(b, x, y, z, rot = 0, colors = ['#f0846a', '#fbf3e2'], goods = []) {
  const base = mat4(x, y, z, 0, rot, 0);
  b.add(G.box, '#a98060', T(base, 0, 0.55, 0, 0, 0, 0, 3.2, 1.1, 1.4));
  for (let i = 0; i < 4; i++) b.add(G.box, '#946c4c', T(base, -1.2 + i * 0.8, 0.55, 0.71, 0, 0, 0, 0.06, 1.05, 0.02));
  b.add(G.box, '#c49a70', T(base, 0, 1.12, 0.1, 0, 0, 0, 3.4, 0.08, 1.6));
  for (const sx of [-1.55, 1.55]) {
    for (const sz of [-0.6, 0.6]) b.add(G.cyl6, '#7a5a40', T(base, sx, 1.5, sz, 0, 0, 0, 0.08, 3, 0.08));
  }
  for (let i = 0; i < 6; i++) {
    b.add(G.box, colors[i % 2], T(base, -1.5 + i * 0.6 + 0.3, 3.05, 0.3, 0.3, 0, 0, 0.6, 0.08, 2.0));
    // scalloped edge
    b.add(G.cone4, colors[i % 2], T(base, -1.5 + i * 0.6 + 0.3, 2.68, 1.26, Math.PI, Math.PI / 4, 0, 0.3, 0.3, 0.06));
  }
  // baskets of goods on the counter
  goods.forEach((c, i) => {
    const gx = -1.15 + i * 0.55;
    b.add(G.cyl8, '#c8a060', T(base, gx, 1.24, 0.25, 0, 0, 0, 0.24, 0.16, 0.24));
    for (let k = 0; k < 3; k++) b.add(G.sphere, c, T(base, gx + (k - 1) * 0.1, 1.38 + (k === 1 ? 0.07 : 0), 0.25 + (k % 2) * 0.06, 0, 0, 0, 0.12));
  });
  // crates beside the stall
  b.add(G.box, '#a98060', T(base, 1.95, 0.35, 0.3, 0, 0.3, 0, 0.7));
  b.add(G.box, '#7a5a40', T(base, 1.95, 0.35, 0.3, 0, 0.3, 0, 0.72, 0.1, 0.72));
  b.add(G.box, '#a98060', T(base, 1.9, 0.95, 0.25, 0, -0.2, 0, 0.5));
  // hanging lantern
  b.add(G.box, '#ffe3a0', T(base, -1.55, 2.3, 1.0, 0, 0, 0, 0.18, 0.24, 0.18), { kind: 'glow' });
  const signPos = new THREE.Vector3(0, 3.55, 0.3).applyMatrix4(base);
  return { signPos, rot, collider: { type: 'box', x, z, hw: 1.7, hd: 0.8, rot } };
}

/** Painted wooden name board (real text), placed over doors and stalls. */
export function signBoard(text, pos, rot, { bg = '#f4e7c9', fg = '#2a2534', w = 2.4 } = {}) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#2a2534';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 118);
  ctx.fillStyle = fg;
  ctx.font = '700 64px "Lilita One", "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 64;
  while (ctx.measureText(text).width > 470 && size > 30) {
    size -= 4;
    ctx.font = `700 ${size}px "Lilita One", "Fredoka", sans-serif`;
  }
  ctx.fillText(text, 256, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, w / 4, 0.08), [
    toon('#7a5a40'), toon('#7a5a40'), toon('#7a5a40'), toon('#7a5a40'),
    toon('#ffffff', { map: tex }), toon('#7a5a40'),
  ]);
  withOutline(board, 0.02);
  g.add(board);
  g.position.copy(pos);
  g.rotation.y = rot;
  return g;
}

export function dock(b, x, y, z, rot, length = 16, width = 2.6) {
  const base = mat4(x, y, z, 0, rot, 0);
  const plank = '#a07a52';
  for (let i = 0; i < length / 0.6; i++) {
    b.add(G.box, i % 3 === 0 ? shade(plank, 0.9) : plank, T(base, 0, 0, i * 0.6 + 0.3, 0, 0, 0, width, 0.14, 0.55));
  }
  for (let i = 0; i <= length; i += 3) {
    for (const sx of [-1, 1]) b.add(G.cyl6, '#6b4f3a', T(base, sx * (width / 2 + 0.05), -1.2, i, 0, 0, 0, 0.15, 3, 0.15));
  }
  // end platform
  b.add(G.box, plank, T(base, 0, 0, length + 1.5, 0, 0, 0, width * 2.2, 0.14, 3));
  for (const sx of [-1, 1]) for (const sz of [0, 3]) b.add(G.cyl6, '#6b4f3a', T(base, sx * width * 1.05, -0.9, length + sz, 0, 0, 0, 0.17, 2.6, 0.17));
  const end = new THREE.Vector3(0, 0, length + 1.5).applyMatrix4(base);
  const mid = new THREE.Vector3(0, 0, length / 2).applyMatrix4(base);
  return {
    platforms: [
      { x: mid.x, z: mid.z, hw: width / 2 + 0.1, hd: length / 2 + 0.2, rot, y: y + 0.07 },
      { x: end.x, z: end.z, hw: width * 1.1 + 0.1, hd: 1.6, rot, y: y + 0.07 },
    ],
    end,
  };
}

export function lamppost(b, x, y, z, glowList) {
  const base = mat4(x, y, z);
  b.add(G.cyl6, '#3a3040', T(base, 0, 1.4, 0, 0, 0, 0, 0.07, 2.8, 0.07));
  b.add(G.box, '#3a3040', T(base, 0, 2.85, 0, 0, 0, 0, 0.5, 0.08, 0.5));
  b.add(G.box, '#ffe3a0', T(base, 0, 3.15, 0, 0, 0, 0, 0.36, 0.5, 0.36), { kind: 'glow' });
  b.add(G.cone4, '#3a3040', T(base, 0, 3.55, 0, 0, Math.PI / 4, 0, 0.42, 0.35, 0.42));
  glowList?.push(new THREE.Vector3(x, y + 3.15, z));
  return { r: 0.25 };
}

export function torch(b, x, y, z, glowList) {
  const base = mat4(x, y, z);
  b.add(G.cyl6, '#7a5a40', T(base, 0, 0.9, 0, 0, 0, 0, 0.08, 1.8, 0.08));
  b.add(G.cyl6, '#5a4030', T(base, 0, 1.85, 0, 0, 0, 0, 0.16, 0.25, 0.16));
  b.add(G.cone6, '#ffb347', T(base, 0, 2.15, 0, 0, 0, 0, 0.14, 0.45, 0.14), { kind: 'glow' });
  glowList?.push(new THREE.Vector3(x, y + 2.1, z));
  return { r: 0.2 };
}

export function lighthouse(b, x, y, z, glowList) {
  const base = mat4(x, y, z);
  b.add(G.cyl12, '#9a9aa6', T(base, 0, 0.4, 0, 0, 0, 0, 2.6, 0.8, 2.6));
  const bands = 6;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const r = 1.9 - t * 0.7;
    b.add(G.cyl12, i % 2 ? '#d9534f' : '#f7f2e6', T(base, 0, 0.8 + i * 1.5 + 0.75, 0, 0, 0, 0, r, 1.5, r));
  }
  const top = 0.8 + bands * 1.5;
  b.add(G.cyl12, '#3a3040', T(base, 0, top + 0.1, 0, 0, 0, 0, 1.6, 0.2, 1.6));
  b.add(G.cyl8, '#fff2b0', T(base, 0, top + 0.9, 0, 0, 0, 0, 0.8, 1.4, 0.8), { kind: 'glow' });
  b.add(G.cone8, '#d9534f', T(base, 0, top + 2.1, 0, 0, 0, 0, 1.15, 1.0, 1.15));
  b.add(G.box, '#ffffff', T(base, 0, 0.8 + 1.0, 1.95, 0, 0, 0, 0.9, 1.7, 0.1));
  glowList?.push(new THREE.Vector3(x, y + top + 0.9, z));
  return { r: 2.4, top: y + top + 0.9 };
}

export function well(b, x, y, z) {
  const base = mat4(x, y, z);
  b.add(G.cyl12, '#a7a3a8', T(base, 0, 0.45, 0, 0, 0, 0, 1.3, 0.9, 1.3));
  b.add(G.cyl12, '#5fb4c4', T(base, 0, 0.85, 0, 0, 0, 0, 1.05, 0.1, 1.05), { kind: 'plain' });
  for (const sx of [-1, 1]) b.add(G.box, '#7a5a40', T(base, sx * 1.1, 1.7, 0, 0, 0, 0, 0.18, 1.8, 0.18));
  b.add(G.cone4, '#c8604a', T(base, 0, 2.9, 0, 0, Math.PI / 4, 0, 1.9, 0.9, 1.9));
  return { r: 1.5 };
}

export function board(b, x, y, z, rot = 0) {
  const base = mat4(x, y, z, 0, rot, 0);
  for (const sx of [-1, 1]) b.add(G.box, '#7a5a40', T(base, sx * 1.1, 1.1, 0, 0, 0, 0, 0.18, 2.2, 0.18));
  b.add(G.box, '#c49a70', T(base, 0, 1.6, 0, 0, 0, 0, 2.4, 1.3, 0.12));
  b.add(G.box, '#fbf3e2', T(base, -0.5, 1.7, 0.08, 0, 0, 0.08, 0.7, 0.8, 0.02));
  b.add(G.box, '#ffe9a8', T(base, 0.45, 1.55, 0.08, 0, 0, -0.06, 0.65, 0.7, 0.02));
  b.add(G.cone4, '#c8604a', T(base, 0, 2.5, 0, 0, Math.PI / 4, 0, 1.9, 0.5, 0.5));
  return { collider: { type: 'box', x, z, hw: 1.3, hd: 0.3, rot } };
}

export function signpost(b, x, y, z, rot = 0) {
  const base = mat4(x, y, z, 0, rot, 0);
  b.add(G.box, '#7a5a40', T(base, 0, 0.9, 0, 0, 0, 0, 0.14, 1.8, 0.14));
  b.add(G.box, '#c49a70', T(base, 0.4, 1.5, 0, 0, 0, 0.05, 1.0, 0.3, 0.08));
  b.add(G.box, '#c49a70', T(base, -0.35, 1.1, 0, 0, 0, -0.05, 0.9, 0.28, 0.08));
}

export function fence(b, x1, z1, x2, z2, heightAt, color = '#c8a77a') {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.round(len / 1.6));
  const rot = Math.atan2(x2 - x1, z2 - z1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    const y = heightAt(x, z);
    b.add(G.box, color, mat4(x, y + 0.5, z, 0, rot, 0, 0.16, 1.0, 0.16));
    if (i < n) {
      const xm = x1 + (x2 - x1) * (t + 0.5 / n);
      const zm = z1 + (z2 - z1) * (t + 0.5 / n);
      const ym = heightAt(xm, zm);
      b.add(G.box, shade(color, 0.92), mat4(xm, ym + 0.7, zm, 0, rot, 0, 0.08, 0.12, len / n));
      b.add(G.box, shade(color, 0.92), mat4(xm, ym + 0.35, zm, 0, rot, 0, 0.08, 0.12, len / n));
    }
  }
}

export function tent(b, x, y, z, rot = 0, color = '#e8dcc0', stripe = '#c8604a') {
  const base = mat4(x, y, z, 0, rot, 0);
  b.add(G.cone4, color, T(base, 0, 1.25, 0, 0, Math.PI / 4, 0, 2.2, 2.5, 2.2));
  b.add(G.box, stripe, T(base, 0, 0.7, 1.15, 0.47, 0, 0, 0.9, 1.3, 0.05));
  b.add(G.cyl6, '#7a5a40', T(base, 0, 2.6, 0, 0, 0, 0, 0.05, 0.6, 0.05));
  return { collider: { type: 'circle', x, z, r: 1.7 } };
}

export function campfire(b, x, y, z, glowList) {
  const base = mat4(x, y, z);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    b.add(G.rock, '#7f7f8a', T(base, Math.cos(a) * 0.65, 0.1, Math.sin(a) * 0.65, 0, a, 0, 0.22), { flat: true });
  }
  b.add(G.box, '#6b4a2e', T(base, 0, 0.15, 0, 0, 0.5, 0.2, 0.9, 0.14, 0.14));
  b.add(G.box, '#5a3c26', T(base, 0, 0.18, 0, 0, -0.6, -0.2, 0.9, 0.14, 0.14));
  b.add(G.cone6, '#ff9a3c', T(base, 0, 0.55, 0, 0, 0, 0, 0.32, 0.8, 0.32), { kind: 'glow' });
  b.add(G.cone6, '#ffe07a', T(base, 0.05, 0.45, 0.05, 0, 0, 0, 0.17, 0.5, 0.17), { kind: 'glow' });
  glowList?.push(new THREE.Vector3(x, y + 0.6, z));
  return { r: 0.8 };
}

/**
 * The homestead kitchen: an open-fronted cottage kitchen with a tiled floor, blue
 * cabinets, shelves of jars, hanging pans and a big brick oven with a chimney.
 * Front (open side) faces +Z before rotation.
 */
export function kitchen(b, x, y, z, rot = 0, glowList) {
  const base = mat4(x, y, z, 0, rot, 0);
  const W = 5.2;
  const D = 4.2;
  // tiled floor
  b.add(G.box, '#e9dcc4', T(base, 0, 0.1, 0, 0, 0, 0, W, 0.2, D));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) b.add(G.box, '#7a8fb8', T(base, -W / 2 + 0.43 + i * 0.87, 0.21, -D / 2 + 0.42 + j * 0.84, 0, 0, 0, 0.8, 0.02, 0.78));
  // back + left walls (light blue, cream wainscot)
  b.add(G.box, '#bcd9ea', T(base, 0, 1.55, -D / 2 + 0.1, 0, 0, 0, W, 2.7, 0.2));
  b.add(G.box, '#f4e7c9', T(base, 0, 0.65, -D / 2 + 0.22, 0, 0, 0, W - 0.1, 0.9, 0.06));
  b.add(G.box, '#bcd9ea', T(base, -W / 2 + 0.1, 1.55, 0, 0, 0, 0, 0.2, 2.7, D));
  b.add(G.box, '#f4e7c9', T(base, -W / 2 + 0.22, 0.65, 0, 0, 0, 0, 0.06, 0.9, D - 0.1));
  // wooden frame posts & beams
  for (const [px, pz] of [[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2]]) b.add(G.box, '#8a6040', T(base, px, 1.5, pz, 0, 0, 0, 0.22, 3, 0.22));
  b.add(G.box, '#8a6040', T(base, 0, 2.95, D / 2, 0, 0, 0, W + 0.2, 0.2, 0.22));
  // slanted roof (high at the back, open to the front)
  b.add(G.box, '#d9734f', T(base, 0, 3.25, -0.1, 0.18, 0, 0, W + 0.8, 0.16, D + 0.7));
  b.add(G.box, '#b8553f', T(base, 0, 3.17, -0.1, 0.18, 0, 0, W + 0.9, 0.06, D + 0.8));
  // window on the back wall
  b.add(G.box, '#fbf3e2', T(base, -1.2, 1.9, -D / 2 + 0.22, 0, 0, 0, 1.1, 0.8, 0.05));
  b.add(G.box, '#9fd4ec', T(base, -1.2, 1.9, -D / 2 + 0.25, 0, 0, 0, 0.9, 0.62, 0.04));
  // blue cabinets + worktop along the back
  b.add(G.box, '#5f93b8', T(base, -1.05, 0.5, -D / 2 + 0.55, 0, 0, 0, 2.6, 0.8, 0.7));
  b.add(G.box, '#f4f1e8', T(base, -1.05, 0.93, -D / 2 + 0.55, 0, 0, 0, 2.7, 0.08, 0.78));
  for (let i = 0; i < 3; i++) b.add(G.box, '#4a7aa0', T(base, -1.9 + i * 0.85, 0.5, -D / 2 + 0.91, 0, 0, 0, 0.7, 0.62, 0.03));
  // pot & kettle on the worktop
  b.add(G.cyl8, '#d9d9e0', T(base, -1.7, 1.12, -D / 2 + 0.55, 0, 0, 0, 0.22, 0.3, 0.22));
  b.add(G.cyl8, '#e2434b', T(base, -0.7, 1.08, -D / 2 + 0.55, 0, 0, 0, 0.17, 0.22, 0.17));
  b.add(G.sphere, '#7fb36b', T(base, -0.15, 1.05, -D / 2 + 0.5, 0, 0, 0, 0.14));
  b.add(G.sphere, '#f29a2e', T(base, 0.1, 1.05, -D / 2 + 0.6, 0, 0, 0, 0.12));
  // hanging pans
  for (let i = 0; i < 3; i++) {
    b.add(G.cyl12, '#5a5464', T(base, -2 + i * 0.5, 2.2 - i * 0.08, -D / 2 + 0.24, Math.PI / 2, 0, 0, 0.18 - i * 0.02, 0.04, 0.18 - i * 0.02));
    b.add(G.box, '#5a5464', T(base, -2 + i * 0.5, 2.45 - i * 0.08, -D / 2 + 0.24, 0, 0, 0, 0.04, 0.3, 0.04));
  }
  // shelves of jars on the left wall
  for (let r = 0; r < 2; r++) {
    b.add(G.box, '#a87a50', T(base, -W / 2 + 0.38, 1.45 + r * 0.6, -0.3, 0, 0, 0, 0.36, 0.06, 1.8));
    for (let k = 0; k < 5; k++) b.add(G.cyl8, ['#e2434b', '#f2d23a', '#7fb36b', '#f29a2e', '#b06b9a'][(k + r * 2) % 5], T(base, -W / 2 + 0.38, 1.62 + r * 0.6, -1 + k * 0.35, 0, 0, 0, 0.1, 0.24, 0.1));
  }
  // big brick oven with a fire inside, and its chimney
  b.add(G.box, '#b8553f', T(base, 1.45, 0.45, -0.95, 0, 0, 0, 2.0, 0.7, 1.9));
  b.add(G.sphereHi, '#c8604a', T(base, 1.45, 0.85, -0.95, 0, 0, 0, 1.0, 0.95, 0.95));
  b.add(G.cyl12, '#2a2534', T(base, 1.45, 0.95, -0.02, Math.PI / 2, 0, 0, 0.42, 0.1, 0.36));
  b.add(G.sphere, '#ff9a3c', T(base, 1.45, 0.88, -0.25, 0, 0, 0, 0.25, 0.18, 0.12), { kind: 'glow' });
  b.add(G.box, '#a8473a', T(base, 1.6, 2.6, -1.6, 0, 0, 0, 0.7, 3.2, 0.7));
  b.add(G.box, '#7a3328', T(base, 1.6, 4.25, -1.6, 0, 0, 0, 0.85, 0.15, 0.85));
  // rug & stool
  b.add(G.box, '#e0e4f2', T(base, -0.6, 0.23, 0.9, 0, 0, 0, 1.6, 0.03, 1.0));
  b.add(G.cyl8, '#a87a50', T(base, 0.6, 0.45, 1.0, 0, 0, 0, 0.25, 0.45, 0.25));
  glowList?.push(new THREE.Vector3().setFromMatrixPosition(T(base, 1.45, 0.9, 0)));
  const chimney = new THREE.Vector3().setFromMatrixPosition(T(base, 1.6, 4.4, -1.6));
  const front = new THREE.Vector3().setFromMatrixPosition(T(base, 0, 0, D / 2 + 0.9));
  const signPos = new THREE.Vector3().setFromMatrixPosition(T(base, -0.6, 3.2, D / 2 + 0.2));
  // walls block, the open front doesn't
  const colliders = [
    { type: 'box', ...xz(T(base, 0, 0, -D / 2 + 0.6)), hw: W / 2 + 0.1, hd: 0.7, rot },
    { type: 'box', ...xz(T(base, -W / 2 + 0.3, 0, 0)), hw: 0.4, hd: D / 2, rot },
    { type: 'box', ...xz(T(base, 1.45, 0, -0.8)), hw: 1.1, hd: 1.1, rot },
  ];
  return { front, chimney, signPos, rot, colliders };
}
function xz(m) {
  const v = new THREE.Vector3().setFromMatrixPosition(m);
  return { x: v.x, z: v.z };
}

/** A small fenced animal pen with a shelter in the back. kind: coop | barn | hives | sty | fold */
export function pen(b, x, y, z, w, d, kind, heightAt) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const col = '#d8b88a';
  // gate on the north side (towards the farm), shelter at the back
  fence(b, x0, z1, x1, z1, heightAt, col);
  fence(b, x0, z0, x0, z1, heightAt, col);
  fence(b, x1, z0, x1, z1, heightAt, col);
  fence(b, x0, z0, x - 0.9, z0, heightAt, col);
  fence(b, x + 0.9, z0, x1, z0, heightAt, col);
  // ground: straw for most animals, grass for bees and sheep
  b.add(G.box, kind === 'hives' || kind === 'fold' ? '#8fc47a' : '#e3c98a', mat4(x, y + 0.05, z, 0, 0, 0, w - 0.3, 0.06, d - 0.3), { kind: 'plain' });
  const sx = x;
  const sz = z1 - 0.95;
  const roof = { coop: '#d9534f', barn: '#c8473a', sty: '#e88aa8', fold: '#8a7a6a', goat: '#6a8a5a' }[kind];
  if (kind === 'hives') {
    for (let i = 0; i < 3; i++) {
      const hx = x - w / 2 + 0.9 + i * ((w - 1.8) / 2);
      b.add(G.box, '#8a6040', mat4(hx, y + 0.2, sz - 0.3, 0, 0, 0, 0.7, 0.4, 0.7));
      for (let k = 0; k < 3; k++) b.add(G.box, k % 2 ? '#f2c94c' : '#e8b520', mat4(hx, y + 0.55 + k * 0.3, sz - 0.3, 0, 0, 0, 0.62, 0.28, 0.62));
      b.add(G.cone4, '#a87a50', mat4(hx, y + 1.6, sz - 0.3, 0, Math.PI / 4, 0, 0.55, 0.35, 0.55));
    }
  } else {
    const big = kind === 'barn';
    const sw = Math.min(w - 0.6, big ? 3.2 : 2.4);
    b.add(G.box, kind === 'barn' ? '#c8473a' : '#e8d8b8', mat4(sx, y + 0.75, sz, 0, 0, 0, sw, 1.5, 1.4));
    b.add(G.box, '#f4f1e8', mat4(sx, y + 0.75, sz - 0.71, 0, 0, 0, sw * 0.4, 1.1, 0.04));
    b.add(G.box, '#3a2a2a', mat4(sx, y + 0.55, sz - 0.72, 0, 0, 0, sw * 0.3, 0.8, 0.04));
    b.add(G.box, roof, mat4(sx, y + 1.65, sz - 0.05, 0.45, 0, 0, sw + 0.3, 0.12, 1.0));
    b.add(G.box, roof, mat4(sx, y + 1.65, sz + 0.45, -0.45, 0, 0, sw + 0.3, 0.12, 1.0));
    // feeding trough
    b.add(G.box, '#8a6040', mat4(x1 - 0.8, y + 0.25, z0 + 0.6, 0, 0, 0, 1.0, 0.3, 0.4));
    b.add(G.box, '#e3c25a', mat4(x1 - 0.8, y + 0.38, z0 + 0.6, 0, 0, 0, 0.85, 0.06, 0.28));
  }
}

/** A run-down pen: leaning, broken fence posts, a collapsed shelter and scattered planks. */
export function penRuined(b, x, y, z, w, d, heightAt, rnd = Math.random) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const posts = [];
  for (const [ax, az, bx, bz] of [[x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1], [x0, z0, x1, z0]]) {
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 1.6));
    for (let i = 0; i <= n; i++) posts.push([ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n]);
  }
  for (const [px, pz] of posts) {
    if (rnd() < 0.3) continue; // missing post
    const h = 0.4 + rnd() * 0.6;
    b.add(G.box, '#9a8a72', mat4(px, heightAt(px, pz) + h / 2, pz, (rnd() - 0.5) * 0.6, rnd(), (rnd() - 0.5) * 0.6, 0.16, h, 0.16));
  }
  // a couple of fallen rails
  for (let i = 0; i < 3; i++) {
    const px = x0 + rnd() * w;
    const pz = z0 + rnd() * d;
    b.add(G.box, '#8a7a62', mat4(px, heightAt(px, pz) + 0.06, pz, 0, rnd() * 3, 0, 1.4, 0.08, 0.12));
  }
  // collapsed shelter at the back: low broken walls, roof slumped on the ground
  const sz = z1 - 0.95;
  b.add(G.box, '#a89a80', mat4(x - 0.6, y + 0.35, sz, 0, 0, 0.1, 1.2, 0.7, 1.2));
  b.add(G.box, '#a89a80', mat4(x + 0.7, y + 0.2, sz + 0.1, 0, 0.2, -0.2, 0.9, 0.4, 1.1));
  b.add(G.box, '#7a5a4a', mat4(x, y + 0.5, sz - 0.2, 0.5, 0.3, 0.25, 2.2, 0.1, 1.0));
  b.add(G.box, '#6a4a3a', mat4(x + 0.3, y + 0.15, sz - 0.9, 0, 0.8, 0.1, 1.0, 0.08, 0.5));
  // weeds
  for (let i = 0; i < 6; i++) {
    const px = x0 + 0.3 + rnd() * (w - 0.6);
    const pz = z0 + 0.3 + rnd() * (d - 0.6);
    b.add(G.cone4, '#7a9a4a', mat4(px, heightAt(px, pz) + 0.2, pz, 0, rnd(), 0, 0.12, 0.4, 0.12));
  }
}

/** An empty building site: corner stakes with rope and a patch of dug earth. */
export function penSite(b, x, y, z, w, d, heightAt) {
  b.add(G.box, '#b89a6a', mat4(x, y + 0.03, z, 0, 0, 0, w - 0.6, 0.05, d - 0.6), { kind: 'plain' });
  const c = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]];
  for (const [px, pz] of c) b.add(G.box, '#c8a77a', mat4(px, heightAt(px, pz) + 0.35, pz, 0, 0, 0, 0.1, 0.7, 0.1));
  for (let i = 0; i < 4; i++) {
    const [ax, az] = c[i];
    const [bx, bz] = c[(i + 1) % 4];
    const len = Math.hypot(bx - ax, bz - az);
    b.add(G.box, '#e8dcc0', mat4((ax + bx) / 2, y + 0.55, (az + bz) / 2, 0, Math.atan2(bx - ax, bz - az), 0, 0.03, 0.03, len), { kind: 'plain' });
  }
  // a small pile of lumber waiting
  for (let i = 0; i < 3; i++) b.add(G.box, '#a87a50', mat4(x + 0.6, y + 0.12 + i * 0.12, z + 0.6, 0, 0.2 * i, 0, 1.2, 0.1, 0.25));
}

/** The animal feeder: a hopper on legs above a trough. fill = 0..1 shows how much feed is inside. */
export function feeder(b, x, y, z, fill = 0) {
  for (const [dx, dz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) b.add(G.box, '#7a5a3a', mat4(x + dx, y + 0.6, z + dz, 0, 0, 0, 0.12, 1.2, 0.12));
  b.add(G.box, '#a87a50', mat4(x, y + 1.35, z, 0, 0, 0, 1.6, 0.8, 0.9));
  b.add(G.box, '#c8473a', mat4(x, y + 1.85, z, 0, 0, 0, 1.8, 0.14, 1.1));
  b.add(G.box, '#8a6040', mat4(x, y + 0.35, z + 0.75, 0, 0, 0, 1.7, 0.3, 0.5));
  if (fill > 0) b.add(G.box, '#e3c25a', mat4(x, y + 0.5, z + 0.75, 0, 0, 0, 1.55, 0.06, 0.38), { kind: 'plain' });
  b.add(G.box, '#f4e7c9', mat4(x, y + 1.35, z + 0.46, 0, 0, 0, 1.0, 0.45 * Math.max(0.15, fill), 0.02), { kind: 'plain' });
}

export function crate(b, x, y, z, s = 0.8, rot = 0) {
  b.add(G.box, '#a98060', mat4(x, y + s / 2, z, 0, rot, 0, s));
  b.add(G.box, '#7a5a40', mat4(x, y + s / 2, z, 0, rot, 0, s * 1.02, s * 0.15, s * 1.02));
  return { r: s * 0.7 };
}

export function barrel(b, x, y, z, s = 1) {
  b.add(G.cyl8, '#8a5a3a', mat4(x, y + 0.5 * s, z, 0, 0, 0, 0.4 * s, 1 * s, 0.4 * s));
  b.add(G.cyl8, '#3a3040', mat4(x, y + 0.25 * s, z, 0, 0, 0, 0.42 * s, 0.07, 0.42 * s));
  b.add(G.cyl8, '#3a3040', mat4(x, y + 0.75 * s, z, 0, 0, 0, 0.42 * s, 0.07, 0.42 * s));
  return { r: 0.45 * s };
}

export function coral(b, x, y, z, rnd = Math.random) {
  const colors = ['#ff7f91', '#ffb36b', '#c48ad6', '#7fd3c9', '#f2d640'];
  const c = colors[Math.floor(rnd() * colors.length)];
  const base = mat4(x, y, z, 0, rnd() * 6, 0);
  const kind = rnd();
  if (kind < 0.5) {
    for (let i = 0; i < 4; i++) {
      const a = rnd() * 6;
      b.add(G.cyl6, c, T(base, Math.cos(a) * 0.3, 0.5, Math.sin(a) * 0.3, Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4, 0.12, 1.1 + rnd() * 0.6, 0.12), { kind: 'plain' });
    }
  } else {
    b.add(G.sphere, c, T(base, 0, 0.3, 0, 0, 0, 0, 0.7, 0.5, 0.7), { kind: 'plain' });
  }
}

export function shipwreck(b, x, y, z, rot = 0) {
  const base = mat4(x, y, z, 0.12, rot, 0.25);
  const wood = '#5a4030';
  b.add(G.box, wood, T(base, 0, 1.0, 0, 0, 0, 0, 4.4, 2.2, 11));
  b.add(G.box, shade(wood, 0.8), T(base, 0, 2.2, -4.6, 0, 0, 0, 3.6, 1.2, 2));
  b.add(G.cone4, wood, T(base, 0, 1.0, 6.4, Math.PI / 2, Math.PI / 4, 0, 2.6, 2.4, 1.6));
  b.add(G.cyl6, '#4a3428', T(base, 0, 5.5, 0.5, 0.3, 0, 0.15, 0.2, 7, 0.2));
  b.add(G.box, '#d8d0bc', T(base, 0.3, 6.0, 0.6, 0.3, 0.2, 0.15, 0.05, 3.2, 2.8));
  return { collider: { type: 'box', x, z, hw: 2.4, hd: 6, rot } };
}

export function skullRock(b, x, y, z, s = 1) {
  const base = mat4(x, y, z, 0, 0, 0, s);
  b.add(G.sphere, '#bdb6a8', T(base, 0, 4, 0, 0, 0, 0, 5, 4.6, 4.5), { flat: true });
  b.add(G.box, '#bdb6a8', T(base, 0, 1.2, 0.6, 0, 0, 0, 5, 2.6, 4), { flat: true });
  for (const sx of [-1, 1]) b.add(G.sphere, '#2a2534', T(base, sx * 1.7, 4.6, 3.6, 0, 0, 0, 1.2, 1.4, 0.8));
  b.add(G.cone4, '#2a2534', T(base, 0, 3.0, 4.0, Math.PI, 0, 0, 0.6, 0.9, 0.4));
  for (let i = -2; i <= 2; i++) b.add(G.box, '#f2ece0', T(base, i * 0.75, 1.9, 2.65, 0, 0, 0, 0.55, 0.8, 0.3));
  return { collider: { type: 'circle', x, z, r: 5 * s } };
}

export function hotSpring(b, x, y, z) {
  const base = mat4(x, y, z);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.add(G.rock, '#6f6a72', T(base, Math.cos(a) * 3.1, 0.15, Math.sin(a) * 3.1, 0, a, 0, 0.7, 0.5, 0.6), { flat: true });
  }
  b.add(G.cyl12, '#8fe0d6', T(base, 0, 0.12, 0, 0, 0, 0, 2.9, 0.12, 2.9), { kind: 'plain' });
}

export function flag(b, x, y, z, color = '#d9534f', h = 4) {
  b.add(G.cyl6, '#e8e2d4', mat4(x, y + h / 2, z, 0, 0, 0, 0.06, h, 0.06));
  b.add(G.box, color, mat4(x + 0.55, y + h - 0.4, z, 0, 0, 0, 1.1, 0.7, 0.04));
}

export function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * f);
  c.g = Math.min(1, c.g * f);
  c.b = Math.min(1, c.b * f);
  return c;
}

// ─── Dynamic (non-batched) models ────────────────────────────────

/** Player's boat model, by tier. */
export function boatModel(tier) {
  const g = new THREE.Group();
  if (tier <= 0) return g;
  if (tier === 1) {
    for (let i = 0; i < 6; i++) {
      const log = inked(new THREE.CylinderGeometry(0.22, 0.22, 4.2, 8), i % 2 ? '#c9a65b' : '#b8944c', 0.025);
      log.rotation.x = Math.PI / 2;
      log.position.set(-1.1 + i * 0.44, 0.15, 0);
      g.add(log);
    }
    const mast = inked(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), '#7a5a40', 0.02);
    mast.position.set(0, 1.3, -0.5);
    g.add(mast);
    const sail = inked(new THREE.BoxGeometry(0.04, 1.6, 1.4), '#f4ecd8', 0.02);
    sail.position.set(0.05, 1.5, -0.1);
    g.add(sail);
    return g;
  }
  const big = tier === 3;
  const L = big ? 9 : 6;
  const W = big ? 3.4 : 2.2;
  const hullColor = big ? '#5a3a2a' : '#f2ece0';
  const hull = inked(new THREE.BoxGeometry(W, 1.2, L), hullColor, 0.03);
  hull.position.y = 0.3;
  g.add(hull);
  const bow = inked(new THREE.ConeGeometry(W / 2, 2.2, 4), hullColor, 0.03);
  bow.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  bow.scale.set(1, 1, 0.55);
  bow.position.set(0, 0.3, L / 2 + 1.0);
  g.add(bow);
  const stripe = inked(new THREE.BoxGeometry(W + 0.05, 0.2, L), big ? '#c8a040' : '#3f8fa6', 0);
  stripe.position.y = 0.75;
  g.add(stripe);
  const masts = big ? [-2, 1.8] : [0];
  for (const mz of masts) {
    const h = big ? 7 : 5;
    const mast = inked(new THREE.CylinderGeometry(0.1, 0.12, h, 6), '#6b4f3a', 0.02);
    mast.position.set(0, h / 2 + 0.8, mz);
    g.add(mast);
    const sail = inked(new THREE.BoxGeometry(big ? 3.4 : 0.06, big ? 3.2 : 3.6, big ? 0.08 : 2.6), big ? '#2a2534' : '#fbf3e2', 0.02);
    sail.position.set(0, h * 0.58 + 0.8, mz + (big ? 0 : 1.2));
    g.add(sail);
  }
  if (big) {
    const flagM = inked(new THREE.BoxGeometry(0.04, 0.6, 1.0), '#d9534f', 0);
    flagM.position.set(0, 8.4, -1.5);
    g.add(flagM);
  }
  return g;
}

export function glowSprite(pos, color = '#ffd98a', size = 3) {
  const mat = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const s = new THREE.Sprite(mat);
  s.position.copy(pos);
  s.scale.setScalar(size);
  return s;
}

export { T as compose };
export { withOutline, toon };
