import { el } from '../core/utils.js';
import { DEFAULT_LOOKS } from '../data/cosmetics.js';
import { hasSave, loadGame, deleteSave } from '../systems/save.js';
import { lookEditor } from './panels.js';

/** Title screen over the live, slowly orbiting island (day/night fast-forward). */
export function showTitle(game) {
  const ui = game.ui;
  const host = ui.screenHost;
  host.innerHTML = '';
  const save = loadGame();
  const leaves = el('div', { class: 'title-leaves', 'aria-hidden': 'true' }, Array.from({ length: 10 }, (_, i) => el('i', { style: { left: `${i * 10 + Math.random() * 6}%`, animationDelay: `${-Math.random() * 12}s`, animationDuration: `${10 + Math.random() * 8}s` } })));
  const menu = el('div', { class: 'title-menu', role: 'menu' });
  const add = (label, fn, cls = '') => {
    const b = el('button', { class: `btn big ${cls}`, role: 'menuitem', html: label, onclick: () => { game.audio.unlock(); game.audio.sfx('click'); fn(); } });
    menu.append(b);
    return b;
  };
  if (save) add(`▶ Continue <small>${escapeName(save.name)} · Lv ${save.level} · Day ${save.time.day}</small>`, () => game.continueGame(), 'primary');
  add(save ? '✦ New Game' : '▶ Play', () => {
    if (save && !confirmNew()) return;
    showCreator(game);
  }, save ? '' : 'primary');
  add('⚙️ Settings', () => ui.openPanel('settings'));
  add('❔ How to Play', () => ui.openPanel('help'));
  const screen = el('div', { class: 'screen title' }, [
    leaves,
    el('div', { class: 'title-card' }, [
      el('div', { class: 'logo', 'aria-label': 'Tidewander' }, [el('span', { class: 'logo-word', text: 'Tidewander' }), el('span', { class: 'logo-sub', text: 'An Island Life Adventure' })]),
      menu,
      el('p', { class: 'title-tip', text: pickTip() }),
    ]),
    el('div', { class: 'title-foot', html: 'Fish · Farm · Build · Sail · Fight pirates · Make friends' }),
  ]);
  host.append(screen);
  requestAnimationFrame(() => menu.querySelector('button')?.focus());

  function confirmNew() {
    return window.confirm('Start a new game? Your current save will be replaced once you begin.');
  }
}

function escapeName(s) {
  return String(s).replace(/[<>&]/g, '');
}

const TIPS = [
  'Tip: Rare fish come out at night (7 PM – 7 AM).',
  'Tip: Rain brings out fish you won\'t see on sunny days.',
  'Tip: A perfect catch earns bonus coins.',
  'Tip: Cooked food sells for far more than raw ingredients.',
  'Tip: Pets give real bonuses — a kitten boosts your luck!',
  'Tip: Jump with Space to dodge pirate attacks.',
  'Tip: Bottles on the beach reveal hidden treasure.',
];
function pickTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

/** Character creator — male/female, looks and starting outfit with a live 3D preview. */
export function showCreator(game) {
  const ui = game.ui;
  const host = ui.screenHost;
  host.innerHTML = '';
  let look = { ...DEFAULT_LOOKS.f };
  let gender = look.gender;
  let name = '';
  game.beginCreator(look);
  const nameInput = el('input', { type: 'text', maxlength: 14, placeholder: 'Your name', 'aria-label': 'Character name', value: name, oninput: (e) => (name = e.target.value) });
  const editorHost = el('div');
  const render = () => {
    editorHost.innerHTML = '';
    editorHost.append(
      lookEditor(ui, { ...look }, (l) => {
        const genderChanged = l.gender !== gender;
        if (genderChanged) {
          // swap to the gender's default outfit & hair, keep chosen skin
          l = { ...DEFAULT_LOOKS[l.gender], skin: l.skin, eyes: l.eyes };
          gender = l.gender;
        }
        look = l;
        game.previewLook(look);
        if (genderChanged) render();
      }, { gender: true, outfits: true }),
    );
  };
  render();
  const start = el('button', {
    class: 'btn primary big',
    html: '🌴 Start Adventure',
    onclick: () => {
      const n = name.trim() || (look.gender === 'f' ? 'Leilani' : 'Kai');
      deleteSave();
      game.startNewGame(n, look);
    },
  });
  const screen = el('div', { class: 'screen creator' }, [
    el('div', { class: 'panel creator-panel', role: 'dialog', 'aria-label': 'Create your character' }, [
      el('div', { class: 'panel-head' }, [el('span', { class: 'panel-icon', text: '🧑‍🎨' }), el('h2', { text: 'Create your islander' }), el('button', { class: 'close', 'aria-label': 'Back to title', html: '✕', onclick: () => game.backToTitle() })]),
      el('div', { class: 'panel-body' }, [el('div', { class: 'field' }, [el('span', { class: 'flabel', text: 'Name' }), nameInput]), editorHost]),
      el('div', { class: 'panel-foot' }, [el('p', { class: 'muted small', text: 'Drag the scene to rotate. You can change your style any time with C.' }), start]),
    ]),
  ]);
  host.append(screen);
  requestAnimationFrame(() => nameInput.focus());
}

export function hideScreens(game) {
  game.ui.screenHost.innerHTML = '';
}

export { hasSave };
