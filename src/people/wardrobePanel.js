import { escapeHtml } from '../shared/utils.js';
import { PETS } from './pets.js';
import { COSMETICS, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS } from './cosmetics.js';
import { h, btn, price } from '../ui/widgets.js';

// The wardrobe: outfits, hair and pets (the look editor is also used by the character creator).
export const WARDROBE_PANELS = {
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
        footer: h('p', { class: 'muted small', text: 'Drag the scene to spin around. New clothes are sold at Lily\'s Boutique and by Madison at night.' }),
      };
    },
  },
};

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
    const where = c.reward ? 'Special reward' : c.gems && !c.price ? 'Madison / special shops' : 'Lily\'s Boutique';
    grid.append(
      h('button', {
        class: `cos ${on ? 'on' : ''} ${owned ? '' : 'locked'}`,
        'aria-pressed': on ? 'true' : 'false',
        'aria-label': `${c.name}${owned ? '' : ', locked'}`,
        'data-tip-title': c.name,
        'data-tip': owned ? (on ? 'You\'re wearing this.' : 'Click to wear it.') : `Locked — ${where}${c.price ? ` for ${c.price} coins` : c.gems ? ` for ${c.gems} gems` : ''}.`,
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
      h('div', {}, [h('b', { text: p.name }), h('div', { class: 'muted small', text: `${p.perk}${owned ? '' : ' · Sold at Lily\'s Boutique'}` })]),
      !owned ? h('span', { class: 'lock', html: `🔒 💎 ${p.gems}` }) : s.pet === p.id ? h('span', { class: 'tag', text: 'Active' }) : btn('Choose', () => { g.equip('pet', p.id); ui.refreshPanel(); }),
    ]));
  }
  return wrap;
}
