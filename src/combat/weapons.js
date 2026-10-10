// Weapons for fighting pirates (bought from Hank the blacksmith, or quest rewards).
export const WEAPONS = [
  { id: 'fists', name: 'Bare Hands', icon: '✊', dmg: 5, range: 1.7, price: 0, level: 1, color: '#000000', desc: 'Better than nothing.' },
  { id: 'stick', name: 'Driftwood Club', icon: '🏏', dmg: 10, range: 2.0, price: 0, level: 1, color: '#9b7a52', desc: 'A gift from the Mayor.' },
  { id: 'cutlass', name: 'Cutlass', icon: '🗡️', dmg: 17, range: 2.3, price: 650, level: 5, color: '#c8d0d8', desc: 'A proper sailor\'s blade.' },
  { id: 'coral_saber', name: 'Coral Saber', icon: '⚔️', dmg: 26, range: 2.4, price: 2300, level: 10, color: '#ff8fa0', desc: 'Light, sharp and beautiful.' },
  { id: 'ember_blade', name: 'Ember Blade', icon: '🔥', dmg: 38, range: 2.5, price: 6800, level: 15, color: '#ff6a2a', desc: 'Leaves a trail of sparks.' },
  { id: 'trident', name: 'Storm Trident', icon: '🔱', dmg: 52, range: 2.9, price: 0, gems: 220, level: 20, color: '#5fd3e0', desc: 'Commands the tides themselves.' },
];

export const WEAPONS_BY_ID = Object.fromEntries(WEAPONS.map((r) => [r.id, r]));
