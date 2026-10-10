import { escapeHtml, formatNum } from '../shared/utils.js';
import { ITEMS } from '../shared/items.js';
import { ANIMALS, FARM_BUILDINGS } from '../farm/animals.js';
import { RODS_BY_ID } from '../fishing/gear.js';
import { COSMETICS } from '../people/cosmetics.js';
import { QUESTS } from './quests.js';
import { NPCS } from '../people/npcs.js';
import { ISLANDS } from '../world/islands.js';
import { h, empty } from '../ui/widgets.js';

// The quest log menu.
export const STORY_PANELS = {
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
};

function questCard(g, q, st) {
  const objs = q.objectives.map((o, i) => {
    const done = i < st.step;
    const cur = i === st.step;
    const count = o.count ?? 1;
    return h('li', { class: done ? 'done' : cur ? 'cur' : 'todo', html: `${done ? '✔' : cur ? '➜' : '○'} ${escapeHtml(o.text)}${cur && count > 1 ? ` <b>${Math.min(st.progress, count)}/${count}</b>` : ''}${cur && o.hint ? `<div class="trk-hint">💡 ${escapeHtml(o.hint)}</div>` : ''}` });
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
  if (r.tent) parts.push('⛺ A tent');
  if (r.buildings) parts.push(...r.buildings.map((x) => `🔨 ${FARM_BUILDINGS[x].name}`));
  if (r.animals) for (const [k, n] of Object.entries(r.animals)) parts.push(`${ANIMALS[k].icon} ${n} ${ANIMALS[k].name}${n > 1 ? 's' : ''}`);
  return parts.join(' · ');
}
