import { el, escapeHtml, pick } from '../core/utils.js';
import { ITEMS } from '../data/items.js';
import { HEART_REWARDS } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { rewardText } from './panels.js';
import { SHOPS } from '../data/shops.js';
import { CHATTER, CONTEXT, REMINDERS } from '../data/chatter.js';
import { FISH_BY_ID, tierIndex } from '../data/fish.js';
import { HOUSES, PETS_BY_ID, RODS_BY_ID } from '../data/gear.js';
import { ISLANDS } from '../data/islands.js';

/** Short stable key for a line, so islanders remember what they've already said. */
function lineKey(line) {
  const str = JSON.stringify(line);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const GIFT_TYPES = ['fish', 'fruit', 'crop', 'animal', 'ingredient', 'product', 'collectible', 'treasure', 'material', 'decor'];

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.host = game.ui.dialogueHost;
    this.npc = null;
    this.pages = [];
    this.typing = false;
  }
  isOpen() {
    return !!this.npc;
  }
  rel(id) {
    const s = this.game.state;
    s.npcs[id] = s.npcs[id] || { pts: 0, chatDay: 0, giftDay: 0, rewards: [], metDay: 0 };
    return s.npcs[id];
  }
  hearts(id) {
    return Math.min(10, Math.floor(this.rel(id).pts / 10));
  }
  fill(text) {
    if (typeof text === 'object') return { you: this.fill(text.you) };
    const c = this.ctx || this.context();
    const vals = { name: this.game.state.name, bestFish: c.bestFish, caught: c.caught, day: c.day, island: c.island, pet: c.pet, house: c.house, houseName: c.houseName, level: c.level, rod: c.rod };
    return text.replace(/\{(\w+)\}/g, (m, k) => (vals[k] ?? m));
  }

  /** What's going on in the player's life — islanders comment on it. */
  context() {
    const g = this.game;
    const s = g.state;
    let best = null;
    for (const id of Object.keys(s.fishdex)) {
      const f = FISH_BY_ID[id];
      if (f && tierIndex(f.tier) >= 3 && (!best || tierIndex(f.tier) > tierIndex(best.tier))) best = f;
    }
    const lvl = s.house?.level ?? 0;
    return {
      rain: g.weather.raining(),
      night: g.time.isNight(),
      hour: Math.floor(g.time.hour()),
      caught: s.stats.caught,
      bestFish: best?.name ?? null,
      level: s.level,
      house: lvl,
      houseName: HOUSES[lvl]?.name ?? 'home',
      boat: g.boatTier() > 0,
      pet: s.pet ? PETS_BY_ID[s.pet]?.name.toLowerCase() : null,
      pirates: s.stats.pirates,
      day: s.time.day,
      hpLow: s.hp < g.combat.maxHp() * 0.4,
      hasRod: !!s.rod,
      rod: RODS_BY_ID[s.rod]?.name ?? 'rod',
      island: ISLANDS[g.world.id]?.name ?? '',
      cooked: s.stats.cooked,
      harvested: s.stats.harvested,
    };
  }

  /** Remarks about the world that fit right now. */
  contextLines() {
    const c = this.ctx;
    return CONTEXT.filter((e) => e.when(c)).flatMap((e) => e.lines);
  }

  /**
   * Pick a line this islander hasn't said recently. Each islander remembers what they've
   * said and only repeats once they've gone through the whole pool.
   */
  fresh(id, pool) {
    if (!pool.length) return null;
    const r = this.rel(id);
    const said = (r.said = r.said || []);
    const keys = pool.map(lineKey);
    let options = pool.filter((_, i) => !said.includes(keys[i]));
    if (!options.length) {
      // start the cycle over (but never repeat the very last thing they said)
      const last = said[said.length - 1];
      r.said = said.filter((k) => !keys.includes(k));
      options = pool.filter((_, i) => keys[i] !== last);
      if (!options.length) options = pool;
    }
    const line = pick(options);
    r.said.push(lineKey(line));
    if (r.said.length > 150) r.said.splice(0, r.said.length - 150);
    return line;
  }
  /** A line (string or short exchange) as dialogue pages. */
  toPages(line) {
    return [].concat(line).map((l) => this.fill(l));
  }

  open(npc) {
    const g = this.game;
    if (this.npc) return;
    this.npc = npc;
    this.ctx = this.context();
    npc.talking = true;
    g.onPanelChange(true, 'dialogue');
    g.audio.sfx('open');
    const r = this.rel(npc.id);
    if (r.metDay !== g.state.time.day) {
      r.metDay = g.state.time.day;
      g.events.emit('talk', { npc: npc.id });
    }
    this.build();
    const story = g.quests.talkLines(npc.id);
    if (story.length) {
      const q = story[0];
      this.say(q.lines.map((l) => this.fill(l)), () => {
        g.quests.completeTalk(q.quest);
        const got = q.give ? rewardText(normalizeGive(q.give)) : '';
        if (got) this.say([`(Received: ${got})`], () => this.menu());
        else this.menu();
      });
      return;
    }
    const night = g.time.isNight();
    const extra = CHATTER[npc.id] || {};
    const dayPool = [...(npc.def.greet.day || []), ...(extra.day || [])];
    const nightPool = [...(npc.def.greet.night || []), ...(extra.night || [])];
    const pool = (night ? nightPool : dayPool).length ? (night ? nightPool : dayPool) : dayPool.length ? dayPool : nightPool;
    const lines = this.toPages(this.fresh(npc.id, pool));
    const turnIn = g.quests.canTurnIn(npc.id);
    const offers = g.quests.offers(npc.id);
    if (turnIn.length) lines.push('Oh! Did you bring what I asked for? Pick "Hand over" below!');
    else if (offers.length) lines.push(`Say, ${g.state.name}... could you help me with something? Pick "Request: ${offers[0].title}" below.`);
    else {
      // remind about this islander's request at most once a day; otherwise maybe a remark
      const mine = Object.keys(g.state.quests.active).map((id) => QUESTS[id]).find((q) => q.giver === npc.id);
      const obj = mine && g.quests.currentObjective(mine.id);
      const r = this.rel(npc.id);
      if (obj && r.remindDay !== g.state.time.day) {
        r.remindDay = g.state.time.day;
        const text = this.fresh(npc.id, REMINDERS);
        lines.push(text.replace('{title}', mine.title).replace('{obj}', obj.text.charAt(0).toLowerCase() + obj.text.slice(1)));
      } else if (Math.random() < 0.5) {
        const remark = this.fresh(npc.id, this.contextLines());
        if (remark) lines.push(...this.toPages(remark));
      }
    }
    this.say(lines, () => this.menu());
  }

  close() {
    if (!this.npc) return;
    this.npc.talking = false;
    this.npc = null;
    this.inMenu = false;
    this.pages = [];
    this.after = null;
    clearInterval(this.timer);
    this.host.innerHTML = '';
    this.host.classList.remove('open');
    this.game.audio.sfx('close');
    this.game.onPanelChange(false);
  }

  build() {
    const g = this.game;
    const npc = this.npc;
    const hearts = this.hearts(npc.id);
    const portrait = g.portraitOf(npc);
    this.host.innerHTML = '';
    this.host.classList.add('open');
    this.textEl = el('p', { class: 'dlg-text', 'aria-live': 'polite' });
    this.optsEl = el('div', { class: 'dlg-opts', role: 'group', 'aria-label': 'Responses' });
    this.box = el('div', { class: 'dialogue', role: 'dialog', 'aria-label': `Talking to ${npc.def.name}` }, [
      el('div', { class: 'dlg-portrait' }, [portrait ? el('img', { src: portrait, alt: '' }) : el('span', { text: '🙂' })]),
      el('div', { class: 'dlg-main' }, [
        el('div', { class: 'dlg-name' }, [
          el('b', { text: npc.def.name }),
          el('span', { class: 'dlg-title', text: npc.def.title }),
          el('span', { class: 'hearts', 'aria-label': `${hearts} of 10 hearts`, html: '♥'.repeat(hearts) + '<i>' + '♥'.repeat(10 - hearts) + '</i>' }),
        ]),
        this.textEl,
        this.optsEl,
      ]),
      el('button', { class: 'close dlg-close', 'aria-label': 'End conversation', onclick: () => this.close(), html: '✕' }),
    ]);
    this.box.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      this.advance();
    });
    this.host.append(this.box);
  }

  say(lines, then) {
    this.inMenu = false;
    this.pages = [...lines];
    this.after = then;
    this.nextPage();
  }
  nextPage() {
    const text = this.pages.shift();
    if (text === undefined) {
      const f = this.after;
      this.after = null;
      f?.();
      return;
    }
    this.optsEl.innerHTML = '';
    if (typeof text === 'object') {
      // the player's reply — shown as a speech choice to click / press E
      clearInterval(this.timer);
      this.typing = false;
      this.optsEl.append(el('button', { class: 'btn small reply', html: `<b>${escapeHtml(this.game.state.name)}:</b> “${escapeHtml(text.you)}”`, onclick: () => this.advance() }));
      requestAnimationFrame(() => this.optsEl.querySelector('button')?.focus({ preventScroll: true }));
      return;
    }
    this.optsEl.append(el('button', { class: 'btn small ghost', text: this.pages.length ? 'Next ▸' : 'Continue ▸', onclick: () => this.advance() }));
    this.type(text);
  }
  type(text) {
    clearInterval(this.timer);
    this.full = text;
    this.typing = true;
    let i = 0;
    this.textEl.textContent = '';
    const instant = this.game.settings.reduceMotion;
    if (instant) {
      this.textEl.textContent = text;
      this.typing = false;
      return;
    }
    this.timer = setInterval(() => {
      i += 2;
      this.textEl.textContent = text.slice(0, i);
      if (i % 6 === 0) this.game.audio.sfx('type');
      if (i >= text.length) {
        clearInterval(this.timer);
        this.typing = false;
      }
    }, 22);
  }
  advance() {
    if (this.typing) {
      clearInterval(this.timer);
      this.textEl.textContent = this.full;
      this.typing = false;
      return;
    }
    if (this.inMenu) return;
    this.nextPage();
  }
  handleKey(e) {
    if (e.code === 'Escape') {
      this.close();
      return true;
    }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      if (document.activeElement?.closest?.('.dlg-opts') && this.inMenu && e.code !== 'KeyE') return false;
      if (this.inMenu) return true;
      this.advance();
      return true;
    }
    return false;
  }

  menu() {
    const g = this.game;
    const npc = this.npc;
    if (!npc) return;
    this.inMenu = true;
    const def = npc.def;
    const o = this.optsEl;
    o.innerHTML = '';
    const opt = (html, fn, cls = '', tip = '') => {
      const b = el('button', { class: `btn small ${cls}`, html, 'data-tip': tip || undefined, onclick: () => { g.audio.sfx('click'); this.inMenu = false; fn(); } });
      o.append(b);
      return b;
    };
    for (const qid of g.quests.canTurnIn(npc.id)) {
      opt(`📦 Hand over: ${escapeHtml(QUESTS[qid].title)}`, () => {
        g.quests.turnIn(qid);
        this.say(['You found them all! Thank you so much!'], () => this.menu());
      }, 'primary');
    }
    for (const q of g.quests.offers(npc.id)) {
      opt(`❔ Request: ${escapeHtml(q.title)}`, () => {
        this.say([this.fill(q.offer)], () => {
          this.inMenu = true;
          o.innerHTML = '';
          o.append(
            el('button', { class: 'btn small primary', text: `Accept (${rewardText(q.rewards)})`, onclick: () => {
              this.inMenu = false;
              g.quests.start(q.id);
              // if the first step is listening to this islander, tell it right away
              const story = g.quests.talkLines(this.npc.id).find((x) => x.quest === q.id);
              if (story) {
                this.say(story.lines.map((l) => this.fill(l)), () => {
                  g.quests.completeTalk(q.id);
                  const got = story.give ? rewardText(normalizeGive(story.give)) : '';
                  if (got) this.say([`(Received: ${got})`], () => this.menu());
                  else this.menu();
                });
              } else this.say(['Wonderful! Come back when you\'re done.'], () => this.menu());
            } }),
            el('button', { class: 'btn small', text: 'Not now', onclick: () => { this.inMenu = false; this.menu(); } }),
          );
          o.querySelector('button')?.focus();
        });
      }, 'primary');
    }
    if (def.shop) {
      opt('🛒 Shop', () => { const shop = def.shop; this.close(); g.ui.openPanel('shop', { shop, tab: 'buy' }); }, 'primary', 'Buy things from this islander');
      if (SHOPS[def.shop]?.sells.length) opt('🪙 Sell items', () => { const shop = def.shop; this.close(); g.ui.openPanel('shop', { shop, tab: 'sell' }); }, 'primary', `Sells: ${SHOPS[def.shop].sells.join(', ')}`);
    }
    if (def.services?.includes('travel')) opt('⛵ Set sail', () => { this.close(); g.openTravel(true); });
    if (def.services?.includes('build')) {
      opt('🔨 Upgrade my home', () => { this.close(); g.ui.openPanel('home', { tab: 'upgrade' }); });
      opt('🐔 Farm buildings', () => { this.close(); g.ui.openPanel('farmbuild'); });
    }
    if (def.services?.includes('tournament')) opt('🏆 Tournament', () => { this.close(); g.ui.openPanel('tournament'); }, 'primary');
    opt('💬 Talk', () => this.talkMenu());
    opt('💡 What should I do?', () => this.advice());
    opt('🎁 Give gift', () => this.gift());
    opt('👋 Bye', () => this.close(), 'ghost');
    requestAnimationFrame(() => o.querySelector('button')?.focus({ preventScroll: true }));
  }

  talkMenu() {
    const g = this.game;
    const npc = this.npc;
    this.inMenu = true;
    const o = this.optsEl;
    o.innerHTML = '';
    const opt = (html, fn, cls = '') => o.append(el('button', { class: `btn small ${cls}`, html, onclick: () => { g.audio.sfx('click'); this.inMenu = false; fn(); } }));
    for (const t of npc.def.topics || []) opt(`❓ ${escapeHtml(t.q)}`, () => this.say([{ you: t.q }, ...t.a.map((l) => this.fill(l))], () => this.talkMenu()));
    opt('😊 Small talk', () => this.chat());
    opt('◂ Back', () => this.menu(), 'ghost');
    requestAnimationFrame(() => o.querySelector('button')?.focus({ preventScroll: true }));
  }

  /** The islander explains your current objective in plain words. */
  advice() {
    const g = this.game;
    const list = g.quests.tracker();
    const q = list[0];
    if (!q) {
      this.say(['You\'re doing great! Try catching rarer fish, cooking fancy meals, or upgrading your home. Check the bounty board in the square for daily jobs!'], () => this.menu());
      return;
    }
    const lines = [{ you: 'What should I do next?' }, `Right now you should: ${q.text}.`];
    if (q.hint) lines.push(q.hint);
    lines.push('Follow the yellow arrow on your screen — it points the way. Press J to see all your quests.');
    this.say(lines, () => this.menu());
  }

  chat() {
    const g = this.game;
    const npc = this.npc;
    const r = this.rel(npc.id);
    const extra = CHATTER[npc.id] || {};
    const pool = [...(npc.def.chat || []), ...(extra.chat || []), ...(this.hearts(npc.id) >= 4 ? extra.close || [] : []), ...this.contextLines()];
    const line = this.fresh(npc.id, pool);
    if (r.chatDay !== g.state.time.day) {
      r.chatDay = g.state.time.day;
      this.addPts(npc.id, 3);
    }
    this.say(this.toPages(line), () => this.talkMenu());
  }

  gift() {
    const g = this.game;
    const npc = this.npc;
    const r = this.rel(npc.id);
    if (r.giftDay === g.state.time.day) {
      this.say(['You already gave me something today. You\'re too kind!'], () => this.menu());
      return;
    }
    const items = Object.keys(g.state.inventory).filter((id) => g.state.inventory[id] > 0 && GIFT_TYPES.includes(ITEMS[id]?.type));
    if (!items.length) {
      this.say(['(You have nothing to give right now.)'], () => this.menu());
      return;
    }
    g.ui.openPicker({
      title: `Gift for ${npc.def.name}`,
      items,
      onPick: (id) => {
        g.removeItem(id, 1, true);
        r.giftDay = g.state.time.day;
        g.events.emit('gift', { npc: npc.id, id });
        const love = npc.def.loves.includes(id);
        const like = npc.def.likes.includes(id);
        const pts = love ? 25 : like ? 12 : 4;
        this.addPts(npc.id, pts);
        g.audio.sfx(love ? 'catchRare' : 'pickup');
        const line = love ? `A ${ITEMS[id].name}?! This is my absolute favourite! Thank you!!` : like ? `Oh, a ${ITEMS[id].name}! I really like these. Thanks!` : `A ${ITEMS[id].name}. That's... thoughtful. Thanks!`;
        this.build();
        this.say([line], () => this.menu());
      },
    });
  }

  addPts(id, n) {
    const g = this.game;
    const r = this.rel(id);
    const before = this.hearts(id);
    r.pts = Math.min(100, r.pts + n);
    const after = this.hearts(id);
    if (after > before) {
      g.ui.toast(`❤ ${this.npc?.def.name ?? 'Friend'} — ${after} hearts!`, 'good');
      for (const lvl of Object.keys(HEART_REWARDS).map(Number)) {
        if (after >= lvl && !r.rewards.includes(lvl)) {
          r.rewards.push(lvl);
          const rw = HEART_REWARDS[lvl];
          g.ui.banner('Friendship Gift!', `${this.npc?.def.name} gave you ${rw.text}`, '💝');
          g.give({ coins: rw.coins, gems: rw.gems });
        }
      }
      if (this.npc) this.build();
    }
  }
}

function normalizeGive(give) {
  const r = {};
  if (give.coins) r.coins = give.coins;
  if (give.items) r.items = give.items;
  if (give.rods) r.rods = give.rods;
  if (give.weapons) r.items = { ...(r.items || {}) };
  if (give.buildings) r.buildings = give.buildings;
  if (give.animals) r.animals = give.animals;
  return r;
}
