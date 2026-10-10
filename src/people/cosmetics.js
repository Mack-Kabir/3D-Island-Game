export const SKIN_TONES = ['#f7dcc8', '#efc3a0', '#dca37c', '#bd7c53', '#8f5a3a', '#5f3b27'];
export const HAIR_COLORS = ['#2b2222', '#5a3825', '#9a4f2a', '#d9a441', '#efe1b8', '#c2463b', '#7d5ba6', '#3e7c9b', '#eef0f2', '#e88fb0', '#5aa36f'];
export const EYE_COLORS = ['#2a2534', '#4a2f22', '#2f5f8a', '#3f7a4a', '#7a4fa0'];
export const HAIR_STYLES = [
  { id: 'short', name: 'Short' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'curly', name: 'Curly' },
  { id: 'bob', name: 'Bob' },
  { id: 'long', name: 'Long' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Bun' },
  { id: 'pigtails', name: 'Pigtails' },
];

// slot: top | bottom | hat | acc
// top: sleeve short|long|none, pattern optional
// bottom: kind shorts|pants|skirt|dress (dress also recolours the torso)
export const COSMETICS = {
  // Tops ────────────────────────────────
  tee_white: { slot: 'top', name: 'Plain Tee', color: '#f2efe6', sleeve: 'short', price: 0 },
  tee_teal: { slot: 'top', name: 'Lagoon Tee', color: '#58b4a5', sleeve: 'short', price: 0 },
  tee_coral: { slot: 'top', name: 'Coral Tee', color: '#f0846a', sleeve: 'short', price: 0 },
  tank_sun: { slot: 'top', name: 'Sunny Tank', color: '#f7c95c', sleeve: 'none', price: 0 },
  blouse_lilac: { slot: 'top', name: 'Lilac Blouse', color: '#b9a3e0', sleeve: 'short', price: 0 },
  sailor: { slot: 'top', name: 'Sailor Stripes', color: '#f4f1e8', sleeve: 'long', pattern: ['stripes', '#3f6fa8'], price: 160 },
  hawaiian_red: { slot: 'top', name: 'Aloha Shirt (Red)', color: '#d9534f', sleeve: 'short', pattern: ['floral', '#ffffff', '#ffd36b'], price: 240 },
  hawaiian_blue: { slot: 'top', name: 'Aloha Shirt (Sea)', color: '#2f7fa8', sleeve: 'short', pattern: ['floral', '#ffd0dc', '#ffffff'], price: 240 },
  hoodie_green: { slot: 'top', name: 'Palm Hoodie', color: '#6fa36a', sleeve: 'long', price: 300 },
  dots_pink: { slot: 'top', name: 'Polka Top', color: '#f2a2b8', sleeve: 'short', pattern: ['dots', '#ffffff'], price: 200 },
  plaid_flannel: { slot: 'top', name: 'Flannel', color: '#b94a3e', sleeve: 'long', pattern: ['plaid', '#2a2534'], price: 320 },
  explorer: { slot: 'top', name: 'Explorer Shirt', color: '#c8b48a', sleeve: 'short', price: 420 },
  captain_coat: { slot: 'top', name: 'Captain\'s Coat', color: '#24406e', sleeve: 'long', trim: '#f2c230', price: 0, gems: 30 },
  pirate_vest: { slot: 'top', name: 'Pirate Vest', color: '#5a2a2a', sleeve: 'none', trim: '#e8d8b0', price: 0, gems: 25 },
  starry_robe: { slot: 'top', name: 'Starry Robe', color: '#2a2f6b', sleeve: 'long', pattern: ['dots', '#ffe48a'], price: 0, gems: 45 },
  ember_jacket: { slot: 'top', name: 'Ember Jacket', color: '#d9542a', sleeve: 'long', trim: '#2a2534', price: 1500 },

  // Bottoms ─────────────────────────────
  shorts_khaki: { slot: 'bottom', name: 'Khaki Shorts', color: '#c8b48a', kind: 'shorts', price: 0 },
  shorts_denim: { slot: 'bottom', name: 'Denim Shorts', color: '#4f6f9a', kind: 'shorts', price: 0 },
  skirt_teal: { slot: 'bottom', name: 'Lagoon Skirt', color: '#58b4a5', kind: 'skirt', price: 0 },
  pants_cargo: { slot: 'bottom', name: 'Cargo Pants', color: '#6b6f4a', kind: 'pants', price: 0 },
  sundress_yellow: { slot: 'bottom', name: 'Sundress', color: '#f7c95c', kind: 'dress', price: 260 },
  skirt_floral: { slot: 'bottom', name: 'Floral Skirt', color: '#e86f8a', kind: 'skirt', pattern: ['floral', '#ffffff', '#ffd36b'], price: 220 },
  sarong_blue: { slot: 'bottom', name: 'Ocean Sarong', color: '#2f7fa8', kind: 'skirt', pattern: ['stripes', '#7fd3c9'], price: 200 },
  pants_white: { slot: 'bottom', name: 'Linen Pants', color: '#efe8d6', kind: 'pants', price: 180 },
  board_shorts: { slot: 'bottom', name: 'Board Shorts', color: '#f0846a', kind: 'shorts', pattern: ['floral', '#ffffff', '#f7c95c'], price: 180 },
  dress_mermaid: { slot: 'bottom', name: 'Mermaid Gown', color: '#3fb9b0', kind: 'dress', pattern: ['dots', '#c9f0e2'], price: 0, gems: 40 },
  pirate_pants: { slot: 'bottom', name: 'Pirate Breeches', color: '#3a3040', kind: 'pants', price: 0, gems: 15 },

  // Hats ────────────────────────────────
  straw_hat: { slot: 'hat', name: 'Straw Hat', color: '#e8c97a', price: 0 },
  cap_red: { slot: 'hat', name: 'Red Cap', color: '#d9534f', price: 90 },
  bandana_blue: { slot: 'hat', name: 'Bandana', color: '#3f6fa8', price: 70 },
  flower_crown: { slot: 'hat', name: 'Flower Crown', color: '#f2a2b8', price: 150 },
  beanie: { slot: 'hat', name: 'Beanie', color: '#7d5ba6', price: 110 },
  sun_visor: { slot: 'hat', name: 'Sun Visor', color: '#f7f4ea', price: 80 },
  captain_hat: { slot: 'hat', name: 'Captain\'s Hat', color: '#24406e', price: 0, gems: 20 },
  pirate_hat: { slot: 'hat', name: 'Tricorn', color: '#2a2534', price: 0, gems: 35 },
  crown: { slot: 'hat', name: 'Champion Crown', color: '#f2c230', price: 0, reward: true },
  blackfin_hat: { slot: 'hat', name: 'Blackfin\'s Hat', color: '#1d1a24', price: 0, reward: true },
  witch_hat: { slot: 'hat', name: 'Moon Witch Hat', color: '#3a2f6b', price: 0, gems: 50 },

  // Accessories ─────────────────────────
  sunglasses: { slot: 'acc', name: 'Sunglasses', color: '#2a2534', price: 120 },
  lei: { slot: 'acc', name: 'Flower Lei', color: '#f2a2b8', price: 90 },
  backpack: { slot: 'acc', name: 'Adventure Pack', color: '#c26a3a', price: 220 },
  scarf: { slot: 'acc', name: 'Sea Scarf', color: '#58b4a5', price: 140 },
  eyepatch: { slot: 'acc', name: 'Eyepatch', color: '#1d1a24', price: 0, gems: 10 },
  wings: { slot: 'acc', name: 'Fairy Wings', color: '#c9f0ff', price: 0, gems: 60 },
};
for (const [id, c] of Object.entries(COSMETICS)) c.id = id;

export const FREE_COSMETICS = Object.values(COSMETICS).filter((c) => !c.price && !c.gems && !c.reward).map((c) => c.id);

export const DEFAULT_LOOKS = {
  m: { gender: 'm', skin: 1, hair: 'short', hairColor: 1, eyes: 0, top: 'tee_teal', bottom: 'shorts_khaki', hat: null, acc: null, shoes: '#6b4f3a' },
  f: { gender: 'f', skin: 1, hair: 'ponytail', hairColor: 2, eyes: 0, top: 'tank_sun', bottom: 'skirt_teal', hat: null, acc: null, shoes: '#c26a3a' },
};
