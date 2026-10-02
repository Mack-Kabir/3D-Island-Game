import { TIERS } from '../data/fish.js';
import { ITEMS } from '../data/items.js';
import { FISH_BY_ID } from '../data/fish.js';
import { escapeHtml } from '../core/utils.js';

const INK = '#2a2534';
let uid = 0;

/** Hand-drawn style fish illustration as inline SVG. */
export function fishSVG(f, size = 64) {
  const [body, belly, fin] = f.colors || ['#9bb7c9', '#eef3f2', '#6c8ca3'];
  const id = 'f' + uid++;
  const sw = 3;
  const eye = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 0.8}" cy="${y}" r="${r * 0.5}" fill="${INK}"/>`;
  let inner = '';
  switch (f.shape) {
    case 'boot':
      inner = `<path d="M30 20 L52 20 L54 60 L86 64 Q94 68 90 78 L28 78 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M28 70 L90 70" stroke="${fin}" stroke-width="4"/><path d="M34 30 L48 30 M34 40 L48 40" stroke="${belly}" stroke-width="3"/>`;
      break;
    case 'can':
      inner = `<rect x="34" y="22" width="32" height="56" rx="6" fill="${body}" stroke="${INK}" stroke-width="${sw}"/><rect x="34" y="38" width="32" height="20" fill="${belly}" stroke="${INK}" stroke-width="2"/><ellipse cx="50" cy="24" rx="16" ry="4" fill="${fin}" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'weed':
      inner = `<path d="M50 85 Q30 60 46 40 Q58 25 44 12" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M50 85 Q30 60 46 40 Q58 25 44 12" fill="none" stroke="${body}" stroke-width="5" stroke-linecap="round"/><path d="M52 84 Q70 62 58 44 Q50 30 64 18" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M52 84 Q70 62 58 44 Q50 30 64 18" fill="none" stroke="${fin}" stroke-width="4" stroke-linecap="round"/>`;
      break;
    case 'round':
      inner = `${spikes(50, 50, 30, 14, fin)}<circle cx="50" cy="50" r="27" fill="${body}" stroke="${INK}" stroke-width="${sw}"/><path d="M28 58 Q50 76 72 58" fill="${belly}" stroke="none"/><path d="M78 50 L92 40 L92 60 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${eye(38, 44, 5)}<path d="M26 54 q4 3 8 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
      break;
    case 'flat':
      inner = `<ellipse cx="48" cy="52" rx="34" ry="24" fill="${body}" stroke="${INK}" stroke-width="${sw}"/><path d="M80 52 L95 40 L95 64 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${dots(48, 52, body)}${eye(30, 40, 4)}${eye(40, 36, 4)}`;
      break;
    case 'ray':
      inner = `<path d="M50 20 Q90 40 95 55 Q70 60 50 75 Q30 60 5 55 Q10 40 50 20 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M50 74 Q52 90 60 96" stroke="${INK}" stroke-width="3" fill="none"/><path d="M30 52 Q50 64 70 52" fill="${belly}" opacity="0.6"/>${eye(40, 40, 3)}${eye(60, 40, 3)}`;
      break;
    case 'eel':
      inner = `<path d="M8 55 Q22 35 36 52 T64 52 T88 46" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M8 55 Q22 35 36 52 T64 52 T88 46" fill="none" stroke="${body}" stroke-width="14" stroke-linecap="round"/><path d="M14 58 Q24 46 36 58 T64 58" fill="none" stroke="${belly}" stroke-width="4" stroke-linecap="round"/><path d="M30 44 Q40 36 50 46 T70 44" fill="none" stroke="${fin}" stroke-width="3"/>${eye(84, 44, 4)}`;
      break;
    case 'squid':
      inner = `${[24, 34, 44, 54, 64].map((x, i) => `<path d="M${x + 6} 60 Q${x + (i % 2 ? 0 : 12)} 78 ${x + 4} 92" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x + 6} 60 Q${x + (i % 2 ? 0 : 12)} 78 ${x + 4} 92" stroke="${fin}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('')}<path d="M50 8 Q78 30 72 62 L28 62 Q22 30 50 8 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${dots(50, 38, belly)}${eye(40, 54, 4)}${eye(60, 54, 4)}`;
      break;
    case 'shell':
      inner = `<path d="M14 64 Q50 2 86 64 Q50 80 14 64 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${[30, 40, 50, 60, 70].map((x) => `<path d="M50 70 L${x} 30" stroke="${fin}" stroke-width="2"/>`).join('')}<circle cx="50" cy="62" r="7" fill="${belly}" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'whale':
      inner = `<path d="M8 56 Q12 26 50 26 Q80 26 84 46 L96 34 L94 64 L84 58 Q70 78 40 76 Q10 76 8 56 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M14 62 Q40 74 74 62" fill="${belly}"/><path d="M40 26 q2 -12 -4 -16 M40 26 q4 -10 10 -14" stroke="${fin}" stroke-width="3" fill="none"/>${eye(24, 48, 3)}`;
      break;
    case 'shark':
      inner = `<path d="M6 54 Q30 34 66 40 L58 20 L76 42 Q86 44 90 50 L98 36 L96 64 L88 58 Q70 70 30 66 Q12 64 6 54 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M12 58 Q40 70 80 58" fill="${belly}"/>${eye(22, 50, 3)}<path d="M30 48 l0 8 M34 47 l0 8 M38 47 l0 8" stroke="${INK}" stroke-width="1.5"/>`;
      break;
    case 'angler':
      inner = `<path d="M50 30 Q60 6 30 12" stroke="${INK}" stroke-width="3" fill="none"/><circle cx="30" cy="12" r="6" fill="${fin}" stroke="${INK}" stroke-width="2"/><ellipse cx="52" cy="54" rx="34" ry="26" fill="${body}" stroke="${INK}" stroke-width="${sw}"/><path d="M84 54 L98 42 L98 66 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M20 60 L30 54 L36 64 L42 54 L48 64 L54 56" stroke="#fff" stroke-width="2.5" fill="none"/>${eye(36, 44, 5)}`;
      break;
    default: {
      const long = f.shape === 'long' || f.shape === 'slim';
      const rx = long ? 36 : 30;
      const ry = f.shape === 'slim' ? 13 : long ? 14 : 20;
      const cx = 46;
      inner = `
        <path d="M${cx + rx - 6} 50 L96 ${50 - ry - 4} Q90 50 96 ${50 + ry + 4} Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M${cx - 12} ${50 - ry + 3} Q${cx + 2} ${50 - ry - 16} ${cx + 18} ${50 - ry + 2}" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
        ${f.shape === 'spiky' ? spikes(cx, 50 - ry, 1, 7, fin, true) : ''}
        <ellipse cx="${cx}" cy="50" rx="${rx}" ry="${ry}" fill="${body}" stroke="${INK}" stroke-width="${sw}"/>
        <clipPath id="${id}"><ellipse cx="${cx}" cy="50" rx="${rx - 1.5}" ry="${ry - 1.5}"/></clipPath>
        <g clip-path="url(#${id})">
          <ellipse cx="${cx}" cy="${50 + ry * 0.7}" rx="${rx}" ry="${ry * 0.6}" fill="${belly}"/>
          ${f.stripes ? [0.3, 0.55, 0.8].map((t) => `<rect x="${cx - rx + rx * 2 * t - 4}" y="20" width="7" height="60" fill="${fin}" opacity="0.9"/>`).join('') : ''}
          ${f.stars ? [[30, 44], [50, 40], [58, 56], [40, 58]].map(([x, y]) => `<path d="M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z" fill="#fff6c0"/>`).join('') : ''}
          ${f.flames ? `<path d="M${cx - 10} 70 q6 -18 12 -4 q4 -14 12 -2 q4 -10 10 4 L${cx + 30} 80 L${cx - 20} 80 Z" fill="#ffd36b" opacity="0.9"/>` : ''}
        </g>
        <path d="M${cx - 2} ${50 + ry - 2} q8 10 14 2" fill="${fin}" stroke="${INK}" stroke-width="2.5"/>
        ${f.bill ? `<path d="M${cx - rx + 2} 48 L2 46 L${cx - rx + 2} 52 Z" fill="${fin}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` : ''}
        ${f.whiskers ? `<path d="M${cx - rx + 6} 54 q-10 4 -14 12 M${cx - rx + 8} 56 q-6 8 -6 16" stroke="${INK}" stroke-width="2" fill="none"/>` : ''}
        ${eye(cx - rx + 13, 45, 4.5)}
        <path d="M${cx - rx + 3} 54 q4 2 7 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
    }
  }
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">${inner}</svg>`;
}

