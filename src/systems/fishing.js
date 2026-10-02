import * as THREE from 'three';
import { FISH, TIERS, tierIndex } from '../data/fish.js';
import { RODS_BY_ID, BAITS_BY_ID, PETS_BY_ID } from '../data/gear.js';
import { ITEMS } from '../data/items.js';
import { inked } from '../world/toon.js';
import { rand, clamp, lerp, el } from '../core/utils.js';
import { fishSVG, rarityBadge } from '../ui/icons.js';

export function rollFish({ island, night, rain, luck }) {
  const cands = FISH.filter(
    (f) => (f.where.includes('*') || f.where.includes(island)) && (f.time === 'any' || (f.time === 'night') === night) && (f.weather === 'any' || (f.weather === 'rain' && rain)),
  );
  const perTier = {};
  for (const f of cands) perTier[f.tier] = (perTier[f.tier] || 0) + 1;
  let total = 0;
  const weights = cands.map((f) => {
    const idx = tierIndex(f.tier);
    let w = TIERS[f.tier].weight / perTier[f.tier];
    if (f.tier === 'junk') w *= Math.max(0.15, 1 - luck * 0.6);
    if (idx >= 3) w *= 1 + luck * (idx - 2) * 0.9;
    total += w;
    return w;
  });
  let x = Math.random() * total;
  for (let i = 0; i < cands.length; i++) {
    x -= weights[i];
    if (x <= 0) return cands[i];
  }
  return cands[0];
}

export function rollWeight(f, luck) {
  const [a, b] = f.w;
  const t = Math.pow(Math.random(), Math.max(0.6, 1.8 - Math.min(luck, 1.5) * 0.5));
  return Math.round((a + (b - a) * t) * 100) / 100;
}

export function fishPoints(f, w) {
  const [a, b] = f.w;
  return Math.round(f.price * (0.6 + 0.8 * ((w - a) / (b - a || 1))));
}

export class FishingSystem {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.phase = null;
    this.bobber = new THREE.Group();
    const top = inked(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#e2434b', 0.012);
    const bottom = inked(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#ffffff', 0.012);
    this.bobber.add(top, bottom);
    this.bobber.visible = false;
    game.scene.add(this.bobber);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
    this.line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#2a2534', transparent: true, opacity: 0.8 }));
    this.line.frustumCulled = false;
    this.line.visible = false;
    game.scene.add(this.line);
    this.ui = null;
  }

  rod() {
    return RODS_BY_ID[this.game.state.rod];
  }

  /** Point in the water in front of the player, or null. */
  spotAhead() {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) return null;
    const f = p.forward();
    for (const d of [7, 5.8, 4.6, 3.4]) {
      const x = p.pos.x + f.x * d;
      const z = p.pos.z + f.z * d;
      if (w.heightAt(x, z) < -0.3 && w.groundAt(x, z) < 0) return new THREE.Vector3(x, 0, z);
    }
    return null;
  }

  luck() {
    const g = this.game;
    const s = g.state;
    const rod = this.rod();
    const bait = this.baitUsed ? BAITS_BY_ID[this.baitUsed] : null;
    let l = (rod?.luck ?? 0) + (bait?.luck ?? -0.05);
    if (bait?.nightLuck && g.time.isNight()) l += bait.nightLuck;
    if (s.pet) l += PETS_BY_ID[s.pet]?.luck ?? 0;
    return l;
  }

