import { QUESTS, BOUNTY_TEMPLATES } from '../data/quests.js';
import { FISH_BY_ID, tierIndex } from '../data/fish.js';
import { ITEMS } from '../data/items.js';
import { mulberry32, hashString } from '../core/utils.js';

const EVENTS = ['catch', 'sell', 'talk', 'visit', 'defeat', 'plant', 'harvest', 'build', 'cook', 'compete', 'buy', 'collect', 'inventory', 'level', 'own'];

export class QuestSystem {
  constructor(game) {
    this.game = game;
    for (const ev of EVENTS) game.events.on(ev, (data) => this.onEvent(ev, data || {}));
    game.events.on('newDay', () => this.refreshBounties());
  }
  get s() {
    return this.game.state.quests;
  }

  start(id, silent = false) {
    const q = QUESTS[id];
    if (!q || this.s.active[id] || this.s.done.includes(id)) return;
    this.s.active[id] = { step: 0, progress: 0 };
    if (!silent) {
      this.game.ui.banner(q.main ? 'New Story Quest' : 'Quest Accepted', q.title, '📜');
      this.game.audio.sfx('quest');
    }
    this.refresh();
    this.game.ui.refreshHud();
  }

  isActive(id) {
    return !!this.s.active[id];
  }
  isDone(id) {
    return this.s.done.includes(id);
  }

  currentObjective(id) {
    const q = QUESTS[id];
    const st = this.s.active[id];
    if (!q || !st) return null;
    return q.objectives[st.step];
  }

  /** Talk lines for this NPC from any active quest; completes those objectives. */
  talkLines(npcId) {
    const out = [];
    for (const id of Object.keys(this.s.active)) {
      const obj = this.currentObjective(id);
      if (obj && obj.type === 'talk' && obj.target === npcId) {
        out.push({ quest: id, lines: obj.lines || [], give: obj.give });
      }
    }
    return out;
  }
  completeTalk(questId) {
    const obj = this.currentObjective(questId);
    if (!obj) return;
    if (obj.give) this.game.give(obj.give, { source: 'quest' });
    this.advance(questId);
  }

  /** Side quests this NPC can offer right now. */
  offers(npcId) {
    return Object.values(QUESTS).filter((q) => q.giver === npcId && !this.s.active[q.id] && !this.s.done.includes(q.id) && (!q.requires || this.s.done.includes(q.requires)));
  }

  matches(obj, ev, d) {
    const t = obj.target;
    switch (obj.type) {
      case 'catch': {
        if (ev !== 'catch') return 0;
        const f = d.fish;
        if (t === '*') return f.tier !== 'junk' ? 1 : 0;
        if (t === 'night') return d.night && f.tier !== 'junk' ? 1 : 0;
        if (t.startsWith('tier:')) return tierIndex(f.tier) >= tierIndex(t.slice(5)) ? 1 : 0;
        if (t.startsWith('island:')) return d.island === t.slice(7) ? 1 : 0;
        return f.id === t ? 1 : 0;
      }
      case 'sell': {
        if (ev !== 'sell') return 0;
        if (t === '*') return d.count;
        if (t.startsWith('type:')) return ITEMS[d.item]?.type === t.slice(5) ? d.count : 0;
        return d.item === t ? d.count : 0;
      }
      case 'talk':
        return ev === 'talk' && (t === '*' || d.npc === t) ? 1 : 0;
      case 'visit':
        return ev === 'visit' && d.island === t ? 1 : 0;
      case 'defeat':
        return ev === 'defeat' && (t === '*' || d.kind === t || (t === 'pirate' && d.kind === 'blackfin')) ? 1 : 0;
      case 'plant':
        return ev === 'plant' ? 1 : 0;
      case 'harvest':
        return ev === 'harvest' ? d.count ?? 1 : 0;
      case 'cook':
        return ev === 'cook' && (t === '*' || d.recipe === t) ? 1 : 0;
      case 'buy':
        return ev === 'buy' && (t === '*' || d.id === t) ? 1 : 0;
      case 'collect':
        return ev === 'collect' && (t === '*' || d.item === t) ? 1 : 0;
      case 'compete':
        return ev === 'compete' && d.place <= t ? 1 : 0;
      default:
        return 0;
    }
  }

  /** Objectives that check current state rather than events. */
  stateProgress(obj) {
    const g = this.game;
    const s = g.state;
    switch (obj.type) {
      case 'have':
        return Math.min(obj.count, s.inventory[obj.target] || 0);
      case 'level':
        return s.level >= obj.target ? obj.count : 0;
      case 'build':
        return s.house.level >= obj.target ? obj.count : 0;
      case 'own': {
        const [kind, id] = obj.target.split(':');
        if (kind === 'boat') return g.boatTierOf(s.boat) >= g.boatTierOf(id) ? 1 : 0;
        if (kind === 'weapon') return g.ownsWeaponAtLeast(id) ? 1 : 0;
        if (kind === 'cosmetics') return s.cosmetics.length >= Number(id) ? 1 : 0;
        if (kind === 'rod') return s.rods.includes(id) ? 1 : 0;
        return 0;
      }
      default:
        return null;
    }
  }

