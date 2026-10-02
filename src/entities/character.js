import * as THREE from 'three';
import { toon, withOutline, patternTexture } from '../world/toon.js';
import { COSMETICS, SKIN_TONES, HAIR_COLORS, EYE_COLORS } from '../data/cosmetics.js';
import { RODS_BY_ID, WEAPONS_BY_ID } from '../data/gear.js';

const OUT = 0.022;
const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

function part(geometry, material, outline = OUT) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) withOutline(m, outline);
  return m;
}

function colorOf(v, list) {
  if (typeof v === 'number') return list[v % list.length];
  return v || list[0];
}

/**
 * A stylised, hand-built humanoid. All body parts are primitive meshes with
 * pivot groups so we can animate walking, casting, swinging and emotes.
 */
export class Character {
  constructor(look, opts = {}) {
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // bobbing / leaning
    this.root.add(this.body);
    this.opts = opts;
    this.phase = Math.random() * 10;
    this.actionT = 0;
    this.action = null;
    this.held = null;
    this.flash = 0;
    this.materials = [];
    this.setLook(look);
  }

  setLook(look) {
    this.look = { ...look };
    // clear old
    this.body.clear();
    for (const m of this.materials) {
      m.dispose();
    }
    this.materials = [];
    this.build();
    if (this.heldKind) this.hold(this.heldKind, this.heldId, true);
  }

  mat(color, map = null) {
    const m = toon(map ? '#ffffff' : color, map ? { map, emissiveMap: map } : {});
    // a little self-light so characters stay readable on their shadow side
    m.emissive.set(map ? '#ffffff' : color).multiplyScalar(0.14);
    m.userData.baseEmissive = m.emissive.clone();
    this.materials.push(m);
    return m;
  }

