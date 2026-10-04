import * as THREE from 'three';
import { el } from '../core/utils.js';

// where the player stands on each boat model (boat-local coordinates)
const DECK = { 1: [0, 0.4, 1.2], 2: [0, 0.92, -1.8], 3: [0, 0.92, 0.3] };

/**
 * Fishing from your own boat: the moored boat is taken out to deeper water where
 * deep-sea fish bite far more often. Turn with A/D or the joystick, cast with E.
 */
export class BoatTrip {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.busy = false;
    this.t = 0;
    this.btn = null;
    this._v = new THREE.Vector3();
  }

  /** Deep, open water a little way past the mooring. */
  findSpot() {
    const w = this.game.world;
    const dir = w.dock.dir;
    const deep = (x, z) => w.heightAt(x, z) < -2;
    for (const d of [18, 15, 12, 9, 6]) {
      const x = w.boatAnchor.x + dir.x * d;
      const z = w.boatAnchor.z + dir.z * d;
      if (deep(x, z) && deep(x + 5, z) && deep(x - 5, z) && deep(x, z + 5) && deep(x, z - 5)) return new THREE.Vector3(x, 0.05, z);
    }
    return w.boatAnchor.clone();
  }

  async start() {
    const g = this.game;
    const w = g.world;
    if (this.active || this.busy || !w.boatGroup || g.boatTier() <= 0) return;
    if (!g.state.rod) {
      g.ui.toast('You need a fishing rod first — see Old Ross at the Palmora dock.', 'warn');
      return;
    }
    this.busy = true;
    g.fishing.cleanup();
    g.audio.sfx('splash');
    await g.ui.fade(true, 350);
    this.spot = this.findSpot();
    this.active = true;
    this.t = 0;
    w.boatGroup.position.copy(this.spot);
    const p = g.player;
    p.yaw = w.dock.rot + 0.6; // face out to sea, angled away from the dock
    p.root.rotation.y = p.yaw;
    this.placePlayer();
    g.cam.yaw = p.yaw + Math.PI;
    g.cam.target.copy(p.pos);
    this.showButton();
    await g.ui.fade(false, 350);
    this.busy = false;
    g.ui.toast(`🚤 Out on your boat! Deep-sea fish bite far more often here. Turn with ${g.input.isTouch ? 'the joystick' : 'A / D'}, cast with E.`, 'info');
  }

  async stop() {
    if (!this.active || this.busy) return;
    const g = this.game;
    this.busy = true;
    g.fishing.cleanup();
    await g.ui.fade(true, 300);
    this.reset();
    const b = this.savePos();
    g.player.teleport(b.x, b.z, g.world.dock.rot + Math.PI);
    g.cam.yaw = g.player.yaw + Math.PI;
    await g.ui.fade(false, 300);
    this.busy = false;
  }

  /** Instantly put the boat back on its mooring (travel, quitting, loading). */
  reset() {
    const w = this.game.world;
    this.active = false;
    this.btn?.remove();
    this.btn = null;
    if (w?.boatGroup && w.boatAnchor) {
      w.boatGroup.position.copy(w.boatAnchor);
      w.boatGroup.rotation.set(0, w.dock.rot, 0);
    }
  }

  placePlayer() {
    const w = this.game.world;
    const d = DECK[this.game.boatTier()] || DECK[1];
    w.boatGroup.updateMatrixWorld();
    this._v.set(d[0], d[1], d[2]);
    w.boatGroup.localToWorld(this._v);
    this.game.player.pos.copy(this._v);
  }

  /** Where the player is saved while out on the boat: back on the dock. */
  savePos() {
    const d = this.game.world.dock;
    return d.end.clone().addScaledVector(d.dir, -6);
  }

  update(dt) {
    if (!this.active) return;
    const w = this.game.world;
    this.t += dt;
    const b = w.boatGroup;
    b.position.y = this.spot.y + Math.sin(this.t * 1.3) * 0.06;
    b.rotation.set(Math.sin(this.t * 0.8) * 0.02, w.dock.rot, Math.sin(this.t * 0.9) * 0.025);
    if (this.btn) this.btn.hidden = this.game.fishing.active; // out of the way while a line is out
    if (this.game.input.pressed('KeyQ') && !this.game.isPaused() && !this.game.fishing.active) this.stop();
  }

  showButton() {
    this.btn?.remove();
    const touch = this.game.input.isTouch;
    this.btn = el('button', {
      class: 'btn boat-exit',
      'data-tip-title': 'Back to the dock',
      'data-tip': 'Row back and step onto the dock.',
      html: `⚓ Back to dock${touch ? '' : ' <kbd>Q</kbd>'}`,
      onclick: () => this.stop(),
    });
    this.game.ui.layer.append(this.btn);
  }
}
