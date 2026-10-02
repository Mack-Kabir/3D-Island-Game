import { el, escapeHtml, formatNum } from '../core/utils.js';
import { ITEMS, RECIPES, CROPS } from '../data/items.js';
import { FISH, TIERS, TIER_ORDER, FISH_BY_ID } from '../data/fish.js';
import { RODS, RODS_BY_ID, BAITS, WEAPONS, WEAPONS_BY_ID, BOATS, BOATS_BY_ID, PETS, PETS_BY_ID, HOUSES, DECOR } from '../data/gear.js';
import { COSMETICS, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS } from '../data/cosmetics.js';
import { SHOPS } from '../data/shops.js';
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { ISLANDS, ISLAND_ORDER } from '../data/islands.js';
import { LEAGUES } from '../systems/competition.js';
import { itemIconHTML, fishSVG, rarityBadge } from './icons.js';

const h = el;
const btn = (text, onclick, cls = '', disabled = false, attrs = {}) => h('button', { class: `btn ${cls}`, onclick, disabled, ...attrs, html: text });
const price = (coins, gems) => [coins ? `<span class="price coin">🪙 ${formatNum(coins)}</span>` : '', gems ? `<span class="price gem">💎 ${formatNum(gems)}</span>` : '', !coins && !gems ? '<span class="price free">Free</span>' : ''].join('');
const empty = (text, icon = '🌊') => h('div', { class: 'empty' }, [h('div', { class: 'empty-icon', text: icon }), h('p', { text })]);
const section = (title, ...kids) => h('section', { class: 'sec' }, [title ? h('h3', { text: title }) : null, ...kids]);

const TYPE_ORDER = ['fish', 'fruit', 'product', 'seed', 'bait', 'material', 'collectible', 'treasure', 'decor', 'special', 'tool', 'trophy'];
const TYPE_LABEL = { fish: 'Fish', fruit: 'Fruit', product: 'Food', seed: 'Seeds', bait: 'Bait', material: 'Materials', collectible: 'Collectibles', treasure: 'Treasure', decor: 'Decor', special: 'Special', tool: 'Tools', trophy: 'Trophies' };

function sortedInventory(state, filter) {
  return Object.entries(state.inventory)
    .filter(([id, n]) => n > 0 && ITEMS[id] && (!filter || filter(ITEMS[id], id)))
    .sort((a, b) => {
      const ia = ITEMS[a[0]];
      const ib = ITEMS[b[0]];
      const t = TYPE_ORDER.indexOf(ia.type) - TYPE_ORDER.indexOf(ib.type);
      if (t) return t;
      if (ia.type === 'fish') return TIER_ORDER.indexOf(ib.tier) - TIER_ORDER.indexOf(ia.tier);
      return ia.name.localeCompare(ib.name);
    });
}

