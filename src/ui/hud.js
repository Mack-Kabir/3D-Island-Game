import { el, escapeHtml, formatNum, formatClock } from '../core/utils.js';
import { RODS_BY_ID, WEAPONS_BY_ID } from '../data/gear.js';
import { ITEMS } from '../data/items.js';
import { NPCS } from '../data/npcs.js';

export class Hud {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    const h = ui.hudEl;
    this.profile = el('div', { class: 'hud-profile plate' });
    this.tracker = el('div', { class: 'hud-tracker', role: 'region', 'aria-label': 'Quest tracker' });
    this.topRight = el('div', { class: 'hud-tr' });
    this.money = el('div', { class: 'hud-money' });
    this.clock = el('div', { class: 'hud-clock plate', role: 'timer', 'aria-label': 'Game clock' });
    this.mapWrap = el('button', { class: 'hud-minimap', 'aria-label': 'Open map (M)', onclick: () => this.ui.openPanel('map') });
    this.mapCanvas = el('canvas', { width: 150, height: 150 });
    this.mapWrap.append(this.mapCanvas, el('span', { class: 'kbd-hint', text: 'M' }));
    this.topRight.append(this.money, this.clock, this.mapWrap);
    this.menu = el('nav', { class: 'hud-menu', 'aria-label': 'Game menu' });
    const btn = (icon, label, key, panel) =>
      el('button', { class: 'menu-btn', 'aria-label': `${label} (${key})`, title: `${label} (${key})`, onclick: () => this.ui.openPanel(panel) }, [el('span', { class: 'mi', text: icon }), el('span', { class: 'ml', text: label }), el('kbd', { text: key })]);
    this.menu.append(btn('🎒', 'Bag', 'I', 'bag'), btn('📜', 'Quests', 'J', 'quests'), btn('🗺️', 'Map', 'M', 'map'), btn('👕', 'Style', 'C', 'wardrobe'), btn('⚙️', 'Menu', 'Esc', 'pause'));
    this.gear = el('div', { class: 'hud-gear' });
    this.controlsHint = el('div', { class: 'hud-controls hint-only', html: '<kbd>WASD</kbd> move · <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · <kbd>E</kbd> interact · <kbd>F</kbd> attack · drag to look' });
    h.append(this.profile, this.tracker, this.topRight, this.menu, this.gear, this.controlsHint);
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
        el('div', { class: 'bar hp', role: 'meter', 'aria-label': 'Health', 'aria-valuenow': Math.round(s.hp), 'aria-valuemax': maxHp }, [el('i', { style: { width: `${(s.hp / maxHp) * 100}%` } }), el('span', { text: `❤ ${Math.ceil(s.hp)} / ${maxHp}` })]),
        el('div', { class: 'bar xp', role: 'meter', 'aria-label': 'Experience', 'aria-valuenow': s.xp, 'aria-valuemax': need }, [el('i', { style: { width: `${(s.xp / need) * 100}%` } }), el('span', { text: `✦ ${formatNum(s.xp)} / ${formatNum(need)} XP` })]),
      ]),
    );
    this.money.innerHTML = `<div class="pill coin" title="Coins"><span aria-hidden="true">🪙</span><b>${formatNum(s.coins)}</b><span class="sr-only">coins</span></div><div class="pill gem" title="Gems"><span aria-hidden="true">💎</span><b>${formatNum(s.gems)}</b><span class="sr-only">gems</span></div>`;

    // quest tracker
    const items = g.quests.tracker().slice(0, 3);
    const bounties = s.bounties.list.filter((b) => !b.done).slice(0, 2);
    this.tracker.innerHTML = '';
    if (items.length || bounties.length) {
      const box = el('button', { class: 'tracker plate', onclick: () => this.ui.openPanel('quests'), 'aria-label': 'Open quest log (J)' });
      for (const q of items) {
        const who = q.target && NPCS[q.target] ? ` <small>· ${escapeHtml(NPCS[q.target].island === g.world?.id ? 'nearby' : 'on ' + cap(NPCS[q.target].island))}</small>` : '';
        box.append(el('div', { class: `trk ${q.main ? 'main' : ''}`, html: `<div class="trk-title">${q.main ? '★ ' : ''}${escapeHtml(q.title)}</div><div class="trk-obj">${escapeHtml(q.text)} <b>${q.progress}</b>${who}</div>` }));
      }
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
