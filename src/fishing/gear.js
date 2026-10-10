// Fishing gear and boats: rods, lures (bait) and the boats you sail and fish from.

// power: how strong a fish it can land (see fishPower). luck: rarity boost. speed: bite-wait multiplier. reel: line pulled per tap.
export const RODS = [
  { id: 'bamboo', name: 'Bamboo Rod', icon: '🎋', power: 1, luck: 0, speed: 1, reel: 1, price: 0, level: 1, color: '#c9a65b', desc: 'Light and humble. Every legend starts here.' },
  { id: 'oak', name: 'Oak Rod', icon: '🎣', power: 3, luck: 0.15, speed: 0.9, reel: 1.08, price: 350, level: 3, color: '#8a5a32', desc: 'Sturdy hardwood. Lands uncommon and most rare fish.' },
  { id: 'carbon', name: 'Carbon Pro', icon: '🎣', power: 5, luck: 0.4, speed: 0.78, reel: 1.2, price: 2600, level: 8, color: '#2d2d36', desc: 'Pro-grade and strong enough for epic fish.' },
  { id: 'deepsea', name: 'Deep-Sea Trolling Rod', icon: '🚤', power: 8, luck: 0.8, speed: 0.7, reel: 1.45, price: 6500, gems: 20, level: 11, boatOnly: true, color: '#3f6fa8', desc: 'A heavy trolling rod — only usable from your boat. Deep-sea fish bite twice as often.' },
  { id: 'golden', name: 'Golden Rod', icon: '✨', power: 7, luck: 1.05, speed: 0.6, reel: 1.38, price: 0, gems: 180, level: 16, color: '#f2c230', desc: 'Pure gold. Legends can\'t resist it.' },
];
/** Old rods from earlier versions map onto the new line-up. */
export const ROD_MIGRATION = { fiberglass: 'oak', coral: 'carbon', ember: 'carbon', leviathan: 'golden' };

// Lures: luck = rarity boost, speed = bite-wait multiplier, upgrade = chance of a one-tier-better catch,
// slip = chance the fish throws the hook. Extras: dayLuck, nightLuck/nightUpgrade, rain (rain-fish boost),
// deep (deep-sea fish boost), junk (junk multiplier). model drives the lure you see fly when casting.
export const BAITS = [
  { id: 'bait_worm', luck: 0, speed: 1, upgrade: 0.05, slip: 0.05, price: 20, pack: 10, level: 1, model: 'worm', color: '#e88aa0' },
  { id: 'bait_cricket', luck: 0.05, speed: 0.75, upgrade: 0.05, slip: 0.04, junk: 0.7, price: 35, pack: 10, level: 2, model: 'cricket', color: '#6b8a3a' },
  { id: 'bait_shrimp', luck: 0.15, speed: 0.85, upgrade: 0.15, slip: 0.03, price: 60, pack: 10, level: 3, model: 'shrimp', color: '#f29a6a' },
  { id: 'bait_spinner', luck: 0.1, dayLuck: 0.3, speed: 0.8, upgrade: 0.12, slip: 0.03, junk: 0.5, price: 110, pack: 8, level: 5, model: 'spinner', color: '#d9dee6' },
  { id: 'bait_glow', luck: 0.1, nightLuck: 0.5, nightUpgrade: 0.3, speed: 0.8, upgrade: 0.1, slip: 0.03, price: 140, pack: 10, level: 6, model: 'glow', color: '#7ff0d0' },
  { id: 'bait_squid', luck: 0.2, deep: 2, speed: 0.85, upgrade: 0.18, slip: 0.02, price: 180, pack: 8, level: 7, model: 'squid', color: '#f4d8e4' },
  { id: 'bait_jig', luck: 0.15, rain: 2.5, rainLuck: 0.4, speed: 0.8, upgrade: 0.15, slip: 0.02, price: 220, pack: 8, level: 9, model: 'jig', color: '#5fa8e8' },
  { id: 'bait_magic', luck: 0.6, speed: 0.7, upgrade: 0.35, slip: 0.01, junk: 0.2, price: 0, gems: 12, pack: 5, level: 10, model: 'magic', color: '#f2c230' },
];

/** Lure inventory items (added to ITEMS in shared/items.js). */
export const BAIT_ITEMS = {
  // Bait (consumed one per cast)
  bait_worm: { name: 'Worm', icon: '🪱', type: 'bait', sell: 1, desc: 'Basic bait. Wriggly and reliable.' },
  bait_cricket: { name: 'Cricket', icon: '🦗', type: 'bait', sell: 2, desc: 'Fish bite much faster, and less junk.' },
  bait_shrimp: { name: 'Shrimp Lure', icon: '🦐', type: 'bait', sell: 2, desc: 'More luck and a 15% chance of a better fish.' },
  bait_spinner: { name: 'Spinner Spoon', icon: '🥄', type: 'bait', sell: 4, desc: 'Flashes in the sun: big luck boost by day, half the junk.' },
  bait_glow: { name: 'Glow Lure', icon: '✨', type: 'bait', sell: 4, desc: 'Glows in the dark: huge luck at night and a 40% chance of a better fish.' },
  bait_squid: { name: 'Squid Strip', icon: '🦑', type: 'bait', sell: 5, desc: 'Deep-sea fish (🚤) bite twice as often. Great from a boat.' },
  bait_jig: { name: 'Storm Jig', icon: '🪶', type: 'bait', sell: 6, desc: 'Rain fish bite 2.5× more often in the rain.' },
  bait_magic: { name: 'Magic Lure', icon: '🪄', type: 'bait', sell: 10, desc: 'Huge luck boost and a 35% chance of a better fish. Almost no junk.' },
};

export const BOATS = [
  { id: 'none', name: 'No Boat', tier: 0 },
  { id: 'raft', name: 'Bamboo Raft', icon: '🛶', tier: 1, price: 600, level: 3, desc: 'Gets you to Coralia Reef.', reaches: 'coralia' },
  { id: 'sailboat', name: 'Sailboat', icon: '⛵', tier: 2, price: 3200, level: 8, desc: 'Strong enough for Ember Isle.', reaches: 'ember' },
  { id: 'galleon', name: 'Galleon', icon: '🚢', tier: 3, price: 8500, gems: 25, level: 12, desc: 'Brave the waters of Skull Cay.', reaches: 'skull' },
];

export const RODS_BY_ID = Object.fromEntries(RODS.map((r) => [r.id, r]));
export const BAITS_BY_ID = Object.fromEntries(BAITS.map((r) => [r.id, r]));
export const BOATS_BY_ID = Object.fromEntries(BOATS.map((r) => [r.id, r]));
