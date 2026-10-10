import { escapeHtml } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { RECIPES, RECIPE_CATS, FISH_INPUTS, RECIPE_ALIASES } from './recipes.js';
import { CROPS } from '../farm/crops.js';
import { ANIMALS } from '../farm/animals.js';
import { fishFor } from './cooking.js';
import { FISH_BY_ID } from '../fishing/fish.js';
import { ISLANDS } from '../world/islands.js';
import { itemIconHTML } from '../ui/icons.js';
import { h, btn } from '../ui/widgets.js';

const ingName = (k) => (FISH_INPUTS[k] ? FISH_INPUTS[k].name : ITEMS[RECIPE_ALIASES[k] || k].name);
const ingIcon = (k, size) => (FISH_INPUTS[k] ? `<span class="emoji" style="font-size:${Math.round(size * 0.72)}px">${FISH_INPUTS[k].icon}</span>` : itemIconHTML(RECIPE_ALIASES[k] || k, size));

// The kitchen menu: a FarmVille-style recipe book with categories, ingredient checks and a fish picker.
export const KITCHEN_PANELS = {
  kitchen: {
    wide: true,
    onOpen(ui, opts) {
      if (opts?.recipe) {
        ui.panel.sel = opts.recipe;
        ui.panel.lastTab = 'all';
      }
    },
    render(ui, opts, p) {
      const g = ui.game;
      const s = g.state;
      p.pages = p.pages || {};
      const unlocked = RECIPES.filter((r) => s.level >= r.level);
      const ready = (cat) => unlocked.filter((r) => (cat === 'all' || r.cat === cat) && g.canCook(r)).length;
      return {
        title: 'Crafting Kitchen',
        icon: '🍳',
        headExtra: h('span', { class: 'kitchen-sub', text: `${unlocked.length}/${RECIPES.length} recipes unlocked` }),
        tabs: RECIPE_CATS.map((c) => ({ id: c.id, label: c.name, icon: c.icon, badge: ready(c.id) || '' })),
        body(tab) {
          if (p.lastTab !== tab) {
            p.lastTab = tab;
            p.sel = null;
          }
          return p.sel ? recipeDetail(ui, p) : recipeBook(ui, p, tab);
        },
      };
    },
  },
};
// the old campfire panel name opens the kitchen too
KITCHEN_PANELS.cook = KITCHEN_PANELS.kitchen;

/** Where to get an ingredient you're missing. */
function ingSource(k) {
  if (FISH_INPUTS[k]) return `${FISH_INPUTS[k].desc} Catch one by fishing.`;
  if (ITEMS[k]?.type === 'fish') {
    const f = FISH_BY_ID[ITEMS[k].fish];
    const where = f.where.includes('*') ? 'any island' : f.where.map((w) => ISLANDS[w].name).join(', ');
    return `Catch a ${f.name} — ${where}${f.time !== 'any' ? `, ${f.time === 'night' ? 'at night' : 'by day'}` : ''}${f.weather === 'rain' ? ', in the rain' : ''}${f.boat ? ' (best from a boat 🚤)' : ''}.`;
  }
  if (k === 'seaweed') return 'Sometimes caught while fishing.';
  const crop = Object.values(CROPS).find((c) => c.item === k);
  if (crop) return `${crop.kind === 'tree' ? 'Grow a' : 'Grow'} ${crop.name}${crop.kind === 'tree' ? '' : ''} — ${crop.kind === 'tree' ? 'sapling' : 'seeds'} at Chloe's (Lv ${crop.level})${['mango', 'banana', 'coconut'].includes(k) ? ', or shake wild trees' : ''}.`;
  const animal = Object.values(ANIMALS).find((a) => a.product === k);
  if (animal) return `From your ${animal.name.toLowerCase()} (buy at Chloe's, Lv ${animal.level}).`;
  const r = RECIPES.find((x) => x.out === k);
  if (r) return `Cook it in this kitchen (Lv ${r.level}).`;
  return ITEMS[k]?.desc || '';
}