  build() {
    const L = this.look;
    const fem = L.gender === 'f';
    const skin = this.mat(colorOf(L.skin, SKIN_TONES));
    this.skinMat = skin;
    const top = COSMETICS[L.top] || COSMETICS.tee_white;
    const bottom = COSMETICS[L.bottom] || COSMETICS.shorts_khaki;
    const topMap = top.pattern ? patternTexture(top.pattern[0], top.color, top.pattern[1], top.pattern[2]) : null;
    const botMap = bottom.pattern ? patternTexture(bottom.pattern[0], bottom.color, bottom.pattern[1], bottom.pattern[2]) : null;
    const dress = bottom.kind === 'dress';
    const topMat = dress ? this.mat(bottom.color, botMap) : this.mat(top.color, topMap);
    const botMat = this.mat(bottom.color, botMap);
    const shoeMat = this.mat(L.shoes || '#5a3825');
    const hairMat = this.mat(colorOf(L.hairColor, HAIR_COLORS));
    const eyeMat = new THREE.MeshBasicMaterial({ color: colorOf(L.eyes ?? 0, EYE_COLORS) });
    this.materials.push(eyeMat);
    const allBody = [];

    const shoulderW = fem ? 0.2 : 0.235;
    const hipW = fem ? 0.115 : 0.105;
    const torsoTop = fem ? 0.2 : 0.235;
    const torsoBot = fem ? 0.225 : 0.205;

    // ── hips & torso ──
    const hips = new THREE.Group();
    hips.position.y = 0.8;
    this.body.add(hips);
    this.hips = hips;

    const torso = part(geo(`torso${fem}`, () => new THREE.CylinderGeometry(torsoTop, torsoBot, 0.56, 10)), topMat);
    torso.position.y = 0.3;
    torso.scale.z = 0.72;
    hips.add(torso);
    allBody.push(torso);
    if (fem) {
      const chest = part(geo('chest', () => new THREE.SphereGeometry(0.17, 10, 8)), topMat, 0);
      chest.position.set(0, 0.4, 0.06);
      chest.scale.set(1.15, 0.7, 0.75);
      hips.add(chest);
    }
    if (top.trim && !dress) {
      const trim = part(geo('trim', () => new THREE.BoxGeometry(0.06, 0.5, 0.02)), this.mat(top.trim), 0);
      trim.position.set(0, 0.3, torsoBot * 0.72 + 0.01);
      hips.add(trim);
    }
    const pelvis = part(geo(`pelvis${fem}`, () => new THREE.CylinderGeometry(torsoBot, torsoBot * 0.95, 0.16, 10)), botMat);
    pelvis.position.y = 0.0;
    pelvis.scale.z = 0.75;
    hips.add(pelvis);

    // skirt / dress
    if (bottom.kind === 'skirt' || dress) {
      const len = dress ? 0.5 : 0.36;
      const skirt = part(geo(`skirt${len}`, () => new THREE.CylinderGeometry(0.2, 0.33, len, 12, 1, true)), botMat);
      skirt.material.side = THREE.DoubleSide;
      skirt.position.y = -len / 2 + 0.06;
      skirt.scale.z = 0.85;
      hips.add(skirt);
    }

    // neck & head
    const neck = part(geo('neck', () => new THREE.CylinderGeometry(0.07, 0.08, 0.14, 8)), skin, 0);
    neck.position.y = 0.63;
    hips.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.92;
    hips.add(head);
    this.head = head;
    const skull = part(geo('skull', () => new THREE.SphereGeometry(0.27, 16, 12)), skin);
    skull.scale.set(1, 1.02, 0.96);
    head.add(skull);
    // ears
    for (const sx of [-1, 1]) {
      const ear = part(geo('ear', () => new THREE.SphereGeometry(0.06, 8, 6)), skin, 0.012);
      ear.position.set(sx * 0.26, -0.01, 0);
      ear.scale.set(0.5, 1, 0.8);
      head.add(ear);
    }
    // eyes (simple ink ovals with a highlight — anime-ish)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(geo('eye', () => new THREE.SphereGeometry(0.042, 10, 8)), eyeMat);
      eye.position.set(sx * 0.095, 0.0, 0.245);
      eye.scale.set(0.8, fem ? 1.25 : 1.05, 0.5);
      head.add(eye);
      const hl = new THREE.Mesh(geo('hl', () => new THREE.SphereGeometry(0.013, 6, 4)), geo('hlMat', () => new THREE.MeshBasicMaterial({ color: '#ffffff' })));
      hl.position.set(sx * 0.095 + 0.012, 0.018, 0.266);
      head.add(hl);
      if (fem) {
        const lash = new THREE.Mesh(geo('lash', () => new THREE.BoxGeometry(0.07, 0.012, 0.01)), eyeMat);
        lash.position.set(sx * 0.1 + sx * 0.01, 0.055, 0.25);
        lash.rotation.z = -sx * 0.25;
        head.add(lash);
      }
      // eyebrows
      const brow = new THREE.Mesh(geo('brow', () => new THREE.BoxGeometry(0.075, 0.018, 0.01)), hairMat);
      brow.position.set(sx * 0.1, 0.09, 0.245);
      brow.rotation.z = sx * 0.12;
      head.add(brow);
    }
    this.eyes = head.children.filter((c) => c.geometry === geoCache.get('eye'));
    // blush
    const blushMat = geo('blushMat', () => new THREE.MeshBasicMaterial({ color: '#f29a9a', transparent: true, opacity: 0.55 }));
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(geo('blush', () => new THREE.CircleGeometry(0.04, 10)), blushMat);
      b.position.set(sx * 0.16, -0.07, 0.226);
      b.rotation.y = sx * 0.5;
      b.scale.y = 0.6;
      head.add(b);
    }
    // nose + mouth
    const nose = part(geo('nose', () => new THREE.SphereGeometry(0.03, 6, 5)), skin, 0);
    nose.position.set(0, -0.05, 0.27);
    head.add(nose);
    const mouth = new THREE.Mesh(geo('mouth', () => new THREE.TorusGeometry(0.035, 0.009, 4, 10, Math.PI)), eyeMat);
    mouth.position.set(0, -0.12, 0.245);
    mouth.rotation.z = Math.PI;
    head.add(mouth);

    this.buildHair(head, hairMat, L.hair);
    if (L.hat) this.buildHat(head, L.hat);
    if (L.acc) this.buildAcc(hips, head, L.acc);

    // ── arms ──
    const sleeve = dress ? 'none' : top.sleeve;
    this.arms = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * (shoulderW + 0.04), 0.52, 0);
      hips.add(shoulder);
      const upperMat = sleeve === 'none' ? skin : topMat;
      const upper = part(geo('upperArm', () => new THREE.CapsuleGeometry(0.065, 0.2, 3, 8)), upperMat);
      upper.position.y = -0.14;
      shoulder.add(upper);
      if (sleeve === 'short') {
        const cuff = part(geo('cuff', () => new THREE.CylinderGeometry(0.085, 0.09, 0.16, 8)), topMat, 0);
        cuff.position.y = -0.06;
        shoulder.add(cuff);
        upper.material = skin;
      }
      const elbow = new THREE.Group();
      elbow.position.y = -0.3;
      shoulder.add(elbow);
      const fore = part(geo('foreArm', () => new THREE.CapsuleGeometry(0.058, 0.18, 3, 8)), sleeve === 'long' ? topMat : skin);
      fore.position.y = -0.12;
      elbow.add(fore);
      const hand = part(geo('hand', () => new THREE.SphereGeometry(0.068, 8, 6)), skin);
      hand.position.y = -0.27;
      elbow.add(hand);
      const grip = new THREE.Group();
      grip.position.y = -0.28;
      elbow.add(grip);
      this.arms.push({ shoulder, elbow, grip, side });
    }
    this.rightHand = this.arms[1].grip;
    this.leftHand = this.arms[0].grip;

    // ── legs ──
    this.legs = [];
    const longLegs = bottom.kind === 'pants';
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * hipW, -0.02, 0);
      hips.add(hip);
      const thigh = part(geo('thigh', () => new THREE.CapsuleGeometry(0.085, 0.24, 3, 8)), bottom.kind === 'skirt' || dress ? skin : botMat);
      thigh.position.y = -0.18;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.38;
      hip.add(knee);
      const shin = part(geo('shin', () => new THREE.CapsuleGeometry(0.072, 0.24, 3, 8)), longLegs ? botMat : skin);
      shin.position.y = -0.17;
      knee.add(shin);
      const foot = part(geo('foot', () => new THREE.BoxGeometry(0.15, 0.1, 0.26)), shoeMat);
      foot.position.set(0, -0.36, 0.04);
      knee.add(foot);
      this.legs.push({ hip, knee, side });
    }

    const s = this.opts.scale ?? this.look.scale ?? 1;
    this.root.scale.setScalar(s);
    this.allMats = [skin, topMat, botMat, shoeMat, hairMat];
  }

  buildHair(head, mat, style) {
    const cap = (phi = 0.56, scale = 1.07, tilt = -0.35) => {
      const g = geo(`cap${phi}`, () => new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * phi));
      const m = part(g, mat);
      m.scale.setScalar(scale);
      m.rotation.x = tilt;
      m.material.side = THREE.DoubleSide;
      head.add(m);
      return m;
    };
    const blob = (x, y, z, r, sx = 1, sy = 1, sz = 1) => {
      const m = part(geo('hairblob', () => new THREE.SphereGeometry(1, 10, 8)), mat);
      m.position.set(x, y, z);
      m.scale.set(r * sx, r * sy, r * sz);
      head.add(m);
      return m;
    };
    switch (style) {
      case 'buzz':
        cap(0.5, 1.03, -0.3);
        break;
      case 'spiky': {
        cap(0.55, 1.07, -0.3);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const sp = part(geo('spike', () => new THREE.ConeGeometry(0.08, 0.24, 5)), mat);
          sp.position.set(Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15 - 0.04);
          sp.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
          head.add(sp);
        }
        blob(0, 0.13, 0.2, 0.1, 1.6, 0.5, 0.6);
        break;
      }
      case 'curly':
        cap(0.6, 1.08, -0.25);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          blob(Math.cos(a) * 0.24, 0.12 + Math.sin(i * 1.7) * 0.06, Math.sin(a) * 0.22 - 0.03, 0.1);
        }
        blob(0, 0.28, -0.02, 0.17);
        break;
      case 'bob':
        cap(0.68, 1.1, -0.18);
        blob(0, 0.15, 0.2, 0.12, 2.0, 0.6, 0.6);
        break;
      case 'long':
        cap(0.62, 1.09, -0.25);
        blob(0, -0.18, -0.12, 0.22, 1.25, 1.6, 0.6);
        blob(0, 0.14, 0.2, 0.11, 2.0, 0.55, 0.6);
        break;
      case 'ponytail':
        cap(0.58, 1.08, -0.3);
        blob(0, 0.12, -0.27, 0.09);
        blob(0, -0.08, -0.33, 0.1, 0.9, 1.9, 0.9);
        blob(0, 0.14, 0.2, 0.1, 1.9, 0.5, 0.6);
        break;
      case 'bun':
        cap(0.58, 1.08, -0.3);
        blob(0, 0.3, -0.12, 0.12);
        blob(0, 0.14, 0.2, 0.1, 1.9, 0.5, 0.6);
        break;
      case 'pigtails':
        cap(0.6, 1.08, -0.28);
        blob(-0.27, 0.02, -0.1, 0.1, 0.9, 1.6, 0.9);
        blob(0.27, 0.02, -0.1, 0.1, 0.9, 1.6, 0.9);
        blob(0, 0.14, 0.2, 0.1, 1.9, 0.5, 0.6);
        break;
      case 'short':
      default:
        cap(0.56, 1.08, -0.32);
        blob(0.05, 0.15, 0.2, 0.11, 1.8, 0.55, 0.6);
        break;
    }
  }

  buildHat(head, id) {
    const c = COSMETICS[id];
    if (!c) return;
    const mat = this.mat(c.color);
    const g = new THREE.Group();
    head.add(g);
    const add = (geom, m = mat, o = OUT) => {
      const p = part(geom, m, o);
      g.add(p);
      return p;
    };
    switch (id) {
      case 'straw_hat': {
        const brim = add(geo('brim', () => new THREE.CylinderGeometry(0.5, 0.52, 0.04, 20)));
        brim.position.y = 0.2;
        const crown = add(geo('hcrown', () => new THREE.CylinderGeometry(0.22, 0.27, 0.2, 14)));
        crown.position.y = 0.3;
        const band = add(geo('band', () => new THREE.CylinderGeometry(0.272, 0.272, 0.06, 14)), this.mat('#d9534f'), 0);
        band.position.y = 0.24;
        g.rotation.x = -0.12;
        break;
      }
      case 'cap_red':
      case 'sun_visor': {
        if (id === 'cap_red') {
          const dome = add(geo('capdome', () => new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)));
          dome.position.y = 0.07;
        } else {
          const ring = add(geo('visorband', () => new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14, 1, true)));
          ring.position.y = 0.12;
          ring.material.side = THREE.DoubleSide;
        }
        const bill = add(geo('bill', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12, 1, false, -Math.PI / 2, Math.PI)));
        bill.position.set(0, 0.09, 0.22);
        bill.rotation.x = 0.12;
        bill.scale.set(1.1, 1, 1.3);
        g.rotation.x = -0.15;
        break;
      }
      case 'bandana_blue': {
        const b = add(geo('bandana', () => new THREE.SphereGeometry(0.285, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)));
        b.position.y = 0.02;
        b.rotation.x = -0.25;
        const knot = add(geo('knot', () => new THREE.ConeGeometry(0.06, 0.18, 4)));
        knot.position.set(0, 0.0, -0.3);
        knot.rotation.x = -2.2;
        break;
      }
      case 'flower_crown': {
        const cols = ['#f2a2b8', '#ffffff', '#f7c95c', '#c48ad6'];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const f = add(geo('flower', () => new THREE.SphereGeometry(0.055, 8, 6)), this.mat(cols[i % 4]), 0.012);
          f.position.set(Math.cos(a) * 0.25, 0.17, Math.sin(a) * 0.25);
        }
        break;
      }
      case 'beanie': {
        const b = add(geo('beanie', () => new THREE.SphereGeometry(0.29, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)));
        b.position.y = 0.04;
        b.rotation.x = -0.2;
        const pom = add(geo('pom', () => new THREE.SphereGeometry(0.07, 8, 6)), this.mat('#f2efe6'));
        pom.position.set(0, 0.33, -0.06);
        break;
      }
      case 'captain_hat':
      case 'blackfin_hat':
      case 'pirate_hat': {
        if (id === 'captain_hat') {
          const top = add(geo('caphat', () => new THREE.CylinderGeometry(0.3, 0.26, 0.16, 14)), this.mat('#f4f1e8'));
          top.position.y = 0.3;
          const band = add(geo('capband', () => new THREE.CylinderGeometry(0.265, 0.27, 0.1, 14)));
          band.position.y = 0.2;
          const bill = add(geo('bill', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12, 1, false, -Math.PI / 2, Math.PI)), this.mat('#2a2534'));
          bill.position.set(0, 0.16, 0.2);
          const badge = add(geo('badge', () => new THREE.SphereGeometry(0.035, 6, 4)), this.mat('#f2c230'), 0);
          badge.position.set(0, 0.22, 0.27);
        } else {
          const brim = add(geo('tribrim', () => new THREE.CylinderGeometry(0.45, 0.45, 0.05, 3)));
          brim.position.y = 0.24;
          brim.rotation.y = Math.PI / 6 + Math.PI;
          const crown = add(geo('tricrown', () => new THREE.CylinderGeometry(0.2, 0.27, 0.24, 10)));
          crown.position.y = 0.36;
          const skull = add(geo('skullbadge', () => new THREE.SphereGeometry(0.05, 6, 5)), this.mat('#f2ece0'), 0);
          skull.position.set(0, 0.37, 0.24);
          if (id === 'blackfin_hat') {
            const feather = add(geo('feather', () => new THREE.ConeGeometry(0.05, 0.5, 4)), this.mat('#d9534f'));
            feather.position.set(0.18, 0.5, -0.05);
            feather.rotation.z = -0.6;
          }
        }
        break;
      }
      case 'crown': {
        const ring = add(geo('crownring', () => new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10, 1, true)));
        ring.material.side = THREE.DoubleSide;
        ring.position.y = 0.29;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const p = add(geo('crownpt', () => new THREE.ConeGeometry(0.04, 0.12, 4)));
          p.position.set(Math.cos(a) * 0.2, 0.4, Math.sin(a) * 0.2);
        }
        const gem = add(geo('crowngem', () => new THREE.SphereGeometry(0.035, 6, 4)), this.mat('#e0457f'), 0);
        gem.position.set(0, 0.29, 0.21);
        break;
      }
      case 'witch_hat': {
        const brim = add(geo('wbrim', () => new THREE.CylinderGeometry(0.48, 0.48, 0.03, 18)));
        brim.position.y = 0.2;
        const cone = add(geo('wcone', () => new THREE.ConeGeometry(0.26, 0.6, 12)));
        cone.position.set(0, 0.5, -0.05);
        cone.rotation.x = -0.25;
        const moon = add(geo('wmoon', () => new THREE.SphereGeometry(0.05, 6, 4)), this.mat('#ffe48a'), 0);
        moon.position.set(0, 0.42, 0.18);
        break;
      }
      default:
        break;
    }
  }

  buildAcc(hips, head, id) {
    const c = COSMETICS[id];
    if (!c) return;
    const mat = this.mat(c.color);
    switch (id) {
      case 'sunglasses': {
        for (const sx of [-1, 1]) {
          const lens = part(geo('lens', () => new THREE.BoxGeometry(0.11, 0.07, 0.02)), mat, 0.01);
          lens.position.set(sx * 0.095, 0.01, 0.265);
          head.add(lens);
        }
        const br = part(geo('bridge', () => new THREE.BoxGeometry(0.06, 0.015, 0.015)), mat, 0);
        br.position.set(0, 0.03, 0.27);
        head.add(br);
        break;
      }
      case 'eyepatch': {
        const p = part(geo('patch', () => new THREE.CircleGeometry(0.06, 10)), mat, 0);
        p.position.set(0.095, 0.01, 0.262);
        head.add(p);
        const strap = part(geo('strap', () => new THREE.TorusGeometry(0.275, 0.008, 4, 24)), mat, 0);
        strap.rotation.set(0, 0, -0.5);
        strap.position.y = 0.06;
        strap.rotation.x = Math.PI / 2;
        head.add(strap);
        break;
      }
      case 'lei': {
        const cols = ['#f2a2b8', '#ffffff', '#f7c95c', '#e86f8a'];
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const f = part(geo('leif', () => new THREE.SphereGeometry(0.045, 6, 5)), this.mat(cols[i % 4]), 0.01);
          f.position.set(Math.cos(a) * 0.2, 0.56 - (Math.sin(a) > 0 ? Math.sin(a) * 0.1 : 0), Math.sin(a) * 0.16);
          hips.add(f);
        }
        break;
      }
      case 'scarf': {
        const s = part(geo('scarf', () => new THREE.TorusGeometry(0.14, 0.05, 6, 14)), mat);
        s.rotation.x = Math.PI / 2;
        s.position.y = 0.6;
        hips.add(s);
        const tail = part(geo('scarftail', () => new THREE.BoxGeometry(0.09, 0.28, 0.04)), mat);
        tail.position.set(0.08, 0.46, 0.17);
        tail.rotation.z = 0.15;
        hips.add(tail);
        break;
      }
      case 'backpack': {
        const p = part(geo('pack', () => new THREE.BoxGeometry(0.34, 0.4, 0.18)), mat);
        p.position.set(0, 0.32, -0.22);
        hips.add(p);
        const flap = part(geo('flap', () => new THREE.BoxGeometry(0.36, 0.14, 0.2)), this.mat('#8a4a2a'), 0);
        flap.position.set(0, 0.49, -0.22);
        hips.add(flap);
        break;
      }
      case 'wings': {
        const wm = toon(c.color, { transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        this.materials.push(wm);
        for (const sx of [-1, 1]) {
          const w = part(geo('wing', () => new THREE.CircleGeometry(0.3, 12)), wm, 0);
          w.position.set(sx * 0.22, 0.45, -0.2);
          w.rotation.set(0, sx * 0.7, sx * 0.3);
          w.scale.set(1, 1.4, 1);
          hips.add(w);
          w.userData.wing = sx;
        }
        break;
      }
      default:
        break;
    }
  }

  /** Attach a held item: 'rod' | 'weapon' | null. */
  hold(kind, id, force = false) {
    if (!force && this.heldKind === kind && this.heldId === id) return;
    if (this.held) {
      this.held.parent?.remove(this.held);
      this.held = null;
    }
    this.heldKind = kind;
    this.heldId = id;
    if (!kind || !id) return;
    const g = new THREE.Group();
    if (kind === 'rod') {
      const rod = RODS_BY_ID[id];
      const stick = part(geo('rodStick', () => new THREE.CylinderGeometry(0.018, 0.03, 2.0, 6)), toon(rod?.color ?? '#c9a65b'), 0.012);
      stick.position.y = 0.85;
      g.add(stick);
      const reel = part(geo('reel', () => new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10)), toon('#3a3040'), 0.01);
      reel.rotation.z = Math.PI / 2;
      reel.position.set(0.05, 0.1, 0);
      g.add(reel);
      this.rodTip = new THREE.Object3D();
      this.rodTip.position.y = 1.85;
      g.add(this.rodTip);
      g.rotation.x = 2.35; // points forward & up while in the fishing pose
    } else if (kind === 'weapon') {
      const w = WEAPONS_BY_ID[id];
      if (!w || id === 'fists') return;
      if (id === 'stick') {
        const club = part(geo('club', () => new THREE.CylinderGeometry(0.08, 0.04, 0.9, 6)), toon(w.color), 0.015);
        club.position.y = 0.4;
        g.add(club);
      } else if (id === 'trident') {
        const shaft = part(geo('tshaft', () => new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6)), toon('#c8a040'), 0.012);
        shaft.position.y = 0.6;
        g.add(shaft);
        for (const dx of [-0.1, 0, 0.1]) {
          const prong = part(geo('prong', () => new THREE.ConeGeometry(0.03, 0.3, 4)), toon(w.color), 0.01);
          prong.position.set(dx, 1.45 + (dx === 0 ? 0.05 : 0), 0);
          g.add(prong);
        }
      } else {
        const blade = part(geo('blade', () => new THREE.BoxGeometry(0.07, 0.85, 0.02)), toon(w.color), 0.012);
        blade.position.y = 0.55;
        g.add(blade);
        const tip = part(geo('bladetip', () => new THREE.ConeGeometry(0.05, 0.16, 4)), toon(w.color), 0.012);
        tip.position.y = 1.05;
        tip.scale.z = 0.3;
        g.add(tip);
        const guard = part(geo('guard', () => new THREE.BoxGeometry(0.22, 0.04, 0.06)), toon('#c8a040'), 0.01);
        guard.position.y = 0.12;
        g.add(guard);
        const hilt = part(geo('hilt', () => new THREE.CylinderGeometry(0.025, 0.025, 0.18, 6)), toon('#4a3428'), 0.01);
        hilt.position.y = 0.02;
        g.add(hilt);
      }
      g.rotation.x = Math.PI / 2;
    }
    this.rightHand.add(g);
    this.held = g;
  }

  play(action, duration = 0.4) {
    this.action = action;
    this.actionT = 0;
    this.actionDur = duration;
  }

  /** state: { speed, grounded, pose } */
  update(dt, state = {}) {
    const speed = state.speed ?? 0;
    const moving = speed > 0.3;
    const amt = Math.min(speed / 5, 1.3);
    this.phase += dt * (moving ? 3.4 + speed * 1.1 : 1.6);
    const p = this.phase;

    let bob = 0;
    const [lArm, rArm] = this.arms;
    const [lLeg, rLeg] = this.legs;
    if (moving && state.grounded !== false) {
      lLeg.hip.rotation.x = Math.sin(p) * 0.75 * amt;
      rLeg.hip.rotation.x = -Math.sin(p) * 0.75 * amt;
      lLeg.knee.rotation.x = Math.max(0, -Math.sin(p - 0.6)) * 1.0 * amt;
      rLeg.knee.rotation.x = Math.max(0, Math.sin(p - 0.6)) * 1.0 * amt;
      lArm.shoulder.rotation.x = -Math.sin(p) * 0.65 * amt;
      rArm.shoulder.rotation.x = Math.sin(p) * 0.65 * amt;
      lArm.elbow.rotation.x = -0.35 - amt * 0.3;
      rArm.elbow.rotation.x = -0.35 - amt * 0.3;
      bob = Math.abs(Math.sin(p)) * 0.06 * amt;
      this.body.rotation.x = 0.06 * amt;
    } else if (state.grounded === false) {
      lLeg.hip.rotation.x = -0.5;
      rLeg.hip.rotation.x = 0.2;
      lLeg.knee.rotation.x = 0.9;
      rLeg.knee.rotation.x = 0.4;
      lArm.shoulder.rotation.x = -0.4;
      rArm.shoulder.rotation.x = -0.4;
      lArm.shoulder.rotation.z = -0.5;
      rArm.shoulder.rotation.z = 0.5;
    } else {
      for (const l of this.legs) {
        l.hip.rotation.x *= 0.8;
        l.knee.rotation.x *= 0.8;
      }
      lArm.shoulder.rotation.x = Math.sin(p) * 0.04;
      rArm.shoulder.rotation.x = Math.sin(p) * 0.04;
      lArm.elbow.rotation.x = -0.15;
      rArm.elbow.rotation.x = -0.15;
      bob = Math.sin(p * 1.0) * 0.012;
      this.body.rotation.x *= 0.85;
    }
    if (state.grounded !== false) {
      lArm.shoulder.rotation.z = -0.08;
      rArm.shoulder.rotation.z = 0.08;
    }

    // poses override arms
    const pose = state.pose;
    if (pose === 'fish') {
      rArm.shoulder.rotation.x = -0.9;
      rArm.elbow.rotation.x = -0.5;
      lArm.shoulder.rotation.x = -0.7;
      lArm.shoulder.rotation.z = 0.3;
      lArm.elbow.rotation.x = -0.9;
    } else if (pose === 'reel') {
      const r = Math.sin(this.phase * 6) * 0.15;
      rArm.shoulder.rotation.x = -1.0 + r;
      rArm.elbow.rotation.x = -0.6;
      lArm.shoulder.rotation.x = -0.9 - r;
      lArm.shoulder.rotation.z = 0.35;
      lArm.elbow.rotation.x = -1.0;
      this.body.rotation.x = -0.12;
    } else if (pose === 'sit') {
      lLeg.hip.rotation.x = -1.4;
      rLeg.hip.rotation.x = -1.4;
      lLeg.knee.rotation.x = 1.4;
      rLeg.knee.rotation.x = 1.4;
      bob = -0.35;
    } else if (pose === 'cheer') {
      lArm.shoulder.rotation.z = -2.6 + Math.sin(p * 4) * 0.2;
      rArm.shoulder.rotation.z = 2.6 - Math.sin(p * 4) * 0.2;
      bob = Math.abs(Math.sin(p * 4)) * 0.1;
    }

    // one-shot actions
    if (this.action) {
      this.actionT += dt;
      const t = Math.min(this.actionT / this.actionDur, 1);
      if (this.action === 'swing') {
        const s = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65;
        rArm.shoulder.rotation.x = -0.4 - (t < 0.35 ? 2.0 * s : 2.0 * s - 0.6);
        rArm.shoulder.rotation.z = 0.2 + (t < 0.35 ? 0.4 : -0.6) * s;
        rArm.elbow.rotation.x = -0.2;
        this.body.rotation.y = (t < 0.35 ? -0.4 * s : 0.5 * s);
      } else if (this.action === 'cast') {
        const s = Math.sin(t * Math.PI);
        rArm.shoulder.rotation.x = -0.9 - (t < 0.4 ? 1.8 * (t / 0.4) : 1.8 * (1 - (t - 0.4) / 0.6));
        rArm.elbow.rotation.x = -0.4 - s * 0.3;
      } else if (this.action === 'hurt') {
        this.body.rotation.x = -0.35 * (1 - t);
      } else if (this.action === 'wave') {
        rArm.shoulder.rotation.z = 2.4;
        rArm.elbow.rotation.z = Math.sin(t * Math.PI * 6) * 0.5;
      } else if (this.action === 'dig' || this.action === 'plant') {
        const s = Math.sin(t * Math.PI * 3);
        this.body.rotation.x = 0.45 + s * 0.15;
        rArm.shoulder.rotation.x = -0.8 + s * 0.4;
        lArm.shoulder.rotation.x = -0.8 + s * 0.4;
      } else if (this.action === 'jump') {
        // handled by grounded flag
      }
      if (t >= 1) {
        this.action = null;
        this.body.rotation.y = 0;
        rArm.elbow.rotation.z = 0;
      }
    }

    this.body.position.y = bob;
    // blink
    const blink = (this.phase % 7.3) < 0.12 ? 0.1 : 1;
    for (const e of this.eyes) e.scale.y = (this.look.gender === 'f' ? 1.25 : 1.05) * blink;

    // hit flash
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt);
      for (const m of this.allMats) {
        if (!m.emissive) continue;
        if (this.flash > 0) m.emissive.setRGB(0.7, 0.25, 0.2);
        else m.emissive.copy(m.userData.baseEmissive || m.emissive.setRGB(0, 0, 0));
      }
    }
  }

  hit() {
    this.flash = 0.18;
    this.play('hurt', 0.3);
  }

  dispose() {
    this.root.parent?.remove(this.root);
    for (const m of this.materials) m.dispose();
  }
}