// ════════════════════════════════════════════════════════════
export const PANELS = {
  bag: {
    hotkey: 'KeyI',
    wide: true,
    render(ui, opts, p) {
      const g = ui.game;
      const s = g.state;
      p.filter = p.filter || 'all';
      const discovered = Object.keys(s.fishdex).length;
      return {
        title: 'Bag',
        icon: '🎒',
        tabs: [
          { id: 'items', label: 'Items', icon: '📦' },
          { id: 'gear', label: 'Gear', icon: '🎣' },
          { id: 'fishdex', label: `Fishdex ${discovered}/${FISH.length}`, icon: '🐟' },
          { id: 'stats', label: 'Stats', icon: '📊' },
        ],
        body(tab) {
          if (tab === 'gear') return gearTab(ui);
          if (tab === 'fishdex') return fishdexTab(ui);
          if (tab === 'stats') return statsTab(ui);
          return itemsTab(ui, p);
        },
      };
    },
  },

  quests: {
    hotkey: 'KeyJ',
    wide: true,
    render(ui) {
      const g = ui.game;
      const s = g.state;
      return {
        title: 'Quest Log',
        icon: '📜',
        tabs: [
          { id: 'story', label: 'Story', icon: '★' },
          { id: 'side', label: 'Side Quests', icon: '❖' },
          { id: 'bounties', label: 'Daily Bounties', icon: '📋', badge: s.bounties.list.filter((b) => !b.done).length || '' },
        ],
        body(tab) {
          const wrap = h('div', { class: 'quest-list' });
          if (tab === 'bounties') {
            wrap.append(h('p', { class: 'muted', text: `New bounties are posted each morning on the Palmora board. Day ${s.time.day}. Finish all three for a bonus!` }));
            for (const b of s.bounties.list) {
              const pct = Math.round((b.progress / b.count) * 100);
              wrap.append(
                h('div', { class: `qcard ${b.done ? 'done' : ''}` }, [
                  h('div', { class: 'qhead' }, [h('b', { text: b.text }), h('span', { class: 'qreward', html: rewardText(b.reward) })]),
                  h('div', { class: 'bar small', role: 'meter', 'aria-valuenow': b.progress, 'aria-valuemax': b.count }, [h('i', { style: { width: pct + '%' } }), h('span', { text: b.done ? '✔ Complete' : `${b.progress} / ${b.count}` })]),
                ]),
              );
            }
            if (!s.bounties.list.length) wrap.append(empty('No bounties yet. Check back tomorrow!'));
            return wrap;
          }
          const main = tab === 'story';
          const active = Object.entries(s.quests.active).filter(([id]) => !!QUESTS[id].main === main);
          for (const [id, st] of active) wrap.append(questCard(g, QUESTS[id], st));
          if (!main) {
            const offers = Object.values(QUESTS).filter((q) => !q.main && !s.quests.active[q.id] && !s.quests.done.includes(q.id) && (!q.requires || s.quests.done.includes(q.requires)));
            if (offers.length) {
              wrap.append(h('h3', { text: 'Rumours' }));
              for (const q of offers) wrap.append(h('div', { class: 'qcard rumour', html: `<b>${escapeHtml(q.title)}</b><p>${escapeHtml(NPCS[q.giver].name)} (${escapeHtml(ISLANDS[NPCS[q.giver].island].name)}) may need help. Look for the <span class="qmark inline">?</span> above their head.</p>` }));
            }
          }
          if (!active.length && main && !s.quests.main) wrap.append(empty('You finished the story! Keep fishing for legends.', '🏆'));
          else if (!active.length && !main) wrap.append(empty('No side quests active. Islanders with a ? have requests.', '❔'));
          const done = s.quests.done.filter((id) => !!QUESTS[id]?.main === main);
          if (done.length) {
            wrap.append(h('h3', { text: 'Completed' }));
            wrap.append(h('ul', { class: 'done-list' }, done.map((id) => h('li', { text: '✔ ' + QUESTS[id].title }))));
          }
          return wrap;
        },
      };
    },
  },

  map: {
    hotkey: 'KeyM',
    wide: true,
    render(ui, opts) {
      const g = ui.game;
      return {
        title: opts.travel ? 'Set Sail' : 'Map',
        icon: opts.travel ? '⛵' : '🗺️',
        tabs: opts.travel ? [{ id: 'chart', label: 'Sea Chart', icon: '🧭' }] : [{ id: 'island', label: g.world.def.name, icon: '🏝️' }, { id: 'chart', label: 'Sea Chart', icon: '🧭' }],
        body(tab) {
          if (tab === 'chart') return seaChart(ui, opts.travel);
          return islandMap(ui);
        },
      };
    },
  },

  wardrobe: {
    hotkey: 'KeyC',
    side: true,
    onOpen(ui) {
      ui.game.setCameraMode('portrait');
    },
    onClose(ui) {
      ui.game.setCameraMode('follow');
      ui.game.refreshPortrait();
    },
    render(ui, opts, p) {
      const g = ui.game;
      return {
        title: 'Wardrobe',
        icon: '👕',
        tabs: [
          { id: 'body', label: 'Body', icon: '🙂' },
          { id: 'top', label: 'Tops', icon: '👕' },
          { id: 'bottom', label: 'Bottoms', icon: '👖' },
          { id: 'hat', label: 'Hats', icon: '👒' },
          { id: 'acc', label: 'Extras', icon: '🕶️' },
          { id: 'pet', label: 'Pets', icon: '🐾' },
        ],
        body(tab) {
          if (tab === 'body') return lookEditor(ui, g.state.look, (look) => g.setLook(look), { gender: true });
          if (tab === 'pet') return petsTab(ui);
          return cosmeticGrid(ui, tab);
        },
        footer: h('p', { class: 'muted small', text: 'Drag the scene to spin around. New clothes are sold at Luna\'s Boutique and by Moth at night.' }),
      };
    },
  },

  shop: {
    wide: true,
    render(ui, opts, p) {
      const g = ui.game;
      const shop = SHOPS[opts.shop];
      const tabs = [{ id: 'buy', label: 'Buy', icon: '🛒' }];
      if (shop.sells.length) tabs.push({ id: 'sell', label: 'Sell', icon: '🪙' });
      return {
        title: shop.name,
        icon: '🏪',
        tabs,
        headExtra: h('div', { class: 'head-money', html: `🪙 <b>${formatNum(g.state.coins)}</b> &nbsp; 💎 <b>${formatNum(g.state.gems)}</b>` }),
        body(tab) {
          return tab === 'sell' ? sellTab(ui, shop) : buyTab(ui, shop);
        },
      };
    },
  },

  home: {
    wide: true,
    render(ui, opts) {
      const g = ui.game;
      const s = g.state;
      const house = HOUSES[s.house.level];
      return {
        title: house.name,
        icon: '🏠',
        tabs: [
          { id: 'home', label: 'Home', icon: '🛏️' },
          { id: 'upgrade', label: 'Upgrade', icon: '🔨' },
          { id: 'decor', label: 'Decorate', icon: '🌺' },
        ],
        body(tab) {
          if (tab === 'upgrade') return upgradeTab(ui);
          if (tab === 'decor') return decorTab(ui);
          const atHome = g.world?.id === 'palmora' && g.home.door && g.player.pos.distanceTo(g.home.door) < 6;
          const night = g.time.isNight();
          return h('div', { class: 'home-tab' }, [
            h('p', { text: house.desc }),
            h('div', { class: 'home-actions' }, [
              h('div', { class: 'card' }, [
                h('div', { class: 'card-icon', text: '🛏️' }),
                h('b', { text: 'Sleep' }),
                h('p', { class: 'muted', text: g.settings.clock === 'real' ? 'Real-time clock is on: resting heals you, but time follows your real clock.' : night ? 'Sleep until 7:00 AM. Restores health and saves.' : 'Take a nap until morning. Restores health and saves.' }),
                btn(g.settings.clock === 'real' ? 'Rest' : 'Sleep', () => {
                  ui.closePanel();
                  g.sleep();
                }, 'primary', !atHome),
              ]),
              h('div', { class: 'card' }, [h('div', { class: 'card-icon', text: '👕' }), h('b', { text: 'Wardrobe' }), h('p', { class: 'muted', text: 'Change outfits and pets.' }), btn('Open', () => ui.openPanel('wardrobe'))]),
              h('div', { class: 'card' }, [h('div', { class: 'card-icon', text: '🍳' }), h('b', { text: 'Cook' }), h('p', { class: 'muted', text: 'Turn fish and fruit into valuable food.' }), btn('Cook', () => ui.openPanel('cook'), '', !atHome)]),
              h('div', { class: 'card' }, [h('div', { class: 'card-icon', text: '💾' }), h('b', { text: 'Save' }), h('p', { class: 'muted', text: 'The game also autosaves.' }), btn('Save now', () => { g.save(true); })]),
            ]),
            !atHome ? h('p', { class: 'muted small', text: 'Sleeping and cooking are done at your home on Palmora.' }) : null,
          ]);
        },
      };
    },
  },

  cook: {
    wide: true,
    render(ui) {
      const g = ui.game;
      return {
        title: 'Campfire Cooking',
        icon: '🍳',
        body() {
          const wrap = h('div', { class: 'recipe-list' });
          for (const r of RECIPES) {
            const out = ITEMS[r.out];
            const locked = g.state.level < r.level;
            const parts = Object.entries(r.inputs).map(([k, n]) => {
              const have = g.ingredientCount(k);
              const name = k === 'anyFish' ? 'Any fish' : ITEMS[k === 'seaweed' ? 'fish_seaweed' : k].name;
              const icon = k === 'anyFish' ? '🐟' : k === 'seaweed' ? '🌿' : ITEMS[k].icon;
              return `<span class="ing ${have >= n ? 'ok' : 'no'}">${icon} ${escapeHtml(name)} <b>${Math.min(have, n)}/${n}</b></span>`;
            });
            const can = !locked && g.canCook(r);
            wrap.append(
              h('div', { class: `recipe ${locked ? 'locked' : ''}` }, [
                h('div', { class: 'recipe-out', html: itemIconHTML(r.out, 46) }),
                h('div', { class: 'recipe-info' }, [h('b', { text: out.name }), h('div', { class: 'ings', html: parts.join('') }), h('div', { class: 'muted small', html: `Sells for 🪙 ${out.sell} · Heals ❤ ${out.heal}` })]),
                locked ? h('span', { class: 'lock', text: `🔒 Lv ${r.level}` }) : btn('Cook', () => { g.cook(r.id); ui.refreshPanel(); }, can ? 'primary' : '', !can),
              ]),
            );
          }
          return wrap;
        },
      };
    },
  },

  tournament: {
    wide: true,
    render(ui) {
      const g = ui.game;
      const s = g.state;
      return {
        title: 'Coralia Fishing Tournament',
        icon: '🏆',
        body() {
          const wrap = h('div', { class: 'league-list' });
          wrap.append(h('p', { text: '3 minutes. 3 rivals. Score points for every fish — rarer and heavier fish score much more. Finish in the top 3 to win prizes!' }));
          if (!g.competition.available()) wrap.append(h('p', { class: 'warnline', text: '🌙 Tournaments only run between 7 AM and 7 PM.' }));
          for (const L of LEAGUES) {
            const locked = s.level < L.level;
            wrap.append(
              h('div', { class: `league ${locked ? 'locked' : ''}` }, [
                h('div', { class: 'league-medal', text: L.id === 'gold' ? '🥇' : L.id === 'silver' ? '🥈' : '🥉' }),
                h('div', { class: 'league-info' }, [
                  h('b', { text: L.name }),
                  h('div', { class: 'muted small', html: `Entry 🪙 ${L.fee} · 1st: ${rewardText(L.prizes[0])}` }),
                  h('div', { class: 'muted small', text: `Best score: ${s.tournament.best[L.id] || 0} · Wins: ${s.tournament.wins[L.id] || 0}` }),
                ]),
                locked ? h('span', { class: 'lock', text: `🔒 Lv ${L.level}` }) : btn('Enter', () => { ui.closePanel(); g.competition.start(L.id); }, 'primary', !g.competition.available() || !!g.competition.active),
              ]),
            );
          }
          return wrap;
        },
      };
    },
  },

  pause: {
    hotkey: 'Escape',
    render(ui) {
      const g = ui.game;
      return {
        title: 'Paused',
        icon: '⏸️',
        body() {
          return h('div', { class: 'pause-menu' }, [
            btn('▶ Resume', () => ui.closePanel(), 'primary big'),
            btn('⚙️ Settings', () => ui.openPanel('settings'), 'big'),
            btn('❔ How to play', () => ui.openPanel('help'), 'big'),
            btn('💾 Save game', () => g.save(true), 'big'),
            btn('🏠 Save & quit to title', () => { ui.closePanel(); g.quitToTitle(); }, 'big ghost'),
          ]);
        },
      };
    },
  },

  settings: {
    wide: true,
    render(ui) {
      const g = ui.game;
      const st = g.settings;
      const set = (k, v) => {
        st[k] = v;
        g.applySettings();
        ui.refreshPanel();
      };
      const slider = (k, label) =>
        h('label', { class: 'setting' }, [
          h('span', { text: label }),
          h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[k], 'aria-label': label, oninput: (e) => { st[k] = Number(e.target.value); g.applySettings(); } }),
        ]);
      const toggle = (k, label, desc) =>
        h('label', { class: 'setting toggle' }, [
          h('span', {}, [h('b', { text: label }), desc ? h('small', { text: desc }) : null]),
          h('input', { type: 'checkbox', checked: !!st[k], role: 'switch', onchange: (e) => set(k, e.target.checked) }),
        ]);
      const choice = (k, label, options) =>
        h('div', { class: 'setting' }, [
          h('span', { text: label }),
          h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label }, options.map(([v, l]) => h('button', { class: `segb ${st[k] === v ? 'on' : ''}`, role: 'radio', 'aria-checked': st[k] === v ? 'true' : 'false', onclick: () => set(k, v), text: l }))),
        ]);
      return {
        title: 'Settings',
        icon: '⚙️',
        tabs: [
          { id: 'audio', label: 'Audio', icon: '🔊' },
          { id: 'access', label: 'Accessibility', icon: '♿' },
          { id: 'game', label: 'Game', icon: '🎮' },
        ],
        body(tab) {
          if (tab === 'access')
            return h('div', { class: 'settings' }, [
              choice('textSize', 'Text & UI size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Huge']]),
              toggle('highContrast', 'High contrast UI', 'Stronger borders and solid backgrounds'),
              toggle('reduceMotion', 'Reduce motion', 'Calmer camera and fewer animations'),
              toggle('hints', 'Show control hints', 'Key reminders on the HUD'),
            ]);
          if (tab === 'game')
            return h('div', { class: 'settings' }, [
              choice('clock', 'Day & night clock', [['game', 'Game time (24 min days)'], ['real', 'Real-world time']]),
              h('p', { class: 'muted small', text: 'Night is always 7 PM – 7 AM. "Real-world time" follows your device\'s clock.' }),
              toggle('clock24', '24-hour clock'),
              choice('quality', 'Graphics', [['low', 'Fast'], ['high', 'Pretty']]),
              h('label', { class: 'setting' }, [h('span', { text: 'Camera sensitivity' }), h('input', { type: 'range', min: 0.3, max: 2, step: 0.1, value: st.sensitivity, oninput: (e) => { st.sensitivity = Number(e.target.value); g.applySettings(); } })]),
              toggle('invertY', 'Invert camera Y'),
            ]);
          return h('div', { class: 'settings' }, [slider('master', 'Master volume'), slider('music', 'Music'), slider('sfx', 'Sound effects'), slider('ambient', 'Ambience (waves, birds, rain)')]);
        },
      };
    },
  },

  help: {
    wide: true,
    render() {
      return {
        title: 'How to Play',
        icon: '❔',
        body() {
          return h('div', { class: 'help' }, [
            section('Controls',
              h('div', { class: 'keys-grid', html: [
                ['WASD / Arrows', 'Move'], ['Shift', 'Run'], ['Space', 'Jump (dodges attacks!)'], ['E', 'Talk · fish · pick · plant · interact'], ['F / click', 'Attack'],
                ['Drag mouse', 'Rotate camera'], ['Wheel', 'Zoom'], ['I / Tab', 'Bag'], ['J', 'Quests'], ['M', 'Map'], ['C', 'Wardrobe'], ['Esc', 'Menu / close'],
              ].map(([k, v]) => `<kbd>${k}</kbd><span>${v}</span>`).join('') }),
            ),
            section('Fishing', h('ol', {}, [
              h('li', { text: 'Face the water and press E to cast.' }),
              h('li', { text: 'Wait for the "!" and press E quickly to hook the fish.' }),
              h('li', { text: 'Hold Space / E / mouse to lift the green zone. Keep the fish inside it to fill the meter.' }),
              h('li', { text: 'Better rods = bigger zone + more luck. Bait speeds up bites. Some fish only appear at night, in rain or on certain islands.' }),
            ])),
            section('Island life', h('ul', {}, [
              h('li', { text: 'Sell fish to Marina, fruit & food to Coco. Coins buy gear, boats, clothes and house upgrades.' }),
              h('li', { text: 'Gems come from rare catches, treasure, quests, tournaments and bounties.' }),
              h('li', { text: 'Farm at your homestead: plant, water daily, harvest. Trees fruit forever.' }),
              h('li', { text: 'Cook at your campfire — food sells for more and heals you.' }),
              h('li', { text: 'Night (7 PM – 7 AM): rare fish, Moth the night merchant… and pirate raids.' }),
              h('li', { text: 'Walk over shells, driftwood and stones to collect them. Dig X marks with a shovel.' }),
            ])),
          ]);
        },
      };
    },
  },
};

