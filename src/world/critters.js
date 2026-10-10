import * as THREE from 'three';
import { inked } from './toon.js';

/** Simple animal model used for ambient wildlife (crabs, seagulls). */
export function crabModel() {
  const g = new THREE.Group();
  const body = inked(new THREE.SphereGeometry(0.18, 8, 6), '#e0604c', 0.015);
  body.scale.set(1.3, 0.6, 1);
  body.position.y = 0.12;
  g.add(body);
  for (const sx of [-1, 1]) {
    const claw = inked(new THREE.SphereGeometry(0.07, 6, 4), '#e0604c', 0.012);
    claw.position.set(sx * 0.22, 0.14, 0.15);
    g.add(claw);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
    eye.position.set(sx * 0.06, 0.24, 0.12);
    g.add(eye);
  }
  return g;
}

export function gullModel() {
  const g = new THREE.Group();
  const body = inked(new THREE.SphereGeometry(0.2, 8, 6), '#f4f1e8', 0.015);
  body.scale.set(0.8, 0.7, 1.5);
  g.add(body);
  const wings = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    const w = inked(new THREE.BoxGeometry(0.7, 0.03, 0.22), '#e8e4da', 0.012);
    w.position.x = sx * 0.35;
    pivot.add(w);
    g.add(pivot);
    wings.push(pivot);
  }
  const beak = inked(new THREE.ConeGeometry(0.04, 0.14, 4), '#f2c230', 0.01);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.03, 0.33);
  g.add(beak);
  g.userData.wings = wings;
  return g;
}
