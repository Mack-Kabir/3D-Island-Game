import { el, escapeHtml, formatNum, formatClock } from '../shared/utils.js';
import { RODS_BY_ID } from '../fishing/gear.js';
import { WEAPONS_BY_ID } from '../combat/weapons.js';
import { ITEMS } from '../shared/items.js';
import { NPCS } from '../people/npcs.js';
import { objectiveTarget } from '../story/guide.js';
import { QUESTS } from '../story/quests.js';
import * as THREE from 'three';

export class Hud {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    const h = ui.hudEl;
    this.profile = el('div', { class: 'hud-profile plate' });
    this.tracker = el('div', { class: 'hud-tracker', role: 'region', 'aria-label': 'Quest tracker' });
    this.topRight = el('div', { class: 'hud-tr' });
    this.money = el('div', { class: 'hud-money' });
    this.clock = el('div', { class: 'hud-clock plate', role: 'timer', 'aria-label': 'Game clock', 'data-tip-title': 'Clock', 'data-tip': 'Night lasts from 7 PM to 7 AM. Rare fish, the night merchant and pirate raids come out at night.' });
    this.mapWrap = el('button', { class: 'hud-minimap', 'aria-label': 'Open map (M)', onclick: () => this.ui.openPanel('map') });
    this.mapCanvas = el('canvas', { width: 150, height: 150 });
    this.mapWrap.append(this.mapCanvas, el('span', { class: 'kbd-hint', text: 'M' }));
    this.fsBtn = el('button', { class: 'menu-btn fs-btn', 'aria-label': 'Full screen', 'data-tip-title': 'Full screen', 'data-tip': 'Hide the browser bars. Works best with your phone sideways.', onclick: () => this.game.toggleFullscreen() }, [el('span', { class: 'mi', text: '⛶' })]);
    this.topRight.append(this.money, this.clock, this.mapWrap);
    this.menu = el('nav', { class: 'hud-menu', 'aria-label': 'Game menu' });
    const tips = { bag: 'Your items, gear, Fishdex and stats.', quests: 'Your quests, hints and daily bounties.', map: 'Island map and sea chart.', wardrobe: 'Change clothes, hair and pets.', pause: 'Pause, settings, help and saving.' };
    const btn = (icon, label, key, panel) =>
      el('button', { class: 'menu-btn', 'aria-label': `${label} (${key})`, 'data-tip-title': `${label} (${key})`, 'data-tip': tips[panel], onclick: () => this.ui.openPanel(panel) }, [el('span', { class: 'mi', text: icon }), el('span', { class: 'ml', text: label }), el('kbd', { text: key })]);
    this.menu.append(this.fsBtn, btn('🎒', 'Bag', 'I', 'bag'), btn('📜', 'Quests', 'J', 'quests'), btn('🗺️', 'Map', 'M', 'map'), btn('👕', 'Style', 'C', 'wardrobe'), btn('⚙️', 'Menu', 'Esc', 'pause'));
    this.gear = el('div', { class: 'hud-gear' });
    this.controlsHint = el('div', { class: 'hud-controls hint-only', html: '<kbd>WASD</kbd> move · <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · <kbd>E</kbd> interact · <kbd>F</kbd> attack · drag to look' });
    // small dart-shaped arrow: the notched tail makes the head obvious at a glance
    this.wp = el('div', { class: 'waypoint hidden', 'aria-hidden': 'true' }, [
      el('div', { class: 'wp-arrow', html: '<svg viewBox="0 0 32 32"><path d="M3 5 L29 16 L3 27 L10 16 Z" fill="#ffd34d" stroke="#2a2534" stroke-width="2.6" stroke-linejoin="round"/></svg>' }),
      el('div', { class: 'wp-label' }),
    ]);
    this.wpDir = this.wp.querySelector('.wp-arrow');
    h.append(this.wp, this.profile, this.tracker, this.topRight, this.menu, this.gear, this.controlsHint);
    this.wpT = 0;
    this._v = new THREE.Vector3();
    if (this.game.input.isTouch) this.buildTouch(h);
    this.mapT = 0;
  }

  render() {
    const g = this.game;
    const s = g.state;
    if (!s) return;
    const maxHp = g.combat.maxHp();
    const need = g.xpForLevel(s.level);
    this.profile.innerHTML = '';
    const portrait = el('div', { class: 'avatar' });
    if (g.playerPortrait) portrait.append(el('img', { src: g.playerPortrait, alt: '' }));
    this.profile.append(
      portrait,
      el('div', { class: 'pinfo' }, [
        el('div', { class: 'pname' }, [el('span', { text: s.name }), el('span', { class: 'lvl', text: `Lv ${s.level}` })]),
        el('div', { class: 'bar hp', 'data-tip-title': 'Health', 'data-tip': 'Pirates hurt you. Heal by eating food from your Bag, sleeping, or waiting out of combat.', role: 'meter', 'aria-label': 'Health', 'aria-valuenow': Math.round(s.hp), 'aria-valuemax': maxHp }, [el('i', { style: { width: `${(s.hp / maxHp) * 100}%` } }), el('span', { text: `❤ ${Math.ceil(s.hp)} / ${maxHp}` })]),
        el('div', { class: 'bar xp', 'data-tip-title': 'Experience', 'data-tip': 'Earn XP from almost everything. Levelling up unlocks better gear, seeds, boats and recipes.', role: 'meter', 'aria-label': 'Experience', 'aria-valuenow': s.xp, 'aria-valuemax': need }, [el('i', { style: { width: `${(s.xp / need) * 100}%` } }), el('span', { text: `✦ ${formatNum(s.xp)} / ${formatNum(need)} XP` })]),
      ]),
    );
    this.money.innerHTML = `<div class="pill coin" data-tip-title="Coins" data-tip="Earn coins by selling fish, fruit, shells and cooked food. Spend them on gear, seeds, boats and houses."><span aria-hidden="true">🪙</span><b>${formatNum(s.coins)}</b><span class="sr-only">coins</span></div><div class="pill gem" data-tip-title="Gems" data-tip="Rare currency from new fish species, rare catches, treasure, quests, bounties and tournaments. Buys pets and special items."><span aria-hidden="true">💎</span><b>${formatNum(s.gems)}</b><span class="sr-only">gems</span></div>`;

    // quest tracker
    const items = g.quests.tracker().slice(0, 3);
    const bounties = s.bounties.list.filter((b) => !b.done).slice(0, 2);
    this.tracker.innerHTML = '';
    if (items.length || bounties.length) {
      const box = el('button', { class: 'tracker plate', onclick: () => this.ui.openPanel('quests'), 'aria-label': 'Open quest log (J)' });
      items.forEach((q, i) => {
        const who = q.target && NPCS[q.target] && NPCS[q.target].island !== g.world?.id ? ` <small>· on ${escapeHtml(cap(NPCS[q.target].island))}</small>` : '';
        const hint = i === 0 && q.hint ? `<div class="trk-hint">💡 ${escapeHtml(q.hint)}</div>` : '';
        box.append(el('div', { class: `trk ${q.main ? 'main' : ''} ${i === 0 ? 'tracked' : ''}`, html: `<div class="trk-title">${q.main ? '★ ' : ''}${escapeHtml(q.title)}</div><div class="trk-obj">➜ ${escapeHtml(q.text)} <b>${q.progress}</b>${who}</div>${hint}` }));
      });
      for (const b of bounties) box.append(el('div', { class: 'trk bounty', html: `<div class="trk-obj">📋 ${escapeHtml(b.text)} <b>${b.progress}/${b.count}</b></div>` }));
      this.tracker.append(box);
    }

    // gear
    const rod = s.rod ? RODS_BY_ID[s.rod] : null;
    const bait = s.bait && ITEMS[s.bait];
    const wpn = WEAPONS_BY_ID[s.weapon];
    this.gear.innerHTML = '';
    this.gear.append(
      el('button', { class: 'gear-chip plate', onclick: () => this.ui.openPanel('bag', { tab: 'gear' }), 'aria-label': 'Equipment' }, [
        el('span', { html: `🎣 <b>${rod ? escapeHtml(rod.name) : 'No rod'}</b>` }),
        el('span', { html: bait ? `${bait.icon} ${s.inventory[s.bait] || 0}` : '' }),
        el('span', { html: `${wpn.icon} <b>${escapeHtml(wpn.name)}</b> <kbd>F</kbd>` }),
      ]),
    );
    this.tickClock(true);
  }

  tickClock(force) {
    const g = this.game;
    if (!g.state) return;
    const m = Math.floor(g.time.minutes());
    const wx = g.weather.info();
    const key = `${m}|${wx.icon}|${g.world?.id}|${g.time.day()}`;
    if (!force && key === this._clockKey) return;
    this._clockKey = key;
    const night = g.time.isNight();
    this.clock.innerHTML = `<div class="clock-row"><span class="clock-ic" aria-hidden="true">${wx.icon}</span><b>${formatClock(m, g.settings.clock24)}</b></div><div class="clock-sub">Day ${g.time.day()} · ${night ? 'Night' : 'Day'}${g.settings.clock === 'real' ? ' · real time' : ''}</div><div class="clock-island">${escapeHtml(g.world?.def.name ?? '')}</div>`;
    this.clock.classList.toggle('night', night);
  }

  tick(dt) {
    if (!this.game.state || this.ui.hudEl.classList.contains('hidden')) return;
    this.tickClock(false);
    this.mapT -= dt;
    if (this.mapT <= 0) {
      this.mapT = 0.1;
      this.drawMinimap();
    }
    this.updateNpcLabels();
    this.updateWaypoint(dt);
  }

  /**
   * Objective guide: a pin above the target when it's on screen, a round badge with a bold
   * arrow at the screen edge when it isn't, plus a glowing arrow on the ground at your feet.
   */
  updateWaypoint(dt) {
    const g = this.game;
    this.wpT -= dt;
    if (this.wpT <= 0) {
      this.wpT = 0.25;
      this.target = null;
      for (const q of g.quests.tracker()) {
        const t = objectiveTarget(g, q.obj, QUESTS[q.id]);
        if (t) {
          this.target = t;
          break;
        }
      }
    }
    const t = this.target;
    const hide = !t || g.mode !== 'play' || g.isPaused() || g.cam.mode !== 'follow';
    const pos = t && (t.follow ? t.follow.position : t.pos);
    if (hide) {
      this.wp.classList.add('hidden');
      return;
    }
    const p = g.player.pos;
    const dist = Math.hypot(pos.x - p.x, pos.z - p.z);
    if (dist < 2.5) {
      this.wp.classList.add('hidden');
      return;
    }
    this.wp.classList.remove('hidden');
    const cam = g.camera;
    const v = this._v.set(pos.x, Math.max(g.world.heightAt(pos.x, pos.z), pos.y, 0) + 2.9, pos.z);
    const behind = v.clone().applyMatrix4(cam.matrixWorldInverse).z > 0;
    v.project(cam);
    const W = window.innerWidth;
    const H = window.innerHeight;
    let x = (v.x * 0.5 + 0.5) * W;
    let y = (-v.y * 0.5 + 0.5) * H;
    if (behind) {
      x = W - x;
      y = H - y;
    }
    const x0 = x;
    const y0 = y;
    // keep the badge inside a safe rectangle that avoids the bottom HUD
    const L = 60;
    const R = W - 60;
    const T = 70;
    const B = H - 160;
    // a target hidden behind the quest tracker or clock/minimap counts as off-screen
    const under = (el) => {
      const r = el.getBoundingClientRect();
      return x > r.left - 30 && x < r.right + 30 && y > r.top - 30 && y < r.bottom + 50;
    };
    const covered = under(this.tracker) || under(this.topRight);
    const onScreen = !behind && !covered && x > L && x < R && y > T && y < B;
    let angle = 90;
    if (!onScreen) {
      const cx = (L + R) / 2;
      const cy = (T + B) / 2;
      let dx = x - cx;
      let dy = y - cy;
      if (Math.abs(dx) + Math.abs(dy) < 1) dy = 1;
      let k = Math.min((R - L) / 2 / Math.abs(dx || 1e-6), (B - T) / 2 / Math.abs(dy || 1e-6));
      if (covered && !behind) k = Math.min(k, 1); // stay where it is, the HUD-avoidance below nudges it clear
      x = cx + dx * k;
      y = cy + dy * k;
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // don't sit on top of the quest tracker (top-left) or the clock & minimap (top-right):
      // slide down below them, then aim the arrow from there at the real target
      const tx = x0;
      const ty = y0;
      for (const box of [this.tracker, this.topRight]) {
        const r = box.getBoundingClientRect();
        if (x > r.left - 30 && x < r.right + 30 && y < r.bottom + 40) y = r.bottom + 46;
      }
      if (!behind) angle = (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
    }
    this.wp.classList.toggle('edge', !onScreen);
    // labels hug the inside of the screen
    this.wp.classList.toggle('label-up', !onScreen && y > H * 0.6);
    this.wp.style.transform = `translate(${x}px, ${y}px)`;
    this.wpDir.style.transform = `rotate(${angle}deg)`;
    const label = `${t.label} · ${Math.round(dist)}m`;
    if (label !== this._wpLabel) {
      this._wpLabel = label;
      this.wp.lastChild.textContent = label;
    }
  }

  drawMinimap() {
    const g = this.game;
    const w = g.world;
    if (!w || !g.player) return;
    const mm = w.minimap();
    const c = this.mapCanvas;
    const ctx = c.getContext('2d');
    const S = c.width;
    const p = g.player.pos;
    const zoom = 2.2; // world units per minimap pixel
    const scale = mm.size / (mm.ext * 2);
    ctx.save();
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#4fa3bd';
    ctx.fillRect(0, 0, S, S);
    const viewW = S * zoom;
    const sx = (p.x - viewW / 2 + mm.ext) * scale;
    const sy = (p.z - viewW / 2 + mm.ext) * scale;
    ctx.drawImage(mm.canvas, sx, sy, viewW * scale, viewW * scale, 0, 0, S, S);
    const toMap = (x, z) => [S / 2 + (x - p.x) / zoom, S / 2 + (z - p.z) / zoom];
    // markers
    const night = g.time.isNight();
    for (const n of w.npcs) {
      if (!n.available()) continue;
      const [x, y] = toMap(n.pos.x, n.pos.z);
      ctx.fillStyle = n.questMark ? '#f7c95c' : '#fbf3e2';
      ctx.strokeStyle = '#2a2534';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, n.questMark ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (const e of w.enemies) {
      if (e.dead) continue;
      const [x, y] = toMap(e.pos.x, e.pos.z);
      ctx.fillStyle = '#e0533d';
      ctx.beginPath();
      ctx.arc(x, y, e.boss ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const d of w.digSpots) {
      const [x, y] = toMap(d.pos.x, d.pos.z);
      ctx.strokeStyle = '#8a2f2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 3);
      ctx.lineTo(x + 3, y + 3);
      ctx.moveTo(x + 3, y - 3);
      ctx.lineTo(x - 3, y + 3);
      ctx.stroke();
    }
    if (w.dock) {
      const [x, y] = toMap(w.dock.end.x, w.dock.end.z);
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚓', x, y);
    }
    if (w.homestead) {
      const [x, y] = toMap(w.homestead.x, w.homestead.z);
      ctx.font = '13px sans-serif';
      ctx.fillText('🏠', x, y);
    }
    if (this.target) {
      const tp = this.target.follow ? this.target.follow.position : this.target.pos;
      let [x, y] = toMap(tp.x, tp.z);
      const dx = x - S / 2;
      const dy = y - S / 2;
      const r = Math.hypot(dx, dy);
      if (r > S / 2 - 10) {
        x = S / 2 + (dx / r) * (S / 2 - 10);
        y = S / 2 + (dy / r) * (S / 2 - 10);
      }
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f7c95c';
      ctx.strokeStyle = '#2a2534';
      ctx.lineWidth = 3;
      ctx.strokeText('★', x, y);
      ctx.fillText('★', x, y);
    }
    // player arrow
    ctx.translate(S / 2, S / 2);
    ctx.rotate(-g.player.yaw + Math.PI);
    ctx.fillStyle = '#f0846a';
    ctx.strokeStyle = '#2a2534';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // north / night tint
    if (night) {
      ctx.fillStyle = 'rgba(20,30,70,0.25)';
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** "!" over NPCs with quests to give or talk objectives. */
  updateNpcLabels() {
    const g = this.game;
    const w = g.world;
    if (!w) return;
    this._lblT = (this._lblT || 0) - 1;
    if (this._lblT > 0) return;
    this._lblT = 20;
    const talkTargets = new Set(g.quests.tracker().filter((t) => t.target).map((t) => t.target));
    for (const n of w.npcs) {
      const offer = g.quests.offers(n.id).length > 0 || g.quests.canTurnIn(n.id).length > 0;
      const talk = talkTargets.has(n.id);
      n.questMark = talk || offer;
      const mark = talk ? '<span class="qmark main">!</span>' : offer ? '<span class="qmark">?</span>' : '';
      const shop = n.def.shop ? '<span class="shopmark" aria-hidden="true">🛒</span>' : '';
      n.label?.set(`${mark}<span class="nm">${escapeHtml(n.def.name)}${shop}</span><span class="nt">${escapeHtml(n.def.title)}</span>`);
    }
  }

  buildTouch(h) {
    const g = this.game;
    const joy = el('div', { class: 'joy', 'aria-hidden': 'true' }, [el('div', { class: 'joy-knob' })]);
    const knob = joy.firstChild;
    let id = null;
    let cx = 0;
    let cy = 0;
    joy.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      joy.setPointerCapture(e.pointerId);
      g.audio.unlock();
    });
    joy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      let dx = (e.clientX - cx) / 50;
      let dy = (e.clientY - cy) / 50;
      const l = Math.hypot(dx, dy);
      if (l > 1) {
        dx /= l;
        dy /= l;
      }
      g.input.joy = { x: dx, y: -dy, active: true };
      knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
    });
    const end = () => {
      id = null;
      g.input.joy = { x: 0, y: 0, active: false };
      knob.style.transform = '';
    };
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    const tb = (label, code, cls) => {
      const b = el('button', { class: `tbtn ${cls}`, 'aria-label': label, text: label });
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        g.input.hold(code, true);
      });
      const up = () => g.input.hold(code, false);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      return b;
    };
    const pad = el('div', { class: 'touch-pad' }, [tb('E', 'KeyE', 'act'), tb('⚔', 'KeyF', 'atk'), tb('⤒', 'Space', 'jmp'), tb('🏃', 'Sprint', 'run')]);
    h.append(joy, pad);
    document.body.classList.add('touch');
  }
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