// ════════════════════════════════════════════════════════════
//  Bag tabs
// ════════════════════════════════════════════════════════════
function itemsTab(ui, p) {
  const g = ui.game;
  const s = g.state;
  const filters = [['all', 'All'], ['fish', 'Fish'], ['fruit', 'Fruit & Food'], ['seed', 'Seeds'], ['material', 'Materials'], ['other', 'Other']];
  const match = (it) => {
    switch (p.filter) {
      case 'all': return true;
      case 'fish': return it.type === 'fish';
      case 'fruit': return it.type === 'fruit' || it.type === 'product';
      case 'seed': return it.type === 'seed' || it.type === 'bait';
      case 'material': return it.type === 'material' || it.type === 'collectible';
      default: return !['fish', 'fruit', 'product', 'seed', 'bait', 'material', 'collectible'].includes(it.type);
    }
  };
  const list = sortedInventory(s, match);
  const wrap = h('div', { class: 'bag' });
  wrap.append(h('div', { class: 'chips', role: 'toolbar', 'aria-label': 'Filter items' }, filters.map(([id, label]) => h('button', { class: `chip ${p.filter === id ? 'on' : ''}`, 'aria-pressed': p.filter === id ? 'true' : 'false', onclick: () => { p.filter = id; p.sel = null; ui.renderPanel(); }, text: label }))));
  const grid = h('div', { class: 'grid' });
  if (!list.length) grid.append(empty('Nothing here yet. Go explore!', '🧺'));
  for (const [id, n] of list) {
    const it = ITEMS[id];
    const tier = it.type === 'fish' ? TIERS[it.tier] : null;
    grid.append(
      h('button', {
        class: `slot ${p.sel === id ? 'sel' : ''}`,
        style: tier ? { '--tier': tier.color } : {},
        'aria-label': `${it.name}, ${n}`,
        onclick: () => { p.sel = id; ui.refreshPanel(); },
        html: `${itemIconHTML(id, 44)}<span class="count">${n}</span>${tier ? `<span class="tier-dot" title="${tier.name}">${tier.icon}</span>` : ''}`,
      }),
    );
  }
  wrap.append(grid);
  const sel = p.sel && s.inventory[p.sel] > 0 ? p.sel : null;
  if (sel) {
    const it = ITEMS[sel];
    const actions = [];
    if (it.heal) actions.push(btn(`Eat (+${it.heal} ❤)`, () => { g.useItem(sel); ui.refreshPanel(); }, 'primary'));
    if (it.use === 'bottle') actions.push(btn('Open bottle', () => { g.useItem(sel); ui.refreshPanel(); }, 'primary'));
    if (it.type === 'decor') actions.push(btn('Place at home', () => g.home.startPlacing(it.decor), 'primary'));
    if (it.type === 'bait') actions.push(btn(s.bait === sel ? 'Equipped ✓' : 'Use this bait', () => { s.bait = sel; ui.refreshHud(); ui.refreshPanel(); }, s.bait === sel ? '' : 'primary', s.bait === sel));
    if (it.type === 'seed') actions.push(h('span', { class: 'muted small', text: 'Plant it at your homestead soil plots.' }));
    wrap.append(
      h('div', { class: 'detail' }, [
        h('div', { class: 'detail-icon', html: itemIconHTML(sel, 80) }),
        h('div', { class: 'detail-info' }, [
          h('h3', { text: it.name }),
          it.type === 'fish' ? h('div', { html: rarityBadge(it.tier) }) : h('div', { class: 'muted small', text: TYPE_LABEL[it.type] }),
          h('p', { text: it.desc || '' }),
          h('div', { class: 'muted small', html: `Owned: <b>${s.inventory[sel]}</b>${it.sell ? ` · Sells for 🪙 <b>${it.sell}</b>` : ''}` }),
          h('div', { class: 'row' }, actions),
        ]),
      ]),
    );
  }
  return wrap;
}

