import * as THREE from 'three';
import { el, escapeHtml } from '../core/utils.js';
import { Hud } from './hud.js';
import { PANELS } from './panels.js';
import { itemIconHTML } from './icons.js';
import { ITEMS } from '../data/items.js';

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
    this.applySettings();
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
    if (this._hudDirty) {
      this._hudDirty = false;
      this.hud.render();
    }
    this.hud.tick(dt);
  }
}
