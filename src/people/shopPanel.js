import { formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { CROPS, IRRIGATION } from '../farm/crops.js';
import { ANIMALS, FARM_BUILDINGS } from '../farm/animals.js';
import { RODS_BY_ID, BOATS_BY_ID } from '../fishing/gear.js';
import { WEAPONS_BY_ID } from '../combat/weapons.js';
import { PETS_BY_ID } from './pets.js';
import { COSMETICS } from './cosmetics.js';
import { SHOPS } from './shops.js';
import { itemIconHTML, rarityBadge, itemTip, tipAttrs } from '../ui/icons.js';
import { h, btn, price, empty, TYPE_LABEL, sortedInventory } from '../ui/widgets.js';

// Shops: buying and selling with the islanders.
export const SHOP_PANELS = {
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
};

// ════════════════════════════════════════════════════════════
//  Shop
// ════════════════════════════════════════════════════════════
function entryInfo(g, e) {
  const s = g.state;
  switch (e.kind) {
    case 'rod': {
      const r = RODS_BY_ID[e.id];
      return { name: r.name, icon: r.icon, desc: `Power ${r.power} (lands bigger fish) · Luck +${Math.round(r.luck * 100)}% · Bites ×${(1 / r.speed).toFixed(2)} faster`, owned: s.rods.includes(e.id) };
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
    case 'animal': {
      const a = ANIMALS[e.id];
      const n = g.home.animalCount(e.id);
      const built = g.home.isBuilt(a.building);
      return { name: a.name, icon: a.icon, desc: `${a.desc} Gives ${ITEMS[a.product].icon} ${ITEMS[a.product].name}. You have ${n}/${a.max}.${built ? '' : ` Needs a ${FARM_BUILDINGS[a.building].name} first — Bob builds it.`}`, owned: n >= a.max, ownedText: 'Pen full', blocked: built ? null : `🔨 Needs ${FARM_BUILDINGS[a.building].name}` };
    }
    case 'irrigation': {
      const x = IRRIGATION[e.irr];
      return { name: x.name, icon: x.icon, desc: x.desc + (e.irr > 1 ? ` Needs the ${IRRIGATION[e.irr - 1].name} first.` : ''), owned: (s.farm.irrigation || 0) >= e.irr, ownedText: 'Installed' };
    }
    case 'pet': {
      const p = PETS_BY_ID[e.id];
      return { name: p.name, icon: p.icon, desc: `${p.perk}. ${p.desc}`, owned: s.pets.includes(e.id) };
    }
    default: {
      const it = ITEMS[e.id];
      const owned = e.once && (s.inventory[e.id] || 0) > 0;
      const c = it.type === 'seed' ? CROPS[it.crop] : null;
      const extra = c ? ` · ${c.hours}h to grow${c.regrow ? `, then every ${c.regrow}h` : ''}` : '';
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
    if (info.owned) action = h('span', { class: 'tag', text: info.ownedText || 'Owned' });
    else if (locked) action = h('span', { class: 'lock', text: `🔒 Lv ${e.level}` });
    else if (info.blocked) action = h('span', { class: 'lock', text: info.blocked });
    else action = btn('Buy', () => { g.buy(e, shop); ui.refreshPanel(); }, afford ? 'primary' : '', !afford, { 'aria-label': `Buy ${info.name}` });
    list.append(
      h('div', { class: `shop-row ${info.owned ? 'owned' : ''} ${locked ? 'locked' : ''}`, 'data-tip-title': info.name, 'data-tip': `${info.desc}${locked ? `\nUnlocks at level ${e.level}.` : ''}${info.owned ? '\nYou already own this.' : ''}` }, [
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
      h('div', { class: 'shop-row', ...tipAttrs(itemTip(id, n)) }, [
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