function gearTab(ui) {
  const g = ui.game;
  const s = g.state;
  const wrap = h('div', { class: 'gear' });
  const rows = (list, owned, equipped, onEquip, stat) =>
    h('div', { class: 'gear-list' }, list.filter((x) => owned.includes(x.id)).map((x) =>
      h('div', { class: `gear-row ${equipped === x.id ? 'on' : ''}` }, [
        h('span', { class: 'gi', text: x.icon || '•' }),
        h('div', {}, [h('b', { text: x.name }), h('div', { class: 'muted small', text: stat(x) })]),
        equipped === x.id ? h('span', { class: 'tag', text: 'Equipped' }) : btn('Equip', () => { onEquip(x.id); ui.refreshPanel(); }),
      ]),
    ));
  wrap.append(section('Fishing rods', s.rods.length ? rows(RODS, s.rods, s.rod, (id) => g.equip('rod', id), (r) => `Zone ${Math.round(r.zone * 100)}% · Luck +${Math.round(r.luck * 100)}% · Bite speed ×${(1 / r.speed).toFixed(2)}`) : empty('No rod yet — Old Finn at the Palmora dock can help.', '🎣')));
  const baits = BAITS.filter((b) => (s.inventory[b.id] || 0) > 0);
  wrap.append(section('Bait', baits.length ? h('div', { class: 'gear-list' }, baits.map((b) => h('div', { class: `gear-row ${s.bait === b.id ? 'on' : ''}` }, [
    h('span', { class: 'gi', text: ITEMS[b.id].icon }),
    h('div', {}, [h('b', { text: `${ITEMS[b.id].name} ×${s.inventory[b.id]}` }), h('div', { class: 'muted small', text: ITEMS[b.id].desc })]),
    s.bait === b.id ? h('span', { class: 'tag', text: 'Using' }) : btn('Use', () => { s.bait = b.id; ui.refreshHud(); ui.refreshPanel(); }),
  ]))) : empty('Out of bait. Fish still bite, just slower.', '🪱')));
  wrap.append(section('Weapons', rows(WEAPONS, s.weapons, s.weapon, (id) => g.equip('weapon', id), (w) => `Damage ${w.dmg} · Reach ${w.range}`)));
  const boat = BOATS_BY_ID[s.boat];
  wrap.append(section('Boat', h('div', { class: 'gear-row on' }, [h('span', { class: 'gi', text: boat.icon || '🏝️' }), h('div', {}, [h('b', { text: boat.name }), h('div', { class: 'muted small', text: boat.desc || 'Buy a boat from Captain Reyes to visit other islands.' })])])));
  return wrap;
}