  start() {
    const g = this.game;
    const s = g.state;
    if (!s.rod) {
      g.ui.toast('You need a fishing rod. Visit Old Finn at the Palmora dock!', 'warn');
      return;
    }
    const spot = this.spotAhead();
    if (!spot) return;
    this.baitUsed = null;
    if (s.bait && (s.inventory[s.bait] || 0) > 0) {
      g.removeItem(s.bait, 1, true);
      this.baitUsed = s.bait;
    } else {
      // fall back to any bait we have
      const any = ['bait_magic', 'bait_glow', 'bait_shrimp', 'bait_worm'].find((b) => (s.inventory[b] || 0) > 0);
      if (any) {
        g.removeItem(any, 1, true);
        this.baitUsed = any;
      }
    }
    if (!this.baitUsed) g.ui.toast('No bait — fish bite slower. Buy worms from Finn!', 'info');
    this.active = true;
    this.phase = 'cast';
    this.t = 0;
    this.target = spot;
    const p = g.player;
    p.locked = true;
    p.pose = 'fish';
    p.char.hold('rod', s.rod);
    p.char.play('cast', 0.55);
    g.audio.sfx('cast');
    this.bobber.visible = true;
    this.line.visible = true;
    g.ui.setPrompt(null);
  }

  cancel(msg) {
    if (!this.active) return;
    this.cleanup();
    if (msg) this.game.ui.toast(msg, 'info');
  }

  cleanup() {
    const p = this.game.player;
    this.active = false;
    this.phase = null;
    this.bobber.visible = false;
    this.line.visible = false;
    if (p) {
      p.locked = false;
      p.pose = null;
      p.char.hold(null);
    }
    this.removeUI();
  }

  rodTip() {
    const p = this.game.player;
    const v = new THREE.Vector3();
    if (p.char.rodTip) p.char.rodTip.getWorldPosition(v);
    else v.copy(p.pos).add(new THREE.Vector3(0, 1.8, 0));
    return v;
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game;
    const input = g.input;
    this.t += dt;
    const tip = this.rodTip();
    const water = 0.02;

    // walking away cancels
    const a = input.axis();
    if (this.phase !== 'reel' && this.phase !== 'result' && (Math.abs(a.x) + Math.abs(a.y) > 0.1 || input.pressed('Escape'))) {
      this.cancel('Reeled in.');
      return;
    }

    switch (this.phase) {
      case 'cast': {
        const t = clamp(this.t / 0.7, 0, 1);
        const start = tip;
        this.bobber.position.set(lerp(start.x, this.target.x, t), lerp(start.y, water, t) + Math.sin(t * Math.PI) * 2.2, lerp(start.z, this.target.z, t));
        if (t >= 1) {
          g.particles.burst(this.bobber.position, { count: 10, color: '#e8fbff', speed: 1.6, up: 2.5, life: 0.6 });
          g.audio.sfx('splash');
          this.phase = 'wait';
          this.t = 0;
          const rod = this.rod();
          const bait = this.baitUsed ? BAITS_BY_ID[this.baitUsed] : null;
          const mul = (rod?.speed ?? 1) * (bait?.speed ?? 1.3) * (g.weather.raining() ? 0.85 : 1);
          this.waitTime = rand(2.5, 7.5) * mul;
          this.nibbles = [rand(0.8, this.waitTime * 0.5), rand(this.waitTime * 0.5, this.waitTime - 0.4)];
          this.showHint('Waiting for a bite… (move to reel in)');
        }
        break;
      }
      case 'wait': {
        let dip = 0;
        for (const n of this.nibbles) if (this.t > n && this.t < n + 0.25) dip = -0.06;
        this.bobber.position.set(this.target.x, water + Math.sin(this.t * 2.5) * 0.035 + dip, this.target.z);
        if (input.anyPressed('KeyE', 'Space') || input.mouse.clicked) {
          this.cancel('Too early! Wait for the "!"');
          return;
        }
        if (this.t >= this.waitTime) {
          this.phase = 'bite';
          this.t = 0;
          this.fish = rollFish({ island: g.world.id, night: g.time.isNight(), rain: g.weather.raining(), luck: this.luck() });
          this.window = Math.max(0.6, 1.1 - this.fish.diff * 0.04);
          g.audio.sfx('bite');
          g.particles.burst(this.bobber.position, { count: 8, color: '#ffffff', speed: 1.2, up: 2, life: 0.4 });
          this.showBite();
          g.cam.shake(0.15);
        }
        break;
      }
      case 'bite': {
        this.bobber.position.set(this.target.x, water - 0.18 + Math.sin(this.t * 30) * 0.04, this.target.z);
        this.positionBite();
        if (input.anyPressed('KeyE', 'Space') || input.mouse.clicked || input.virtualPressed.has('Reel')) {
          this.beginReel();
        } else if (this.t > this.window) {
          this.cancel('It got away… Press E faster next time!');
          g.audio.sfx('miss');
        }
        break;
      }
      case 'reel':
        this.updateReel(dt);
        this.bobber.position.set(this.target.x + Math.sin(this.t * 7) * 0.2, water - 0.1, this.target.z + Math.cos(this.t * 5) * 0.2);
        if (Math.random() < dt * 6) g.particles.burst(this.bobber.position, { count: 2, color: '#e8fbff', speed: 1, up: 1.5, life: 0.4 });
        break;
      case 'result':
        if (this.t > 0.4 && (input.anyPressed('KeyE', 'Space', 'Enter', 'Escape') || input.mouse.clicked)) {
          this.cleanup();
        }
        break;
    }
    this.updateLine(tip);
  }

