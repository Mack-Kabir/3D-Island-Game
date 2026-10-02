// Rarity tiers. Every tier has a text label and a shape icon so rarity
// never relies on colour alone.
export const TIERS = {
  junk: { name: 'Junk', color: '#9a958a', icon: '✕', weight: 7, xp: 2 },
  common: { name: 'Common', color: '#8796a5', icon: '●', weight: 60, xp: 6 },
  uncommon: { name: 'Uncommon', color: '#3f9e4d', icon: '◆', weight: 26, xp: 12 },
  rare: { name: 'Rare', color: '#2f7fd0', icon: '★', weight: 9, xp: 28 },
  epic: { name: 'Epic', color: '#9150c9', icon: '✦', weight: 2.6, xp: 70 },
  legendary: { name: 'Legendary', color: '#d39410', icon: '♛', weight: 0.55, xp: 180 },
  mythic: { name: 'Mythic', color: '#e0457f', icon: '✺', weight: 0.06, xp: 600 },
};
export const TIER_ORDER = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
export const tierIndex = (t) => TIER_ORDER.indexOf(t);

// where: island ids or '*'. time: any | day | night. weather: any | rain.
// colors: [body, belly, fins/accent]. shape decides the drawn silhouette.
export const FISH = [
  // ── Junk ─────────────────────────────────────────────
  { id: 'old_boot', name: 'Old Boot', tier: 'junk', where: ['*'], time: 'any', weather: 'any', price: 2, w: [0.4, 1.1], diff: 1, colors: ['#6b4f3a', '#4d382a', '#2e2219'], shape: 'boot', desc: 'Someone lost their footing.' },
  { id: 'tin_can', name: 'Rusty Can', tier: 'junk', where: ['*'], time: 'any', weather: 'any', price: 1, w: [0.1, 0.3], diff: 1, colors: ['#9aa3a8', '#c2672f', '#6c7479'], shape: 'can', desc: 'Recycle me, please.' },
  { id: 'seaweed', name: 'Tangled Seaweed', tier: 'junk', where: ['*'], time: 'any', weather: 'any', price: 3, w: [0.2, 0.6], diff: 1, colors: ['#4f8a4a', '#3b6e3a', '#6faa5c'], shape: 'weed', desc: 'Slimy. Nana Leia might want it.' },

  // ── Common ───────────────────────────────────────────
  { id: 'sardine', name: 'Sunny Sardine', tier: 'common', where: ['*'], time: 'any', weather: 'any', price: 10, w: [0.1, 0.3], diff: 1.5, colors: ['#9bb7c9', '#eef3f2', '#6c8ca3'], shape: 'slim', desc: 'Swims in shimmering schools.' },
  { id: 'bream', name: 'Bluegill Bream', tier: 'common', where: ['palmora', 'coralia'], time: 'any', weather: 'any', price: 13, w: [0.3, 1.0], diff: 2, colors: ['#5d8fae', '#f2d68a', '#3d6a87'], shape: 'normal', desc: 'A friendly, chunky reef fish.' },
  { id: 'flounder', name: 'Sandy Flounder', tier: 'common', where: ['palmora', 'skull'], time: 'any', weather: 'any', price: 16, w: [0.5, 2.0], diff: 2, colors: ['#c8ae7f', '#efe2c4', '#9d8259'], shape: 'flat', desc: 'Both eyes on one side. Rude.' },
  { id: 'mullet', name: 'Striped Mullet', tier: 'common', where: ['palmora', 'ember'], time: 'any', weather: 'any', price: 14, w: [0.4, 1.5], diff: 2.2, colors: ['#8a9aa6', '#e9ecea', '#55636e'], shape: 'slim', stripes: true, desc: 'Business in the front.' },
  { id: 'goby', name: 'Spotted Goby', tier: 'common', where: ['coralia', 'skull'], time: 'any', weather: 'any', price: 12, w: [0.05, 0.2], diff: 1.8, colors: ['#d9c48f', '#f6ecd0', '#8a6f3e'], shape: 'normal', desc: 'Small, curious, spotted.' },
  { id: 'herring', name: 'Night Herring', tier: 'common', where: ['*'], time: 'night', weather: 'any', price: 15, w: [0.2, 0.5], diff: 2, colors: ['#5e6fa3', '#d8def0', '#3c4a78'], shape: 'slim', desc: 'Rises to the surface after dark.' },

  // ── Uncommon ─────────────────────────────────────────
  { id: 'snapper', name: 'Red Snapper', tier: 'uncommon', where: ['palmora', 'coralia'], time: 'day', weather: 'any', price: 36, w: [1, 4], diff: 3.2, colors: ['#e0604c', '#f7c6b0', '#b33d33'], shape: 'normal', desc: 'A market favourite.' },
  { id: 'clownfish', name: 'Clownfish', tier: 'uncommon', where: ['coralia'], time: 'day', weather: 'any', price: 40, w: [0.1, 0.3], diff: 3, colors: ['#f08a2c', '#ffffff', '#2a2534'], shape: 'normal', stripes: true, desc: 'Lives in anemones. Very funny.' },
  { id: 'pufferfish', name: 'Pufferfish', tier: 'uncommon', where: ['palmora', 'coralia', 'ember'], time: 'any', weather: 'any', price: 55, w: [0.5, 2], diff: 3.5, colors: ['#e7c66a', '#fbf0c8', '#b38d2e'], shape: 'round', desc: 'Puffs up when nervous. Relatable.' },
  { id: 'tuna', name: 'Yellowfin Tuna', tier: 'uncommon', where: ['palmora', 'skull'], time: 'any', weather: 'any', price: 62, w: [5, 30], diff: 4.2, colors: ['#3c5a82', '#d9e2e6', '#f2c230'], shape: 'normal', desc: 'Fast, strong, delicious.' },
  { id: 'squid', name: 'Moonlit Squid', tier: 'uncommon', where: ['*'], time: 'night', weather: 'any', price: 48, w: [0.5, 3], diff: 3.6, colors: ['#e6b7d6', '#fbe9f3', '#b06b9a'], shape: 'squid', desc: 'Glows faintly under the moon.' },
  { id: 'rainbow_trout', name: 'Rain Trout', tier: 'uncommon', where: ['*'], time: 'any', weather: 'rain', price: 58, w: [0.6, 3], diff: 3.4, colors: ['#8bb87a', '#f5d0c8', '#e07a8f'], shape: 'slim', desc: 'Only bites when it rains.' },
  { id: 'parrotfish', name: 'Parrotfish', tier: 'uncommon', where: ['coralia'], time: 'day', weather: 'any', price: 50, w: [1, 5], diff: 3.4, colors: ['#4fc3a6', '#c9f0e2', '#e86fa3'], shape: 'normal', desc: 'Its poop makes the white sand!' },
  { id: 'grouper', name: 'Spotted Grouper', tier: 'uncommon', where: ['ember', 'skull'], time: 'any', weather: 'any', price: 52, w: [3, 15], diff: 3.8, colors: ['#8a6b4f', '#d8c3a5', '#5a4330'], shape: 'normal', desc: 'Big mouth, bigger appetite.' },

  // ── Rare ─────────────────────────────────────────────
  { id: 'blue_tang', name: 'Blue Tang', tier: 'rare', where: ['coralia'], time: 'day', weather: 'any', price: 95, w: [0.2, 0.6], diff: 4.6, colors: ['#2f6fd6', '#f2d640', '#1b2f6b'], shape: 'normal', desc: 'Keeps swimming, no matter what.' },
  { id: 'mahi', name: 'Mahi-Mahi', tier: 'rare', where: ['palmora', 'coralia'], time: 'day', weather: 'any', price: 115, w: [4, 18], diff: 5, colors: ['#3fb36a', '#f6dd4a', '#2a87c4'], shape: 'normal', desc: 'Dazzling green and gold.' },
  { id: 'lionfish', name: 'Lionfish', tier: 'rare', where: ['coralia', 'ember'], time: 'any', weather: 'any', price: 125, w: [0.5, 1.4], diff: 5.2, colors: ['#e2734f', '#fbe3d2', '#8a2f2a'], shape: 'spiky', stripes: true, desc: 'Gorgeous — and venomous.' },
  { id: 'barracuda', name: 'Barracuda', tier: 'rare', where: ['skull', 'ember'], time: 'any', weather: 'any', price: 135, w: [5, 20], diff: 5.6, colors: ['#8c9cab', '#e8edf0', '#4c5966'], shape: 'long', desc: 'All teeth, no manners.' },
  { id: 'glowfin', name: 'Glowfin Eel', tier: 'rare', where: ['*'], time: 'night', weather: 'any', price: 150, w: [1, 6], diff: 5.4, colors: ['#37d6b5', '#bff8ea', '#1c7a6a'], shape: 'eel', desc: 'Lights up the night water.' },
  { id: 'octopus', name: 'Ink Octopus', tier: 'rare', where: ['coralia', 'ember'], time: 'night', weather: 'any', price: 160, w: [2, 9], diff: 5.8, colors: ['#c4584e', '#f2b6a8', '#7d2e2a'], shape: 'squid', desc: 'Eight arms, zero chill.' },
  { id: 'pearl_oyster', name: 'Pearl Oyster', tier: 'rare', where: ['coralia', 'palmora'], time: 'any', weather: 'any', price: 180, w: [0.3, 0.8], diff: 4.8, colors: ['#a7a1b8', '#f7f2ff', '#6e6585'], shape: 'shell', desc: 'Might hold a pearl inside.' },

  // ── Epic ─────────────────────────────────────────────
  { id: 'swordfish', name: 'Swordfish', tier: 'epic', where: ['ember', 'skull'], time: 'any', weather: 'any', price: 320, w: [40, 200], diff: 7, colors: ['#4a6f96', '#dbe5ee', '#24405e'], shape: 'long', bill: true, desc: 'En garde!' },
  { id: 'manta', name: 'Manta Ray', tier: 'epic', where: ['coralia'], time: 'day', weather: 'any', price: 340, w: [80, 400], diff: 6.8, colors: ['#33424f', '#eef2f4', '#1a2530'], shape: 'ray', desc: 'Glides like a dream.' },
  { id: 'lava_catfish', name: 'Lava Catfish', tier: 'epic', where: ['ember'], time: 'any', weather: 'any', price: 300, w: [8, 30], diff: 7.2, colors: ['#3a2a2a', '#f26b2a', '#ffb347'], shape: 'normal', whiskers: true, desc: 'Warm to the touch. Very warm.' },
  { id: 'ghost_shark', name: 'Ghost Shark', tier: 'epic', where: ['skull'], time: 'night', weather: 'any', price: 380, w: [30, 120], diff: 7.6, colors: ['#c9d6e3', '#f4f8fb', '#8aa0b5'], shape: 'shark', desc: 'Pale as moonlight. Silent hunter.' },
  { id: 'starlight_koi', name: 'Starlight Koi', tier: 'epic', where: ['palmora'], time: 'night', weather: 'any', price: 420, w: [2, 8], diff: 7, colors: ['#f2f0ff', '#ffd3e6', '#ff7a6b'], shape: 'normal', stars: true, desc: 'Said to grant wishes on clear nights.' },
  { id: 'anglerfish', name: 'Abyssal Angler', tier: 'epic', where: ['*'], time: 'night', weather: 'any', price: 360, w: [3, 20], diff: 7.4, colors: ['#3b3248', '#6b5d80', '#ffe36b'], shape: 'angler', desc: 'Follow the light... no, don\'t.' },

  // ── Legendary ────────────────────────────────────────
  { id: 'golden_marlin', name: 'Golden Marlin', tier: 'legendary', where: ['*'], time: 'day', weather: 'any', price: 950, w: [100, 500], diff: 8.6, colors: ['#e8b520', '#fff1b8', '#b07f0c'], shape: 'long', bill: true, desc: 'A living treasure of the sea.' },
  { id: 'coral_dragon', name: 'Coral Dragon', tier: 'legendary', where: ['coralia'], time: 'any', weather: 'rain', price: 1100, w: [20, 90], diff: 8.8, colors: ['#ff6f91', '#ffd0dc', '#7ad6c5'], shape: 'eel', desc: 'Surfaces only in the rain.' },
  { id: 'phoenix_fin', name: 'Phoenix Fin', tier: 'legendary', where: ['ember'], time: 'night', weather: 'any', price: 1200, w: [10, 40], diff: 9, colors: ['#ff5a2a', '#ffd36b', '#c21f2a'], shape: 'normal', flames: true, desc: 'Reborn from the volcano\'s heat.' },
  { id: 'kraken_spawn', name: 'Kraken Spawn', tier: 'legendary', where: ['skull'], time: 'night', weather: 'any', price: 1300, w: [60, 250], diff: 9.2, colors: ['#5b2d6e', '#c48ad6', '#2a1236'], shape: 'squid', desc: 'Just a baby. Somehow terrifying.' },

  // ── Mythic ───────────────────────────────────────────
  { id: 'leviathan', name: 'The Leviathan', tier: 'mythic', where: ['*'], time: 'night', weather: 'rain', price: 6000, w: [900, 3000], diff: 9.8, colors: ['#1f4f6e', '#7fd3c9', '#f2c94c'], shape: 'eel', stars: true, desc: 'The ancient guardian of the archipelago.' },
  { id: 'rainbow_whale', name: 'Aurora Whale', tier: 'mythic', where: ['coralia', 'palmora'], time: 'day', weather: 'any', price: 5000, w: [2000, 9000], diff: 9.6, colors: ['#7aa6ff', '#ffd6f0', '#9bf0c8'], shape: 'whale', desc: 'Seen once a lifetime — if you\'re lucky.' },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