function fishdexTab(ui) {
  const g = ui.game;
  const s = g.state;
  const wrap = h('div', { class: 'fishdex' });
  const found = Object.keys(s.fishdex).length;
  wrap.append(h('div', { class: 'dex-progress' }, [
    h('div', { class: 'bar' }, [h('i', { style: { width: `${(found / FISH.length) * 100}%` } }), h('span', { text: `${found} / ${FISH.length} species discovered` })]),
    h('p', { class: 'muted small', text: 'Every 5 new species earns bonus gems. New discoveries also give gems based on rarity.' }),
  ]));
  const grid = h('div', { class: 'dex-grid' });
  for (const tier of TIER_ORDER) {
    for (const f of FISH.filter((x) => x.tier === tier)) {
      const d = s.fishdex[f.id];
      const where = f.where.includes('*') ? 'Anywhere' : f.where.map((w) => ISLANDS[w].name).join(', ');
      const when = [f.time !== 'any' ? (f.time === 'night' ? '🌙 Night' : '☀️ Day') : '', f.weather === 'rain' ? '🌧️ Rain' : ''].filter(Boolean).join(' · ');
      grid.append(
        h('div', { class: `dex ${d ? 'found' : ''}`, style: { '--tier': TIERS[f.tier].color } }, [
          h('div', { class: 'dex-img', html: d ? fishSVG(f, 70) : fishSVG({ ...f, colors: ['#5a5466', '#5a5466', '#4a4458'], stripes: false, stars: false, flames: false }, 70) }),
          h('b', { text: d ? f.name : '???' }),
          h('div', { html: rarityBadge(f.tier) }),
          h('div', { class: 'muted small', text: d ? `Caught ${d.count} · Best ${d.best} kg` : `${where}${when ? ' · ' + when : ''}` }),
        ]),
      );
    }
  }
  wrap.append(grid);
  return wrap;
}

function statsTab(ui) {
  const s = ui.game.state;
  const st = s.stats;
  const hrs = Math.floor(st.playSeconds / 3600);
  const mins = Math.floor((st.playSeconds % 3600) / 60);
  const trophies = ['trophy_bronze', 'trophy_silver', 'trophy_gold'].filter((t) => s.inventory[t]);
  return h('div', { class: 'stats' }, [
    h('div', { class: 'stat-grid' }, [
      ['🐟', 'Fish caught', st.caught], ['⭐', 'Perfect catches', st.perfect], ['🪙', 'Coins earned', formatNum(st.earned)], ['📦', 'Items sold', st.sold],
      ['🏴‍☠️', 'Pirates defeated', st.pirates], ['🍳', 'Dishes cooked', st.cooked], ['🌾', 'Crops harvested', st.harvested], ['⛏️', 'Treasures dug', st.dug],
      ['📅', 'Days on the islands', s.time.day], ['⏱️', 'Play time', `${hrs}h ${mins}m`], ['🔥', 'Login streak', `${s.streak} day${s.streak === 1 ? '' : 's'}`], ['👕', 'Outfits owned', s.cosmetics.length],
    ].map(([i, l, v]) => h('div', { class: 'stat' }, [h('span', { class: 'stat-i', text: i }), h('b', { text: String(v) }), h('small', { text: l })]))),
    section('Trophies', trophies.length ? h('div', { class: 'row' }, trophies.map((t) => h('span', { class: 'trophy', html: `${ITEMS[t].icon} ${ITEMS[t].name}` }))) : h('p', { class: 'muted', text: 'Win tournaments on Coralia Reef to earn trophies.' })),
  ]);
}

function questCard(g, q, st) {
  const objs = q.objectives.map((o, i) => {
    const done = i < st.step;
    const cur = i === st.step;
    const count = o.count ?? 1;
    return h('li', { class: done ? 'done' : cur ? 'cur' : 'todo', html: `${done ? '✔' : cur ? '➜' : '○'} ${escapeHtml(o.text)}${cur && count > 1 ? ` <b>${Math.min(st.progress, count)}/${count}</b>` : ''}` });
  });
  const giver = q.giver ? NPCS[q.giver] : null;
  return h('div', { class: `qcard ${q.main ? 'main' : ''}` }, [
    h('div', { class: 'qhead' }, [h('b', { text: q.title }), h('span', { class: 'qreward', html: rewardText(q.rewards) })]),
    h('p', { class: 'muted', text: q.desc }),
    giver ? h('p', { class: 'muted small', text: `From ${giver.name}` }) : null,
    h('ul', { class: 'objs' }, objs),
  ]);
}

export function rewardText(r = {}) {
  const parts = [];
  if (r.coins) parts.push(`🪙 ${formatNum(r.coins)}`);
  if (r.gems) parts.push(`💎 ${r.gems}`);
  if (r.xp) parts.push(`✦ ${r.xp} XP`);
  if (r.items) for (const [k, n] of Object.entries(r.items)) if (n) parts.push(`${ITEMS[k]?.icon ?? ''} ${n}`);
  if (r.rods) parts.push(...r.rods.map((x) => `🎣 ${RODS_BY_ID[x].name}`));
  if (r.cosmetics) parts.push(...r.cosmetics.map((x) => `👕 ${COSMETICS[x].name}`));
  return parts.join(' · ');
}