function spikes(cx, cy, r, n, color, top = false) {
  let s = '';
  for (let i = 0; i < n; i++) {
    if (top) {
      // dorsal spines fanning up from the back
      const x = cx - 14 + i * 5;
      s += `<path d="M${x} ${cy + 4} L${x - 3 + i} ${cy - 16}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    } else {
      const a = (i / n) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * (r - 4);
      const y1 = cy + Math.sin(a) * (r - 4);
      const x2 = cx + Math.cos(a) * (r + 7);
      const y2 = cy + Math.sin(a) * (r + 7);
      s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color || INK}" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  return s;
}
function dots(cx, cy, c) {
  return [[-12, -6], [6, -8], [14, 6], [-4, 8], [-18, 4]].map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="3" fill="${c}" opacity="0.6" stroke="${INK}" stroke-width="1"/>`).join('');
}

export function rarityBadge(tier) {
  const t = TIERS[tier];
  return `<span class="rarity" style="--tier:${t.color}"><span aria-hidden="true">${t.icon}</span> ${t.name}</span>`;
}

/** HTML for an inventory icon. */
export function itemIconHTML(id, size = 40) {
  const it = ITEMS[id];
  if (!it) return '❔';
  if (it.type === 'fish') return fishSVG(FISH_BY_ID[it.fish], size);
  return `<span class="emoji" style="font-size:${Math.round(size * 0.72)}px" aria-hidden="true">${escapeHtml(it.icon)}</span>`;
}
