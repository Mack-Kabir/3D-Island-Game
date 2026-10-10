import * as THREE from 'three';
import { el, escapeHtml } from '../shared/utils.js';
import { Hud } from './hud.js';
import { PANELS } from './panels.js';
import { itemIconHTML } from './icons.js';
import { ITEMS } from '../shared/items.js';

/**
 * DOM user interface: HUD, panels, toasts, world-space labels and overlays.
 */
export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.live = document.getElementById('sr-live');
    this.labelsEl = el('div', { class: 'labels', 'aria-hidden': 'true' });
    this.layer = el('div', { class: 'layer' });
    this.hudEl = el('div', { class: 'hud hidden' });
    this.toastsEl = el('div', { class: 'toasts', role: 'log', 'aria-live': 'polite' });
    this.bannerEl = el('div', { class: 'banners' });
    this.promptEl = el('div', { class: 'prompt hidden', role: 'status' });
    this.panelHost = el('div', { class: 'panel-host hidden' });
    this.dialogueHost = el('div', { class: 'dialogue-host' });
    this.screenHost = el('div', { class: 'screen-host' });
    this.fadeEl = el('div', { class: 'fade' });
    this.hurtEl = el('div', { class: 'hurt-flash' });
    this.root.append(this.labelsEl, this.layer, this.hudEl, this.promptEl, this.toastsEl, this.bannerEl, this.dialogueHost, this.panelHost, this.screenHost, this.hurtEl, this.fadeEl);
    this.labels = [];
    this.floats = [];
    this.panel = null;
    this.hud = new Hud(this);
    this._v = new THREE.Vector3();
    this.bannerQueue = [];
    this.tipEl = el('div', { class: 'tooltip hidden', role: 'tooltip' });
    this.root.append(this.tipEl);
    this.initTooltips();
    this.applySettings();
  }

  // ── tooltips ───────────────────────────────────
  /**
   * Details never pop up just because the cursor is resting somewhere. They appear when you
   * tap/click an info element, long-press anything (buttons too), or reach it with the keyboard.
   */
  initTooltips() {
    const LONG_PRESS = 500;
    const sel = '[data-tip], [data-tip-title]';
    const interactive = 'button, a, input, select, textarea, [role="button"], [role="tab"], .slot';
    const show = (target) => {
      const title = target.getAttribute('data-tip-title') || '';
      const desc = target.getAttribute('data-tip') || '';
      if (!title && !desc) return;
      const r = target.getBoundingClientRect();
      this.showTip(title, desc, r.left + r.width / 2, r.top, r.bottom);
      this._tipFor = target;
    };
    let press = null;
    document.addEventListener(
      'pointerdown',
      (e) => {
        const t = e.target.closest?.(sel);
        // taps on the 3D world are handled by updateWorldTip (tap the same thing again to close)
        const onWorld = e.target === this.game.renderer.domElement && this._worldTip;
        if ((!t || t !== this._tipFor) && !onWorld) this.hideTip(true);
        clearTimeout(press?.timer);
        press = t ? { t, x: e.clientX, y: e.clientY, timer: setTimeout(() => ((press.long = true), show(t)), LONG_PRESS) } : null;
      },
      true,
    );
    document.addEventListener(
      'pointermove',
      (e) => {
        if (press && !press.long && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) {
          clearTimeout(press.timer);
          press = null;
        }
      },
      true,
    );
    const release = () => clearTimeout(press?.timer);
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    document.addEventListener(
      'click',
      (e) => {
        // a long-press only shows the details — it doesn't also press the button
        if (press?.long) {
          e.preventDefault();
          e.stopPropagation();
          press = null;
          return;
        }
        press = null;
        const t = e.target.closest?.(sel);
        if (!t || t.closest(interactive)) return;
        // tapping an info element toggles its details
        if (this._tipFor === t && !this.tipEl.classList.contains('hidden')) this.hideTip(true);
        else show(t);
      },
      true,
    );
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest?.(sel)) e.preventDefault();
    });
    // keyboard users still get details when they tab onto something
    document.addEventListener('focusin', (e) => {
      const t = e.target.closest?.(sel);
      clearTimeout(this._tipTimer);
      if (t && t.matches(':focus-visible')) this._tipTimer = setTimeout(() => show(t), 400);
      else if (this._tipFor && !this._worldTip) this.hideTip(true);
    });
    document.addEventListener('keydown', (e) => e.code === 'Escape' && this.hideTip(true));
    document.addEventListener('scroll', () => this.hideTip(true), true);
  }
  showTip(title, desc, x, top, bottom = top) {
    const t = this.tipEl;
    t.innerHTML = `${title ? `<b>${escapeHtml(title)}</b>` : ''}${desc ? `<span>${escapeHtml(desc)}</span>` : ''}`;
    t.classList.remove('hidden');
    const w = t.offsetWidth;
    const h = t.offsetHeight;
    let left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    let y = top - h - 10;
    if (y < 8) y = bottom + 10;
    t.style.transform = `translate(${left}px, ${y}px)`;
  }
  hideTip(forget = false) {
    clearTimeout(this._tipTimer);
    this.tipEl.classList.add('hidden');
    if (forget) this._tipFor = null;
    this._worldTip = null;
  }
  /** Tapping / clicking things in the 3D world shows their name and details (never on hover). */
  updateWorldTip() {
    const g = this.game;
    const input = g.input;
    const active = g.mode === 'play' && !g.isPaused();
    if (!active) {
      if (this._worldTip) this.hideTip(true);
      return;
    }
    if (input.mouse.clicked && !g.farmTools?.active) {
      const at = { x: input.mouse.lastX, y: input.mouse.lastY };
      const thing = this.pickWorldThing(at, 60) || this.groundThing(at);
      // tapping the same thing again closes it
      if (thing && this._worldTip && thing.key === this._worldTip.key) this.hideTip(true);
      else if (thing) {
        this.showWorldTip(thing, at);
        this._pinnedUntil = performance.now() + 5000;
        this._pinAt = at;
      } else if (this._worldTip) this.hideTip(true);
      return;
    }
    if (this._worldTip) {
      const m = input.hover;
      const moved = m && this._pinAt && Math.hypot(m.x - this._pinAt.x, m.y - this._pinAt.y) > 120;
      const walked = Math.abs(input.axis().x) + Math.abs(input.axis().y) > 0.1;
      if (performance.now() > this._pinnedUntil || moved || walked) this.hideTip(true);
    }
  }

  pickWorldThing(at, radius) {
    const g = this.game;
    const things = g.world?.hoverables() || [];
    let best = null;
    let bd = radius;
    const v = new THREE.Vector3();
    for (const th of things) {
      v.copy(th.pos);
      v.y += th.h ?? 1;
      if (v.distanceTo(g.camera.position) > 50) continue;
      const sp = this.project(v);
      if (!sp) continue;
      // things further away need a closer aim
      const d = Math.hypot(sp.x - at.x, sp.y - at.y) * (th.key?.def || th.key?.boss !== undefined ? 0.8 : 1);
      if (d < bd) {
        bd = d;
        best = th;
      }
    }
    return best;
  }

  /** Sea or beach under the cursor, when nothing else is there. */
  groundThing(at) {
    const g = this.game;
    const w = g.world;
    if (!w) return null;
    const ndc = new THREE.Vector2((at.x / window.innerWidth) * 2 - 1, -(at.y / window.innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, g.camera);
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    // march along the ray until we hit the terrain or the water surface
    for (let t = 1; t < 120; t += 0.5) {
      const x = o.x + d.x * t;
      const y = o.y + d.y * t;
      const z = o.z + d.z * t;
      const h = w.heightAt(x, z);
      if (y <= Math.max(h, 0)) {
        const key = h < -0.25 ? 'sea' : h < 1.1 ? 'sand' : null;
        if (!key) return null;
        return {
          key,
          pos: new THREE.Vector3(x, Math.max(h, 0), z),
          tip: key === 'sea'
            ? { title: 'Sea', desc: g.state?.rod ? 'Face the water and press E to cast your line.\nRarer fish bite at night and in the rain.' : 'Fish live here! Old Ross at the Palmora dock gives you a free rod.' }
            : { title: 'Sandy beach', desc: 'Shells, starfish and driftwood wash up on the sand every day.\nWalk over them to collect.' },
        };
      }
    }
    return null;
  }

  showWorldTip(thing, at) {
    const g = this.game;
    let tip = typeof thing.tip === 'function' ? thing.tip() : thing.tip;
    if (!tip) return;
    // point out when this thing matters for the current quest
    const t = g.ui.hud.target;
    const k = thing.key;
    const isTarget = t && ((t.follow && k?.root === t.follow) || t.pos === thing.pos || t.pos === k?.pos);
    const objective = g.quests?.tracker()[0];
    if (isTarget && objective) tip = { ...tip, desc: `${tip.desc}\n★ Quest: ${objective.text}` };
    else if (k?.def && g.state) {
      const q = g.quests;
      if (q.talkLines(k.id).length) tip = { ...tip, desc: `${tip.desc}\n★ Has something to tell you for your quest!` };
      else if (q.offers(k.id).length) tip = { ...tip, desc: `${tip.desc}\n❔ Has a request for you.` };
    }
    this.showTip(tip.title, tip.desc, at.x, at.y - 14, at.y + 20);
    this._worldTip = thing;
  }

  applySettings() {
    const s = this.game.settings;
    const scale = { s: 0.9, m: 1, l: 1.15, xl: 1.3 }[s.textSize] ?? 1;
    document.documentElement.style.setProperty('--ui-scale', scale);
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
    document.body.classList.toggle('hc', !!s.highContrast);
    document.body.classList.toggle('no-hints', !s.hints);
  }

  // ── keyboard ───────────────────────────────────
  handleKey(e) {
    const g = this.game;
    if (this.resultsOpen) {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyE') {
        this.resultsOpen();
        return true;
      }
      return true;
    }
    if (g.dialogue?.isOpen()) return g.dialogue.handleKey(e);
    if (this.pickerEl) {
      if (e.code === 'Escape') {
        this.closePicker();
        return true;
      }
      return false;
    }
    if (this.panel) {
      if (e.code === 'Escape' || (this.panel.hotkey && e.code === this.panel.hotkey)) {
        this.closePanel();
        return true;
      }
      if (e.code === 'Tab' && this.panel.tabs?.length > 1 && e.shiftKey === false && document.activeElement?.closest('.tabs')) return false;
      return false;
    }
    if (g.mode !== 'play' || g.travelling) return false;
    if (g.fishing.active || g.home.placing) return false;
    const map = { KeyI: 'bag', Tab: 'bag', KeyJ: 'quests', KeyM: 'map', KeyC: 'wardrobe', Escape: 'pause' };
    if (map[e.code]) {
      this.openPanel(map[e.code]);
      return true;
    }
    return false;
  }

  // ── projection & labels ────────────────────────
  project(v) {
    const cam = this.game.camera;
    const p = this._v.copy(v).project(cam);
    if (p.z > 1 || p.z < -1) return null;
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  }
  addLabel(obj, { offsetY = 2.2, cls = '', html = '', maxDist = 18, alwaysVisible = false } = {}) {
    const e = el('div', { class: `wlabel ${cls}`, html });
    this.labelsEl.append(e);
    const label = {
      obj,
      offsetY,
      el: e,
      maxDist,
      alwaysVisible,
      set: (h) => {
        if (label._h !== h) {
          e.innerHTML = h;
          label._h = h;
        }
      },
      remove: () => {
        e.remove();
        this.labels = this.labels.filter((l) => l !== label);
      },
    };
    this.labels.push(label);
    return label;
  }
  updateLabels() {
    const cam = this.game.camera;
    const w = new THREE.Vector3();
    for (const l of this.labels) {
      if (!l.obj.parent || !l.obj.visible || this.game.mode !== 'play') {
        l.el.style.display = 'none';
        continue;
      }
      l.obj.getWorldPosition(w);
      const d = w.distanceTo(cam.position);
      w.y += l.offsetY * (l.obj.scale?.y ?? 1);
      const s = this.project(w);
      if (!s || (!l.alwaysVisible && d > l.maxDist + 10)) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      l.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
      l.el.style.opacity = l.alwaysVisible ? 1 : Math.max(0, Math.min(1, (l.maxDist + 10 - d) / 10));
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.t += 1 / 60;
      f.pos.y += 0.02;
      const s = this.project(f.pos);
      if (!s || f.t > 1.1) {
        f.el.remove();
        this.floats.splice(i, 1);
        continue;
      }
      f.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${f.t < 0.15 ? 0.6 + f.t * 3 : 1})`;
      f.el.style.opacity = f.t > 0.7 ? (1.1 - f.t) / 0.4 : 1;
    }
  }
  floatText(pos, text, cls = 'dmg') {
    const e = el('div', { class: `float-text ${cls}`, text });
    this.labelsEl.append(e);
    this.floats.push({ el: e, pos: pos.clone(), t: 0 });
  }

  // ── notifications ──────────────────────────────
  toast(text, kind = 'info') {
    const t = el('div', { class: `toast ${kind}`, html: escapeHtml(text) });
    this.toastsEl.append(t);
    this.announce(text);
    while (this.toastsEl.children.length > 5) this.toastsEl.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 3600);
    setTimeout(() => t.remove(), 4100);
  }
  itemToast(id, n) {
    const it = ITEMS[id];
    const t = el('div', { class: 'toast item' }, [el('span', { class: 'ti', html: itemIconHTML(id, 26) }), el('span', { text: `+${n} ${it?.name ?? id}` })]);
    this.toastsEl.append(t);
    this.announce(`Got ${n} ${it?.name}`);
    while (this.toastsEl.children.length > 5) this.toastsEl.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  banner(title, sub = '', icon = '✨') {
    this.bannerQueue.push({ title, sub, icon });
    if (!this.bannerBusy) this.nextBanner();
  }
  nextBanner() {
    const b = this.bannerQueue.shift();
    if (!b) {
      this.bannerBusy = false;
      return;
    }
    this.bannerBusy = true;
    const e = el('div', { class: 'banner', role: 'status' }, [el('div', { class: 'banner-icon', text: b.icon }), el('div', {}, [el('div', { class: 'banner-title', text: b.title }), b.sub ? el('div', { class: 'banner-sub', text: b.sub }) : null])]);
    this.bannerEl.append(e);
    this.announce(`${b.title}. ${b.sub}`);
    setTimeout(() => e.classList.add('out'), 2600);
    setTimeout(() => {
      e.remove();
      this.nextBanner();
    }, 3000);
  }
  announce(text) {
    if (this.live) this.live.textContent = text;
  }
  flashDamage() {
    this.hurtEl.classList.remove('on');
    void this.hurtEl.offsetWidth;
    this.hurtEl.classList.add('on');
  }
  flashLightning() {
    this.fadeEl.classList.add('lightning');
    setTimeout(() => this.fadeEl.classList.remove('lightning'), 160);
  }

  setPrompt(info) {
    const key = info ? `${info.key}|${info.text}|${info.icon}` : '';
    if (key === this._prompt) return;
    this._prompt = key;
    if (!info) {
      this.promptEl.classList.add('hidden');
      return;
    }
    this.promptEl.classList.remove('hidden');
    this.promptEl.innerHTML = '';
    const btn = el('button', { class: 'prompt-btn', 'aria-label': info.text, onclick: () => this.game.input.tap(info.code || 'KeyE') }, [
      el('kbd', { text: this.game.input.isTouch ? 'TAP' : info.key }),
      el('span', { class: 'prompt-icon', text: info.icon || '' }),
      el('span', { text: info.text }),
    ]);
    this.promptEl.append(btn);
  }
  setPlacementHint(on) {
    this.setPrompt(on ? { key: 'E', text: 'Place · R rotate · Esc cancel', icon: '🧱' } : null);
    this.placementHint = on;
  }

  async fade(on, ms = 450) {
    this.fadeEl.style.transitionDuration = `${ms}ms`;
    this.fadeEl.classList.toggle('on', on);
    await new Promise((r) => setTimeout(r, ms));
  }

  // ── panels ─────────────────────────────────────
  openPanel(name, opts = {}) {
    const def = PANELS[name];
    if (!def) return;
    const g = this.game;
    if (g.fishing.active) g.fishing.cancel();
    this.closePanel(true);
    g.audio.sfx('open');
    const panel = { name, opts, tab: opts.tab, hotkey: def.hotkey };
    this.panel = panel;
    this.panelHost.classList.remove('hidden');
    this.panelHost.innerHTML = '';
    const backdrop = el('div', { class: 'backdrop', onclick: () => this.closePanel() });
    const box = el('div', { class: `panel panel-${name} ${def.wide ? 'wide' : ''} ${def.side ? 'side' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title' });
    this.panelHost.append(backdrop, box);
    panel.box = box;
    def.onOpen?.(this, opts);
    this.renderPanel();
    requestAnimationFrame(() => box.querySelector('.tab.active, button:not(.close), [tabindex]')?.focus({ preventScroll: true }));
    g.onPanelChange(true, name);
  }
  renderPanel() {
    const p = this.panel;
    if (!p) return;
    const def = PANELS[p.name];
    const res = def.render(this, p.opts, p);
    if (res.tabs && !p.tab) p.tab = res.tabs[0].id;
    const box = p.box;
    const scrollTop = box.querySelector('.panel-body')?.scrollTop ?? 0;
    box.innerHTML = '';
    const head = el('div', { class: 'panel-head' }, [
      el('span', { class: 'panel-icon', text: res.icon || '' }),
      el('h2', { id: 'panel-title', text: res.title }),
      res.headExtra || null,
      el('button', { class: 'close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => this.closePanel(), html: '✕' }),
    ]);
    box.append(head);
    if (res.tabs) {
      const tabs = el('div', { class: 'tabs', role: 'tablist' });
      for (const t of res.tabs) {
        tabs.append(
          el('button', {
            class: `tab ${p.tab === t.id ? 'active' : ''}`,
            role: 'tab',
            'aria-selected': p.tab === t.id ? 'true' : 'false',
            onclick: () => {
              p.tab = t.id;
              this.game.audio.sfx('click');
              this.renderPanel();
              this.panel?.box.querySelector('.tab.active')?.focus();
            },
            html: `${t.icon ? `<span aria-hidden="true">${t.icon}</span> ` : ''}${escapeHtml(t.label)}${t.badge ? ` <em class="badge-dot">${t.badge}</em>` : ''}`,
          }),
        );
      }
      box.append(tabs);
    }
    const body = el('div', { class: 'panel-body' });
    const content = res.body(p.tab);
    body.append(content);
    box.append(body);
    if (res.footer) box.append(el('div', { class: 'panel-foot' }, [res.footer]));
    body.scrollTop = p.keepScroll ? scrollTop : 0;
    p.keepScroll = false;
  }
  /** Re-render keeping scroll (after buying etc.). */
  refreshPanel() {
    if (!this.panel) return;
    this.panel.keepScroll = true;
    this.renderPanel();
  }
  closePanel(silent = false) {
    if (!this.panel) return;
    const def = PANELS[this.panel.name];
    def.onClose?.(this, this.panel.opts);
    this.panel = null;
    this.panelHost.classList.add('hidden');
    this.panelHost.innerHTML = '';
    if (!silent) this.game.audio.sfx('close');
    this.game.onPanelChange(false);
    document.getElementById('scene').focus({ preventScroll: true });
  }

  /** Small modal list to choose an inventory item. */
  openPicker({ title, items, onPick, render }) {
    this.closePicker();
    const g = this.game;
    const list = el('div', { class: 'picker-list' });
    for (const id of items) {
      list.append(
        el('button', {
          class: 'slot',
          onclick: () => {
            this.closePicker();
            onPick(id);
          },
          html: render ? render(id) : `${itemIconHTML(id, 34)}<span class="slot-name">${escapeHtml(ITEMS[id].name)}</span><span class="count">×${g.state.inventory[id] || 0}</span>`,
        }),
      );
    }
    this.pickerEl = el('div', { class: 'picker-host' }, [
      el('div', { class: 'backdrop', onclick: () => this.closePicker() }),
      el('div', { class: 'panel picker', role: 'dialog', 'aria-label': title }, [
        el('div', { class: 'panel-head' }, [el('h2', { text: title }), el('button', { class: 'close', 'aria-label': 'Close', onclick: () => this.closePicker(), html: '✕' })]),
        el('div', { class: 'panel-body' }, [list]),
      ]),
    ]);
    this.root.append(this.pickerEl);
    g.onPanelChange(true, 'picker');
    requestAnimationFrame(() => this.pickerEl?.querySelector('.slot')?.focus());
  }
  closePicker() {
    if (!this.pickerEl) return;
    this.pickerEl.remove();
    this.pickerEl = null;
    this.game.onPanelChange(!!this.panel);
  }

  showResults({ title, subtitle, rows, prize, onClose }) {
    const g = this.game;
    const host = el('div', { class: 'results-host' });
    const close = () => {
      host.remove();
      this.resultsOpen = null;
      onClose?.();
      g.onPanelChange(false);
    };
    const prizeText = prize ? [prize.coins ? `🪙 ${prize.coins}` : '', prize.gems ? `💎 ${prize.gems}` : '', prize.items ? Object.keys(prize.items).map((k) => ITEMS[k].icon + ' ' + ITEMS[k].name).join(', ') : '', prize.cosmetics ? '👑 Champion Crown' : ''].filter(Boolean).join(' · ') : 'No prize this time.';
    host.append(
      el('div', { class: 'backdrop' }),
      el('div', { class: 'panel results', role: 'dialog', 'aria-label': title }, [
        el('div', { class: 'results-title', text: title }),
        el('div', { class: 'results-sub', text: subtitle }),
        el('ol', { class: 'results-list' }, rows.map((r, i) => el('li', { class: r.you ? 'you' : '' }, [el('span', { class: 'medal', text: ['🥇', '🥈', '🥉', '4'][i] }), el('span', { text: r.name }), el('b', { text: `${r.score} pts` })]))),
        el('div', { class: 'results-prize', text: prizeText }),
        el('button', { class: 'btn primary', text: prize ? 'Collect prize' : 'Continue', onclick: close }),
      ]),
    );
    this.root.append(host);
    this.resultsOpen = close;
    g.onPanelChange(true, 'results');
    requestAnimationFrame(() => host.querySelector('button')?.focus());
  }

  showHud(on) {
    this.hudEl.classList.toggle('hidden', !on);
  }
  refreshHud() {
    this._hudDirty = true;
  }
  update(dt) {
    this.updateLabels();
    this.updateWorldTip(dt);
    if (this._hudDirty) {
      this._hudDirty = false;
      this.hud.render();
    }
    this.hud.tick(dt);
  }
}