// ════════════════════════════════════════════════════════════
//  Map
// ════════════════════════════════════════════════════════════
function islandMap(ui) {
  const g = ui.game;
  const w = g.world;
  const mm = w.minimap();
  const c = document.createElement('canvas');
  const S = 460;
  c.width = c.height = S;
  c.className = 'big-map';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', `Map of ${w.def.name}`);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4fa3bd';
  ctx.fillRect(0, 0, S, S);
  ctx.drawImage(mm.canvas, 0, 0, S, S);
  const toMap = (x, z) => [((x + mm.ext) / (mm.ext * 2)) * S, ((z + mm.ext) / (mm.ext * 2)) * S];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 12px Fredoka, sans-serif';
  for (const n of w.npcs) {
    if (!n.available()) continue;
    const [x, y] = toMap(n.pos.x, n.pos.z);
    ctx.fillStyle = n.questMark ? '#f7c95c' : '#fbf3e2';
    ctx.strokeStyle = '#2a2534';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a2534';
    ctx.strokeStyle = 'rgba(251,243,226,.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(n.def.name, x, y - 12);
    ctx.fillText(n.def.name, x, y - 12);
  }
  ctx.font = '18px sans-serif';
  if (w.dock) {
    const [x, y] = toMap(w.dock.end.x, w.dock.end.z);
    ctx.fillText('⚓', x, y);
  }
  if (w.homestead) {
    const [x, y] = toMap(w.homestead.x, w.homestead.z);
    ctx.fillText('🏠', x, y);
  }
  for (const d of w.digSpots) {
    const [x, y] = toMap(d.pos.x, d.pos.z);
    ctx.fillStyle = '#8a2f2a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✕', x, y);
  }
  for (const e of w.enemies) {
    if (e.dead) continue;
    const [x, y] = toMap(e.pos.x, e.pos.z);
    ctx.fillStyle = '#e0533d';
    ctx.beginPath();
    ctx.arc(x, y, e.boss ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = g.player.pos;
  const [px, py] = toMap(p.x, p.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-g.player.yaw + Math.PI);
  ctx.fillStyle = '#f0846a';
  ctx.strokeStyle = '#2a2534';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(8, 9);
  ctx.lineTo(0, 4);
  ctx.lineTo(-8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return h('div', { class: 'map-wrap' }, [
    c,
    h('div', { class: 'legend' }, [
      h('h3', { text: w.def.name }),
      h('p', { class: 'muted', text: w.def.blurb }),
      h('ul', { html: '<li><span class="lg you"></span> You</li><li><span class="lg npc"></span> Islander</li><li><span class="lg quest"></span> Has a quest</li><li><span class="lg foe"></span> Pirate</li><li>⚓ Dock · 🏠 Home · <b style="color:#8a2f2a">✕</b> Treasure</li>' }),
    ]),
  ]);
}

function seaChart(ui, travel) {
  const g = ui.game;
  const s = g.state;
  const wrap = h('div', { class: 'chart-wrap' });
  const chart = h('div', { class: 'chart', role: 'list', 'aria-label': 'Islands' });
  chart.innerHTML = `<svg class="chart-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M30 58 Q50 45 70 40" class="route"/><path d="M30 58 Q48 75 62 80" class="route"/><path d="M30 58 Q24 40 22 22" class="route"/>
    <g class="compass" transform="translate(88 86)"><circle r="7"/><path d="M0 -6 L2 0 L0 6 L-2 0 Z"/><text y="-8.5">N</text></g></svg>`;
  for (const id of ISLAND_ORDER) {
    const isl = ISLANDS[id];
    const here = g.world.id === id;
    const reach = g.canReach(id);
    const node = h('div', { class: `isle ${here ? 'here' : ''} ${reach ? '' : 'locked'}`, role: 'listitem', style: { left: isl.chart.x + '%', top: isl.chart.y + '%' } }, [
      h('div', { class: 'isle-blob', text: { palmora: '🌴', coralia: '🪸', ember: '🌋', skull: '☠️' }[id] }),
      h('b', { text: isl.name }),
      h('small', { text: here ? 'You are here' : reach ? isl.subtitle : `Needs ${BOATS_BY_ID[isl.boat].name}` }),
      travel && !here ? btn(reach ? `Sail · ${isl.travelHours || 1}h` : '🔒 Locked', () => { ui.closePanel(); g.travelTo(id); }, reach ? 'primary small' : 'small', !reach) : null,
    ]);
    chart.append(node);
  }
  wrap.append(chart);
  wrap.append(h('p', { class: 'muted small center', text: travel ? 'Choose a destination. Sailing takes game time.' : 'Board your boat at any dock to sail. Captain Reyes sells boats on Palmora.' }));
  return wrap;
}

// ════════════════════════════════════════════════════════════
//  Wardrobe & look editor (also used by the character creator)
// ════════════════════════════════════════════════════════════
export function lookEditor(ui, look, onChange, { gender = true, outfits = false } = {}) {
  const wrap = h('div', { class: 'look-editor' });
  const change = (patch) => {
    Object.assign(look, patch);
    onChange({ ...look });
    ui.game.audio.sfx('click');
  };
  const swatches = (label, list, key) =>
    h('div', { class: 'field' }, [
      h('span', { class: 'flabel', text: label }),
      h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': label }, list.map((c, i) =>
        h('button', { class: `sw ${look[key] === i ? 'on' : ''}`, role: 'radio', 'aria-checked': look[key] === i ? 'true' : 'false', 'aria-label': `${label} ${i + 1}`, style: { background: c }, onclick: (e) => { change({ [key]: i }); refreshOn(e.currentTarget); } }),
      )),
    ]);
  const refreshOn = (b) => {
    b.parentElement.querySelectorAll('.on').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-checked', 'true');
  };
  if (gender) {
    wrap.append(
      h('div', { class: 'field' }, [
        h('span', { class: 'flabel', text: 'Character' }),
        h('div', { class: 'gender-pick', role: 'radiogroup', 'aria-label': 'Character' }, [
          h('button', { class: `gcard ${look.gender === 'm' ? 'on' : ''}`, role: 'radio', 'aria-checked': look.gender === 'm' ? 'true' : 'false', onclick: (e) => { change({ gender: 'm' }); refreshOn(e.currentTarget); }, html: '<span class="gsym">♂</span><b>Male</b>' }),
          h('button', { class: `gcard ${look.gender === 'f' ? 'on' : ''}`, role: 'radio', 'aria-checked': look.gender === 'f' ? 'true' : 'false', onclick: (e) => { change({ gender: 'f' }); refreshOn(e.currentTarget); }, html: '<span class="gsym">♀</span><b>Female</b>' }),
        ]),
      ]),
    );
  }
  wrap.append(swatches('Skin tone', SKIN_TONES, 'skin'));
  wrap.append(
    h('div', { class: 'field' }, [
      h('span', { class: 'flabel', text: 'Hairstyle' }),
      h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Hairstyle' }, HAIR_STYLES.map((hs) => h('button', { class: `chip ${look.hair === hs.id ? 'on' : ''}`, role: 'radio', 'aria-checked': look.hair === hs.id ? 'true' : 'false', onclick: (e) => { change({ hair: hs.id }); refreshOn(e.currentTarget); }, text: hs.name }))),
    ]),
  );
  wrap.append(swatches('Hair colour', HAIR_COLORS, 'hairColor'));
  wrap.append(swatches('Eye colour', EYE_COLORS, 'eyes'));
  if (outfits) {
    const owned = ui.game.state ? ui.game.state.cosmetics : Object.values(COSMETICS).filter((c) => !c.price && !c.gems && !c.reward).map((c) => c.id);
    for (const [slot, label] of [['top', 'Top'], ['bottom', 'Bottom']]) {
      wrap.append(
        h('div', { class: 'field' }, [
          h('span', { class: 'flabel', text: label }),
          h('div', { class: 'chips', role: 'radiogroup', 'aria-label': label }, owned.filter((id) => COSMETICS[id].slot === slot).map((id) => h('button', { class: `chip outfit ${look[slot] === id ? 'on' : ''}`, role: 'radio', 'aria-checked': look[slot] === id ? 'true' : 'false', onclick: (e) => { change({ [slot]: id }); refreshOn(e.currentTarget); }, html: `<i style="background:${COSMETICS[id].color}"></i>${escapeHtml(COSMETICS[id].name)}` }))),
        ]),
      );
    }
  }
  return wrap;
}

