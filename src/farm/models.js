import { G, mat4 } from '../world/toon.js';
import { CROPS } from './crops.js';
import * as P from '../world/props.js';
import { fence } from '../world/props.js';
import { seeded } from '../shared/utils.js';

// 3D models for the farm: animal pens (built, ruined, empty site), the feeder and growing crops.

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

/** Adds one crop (at its growth stage) to the farm's batched mesh. */
export function cropModel(b, p, pos) {
  const c = CROPS[p.crop];
  const x = pos.x;
  const z = pos.z;
  const y = pos.y + 0.15;
  const at = (dx, dy, dz, sx, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => mat4(x + dx, y + dy, z + dz, rx, ry, rz, sx, sy, sz);
  const stage = p.progress >= 1 ? 3 : p.progress > 0.5 ? 2 : p.progress > 0.15 ? 1 : 0;
  const leaf = '#5f9a5c';
  const ripe = stage === 3 && (p.ready || !c.regrow);
  if (stage === 0) {
    for (let i = 0; i < 3; i++) b.add(G.cone4, '#7bb36b', at((i - 1) * 0.3, 0.12, (i % 2) * 0.25 - 0.12, 0.06, 0.25, 0.06));
    return;
  }
  if (c.kind === 'tree') {
    const sc = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.85;
    const rnd = seeded(x * 13.1 + z * 7.7);
    if (c.tree === 'palm' || c.tree === 'banana') P.palm(b, x, pos.y, z, sc, rnd, c.tree === 'banana' ? { leaf: '#7fbf6a' } : undefined);
    else P.roundTree(b, x, pos.y, z, sc, rnd, { fruit: null, leaf: p.crop === 'cherry' ? '#6fa86a' : undefined });
    if (p.ready) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        b.add(G.sphere, c.color, at(Math.cos(a) * 1.25 * sc, (c.tree === 'round' ? 2.8 : 5.4) * sc + (i % 2) * 0.3, Math.sin(a) * 1.25 * sc, 0.17));
      }
    }
    return;
  }
  const h = stage === 1 ? 0.35 : stage === 2 ? 0.6 : 0.75;
  const grid = (fn) => {
    for (let i = 0; i < 4; i++) fn((i % 2) * 0.8 - 0.4, Math.floor(i / 2) * 0.8 - 0.4, i);
  };
  switch (c.kind) {
    case 'cane':
      grid((dx, dz) => b.add(G.cyl6, ripe ? '#b8c46a' : '#8fbf7a', at(dx * 0.6, h * 1.1, dz * 0.6, 0.06, h * 2.2, 0.06)));
      break;
    case 'stalk': {
      // wheat, corn & rice: rows of stalks with golden heads when ripe
      const tall = p.crop === 'corn' ? 1.5 : 1;
      for (let i = 0; i < 9; i++) {
        const dx = (i % 3) * 0.55 - 0.55;
        const dz = Math.floor(i / 3) * 0.55 - 0.55;
        b.add(G.cyl6, ripe ? '#c8b45a' : '#7fb36b', at(dx, h * 0.6 * tall, dz, 0.03, h * 1.2 * tall, 0.03));
        if (stage >= 2) b.add(p.crop === 'corn' ? G.sphere : G.cone4, ripe ? c.color : '#9fc47a', at(dx, h * 1.25 * tall, dz, p.crop === 'corn' ? 0.08 : 0.06, p.crop === 'corn' ? 0.18 : 0.16, p.crop === 'corn' ? 0.08 : 0.06));
      }
      break;
    }
    case 'root':
      // leafy tops with the root peeking out of the soil
      grid((dx, dz) => {
        b.add(G.cone4, '#6faa5c', at(dx, 0.18 * h + 0.1, dz, 0.1, 0.4 * h + 0.1, 0.1));
        b.add(G.cone4, '#7fbf6a', at(dx + 0.08, 0.15 * h + 0.08, dz + 0.05, 0.07, 0.3 * h + 0.1, 0.07, 0, 0, 0.4));
        if (ripe) b.add(G.sphere, c.color, at(dx, 0.02, dz, 0.13, p.crop === 'carrot' ? 0.1 : 0.11, 0.13));
      });
      break;
    case 'leafy':
      grid((dx, dz) => {
        b.add(G.sphere, c.color, at(dx, 0.12 + h * 0.12, dz, 0.18 + h * 0.15, 0.14 + h * 0.1, 0.18 + h * 0.15));
        if (stage >= 2) b.add(G.sphere, leaf, at(dx + 0.06, 0.2 + h * 0.15, dz - 0.05, 0.1 + h * 0.08));
      });
      break;
    case 'cactus':
      b.add(G.cyl6, '#6faa5c', at(0, h * 0.9, 0, 0.18, h * 1.8, 0.18));
      if (ripe) for (const dx of [-0.25, 0.25]) b.add(G.sphere, c.color, at(dx, h * 1.6, 0.1, 0.17, 0.22, 0.17));
      break;
    default: {
      // bushes, pineapples and melons
      b.add(G.sphere, leaf, at(0, 0.3 * h + 0.1, 0, 0.45 * h + 0.15, (0.45 * h + 0.15) * (c.kind === 'pine' ? 1.5 : 0.8), 0.45 * h + 0.15));
      if (!ripe) break;
      if (c.kind === 'melon') {
        b.add(G.sphereHi, c.color, at(0.35, 0.25, 0.3, 0.38, 0.29, 0.32));
        b.add(G.sphereHi, c.color, at(-0.45, 0.2, -0.3, 0.28, 0.22, 0.26));
      } else if (c.kind === 'pine') {
        b.add(G.sphere, c.color, at(0, 0.85, 0, 0.22, 0.31, 0.22));
        b.add(G.cone6, '#5f9a5c', at(0, 1.25, 0, 0.12, 0.3, 0.12));
      } else {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          b.add(G.sphere, c.color, at(Math.cos(a) * 0.4, 0.35 + (i % 2) * 0.14, Math.sin(a) * 0.4, p.crop === 'pepper' ? 0.1 : 0.08, p.crop === 'pepper' ? 0.13 : 0.08));
        }
      }
    }
  }
}
