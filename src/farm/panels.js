import { formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { ANIMALS, FARM_BUILDINGS, FEED_RECIPES, FEEDER_CAPACITY } from './animals.js';
import { QUESTS } from '../story/quests.js';
import { itemIconHTML } from '../ui/icons.js';
import { h, btn } from '../ui/widgets.js';

// Farm menus: Bob's farm-building service and the feeder.
export const FARM_PANELS = {};

// Bob's farm-building service
FARM_PANELS.farmbuild = {
  wide: true,
  render(ui) {
    const g = ui.game;
    const s = g.state;
    return {
      title: "Bob's Farm Buildings",
      icon: '🔨',
      body() {
        const wrap = h('div', { class: 'build-list' });
        wrap.append(h('p', { class: 'muted', text: 'Your kitchen, animal homes and the feeder. Broken buildings are fixed through Bob\'s requests; new ones Bob builds for coins and materials.' }));
        for (const [id, b] of Object.entries(FARM_BUILDINGS)) {
          const st = g.home.buildingState(id);
          const chk = g.home.canConstruct(id);
          const locked = s.level < b.level;
          const cost = b.cost ? [b.cost.coins ? `🪙 ${formatNum(b.cost.coins)}` : '', b.cost.gems ? `💎 ${b.cost.gems}` : '', b.cost.driftwood ? `🪵 ${b.cost.driftwood} (have ${s.inventory.driftwood || 0})` : '', b.cost.stone ? `🪨 ${b.cost.stone} (have ${s.inventory.stone || 0})` : ''].filter(Boolean).join(' · ') : '';
          let action;
          if (st === 'built') action = h('span', { class: 'tag', text: '✓ Built' });
          else if (b.quest) {
            const q = QUESTS[b.quest];
            const active = s.quests.active[b.quest];
            action = h('span', { class: 'lock', text: locked ? `🔒 Lv ${b.level}` : active ? '📜 Quest active' : q.main ? '📜 Story quest' : '📜 Ask Bob' });
            wrap.append(buildRow(b, st, `${b.desc} Rebuilt through Bob's request "${q.title}"${locked ? ` (from level ${b.level})` : ''}.`, '', action));
            continue;
          } else if (locked) action = h('span', { class: 'lock', text: `🔒 Lv ${b.level}` });
          else action = btn(st === 'ruined' ? 'Repair' : 'Build', () => { if (g.home.construct(id)) ui.refreshPanel(); }, chk.ok ? 'primary' : '', !chk.ok, { title: chk.ok ? '' : chk.why });
          wrap.append(buildRow(b, st, b.desc, cost, action, !chk.ok && !locked && st !== 'built' ? chk.why : ''));
        }
        return wrap;
      },
    };
  },
};
function buildRow(b, st, desc, cost, action, why = '') {
  return h('div', { class: `shop-row ${st === 'built' ? 'owned' : ''}` }, [
    h('div', { class: 'shop-icon', html: `<span class="emoji">${b.icon}</span>` }),
    h('div', { class: 'shop-info' }, [h('b', { text: `${b.name}${st === 'ruined' ? ' (broken)' : st === 'none' ? '' : ''}` }), h('div', { class: 'muted small', text: desc }), why ? h('div', { class: 'warnline small', text: why }) : null].filter(Boolean)),
    h('div', { class: 'shop-price', html: cost }),
    action,
  ]);
}

// the feeder at the homestead
FARM_PANELS.feeder = {
  render(ui) {
    const g = ui.game;
    const s = g.state;
    return {
      title: 'Feeder',
      icon: '🪣',
      body() {
        const wrap = h('div', { class: 'feeder' });
        const feed = s.farm.feed || 0;
        const hungry = (s.farm.animals || []).filter((a) => !a.fed && !a.ready && ANIMALS[a.type].feed).length;
        wrap.append(
          h('div', { class: 'dex-progress' }, [h('div', { class: 'bar' }, [h('i', { style: { width: `${(feed / FEEDER_CAPACITY) * 100}%` } }), h('span', { text: `${feed} / ${FEEDER_CAPACITY} feed inside` })])]),
          h('p', { class: 'muted small', text: `Every animal eats 1 feed each time it starts making its product. ${hungry ? `🐾 ${hungry} hungry animal${hungry > 1 ? 's are' : ' is'} waiting!` : ''}` }),
        );
        const bag = s.inventory.animal_feed || 0;
        wrap.append(h('div', { class: 'row' }, [h('span', { html: `🪣 Animal Feed in your bag: <b>${bag}</b>` }), btn('Put it all in', () => { const n = g.home.fillFeeder(bag); if (n) g.ui.toast(`🪣 Added ${n} feed.`, 'good'); ui.refreshPanel(); }, 'primary', !bag || feed >= FEEDER_CAPACITY)]));
        wrap.append(h('h3', { text: 'Make feed from crops' }));
        const list = h('div', { class: 'shop-list' });
        for (const r of FEED_RECIPES) {
          const [[k, n]] = Object.entries(r.inputs);
          const have = s.inventory[k] || 0;
          const locked = s.level < r.level;
          const times = Math.floor(have / n);
          list.append(h('div', { class: `shop-row ${locked ? 'locked' : ''}` }, [
            h('div', { class: 'shop-icon', html: itemIconHTML(k, 36) }),
            h('div', { class: 'shop-info' }, [h('b', { text: `${n}× ${ITEMS[k].name} → ${r.feed} feed` }), h('div', { class: 'muted small', text: `You have ${have}` })]),
            locked ? h('span', { class: 'lock', text: `🔒 Lv ${r.level}` }) : h('div', { class: 'row tight' }, [
              btn('Make', () => { const m = g.home.makeFeed(r, 1); if (m) g.ui.toast(`🪣 +${m} feed`, 'good'); else g.ui.toast(feed + r.feed > FEEDER_CAPACITY ? 'The feeder is full!' : `Need ${n} ${ITEMS[k].name}.`, 'warn'); ui.refreshPanel(); }, times ? 'primary' : '', !times),
              times > 1 ? btn(`×${times}`, () => { const m = g.home.makeFeed(r, times); if (m) g.ui.toast(`🪣 +${m} feed`, 'good'); ui.refreshPanel(); }, '', false) : null,
            ].filter(Boolean)),
          ]));
        }
        wrap.append(list);
        wrap.append(h('p', { class: 'muted small', text: 'You can also buy Animal Feed from Chloe at the fruit stand.' }));
        return wrap;
      },
    };
  },
};