function recipeCard(ui, p, r) {
  const g = ui.game;
  const out = ITEMS[r.out];
  const locked = g.state.level < r.level;
  const can = !locked && g.canCook(r);
  const missing = Object.entries(r.inputs).filter(([k, n]) => g.ingredientCount(k) < n).length;
  return h('button', {
    class: `kcard ${locked ? 'locked' : can ? 'ready' : ''}`,
    'aria-label': `${out.name}${locked ? `, unlocks at level ${r.level}` : can ? ', ready to cook' : `, missing ${missing} ingredient${missing === 1 ? '' : 's'}`}`,
    onclick: () => {
      if (locked) return g.ui.toast(`${out.name} unlocks at level ${r.level}.`, 'info');
      g.audio.sfx('click');
      p.sel = r.id;
      ui.renderPanel();
    },
  }, [
    h('span', { class: 'kc-name', text: out.name }),
    h('span', { class: 'kc-img', html: itemIconHTML(r.out, 58) }),
    h('span', { class: 'kc-sell', html: `🪙 <b>${out.sell * (r.qty || 1)}</b>` }),
    h('span', { class: 'kc-state', text: locked ? `🔒 Level ${r.level}` : can ? '✓ Ready to cook' : `Missing ${missing}` }),
  ]);
}

function recipeBook(ui, p, tab) {
  const g = ui.game;
  // ready-to-cook recipes first, then the rest of what you've unlocked, then locked ones by level
  const rank = (r) => (g.state.level < r.level ? 2 : g.canCook(r) ? 0 : 1);
  const list = RECIPES.filter((r) => tab === 'all' || r.cat === tab)
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r) - rank(b.r) || (rank(a.r) === 2 ? a.r.level - b.r.level : 0) || a.i - b.i)
    .map((x) => x.r);
  const per = 6;
  const pages = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(p.pages[tab] || 0, pages - 1);
  const turn = (d) => {
    p.pages[tab] = (page + d + pages) % pages;
    g.audio.sfx('click');
    ui.renderPanel();
  };
  const wrap = h('div', { class: 'kbook' });
  wrap.append(h('p', { class: 'kbook-sub', text: 'Cook recipes to sell for coins! Tap a recipe to see what it needs.' }));
  wrap.append(h('div', { class: 'kbook-spread' }, [
    h('button', { class: 'kpage-btn', 'aria-label': 'Previous page', disabled: pages < 2, onclick: () => turn(-1), html: '◀' }),
    h('div', { class: 'kgrid' }, list.slice(page * per, page * per + per).map((r) => recipeCard(ui, p, r))),
    h('button', { class: 'kpage-btn', 'aria-label': 'Next page', disabled: pages < 2, onclick: () => turn(1), html: '▶' }),
  ]));
  const readyN = list.filter((r) => g.state.level >= r.level && g.canCook(r)).length;
  wrap.append(h('div', { class: 'kpage-info' }, [h('span', { text: `Page ${page + 1}/${pages}` }), h('span', { text: readyN ? `🔥 ${readyN} ready to cook` : 'Grow, fish and farm to gather ingredients' })]));
  return wrap;
}

