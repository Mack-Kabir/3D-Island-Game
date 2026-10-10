import * as THREE from 'three';
import { inked } from '../world/toon.js';

const geo = {
  sphere: new THREE.SphereGeometry(1, 12, 9),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 6),
};
function part(group, g, color, [x, y, z], [sx, sy, sz], o = 0.02) {
  const m = inked(g, color, o);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  group.add(m);
  return m;
}
function eyes(group, y, z, spread, r = 0.035) {
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(geo.sphere, new THREE.MeshBasicMaterial({ color: '#2a2534' }));
    e.position.set(spread * s, y, z);
    e.scale.setScalar(r);
    group.add(e);
  }
}

/** Cute toon farm animals. userData.head bobs; userData.kind drives the idle animation. */
export function animalModel(type) {
  const g = new THREE.Group();
  const head = new THREE.Group();
  g.add(head);
  g.userData = { head, kind: type, phase: Math.random() * 10 };
  switch (type) {
    case 'chicken': {
      part(g, geo.sphere, '#fbf7ee', [0, 0.32, 0], [0.24, 0.22, 0.3]);
      part(g, geo.cone, '#fbf7ee', [0, 0.42, -0.3], [0.12, 0.22, 0.08]).rotation.x = -0.9;
      for (const s of [-1, 1]) part(g, geo.cyl, '#f2a03a', [0.08 * s, 0.07, 0], [0.02, 0.14, 0.02], 0.006);
      head.position.set(0, 0.5, 0.2);
      part(head, geo.sphere, '#fbf7ee', [0, 0.06, 0.04], [0.13, 0.13, 0.13]);
      part(head, geo.cone, '#f2a03a', [0, 0.04, 0.2], [0.04, 0.08, 0.04], 0.006).rotation.x = Math.PI / 2;
      part(head, geo.sphere, '#e2434b', [0, 0.18, 0.04], [0.04, 0.07, 0.07], 0.006);
      part(head, geo.sphere, '#e2434b', [0, -0.04, 0.14], [0.025, 0.05, 0.025], 0.004);
      eyes(head, 0.09, 0.13, 0.07, 0.022);
      break;
    }
    case 'cow': {
      part(g, geo.box, '#fbf7ee', [0, 0.85, 0], [0.75, 0.6, 1.3]);
      for (const [x, z, s] of [[0.2, 0.2, 0.32], [-0.25, -0.3, 0.28], [0.1, -0.45, 0.2]]) part(g, geo.sphere, '#2f2a33', [x > 0 ? 0.38 : -0.38, 0.92, z], [0.02, s, s], 0);
      for (const [x, z] of [[-0.25, 0.45], [0.25, 0.45], [-0.25, -0.45], [0.25, -0.45]]) part(g, geo.box, '#fbf7ee', [x, 0.3, z], [0.16, 0.6, 0.16], 0.012);
      part(g, geo.sphere, '#f29ab0', [0, 0.5, -0.2], [0.18, 0.1, 0.18], 0.01);
      head.position.set(0, 1.0, 0.75);
      part(head, geo.box, '#fbf7ee', [0, 0.05, 0.12], [0.46, 0.42, 0.4]);
      part(head, geo.box, '#f2b8c6', [0, -0.08, 0.36], [0.4, 0.22, 0.14], 0.012);
      for (const s of [-1, 1]) {
        part(head, geo.cone, '#e8dcc0', [0.17 * s, 0.32, 0.08], [0.05, 0.16, 0.05], 0.008);
        part(head, geo.box, '#2f2a33', [0.3 * s, 0.12, 0.08], [0.16, 0.08, 0.1], 0.008);
      }
      eyes(head, 0.12, 0.33, 0.12, 0.035);
      break;
    }
    case 'sheep': {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        part(g, geo.sphere, '#f7f3ea', [Math.cos(a) * 0.22, 0.62 + Math.sin(i * 1.7) * 0.06, Math.sin(a) * 0.32], [0.26, 0.26, 0.26], 0.015);
      }
      part(g, geo.sphere, '#f7f3ea', [0, 0.72, 0], [0.34, 0.3, 0.45], 0.02);
      for (const [x, z] of [[-0.18, 0.25], [0.18, 0.25], [-0.18, -0.25], [0.18, -0.25]]) part(g, geo.box, '#3a3440', [x, 0.22, z], [0.1, 0.44, 0.1], 0.01);
      head.position.set(0, 0.75, 0.5);
      part(head, geo.sphere, '#3a3440', [0, 0, 0.08], [0.17, 0.2, 0.2]);
      part(head, geo.sphere, '#f7f3ea', [0, 0.16, 0.02], [0.15, 0.1, 0.15], 0.01);
      for (const s of [-1, 1]) part(head, geo.sphere, '#3a3440', [0.2 * s, 0.04, 0.02], [0.1, 0.05, 0.06], 0.008);
      const e = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      for (const s of [-1, 1]) {
        const m = new THREE.Mesh(geo.sphere, e);
        m.position.set(0.08 * s, 0.05, 0.24);
        m.scale.setScalar(0.03);
        head.add(m);
      }
      break;
    }
    case 'goat': {
      part(g, geo.sphere, '#f2ece0', [0, 0.62, 0], [0.26, 0.24, 0.42]);
      part(g, geo.sphere, '#8a6a4a', [0, 0.7, -0.12], [0.22, 0.16, 0.24], 0.01);
      for (const [x, z] of [[-0.14, 0.24], [0.14, 0.24], [-0.14, -0.24], [0.14, -0.24]]) part(g, geo.cyl, '#5a4a3a', [x, 0.2, z], [0.045, 0.42, 0.045], 0.008);
      part(g, geo.cone, '#f2ece0', [0, 0.72, -0.44], [0.05, 0.14, 0.05], 0.006).rotation.x = -1.2;
      head.position.set(0, 0.9, 0.42);
      part(head, geo.sphere, '#f2ece0', [0, 0, 0.06], [0.13, 0.15, 0.18]);
      part(head, geo.sphere, '#e8dcc8', [0, -0.06, 0.2], [0.08, 0.07, 0.07], 0.008);
      part(head, geo.cone, '#e8dcc8', [0, -0.18, 0.14], [0.035, 0.12, 0.035], 0.006).rotation.x = Math.PI;
      for (const s of [-1, 1]) {
        part(head, geo.cone, '#8a7a6a', [0.07 * s, 0.17, -0.02], [0.03, 0.16, 0.03], 0.006).rotation.x = -0.6;
        part(head, geo.sphere, '#e8dcc8', [0.15 * s, 0.03, 0], [0.08, 0.035, 0.05], 0.006);
      }
      eyes(head, 0.04, 0.17, 0.07, 0.025);
      break;
    }
    case 'pig': {
      part(g, geo.sphere, '#f4a9b8', [0, 0.45, 0], [0.38, 0.33, 0.55]);
      for (const [x, z] of [[-0.18, 0.3], [0.18, 0.3], [-0.18, -0.3], [0.18, -0.3]]) part(g, geo.cyl, '#e8919f', [x, 0.12, z], [0.07, 0.24, 0.07], 0.01);
      part(g, geo.sphere, '#f4a9b8', [0, 0.55, -0.55], [0.05, 0.05, 0.08], 0.006);
      head.position.set(0, 0.55, 0.5);
      part(head, geo.sphere, '#f4a9b8', [0, 0, 0.06], [0.24, 0.22, 0.22]);
      part(head, geo.cyl, '#e8919f', [0, -0.03, 0.27], [0.1, 0.06, 0.1], 0.01).rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) part(head, geo.cone, '#e8919f', [0.14 * s, 0.2, 0.02], [0.07, 0.12, 0.05], 0.008).rotation.z = -0.4 * s;
      eyes(head, 0.08, 0.24, 0.09, 0.03);
      break;
    }
    case 'bee': {
      // a little swarm that buzzes around the hive
      for (let i = 0; i < 4; i++) {
        const b = new THREE.Group();
        part(b, geo.sphere, '#f2c94c', [0, 0, 0], [0.07, 0.06, 0.09], 0.008);
        part(b, geo.box, '#2a2534', [0, 0, 0], [0.142, 0.122, 0.03], 0);
        const w = new THREE.Mesh(geo.sphere, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }));
        w.position.y = 0.07;
        w.scale.set(0.08, 0.02, 0.05);
        b.add(w);
        b.userData.k = i;
        g.add(b);
      }
      g.userData.swarm = true;
      break;
    }
  }
  return g;
}

