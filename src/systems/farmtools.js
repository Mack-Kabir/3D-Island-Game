import * as THREE from 'three';
import { el } from '../core/utils.js';
import { ITEMS, CROPS } from '../data/items.js';
import { itemIconHTML } from '../ui/icons.js';

const TOOL_ICON = { water: '🚿', harvest: '🧺' };

/**
 * FarmVille-style farming: pick a tool (a seed, the watering can, the basket or
 * fertilizer) and your cursor becomes it. Click or tap a soil patch — or hold and
 * drag across the field — to plant, water, harvest or fertilize every patch you pass over.
 */
export class FarmTools {
  constructor(game) {
    this.game = game;
    this.tool = null; // { kind: 'plant' | 'water' | 'harvest' | 'fertilize', item }
    this.painting = false;
    this.pointer = null; // last pointer position over the game view
    this.touched = new Set(); // patches already handled during this drag
    this.sfxT = 0;
    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();

    // a square that hugs the patch under the cursor (green = will work, red = won't)
    const mat = new THREE.MeshBasicMaterial({ color: '#7fe07a', transparent: true, opacity: 0.9, depthTest: false });
    this.hover = new THREE.Group();
    for (const [x, z, w, d] of [[0, -1.05, 2.2, 0.12], [0, 1.05, 2.2, 0.12], [-1.05, 0, 0.12, 2.2], [1.05, 0, 0.12, 2.2]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat);
      m.position.set(x, 0, z);
      m.renderOrder = 5;
      this.hover.add(m);
    }
    this.hoverMat = mat;
    this.hover.visible = false;
    game.scene.add(this.hover);

    // the cursor: a big picture of the crop / tool that follows the pointer
    this.cursor = el('div', { class: 'farm-cursor hidden', 'aria-hidden': 'true' });
    game.ui.root.append(this.cursor);
    this.bar = el('div', { class: 'farm-bar hidden', role: 'toolbar', 'aria-label': 'Farm tools' });
    game.ui.layer.append(this.bar);
    this.modeBar = el('div', { class: 'farm-mode hidden', role: 'status' });
    game.ui.layer.append(this.modeBar);
    this.barKey = '';

    const canvas = game.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('pointerup', () => this.onUp());
    window.addEventListener('pointercancel', () => this.onUp());
    canvas.addEventListener('contextmenu', () => this.active && this.stop());
    window.addEventListener('keydown', (e) => {
      if (this.active && e.code === 'Escape' && !this.game.isPaused()) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.stop();
      }
    }, true);
  }

  get active() {
    return !!this.tool;
  }
  get home() {
    return this.game.home;
  }

  /** Is the player at their homestead with the farm in view? */
  atFarm() {
    const g = this.game;
    return g.mode === 'play' && g.world?.id === 'palmora' && g.home.center && g.player && g.player.pos.distanceTo(g.home.center) < 30;
  }

  // ── choosing tools ──────────────────────────────
  /** Show the seed picker; picking one starts planting mode. */
  chooseSeed(onPicked) {
    const g = this.game;
    const s = g.state;
    const seeds = Object.keys(s.inventory).filter((id) => ITEMS[id]?.type === 'seed' && s.inventory[id] > 0);
    if (!seeds.length) {
      g.ui.toast('No seeds! Buy some at Chloe\'s fruit stand.', 'warn');
      return;
    }
    g.ui.openPicker({
      title: 'Plant what?',
      items: seeds,
      render: (id) => `${itemIconHTML(CROPS[ITEMS[id].crop].item, 34)}<span class="slot-name">${ITEMS[id].name}</span><span class="count">×${s.inventory[id]}</span>`,
      onPick: (id) => {
        this.start({ kind: 'plant', item: id });
        onPicked?.(id);
      },
    });
  }
  chooseFertilizer() {
    const g = this.game;
    const ferts = this.home.fertilizers();
    if (!ferts.length) return g.ui.toast('No fertilizer. Chloe sells it (from level 4).', 'warn');
    if (ferts.length === 1) return this.start({ kind: 'fertilize', item: ferts[0] });
    g.ui.openPicker({ title: 'Which fertilizer?', items: ferts, onPick: (id) => this.start({ kind: 'fertilize', item: id }) });
  }
  start(tool) {
    const g = this.game;
    if (tool.kind === 'water' && !g.hasItem('watering_can')) return g.ui.toast('You need a watering can — Chloe sells them.', 'warn');
    this.tool = tool;
    this.touched.clear();
    this.cursor.classList.remove('hidden');
    document.body.classList.add('farm-tool');
    this.refreshCursor();
    this.refreshModeBar();
    if (!this.toldHow) {
      this.toldHow = true;
      g.ui.toast(g.input.isTouch ? 'Tap a soil patch — or drag your finger across the field — to use it on every patch.' : 'Click a soil patch — or hold the mouse and drag across the field — to use it on every patch. Right-click or Esc to stop.', 'info');
    }
  }
  stop() {
    this.tool = null;
    this.painting = false;
    this.hover.visible = false;
    this.cursor.classList.add('hidden');
    document.body.classList.remove('farm-tool');
    this.refreshModeBar();
  }

  /** The picture that replaces the cursor. */
  refreshCursor() {
    const t = this.tool;
    if (!t) return;
    let html;
    if (t.kind === 'plant') html = `${itemIconHTML(CROPS[ITEMS[t.item].crop].item, 44)}<i>🌱</i>`;
    else if (t.kind === 'fertilize') html = `<span class="emoji">${ITEMS[t.item].icon}</span>`;
    else html = `<span class="emoji">${TOOL_ICON[t.kind]}</span>`;
    this.cursor.innerHTML = html;
  }
  toolLabel() {
    const t = this.tool;
    const inv = this.game.state.inventory;
    if (t.kind === 'plant') return `🌱 Planting ${CROPS[ITEMS[t.item].crop].name} · ${inv[t.item] || 0} left`;
    if (t.kind === 'fertilize') return `${ITEMS[t.item].icon} Fertilizing · ${inv[t.item] || 0} left`;
    if (t.kind === 'water') return '🚿 Watering';
    return '🧺 Harvesting';
  }
  refreshModeBar() {
    const t = this.tool;
    this.modeBar.classList.toggle('hidden', !t);
    if (!t) return;
    this.modeBar.innerHTML = '';
    const touch = this.game.input.isTouch;
    this.modeBar.append(
      el('b', { text: this.toolLabel() }),
      el('small', { text: touch ? 'Tap or drag over soil patches' : 'Click or drag over soil patches' }),
      t.kind === 'plant' ? el('button', { class: 'btn small', text: 'Change seed', onclick: () => this.chooseSeed() }) : null,
      el('button', { class: 'btn small primary', text: 'Done ✓', onclick: () => this.stop() }),
    );
  }

  // ── pointer painting ────────────────────────────
  onDown(e) {
    if (!this.active) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.painting = true;
    this.touched.clear();
    this.pointer = { x: e.clientX, y: e.clientY, type: e.pointerType };
    this.placeCursor();
    this.applyAt(e.clientX, e.clientY);
  }
  onMove(e) {
    if (!this.active) return;
    this.pointer = { x: e.clientX, y: e.clientY, type: e.pointerType };
    this.placeCursor();
    if (this.painting) this.applyAt(e.clientX, e.clientY);
  }
  onUp() {
    if (this.painting && this.dirty) {
      this.dirty = false;
      this.home.rebuildCrops();
    }
    this.painting = false;
  }
  placeCursor() {
    const p = this.pointer;
    if (!p) return;
    // on touch the picture floats above the finger so you can see it
    const up = p.type === 'touch' ? 70 : 0;
    this.cursor.style.transform = `translate(${p.x}px, ${p.y - up}px)`;
    this.cursor.classList.toggle('finger', p.type === 'touch');
    this.cursor.classList.toggle('lifted', p.type === 'touch' && !this.painting);
  }

  /** Soil patch under a screen point, or -1. */
  plotAtScreen(x, y) {
    const g = this.game;
    const w = g.world;
    this._ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this._ray.setFromCamera(this._ndc, g.camera);
    const o = this._ray.ray.origin;
    const d = this._ray.ray.direction;
    for (let t = 0.5; t < 90; t += 0.35) {
      const px = o.x + d.x * t;
      const py = o.y + d.y * t;
      const pz = o.z + d.z * t;
      if (py <= w.heightAt(px, pz) + 0.15) return this.home.plotAtPoint(px, pz);
    }
    return -1;
  }
  /** Would the current tool do anything on this patch? */
  canUse(i) {
    const h = this.home;
    const p = this.game.state.farm.plots[i];
    if (!p) return false;
    const t = this.tool;
    if (t.kind === 'plant') return !p.crop && (this.game.state.inventory[t.item] || 0) > 0;
    if (t.kind === 'water') return !!p.crop && !p.ready && !h.isWatered(p);
    if (t.kind === 'harvest') return !!p.ready;
    return !!p.crop && !p.ready && !p.fert && (this.game.state.inventory[t.item] || 0) > 0;
  }
  applyAt(x, y) {
    const i = this.plotAtScreen(x, y);
    if (i < 0 || this.touched.has(i)) return;
    this.touched.add(i);
    if (!this.canUse(i)) return;
    const g = this.game;
    const h = this.home;
    const t = this.tool;
    let ok = false;
    if (t.kind === 'plant') ok = h.plantAt(i, t.item);
    else if (t.kind === 'water') ok = h.waterAt(i);
    else if (t.kind === 'fertilize') ok = h.fertilizeAt(i, t.item);
    else {
      const r = h.harvestAt(i);
      ok = !!r;
      if (r) g.ui.itemToast(r.item, r.n);
    }
    if (!ok) return;
    // face the patch and do a little farming animation
    const pp = h.plotPos(i);
    g.player.yaw = Math.atan2(pp.x - g.player.pos.x, pp.z - g.player.pos.z);
    g.player.char.play('plant', 0.35);
    if (this.sfxT <= 0) {
      g.audio.sfx({ plant: 'plant', water: 'water', harvest: 'harvest', fertilize: 'plant' }[t.kind]);
      this.sfxT = 0.12;
    }
    this.dirty = true;
    h.queueRebuild();
    this.refreshModeBar();
    // out of seeds / fertilizer → leave the mode
    if ((t.kind === 'plant' || t.kind === 'fertilize') && !(g.state.inventory[t.item] > 0)) {
      g.ui.toast(`Out of ${ITEMS[t.item].name}!`, 'info');
      this.stop();
    }
  }

  // ── per frame ───────────────────────────────────
  update(dt) {
    const g = this.game;
    this.sfxT -= dt;
    const near = this.atFarm() && !g.fishing.active && !g.boatTrip?.active && !g.travelling;
    if (this.active && (!near || g.ui.panel)) this.stop();
    const paused = g.isPaused();
    this.refreshBar(near && !this.active && !paused);
    this.modeBar.classList.toggle('hidden', !this.active || paused);
    if (!this.active || paused) {
      this.hover.visible = false;
      return;
    }
    // highlight the patch under the cursor
    const p = this.pointer;
    const i = p ? this.plotAtScreen(p.x, p.y) : -1;
    if (i >= 0) {
      const pp = this.home.plotPos(i);
      this.hover.position.set(pp.x, g.world.heightAt(pp.x, pp.z) + 0.24, pp.z);
      this.hoverMat.color.set(this.canUse(i) ? '#7fe07a' : '#ff8a7a');
      this.hover.visible = true;
    } else this.hover.visible = false;
  }

  /** The tool bar shown while you're at the farm. */
  refreshBar(show) {
    const g = this.game;
    this.bar.classList.toggle('hidden', !show);
    if (!show) return;
    const s = g.state;
    const plots = s.farm.plots;
    const seeds = Object.keys(s.inventory).some((id) => ITEMS[id]?.type === 'seed' && s.inventory[id] > 0);
    const ready = plots.filter((p) => p.ready).length;
    const thirsty = g.hasItem('watering_can') ? plots.filter((p) => p.crop && !p.ready && !this.home.isWatered(p)).length : 0;
    const ferts = this.home.fertilizers().length;
    const key = `${seeds}|${ready}|${thirsty}|${ferts}|${g.input.isTouch}`;
    if (key === this.barKey) return;
    this.barKey = key;
    this.bar.innerHTML = '';
    const tool = (icon, label, n, fn, tip) =>
      el('button', { class: 'farm-tool-btn', 'data-tip-title': label, 'data-tip': tip, onclick: fn, 'aria-label': label }, [el('span', { class: 'ft-icon', text: icon }), el('small', { text: label }), n ? el('em', { class: 'badge-dot', text: String(n) }) : null]);
    this.bar.append(
      tool('🌱', 'Plant', 0, () => this.chooseSeed(), 'Pick a seed, then click or drag over empty soil patches.'),
      tool('🚿', 'Water', thirsty, () => this.start({ kind: 'water' }), 'Water growing crops: +50% growth speed.'),
      tool('🧺', 'Harvest', ready, () => this.start({ kind: 'harvest' }), 'Click or drag over ripe crops to harvest them.'),
      ferts ? tool('🧴', 'Fertilize', 0, () => this.chooseFertilizer(), 'Faster growth and a bigger harvest.') : null,
    );
  }
}