function recipeDetail(ui, p) {
  const g = ui.game;
  const s = g.state;
  const r = RECIPES.find((x) => x.id === p.sel);
  const out = ITEMS[r.out];
  const near = g.world?.id === 'palmora' && g.home.kitchenPos && g.player.pos.distanceTo(g.home.kitchenPos) < 9;
  let max = Math.min(10, ...Object.entries(r.inputs).map(([k, n]) => Math.floor(g.ingredientCount(k) / n)));
  const wrap = h('div', { class: 'kdetail' });
  const ings = Object.entries(r.inputs).map(([k, n]) => {
    const have = g.ingredientCount(k);
    const ok = have >= n;
    return h('div', { class: `kd-ing ${ok ? 'ok' : 'no'}`, 'data-tip-title': ingName(k), 'data-tip': ok ? 'You have enough.' : ingSource(k) }, [
      h('span', { class: 'kd-icon', html: ingIcon(k, 52) }),
      h('b', { class: 'kd-count', html: `${ok ? '✓' : '✗'} ${Math.min(have, 999)}/${n}` }),
      h('small', { text: ingName(k) }),
    ]);
  });
  const parts = [];
  ings.forEach((x, i) => {
    if (i) parts.push(h('span', { class: 'kd-op', text: '+' }));
    parts.push(x);
  });
  parts.push(h('span', { class: 'kd-op', text: '=' }), h('div', { class: 'kd-out' }, [h('span', { class: 'kd-icon', html: itemIconHTML(r.out, 64) }), h('b', { text: `${r.qty > 1 ? `${r.qty}× ` : ''}${out.name}` })]));
  // choose which fish to use for "any fish" style inputs
  p.fishPick = p.fishPick || {};
  const fishKeys = Object.keys(r.inputs).filter((k) => FISH_INPUTS[k]);
  const plans = {};
  const pickers = fishKeys.map((k) => {
    const need = r.inputs[k];
    const key = `${r.id}:${k}`;
    const cands = fishFor(k, s.inventory);
    const plan = g.fishPlan(k, need, p.fishPick[key]);
    plans[k] = plan;
    const choose = (pick) => {
      p.fishPick[key] = pick;
      g.audio.sfx('click');
      ui.renderPanel();
    };
    const box = h('div', { class: 'kd-fish' });
    box.append(h('div', { class: 'kd-fish-head' }, [
      h('b', { text: `🎣 Choose ${need > 1 ? `${need} fish` : 'the fish'} to use` }),
      h('span', { class: 'muted small', text: FISH_INPUTS[k].desc }),
      cands.length > 1 ? btn('Use cheapest', () => choose(null), 'small ghost') : null,
    ].filter(Boolean)));
    if (!cands.length) {
      box.append(h('p', { class: 'muted small', text: `You don't have a suitable fish yet. ${ingSource(k)}` }));
      return box;
    }
    if (need === 1) {
      // tap a fish to use it
      box.append(h('div', { class: 'kd-fish-list', role: 'radiogroup', 'aria-label': 'Fish to use' }, cands.map((id) => {
        const it = ITEMS[id];
        const on = plan && plan[id] > 0;
        return h('button', { class: `kfish ${on ? 'on' : ''}`, role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: () => choose({ [id]: 1 }) }, [
          h('span', { class: 'kfish-img', html: itemIconHTML(id, 40) }),
          h('span', { class: 'kfish-name', text: it.name }),
          h('small', { html: `×${s.inventory[id]} · 🪙 ${it.sell}` }),
        ]);
      })));
    } else {
      // one dropdown per fish slot
      const slots = [];
      for (const [id, c] of Object.entries(plan || {})) for (let i = 0; i < c; i++) slots.push(id);
      while (slots.length < need) slots.push(cands[0]);
      const list = h('div', { class: 'kd-fish-slots' });
      slots.forEach((cur, i) => {
        const sel = h('select', {
          'aria-label': `Fish ${i + 1}`,
          onchange: (e) => {
            const next = [...slots];
            next[i] = e.target.value;
            const pick = {};
            for (const f of next) pick[f] = (pick[f] || 0) + 1;
            if (Object.entries(pick).some(([f, c]) => c > (s.inventory[f] || 0))) {
              g.ui.toast(`You only have ${s.inventory[e.target.value]} ${ITEMS[e.target.value].name}.`, 'warn');
              ui.renderPanel();
              return;
            }
            choose(pick);
          },
        }, cands.map((id) => {
          const o = h('option', { value: id, text: `${ITEMS[id].name} (×${s.inventory[id]}) · 🪙 ${ITEMS[id].sell}` });
          if (id === cur) o.selected = true;
          return o;
        }));
        list.append(h('label', { class: 'kd-fish-slot' }, [h('span', { class: 'kfish-img', html: itemIconHTML(cur, 30) }), sel]));
      });
      box.append(list);
    }
    // warn before using up something valuable
    const pricey = Object.keys(plan || {}).filter((id) => ITEMS[id].sell >= 90);
    if (pricey.length) box.append(h('p', { class: 'warnline small', text: `⚠ ${pricey.map((id) => ITEMS[id].name).join(', ')} ${pricey.length > 1 ? 'are' : 'is'} worth a lot (🪙 ${pricey.map((id) => ITEMS[id].sell).join(', ')}). Sure you want to cook ${pricey.length > 1 ? 'them' : 'it'}?` }));
    return box;
  });
  const fishOpts = Object.fromEntries(fishKeys.map((k) => [k, plans[k]]));
  // how many times we can cook with this exact fish choice
  const fishTimes = fishKeys.length ? Math.min(...fishKeys.map((k) => (plans[k] ? Math.min(...Object.entries(plans[k]).map(([id, c]) => Math.floor((s.inventory[id] || 0) / c))) : 0))) : Infinity;
  max = Math.min(max, fishTimes);
  const bar = h('div', { class: 'kd-progress', 'aria-hidden': 'true' }, [h('i')]);
  const cookN = (n) => {
    if (p.cooking) return;
    p.cooking = true;
    wrap.classList.add('cooking');
    g.audio.sfx('water');
    g.player?.char.play('pickup', 0.9);
    requestAnimationFrame(() => (bar.firstChild.style.width = '100%'));
    setTimeout(() => {
      p.cooking = false;
      if (!g.ui.panel || g.ui.panel !== p) return;
      let made = 0;
      for (let i = 0; i < n; i++) if (g.cook(r.id, { fish: fishOpts })) made++;
      if (made) {
        g.ui.toast(`🍳 Cooked ${made * (r.qty || 1)}× ${out.icon} ${out.name}!`, 'good');
        g.ui.refreshHud();
      }
      ui.renderPanel();
    }, 900);
  };
  const missing = Object.entries(r.inputs).filter(([k, n]) => g.ingredientCount(k) < n);
  const kids = [
    h('button', { class: 'btn small ghost kd-back', onclick: () => { p.sel = null; ui.renderPanel(); }, html: '◀ All recipes' }),
    h('div', { class: 'kd-title' }, [h('b', { text: out.name }), h('span', { html: `Sells for 🪙 <b>${out.sell}</b> each${out.heal ? ` · Heals ❤ ${out.heal}` : ''} · ✨ ${r.cat === 'basics' ? 4 + r.level : 10 + r.level * 4} XP` })]),
    h('div', { class: 'kd-row' }, parts),
    h('p', { class: 'kd-help', text: 'Left number: how many you have · Right number: how many you need' }),
    ...pickers,
    missing.length ? h('ul', { class: 'kd-missing' }, missing.map(([k]) => h('li', { html: `${ingIcon(k, 18)} <b>${escapeHtml(ingName(k))}:</b> ${escapeHtml(ingSource(k))}` }))) : null,
    bar,
    h('div', { class: 'kd-actions' }, [
      btn(`🔥 Cook 1`, () => cookN(1), 'primary', !near || max < 1 || p.cooking),
      max > 1 ? btn(`Cook ×${max}`, () => cookN(max), '', !near || p.cooking) : null,
      h('span', { class: 'muted small', text: near ? `You have ${s.inventory[r.out] || 0} ${out.name}` : 'Walk up to your kitchen to cook.' }),
    ]),
  ];
  wrap.append(...kids.filter(Boolean));
  return wrap;
}