/** Idle animation: pecking, grazing, buzzing. */
export function animateAnimal(m, t, dt) {
  const u = m.userData;
  const p = t + u.phase;
  if (u.swarm) {
    for (const b of m.children) {
      const k = b.userData.k ?? 0;
      const a = p * (1.8 + k * 0.3) + k * 1.6;
      b.position.set(Math.cos(a) * (0.5 + k * 0.1), 1.0 + Math.sin(p * 3 + k) * 0.25, Math.sin(a) * (0.5 + k * 0.1));
      b.rotation.y = -a;
    }
    return;
  }
  const head = u.head;
  if (u.kind === 'chicken') {
    const peck = Math.max(0, Math.sin(p * 2.2)) ** 6;
    head.rotation.x = peck * 1.1;
    head.position.y = 0.5 - peck * 0.15;
  } else {
    head.rotation.x = Math.max(0, Math.sin(p * 0.5)) * 0.5;
    head.rotation.y = Math.sin(p * 0.3) * 0.3;
  }
  // wander slowly inside the pen
  if (u.home) {
    u.wt = (u.wt ?? 0) - dt;
    if (u.wt <= 0) {
      u.wt = 2 + Math.random() * 4;
      u.target = u.home.clone().add(new THREE.Vector3((Math.random() - 0.5) * u.range, 0, (Math.random() - 0.5) * u.range * 0.6));
    }
    if (u.target) {
      const d = u.target.clone().sub(m.position).setY(0);
      const len = d.length();
      if (len > 0.05) {
        const step = Math.min(len, dt * (u.kind === 'chicken' ? 0.7 : 0.35));
        m.position.addScaledVector(d.normalize(), step);
        m.rotation.y = Math.atan2(d.x, d.z);
      }
    }
  }
}