  updateLine(tip) {
    const pos = this.line.geometry.getAttribute('position');
    const b = this.bobber.position;
    const n = pos.count;
    const sag = this.phase === 'reel' ? 0.05 : this.phase === 'cast' ? 0.1 : 0.6;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      pos.setXYZ(i, lerp(tip.x, b.x, t), lerp(tip.y, b.y, t) - Math.sin(t * Math.PI) * sag, lerp(tip.z, b.z, t));
    }
    pos.needsUpdate = true;
  }

  // ── reel minigame ─────────────────────────────
  beginReel() {
    const g = this.game;
    const rod = this.rod();
    this.phase = 'reel';
    this.t = 0;
    g.player.pose = 'reel';
    g.audio.sfx('hook');
    const f = this.fish;
    const lvlBonus = Math.min(g.state.level * 0.002, 0.04);
    this.mg = {
      zone: clamp((rod?.zone ?? 0.25) + lvlBonus - (f.tier === 'junk' ? -0.1 : 0), 0.15, 0.6),
      zonePos: 0.3,
      zoneVel: 0,
      fishPos: 0.4,
      fishTarget: 0.5,
      fishVel: 0,
      retarget: 0,
      progress: 0.3,
      perfect: true,
      diff: f.diff,
      reel: rod?.reel ?? 1,
      chest: Math.random() < 0.22 ? { pos: rand(0.1, 0.9), got: 0, done: false } : null,
    };
    this.buildUI();
  }

  updateReel(dt) {
    const m = this.mg;
    const g = this.game;
    const hold = g.input.holding();
    // player zone physics
    m.zoneVel += (hold ? 3.4 : -2.9) * dt;
    m.zoneVel *= Math.exp(-0.8 * dt);
    m.zoneVel = clamp(m.zoneVel, -1.3, 1.3);
    m.zonePos += m.zoneVel * dt;
    const maxPos = 1 - m.zone;
    if (m.zonePos < 0) {
      m.zonePos = 0;
      m.zoneVel = Math.abs(m.zoneVel) * 0.2;
    } else if (m.zonePos > maxPos) {
      m.zonePos = maxPos;
      m.zoneVel = -Math.abs(m.zoneVel) * 0.2;
    }
    // fish AI: calm for easy fish, frantic darts for legends
    const d = m.diff;
    m.retarget -= dt;
    if (m.retarget <= 0) {
      const jump = 0.08 + d * 0.045 + Math.max(0, d - 6) * 0.05;
      const dart = Math.random() < d * 0.035;
      m.fishTarget = clamp(m.fishPos + (Math.random() * 2 - 1) * jump * (dart ? 2.4 : 1), 0.04, 0.96);
      m.retarget = rand(0.6, 1.8) / (0.6 + d * 0.1);
    }
    const speed = 0.15 + d * 0.09 + Math.max(0, d - 6) * 0.12;
    m.fishVel += (m.fishTarget - m.fishPos) * speed * 8 * dt;
    m.fishVel *= Math.exp(-4 * dt);
    m.fishPos = clamp(m.fishPos + m.fishVel * dt, 0, 1);

    const inside = m.fishPos >= m.zonePos && m.fishPos <= m.zonePos + m.zone;
    if (inside) m.progress += 0.21 * m.reel * dt;
    else {
      m.progress -= (0.06 + d * 0.014 + Math.max(0, d - 6) * 0.035) * dt;
      if (this.t > 0.6) m.perfect = false;
    }
    if (m.chest && !m.done) {
      const cin = m.chest.pos >= m.zonePos && m.chest.pos <= m.zonePos + m.zone;
      if (cin && !m.chest.done) {
        m.chest.got += dt;
        if (m.chest.got > 1.3) {
          m.chest.done = true;
          g.audio.sfx('chest');
        }
      }
    }
    this.renderUI(inside);
    if (m.progress >= 1) this.success();
    else if (m.progress <= 0) {
      g.audio.sfx('miss');
      this.cancel(`The ${this.fish.tier === 'junk' ? 'junk' : 'fish'} snapped free!`);
    }
  }

  success() {
    const g = this.game;
    const f = this.fish;
    const luck = this.luck();
    const weight = rollWeight(f, luck);
    const perfect = this.mg.perfect;
    const chest = this.mg.chest?.done;
    this.removeUI();
    this.phase = 'result';
    this.t = 0;
    this.bobber.visible = false;
    this.line.visible = false;
    g.player.pose = 'cheer';
    const res = g.recordCatch(f, weight, { perfect });
    if (chest) {
      const r = Math.random();
      if (r < 0.45) g.give({ coins: 40 + Math.floor(Math.random() * 120) }, { quiet: false });
      else if (r < 0.8) g.give({ gems: 1 + Math.floor(Math.random() * 3) });
      else g.give({ items: { bottle: 1 } });
    }
    this.showResult(f, weight, res, perfect, chest);
  }

  // ── UI pieces ─────────────────────────────────
  showHint(text) {
    this.removeUI();
    this.ui = el('div', { class: 'fish-hint', role: 'status' }, [text]);
    this.game.ui.layer.append(this.ui);
  }
  showBite() {
    this.removeUI();
    this.ui = el('div', { class: 'bite-mark', 'aria-live': 'assertive' }, [el('span', { text: '!' }), el('small', { text: this.game.input.isTouch ? 'TAP!' : 'Press E!' })]);
    this.game.ui.layer.append(this.ui);
    this.positionBite();
  }
  positionBite() {
    if (!this.ui) return;
    const p = this.bobber.position.clone();
    p.y += 1.2;
    const s = this.game.ui.project(p);
    if (s) {
      this.ui.style.left = `${s.x}px`;
      this.ui.style.top = `${s.y}px`;
    }
  }
  buildUI() {
    this.removeUI();
    const f = this.fish;
    const touch = this.game.input.isTouch;
    this.ui = el('div', { class: 'reel-ui', role: 'group', 'aria-label': 'Fishing minigame' }, [
      el('div', { class: 'reel-title' }, [el('span', { class: 'reel-q', text: '?' }), el('span', { text: f.diff >= 7 ? 'Something BIG!' : f.diff >= 4.5 ? 'A strong fish!' : 'A fish is hooked!' })]),
      el('div', { class: 'reel-body' }, [
        el('div', { class: 'reel-track' }, [
          el('div', { class: 'reel-zone' }),
          el('div', { class: 'reel-fish', html: fishSVG(f.tier === 'junk' ? { colors: ['#2a2534', '#4a4458', '#2a2534'], shape: 'normal' } : { colors: ['#2a2534', '#4a4458', '#2a2534'], shape: f.shape === 'flat' || f.shape === 'ray' ? f.shape : 'normal' }, 34) }),
          this.mg.chest ? el('div', { class: 'reel-chest', text: '🎁' }) : null,
        ]),
        el('div', { class: 'reel-progress' }, [el('i')]),
      ]),
      el('div', { class: 'reel-help', text: touch ? 'Hold REEL to rise' : 'Hold SPACE / E / mouse to rise' }),
      touch
        ? el('button', {
            class: 'btn reel-btn',
            onpointerdown: (e) => {
              e.preventDefault();
              this.game.input.hold('Reel', true);
            },
            onpointerup: () => this.game.input.hold('Reel', false),
            onpointerleave: () => this.game.input.hold('Reel', false),
            text: 'REEL',
          })
        : null,
    ]);
    this.game.ui.layer.append(this.ui);
    this.uiZone = this.ui.querySelector('.reel-zone');
    this.uiFish = this.ui.querySelector('.reel-fish');
    this.uiProg = this.ui.querySelector('.reel-progress i');
    this.uiChest = this.ui.querySelector('.reel-chest');
    this.uiTrack = this.ui.querySelector('.reel-track');
  }
  renderUI(inside) {
    const m = this.mg;
    if (!this.ui) return;
    this.uiZone.style.height = `${m.zone * 100}%`;
    this.uiZone.style.bottom = `${m.zonePos * 100}%`;
    this.uiZone.classList.toggle('active', inside);
    this.uiFish.style.bottom = `calc(${m.fishPos * 100}% - 17px)`;
    this.uiProg.style.height = `${clamp(m.progress, 0, 1) * 100}%`;
    this.uiProg.classList.toggle('low', m.progress < 0.25);
    this.uiTrack.classList.toggle('shake', !inside && !this.game.settings.reduceMotion);
    if (this.uiChest) {
      this.uiChest.style.bottom = `calc(${m.chest.pos * 100}% - 14px)`;
      this.uiChest.style.opacity = m.chest.done ? '0' : `${0.6 + Math.min(m.chest.got / 1.3, 1) * 0.4}`;
      this.uiChest.style.transform = `scale(${1 + Math.min(m.chest.got / 1.3, 1) * 0.4})`;
    }
  }
  showResult(f, weight, res, perfect, chest) {
    this.removeUI();
    const tier = TIERS[f.tier];
    const card = el('div', { class: `catch-card tier-${f.tier}`, role: 'dialog', 'aria-label': `Caught ${f.name}` }, [
      res.isNew ? el('div', { class: 'stamp', text: 'NEW!' }) : null,
      el('div', { class: 'catch-rays' }),
      el('div', { class: 'catch-fish', html: fishSVG(f, 150) }),
      el('div', { class: 'catch-name', text: f.name }),
      el('div', { html: rarityBadge(f.tier) }),
      el('div', { class: 'catch-stats' }, [
        el('span', { html: `⚖️ <b>${weight} kg</b>${res.record ? ' <em>Record!</em>' : ''}` }),
        el('span', { html: `🪙 <b>${ITEMS['fish_' + f.id].sell}</b> each` }),
        el('span', { html: `✨ <b>+${res.xp}</b> XP` }),
      ]),
      perfect ? el('div', { class: 'catch-perfect', text: `Perfect catch! +${res.perfectBonus} coins` }) : null,
      chest ? el('div', { class: 'catch-perfect', text: 'Treasure snagged! 🎁' }) : null,
      res.points ? el('div', { class: 'catch-perfect', text: `Tournament +${res.points} pts` }) : null,
      el('p', { class: 'catch-desc', text: f.desc }),
      el('button', { class: 'btn primary', text: 'Nice! (E)', onclick: () => this.cleanup() }),
    ]);
    card.style.setProperty('--tier', tier.color);
    this.ui = card;
    this.game.ui.layer.append(card);
    setTimeout(() => card.querySelector('button')?.focus({ preventScroll: true }), 50);
  }
  removeUI() {
    this.ui?.remove();
    this.ui = null;
    this.game.input.hold('Reel', false);
  }
}
