import { FISH, TIERS, TIER_ORDER, fishPower } from './fish.js';
import { RODS } from './gear.js';
import { ISLANDS } from '../world/islands.js';
import { LEAGUES } from './tournament.js';
import { fishSVG, rarityBadge } from '../ui/icons.js';
import { h, btn } from '../ui/widgets.js';
import { rewardText } from '../story/panel.js';

// Fishing menus: the tournament board, and the Fishdex tab shown in your bag.
export const FISHING_PANELS = {
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
};

export function fishdexTab(ui) {
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
      const when = [f.time !== 'any' ? (f.time === 'night' ? '🌙 Night' : '☀️ Day') : '', f.weather === 'rain' ? '🌧️ Rain' : '', f.boat ? '🚤 Best from a boat' : ''].filter(Boolean).join(' · ');
      const pw = fishPower(f);
      grid.append(
        h('div', { class: `dex ${d ? 'found' : ''}`, style: { '--tier': TIERS[f.tier].color }, 'data-tip-title': d ? f.name : 'Undiscovered fish', 'data-tip': `${d ? f.desc + '\n' : ''}Where: ${where}${when ? '\nWhen: ' + when : ''}\nWorth 🪙 ${f.price}${pw > 1 ? `\nNeeds a rod with power ${pw}+ (${RODS.find((r) => r.power >= pw)?.name ?? 'Golden Rod'})` : ''}` }, [
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
