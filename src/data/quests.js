// Objectives run in order. Types:
//  talk(npc) · catch(target, count) · sell(target, count) · have(item, count) · plant · harvest · water
//  build(level) · visit(island) · defeat(kind, count) · compete(place) · cook(target) · buy(target)
//  own(kind:id) · level(n) · collect(item, count)
// catch targets: '*' | fish id | 'tier:rare' (that tier or better) | 'night' | 'island:ember'
// sell targets: '*' | item id | 'type:fish' | 'shop:general'
// collect targets: '*' | item id | 'beach' (shells, starfish, driftwood…) | 'fruit'
// `hint` explains exactly how to do the step; it shows in the tracker and quest log.
// talk objectives carry `lines` (strings = the islander, { you } = your reply) and `give` (rewards handed over).
export const QUESTS = {
  // ── Main story ──────────────────────────────────────
  m1: {
    main: true, title: 'Welcome to Palmora', next: 'm1b',
    desc: 'You washed ashore on Palmora with nothing. Find Mayor Mike in the village square — follow the yellow arrow.',
    objectives: [
      {
        type: 'talk', target: 'mayor', text: 'Talk to Mayor Mike', hint: 'Follow the yellow arrow to the Mayor\'s blue-roofed house, walk up to him and press E.',
        lines: [
          'Well, well! A new face on Palmora! I\'m Mike — mayor of this little paradise.',
          { you: 'Hi! I just washed up on the beach... where am I?' },
          'You\'re on Palmora, the friendliest island in the whole archipelago! Don\'t you worry, we\'ll get you on your feet.',
          { you: 'I don\'t have anything. How do people make a living here?' },
          'Plenty of ways! Islanders earn coins by beachcombing, picking fruit, fishing, farming and cooking.',
          'Beachcombing is the easiest: just walk over shells, starfish and driftwood on the sand. They\'re free!',
          'Fruit trees have colourful fruit on them — stand next to one and press E to shake it.',
          'Chloe at the fruit stand right here in the square buys shells and fruit. Megan at the dock buys fish.',
          { you: 'That sounds doable!' },
          'Here — 100 coins to get you started. Your tent is set up on the west meadow, down the western path.',
          'Now go collect some beach treasures and sell them to Chloe. The yellow arrow on your screen will guide you!',
        ],
        give: { coins: 100 },
      },
    ],
    rewards: { xp: 20 },
  },
  m1b: {
    main: true, title: 'Beachcomber', next: 'm2',
    desc: 'The easiest way to earn your first coins: collect free things from the beach and the trees, then sell them.',
    objectives: [
      { type: 'collect', target: 'beach', count: 3, text: 'Pick up 3 beach items', hint: 'Walk onto the sand (follow the arrow). Shells, starfish and driftwood are picked up automatically when you walk over them.' },
      { type: 'collect', target: 'fruit', count: 1, text: 'Shake a fruit tree', hint: 'Find a tree with coloured fruit (follow the arrow), stand next to it and press E.' },
      {
        type: 'talk', target: 'coco', text: 'Talk to Chloe at the fruit stand', hint: 'Chloe\'s stand has a pink-and-white striped roof in the village square. Press E next to her.',
        lines: [
          'Hiya! Mike told me about you. Welcome to Palmora!',
          { you: 'I found some shells and fruit. Do you buy them?' },
          'I sure do! Shells, starfish, coral and fruit — and cooked food too.',
          'Whenever you want to sell, talk to me and choose "Sell items". Then press Sell next to anything.',
          'Driftwood is for building though — Bob the builder buys that, or keep it for your house!',
        ],
      },
      { type: 'sell', target: 'shop:general', count: 2, text: 'Sell 2 items to Chloe', hint: 'Talk to Chloe → "Sell items" → press Sell next to your shells or fruit.' },
    ],
    rewards: { coins: 40, xp: 30 },
  },
  m2: {
    main: true, title: 'A Fisher\'s Start', next: 'm3',
    desc: 'Old Ross runs the tackle shop by the dock. He gives every newcomer a free rod!',
    objectives: [
      {
        type: 'talk', target: 'finn', text: 'Talk to Old Ross at the dock', hint: 'Follow the dirt path south from the square to the wooden dock. Ross stands by the blue-roofed hut.',
        lines: [
          'So you\'re the new islander! Every islander needs a fishing rod.',
          { you: 'I\'d love to fish, but I can\'t afford a rod yet...' },
          'Ha! First one\'s free, kid. Take my old Bamboo Rod and 15 worms.',
          'Here\'s how it works: walk to the end of the dock, FACE the water, and press E to cast your line.',
          'Wait for the bobber to dip and a big "!" to pop up. Then press E quickly to hook the fish!',
          'Then the fight: HOLD Space, E or the mouse button to lift the green bar. Let go to let it fall.',
          'Keep the little fish inside the green bar and the meter on the right fills up. Fill it and the fish is yours!',
          { you: 'Got it — cast, wait for "!", press E, then hold to keep the fish in the green.' },
          'Exactly! Off you go — the end of the dock is the best spot.',
        ],
        give: { rods: ['bamboo'], items: { bait_worm: 15 } },
      },
      { type: 'catch', target: '*', count: 3, text: 'Catch 3 fish', hint: 'Walk to the end of the dock, face the water and press E. Junk like old boots doesn\'t count!' },
    ],
    rewards: { coins: 60, xp: 40 },
  },
  m3: {
    main: true, title: 'Market Day', next: 'm4',
    desc: 'Fish are worth good coins! Megan runs the fish market at the foot of the dock.',
    objectives: [
      {
        type: 'talk', target: 'marina', text: 'Talk to Megan at the fish market', hint: 'Megan\'s stall has a teal-and-white roof at the start of the dock.',
        lines: [
          'Hey there! Ross says you\'ve been fishing. Let\'s see that catch!',
          { you: 'How much will you pay?' },
          'Common fish go for 10–20 coins. Rare ones for a hundred or more — and legendary fish, a fortune!',
          'Talk to me and pick "Sell items", then hit Sell next to each fish, or "Sell everything" at the top.',
        ],
      },
      { type: 'sell', target: 'type:fish', count: 3, text: 'Sell 3 fish to Megan', hint: 'Talk to Megan → "Sell items" → press Sell next to your fish.' },
    ],
    rewards: { coins: 80, xp: 40, gems: 5 },
  },
  m4: {
    main: true, title: 'Green Thumb', next: 'm4b',
    desc: 'Chloe wants to help you start a farm at your homestead.',
    objectives: [
      {
        type: 'talk', target: 'coco', text: 'Talk to Chloe about farming', hint: 'Chloe is at the fruit stand in the village square.',
        lines: [
          'A farmer in the making! I\'ve got just the thing.',
          'Take these strawberry seeds and my old watering can.',
          'Your homestead is down the path west of the village — look for the fence and the brown soil patches.',
          'Stand on a soil patch and press E to plant. Press E again to water it — watered crops grow 50% faster!',
          { you: 'How long do strawberries take?' },
          'About 6 hours of island time — that\'s only about 6 real minutes! Rain waters them for free.',
        ],
        give: { items: { seed_strawberry: 4, watering_can: 1 } },
      },
      { type: 'plant', target: '*', count: 2, text: 'Plant 2 seeds at your homestead', hint: 'Go to your homestead (arrow), stand on a brown soil patch and press E, then pick the seeds.' },
      { type: 'harvest', target: '*', count: 1, text: 'Harvest a crop', hint: 'Water your crops (E) and wait until fruit appears, then press E on the patch. Explore or fish while you wait!' },
    ],
    rewards: { coins: 100, xp: 60 },
  },
  m4b: {
    main: true, title: 'Home Cooking', next: 'm5',
    desc: 'Grandma Rose says cooked food sells for far more than raw ingredients — and heals you, too.',
    objectives: [
      {
        type: 'talk', target: 'nana', text: 'Talk to Grandma Rose', hint: 'Grandma Rose stands outside her orange-roofed kitchen on the east side of the square.',
        lines: [
          'Oh, sweetie, come here! You look hungry.',
          { you: 'Mike said you\'re the best cook on the island.' },
          'He\'s not wrong! Let me teach you. There\'s a campfire next to your tent on the west meadow.',
          'Walk up to it and press E to cook. Grilled Fish needs just one fish — easy!',
          'A raw sardine sells for 10 coins. Grilled, it sells for 30. Fancy recipes sell for hundreds!',
          'Here\'s a pineapple. Fish + pineapple makes a Fish Taco — my favourite.',
        ],
        give: { items: { pineapple: 1 } },
      },
      { type: 'cook', target: '*', count: 1, text: 'Cook a dish at your campfire', hint: 'Go to the campfire beside your tent (arrow) and press E. Grilled Fish needs only 1 fish.' },
      { type: 'sell', target: 'type:product', count: 1, text: 'Sell a cooked dish to Chloe', hint: 'Talk to Chloe → "Sell items" → sell your cooked food.' },
    ],
    rewards: { coins: 80, xp: 60, gems: 3 },
  },
  m5: {
    main: true, title: 'A Roof Overhead', next: 'm6',
    desc: 'A tent won\'t survive storm season. Gather materials and ask Bob to build you a hut.',
    objectives: [
      {
        type: 'talk', target: 'bo', text: 'Talk to Bob the builder', hint: 'Bob\'s workshop has a straw roof, east of the village square.',
        lines: [
          'A new neighbour! Living in a tent, eh? We can fix that.',
          { you: 'What do I need for a hut?' },
          '10 Driftwood, 5 Stone and 300 coins. Bigger houses give you more farm plots!',
          'Driftwood washes up on the beaches — walk over it. Stones sit next to big grey rocks.',
          'Or buy them from me if you\'re in a hurry. Come back when you\'ve got everything!',
        ],
      },
      { type: 'have', target: 'driftwood', count: 10, text: 'Gather 10 Driftwood', hint: 'Walk over driftwood logs on the sandy beaches. New ones wash up every day. Bob also sells 5 for 16 coins.' },
      { type: 'have', target: 'stone', count: 5, text: 'Gather 5 Stone', hint: 'Look next to the big grey rocks around the island and walk over small stones. Bob sells them too.' },
      { type: 'build', target: 1, count: 1, text: 'Build a Beach Hut', hint: 'Talk to Bob → "Upgrade my home" → Build it! (needs 300 coins). You can also press E at your tent.' },
    ],
    rewards: { coins: 150, xp: 100, gems: 5 },
  },
  m6: {
    main: true, title: 'Setting Sail', next: 'm7',
    desc: 'There\'s a whole archipelago out there. Captain Jack sells boats at the dock.',
    objectives: [
      {
        type: 'talk', target: 'reyes', text: 'Talk to Captain Jack at the dock', hint: 'Captain Jack wears a white captain\'s hat and stands at the start of the dock.',
        lines: [
          'Ahoy! Thinking of leaving our little island?',
          { you: 'I want to see the other islands.' },
          'Then you need a boat! A Bamboo Raft costs 600 coins and needs level 3. It\'ll get you to Coralia Reef.',
          'Save up by fishing, cooking and selling. Then come back, pick "Shop" and buy the raft.',
          'To sail, walk onto the dock next to your boat and press E — or ask me to set sail.',
        ],
      },
      { type: 'own', target: 'boat:raft', count: 1, text: 'Buy a Bamboo Raft (600 coins, Lv 3)', hint: 'Earn coins by fishing & cooking, then talk to Captain Jack → Shop → Bamboo Raft.' },
      { type: 'visit', target: 'coralia', count: 1, text: 'Sail to Coralia Reef', hint: 'Walk next to your boat at the dock and press E, then choose Coralia Reef on the sea chart.' },
    ],
    rewards: { coins: 200, xp: 120 },
  },
  m7: {
    main: true, title: 'Reef Champion', next: 'm8',
    desc: 'Coach LeBron hosts fishing tournaments on Coralia. Show them what Palmora is made of!',
    objectives: [
      {
        type: 'talk', target: 'mo', text: 'Talk to Coach LeBron', hint: 'Coach LeBron stands at the start of the Coralia pier with the colourful flags.',
        lines: [
          'A CHALLENGER APPEARS! Welcome to Coralia, rookie!',
          { you: 'I heard you run fishing tournaments?' },
          'The best in the archipelago! From 7 AM to 7 PM you can enter. You get 3 minutes to score points.',
          'Every fish scores points — bigger and rarer fish score WAY more. Beat my rivals and finish top 3!',
          'The Bronze League costs 50 coins to enter. Pick "Tournament" when you\'re ready!',
        ],
      },
      { type: 'compete', target: 3, count: 1, text: 'Finish top 3 in a tournament', hint: 'Talk to Coach LeBron → Tournament → Enter (daytime only). Then fish from the end of the pier!' },
    ],
    rewards: { coins: 300, xp: 160, gems: 10 },
  },
  m8: {
    main: true, title: 'Pirate Trouble', next: 'm9',
    desc: 'Strange sails were spotted near Palmora. The Mayor needs you.',
    objectives: [
      {
        type: 'talk', target: 'mayor', text: 'Talk to Mayor Mike', hint: 'Head back to Palmora and find the Mayor in the village square.',
        lines: [
          'Bad news, {name}. Captain Blackfin\'s pirates have been raiding at night!',
          { you: 'Pirates?! What can I do?' },
          'You\'re the bravest islander I know. Take this Driftwood Club.',
          'Press F to swing. When a pirate shows a red "!", they\'re about to attack — jump with Space to dodge!',
          'They\'ll land on the east beach tonight after 7 PM. Eat food from your Bag if you get hurt.',
        ],
        give: { weapons: ['stick'], flag: 'raids' },
      },
      { type: 'defeat', target: 'pirate', count: 3, text: 'Defeat 3 pirates (they raid at night)', hint: 'Wait for night (7 PM) on Palmora — pirates land on the east beach. Press F to attack.' },
    ],
    rewards: { coins: 400, xp: 220, gems: 10 },
  },
  m9: {
    main: true, title: 'Forge of Fire', next: 'm10',
    desc: 'You\'ll need a real weapon for Blackfin. Hank, the blacksmith of Ember Isle, forges the best.',
    objectives: [
      { type: 'own', target: 'boat:sailboat', count: 1, text: 'Buy a Sailboat (3,200 coins, Lv 8)', hint: 'Talk to Captain Jack on Palmora → Shop → Sailboat.' },
      { type: 'visit', target: 'ember', count: 1, text: 'Sail to Ember Isle', hint: 'Use your boat at any dock and pick Ember Isle.' },
      { type: 'own', target: 'weapon:cutlass', count: 1, text: 'Get a Cutlass (or better) from Hank', hint: 'Hank\'s forge is the dark house in Ember Isle\'s village. Talk to him → Shop.' },
    ],
    rewards: { coins: 500, xp: 300, gems: 15 },
  },
  m10: {
    main: true, title: 'The Black Flag', next: 'm11',
    desc: 'It\'s time. Sail to Skull Cay and defeat Captain Blackfin once and for all.',
    objectives: [
      { type: 'own', target: 'boat:galleon', count: 1, text: 'Buy a Galleon (8,500 coins + 25 gems, Lv 12)', hint: 'Talk to Captain Jack on Palmora → Shop → Galleon.' },
      { type: 'visit', target: 'skull', count: 1, text: 'Sail to Skull Cay', hint: 'Use your boat at any dock and pick Skull Cay.' },
      { type: 'defeat', target: 'blackfin', count: 1, text: 'Defeat Captain Blackfin', hint: 'Blackfin camps in the middle of Skull Cay. Bring food to heal and dodge his charge!' },
    ],
    rewards: { coins: 3000, xp: 800, gems: 100, rods: ['leviathan'], cosmetics: ['blackfin_hat'] },
  },
  m11: {
    main: true, title: 'Legend of the Leviathan', next: null,
    desc: 'With Blackfin gone, the seas are calm... except for whispers of the Leviathan, seen on rainy nights.',
    objectives: [
      {
        type: 'talk', target: 'mayor', text: 'Celebrate with Mayor Mike', hint: 'Return to Palmora and talk to the Mayor.',
        lines: [
          'You did it! Blackfin is finished! Palmora will sing of this for generations!',
          { you: 'It wasn\'t easy. What now?' },
          'Well... the old tales say the Leviathan guards these waters. Seen only on rainy nights.',
          'If anyone can catch it, it\'s you. Use your best rod and Magic Lures!',
        ],
      },
      { type: 'catch', target: 'leviathan', count: 1, text: 'Catch the Leviathan (rainy night)', hint: 'It only appears at night while it rains, on any island. Rare — keep trying!' },
    ],
    rewards: { coins: 10000, xp: 2000, gems: 300, cosmetics: ['crown'] },
  },

  // ── Side quests ─────────────────────────────────────
  s_pip: {
    title: 'Shell Collector', giver: 'pip', requires: 'm1b',
    desc: 'Tommy wants to build the biggest shell collection on Palmora.',
    offer: 'Can you find me 6 seashells? They\'re all over the beach! Bring them to me and I\'ll give you my best candy!',
    objectives: [{ type: 'have', target: 'shell', count: 6, text: 'Bring 6 Seashells to Tommy', consume: true, hint: 'Walk over shells on the sand, then talk to Tommy and pick "Hand over".' }],
    rewards: { coins: 120, xp: 60, gems: 5, items: { sugar_candy: 1 } },
  },
  s_finn: {
    title: 'Night Fisher', giver: 'finn', requires: 'm3',
    desc: 'Ross says the best fish come out after dark.',
    offer: 'Real anglers fish at night. Catch me 3 fish after 7 PM and I\'ll make it worth your while.',
    objectives: [{ type: 'catch', target: 'night', count: 3, text: 'Catch 3 fish at night (7 PM–7 AM)', hint: 'Fish any time between 7 PM and 7 AM. Check the clock in the top-right.' }],
    rewards: { coins: 150, xp: 90, items: { bait_glow: 10 } },
  },
  s_marina: {
    title: 'Big Order', giver: 'marina', requires: 'm3',
    desc: 'Megan has a huge order from Coralia.',
    offer: 'I need 12 fish for a banquet order. Any kind! Help me out?',
    objectives: [{ type: 'sell', target: 'type:fish', count: 12, text: 'Sell 12 fish', hint: 'Sell any fish to Megan (or any shop that buys fish).' }],
    rewards: { coins: 300, xp: 120, gems: 5 },
  },
  s_nana: {
    title: 'Grandma\'s Recipe', giver: 'nana', requires: 'm4b',
    desc: 'Grandma Rose wants to pass on her famous recipe.',
    offer: 'Cook me a Fish Taco at your campfire — 1 fish and 1 pineapple. Then you\'ll be family!',
    objectives: [{ type: 'cook', target: 'fish_taco', count: 1, text: 'Cook a Fish Taco', hint: 'Needs 1 fish + 1 pineapple. Pineapple seeds are sold by Chloe. Cook at your campfire.' }],
    rewards: { coins: 200, xp: 120, gems: 8 },
  },
  s_luna: {
    title: 'Fashionista', giver: 'luna', requires: 'm3',
    desc: 'Lily thinks your wardrobe needs work.',
    offer: 'Own 10 pieces of clothing, darling. Then we\'ll talk.',
    objectives: [{ type: 'own', target: 'cosmetics:10', count: 1, text: 'Own 10 cosmetics', hint: 'Buy clothes from Lily\'s Boutique. You start with a few free ones.' }],
    rewards: { gems: 20, xp: 100, cosmetics: ['hawaiian_blue'] },
  },
  s_coco: {
    title: 'Fruit Basket', giver: 'coco', requires: 'm4',
    desc: 'Chloe is preparing a festival basket.',
    offer: 'Bring me 2 Pineapples and 2 Mangoes for the festival basket?',
    objectives: [
      { type: 'have', target: 'pineapple', count: 2, text: 'Bring 2 Pineapples', consume: true, hint: 'Grow pineapples at your farm (seeds from Chloe).' },
      { type: 'have', target: 'mango', count: 2, text: 'Bring 2 Mangoes', consume: true, hint: 'Shake wild mango trees (orange fruit) around Palmora.' },
    ],
    rewards: { coins: 250, xp: 120, items: { sapling_mango: 1 } },
  },
  s_shelly: {
    title: 'Reef Survey', giver: 'shelly', requires: 'm6',
    desc: 'Sarah is cataloguing the reef.',
    offer: 'Help me survey the reef? Catch a Clownfish, a Parrotfish and a Blue Tang!',
    objectives: [
      { type: 'catch', target: 'clownfish', count: 1, text: 'Catch a Clownfish', hint: 'Fish on Coralia Reef during the day.' },
      { type: 'catch', target: 'parrotfish', count: 1, text: 'Catch a Parrotfish', hint: 'Fish on Coralia Reef during the day.' },
      { type: 'catch', target: 'blue_tang', count: 1, text: 'Catch a Blue Tang', hint: 'A rare fish on Coralia Reef during the day. Better bait helps!' },
    ],
    rewards: { coins: 400, xp: 200, gems: 15 },
  },
  s_sage: {
    title: 'Ember Essence', giver: 'sage', requires: 'm9',
    desc: 'Grace needs a creature of fire.',
    offer: 'The Lava Catfish holds the volcano\'s essence. Bring one to me.',
    objectives: [{ type: 'catch', target: 'lava_catfish', count: 1, text: 'Catch a Lava Catfish', hint: 'An epic fish found only around Ember Isle.' }],
    rewards: { coins: 600, xp: 300, gems: 25 },
  },
  s_moth: {
    title: 'Moonlight Mystery', giver: 'moth', requires: 'm3',
    desc: 'Madison wants a fish that holds starlight.',
    offer: 'Catch a Starlight Koi on a clear night near Palmora... and I\'ll share a secret.',
    objectives: [{ type: 'catch', target: 'starlight_koi', count: 1, text: 'Catch a Starlight Koi', hint: 'An epic fish around Palmora at night. Glow Bait helps a lot.' }],
    rewards: { gems: 50, xp: 400, cosmetics: ['starry_robe'] },
  },
  s_patch: {
    title: 'Doubloon Hunter', giver: 'patch', requires: 'm10',
    desc: 'Pete is building a retirement fund.',
    offer: 'Bring me 8 doubloons from Blackfin\'s crew. I\'ll pay ye back in style.',
    objectives: [{ type: 'have', target: 'doubloon', count: 8, text: 'Bring 8 Pirate Doubloons to Pete', consume: true, hint: 'Pirates often drop doubloons when defeated.' }],
    rewards: { coins: 1000, gems: 20, cosmetics: ['pirate_hat'] },
  },
};
// More side quests so every islander has a task.
Object.assign(QUESTS, {
  s_mayor: {
    title: 'Meet the Neighbours', giver: 'mayor', requires: 'm1',
    desc: 'Mayor Mike wants you to meet the people of Palmora.',
    offer: 'A good islander knows their neighbours! Say hello to Lily, Grandma Rose, Bob and Captain Jack for me?',
    objectives: [
      { type: 'talk', target: 'luna', text: 'Say hello to Lily at the boutique', hint: 'Lily stands outside the pink boutique on the west side of the square.', lines: ['Oh! A new face — and what a canvas! I\'m Lily.', { you: 'The Mayor asked me to say hello.' }, 'Sweet man. Come by any time — I sell clothes, hats and the cutest pets in the archipelago.', 'Press C to open your wardrobe whenever you want to change your look.'] },
      { type: 'talk', target: 'nana', text: 'Say hello to Grandma Rose', hint: 'Grandma Rose stands outside her kitchen on the east side of the square.', lines: ['Welcome, sweetie! I\'m Rose, but everyone calls me Grandma.', { you: 'Nice to meet you, Grandma Rose!' }, 'Such manners! When you\'re ready to learn cooking, come see me.'] },
      { type: 'talk', target: 'bo', text: 'Say hello to Bob the builder', hint: 'Bob\'s workshop has a straw roof, east of the square.', lines: ['Hey there! Bob\'s the name, building\'s the game.', { you: 'The Mayor says you built half the village.' }, 'And held the ladder for the other half! Come see me when you want a real house.'] },
      { type: 'talk', target: 'reyes', text: 'Say hello to Captain Jack at the dock', hint: 'Captain Jack wears a white captain\'s hat at the start of the dock.', lines: ['Ahoy, landlubber! Captain Jack, at your service.', { you: 'Hi Captain! What do you do here?' }, 'I build boats! When you\'re ready to explore the other islands, I\'m your man.'] },
    ],
    rewards: { coins: 100, xp: 50, gems: 3 },
  },
  s_bo: {
    title: 'Lumber Run', giver: 'bo', requires: 'm1',
    desc: 'Bob is short on driftwood for a repair job.',
    offer: 'The dock railings need fixing. Could you bring me 6 Driftwood? I\'ll pay well — and it teaches you where to find building stuff!',
    objectives: [{ type: 'have', target: 'driftwood', count: 6, text: 'Bring 6 Driftwood to Bob', consume: true, hint: 'Walk over driftwood logs on the sandy beaches, then talk to Bob and pick "Hand over".' }],
    rewards: { coins: 120, xp: 50, items: { decor_flowerpot: 1 } },
  },
  s_reyes: {
    title: 'Shipshape', giver: 'reyes', requires: 'm2',
    desc: 'Captain Jack needs a strong fish for his crew\'s lunch.',
    offer: 'My crew is starving! Catch me any Uncommon fish or better — the green badge ones.',
    objectives: [{ type: 'catch', target: 'tier:uncommon', count: 1, text: 'Catch an Uncommon (or rarer) fish', hint: 'Keep fishing — about 1 in 4 fish is Uncommon or better. Shrimp bait helps.' }],
    rewards: { coins: 150, xp: 70, items: { bait_shrimp: 10 } },
  },
  s_mo: {
    title: 'Rising Star', giver: 'mo', requires: 'm7',
    desc: 'Coach LeBron wants to see a real champion.',
    offer: 'Top 3 is nice, rookie. But can you WIN? Take first place in any league!',
    objectives: [{ type: 'compete', target: 1, count: 1, text: 'Win 1st place in a tournament', hint: 'Enter a tournament and score the most points. Rare, heavy fish score the most.' }],
    rewards: { coins: 500, gems: 15, xp: 200 },
  },
  s_kai: {
    title: 'Coconut Craze', giver: 'kai', requires: 'm6',
    desc: 'Kyle wants coconuts for a beach party.',
    offer: 'Bro, I\'m throwing the gnarliest beach party! Bring me 4 coconuts?',
    objectives: [{ type: 'have', target: 'coconut', count: 4, text: 'Bring 4 Coconuts to Kyle', consume: true, hint: 'Shake palm trees that have brown coconuts (press E next to them).' }],
    rewards: { coins: 200, xp: 90, cosmetics: ['sun_visor'] },
  },
  s_ash: {
    title: 'Ore for the Forge', giver: 'ash', requires: 'm9',
    desc: 'Hank needs volcanic glass for a special blade.',
    offer: 'Obsidian makes the sharpest edges. Bring me 4 pieces — they wash up on these black beaches.',
    objectives: [{ type: 'have', target: 'obsidian', count: 4, text: 'Bring 4 Obsidian to Hank', consume: true, hint: 'Walk along Ember Isle\'s beaches and pick up the dark purple stones.' }],
    rewards: { coins: 600, gems: 10, xp: 250 },
  },
});
// Palmora helpers open up early so there is always something to do.
QUESTS.s_pip.requires = 'm1';
QUESTS.s_luna.requires = 'm1b';
QUESTS.s_finn.requires = 'm2';
QUESTS.s_marina.requires = 'm2';

