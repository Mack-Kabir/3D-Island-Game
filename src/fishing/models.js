import * as THREE from 'three';
import { inked } from '../world/toon.js';
import { gradientMap, glowTexture } from '../world/toon.js';
import { TIERS } from './fish.js';
import { fishSVG } from '../ui/icons.js';

// 3D models for fishing: boats, and the painted fish you catch.

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

const fishTexCache = new Map();
/** The catch-card illustration painted onto a texture (cached per species). */
export function fishTexture(f) {
  let tex = fishTexCache.get(f.id);
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    c.getContext('2d').drawImage(img, 0, 0, 512, 512);
    tex.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fishSVG(f, 512))}`;
  fishTexCache.set(f.id, tex);
  return tex;
}

/**
 * A caught fish: the same hand-drawn art as the catch card on a cut-out card that
 * always turns to face the camera, with a soft rarity glow behind it.
 */
export function fishMesh(f) {
  const g = new THREE.Group();
  const tex = fishTexture(f);
  const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientMap(), alphaTest: 0.5, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.45 });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), mat);
  card.castShadow = false;
  g.add(card);
  if (f.tier !== 'junk' && f.tier !== 'common') {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: TIERS[f.tier].color, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(2.2);
    glow.position.z = -0.05;
    g.add(glow);
  }
  g.userData.billboard = true;
  return g;
}
