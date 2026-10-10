import * as THREE from 'three';
import { G, inked } from '../world/toon.js';
import { el } from '../shared/utils.js';

const LEN = 13.2;
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const seg = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;

/**
 * Opening cutscene for a new islander: the storm has washed you up on Palmora's beach.
 * The camera drifts in from the sea, you come round, sit up, get to your feet and look
 * at the island — then control is handed over. Skippable at any time.
 */
export class Intro {
  constructor(game) {
    this.game = game;
    this.active = false;
  }

  /** Lays the player out on the sand and starts rolling. Resolves when it's over (or skipped). */
  start() {
    const g = this.game;
    const w = g.world;
    this.active = true;
    this.t = 0;
    this.ending = false;
    // a stretch of sand east of the dock, a short walk from the village
    const shore = w.findShore(12, 18, 0.35, 1);
    this.dir = new THREE.Vector3(shore.dx, 0, shore.dz);
    this.side = new THREE.Vector3(this.dir.z, 0, -this.dir.x);
    const at = new THREE.Vector3(shore.x, 0, shore.z).addScaledVector(this.dir, -1.7);
    this.yaw0 = Math.atan2(this.dir.x, this.dir.z); // feet toward the sea
    g.player.teleport(at.x, at.z, this.yaw0);
    this.at = g.player.pos.clone();
    this.shore = new THREE.Vector3(shore.x, 0, shore.z);
    g.cam.mode = 'intro';
    this.buildWreckage();
    this.buildOverlay();
    this.onKey = (e) => {
      if (['Escape', 'Enter', 'Space', 'KeyE'].includes(e.code)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.skip();
      }
    };
    window.addEventListener('keydown', this.onKey, true);
    g.audio.sfx('splash');
    this.place(0);
    return new Promise((r) => (this.resolve = r));
  }

  buildWreckage() {
    const g = this.game;
    const w = g.world;
    const grp = new THREE.Group();
    const put = (geo, color, pos, rot, scale) => {
      const m = inked(geo, color, 0.02);
      m.position.copy(pos);
      m.rotation.set(rot[0], rot[1], rot[2]);
      m.scale.set(scale[0], scale[1], scale[2]);
      m.castShadow = true;
      grp.add(m);
      return m;
    };
    const ground = (v) => v.setY(w.groundAt(v.x, v.z));
    // planks from the wrecked boat, a barrel and a coil of rope on the sand
    const a = ground(this.at.clone().addScaledVector(this.side, 1.5).addScaledVector(this.dir, 0.5));
    put(G.box, '#8a6a4a', a.clone().setY(a.y + 0.05), [0, this.yaw0 + 0.5, 0], [0.24, 0.08, 1.6]);
    const a2 = ground(this.at.clone().addScaledVector(this.side, 2.1).addScaledVector(this.dir, -0.4));
    put(G.box, '#7a5a3e', a2.clone().setY(a2.y + 0.05), [0, this.yaw0 - 0.3, 0.1], [0.22, 0.07, 1.1]);
    const bp = ground(this.at.clone().addScaledVector(this.side, -1.9).addScaledVector(this.dir, 0.8));
    put(G.cyl8, '#9a6a44', bp.clone().setY(bp.y + 0.32), [Math.PI / 2, this.yaw0 + 1.1, 0], [0.32, 0.75, 0.32]);
    const rp = ground(this.at.clone().addScaledVector(this.side, -1.2).addScaledVector(this.dir, -1.3));
    put(G.torus, '#d8c08a', rp.clone().setY(rp.y + 0.06), [Math.PI / 2, 0, 0], [0.25, 0.25, 0.25]);
    // and one plank still bobbing in the surf
    const fp = this.shore.clone().addScaledVector(this.dir, 3.2).addScaledVector(this.side, -0.8);
    this.floater = put(G.box, '#8a6a4a', fp.setY(0.05), [0, this.yaw0 + 1.2, 0], [0.24, 0.08, 1.4]);
    g.scene.add(grp);
    this.wreck = grp;
  }

