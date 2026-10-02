import './style.css';
import { Game } from './game.js';

function boot() {
  try {
    const game = new Game();
    game.start();
    window.__game = game; // handy for debugging in the console
  } catch (err) {
    console.error(err);
    const ui = document.getElementById('ui');
    ui.innerHTML = `<div class="fatal"><h1>Oh no!</h1><p>The island could not load. Your browser may not support WebGL.</p><pre>${String(err?.message || err)}</pre></div>`;
  }
}
boot();
