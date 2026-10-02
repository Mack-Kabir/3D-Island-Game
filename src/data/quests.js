// Objectives run in order. Types:
//  talk(npc) · catch(target, count) · sell(target, count) · have(item, count) · plant · harvest
//  build(level) · visit(island) · defeat(kind, count) · compete(place) · cook(target) · buy(target)
//  own(kind:id) · level(n) · collect(item, count)
// catch targets: '*' | fish id | 'tier:rare' (that tier or better) | 'night' | 'island:ember'
// talk objectives may carry `lines` (spoken by that NPC) and `give` (rewards handed over).
export const QUESTS = {
  // ── Main story ──────────────────────────────────────
  m1: {
    main: true, title: 'Welcome to Palmora', next: 'm2',
    desc: 'You\'ve washed ashore on Palmora with nothing but a tent. Find the Mayor in the village square.',
    objectives: [
      { type: 'talk', target: 'mayor', text: 'Talk to Mayor Kalani', lines: ['Well, well! A new face on Palmora!', 'You came ashore with the tide, eh? Then you\'re one of us now.', 'Here — some coins to get you started. Your tent is set up on the west meadow.', 'Go see Old Finn by the dock. Every islander needs a fishing rod!'], give: { coins: 100 } },
    ],
    rewards: { xp: 20 },
  },
  m2: {
    main: true, title: 'A Fisher\'s Start', next: 'm3',
    desc: 'Old Finn runs the tackle shop by the dock. Get your first rod and catch some fish.',
    objectives: [
      { type: 'talk', target: 'finn', text: 'Talk to Old Finn at the dock', lines: ['A new angler! Take this old bamboo rod and some worms.', 'Stand near the water and press E to cast.', 'When the bobber dips and you see "!", press E fast! Then hold to keep the fish in the green zone.'], give: { rods: ['bamboo'], items: { bait_worm: 15 } } },
      { type: 'catch', target: '*', count: 3, text: 'Catch 3 fish' },
    ],
    rewards: { coins: 60, xp: 40 },
  },
  m3: {
    main: true, title: 'Market Day', next: 'm4',
    desc: 'Fish are worth coins! Sell your catch at Marina\'s fish market by the dock.',
    objectives: [{ type: 'sell', target: 'type:fish', count: 3, text: 'Sell 3 fish to Marina' }],
    rewards: { coins: 80, xp: 40, gems: 5 },
  },
  m4: {
    main: true, title: 'Green Thumb', next: 'm5',
    desc: 'Coco wants to help you start a farm at your homestead.',
    objectives: [
      { type: 'talk', target: 'coco', text: 'Talk to Coco at the fruit stand', lines: ['A farmer in the making! Take these seeds and my old watering can.', 'Your homestead has soil plots. Walk up and press E to plant.', 'Water them each day — or let the rain do it!'], give: { items: { seed_strawberry: 4, watering_can: 1 } } },
      { type: 'plant', target: '*', count: 2, text: 'Plant 2 seeds at your homestead' },
      { type: 'harvest', target: '*', count: 1, text: 'Harvest a crop' },
    ],
    rewards: { coins: 100, xp: 60 },
  },
  m5: {
    main: true, title: 'A Roof Overhead', next: 'm6',
    desc: 'A tent won\'t survive storm season. Gather materials and ask Bo to build you a hut.',
    objectives: [
      { type: 'talk', target: 'bo', text: 'Talk to Bo the builder', lines: ['A hut? Sure thing! I need 10 Driftwood and 5 Stone, plus 300 coins.', 'Driftwood washes up on the beaches. Stones sit near big rocks. Or buy some from me!'] },
      { type: 'have', target: 'driftwood', count: 10, text: 'Gather 10 Driftwood' },
      { type: 'have', target: 'stone', count: 5, text: 'Gather 5 Stone' },
      { type: 'build', target: 1, count: 1, text: 'Upgrade your home to a Beach Hut (talk to Bo)' },
    ],
    rewards: { coins: 150, xp: 100, gems: 5 },
  },
  m6: {
    main: true, title: 'Setting Sail', next: 'm7',
    desc: 'There\'s a whole archipelago out there. Captain Reyes sells boats at the dock.',
    objectives: [
      { type: 'own', target: 'boat:raft', count: 1, text: 'Buy a Bamboo Raft from Captain Reyes' },
      { type: 'visit', target: 'coralia', count: 1, text: 'Sail to Coralia Reef' },
    ],
    rewards: { coins: 200, xp: 120 },
  },
  m7: {
    main: true, title: 'Reef Champion', next: 'm8',
    desc: 'Big Mo hosts fishing tournaments on Coralia. Show them what Palmora is made of!',
    objectives: [
      { type: 'talk', target: 'mo', text: 'Talk to Big Mo', lines: ['A CHALLENGER APPEARS! Ho ho!', 'Enter a tournament from 7AM to 7PM. You get 3 minutes to score as many points as you can.', 'Bigger, rarer fish = more points. Finish in the top 3 and glory is yours!'] },
      { type: 'compete', target: 3, count: 1, text: 'Finish top 3 in a tournament' },
    ],
    rewards: { coins: 300, xp: 160, gems: 10 },
  },
  m8: {
    main: true, title: 'Pirate Trouble', next: 'm9',
    desc: 'Strange sails were spotted near Palmora. The Mayor needs you.',
    objectives: [
      { type: 'talk', target: 'mayor', text: 'Talk to Mayor Kalani', lines: ['Bad news, {name}. Captain Blackfin\'s pirates have been raiding at night!', 'Take this Driftwood Club. Press F to attack — and jump with Space to dodge.', 'They\'ll strike Palmora\'s beach tonight. Stop them!'], give: { weapons: ['stick'], flag: 'raids' } },
      { type: 'defeat', target: 'pirate', count: 3, text: 'Defeat 3 pirates (they raid at night)' },
    ],
    rewards: { coins: 400, xp: 220, gems: 10 },
  },
  m9: {
    main: true, title: 'Forge of Fire', next: 'm10',
    desc: 'You\'ll need a real weapon for Blackfin. Ash, the blacksmith of Ember Isle, forges the best.',
    objectives: [
      { type: 'own', target: 'boat:sailboat', count: 1, text: 'Buy a Sailboat from Captain Reyes' },
      { type: 'visit', target: 'ember', count: 1, text: 'Sail to Ember Isle' },
      { type: 'own', target: 'weapon:cutlass', count: 1, text: 'Get a Cutlass (or better) from Ash' },
    ],
    rewards: { coins: 500, xp: 300, gems: 15 },
  },
  m10: {
    main: true, title: 'The Black Flag', next: 'm11',
    desc: 'It\'s time. Sail to Skull Cay and defeat Captain Blackfin once and for all.',
    objectives: [
      { type: 'own', target: 'boat:galleon', count: 1, text: 'Buy a Galleon from Captain Reyes' },
      { type: 'visit', target: 'skull', count: 1, text: 'Sail to Skull Cay' },
      { type: 'defeat', target: 'blackfin', count: 1, text: 'Defeat Captain Blackfin' },
    ],
    rewards: { coins: 3000, xp: 800, gems: 100, rods: ['leviathan'], cosmetics: ['blackfin_hat'] },
  },
  m11: {
    main: true, title: 'Legend of the Leviathan', next: null,
    desc: 'With Blackfin gone, the seas are calm... except for whispers of the Leviathan, seen on rainy nights.',
    objectives: [
      { type: 'talk', target: 'mayor', text: 'Celebrate with the Mayor', lines: ['You did it! Blackfin is finished! Palmora will sing of this for generations!', 'But... the old tales say the Leviathan guards these waters. Seen only on rainy nights.', 'If anyone can catch it, it\'s you.'] },
      { type: 'catch', target: 'leviathan', count: 1, text: 'Catch the Leviathan (rainy night)' },
    ],
    rewards: { coins: 10000, xp: 2000, gems: 300, cosmetics: ['crown'] },
  },

  // ── Side quests ─────────────────────────────────────
  s_pip: {
    title: 'Shell Collector', giver: 'pip', requires: 'm2',
    desc: 'Pip wants to build the biggest shell collection on Palmora.',
    offer: 'Can you find me 6 seashells? They\'re all over the beach!',
    objectives: [{ type: 'have', target: 'shell', count: 6, text: 'Collect 6 Seashells', consume: true }],
    rewards: { coins: 120, xp: 60, gems: 5, items: { sugar_candy: 1 } },
  },
  s_finn: {
    title: 'Night Fisher', giver: 'finn', requires: 'm3',
    desc: 'Finn says the best fish come out after dark.',
    offer: 'Real anglers fish at night. Catch me 3 fish after 7PM and I\'ll make it worth your while.',
    objectives: [{ type: 'catch', target: 'night', count: 3, text: 'Catch 3 fish at night (7PM–7AM)' }],
    rewards: { coins: 150, xp: 90, items: { bait_glow: 10 } },
  },
  s_marina: {
    title: 'Big Order', giver: 'marina', requires: 'm3',
    desc: 'Marina has a huge order from Coralia.',
    offer: 'I need 12 fish for a banquet order. Any kind! Help me out?',
    objectives: [{ type: 'sell', target: 'type:fish', count: 12, text: 'Sell 12 fish' }],
    rewards: { coins: 300, xp: 120, gems: 5 },
  },
  s_nana: {
    title: 'Grandma\'s Recipe', giver: 'nana', requires: 'm4',
    desc: 'Nana Leia wants to pass on her famous recipe.',
    offer: 'Cook me a Fish Taco at your campfire — 1 fish and 1 pineapple. Then you\'ll be family!',
    objectives: [{ type: 'cook', target: 'fish_taco', count: 1, text: 'Cook a Fish Taco' }],
    rewards: { coins: 200, xp: 120, gems: 8 },
  },
  s_luna: {
    title: 'Fashionista', giver: 'luna', requires: 'm3',
    desc: 'Luna thinks your wardrobe needs work.',
    offer: 'Own 10 pieces of clothing, darling. Then we\'ll talk.',
    objectives: [{ type: 'own', target: 'cosmetics:10', count: 1, text: 'Own 10 cosmetics' }],
    rewards: { gems: 20, xp: 100, cosmetics: ['hawaiian_blue'] },
  },
  s_coco: {
    title: 'Fruit Basket', giver: 'coco', requires: 'm4',
    desc: 'Coco is preparing a festival basket.',
    offer: 'Bring me 2 Pineapples and 2 Mangoes for the festival basket?',
    objectives: [
      { type: 'have', target: 'pineapple', count: 2, text: 'Bring 2 Pineapples', consume: true },
      { type: 'have', target: 'mango', count: 2, text: 'Bring 2 Mangoes', consume: true },
    ],
    rewards: { coins: 250, xp: 120, items: { sapling_mango: 1 } },
  },
  s_shelly: {
    title: 'Reef Survey', giver: 'shelly', requires: 'm6',
    desc: 'Shelly is cataloguing the reef.',
    offer: 'Help me survey the reef? Catch a Clownfish, a Parrotfish and a Blue Tang!',
    objectives: [
      { type: 'catch', target: 'clownfish', count: 1, text: 'Catch a Clownfish' },
      { type: 'catch', target: 'parrotfish', count: 1, text: 'Catch a Parrotfish' },
      { type: 'catch', target: 'blue_tang', count: 1, text: 'Catch a Blue Tang' },
    ],
    rewards: { coins: 400, xp: 200, gems: 15 },
  },
  s_sage: {
    title: 'Ember Essence', giver: 'sage', requires: 'm9',
    desc: 'Sage needs a creature of fire.',
    offer: 'The Lava Catfish holds the volcano\'s essence. Bring one to me.',
    objectives: [{ type: 'catch', target: 'lava_catfish', count: 1, text: 'Catch a Lava Catfish' }],
    rewards: { coins: 600, xp: 300, gems: 25 },
  },
  s_moth: {
    title: 'Moonlight Mystery', giver: 'moth', requires: 'm3',
    desc: 'Moth wants a fish that holds starlight.',
    offer: 'Catch a Starlight Koi on a clear night near Palmora... and I\'ll share a secret.',
    objectives: [{ type: 'catch', target: 'starlight_koi', count: 1, text: 'Catch a Starlight Koi' }],
    rewards: { gems: 50, xp: 400, cosmetics: ['starry_robe'] },
  },
  s_patch: {
    title: 'Doubloon Hunter', giver: 'patch', requires: 'm10',
    desc: 'Patch is building a retirement fund.',
    offer: 'Bring me 8 doubloons from Blackfin\'s crew. I\'ll pay ye back in style.',
    objectives: [{ type: 'have', target: 'doubloon', count: 8, text: 'Collect 8 Pirate Doubloons', consume: true }],
    rewards: { coins: 1000, gems: 20, cosmetics: ['pirate_hat'] },
  },
};
for (const [id, q] of Object.entries(QUESTS)) q.id = id;