  buildOverlay() {
    const g = this.game;
    this.capEl = el('div', { class: 'intro-cap' });
    this.skipBtn = el('button', { class: 'intro-skip', type: 'button', text: 'Skip ▸', 'aria-label': 'Skip intro', onclick: () => this.skip() });
    this.root = el('div', { class: 'intro' }, [el('div', { class: 'intro-bar top' }), el('div', { class: 'intro-bar bottom' }), this.capEl, this.skipBtn]);
    g.ui.root.append(this.root);
    setTimeout(() => this.root?.classList.add('on'), 30);
    this.caps = [
      { a: 0.6, b: 3.9, text: 'Last night, a storm swept across the islands…' },
      { a: 4.4, b: 7.2, text: '…and the tide carried you to an unknown shore.' },
      { a: 10.6, b: 12.9, text: `“Where… am I?”`, say: true },
    ];
    this.cap = null;
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this.place(this.t, dt);
    const c = this.caps.find((x) => this.t >= x.a && this.t < x.b) || null;
    if (c !== this.cap) {
      this.cap = c;
      this.capEl.classList.remove('show');
      if (c) {
        this.capEl.textContent = c.text;
        this.capEl.classList.toggle('say', !!c.say);
        void this.capEl.offsetWidth;
        this.capEl.classList.add('show');
      }
    }
    if (this.t >= LEN) this.end();
  }

