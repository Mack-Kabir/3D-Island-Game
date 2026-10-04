import { el, escapeHtml, pick } from '../core/utils.js';
import { ITEMS } from '../data/items.js';
import { HEART_REWARDS } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { rewardText } from './panels.js';
import { SHOPS } from '../data/shops.js';

const GIFT_TYPES = ['fish', 'fruit', 'product', 'collectible', 'treasure', 'material', 'decor'];

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
    return text.replace(/\{name\}/g, this.game.state.name);
  }

  open(npc) {
    const g = this.game;
    if (this.npc) return;
    this.npc = npc;
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
    const pool = (night ? npc.def.greet.night : npc.def.greet.day) || npc.def.greet.day || npc.def.greet.night;
    const lines = [this.fill(pick(pool))];
    const turnIn = g.quests.canTurnIn(npc.id);
    const offers = g.quests.offers(npc.id);
    if (turnIn.length) lines.push('Oh! Did you bring what I asked for? Pick "Hand over" below!');
    else if (offers.length) lines.push(`Say, ${g.state.name}... could you help me with something? Pick "Request: ${offers[0].title}" below.`);
    else {
      // remind the player about this islander's active request
      const mine = Object.keys(g.state.quests.active).map((id) => QUESTS[id]).find((q) => q.giver === npc.id);
      if (mine) {
        const obj = g.quests.currentObjective(mine.id);
        if (obj) lines.push(`How's "${mine.title}" going? Remember: ${obj.text.charAt(0).toLowerCase() + obj.text.slice(1)}.`);
      }
    }
    this.say(lines, () => this.menu());
  }

  close() {
    if (!this.npc) return;
    this.npc.talking = false;
    this.npc = null;
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
            el('button', { class: 'btn small primary', text: `Accept (${rewardText(q.rewards)})`, onclick: () => { this.inMenu = false; g.quests.start(q.id); this.say(['Wonderful! Come back when you\'re done.'], () => this.menu()); } }),
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
    if (def.services?.includes('build')) opt('🔨 Upgrade my home', () => { this.close(); g.ui.openPanel('home', { tab: 'upgrade' }); });
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
    const line = this.fill(pick(npc.def.chat));
    if (r.chatDay !== g.state.time.day) {
      r.chatDay = g.state.time.day;
      this.addPts(npc.id, 3);
    }
    this.say([line], () => this.talkMenu());
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
  return r;
}
