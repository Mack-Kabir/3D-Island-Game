export const ISLANDS = {
  palmora: {
    id: 'palmora', name: 'Palmora', subtitle: 'Home Island', seed: 1337, radius: 96, base: 2.4, hill: 4.5,
    peaks: [{ x: 34, z: -38, h: 11, s: 16 }, { x: -20, z: -52, h: 6, s: 14 }],
    palette: { sand: '#ecdcae', grass: '#93c27c', grass2: '#74a86c', rock: '#8f93a0', path: '#dcc597', seabed: '#5fb0a6', deep: '#2a7090', shallow: '#86dccf' },
    boat: null, chart: { x: 30, y: 58 }, pirates: 0, travelHours: 1,
    blurb: 'Your sunny home. Village, market, farm and friends.',
  },
  coralia: {
    id: 'coralia', name: 'Coralia Reef', subtitle: 'Tournament Island', seed: 2024, radius: 72, base: 1.8, hill: 2.5, stretch: 0.8,
    peaks: [{ x: -14, z: -18, h: 5, s: 12 }],
    palette: { sand: '#f6ead0', grass: '#a5d08a', grass2: '#86bd78', rock: '#b3a99a', path: '#eadbb4', seabed: '#6fd0c4', deep: '#2585a8', shallow: '#8ff0e0' },
    boat: 'raft', chart: { x: 70, y: 40 }, pirates: 0, travelHours: 1,
    blurb: 'Crystal lagoons, reef fish and the daily fishing tournament.',
  },
  ember: {
    id: 'ember', name: 'Ember Isle', subtitle: 'Volcanic Island', seed: 777, radius: 100, base: 2.2, hill: 4,
    peaks: [{ x: 0, z: -12, h: 34, s: 22, crater: 14 }],
    peakAbove: 14,
    palette: { sand: '#8a8078', grass: '#7f9a62', grass2: '#62804f', rock: '#5e5860', path: '#a89580', seabed: '#3f6f74', deep: '#1f4f66', shallow: '#5fb0a6', peak: '#4a4048' },
    boat: 'sailboat', chart: { x: 62, y: 80 }, pirates: 0, travelHours: 2,
    blurb: 'Black sand, hot springs and fiery fish. The best blacksmith lives here.',
  },
  skull: {
    id: 'skull', name: 'Skull Cay', subtitle: 'Pirate Hideout', seed: 666, radius: 74, base: 2.0, hill: 5,
    peaks: [{ x: 18, z: -20, h: 9, s: 12 }],
    palette: { sand: '#d8c8a0', grass: '#8a9a62', grass2: '#6f7f4f', rock: '#7a7470', path: '#bfa880', seabed: '#4f8a84', deep: '#1f3f56', shallow: '#5fa898' },
    boat: 'galleon', chart: { x: 22, y: 22 }, pirates: 9, travelHours: 3,
    blurb: 'Captain Blackfin\'s lair. Dangerous waters, legendary loot.',
  },
};
export const ISLAND_ORDER = ['palmora', 'coralia', 'ember', 'skull'];