// Daily bounty templates (posted on the board in Palmora each morning).
export const BOUNTY_TEMPLATES = [
  { type: 'catch', target: '*', counts: [4, 8], text: (n) => `Catch ${n} fish`, reward: (n) => ({ coins: n * 22, xp: n * 6 }) },
  { type: 'catch', target: 'tier:uncommon', counts: [2, 4], text: (n) => `Catch ${n} Uncommon+ fish`, reward: (n) => ({ coins: n * 45, xp: n * 12 }) },
  { type: 'catch', target: 'tier:rare', counts: [1, 2], text: (n) => `Catch ${n} Rare+ fish`, reward: (n) => ({ coins: n * 90, gems: 2, xp: n * 25 }), minLevel: 4 },
  { type: 'sell', target: 'type:fruit', counts: [4, 8], text: (n) => `Sell ${n} fruits`, reward: (n) => ({ coins: n * 15, xp: n * 5 }), minLevel: 2 },
  { type: 'harvest', target: '*', counts: [2, 4], text: (n) => `Harvest ${n} crops`, reward: (n) => ({ coins: n * 30, xp: n * 8 }), minLevel: 2 },
  { type: 'collect', target: '*', counts: [5, 10], text: (n) => `Pick up ${n} beach items`, reward: (n) => ({ coins: n * 10, xp: n * 4 }) },
  { type: 'cook', target: '*', counts: [1, 3], text: (n) => `Cook ${n} dishes`, reward: (n) => ({ coins: n * 50, xp: n * 15 }), minLevel: 3 },
  { type: 'defeat', target: 'pirate', counts: [2, 5], text: (n) => `Defeat ${n} pirates`, reward: (n) => ({ coins: n * 60, gems: 2, xp: n * 20 }), flag: 'raids' },
  { type: 'talk', target: '*', counts: [3, 5], text: (n) => `Chat with ${n} islanders`, reward: (n) => ({ coins: n * 15, xp: n * 5 }) },
];