for (const [id, q] of Object.entries(QUESTS)) q.id = id;

// Daily bounties (posted on the board in Palmora each morning).
export const BOUNTY_TEMPLATES = [
  { type: 'catch', target: '*', counts: [4, 8], text: (n) => `Catch ${n} fish`, reward: (n) => ({ coins: n * 22, xp: n * 6 }), minLevel: 2 },
  { type: 'catch', target: 'tier:uncommon', counts: [2, 4], text: (n) => `Catch ${n} Uncommon+ fish`, reward: (n) => ({ coins: n * 45, xp: n * 12 }), minLevel: 3 },
  { type: 'catch', target: 'tier:rare', counts: [1, 2], text: (n) => `Catch ${n} Rare+ fish`, reward: (n) => ({ coins: n * 90, gems: 2, xp: n * 25 }), minLevel: 5 },
  { type: 'sell', target: 'type:fruit', counts: [3, 6], text: (n) => `Sell ${n} fruits`, reward: (n) => ({ coins: n * 15, xp: n * 5 }) },
  { type: 'harvest', target: '*', counts: [2, 4], text: (n) => `Harvest ${n} crops`, reward: (n) => ({ coins: n * 30, xp: n * 8 }), minLevel: 2 },
  { type: 'collect', target: 'beach', counts: [5, 10], text: (n) => `Pick up ${n} beach items`, reward: (n) => ({ coins: n * 10, xp: n * 4 }) },
  { type: 'cook', target: '*', counts: [1, 3], text: (n) => `Cook ${n} dishes`, reward: (n) => ({ coins: n * 50, xp: n * 15 }), minLevel: 3 },
  { type: 'defeat', target: 'pirate', counts: [2, 5], text: (n) => `Defeat ${n} pirates`, reward: (n) => ({ coins: n * 60, gems: 2, xp: n * 20 }), flag: 'raids' },
  { type: 'talk', target: '*', counts: [3, 5], text: (n) => `Chat with ${n} islanders`, reward: (n) => ({ coins: n * 15, xp: n * 5 }) },
];

export const BEACH_ITEMS = ['shell', 'starfish', 'driftwood', 'coral_piece', 'obsidian', 'doubloon', 'bottle'];
