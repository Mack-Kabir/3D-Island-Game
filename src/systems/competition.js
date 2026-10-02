import { Character } from '../entities/character.js';
import { rand, el, escapeHtml } from '../core/utils.js';
import { fishPoints } from './fishing.js';

export const LEAGUES = [
  { id: 'bronze', name: 'Bronze League', fee: 50, level: 1, skill: 1, prizes: [{ coins: 400, gems: 8, items: { trophy_bronze: 1 } }, { coins: 200, gems: 3 }, { coins: 100, gems: 1 }] },
  { id: 'silver', name: 'Silver League', fee: 250, level: 8, skill: 2.4, prizes: [{ coins: 1500, gems: 20, items: { trophy_silver: 1 } }, { coins: 700, gems: 8 }, { coins: 350, gems: 3 }] },
  { id: 'gold', name: 'Gold League', fee: 800, level: 14, skill: 5, prizes: [{ coins: 5000, gems: 50, items: { trophy_gold: 1 }, cosmetics: ['crown'] }, { coins: 2200, gems: 20 }, { coins: 1000, gems: 8 }] },
];

const RIVALS = [
  { name: 'Reel Rita', look: { gender: 'f', skin: 2, hair: 'ponytail', hairColor: 5, top: 'sailor', bottom: 'shorts_denim', hat: 'cap_red', shoes: '#3a3040' } },
  { name: 'Gill Bates', look: { gender: 'm', skin: 0, hair: 'short', hairColor: 3, top: 'explorer', bottom: 'pants_cargo', hat: 'straw_hat', acc: 'sunglasses', shoes: '#5a3825' } },
  { name: 'Captain Hookline', look: { gender: 'm', skin: 4, hair: 'buzz', hairColor: 8, top: 'captain_coat', bottom: 'pants_white', hat: 'captain_hat', shoes: '#2a2534' } },
];

const DURATION = 180;

export class Competition {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.rivalChars = [];
  }
  available() {
    const h = this.game.time.hour();
    return h >= 7 && h < 19;
  }
  start(leagueId) {
    const g = this.game;
    const L = LEAGUES.find((l) => l.id === leagueId);
    if (!L) return;
    if (!this.available()) return g.ui.toast('Tournaments run from 7AM to 7PM.', 'warn');
    if (g.state.level < L.level) return g.ui.toast(`Reach level ${L.level} to enter the ${L.name}.`, 'warn');
    if (!g.state.rod) return g.ui.toast('You need a fishing rod!', 'warn');
    if (g.state.coins < L.fee) return g.ui.toast(`Entry fee is ${L.fee} coins.`, 'warn');
    g.spend(L.fee, 0);
    const best = g.state.tournament.wins[L.id] || 0;
    this.active = {
      league: L,
      t: DURATION,
      score: 0,
      catches: 0,
      rivals: RIVALS.map((r, i) => ({
        name: r.name,
        score: 0,
        // each rival aims for a final score that scales with league and your record
        goal: rand(120, 260) * L.skill * (1 + best * 0.15) * (0.75 + i * 0.2),
        next: rand(10, 20),
      })),
    };
    this.spawnRivals();
    g.ui.banner(L.name, 'Catch the most valuable fish in 3 minutes! GO!', '🏁');
    g.audio.sfx('whistle');
    this.buildHud();
  }
  spawnRivals() {
    const w = this.game.world;
    this.clearRivals();
    if (!w.competitionSpots) return;
    RIVALS.forEach((r, i) => {
      const sp = w.competitionSpots[i];
      const c = new Character(r.look);
      c.hold('rod', 'fiberglass');
      c.root.position.set(sp.x, w.groundAt(sp.x, sp.z), sp.z);
      c.root.rotation.y = sp.yaw;
      w.dynamic.add(c.root);
      this.rivalChars.push(c);
    });
  }
  clearRivals() {
    for (const c of this.rivalChars) c.dispose();
    this.rivalChars = [];
  }
  onCatch(fish, weight) {
    if (!this.active || fish.tier === 'junk') return 0;
    const pts = fishPoints(fish, weight);
    this.active.score += pts;
    this.active.catches++;
    this.renderHud();
    return pts;
  }
  forfeit() {
    if (!this.active) return;
    this.game.ui.toast('You left the tournament area — forfeited!', 'warn');
    this.end(true);
  }
  update(dt) {
    for (const c of this.rivalChars) c.update(dt, { pose: 'fish' });
    const a = this.active;
    if (!a) return;
    if (this.game.world?.id !== 'coralia') return this.forfeit();
    a.t -= dt;
    for (const r of a.rivals) {
      r.next -= dt;
      if (r.next <= 0) {
        r.next = rand(10, 24);
        const remaining = Math.max(0, r.goal - r.score);
        const gain = Math.round(Math.min(remaining, r.goal * rand(0.06, 0.2)));
        if (gain > 0) {
          r.score += gain;
          const ri = a.rivals.indexOf(r);
          const ch = this.rivalChars[ri];
          if (ch) this.game.particles.burst(ch.root.position.clone().setY(1.5), { count: 6, color: '#e8fbff', speed: 1.5, up: 2 });
        }
      }
    }
    this.renderHud();
    if (a.t <= 0) this.end();
  }
  standings() {
    const a = this.active;
    const rows = [{ name: this.game.state.name, score: a.score, you: true }, ...a.rivals.map((r) => ({ name: r.name, score: r.score }))];
    rows.sort((x, y) => y.score - x.score);
    return rows;
  }
  end(forfeit = false) {
    const g = this.game;
    const a = this.active;
    if (!a) return;
    const rows = this.standings();
    const place = forfeit ? 4 : rows.findIndex((r) => r.you) + 1;
    this.active = null;
    this.hud?.remove();
    this.hud = null;
    setTimeout(() => this.clearRivals(), 3000);
    if (forfeit) return;
    const L = a.league;
    const t = g.state.tournament;
    t.best[L.id] = Math.max(t.best[L.id] || 0, a.score);
    g.audio.sfx(place === 1 ? 'fanfare' : 'whistle');
    g.events.emit('compete', { place, league: L.id });
    const prize = L.prizes[place - 1];
    if (place === 1) t.wins[L.id] = (t.wins[L.id] || 0) + 1;
    g.ui.showResults({
      title: place === 1 ? '🏆 CHAMPION!' : place <= 3 ? `You placed #${place}!` : 'Better luck next time!',
      subtitle: L.name,
      rows,
      prize,
      onClose: () => prize && g.give(prize),
    });
    g.addXP(30 + a.catches * 6);
    if (place === 1) g.player.pose = 'cheer';
  }
  buildHud() {
    this.hud?.remove();
    this.hud = el('div', { class: 'comp-hud panel-lite', role: 'status', 'aria-label': 'Tournament standings' });
    this.game.ui.layer.append(this.hud);
    this.renderHud();
  }
  renderHud() {
    if (!this.hud || !this.active) return;
    const a = this.active;
    const m = Math.floor(Math.max(0, a.t) / 60);
    const s = String(Math.floor(Math.max(0, a.t) % 60)).padStart(2, '0');
    const rows = this.standings();
    const html = `<div class="comp-head"><span>🏁 ${a.league.name}</span><b class="${a.t < 20 ? 'urgent' : ''}">${m}:${s}</b></div>
      <ol>${rows.map((r, i) => `<li class="${r.you ? 'you' : ''}"><span>${i + 1}. ${escapeHtml(r.name)}</span><b>${r.score}</b></li>`).join('')}</ol>`;
    if (html !== this._last) {
      this.hud.innerHTML = html;
      this._last = html;
    }
  }
}
