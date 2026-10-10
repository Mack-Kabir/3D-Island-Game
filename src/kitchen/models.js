import * as THREE from 'three';
import { G, mat4 } from '../world/toon.js';
import { compose as T, xz } from '../world/props.js';

// 3D models for your homestead kitchen: the finished kitchen and the ruin you start with.

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

/**
 * The homestead kitchen before Bob fixes it: cracked tiles, broken walls, a roof that
 * has caved in, a cold oven and a toppled chimney. Same footprint as kitchen().
 */
export function kitchenRuined(b, x, y, z, rot = 0) {
  const base = mat4(x, y, z, 0, rot, 0);
  const W = 5.2;
  const D = 4.2;
  // cracked floor with missing tiles and sand blown over it
  b.add(G.box, '#cfc2a8', T(base, 0, 0.1, 0, 0, 0, 0, W, 0.2, D));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0 && (i * 7 + j * 3) % 5 !== 1) b.add(G.box, '#6f7f9a', T(base, -W / 2 + 0.43 + i * 0.87, 0.21, -D / 2 + 0.42 + j * 0.84, 0, 0, 0, 0.8, 0.02, 0.78));
  b.add(G.box, '#e3cf9a', T(base, 1.2, 0.22, 1.2, 0, 0.4, 0, 1.8, 0.03, 1.1));
  // back wall: broken off, jagged top
  b.add(G.box, '#a9bccb', T(base, -1.3, 0.75, -D / 2 + 0.1, 0, 0, 0, 2.6, 1.3, 0.2));
  b.add(G.box, '#a9bccb', T(base, 0.6, 0.5, -D / 2 + 0.1, 0, 0, 0.12, 1.3, 0.8, 0.2));
  b.add(G.box, '#a9bccb', T(base, -0.4, 1.55, -D / 2 + 0.1, 0, 0, 0.3, 0.7, 0.5, 0.2));
  // left wall: only the lower half is left
  b.add(G.box, '#a9bccb', T(base, -W / 2 + 0.1, 0.55, -0.6, 0, 0, 0, 0.2, 0.9, 2.8));
  // one post still standing, one leaning, one fallen
  b.add(G.box, '#7a5a40', T(base, W / 2, 1.2, -D / 2, 0, 0, 0, 0.22, 2.4, 0.22));
  b.add(G.box, '#7a5a40', T(base, W / 2 - 0.3, 1.1, D / 2 - 0.2, 0.35, 0, -0.3, 0.22, 2.4, 0.22));
  b.add(G.box, '#6b4a34', T(base, -1.2, 0.33, D / 2 + 0.3, 0, 0.3, Math.PI / 2, 0.22, 2.8, 0.22));
  // the roof caved in: a broken slab slumped against the back wall, loose planks
  b.add(G.box, '#a8574a', T(base, -0.3, 0.9, -0.6, -0.55, 0.15, 0.1, 3.6, 0.14, 2.4));
  b.add(G.box, '#8f4a3e', T(base, 1.9, 0.35, 0.9, 0.2, 0.7, 0.15, 1.6, 0.1, 1.0));
  for (let i = 0; i < 4; i++) b.add(G.box, '#8a6a4a', T(base, -1.8 + i * 1.1, 0.27, 1.0 + (i % 2) * 0.6, 0, 0.4 + i * 0.7, 0, 1.3, 0.07, 0.16));
  // cold, cracked oven and a toppled chimney
  b.add(G.box, '#8f4f40', T(base, 1.45, 0.4, -0.95, 0, 0, 0, 2.0, 0.6, 1.9));
  b.add(G.sphereHi, '#9a5a4a', T(base, 1.45, 0.75, -0.95, 0, 0, 0.3, 0.95, 0.6, 0.9));
  b.add(G.cyl12, '#2a2534', T(base, 1.45, 0.82, -0.02, Math.PI / 2, 0, 0, 0.38, 0.1, 0.3));
  b.add(G.box, '#8f4038', T(base, 2.9, 0.4, -2.4, 0, 0.5, Math.PI / 2 - 0.1, 0.7, 2.2, 0.7));
  // scattered bricks, stones and a broken pot
  for (let i = 0; i < 7; i++) b.add(G.box, i % 2 ? '#a8473a' : '#8a8a94', T(base, -2 + ((i * 1.7) % 4.2), 0.28, -1.3 + ((i * 2.3) % 3), 0, i * 0.9, 0, 0.3, 0.16, 0.18));
  b.add(G.cyl8, '#6a6470', T(base, -1.6, 0.3, 0.2, 0.2, 0, Math.PI / 2, 0.22, 0.32, 0.22));
  // weeds pushing through
  for (let i = 0; i < 6; i++) b.add(G.cone6, '#6faa4a', T(base, -2.2 + i * 0.85, 0.35, 1.6 - (i % 3) * 1.2, 0, i, 0, 0.12, 0.35, 0.12));
  const front = new THREE.Vector3().setFromMatrixPosition(T(base, 0, 0, D / 2 + 0.9));
  const colliders = [
    { type: 'box', ...xz(T(base, 0, 0, -D / 2 + 0.6)), hw: W / 2 + 0.1, hd: 0.7, rot },
    { type: 'box', ...xz(T(base, -W / 2 + 0.3, 0, -0.6)), hw: 0.4, hd: 1.4, rot },
    { type: 'box', ...xz(T(base, 1.45, 0, -0.8)), hw: 1.1, hd: 1.1, rot },
  ];
  return { front, chimney: null, signPos: null, rot, colliders };
}