function cosmeticGrid(ui, slot) {
  const g = ui.game;
  const s = g.state;
  const look = s.look;
  const all = Object.values(COSMETICS).filter((c) => c.slot === slot);
  const grid = h('div', { class: 'cos-grid' });
  if (slot === 'hat' || slot === 'acc') {
    grid.append(h('button', { class: `cos ${!look[slot] ? 'on' : ''}`, onclick: () => { g.setLook({ ...look, [slot]: null }); ui.refreshPanel(); } }, [h('span', { class: 'cos-sw none', text: '∅' }), h('b', { text: 'None' })]));
  }
  for (const c of all) {
    const owned = s.cosmetics.includes(c.id);
    const on = look[slot] === c.id;
    const where = c.reward ? 'Special reward' : c.gems && !c.price ? 'Moth / special shops' : 'Luna\'s Boutique';
    grid.append(
      h('button', {
        class: `cos ${on ? 'on' : ''} ${owned ? '' : 'locked'}`,
        'aria-pressed': on ? 'true' : 'false',
        'aria-label': `${c.name}${owned ? '' : ', locked'}`,
        onclick: () => {
          if (!owned) return g.ui.toast(`${c.name}: find it at ${where}.`, 'info');
          g.setLook({ ...look, [slot]: c.id });
          ui.refreshPanel();
        },
      }, [
        h('span', { class: 'cos-sw', style: { background: c.color }, html: c.pattern ? `<i class="pat ${c.pattern[0]}" style="--a:${c.pattern[1]}"></i>` : '' }),
        h('b', { text: c.name }),
        owned ? null : h('small', { class: 'lockline', html: `🔒 ${price(c.price, c.gems)}` }),
      ]),
    );
  }
  return grid;
}

function petsTab(ui) {
  const g = ui.game;
  const s = g.state;
  const wrap = h('div', { class: 'gear-list' });
  wrap.append(h('div', { class: `gear-row ${!s.pet ? 'on' : ''}` }, [h('span', { class: 'gi', text: '∅' }), h('div', {}, [h('b', { text: 'No pet' })]), !s.pet ? h('span', { class: 'tag', text: 'Active' }) : btn('Choose', () => { g.equip('pet', null); ui.refreshPanel(); })]));
  for (const p of PETS) {
    const owned = s.pets.includes(p.id);
    wrap.append(h('div', { class: `gear-row ${s.pet === p.id ? 'on' : ''} ${owned ? '' : 'locked'}` }, [
      h('span', { class: 'gi', text: p.icon }),
      h('div', {}, [h('b', { text: p.name }), h('div', { class: 'muted small', text: `${p.perk}${owned ? '' : ' · Sold at Luna\'s Boutique'}` })]),
      !owned ? h('span', { class: 'lock', html: `🔒 💎 ${p.gems}` }) : s.pet === p.id ? h('span', { class: 'tag', text: 'Active' }) : btn('Choose', () => { g.equip('pet', p.id); ui.refreshPanel(); }),
    ]));
  }
  return wrap;
}

// ════════════════════════════════════════════════════════════
//  Shop
// ════════════════════════════════════════════════════════════
function entryInfo(g, e) {
  const s = g.state;
  switch (e.kind) {
    case 'rod': {
      const r = RODS_BY_ID[e.id];
      return { name: r.name, icon: r.icon, desc: `Zone ${Math.round(r.zone * 100)}% · Luck +${Math.round(r.luck * 100)}% · Bites ×${(1 / r.speed).toFixed(2)} faster`, owned: s.rods.includes(e.id) };
    }
    case 'weapon': {
      const w = WEAPONS_BY_ID[e.id];
      return { name: w.name, icon: w.icon, desc: `Damage ${w.dmg} · ${w.desc}`, owned: s.weapons.includes(e.id) };
    }
    case 'boat': {
      const b = BOATS_BY_ID[e.id];
      return { name: b.name, icon: b.icon, desc: b.desc, owned: g.boatTierOf(s.boat) >= b.tier };
    }
    case 'cosmetic': {
      const c = COSMETICS[e.id];
      const slotName = { top: 'Top', bottom: 'Bottom', hat: 'Hat', acc: 'Accessory' }[c.slot];
      return { name: c.name, swatch: c.color, pattern: c.pattern, desc: `${slotName} — try it on in the Wardrobe (C)`, owned: s.cosmetics.includes(e.id) };
    }
    case 'pet': {
      const p = PETS_BY_ID[e.id];
      return { name: p.name, icon: p.icon, desc: `${p.perk}. ${p.desc}`, owned: s.pets.includes(e.id) };
    }
    default: {
      const it = ITEMS[e.id];
      const owned = e.once && (s.inventory[e.id] || 0) > 0;
      const extra = it.type === 'seed' ? ` · ${CROPS[it.crop].hours}h to grow` : '';
      return { name: `${it.name}${e.qty > 1 ? ` ×${e.qty}` : ''}`, html: itemIconHTML(e.id, 40), desc: (it.desc || '') + extra, owned };
    }
  }
}

