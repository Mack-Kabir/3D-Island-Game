const GAME_KEYS = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab',
]);

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export class Input {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedSet = new Set();
    this.mouse = { dx: 0, dy: 0, wheel: 0, down: false, dragging: false, clicked: false, startX: 0, startY: 0, lastX: 0, lastY: 0, id: null };
    this.joy = { x: 0, y: 0, active: false };
    this.virtual = new Set(); // touch buttons held
    this.virtualPressed = new Set();
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    window.addEventListener('keydown', (e) => {
      if (isTyping(e.target)) return;
      if (this.game.ui && this.game.ui.handleKey(e)) {
        e.preventDefault();
        return;
      }
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) this.pressedSet.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
      this.mouse.dragging = false;
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (this.mouse.id !== null) return;
      this.game.audio?.unlock();
      this.mouse.id = e.pointerId;
      this.mouse.down = true;
      this.mouse.dragging = false;
      this.mouse.startX = this.mouse.lastX = e.clientX;
      this.mouse.startY = this.mouse.lastY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.mouse.id || !this.mouse.down) return;
      const dx = e.clientX - this.mouse.lastX;
      const dy = e.clientY - this.mouse.lastY;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
      if (!this.mouse.dragging) {
        const tx = e.clientX - this.mouse.startX;
        const ty = e.clientY - this.mouse.startY;
        if (tx * tx + ty * ty > 36) this.mouse.dragging = true;
      }
      if (this.mouse.dragging) {
        this.mouse.dx += dx;
        this.mouse.dy += dy;
      }
    });
    const up = (e) => {
      if (e.pointerId !== this.mouse.id) return;
      if (!this.mouse.dragging) this.mouse.clicked = true;
      this.mouse.down = false;
      this.mouse.dragging = false;
      this.mouse.id = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.mouse.wheel += Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120);
      },
      { passive: false },
    );
  }

  down(code) {
    return this.keys.has(code) || this.virtual.has(code);
  }
  pressed(code) {
    return this.pressedSet.has(code) || this.virtualPressed.has(code);
  }
  anyPressed(...codes) {
    return codes.some((c) => this.pressed(c));
  }
  /** Fire a virtual key from on-screen buttons. */
  tap(code) {
    this.virtualPressed.add(code);
  }
  hold(code, on) {
    if (on) {
      this.virtual.add(code);
      this.virtualPressed.add(code);
    } else this.virtual.delete(code);
  }
  /** Reel / hold action (fishing minigame). */
  holding() {
    return this.down('Space') || this.down('KeyE') || this.mouse.down || this.virtual.has('Reel');
  }
  axis() {
    let x = 0;
    let y = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) y += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y -= 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.joy.active) {
      x += this.joy.x;
      y += this.joy.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }
  endFrame() {
    this.pressedSet.clear();
    this.virtualPressed.clear();
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.wheel = 0;
    this.mouse.clicked = false;
  }
}