  /** Poses the character and frames the camera for time t. */
  place(t, dt = 0) {
    const g = this.game;
    const p = g.player;
    const ch = p.char;
    const cam = g.camera;
    if (this.floater) {
      this.floater.position.y = 0.04 + Math.sin(g.t * 1.6) * 0.07;
      this.floater.rotation.z = Math.sin(g.t * 1.1) * 0.12;
    }

    // ── the character ──
    ch.update(dt, { speed: 0, grounded: true });
    const [lLeg, rLeg] = ch.legs;
    const [lArm, rArm] = ch.arms;
    const sitK = seg(t, 7.2, 8.6); // lying → sitting
    const standK = seg(t, 9.8, 11.0); // sitting → standing
    const turnK = seg(t, 11.0, 12.0); // turn round to face the island
    // hips: -90° lying on your back, upright once sitting
    const breathe = t < 7.2 ? Math.sin(t * 2.2) * 0.025 : 0;
    ch.hips.rotation.x = -Math.PI / 2 * (1 - sitK) + breathe;
    // legs stay flat on the sand while you sit up, then fold under you as you stand
    const legFlat = -Math.PI / 2 - ch.hips.rotation.x + breathe;
    const legX = lerp(legFlat, 0, standK);
    const knee = Math.sin(standK * Math.PI) * 1.5;
    for (const l of [lLeg, rLeg]) {
      l.hip.rotation.x = legX - (standK > 0 ? Math.sin(standK * Math.PI) * 0.6 : 0);
      l.knee.rotation.x = knee;
    }
    ch.body.position.y = lerp(lerp(-0.66, -0.7, sitK), 0, standK) - Math.sin(standK * Math.PI) * 0.1;
    ch.body.rotation.x = Math.sin(standK * Math.PI) * 0.45;
    // arms: limp at your sides, then pushing on the sand to sit up
    const prop = sitK * (1 - standK);
    for (const a of [lArm, rArm]) {
      a.shoulder.rotation.x = lerp(0, 0.55, prop);
      a.shoulder.rotation.z = a.side * lerp(0.35, 0.18, sitK);
      a.elbow.rotation.x = -0.1;
    }
    // a cough and a twitch, then the eyes open
    const twitch = t > 5.2 && t < 5.9 ? Math.sin((t - 5.2) * 18) * 0.12 * (1 - (t - 5.2) / 0.7) : 0;
    ch.head.rotation.x = twitch;
    // look left and right while sitting, then around at the island
    let look = 0;
    if (t > 8.6 && t < 9.8) look = Math.sin(((t - 8.6) / 1.2) * Math.PI * 2) * 0.7;
    ch.head.rotation.y = look;
    if (t < 6.3) {
      ch.headMat.map = ch.faceClosed;
      ch.headMat.emissiveMap = ch.faceClosed;
    }
    // scratch your head, puzzled
    if (t > 12.0) {
      const s = Math.min(1, (t - 12.0) / 0.3);
      rArm.shoulder.rotation.z = lerp(0.08, 2.3, s);
      rArm.shoulder.rotation.x = -0.4 * s;
      rArm.elbow.rotation.x = -1.6 * s + Math.sin(t * 16) * 0.15 * s;
    }
    p.yaw = this.yaw0 + Math.PI * turnK;
    p.root.rotation.y = p.yaw;
    if (turnK > 0 && turnK < 1) {
      // little steps while turning on the spot
      const st = Math.sin(t * 14) * 0.35;
      lLeg.hip.rotation.x = st;
      rLeg.hip.rotation.x = -st;
    }

    // ── the camera ──
    const at = this.at;
    const up = new THREE.Vector3(0, 1, 0);
    let pos;
    let look3;
    if (t < 4.2) {
      // drifting in from the sea, low over the waves
      const k = seg(t, 0, 4.2) * 0.8 + (t / 4.2) * 0.2;
      pos = at.clone().addScaledVector(this.dir, lerp(24, 8, k)).addScaledVector(this.side, lerp(-6, -2, k)).addScaledVector(up, lerp(4.5, 2.2, k));
      look3 = at.clone().addScaledVector(up, 0.3);
    } else if (t < 7.2) {
      // looking straight down at the castaway, slowly turning
      const k = (t - 4.2) / 3;
      const head = at.clone().addScaledVector(this.dir, -0.85);
      // from the feet end, so the face is the right way up on screen
      const ang = lerp(-0.35, 0.3, k);
      const off = this.dir.clone().multiplyScalar(Math.cos(ang)).addScaledVector(this.side, Math.sin(ang));
      pos = head.clone().addScaledVector(off, lerp(1.6, 1.1, k)).addScaledVector(up, lerp(3.2, 2.2, k));
      look3 = head.clone().addScaledVector(up, 0.15);
    } else {
      // from the surf: you sit up facing us, stand, then turn to look at the island over your shoulder
      const k = seg(t, 7.2, LEN);
      pos = at.clone().addScaledVector(this.dir, lerp(4.4, 3.8, k)).addScaledVector(this.side, lerp(1.7, 0.9, k)).addScaledVector(up, lerp(1.2, 2.1, k));
      look3 = at.clone().addScaledVector(up, lerp(0.5, 1.25, standK)).addScaledVector(this.dir, -6 * turnK);
    }
    // never dip below the sand or the waves
    pos.y = Math.max(pos.y, Math.max(g.world.groundAt(pos.x, pos.z), 0) + 0.6);
    cam.position.copy(pos);
    cam.lookAt(look3);
    g.cam.target.copy(look3);
  }

  skip() {
    if (!this.active || this.ending) return;
    this.end();
  }

  async end() {
    if (this.ending) return;
    this.ending = true;
    const g = this.game;
    await g.ui.fade(true, 450);
    this.cleanup();
    this.resolve?.();
  }

  cleanup() {
    const g = this.game;
    this.active = false;
    window.removeEventListener('keydown', this.onKey, true);
    this.wreck?.parent?.remove(this.wreck);
    this.wreck = null;
    this.floater = null;
    this.root?.remove();
    // stand the character back up properly and face the island
    const p = g.player;
    const ch = p.char;
    ch.hips.rotation.set(0, 0, 0);
    ch.head.rotation.set(0, 0, 0);
    ch.body.rotation.set(0, 0, 0);
    ch.body.position.y = 0;
    for (const l of ch.legs) {
      l.hip.rotation.x = 0;
      l.knee.rotation.x = 0;
    }
    for (const a of ch.arms) {
      a.shoulder.rotation.set(0, 0, 0);
      a.elbow.rotation.set(0, 0, 0);
    }
    p.yaw = this.yaw0 + Math.PI;
    p.root.rotation.y = p.yaw;
  }
}