function buyTab(ui, shop) {
  const g = ui.game;
  const s = g.state;
  const list = h('div', { class: 'shop-list' });
  for (const e of shop.stock) {
    const info = entryInfo(g, e);
    const coins = e.price || 0;
    const gems = e.gems || 0;
    const locked = s.level < (e.level || 1);
    const afford = s.coins >= coins && s.gems >= gems;
    let action;
    if (info.owned) action = h('span', { class: 'tag', text: 'Owned' });
    else if (locked) action = h('span', { class: 'lock', text: `🔒 Lv ${e.level}` });
    else action = btn('Buy', () => { g.buy(e, shop); ui.refreshPanel(); }, afford ? 'primary' : '', !afford, { 'aria-label': `Buy ${info.name}` });
    list.append(
      h('div', { class: `shop-row ${info.owned ? 'owned' : ''} ${locked ? 'locked' : ''}` }, [
        h('div', { class: 'shop-icon', html: info.html || (info.swatch ? `<span class="cos-sw" style="background:${info.swatch}">${info.pattern ? `<i class="pat ${info.pattern[0]}" style="--a:${info.pattern[1]}"></i>` : ''}</span>` : `<span class="emoji">${info.icon}</span>`) }),
        h('div', { class: 'shop-info' }, [h('b', { text: info.name }), h('div', { class: 'muted small', text: info.desc })]),
        h('div', { class: 'shop-price', html: price(coins, gems) }),
        action,
      ]),
    );
  }
  return list;
}

function sellTab(ui, shop) {
  const g = ui.game;
  const s = g.state;
  const items = sortedInventory(s, (it) => shop.sells.includes(it.type) && it.sell > 0);
  const wrap = h('div', { class: 'sell' });
  const bonus = g.sellMultiplier(shop);
  if (bonus > 1) wrap.append(h('p', { class: 'goodline', text: `✨ Bonus: +${Math.round((bonus - 1) * 100)}% coins here` }));
  if (!items.length) {
    wrap.append(empty(`Nothing to sell here. This shop buys: ${shop.sells.map((t) => TYPE_LABEL[t]).join(', ')}.`, '🪙'));
    return wrap;
  }
  const total = items.reduce((sum, [id, n]) => sum + Math.floor(ITEMS[id].sell * bonus) * n, 0);
  wrap.append(h('div', { class: 'sell-all' }, [h('span', { html: `Everything: <b>🪙 ${formatNum(total)}</b>` }), btn('Sell everything', () => { for (const [id, n] of items) g.sell(id, n, shop, true); g.audio.sfx('coin'); ui.refreshPanel(); }, 'primary')]));
  const list = h('div', { class: 'shop-list' });
  for (const [id, n] of items) {
    const it = ITEMS[id];
    const each = Math.floor(it.sell * bonus);
    list.append(
      h('div', { class: 'shop-row' }, [
        h('div', { class: 'shop-icon', html: itemIconHTML(id, 40) }),
        h('div', { class: 'shop-info' }, [h('b', { text: `${it.name} ×${n}` }), it.type === 'fish' ? h('div', { html: rarityBadge(it.tier) }) : h('div', { class: 'muted small', text: TYPE_LABEL[it.type] })]),
        h('div', { class: 'shop-price', html: `🪙 ${each} each` }),
        h('div', { class: 'row tight' }, [btn('Sell 1', () => { g.sell(id, 1, shop); ui.refreshPanel(); }, '', false, { 'aria-label': `Sell one ${it.name}` }), n > 1 ? btn(`All (${formatNum(each * n)})`, () => { g.sell(id, n, shop); ui.refreshPanel(); }, 'primary', false, { 'aria-label': `Sell all ${it.name}` }) : null]),
      ]),
    );
  }
  wrap.append(list);
  return wrap;
}

// ════════════════════════════════════════════════════════════
//  Home
// ════════════════════════════════════════════════════════════
function upgradeTab(ui) {
  const g = ui.game;
  const s = g.state;
  const next = g.home.nextHouse();
  const wrap = h('div', { class: 'upgrade' });
  wrap.append(h('div', { class: 'house-steps' }, HOUSES.map((hs) => h('div', { class: `hstep ${hs.level <= s.house.level ? 'done' : ''} ${next && hs.level === next.level ? 'next' : ''}` }, [h('span', { text: ['⛺', '🛖', '🏠', '🏡', '🏰'][hs.level] }), h('b', { text: hs.name }), h('small', { text: `${hs.plots} plots` })]))));
  if (!next) {
    wrap.append(empty('Your home is fully upgraded. Legendary!', '🏰'));
    return wrap;
  }
  const c = next.cost;
  const reqs = [
    ['Level', s.level, next.reqLevel, `Lv ${next.reqLevel}`],
    ['🪙 Coins', s.coins, c.coins || 0, formatNum(c.coins || 0)],
    c.gems ? ['💎 Gems', s.gems, c.gems, c.gems] : null,
    ['🪵 Driftwood', s.inventory.driftwood || 0, c.driftwood || 0, c.driftwood],
    ['🪨 Stone', s.inventory.stone || 0, c.stone || 0, c.stone],
  ].filter(Boolean);
  wrap.append(
    h('div', { class: 'card wide' }, [
      h('h3', { text: `Next: ${next.name}` }),
      h('p', { class: 'muted', text: `${next.desc} Unlocks ${next.plots} farm plots.` }),
      h('ul', { class: 'reqs' }, reqs.map(([l, have, need, txt]) => h('li', { class: have >= need ? 'ok' : 'no', html: `${have >= need ? '✔' : '✖'} ${l}: <b>${txt}</b> <small>(have ${formatNum(have)})</small>` }))),
      btn('🔨 Build it!', () => { if (g.home.upgrade()) ui.refreshPanel(); }, 'primary big', !g.home.canUpgrade().ok),
      h('p', { class: 'muted small', text: 'Driftwood & stones wash up on beaches daily — or buy them from Bo.' }),
    ]),
  );
  return wrap;
}

function decorTab(ui) {
  const g = ui.game;
  const s = g.state;
  const owned = sortedInventory(s, (it) => it.type === 'decor');
  const wrap = h('div', {});
  wrap.append(h('p', { class: 'muted', text: `Placed decorations: ${s.house.decor.length}. Walk up to a placed item and press E to pick it back up.` }));
  if (!owned.length) wrap.append(empty('No decorations in your bag. Bo sells them on Palmora.', '🌺'));
  const list = h('div', { class: 'shop-list' });
  for (const [id, n] of owned) {
    list.append(h('div', { class: 'shop-row' }, [h('div', { class: 'shop-icon', html: itemIconHTML(id, 40) }), h('div', { class: 'shop-info' }, [h('b', { text: `${ITEMS[id].name} ×${n}` })]), btn('Place', () => g.home.startPlacing(ITEMS[id].decor), 'primary')]));
  }
  wrap.append(list);
  return wrap;
}

export { DECOR };
