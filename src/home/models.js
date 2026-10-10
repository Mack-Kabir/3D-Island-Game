import * as THREE from 'three';
import { G, mat4, inked } from '../world/toon.js';
import { compose as T } from '../world/props.js';

// 3D models for your home: the empty campsite before your tent, and decorations.

/** A run-down pen: leaning, broken fence posts, a collapsed shelter and scattered planks. */
/** An empty pitch where your tent will go: flattened grass, a cold fire ring and a few tent pegs. */
export function campClearing(b, x, y, z) {
  const base = mat4(x, y, z);
  b.add(G.cyl12, '#b8a878', T(base, 0, 0.03, 0, 0, 0, 0, 1.9, 0.04, 1.9));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.add(G.rock, '#8a8a94', T(base, 2.4 + Math.cos(a) * 0.45, 0.08, 1.6 + Math.sin(a) * 0.45, 0, a, 0, 0.16), { flat: true });
  }
  b.add(G.box, '#3a3036', T(base, 2.4, 0.06, 1.6, 0, 0.6, 0, 0.5, 0.05, 0.12));
  for (const [px, pz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) b.add(G.cyl6, '#7a5a40', T(base, px, 0.12, pz, 0.3, 0, 0, 0.04, 0.24, 0.04));
}

export function decorModel(id) {
  const g = new THREE.Group();
  const add = (geom, color, x, y, z, o = 0.02) => {
    const m = inked(geom, color, o);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  switch (id) {
    case 'lantern': {
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), '#3a3040', 0, 0.8, 0);
      const l = add(new THREE.SphereGeometry(0.28, 10, 8), '#ff8a5c', 0, 1.75, 0);
      l.scale.y = 1.2;
      l.material.emissive = new THREE.Color('#ff7a3a');
      l.material.emissiveIntensity = 0.6;
      g.userData.glow = 1.75;
      break;
    }
    case 'flowerpot':
      add(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 8), '#c8604a', 0, 0.2, 0);
      add(new THREE.IcosahedronGeometry(0.32, 1), '#5f9a5c', 0, 0.55, 0);
      for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.08, 6, 4), ['#f2a2b8', '#f7c95c', '#ffffff'][i % 3], Math.cos(i) * 0.25, 0.7, Math.sin(i) * 0.25, 0.01);
      break;
    case 'fence':
      for (const x of [-0.8, 0, 0.8]) add(new THREE.BoxGeometry(0.14, 1, 0.14), '#c8a77a', x, 0.5, 0);
      add(new THREE.BoxGeometry(1.8, 0.1, 0.08), '#b8976a', 0, 0.7, 0);
      add(new THREE.BoxGeometry(1.8, 0.1, 0.08), '#b8976a', 0, 0.35, 0);
      break;
    case 'campfire': {
      for (let i = 0; i < 6; i++) add(new THREE.DodecahedronGeometry(0.2, 0), '#7f7f8a', Math.cos(i) * 0.5, 0.1, Math.sin(i) * 0.5, 0.012);
      const f = add(new THREE.ConeGeometry(0.28, 0.7, 6), '#ffb347', 0, 0.4, 0);
      f.material.emissive = new THREE.Color('#ff7a2a');
      f.material.emissiveIntensity = 0.8;
      g.userData.glow = 0.5;
      break;
    }
    case 'tiki': {
      add(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6), '#7a5a40', 0, 0.9, 0);
      add(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 6), '#5a4030', 0, 1.9, 0);
      const f = add(new THREE.ConeGeometry(0.16, 0.5, 6), '#ffb347', 0, 2.3, 0);
      f.material.emissive = new THREE.Color('#ff7a2a');
      g.userData.glow = 2.3;
      break;
    }
    case 'bench':
      add(new THREE.BoxGeometry(1.8, 0.12, 0.6), '#a98060', 0, 0.5, 0);
      add(new THREE.BoxGeometry(1.8, 0.5, 0.1), '#a98060', 0, 0.85, -0.28);
      for (const x of [-0.75, 0.75]) add(new THREE.BoxGeometry(0.12, 0.5, 0.5), '#7a5a40', x, 0.25, 0);
      break;
    case 'hammock': {
      for (const x of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.1, 0.12, 2, 6), '#8a6a4a', x, 1, 0);
      const h = add(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#f0846a', 0, 1.2, 0);
      h.rotation.z = Math.PI / 2;
      h.material.side = THREE.DoubleSide;
      break;
    }
    case 'umbrella': {
      add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), '#f4f1e8', 0, 1.2, 0);
      const top = add(new THREE.ConeGeometry(1.4, 0.6, 8), '#58b4a5', 0, 2.3, 0);
      top.material.side = THREE.DoubleSide;
      break;
    }
    case 'flamingo': {
      for (const x of [-0.05, 0.05]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), '#e86f8a', x, 0.45, 0, 0.008);
      const b = add(new THREE.SphereGeometry(0.25, 10, 8), '#f29ab0', 0, 1.0, 0);
      b.scale.set(0.8, 0.8, 1.3);
      add(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6), '#f29ab0', 0, 1.35, 0.25, 0.01);
      add(new THREE.SphereGeometry(0.1, 8, 6), '#f29ab0', 0, 1.68, 0.3);
      add(new THREE.ConeGeometry(0.04, 0.15, 4), '#2a2534', 0, 1.62, 0.42, 0.008).rotation.x = 2;
      break;
    }
    case 'fish_trophy':
      add(new THREE.BoxGeometry(0.8, 0.8, 0.12), '#7a5a40', 0, 1.2, 0);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), '#7a5a40', 0, 0.4, 0);
      {
        const f = add(new THREE.SphereGeometry(0.25, 10, 8), '#e8b520', 0, 1.2, 0.12);
        f.scale.set(1.4, 0.7, 0.4);
        add(new THREE.ConeGeometry(0.15, 0.25, 4), '#e8b520', 0.42, 1.2, 0.12).rotation.z = Math.PI / 2;
      }
      break;
    default:
      add(new THREE.BoxGeometry(0.5, 0.5, 0.5), '#ffffff', 0, 0.25, 0);
  }
  return g;
}
