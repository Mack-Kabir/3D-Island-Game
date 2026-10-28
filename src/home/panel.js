import { formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { HOUSES } from './houses.js';
import { itemIconHTML } from '../ui/icons.js';
import { h, btn, empty, sortedInventory } from '../ui/widgets.js';

// Your home menu: sleep, wardrobe, kitchen shortcut, house upgrades and decorating.
export const HOME_PANELS = {
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
              h('div', { class: 'card' }, [h('div', { class: 'card-icon', text: '🍳' }), h('b', { text: 'Kitchen' }), h('p', { class: 'muted', text: g.home.isBuilt('kitchen') ? 'Your kitchen is right next to your house. Walk up to it and press E.' : 'Your kitchen is in ruins. Bob the builder can fix it — Grandma Rose will tell you more.' }), btn('Cook', () => ui.openPanel('kitchen'), '', !atHome || !g.home.isBuilt('kitchen'))]),
              h('div', { class: 'card' }, [h('div', { class: 'card-icon', text: '💾' }), h('b', { text: 'Save' }), h('p', { class: 'muted', text: 'The game also autosaves.' }), btn('Save now', () => { g.save(true); })]),
            ]),
            !atHome ? h('p', { class: 'muted small', text: 'Sleeping and cooking are done at your homestead on Palmora.' }) : null,
          ]);
        },
      };
    },
  },
};

// ════════════════════════════════════════════════════════════
//  Home
// ════════════════════════════════════════════════════════════
function upgradeTab(ui) {
  const g = ui.game;
  const s = g.state;
  const next = g.home.nextHouse();
  const wrap = h('div', { class: 'upgrade' });
  wrap.append(h('div', { class: 'house-steps' }, HOUSES.map((hs) => h('div', { class: `hstep ${hs.level <= s.house.level ? 'done' : ''} ${next && hs.level === next.level ? 'next' : ''}` }, [h('span', { text: ['⛺', '🛖', '🏠', '🏡', '🏰'][hs.level] }), h('b', { text: hs.name }), h('small', { text: hs.level ? `+${hs.level * 15} ❤ max` : 'Starter home' })]))));
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
      h('p', { class: 'muted', text: `${next.desc} A bigger home gives you +15 max health.` }),
      h('ul', { class: 'reqs' }, reqs.map(([l, have, need, txt]) => h('li', { class: have >= need ? 'ok' : 'no', html: `${have >= need ? '✔' : '✖'} ${l}: <b>${txt}</b> <small>(have ${formatNum(have)})</small>` }))),
      btn('🔨 Build it!', () => { if (g.home.upgrade()) ui.refreshPanel(); }, 'primary big', !g.home.canUpgrade().ok),
      h('p', { class: 'muted small', text: 'Driftwood & stones wash up on beaches daily — or buy them from Bob.' }),
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
  if (!owned.length) wrap.append(empty('No decorations in your bag. Bob sells them on Palmora.', '🌺'));
  const list = h('div', { class: 'shop-list' });
  for (const [id, n] of owned) {
    list.append(h('div', { class: 'shop-row' }, [h('div', { class: 'shop-icon', html: itemIconHTML(id, 40) }), h('div', { class: 'shop-info' }, [h('b', { text: `${ITEMS[id].name} ×${n}` })]), btn('Place', () => g.home.startPlacing(ITEMS[id].decor), 'primary')]));
  }
  wrap.append(list);
  return wrap;
}
