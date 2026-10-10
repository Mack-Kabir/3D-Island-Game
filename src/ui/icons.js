import { TIERS } from '../fishing/fish.js';
import { ITEMS } from '../shared/items.js';
import { FISH_BY_ID } from '../fishing/fish.js';
import { escapeHtml } from '../shared/utils.js';

const INK = '#2a2534';
let uid = 0;

/** Hand-drawn style fish illustration as inline SVG. */
export function fishSVG(f, size = 64) {
  const [body, belly, fin] = f.colors || ['#9bb7c9', '#eef3f2', '#6c8ca3'];
  const id = 'f' + uid++;
  const sw = 3;
  const eye = (x, y, r = 4) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 0.8}" cy="${y + 0.3}" r="${r * 0.55}" fill="${INK}"/><circle cx="${x + 0.8 - r * 0.25}" cy="${y - r * 0.22}" r="${r * 0.22}" fill="#fff"/>`;
  // soft top-lit shading shared by every body shape
  const lt = shade(body, 0.4);
  const dk = shade(body, -0.28);
  const defs = `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt}"/><stop offset="0.5" stop-color="${body}"/><stop offset="1" stop-color="${dk}"/></linearGradient></defs>`;
  const fill = `url(#${id}g)`;
  let inner = '';
  switch (f.shape) {
    case 'boot':
      inner = `<path d="M30 20 L52 20 L54 60 L86 64 Q94 68 90 78 L28 78 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M28 70 L90 70" stroke="${fin}" stroke-width="4"/><path d="M34 30 L48 30 M34 40 L48 40" stroke="${belly}" stroke-width="3"/>`;
      break;
    case 'can':
      inner = `<rect x="34" y="22" width="32" height="56" rx="6" fill="${body}" stroke="${INK}" stroke-width="${sw}"/><rect x="34" y="38" width="32" height="20" fill="${belly}" stroke="${INK}" stroke-width="2"/><ellipse cx="50" cy="24" rx="16" ry="4" fill="${fin}" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'mola':
      inner = `<path d="M44 8 L54 30 L46 30 Z M44 92 L54 70 L46 70 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><ellipse cx="44" cy="50" rx="30" ry="26" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/><path d="M72 32 Q84 50 72 68 Q78 50 72 32 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M18 60 Q44 74 70 58" fill="${belly}" opacity="0.8"/><path d="M34 44 q6 6 0 12" stroke="${INK}" stroke-width="2" fill="none" opacity="0.6"/>${eye(24, 44, 4.5)}<path d="M15 52 q3 2 6 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
      break;
    case 'flipflop':
      inner = `<path d="M38 12 Q62 8 66 30 Q70 60 62 84 Q50 94 38 84 Q30 60 32 30 Q32 14 38 12 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M38 18 Q60 16 62 32 Q64 58 58 80 Q50 86 42 80 Q36 58 36 32 Z" fill="${belly}" opacity="0.6"/><path d="M50 30 L36 48 M50 30 L64 46" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M50 30 L36 48 M50 30 L64 46" stroke="${fin}" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="30" r="4" fill="${fin}" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'tire':
      inner = `<circle cx="50" cy="50" r="38" fill="${body}" stroke="${INK}" stroke-width="${sw}"/>${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<path d="M${50 + Math.cos((a * Math.PI) / 180) * 30} ${50 + Math.sin((a * Math.PI) / 180) * 30} L${50 + Math.cos((a * Math.PI) / 180) * 37} ${50 + Math.sin((a * Math.PI) / 180) * 37}" stroke="${fin}" stroke-width="3"/>`).join('')}<circle cx="50" cy="50" r="18" fill="${belly}" stroke="${INK}" stroke-width="${sw}"/><circle cx="50" cy="50" r="10" fill="#9fd4ec" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'net':
      inner = `<path d="M14 30 Q50 10 86 30 Q92 60 70 84 Q50 92 30 84 Q8 60 14 30 Z" fill="${belly}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${[24, 36, 48, 60, 72].map((x) => `<path d="M${x} 20 Q${x + 6} 55 ${x - 2} 88" stroke="${body}" stroke-width="2.5" fill="none"/>`).join('')}${[34, 48, 62, 76].map((y) => `<path d="M14 ${y} Q50 ${y + 8} 88 ${y}" stroke="${body}" stroke-width="2.5" fill="none"/>`).join('')}<circle cx="30" cy="40" r="4" fill="${fin}" stroke="${INK}" stroke-width="1.5"/><circle cx="68" cy="62" r="4" fill="${fin}" stroke="${INK}" stroke-width="1.5"/>`;
      break;
    case 'anchor':
      inner = `<circle cx="50" cy="16" r="8" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="50" cy="16" r="8" fill="none" stroke="${body}" stroke-width="4"/><path d="M50 24 L50 84 M34 34 L66 34 M18 62 Q22 86 50 86 Q78 86 82 62" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M50 24 L50 84 M34 34 L66 34 M18 62 Q22 86 50 86 Q78 86 82 62" fill="none" stroke="${body}" stroke-width="7" stroke-linecap="round"/><path d="M12 58 L22 56 L20 68 Z M88 58 L78 56 L80 68 Z" fill="${body}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="58" cy="54" r="5" fill="${fin}" opacity="0.8"/><circle cx="42" cy="70" r="4" fill="${fin}" opacity="0.8"/>`;
      break;
    case 'pot':
      inner = `<path d="M34 14 L66 14 L64 24 Q86 34 84 58 Q82 84 50 88 Q18 84 16 58 Q14 34 36 24 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M20 50 Q50 58 80 50" stroke="${fin}" stroke-width="4" fill="none"/><path d="M22 62 Q50 70 78 62" stroke="${belly}" stroke-width="3" fill="none"/><path d="M60 30 L54 44 L62 52 L56 66" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
      break;
    case 'weed':
      inner = `<path d="M50 85 Q30 60 46 40 Q58 25 44 12" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M50 85 Q30 60 46 40 Q58 25 44 12" fill="none" stroke="${body}" stroke-width="5" stroke-linecap="round"/><path d="M52 84 Q70 62 58 44 Q50 30 64 18" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M52 84 Q70 62 58 44 Q50 30 64 18" fill="none" stroke="${fin}" stroke-width="4" stroke-linecap="round"/>`;
      break;
    case 'round':
      inner = `${spikes(50, 50, 30, 14, fin)}<circle cx="50" cy="50" r="27" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/><path d="M28 58 Q50 76 72 58" fill="${belly}" stroke="none"/><path d="M78 50 L92 40 L92 60 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${eye(38, 44, 5)}<path d="M26 54 q4 3 8 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
      break;
    case 'flat':
      inner = `<ellipse cx="48" cy="52" rx="34" ry="24" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/><path d="M80 52 L95 40 L95 64 Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${dots(48, 52, body)}${eye(30, 40, 4)}${eye(40, 36, 4)}`;
      break;
    case 'ray':
      inner = `<path d="M50 20 Q90 40 95 55 Q70 60 50 75 Q30 60 5 55 Q10 40 50 20 Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M50 74 Q52 90 60 96" stroke="${INK}" stroke-width="3" fill="none"/><path d="M30 52 Q50 64 70 52" fill="${belly}" opacity="0.6"/>${eye(40, 40, 3)}${eye(60, 40, 3)}`;
      break;
    case 'eel':
      inner = `<path d="M8 55 Q22 35 36 52 T64 52 T88 46" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M8 55 Q22 35 36 52 T64 52 T88 46" fill="none" stroke="${body}" stroke-width="14" stroke-linecap="round"/><path d="M14 58 Q24 46 36 58 T64 58" fill="none" stroke="${belly}" stroke-width="4" stroke-linecap="round"/><path d="M30 44 Q40 36 50 46 T70 44" fill="none" stroke="${fin}" stroke-width="3"/>${eye(84, 44, 4)}`;
      break;
    case 'squid':
      inner = `${[24, 34, 44, 54, 64].map((x, i) => `<path d="M${x + 6} 60 Q${x + (i % 2 ? 0 : 12)} 78 ${x + 4} 92" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x + 6} 60 Q${x + (i % 2 ? 0 : 12)} 78 ${x + 4} 92" stroke="${fin}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('')}<path d="M50 8 Q78 30 72 62 L28 62 Q22 30 50 8 Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${dots(50, 38, belly)}${eye(40, 54, 4)}${eye(60, 54, 4)}`;
      break;
    case 'shell':
      inner = `<path d="M14 64 Q50 2 86 64 Q50 80 14 64 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>${[30, 40, 50, 60, 70].map((x) => `<path d="M50 70 L${x} 30" stroke="${fin}" stroke-width="2"/>`).join('')}<circle cx="50" cy="62" r="7" fill="${belly}" stroke="${INK}" stroke-width="2"/>`;
      break;
    case 'whale':
      inner = `<path d="M8 56 Q12 26 50 26 Q80 26 84 46 L96 34 L94 64 L84 58 Q70 78 40 76 Q10 76 8 56 Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M14 62 Q40 74 74 62" fill="${belly}"/><path d="M40 26 q2 -12 -4 -16 M40 26 q4 -10 10 -14" stroke="${fin}" stroke-width="3" fill="none"/>${eye(24, 48, 3)}`;
      break;
    case 'shark':
      inner = `<path d="M6 54 Q30 34 66 40 L58 20 L76 42 Q86 44 90 50 L98 36 L96 64 L88 58 Q70 70 30 66 Q12 64 6 54 Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M12 58 Q40 70 80 58" fill="${belly}"/>${eye(22, 50, 3)}<path d="M30 48 l0 8 M34 47 l0 8 M38 47 l0 8" stroke="${INK}" stroke-width="1.5"/>`;
      break;
    case 'angler':
      inner = `<path d="M50 30 Q60 6 30 12" stroke="${INK}" stroke-width="3" fill="none"/><circle cx="30" cy="12" r="6" fill="${fin}" stroke="${INK}" stroke-width="2"/><ellipse cx="52" cy="54" rx="34" ry="26" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/><path d="M84 54 L98 42 L98 66 Z" fill="${body}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M20 60 L30 54 L36 64 L42 54 L48 64 L54 56" stroke="#fff" stroke-width="2.5" fill="none"/>${eye(36, 44, 5)}`;
      break;
    default: {
      const long = f.shape === 'long' || f.shape === 'slim';
      const rx = long ? 36 : 30;
      const ry = f.shape === 'slim' ? 13 : long ? 14 : 20;
      const cx = 46;
      const top = 50 - ry;
      const tailX = cx + rx - 6;
      const scales = [];
      for (let row = -1; row <= 1; row++) {
        const y = 50 + row * ry * 0.42;
        for (let x = cx - rx + 22 + (row & 1) * 3.5; x < cx + rx - 8; x += 7) scales.push(`<path d="M${x} ${y - 3.2} q3.4 3.2 0 6.4" stroke="${dk}" stroke-width="1.3" fill="none" opacity="0.45"/>`);
      }
      inner = `
        <path d="M${tailX} 50 L96 ${50 - ry - 4} Q90 50 96 ${50 + ry + 4} Z" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M${tailX + 4} 50 L93 ${50 - ry * 0.8} M${tailX + 4} 50 L91 50 M${tailX + 4} 50 L93 ${50 + ry * 0.8}" stroke="${INK}" stroke-width="1.2" opacity="0.45"/>
        <path d="M${cx - 12} ${top + 3} Q${cx + 2} ${top - 16} ${cx + 18} ${top + 2}" fill="${fin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M${cx - 6} ${top + 2} L${cx - 2} ${top - 8} M${cx + 2} ${top + 1} L${cx + 6} ${top - 9} M${cx + 10} ${top + 1} L${cx + 12} ${top - 6}" stroke="${INK}" stroke-width="1.2" opacity="0.45"/>
        ${f.shape === 'spiky' ? spikes(cx, top, 1, 7, fin, true) : ''}
        <ellipse cx="${cx}" cy="50" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>
        <clipPath id="${id}"><ellipse cx="${cx}" cy="50" rx="${rx - 1.5}" ry="${ry - 1.5}"/></clipPath>
        <g clip-path="url(#${id})">
          <ellipse cx="${cx}" cy="${50 + ry * 0.7}" rx="${rx}" ry="${ry * 0.6}" fill="${belly}"/>
          ${scales.join('')}
          ${f.stripes ? [0.3, 0.55, 0.8].map((t) => `<rect x="${cx - rx + rx * 2 * t - 4}" y="20" width="7" height="60" fill="${fin}" opacity="0.9"/>`).join('') : ''}
          ${f.stars ? [[30, 44], [50, 40], [58, 56], [40, 58]].map(([x, y]) => `<path d="M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z" fill="#fff6c0"/>`).join('') : ''}
          ${f.flames ? `<path d="M${cx - 10} 70 q6 -18 12 -4 q4 -14 12 -2 q4 -10 10 4 L${cx + 30} 80 L${cx - 20} 80 Z" fill="#ffd36b" opacity="0.9"/>` : ''}
          <ellipse cx="${cx - 2}" cy="${50 - ry * 0.55}" rx="${rx * 0.55}" ry="${Math.max(2.5, ry * 0.16)}" fill="#fff" opacity="0.35"/>
        </g>
        <path d="M${cx - rx + 18} ${50 - ry * 0.62} q6 ${ry * 0.62} 0 ${ry * 1.24}" stroke="${INK}" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M${cx - 2} ${50 + ry - 2} q8 10 14 2" fill="${fin}" stroke="${INK}" stroke-width="2.5"/>
        <path d="M${cx - rx + 26} 54 q12 -3 16 8 q-11 3 -16 -8 z" fill="${fin}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        ${f.bill ? `<path d="M${cx - rx + 2} 48 L2 46 L${cx - rx + 2} 52 Z" fill="${fin}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` : ''}
        ${f.whiskers ? `<path d="M${cx - rx + 6} 54 q-10 4 -14 12 M${cx - rx + 8} 56 q-6 8 -6 16" stroke="${INK}" stroke-width="2" fill="none"/>` : ''}
        ${eye(cx - rx + 12, 45, 5)}
        <path d="M${cx - rx + 3} 54 q4 2 7 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">${defs}${inner}</svg>`;
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
/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
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

const SELL_WHERE = {
  fish: 'Sell to Megan at the Palmora fish market (or Ross, Sarah, Grace, Pete, Madison).',
  fruit: 'Sell to Chloe at the fruit stand. Can be cooked into food.',
  crop: 'Grown on your farm. Cook it in your kitchen, or sell it to Chloe.',
  animal: 'From your farm animals. Cook with it in your kitchen, or sell it to Chloe.',
  ingredient: 'Made in your kitchen. Used in bigger recipes — or sell it to Chloe.',
  farm: 'Farm supplies: use them at your homestead.',
  product: 'Sell to Chloe at the fruit stand. Eat from your Bag to heal.',
  collectible: 'Sell to Chloe at the fruit stand.',
  material: 'Used to build your house. Bob buys extras.',
  treasure: 'Sell to Hank (Ember Isle), Pete (Skull Cay) or Madison (night).',
  seed: 'Plant it on a soil patch at your homestead.',
  bait: 'Used up one per cast. Makes fish bite faster and rarer.',
  decor: 'Open your Bag and choose "Place at home".',
  tool: 'A tool — kept forever.',
  special: 'Open it from your Bag.',
  trophy: 'A trophy to be proud of.',
};

/** Tooltip text for any inventory item. */
export function itemTip(id, count = null) {
  const it = ITEMS[id];
  if (!it) return { title: id, desc: '' };
  const lines = [];
  if (it.type === 'fish') lines.push(`${TIERS[it.tier].icon} ${TIERS[it.tier].name} fish`);
  if (it.desc) lines.push(it.desc);
  if (it.sell) lines.push(`Worth 🪙 ${it.sell} each${count ? ` · You have ${count}` : ''}`);
  if (it.heal) lines.push(`Heals ❤ ${it.heal}`);
  if (SELL_WHERE[it.type]) lines.push(SELL_WHERE[it.type]);
  return { title: it.name, desc: lines.join('\n') };
}

export function tipAttrs(tip) {
  return { 'data-tip-title': tip.title, 'data-tip': tip.desc };
}
