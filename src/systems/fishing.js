import * as THREE from 'three';
import { FISH, TIERS, TIER_ORDER, tierIndex, fishPower } from '../data/fish.js';
import { RODS, RODS_BY_ID, BAITS_BY_ID, PETS_BY_ID } from '../data/gear.js';
import { glowTexture } from '../world/toon.js';
import { ITEMS } from '../data/items.js';
import { inked } from '../world/toon.js';
import { rand, clamp, lerp, el, pick } from '../core/utils.js';
import { fishSVG, rarityBadge } from '../ui/icons.js';
import { fishMesh, fishTexture } from '../world/fx.js';

/** Fish that could bite here and now. */
function candidates({ island, night, rain }) {
  return FISH.filter(
    (f) => (f.where.includes('*') || f.where.includes(island)) && (f.time === 'any' || (f.time === 'night') === night) && (f.weather === 'any' || (f.weather === 'rain' && rain)),
  );
}

export function rollFish({ island, night, rain, luck, boat = false, mods = {} }) {
  const cands = candidates({ island, night, rain });
  const perTier = {};
  for (const f of cands) perTier[f.tier] = (perTier[f.tier] || 0) + 1;
  let total = 0;
  const weights = cands.map((f) => {
    const idx = tierIndex(f.tier);
    let w = TIERS[f.tier].weight / perTier[f.tier];
    if (f.tier === 'junk') w *= Math.max(0.15, 1 - luck * 0.6) * (boat ? 0.6 : 1);
    if (idx >= 3) w *= 1 + luck * (idx - 2) * 0.9;
    // deep-water fish bite far more often from a boat, and rarely from the shore
    if (f.boat) w *= (boat ? f.boat : 0.45) * (mods.deep ?? 1);
    // lure specialities
    if (f.tier === 'junk') w *= mods.junk ?? 1;
    if (f.weather === 'rain') w *= mods.rain ?? 1;
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

/** A fish one rarity tier better than `f` that could bite here (bait upgrades), or null. */
export function betterFish(f, ctx) {
  const cands = candidates(ctx);
  const idx = tierIndex(f.tier);
  for (let t = idx + 1; t < TIER_ORDER.length; t++) {
    const pool = cands.filter((c) => c.tier === TIER_ORDER[t]);
    if (pool.length) {
      const deep = ctx.boat ? pool.filter((c) => c.boat) : [];
      return pick(deep.length && Math.random() < 0.5 ? deep : pool);
    }
  }
  return null;
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

// Tap-to-reel tuning. Simulated: a sensible player lands anything their rod is rated for almost every
// time; one power short is roughly a coin flip; two or more short usually snaps the line.
const REEL = { tap: 0.055, pull0: 0.04, pullD: 0.02, defPull: 0.4, thrashPull: 1.8, ten: 0.05, tenBase: 0.8, tenD: 0.065, defTen: 0.6, thrashTen: 2.8, decay: 0.45, escape: 1.3 };

const MYSTERY_SVG = '<svg viewBox="0 0 100 60" aria-hidden="true"><path d="M8 30 Q28 6 62 13 L92 2 L84 30 L92 58 L62 47 Q28 54 8 30 Z" fill="#163447" stroke="#0d2230" stroke-width="3" stroke-linejoin="round"/></svg>';

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

  /** The rod in use: a boat-only rod can't be used from the shore, so fall back to your best other rod. */
  rod() {
    if (this.active && this.castRod) return this.castRod;
    return this.usableRod();
  }
  usableRod() {
    const s = this.game.state;
    const eq = RODS_BY_ID[s.rod];
    if (!eq?.boatOnly || this.fromBoat) return eq;
    return s.rods.map((id) => RODS_BY_ID[id]).filter((r) => r && !r.boatOnly).sort((a, b) => b.power - a.power)[0] || null;
  }
  bait() {
    return this.baitUsed ? BAITS_BY_ID[this.baitUsed] : null;
  }
  get fromBoat() {
    return !!this.game.boatTrip?.active;
  }

  /** Point in the water in front of the player, or null. */
  spotAhead() {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) return null;
    const f = p.forward();
    for (const d of this.fromBoat ? [9, 7.5, 6, 4.5] : [7, 5.8, 4.6, 3.4]) {
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
    const bait = this.bait();
    let l = (rod?.luck ?? 0) + (bait?.luck ?? -0.05);
    const night = g.time.isNight();
    if (bait?.nightLuck && night) l += bait.nightLuck;
    if (bait?.dayLuck && !night) l += bait.dayLuck;
    if (bait?.rainLuck && g.weather.raining()) l += bait.rainLuck;
    if (s.pet) l += PETS_BY_ID[s.pet]?.luck ?? 0;
    if (this.fromBoat) l += g.boatTier() * 0.08;
    return l;
  }

  start() {
    const g = this.game;
    const s = g.state;
    if (!s.rod) {
      g.ui.toast('You need a fishing rod. Visit Old Ross at the Palmora dock!', 'warn');
      return;
    }
    const spot = this.spotAhead();
    if (!spot) return;
    const rod = this.usableRod();
    if (!rod) {
      g.ui.toast('Your Deep-Sea Trolling Rod only works from a boat. Equip another rod in your Bag → Gear.', 'warn');
      return;
    }
    if (rod.id !== s.rod) g.ui.toast(`The ${RODS_BY_ID[s.rod].name} only works from your boat — using your ${rod.name} instead.`, 'info');
    this.castRod = rod;
    this.baitUsed = null;
    if (s.bait && (s.inventory[s.bait] || 0) > 0) {
      g.removeItem(s.bait, 1, true);
      this.baitUsed = s.bait;
    } else {
      // fall back to any bait we have
      const any = ['bait_magic', 'bait_jig', 'bait_squid', 'bait_glow', 'bait_spinner', 'bait_shrimp', 'bait_cricket', 'bait_worm'].find((b) => (s.inventory[b] || 0) > 0);
      if (any) {
        g.removeItem(any, 1, true);
        this.baitUsed = any;
      }
    }
    if (!this.baitUsed) g.ui.toast('No bait — fish bite slower and slip off more. Buy worms from Ross!', 'info');
    this.active = true;
    this.phase = 'cast';
    this.t = 0;
    this.earlyTimer = 0;
    this.target = spot;
    this.castFromBoat = this.fromBoat;
    const p = g.player;
    p.locked = true;
    p.pose = 'fish';
    p.char.hold('rod', rod.id);
    p.char.play('cast', 0.55);
    g.audio.sfx('cast');
    // the lure you picked dangles from the rod tip, then flies out on the cast
    this.setLure(this.baitUsed);
    this.bobber.visible = false;
    this.line.visible = true;
    g.ui.setPrompt(null);
  }

  cancel(msg, type = 'info') {
    if (!this.active) return;
    this.cleanup();
    if (msg) this.game.ui.toast(msg, type);
  }

  cleanup() {
    const p = this.game.player;
    this.pendingResult = null;
    this.active = false;
    this.phase = null;
    this.bobber.visible = false;
    this.line.visible = false;
    if (this.lure) this.lure.visible = false;
    this.castRod = null;
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

  /** Decide what's on the hook (kept secret until it's landed). */
  rollCatch() {
    const g = this.game;
    const night = g.time.isNight();
    const bait0 = this.bait();
    const rod0 = this.rod();
    const mods = { junk: bait0?.junk ?? 1, rain: bait0?.rain ?? 1, deep: (bait0?.deep ?? 1) * (rod0?.boatOnly ? 2 : 1) };
    const ctx = { island: g.world.id, night, rain: g.weather.raining(), luck: this.luck(), boat: this.castFromBoat, mods };
    this.fish = rollFish(ctx);
    this.baitBoost = false;
    const bait = this.bait();
    const up = (bait?.upgrade ?? 0) + (night ? bait?.nightUpgrade ?? 0 : 0);
    if (up && Math.random() < up) {
      const better = betterFish(this.fish, ctx);
      if (better) {
        this.fish = better;
        this.baitBoost = true;
      }
    }
    fishTexture(this.fish); // paint the catch art now so it's ready when it's landed
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
        // hang at the rod tip during the wind-up, then sail out in an arc
        const hang = 0.35;
        const t = clamp((this.t - hang) / 0.75, 0, 1);
        const start = tip;
        if (this.t < hang) this.bobber.position.set(tip.x, tip.y - 0.35 + Math.sin(this.t * 18) * 0.04, tip.z);
        else this.bobber.position.set(lerp(start.x, this.target.x, t), lerp(start.y, water, t) + Math.sin(t * Math.PI) * 2.4, lerp(start.z, this.target.z, t));
        if (this.lure) {
          this.lure.position.copy(this.bobber.position);
          this.lure.rotation.y += dt * 6;
          this.lure.rotation.z = Math.sin(this.t * 10) * 0.4;
          if (this.t > hang && Math.random() < dt * 30) g.particles.burst(this.lure.position, { count: 1, color: this.lureColor, speed: 0.3, up: 0.2, life: 0.45 });
        }
        if (t >= 1) {
          if (this.lure) this.lure.visible = false;
          this.bobber.visible = true;
          g.particles.burst(this.bobber.position, { count: 10, color: '#e8fbff', speed: 1.6, up: 2.5, life: 0.6 });
          g.audio.sfx('splash');
          this.phase = 'wait';
          this.t = 0;
          const rod = this.rod();
          const bait = this.bait();
          const mul = (rod?.speed ?? 1) * (bait?.speed ?? 1.3) * (g.weather.raining() ? 0.85 : 1) * (this.castFromBoat ? 0.85 : 1);
          this.waitTime = rand(2.5, 7.5) * mul;
          this.nibbles = [rand(0.8, this.waitTime * 0.5), rand(this.waitTime * 0.5, this.waitTime - 0.4)];
          this.retries = 1;
          this.showHint(this.waitHint());
        }
        break;
      }
      case 'wait': {
        let dip = 0;
        for (const n of this.nibbles) if (this.t > n && this.t < n + 0.25) dip = -0.06;
        this.bobber.position.set(this.target.x, water + Math.sin(this.t * 2.5) * 0.035 + dip, this.target.z);
        if (input.reelPressed() && this.t > 0.3) {
          // too early — no penalty, just a reminder
          this.showHint('Not yet! Wait for the big ❗ to pop up…', true);
          this.earlyTimer = 1.4;
        }
        if (this.earlyTimer > 0 && (this.earlyTimer -= dt) <= 0) this.showHint(this.waitHint());
        if (this.t >= this.waitTime) {
          this.phase = 'bite';
          this.t = 0;
          this.rollCatch();
          this.window = Math.max(1.0, 1.8 - this.fish.diff * 0.07);
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
        if (input.reelPressed()) {
          this.beginReel();
        } else if (this.t > this.window) {
          g.audio.sfx('miss');
          if (this.retries > 0) {
            // it nibbles again — the bait isn't lost yet
            this.retries--;
            this.phase = 'wait';
            this.t = 0;
            this.waitTime = rand(1.5, 3.5);
            this.nibbles = [rand(0.5, 1.2)];
            this.showHint(`Missed it — ${g.input.isTouch ? 'tap' : 'press E or click'} as soon as the ❗ appears! It's coming back…`, true);
          } else this.cancel(`It got away… ${g.input.isTouch ? 'Tap' : 'Press E or click'} the moment the ❗ appears.`);
        }
        break;
      }
      case 'reel': {
        this.updateReel(dt);
        if (this.phase !== 'reel') break;
        // the fish is dragged closer with every tap
        const k = clamp(1 - this.mg.dist, 0, 1) * 0.65;
        const p = g.player.pos;
        const thrash = this.mg.thrash > 0 ? 3 : 1;
        this.bobber.position.set(lerp(this.target.x, p.x, k) + Math.sin(this.t * 7 * thrash) * 0.2, water - 0.1, lerp(this.target.z, p.z, k) + Math.cos(this.t * 5 * thrash) * 0.2);
        if (Math.random() < dt * 6 * thrash) g.particles.burst(this.bobber.position, { count: 2, color: '#e8fbff', speed: 1, up: 1.5, life: 0.4 });
        break;
      }
      case 'result':
        if (this.pendingResult && this.t > 1.0) {
          this.showResult(...this.pendingResult);
          this.pendingResult = null;
        }
        if (!this.pendingResult && this.t > 1.3 && (input.anyPressed('KeyE', 'Space', 'Enter', 'Escape') || input.mouse.clicked)) {
          this.cleanup();
        }
        break;
    }
    if (this.phase !== 'result') this.updateLine(tip);
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

  // ── tap-to-reel minigame ──────────────────────
  beginReel() {
    const g = this.game;
    const rod = this.rod();
    const f = this.fish;
    const bait = this.bait();
    this.phase = 'reel';
    this.t = 0;
    g.player.pose = 'reel';
    g.audio.sfx('hook');
    const need = fishPower(f);
    const deficit = Math.max(0, need - (rod?.power ?? 1));
    // weak bait (or none) and an under-powered rod make the hook easier to throw
    const slip = (bait ? bait.slip : 0.12) + deficit * 0.04;
    this.mg = {
      dist: 1,
      tension: 0,
      maxTension: 0,
      thrash: 0,
      nextThrash: rand(1.2, 2.4),
      strength: rand(0.8, 1.2),
      need,
      deficit,
      reel: (rod?.reel ?? 1) * (1 + Math.min(g.state.level * 0.004, 0.08)),
      slipAt: f.tier !== 'junk' && Math.random() < slip ? rand(1.2, 3.2) : null,
      taps: 0,
    };
    this.buildUI();
  }

  updateReel(dt) {
    const m = this.mg;
    const g = this.game;
    const d = this.fish.diff;
    const R = REEL;
    // every so often the fish thrashes: it pulls harder and taps strain the line much more
    if (m.thrash > 0) m.thrash -= dt;
    else if (d >= 2 && (m.nextThrash -= dt) <= 0) {
      m.thrash = rand(0.6, 1.0);
      m.nextThrash = rand(1.8, 3.4) / (0.8 + d * 0.04);
      g.audio.sfx('thrash');
      g.particles.burst(this.bobber.position, { count: 10, color: '#e8fbff', speed: 2, up: 3, life: 0.5 });
      if (!g.settings.reduceMotion) g.cam.shake(0.08);
    }
    const thrash = m.thrash > 0;
    let pull = (R.pull0 + d * R.pullD) * (1 + m.deficit * R.defPull) * m.strength * Math.min(1, this.t / 0.8);
    if (thrash) pull *= R.thrashPull;
    m.dist += pull * dt;
    if (g.input.reelPressed()) {
      m.taps++;
      m.dist -= R.tap * m.reel;
      m.tension += R.ten * (R.tenBase + d * R.tenD) * (1 + m.deficit * R.defTen) * m.strength * (thrash ? R.thrashTen : 1);
      g.audio.sfx('reelTap');
      this.bump();
    }
    m.tension = Math.max(0, m.tension - R.decay * dt);
    m.maxTension = Math.max(m.maxTension, m.tension);
    this.renderUI();
    if (m.slipAt !== null && this.t >= m.slipAt) this.escape('slip');
    else if (m.tension >= 1) this.escape('snap');
    else if (m.dist >= R.escape) this.escape('away');
    else if (m.dist <= 0) this.success();
  }

  /** The fish got away — explain why so the player knows what to improve. */
  escape(reason) {
    const g = this.game;
    const m = this.mg;
    const rod = this.rod();
    const better = RODS.find((r) => r.power >= m.need && !r.reward);
    const weak = m.deficit > 0 ? ` Your ${rod?.name ?? 'rod'} isn't strong enough for this one — it needs power ${m.need}+${better ? ` (${better.name} or better)` : ''}.` : '';
    const special = tierIndex(this.fish.tier) >= 3 ? ' It felt like something special…' : '';
    let msg;
    if (reason === 'snap') {
      g.audio.sfx('snap');
      msg = `💥 Snap! The line broke.${weak || ' Stop tapping while the fish thrashes (red flash) so the line can relax.'}`;
    } else if (reason === 'slip') {
      g.audio.sfx('miss');
      msg = `🐟 It spat out the hook and got away!${weak || (this.baitUsed ? ' Unlucky — better bait keeps fish hooked.' : ' Bait helps fish stay on the hook.')}`;
    } else {
      g.audio.sfx('miss');
      msg = `🌊 It swam away!${weak || ' Keep tapping faster to pull it in.'}`;
    }
    g.particles.burst(this.bobber.position, { count: 18, color: '#e8fbff', speed: 2.5, up: 3.5, life: 0.6 });
    this.cancel(msg + special, 'warn');
  }

  success() {
    const g = this.game;
    const f = this.fish;
    const m = this.mg;
    const luck = this.luck();
    const weight = rollWeight(f, luck);
    const perfect = m.maxTension < 0.6 && f.tier !== 'junk';
    const chest = f.tier !== 'junk' && Math.random() < 0.1;
    this.removeUI();
    this.phase = 'result';
    this.t = 0;
    // the catch leaps out of the water into the player's raised hands
    const from = this.bobber.position.clone();
    this.bobber.visible = false;
    this.line.visible = false;
    g.player.pose = null;
    g.player.char.hold(null);
    const fm = fishMesh(f);
    fm.scale.multiplyScalar(f.tier === 'junk' ? 1 : Math.min(1.5, 1 + Math.log10(1 + weight) * 0.18));
    g.fx.holdUp(fm, 1.5, from);
    g.particles.burst(from, { count: 16, color: '#e8fbff', speed: 2, up: 4, life: 0.7 });
    g.audio.sfx('splash');
    const res = g.recordCatch(f, weight, { perfect, bait: this.baitUsed, boat: this.castFromBoat, rod: this.castRod?.id });
    if (chest) {
      const r = Math.random();
      if (r < 0.45) g.give({ coins: 15 + Math.floor(Math.random() * 35) }, { quiet: false });
      else if (r < 0.8) g.give({ gems: 1 + Math.floor(Math.random() * 3) });
      else g.give({ items: { bottle: 1 } });
    }
    this.pendingResult = [f, weight, res, perfect, chest, { baitBoost: this.baitBoost, bait: this.baitUsed, boat: this.castFromBoat && !!f.boat }];
  }

  // ── UI pieces ─────────────────────────────────
  waitHint() {
    const lure = this.baitUsed ? `${ITEMS[this.baitUsed].icon} ${ITEMS[this.baitUsed].name}` : 'a bare hook';
    return `Fishing with ${lure}… When the ❗ pops up, ${this.game.input.isTouch ? 'TAP' : 'press E or click'}! (Walk away to stop)`;
  }
  /** Show the 3D model of the lure being cast. */
  setLure(id) {
    const b = id ? BAITS_BY_ID[id] : null;
    const model = b?.model || 'hook';
    if (this.lure?.userData.model !== model) {
      this.lure?.parent?.remove(this.lure);
      this.lure = lureMesh(model, b?.color || '#c8ccd4');
      this.game.scene.add(this.lure);
    }
    this.lureColor = b?.color || '#e8fbff';
    this.lure.visible = true;
  }
  showHint(text, warn = false) {
    this.removeUI();
    this.ui = el('div', { class: `fish-hint${warn ? ' warn' : ''}`, role: 'status' }, [text]);
    this.game.ui.layer.append(this.ui);
  }
  showBite() {
    this.removeUI();
    this.ui = el('div', { class: 'bite-mark', 'aria-live': 'assertive' }, [el('span', { text: '!' }), el('small', { text: this.game.input.isTouch ? 'TAP!' : 'Press E / Click!' })]);
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
    const m = this.mg;
    const touch = this.game.input.isTouch;
    // only a hint of what's down there — the catch is revealed once it's landed
    const feel = f.diff < 2 ? 'Something small is nibbling…' : f.diff < 4 ? 'Something is pulling!' : f.diff < 6.5 ? 'A strong pull!' : 'Something HUGE!';
    this.ui = el('div', { class: 'reel-ui tapper', role: 'group', 'aria-label': 'Reel in by tapping quickly' }, [
      el('div', { class: 'reel-title' }, [el('span', { class: 'reel-q', text: '?' }), el('span', { text: feel })]),
      el('div', { class: 'reel-body' }, [
        el('div', { class: 'reel-lane' }, [
          el('div', { class: 'reel-escape', text: 'ESCAPE' }),
          el('div', { class: 'reel-mystery', html: `${MYSTERY_SVG}<b>?</b>` }),
          el('div', { class: 'reel-goal', text: '🎣' }),
        ]),
        el('div', { class: 'reel-tension', title: 'Line tension' }, [el('i'), el('span', { text: 'LINE' })]),
      ]),
      el('div', { class: 'reel-status', text: 'TAP! TAP! TAP!' }),
      el('div', { class: 'reel-help' }, [el('b', { text: touch ? 'Tap REEL fast' : 'Tap E / Space / click fast' }), ' to pull it in. When it thrashes, stop for a moment or the line snaps!']),
      m.deficit ? el('div', { class: 'reel-warn', text: `⚠ Your rod is straining! This one needs power ${m.need}+` }) : null,
      touch
        ? el('button', {
            class: 'btn reel-btn',
            onpointerdown: (e) => {
              e.preventDefault();
              this.game.input.tap('Reel');
            },
            text: 'REEL!',
          })
        : null,
    ]);
    this.game.ui.layer.append(this.ui);
    this.uiFish = this.ui.querySelector('.reel-mystery');
    this.uiTension = this.ui.querySelector('.reel-tension i');
    this.uiStatus = this.ui.querySelector('.reel-status');
    this.renderUI();
  }
  bump() {
    const f = this.uiFish;
    if (!f) return;
    f.classList.remove('tug');
    void f.offsetWidth;
    f.classList.add('tug');
  }
  renderUI() {
    const m = this.mg;
    if (!this.ui || !this.uiFish) return;
    const k = clamp(m.dist / REEL.escape, 0, 1);
    this.uiFish.style.bottom = `calc(${k * 80}% + 4px)`;
    this.uiTension.style.height = `${clamp(m.tension, 0, 1) * 100}%`;
    this.uiTension.classList.toggle('hot', m.tension > 0.7);
    const thrash = m.thrash > 0;
    this.ui.classList.toggle('thrash', thrash && !this.game.settings.reduceMotion);
    this.ui.classList.toggle('thrashing', thrash);
    this.ui.classList.toggle('danger', k > 0.85);
    const text = thrash ? "⚠ IT'S THRASHING — STOP!" : m.tension > 0.75 ? 'Easy… the line is tight!' : k > 0.85 ? "It's getting away — TAP!" : 'TAP! TAP! TAP!';
    if (this.uiStatus.textContent !== text) this.uiStatus.textContent = text;
  }
  showResult(f, weight, res, perfect, chest, extra = {}) {
    this.removeUI();
    const tier = TIERS[f.tier];
    const junk = f.tier === 'junk';
    const card = el('div', { class: `catch-card tier-${f.tier}`, role: 'dialog', 'aria-label': `Caught ${f.name}` }, [
      res.isNew ? el('div', { class: 'stamp', text: 'NEW!' }) : null,
      el('div', { class: 'catch-rays' }),
      el('div', { class: 'catch-fish', html: fishSVG(f, 170) }),
      el('div', { class: 'catch-name', text: junk ? `${f.name}…` : f.name }),
      el('div', { html: rarityBadge(f.tier) }),
      el('div', { class: 'catch-stats' }, [
        el('span', { html: `⚖️ <b>${weight} kg</b>${res.record ? ' <em>Record!</em>' : ''}` }),
        el('span', { html: `🪙 <b>${ITEMS['fish_' + f.id].sell}</b> each` }),
        el('span', { html: `✨ <b>+${res.xp}</b> XP` }),
      ]),
      junk ? el('div', { class: 'catch-note', text: 'Just junk this time — it happens to every angler! Better bait means less junk.' }) : null,
      extra.baitBoost && extra.bait ? el('div', { class: 'catch-perfect', text: `${ITEMS[extra.bait].icon} Your ${ITEMS[extra.bait].name} lured a better catch!` }) : null,
      extra.boat ? el('div', { class: 'catch-note', text: '🚤 Deep-sea fish like this bite far more often from a boat.' }) : null,
      perfect ? el('div', { class: 'catch-perfect', text: `Smooth reeling! Perfect catch +${res.perfectBonus} coins` }) : null,
      chest ? el('div', { class: 'catch-perfect', text: 'Treasure snagged on the line! 🎁' }) : null,
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
    this.uiFish = null;
    this.game.input.hold('Reel', false);
  }
}

/** Little 3D lures — each one looks different so you can see what you're casting. */
export function lureMesh(model, color) {
  const g = new THREE.Group();
  g.userData.model = model;
  const add = (geom, c, x, y, z, sx = 1, sy = sx, sz = sx, o = 0.01) => {
    const m = inked(geom, c, o);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = false;
    g.add(m);
    return m;
  };
  const sph = new THREE.SphereGeometry(1, 10, 8);
  const cone = new THREE.ConeGeometry(1, 1, 6);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 6);
  // every lure hangs from a small silver hook
  const hook = inked(new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI * 1.3), '#c8ccd4', 0);
  hook.position.y = -0.12;
  g.add(hook);
  switch (model) {
    case 'worm':
      for (let i = 0; i < 5; i++) add(sph, i % 2 ? color : '#d8708a', Math.sin(i * 0.9) * 0.06, 0.1 - i * 0.06, 0, 0.045);
      break;
    case 'cricket':
      add(sph, color, 0, 0, 0, 0.06, 0.05, 0.11);
      add(sph, '#4a6a2a', 0, 0.02, 0.1, 0.045);
      for (const s of [-1, 1]) {
        add(cyl, '#3a4a2a', 0.07 * s, 0.03, -0.04, 0.008, 0.16, 0.008).rotation.z = 0.9 * s;
        add(cyl, '#3a4a2a', 0.03 * s, 0.08, 0.16, 0.004, 0.12, 0.004).rotation.x = 0.9;
      }
      break;
    case 'shrimp':
      for (let i = 0; i < 5; i++) {
        const a = i * 0.45;
        add(sph, color, Math.cos(a) * 0.1 - 0.1, Math.sin(a) * 0.1, 0, 0.05 - i * 0.006);
      }
      add(cone, '#e87a4a', -0.16, 0.13, 0, 0.05, 0.08, 0.02).rotation.z = 2.4;
      break;
    case 'spinner':
      add(sph, color, 0, 0.02, 0, 0.09, 0.02, 0.14);
      add(sph, '#e2434b', 0, 0.02, 0.17, 0.035);
      add(cyl, '#a8aeb8', 0, 0.02, 0.25, 0.008, 0.1, 0.008).rotation.x = Math.PI / 2;
      break;
    case 'glow': {
      const core = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color }));
      core.scale.setScalar(0.08);
      g.add(core);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(0.6);
      g.add(halo);
      add(cone, '#3a8a7a', 0, -0.06, 0, 0.05, 0.08, 0.05).rotation.x = Math.PI;
      break;
    }
    case 'squid':
      add(cone, color, 0, 0.08, 0, 0.06, 0.18, 0.06);
      for (let i = 0; i < 5; i++) add(cyl, '#e8a8c0', Math.cos(i * 1.25) * 0.035, -0.04, Math.sin(i * 1.25) * 0.035, 0.01, 0.12, 0.01);
      break;
    case 'jig':
      add(sph, '#f2c94c', 0, 0.08, 0, 0.055);
      for (let i = 0; i < 6; i++) add(cone, i % 2 ? color : '#ffffff', Math.cos(i) * 0.025, -0.02, Math.sin(i) * 0.025, 0.025, 0.16, 0.025).rotation.x = Math.PI;
      break;
    case 'magic': {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color }));
      g.add(star);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#fff2b0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(0.7);
      g.add(halo);
      break;
    }
    default:
      add(sph, '#c8ccd4', 0, 0, 0, 0.03);
  }
  // big enough to follow through the air
  g.scale.setScalar(2.3);
  g.visible = false;
  return g;
}
