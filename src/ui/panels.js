import { formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { FISH, TIERS } from '../fishing/fish.js';
import { RODS, BAITS, BOATS_BY_ID } from '../fishing/gear.js';
import { WEAPONS } from '../combat/weapons.js';
import { ISLANDS, ISLAND_ORDER } from '../world/islands.js';
import { itemIconHTML, rarityBadge, itemTip, tipAttrs } from './icons.js';
import { h, btn, empty, section, TYPE_LABEL, sortedInventory } from './widgets.js';
import { fishdexTab, FISHING_PANELS } from '../fishing/panels.js';
import { FARM_PANELS } from '../farm/panels.js';
import { HOME_PANELS } from '../home/panel.js';
import { KITCHEN_PANELS } from '../kitchen/panel.js';
import { SHOP_PANELS } from '../people/shopPanel.js';
import { STORY_PANELS } from '../story/panel.js';
import { WARDROBE_PANELS } from '../people/wardrobePanel.js';

// The general menus (bag, map, pause, settings, help) live here; each feature folder adds its own.
// ════════════════════════════════════════════════════════════
const BASE_PANELS = {
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
                ['WASD / Arrows', 'Move'], ['Shift', 'Run'], ['Space', 'Jump (dodges attacks!)'], ['E', 'Talk · fish · shake trees · plant · interact'], ['F / click', 'Attack'],
                ['Drag mouse', 'Rotate camera'], ['Wheel', 'Zoom'], ['I / Tab', 'Bag'], ['J', 'Quests'], ['M', 'Map'], ['C', 'Wardrobe'], ['Esc', 'Menu / close'],
              ].map(([k, v]) => `<kbd>${k}</kbd><span>${v}</span>`).join('') }),
            ),
            section('Making money (start here!)', h('ol', {}, [
              h('li', { text: 'Beachcombing: walk over shells, starfish and driftwood on the sand — they\'re free. Sell shells & starfish to Chloe at the fruit stand.' }),
              h('li', { text: 'Fruit: stand next to a tree with coloured fruit and press E to shake it. Sell fruit to Chloe.' }),
              h('li', { text: 'Fishing: Old Ross at the dock gives you a FREE rod (story quest). Sell fish to Megan at the fish market.' }),
              h('li', { text: 'Cooking: in the kitchen beside your home, turn 1 fish into Grilled Fish — it sells for 3× more! Dozens more recipes unlock as you level up.' }),
              h('li', { text: 'Farming: plant seeds on your soil patches (more unlock every level), water them, fertilize for bigger harvests, and raise chickens, cows and more for eggs, milk and honey.' }),
              h('li', { text: 'Farming: buy seeds from Chloe, plant them at your homestead, water daily and harvest.' }),
              h('li', { text: 'To sell: talk to a shopkeeper and pick "Sell items". Hover any item to see what it\'s worth.' }),
            ])),
            section('Fishing', h('ol', {}, [
              h('li', { text: 'Face the water and press E to cast.' }),
              h('li', { text: 'Wait for the "!" and press E quickly to hook the fish.' }),
              h('li', { text: 'When the fish is hooked, TAP E / Space / click (or the REEL button) again and again to pull it in.' }),
              h('li', { text: 'When the fish THRASHES (red flash), stop tapping for a moment — if the line tension fills up, the line snaps!' }),
              h('li', { text: 'Strong fish need a strong rod. With a weak rod the line strains fast and big fish usually escape.' }),
              h('li', { text: 'Better rods = more power + more luck. Better bait = faster bites, fewer escapes and a chance of a better catch. Deep-sea fish (🚤) bite far more often when you fish from your boat.' }),
            ])),
            section('Island life', h('ul', {}, [
              h('li', { text: 'Sell fish to Megan, fruit & food to Chloe. Coins buy gear, boats, clothes and house upgrades.' }),
              h('li', { text: 'Gems come from rare catches, treasure, quests, tournaments and bounties.' }),
              h('li', { text: 'Farm at your homestead: plant, water daily, harvest. Trees fruit forever.' }),
              h('li', { text: 'Cook in your kitchen — food sells for more and heals you.' }),
              h('li', { text: 'Night (7 PM – 7 AM): rare fish, Madison the night merchant… and pirate raids.' }),
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
  const filters = [['all', 'All'], ['fish', 'Fish'], ['farm', 'Farm'], ['food', 'Food'], ['seed', 'Seeds'], ['material', 'Materials'], ['other', 'Other']];
  const match = (it) => {
    switch (p.filter) {
      case 'all': return true;
      case 'fish': return it.type === 'fish';
      case 'farm': return ['fruit', 'crop', 'animal'].includes(it.type);
      case 'food': return it.type === 'product' || it.type === 'ingredient';
      case 'seed': return ['seed', 'bait', 'farm'].includes(it.type);
      case 'material': return it.type === 'material' || it.type === 'collectible';
      default: return !['fish', 'fruit', 'crop', 'animal', 'product', 'ingredient', 'seed', 'bait', 'farm', 'material', 'collectible'].includes(it.type);
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
        ...tipAttrs(itemTip(id, n)),
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
  wrap.append(section('Fishing rods', s.rods.length ? rows(RODS, s.rods, s.rod, (id) => g.equip('rod', id), (r) => `Power ${r.power} · Luck +${Math.round(r.luck * 100)}% · Bite speed ×${(1 / r.speed).toFixed(2)}${r.boatOnly ? ' · 🚤 Boat only' : ''}`) : empty('No rod yet — Old Ross at the Palmora dock can help.', '🎣')));
  const baits = BAITS.filter((b) => (s.inventory[b.id] || 0) > 0);
  wrap.append(section('Bait', baits.length ? h('div', { class: 'gear-list' }, baits.map((b) => h('div', { class: `gear-row ${s.bait === b.id ? 'on' : ''}` }, [
    h('span', { class: 'gi', text: ITEMS[b.id].icon }),
    h('div', {}, [h('b', { text: `${ITEMS[b.id].name} ×${s.inventory[b.id]}` }), h('div', { class: 'muted small', text: ITEMS[b.id].desc })]),
    s.bait === b.id ? h('span', { class: 'tag', text: 'Using' }) : btn('Use', () => { s.bait = b.id; ui.refreshHud(); ui.refreshPanel(); }),
  ]))) : empty('Out of bait. Fish still bite, just slower.', '🪱')));
  wrap.append(section('Weapons', rows(WEAPONS, s.weapons, s.weapon, (id) => g.equip('weapon', id), (w) => `Damage ${w.dmg} · Reach ${w.range}`)));
  const boat = BOATS_BY_ID[s.boat];
  wrap.append(section('Boat', h('div', { class: 'gear-row on' }, [h('span', { class: 'gi', text: boat.icon || '🏝️' }), h('div', {}, [h('b', { text: boat.name }), h('div', { class: 'muted small', text: boat.desc || 'Buy a boat from Captain Jack to visit other islands.' })])])));
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
  wrap.append(h('p', { class: 'muted small center', text: travel ? 'Choose a destination. Sailing takes game time.' : 'Board your boat at any dock to sail. Captain Jack sells boats on Palmora.' }));
  return wrap;
}

// ── kitchen ─────────────────────────────────────────

/** Every menu panel in the game, by name (ui.openPanel(name)). */
export const PANELS = { ...BASE_PANELS, ...STORY_PANELS, ...WARDROBE_PANELS, ...SHOP_PANELS, ...HOME_PANELS, ...KITCHEN_PANELS, ...FISHING_PANELS, ...FARM_PANELS };
