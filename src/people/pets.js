import * as THREE from 'three';
import { dampAngle } from '../shared/utils.js';
import { inked } from '../world/toon.js';

// Pets: what they cost and do, and the little companions that follow you around.
export const PETS = [
  { id: 'kitten', name: 'Kitten', icon: '🐱', gems: 40, level: 2, perk: '+10% fishing luck', luck: 0.1, desc: 'Watches the water with you.' },
  { id: 'puppy', name: 'Puppy', icon: '🐶', gems: 40, level: 2, perk: 'Sniffs out an extra treasure spot daily', desc: 'Loves digging.' },
  { id: 'parrot', name: 'Parrot', icon: '🦜', gems: 60, level: 5, perk: '+10% coins when selling', sellBonus: 0.1, desc: 'Haggles on your behalf. Squawk!' },
  { id: 'turtle', name: 'Sea Turtle', icon: '🐢', gems: 80, level: 8, perk: '+15 max HP and faster healing', hp: 15, desc: 'Slow and steady.' },
];
export const PETS_BY_ID = Object.fromEntries(PETS.map((r) => [r.id, r]));

/** Companion pets that follow the player. */
export class Pet {
  constructor(game, id) {
    this.game = game;
    this.id = id;
    this.root = new THREE.Group();
    this.model = buildPetModel(id);
    this.root.add(this.model);
    this.vel = new THREE.Vector3();
    this.phase = 0;
    this.flying = id === 'parrot';
    const p = game.player.pos;
    this.root.position.set(p.x + 1, p.y, p.z - 1);
  }
  update(dt) {
    const g = this.game;
    const p = g.player;
    const back = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const side = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const target = p.pos.clone().addScaledVector(back, 1.4).addScaledVector(side, 0.9);
    const pos = this.root.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 25) pos.set(target.x, pos.y, target.z);
    let speed = 0;
    if (d > 0.4) {
      speed = Math.min(d * 2.5, 9);
      pos.x += (dx / d) * speed * dt;
      pos.z += (dz / d) * speed * dt;
      this.root.rotation.y = dampAngle(this.root.rotation.y, Math.atan2(dx, dz), 8, dt);
    } else {
      this.root.rotation.y = dampAngle(this.root.rotation.y, p.yaw, 3, dt);
    }
    this.phase += dt * (speed > 0.5 ? 12 : 2);
    const ground = Math.max(g.world.groundAt(pos.x, pos.z), -0.1);
    if (this.flying) {
      pos.y = p.pos.y + 1.9 + Math.sin(this.phase * 0.5) * 0.15;
      const wings = this.model.userData.wings;
      if (wings) wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(this.phase * 2.5) * 0.6)));
    } else {
      pos.y = ground + (speed > 0.5 ? Math.abs(Math.sin(this.phase)) * 0.18 : 0);
    }
    const tail = this.model.userData.tail;
    if (tail) tail.rotation.z = Math.sin(this.phase * 0.8) * 0.5;
  }
  dispose() {
    this.root.parent?.remove(this.root);
  }
}

function buildPetModel(id) {
  const g = new THREE.Group();
  const O = 0.018;
  if (id === 'kitten' || id === 'puppy') {
    const fur = id === 'kitten' ? '#f0a35a' : '#b98a5a';
    const body = inked(new THREE.CapsuleGeometry(0.17, 0.3, 3, 8), fur, O);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.32;
    g.add(body);
    const head = inked(new THREE.SphereGeometry(0.19, 10, 8), fur, O);
    head.position.set(0, 0.52, 0.27);
    g.add(head);
    for (const sx of [-1, 1]) {
      const ear = id === 'kitten' ? inked(new THREE.ConeGeometry(0.07, 0.14, 4), fur, O) : inked(new THREE.SphereGeometry(0.08, 6, 5), '#7a5a3a', O);
      ear.position.set(sx * 0.11, id === 'kitten' ? 0.7 : 0.52, 0.25);
      if (id === 'puppy') ear.scale.set(0.6, 1.4, 0.8);
      g.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.075, 0.56, 0.44);
      g.add(eye);
      for (const fz of [0.15, -0.15]) {
        const leg = inked(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), fur, O);
        leg.position.set(sx * 0.09, 0.1, fz);
        g.add(leg);
      }
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
    nose.position.set(0, 0.5, 0.46);
    g.add(nose);
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.4, -0.3);
    const tail = inked(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 6), fur, O);
    tail.position.y = 0.15;
    tail.rotation.x = -0.4;
    tailPivot.add(tail);
    g.add(tailPivot);
    g.userData.tail = tailPivot;
  } else if (id === 'parrot') {
    const body = inked(new THREE.SphereGeometry(0.17, 10, 8), '#d9443a', O);
    body.scale.set(1, 1.25, 1);
    g.add(body);
    const head = inked(new THREE.SphereGeometry(0.12, 8, 6), '#d9443a', O);
    head.position.set(0, 0.22, 0.05);
    g.add(head);
    const beak = inked(new THREE.ConeGeometry(0.04, 0.12, 4), '#f2c230', O);
    beak.rotation.x = Math.PI / 2 + 0.4;
    beak.position.set(0, 0.2, 0.17);
    g.add(beak);
    const wings = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.14, 0.05, 0);
      const wing = inked(new THREE.BoxGeometry(0.3, 0.04, 0.2), '#3fa0d9', O);
      wing.position.x = sx * 0.15;
      pivot.add(wing);
      g.add(pivot);
      wings.push(pivot);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.07, 0.25, 0.12);
      g.add(eye);
    }
    const tail = inked(new THREE.BoxGeometry(0.1, 0.03, 0.3), '#3f9e4d', O);
    tail.position.set(0, -0.12, -0.2);
    tail.rotation.x = 0.5;
    g.add(tail);
    g.userData.wings = wings;
  } else if (id === 'turtle') {
    const shell = inked(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#4f8a4a', O);
    shell.scale.set(1, 0.7, 1.15);
    shell.position.y = 0.12;
    g.add(shell);
    const under = inked(new THREE.CylinderGeometry(0.3, 0.28, 0.06, 10), '#d9c48f', O);
    under.scale.z = 1.15;
    under.position.y = 0.12;
    g.add(under);
    const head = inked(new THREE.SphereGeometry(0.1, 8, 6), '#8fbf7a', O);
    head.position.set(0, 0.2, 0.4);
    g.add(head);
    for (const sx of [-1, 1]) {
      for (const fz of [0.22, -0.22]) {
        const leg = inked(new THREE.SphereGeometry(0.07, 6, 4), '#8fbf7a', O);
        leg.position.set(sx * 0.25, 0.08, fz);
        leg.scale.set(1.3, 0.6, 1);
        g.add(leg);
      }
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: '#2a2534' }));
      eye.position.set(sx * 0.05, 0.24, 0.48);
      g.add(eye);
    }
  }
  return g;
}