  onEvent(ev, d) {
    if (!this.game.state) return;
    for (const id of Object.keys(this.s.active)) {
      const obj = this.currentObjective(id);
      if (!obj || obj.type === 'talk') continue;
      const inc = this.matches(obj, ev, d);
      if (inc > 0) {
        this.s.active[id].progress += inc;
        if (this.s.active[id].progress >= (obj.count ?? 1)) this.advance(id);
        else this.game.ui.refreshHud();
      }
    }
    this.refresh();
    this.bountyEvent(ev, d);
  }

  /** Re-check state-based objectives (have/own/level/build). */
  refresh() {
    if (!this.game.state) return;
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 20) {
      changed = false;
      for (const id of Object.keys(this.s.active)) {
        const obj = this.currentObjective(id);
        if (!obj) continue;
        const p = this.stateProgress(obj);
        if (p === null) continue;
        const st = this.s.active[id];
        if (p !== st.progress) {
          st.progress = p;
          this.game.ui.refreshHud();
        }
        if (p >= (obj.count ?? 1) && !obj.consume) {
          this.advance(id);
          changed = true;
        }
      }
    }
  }

  /** "Turn in" have-objectives that consume items (done from the giver's dialogue). */
  canTurnIn(npcId) {
    const res = [];
    for (const id of Object.keys(this.s.active)) {
      const q = QUESTS[id];
      const obj = this.currentObjective(id);
      if (q.giver === npcId && obj?.consume && (this.game.state.inventory[obj.target] || 0) >= obj.count) res.push(id);
    }
    return res;
  }
  turnIn(id) {
    const obj = this.currentObjective(id);
    if (!obj) return;
    this.game.removeItem(obj.target, obj.count);
    this.advance(id);
    this.refresh();
  }

  advance(id) {
    const q = QUESTS[id];
    const st = this.s.active[id];
    if (!st) return;
    st.step += 1;
    st.progress = 0;
    if (st.step >= q.objectives.length) {
      this.complete(id);
    } else {
      this.game.audio.sfx('tick');
      this.game.ui.toast(`✔ ${q.objectives[st.step - 1].text}`, 'quest');
      this.game.ui.refreshHud();
    }
  }

  complete(id) {
    const q = QUESTS[id];
    delete this.s.active[id];
    if (!this.s.done.includes(id)) this.s.done.push(id);
    this.game.ui.banner('Quest Complete!', q.title, '🏅');
    this.game.audio.sfx('questDone');
    this.game.give(q.rewards, { source: 'quest' });
    if (q.main) {
      this.s.main = q.next;
      if (q.next) setTimeout(() => this.start(q.next), 1800);
    }
    this.game.ui.refreshHud();
    this.game.save();
  }

  // ── daily bounties ─────────────────────────────
  refreshBounties(force = false) {
    const g = this.game;
    const s = g.state;
    if (!s) return;
    const day = s.time.day;
    if (!force && s.bounties.day === day && s.bounties.list.length) return;
    const rnd = mulberry32(hashString('bounty' + day + s.created));
    const pool = BOUNTY_TEMPLATES.filter((t) => (!t.minLevel || s.level >= t.minLevel) && (!t.flag || s.flags[t.flag]));
    const list = [];
    const used = new Set();
    while (list.length < 3 && used.size < pool.length) {
      const t = pool[Math.floor(rnd() * pool.length)];
      if (used.has(t)) continue;
      used.add(t);
      const n = t.counts[0] + Math.floor(rnd() * (t.counts[1] - t.counts[0] + 1));
      list.push({ type: t.type, target: t.target, count: n, progress: 0, text: t.text(n), reward: t.reward(n), done: false });
    }
    s.bounties = { day, list };
    if (s.quests.done.includes('m1')) g.ui.toast('📋 New bounties posted on the board!', 'info');
    g.ui.refreshHud();
  }

  bountyEvent(ev, d) {
    const b = this.game.state.bounties;
    for (const bo of b.list) {
      if (bo.done) continue;
      const inc = this.matches(bo, ev, d);
      if (inc > 0) {
        bo.progress = Math.min(bo.count, bo.progress + inc);
        if (bo.progress >= bo.count) {
          bo.done = true;
          this.game.ui.banner('Bounty Complete!', bo.text, '📋');
          this.game.audio.sfx('questDone');
          this.game.give(bo.reward, { source: 'bounty' });
          if (b.list.every((x) => x.done)) {
            this.game.give({ gems: 5, xp: 50 }, { source: 'bounty' });
            this.game.ui.toast('🌟 All bounties done! Bonus 5 gems', 'gold');
          }
        }
        this.game.ui.refreshHud();
      }
    }
  }

  /** Short list for the HUD tracker. */
  tracker() {
    const out = [];
    for (const [id, st] of Object.entries(this.s.active)) {
      const q = QUESTS[id];
      const obj = q.objectives[st.step];
      if (!obj) continue;
      const count = obj.count ?? 1;
      out.push({ id, main: !!q.main, title: q.title, text: obj.text, progress: count > 1 ? `${Math.min(st.progress, count)}/${count}` : '', target: obj.type === 'talk' ? obj.target : null });
    }
    out.sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
    return out;
  }
}

export function fishFromItem(id) {
  return id.startsWith('fish_') ? FISH_BY_ID[id.slice(5)] : null;
}
