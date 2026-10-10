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
    desc: 'Last night\'s storm washed you ashore on Palmora with nothing but the clothes on your back. Find Mayor Mike in the village square — follow the yellow arrow.',
    objectives: [
      {
        type: 'talk', target: 'mayor', text: 'Talk to Mayor Mike', hint: 'Follow the yellow arrow to the Mayor\'s blue-roofed house, walk up to him and press E.',
        lines: [
          'Goodness me! You\'re soaked to the bone! Did that storm last night wash you up on our beach?',
          { you: 'I think so... I don\'t remember much. Just waves, and then sand. Where am I?' },
          'You\'re on Palmora, the friendliest island in the whole archipelago! I\'m Mike — the mayor. Don\'t you worry, we\'ll get you on your feet.',
          { you: 'I don\'t have anything. Not even a place to sleep.' },
          'We can fix that right now! I keep a spare tent for travellers. I\'ll have it pitched on the old homestead on the west meadow — it\'s been empty for years.',
          'There\'s a farm field out there, and an old outdoor kitchen... well, what\'s left of it. One thing at a time!',
          { you: 'Thank you so much! How do people make a living here?' },
          'Plenty of ways! Islanders earn coins by beachcombing, picking fruit, fishing, farming and cooking.',
          'Here — 25 coins to get you started. It\'s not much, but hard work pays on Palmora!',
          'Go take a look at your new home first. Follow the yellow arrow west — your tent will be ready by the time you get there!',
        ],
        give: { coins: 25, tent: true },
      },
      { type: 'home', text: 'Check out your tent', hint: 'Follow the arrow down the western path to the homestead and press E at your tent.' },
    ],
    rewards: { xp: 20 },
  },
  m1b: {
    main: true, title: 'Beachcomber', next: 'm2',
    desc: 'The easiest way to earn your first coins: collect free things from the beach and the trees, then sell them to Chloe in the village square.',
    objectives: [
      { type: 'collect', target: 'beach', count: 3, text: 'Pick up 3 beach items', hint: 'Walk onto the sand (follow the arrow). Shells, starfish and driftwood are free — they\'re picked up automatically when you walk over them.' },
      { type: 'collect', target: 'fruit', count: 1, text: 'Shake a fruit tree', hint: 'Find a tree with coloured fruit on it (follow the arrow), stand next to it and press E to shake it.' },
      {
        type: 'talk', target: 'coco', text: 'Talk to Chloe at the fruit stand', hint: 'Chloe\'s stand has a pink-and-white striped roof in the village square. Press E next to her.',
        lines: [
          'Hiya! Mike told me about you. Welcome to Palmora!',
          { you: 'I found some shells and fruit. Do you buy them?' },
          'I sure do! Shells, starfish, coral and fruit — and cooked food too.',
          'Whenever you want to sell, talk to me and choose "Sell items". Then press Sell next to anything.',
          'Driftwood is for building though — keep it! Bob the builder will need it to fix things up at your homestead.',
        ],
      },
      { type: 'sell', target: 'shop:general', count: 2, text: 'Sell 2 items to Chloe', hint: 'Talk to Chloe → "Sell items" → press Sell next to your shells or fruit.' },
    ],
    rewards: { coins: 20, xp: 30 },
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
          'Wait for the bobber to dip and a big "!" to pop up. Then press E (or click) quickly to hook it! Pressing too early is fine — just wait.',
          'Then the fight: TAP E, Space or the mouse again and again to pull it in. On a phone, tap the REEL button.',
          'But watch out — when the fish THRASHES and the panel flashes red, stop tapping for a moment, or your line will snap!',
          'You won\'t know what you\'ve hooked until it\'s out of the water. Could be a beauty... could be an old boot!',
          'And big fish need a strong rod. This bamboo one is fine for small fry — save up for a better rod later.',
          'Keep the little fish inside the green bar and the meter on the right fills up. Fill it and the fish is yours!',
          { you: 'Got it — cast, wait for "!", press E, then tap fast — but stop when it thrashes.' },
          'Exactly! Off you go — the end of the dock is the best spot.',
        ],
        give: { rods: ['bamboo'], items: { bait_worm: 15 } },
      },
      { type: 'catch', target: '*', count: 3, text: 'Catch 3 fish', hint: 'Walk to the end of the dock, face the water and press E. Junk like old boots doesn\'t count!' },
    ],
    rewards: { coins: 30, xp: 40 },
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
          'Oh — and Ross has a lesson for you about lures. When someone has a request, you\'ll see a ❔ above their head!',
        ],
      },
      { type: 'sell', target: 'type:fish', count: 3, text: 'Sell 3 fish to Megan', hint: 'Talk to Megan → "Sell items" → press Sell next to your fish.' },
    ],
    rewards: { coins: 40, xp: 40, gems: 5 },
  },
  m4: {
    main: true, title: 'Green Thumb', next: 'm4k',
    desc: 'Chloe wants to help you start a farm at your homestead.',
    objectives: [
      {
        type: 'talk', target: 'coco', text: 'Talk to Chloe about farming', hint: 'Chloe is at the fruit stand in the village square.',
        lines: [
          'A farmer in the making! I\'ve got just the thing.',
          'Take these strawberry seeds and my old watering can.',
          'Your homestead is down the path west of the village — look for the fence and the brown soil patches.',
          'Use the farm tool bar at the bottom: tap 🌱 Plant, pick your seeds, then click — or drag across — the soil patches. Your cursor turns into the seed!',
          'Then tap 🚿 Water and drag over your crops. Watered crops grow 50% faster!',
          { you: 'How long do strawberries take?' },
          'About 6 hours of island time — that\'s only about 6 real minutes! Rain waters them for free.',
        ],
        give: { items: { seed_strawberry: 4, watering_can: 1 } },
      },
      { type: 'plant', target: '*', count: 2, text: 'Plant 2 seeds at your homestead', hint: 'At your homestead, tap 🌱 Plant on the farm tool bar, pick the seeds, then click (or drag across) empty soil patches.' },
      { type: 'harvest', target: '*', count: 1, text: 'Harvest a crop', hint: 'Water your crops (E) and wait until fruit appears, then press E on the patch. Explore or fish while you wait!' },
    ],
    rewards: { coins: 50, xp: 60 },
  },
  m4k: {
    main: true, title: 'Kitchen Rebuild', next: 'm4b', turnIn: 'bo',
    desc: 'Grandma Rose says cooked food sells for far more than raw ingredients. But the old kitchen at your homestead is a ruin — time to get Bob to fix it.',
    objectives: [
      {
        type: 'talk', target: 'nana', text: 'Talk to Grandma Rose', hint: 'Grandma Rose stands outside her orange-roofed kitchen on the east side of the square.',
        lines: [
          'Oh, sweetie, come here! You look hungry. Are you the one living out on the old homestead?',
          { you: 'That\'s me! There\'s a broken-down kitchen out there...' },
          'Ah, the old outdoor kitchen! I baked many a pie in that oven, back in the day. A storm knocked it to pieces.',
          'A cook needs a kitchen! Raw food sells for pennies, but a cooked dish sells for three times as much — and heals you, too.',
          { you: 'Could it be fixed?' },
          'Bob the builder can fix anything! He\'ll need driftwood and stone, though. Ask him at his workshop, east of the square.',
        ],
      },
      {
        type: 'talk', target: 'bo', text: 'Ask Bob about the kitchen', hint: 'Bob\'s workshop has a straw roof, east of the village square.',
        lines: [
          'Rose sent you? That old kitchen of yours... I remember it! Fine oven. Terrible roof.',
          { you: 'Can you fix it?' },
          'Sure can! Bring me 6 Driftwood and 3 Stone. I\'ll do the work for free — any friend of Rose\'s, eh?',
          'Driftwood washes up on the beaches — just walk over it. Little stones sit next to the big grey rocks. Or buy them from me if you\'re in a hurry.',
        ],
      },
      { type: 'have', target: 'driftwood', count: 6, text: 'Bring Bob 6 Driftwood', consume: true, hint: 'Walk over driftwood logs on the sandy beaches (or buy 5 for 16 coins from Bob). Then talk to Bob → "Hand over".' },
      { type: 'have', target: 'stone', count: 3, text: 'Bring Bob 3 Stone', consume: true, hint: 'Walk over small stones next to the big grey rocks (or buy them from Bob). Then talk to Bob → "Hand over".' },
      {
        type: 'talk', target: 'bo', text: 'Talk to Bob to rebuild the kitchen', hint: 'Bob\'s workshop has a straw roof, east of the village square.',
        lines: [
          'That\'s everything! Right — let\'s go. *grabs hammer*',
          '*hammering* ... *sawing* ... *a lot more hammering* ... *one very loud BANG*',
          'Done! New roof, new walls, cabinets, and I cleaned the soot out of that old brick oven. Fire\'s lit, too!',
          { you: 'Wow, thank you Bob!' },
          'Go have a look! And go tell Rose — she\'s itching to teach you some recipes.',
        ],
        give: { buildings: ['kitchen'] },
      },
    ],
    rewards: { coins: 30, xp: 60 },
  },
  m4b: {
    main: true, title: 'Home Cooking', next: 'm4c',
    desc: 'Your kitchen is fixed! Now Grandma Rose wants to teach you how to cook.',
    objectives: [
      {
        type: 'talk', target: 'nana', text: 'Tell Grandma Rose about your kitchen', hint: 'Grandma Rose stands outside her orange-roofed kitchen on the east side of the square.',
        lines: [
          'Bob fixed up the old kitchen? Oh, how wonderful! I can almost smell the bread already.',
          { you: 'Mike said you\'re the best cook on the island.' },
          'He\'s not wrong! Let me teach you. Your kitchen is right next to your tent on the west meadow.',
          'Walk up to it and press E to cook. Grilled Fish needs just one fish — easy!',
          'A raw sardine sells for 10 coins. Grilled, it sells for 30. Fancy recipes sell for hundreds!',
          'Here\'s a pineapple. Fish + pineapple makes a Fish Taco — my favourite.',
        ],
        give: { items: { pineapple: 1 } },
      },
      { type: 'cook', target: '*', count: 1, text: 'Cook a dish in your kitchen', hint: 'Go to the kitchen beside your tent (arrow) and press E, tap Grilled Fish, then Cook. It needs only 1 fish.' },
      { type: 'sell', target: 'type:product', count: 1, text: 'Sell a cooked dish to Chloe', hint: 'Talk to Chloe → "Sell items" → sell your cooked food.' },
    ],
    rewards: { coins: 40, xp: 60, gems: 3 },
  },
  m5: {
    main: true, title: 'A Roof Overhead', next: 'm5b',
    desc: 'A tent won\'t survive storm season. Gather materials and ask Bob to build you a hut.',
    objectives: [
      {
        type: 'talk', target: 'bo', text: 'Talk to Bob the builder', hint: 'Bob\'s workshop has a straw roof, east of the village square.',
        lines: [
          'A new neighbour! Living in a tent, eh? We can fix that.',
          { you: 'What do I need for a hut?' },
          '10 Driftwood, 5 Stone and 300 coins. A sturdier house keeps you healthier, too!',
          'Driftwood washes up on the beaches — walk over it. Stones sit next to big grey rocks.',
          'Or buy them from me if you\'re in a hurry. Come back when you\'ve got everything!',
        ],
      },
      { type: 'have', target: 'driftwood', count: 10, text: 'Gather 10 Driftwood', hint: 'Walk over driftwood logs on the sandy beaches. New ones wash up every day. Bob also sells 5 for 16 coins.' },
      { type: 'have', target: 'stone', count: 5, text: 'Gather 5 Stone', hint: 'Look next to the big grey rocks around the island and walk over small stones. Bob sells them too.' },
      { type: 'build', target: 1, count: 1, text: 'Build a Beach Hut', hint: 'Talk to Bob → "Upgrade my home" → Build it! (needs 300 coins). You can also press E at your tent.' },
      { type: 'sleep', text: 'Sleep in your new hut', hint: 'Walk to your hut\'s door, press E and pick Sleep. Sleeping heals you, saves the game and skips to morning.' },
    ],
    rewards: { coins: 100, xp: 100, gems: 5 },
  },
  m4c: {
    main: true, title: 'Kitchen Basics', next: 'm5',
    desc: 'Grandma Rose teaches you how your kitchen\'s recipe book works — and how to make ingredients like flour.',
    objectives: [
      {
        type: 'talk', target: 'nana', text: 'Talk to Grandma Rose about your kitchen', hint: 'Grandma Rose stands outside her kitchen on the east side of the square.',
        lines: [
          'You cooked your first dish! Now let me show you how your kitchen REALLY works, sweetie.',
          'Press E at your kitchen and you\'ll see the recipe book. Each tab is a different kind of food — Basics, Drinks, Snacks, Meals, Desserts and Feasts.',
          'Green cards are ready to cook. Tap any card and you\'ll see what it needs: the left number is how many you have, the right number is how many you need.',
          { you: 'What are "Basics"?' },
          'Ingredients for bigger recipes! Wheat becomes Flour, Flour becomes Bread, Pizza, Cakes... Sugarcane becomes Sugar, Milk becomes Butter and Cheese.',
          'New recipes unlock every time you level up. Here — some wheat seeds. Grow them, make flour, then bake me a loaf of bread!',
        ],
        give: { items: { seed_wheat: 6 } },
      },
      { type: 'plant', target: '*', count: 3, text: 'Plant the wheat seeds', hint: 'At your farm, tap 🌱 Plant, pick Wheat Seeds, then click or drag across empty soil patches.' },
      { type: 'harvest', target: '*', count: 3, text: 'Harvest 3 patches', hint: 'Wheat takes about 4 hours of island time (4 real minutes). Water it to speed it up, then press E on a ripe patch.' },
      { type: 'cook', target: 'flour', count: 1, text: 'Make Flour in your kitchen', hint: 'Press E at your kitchen → Basics tab → Flour → Cook. It needs 3 wheat.' },
      { type: 'cook', target: 'bread', count: 1, text: 'Bake Fresh Bread', hint: 'In your kitchen: Snacks tab → Fresh Bread → Cook. It needs 2 flour.' },
    ],
    rewards: { coins: 50, xp: 90, items: { seed_wheat: 4 } },
  },
  m5b: {
    main: true, title: 'Life on the Farm', next: 'm6',
    desc: 'Chloe thinks it\'s time your farm had some animals. First they\'ll need a home and a feeder.',
    objectives: [
      {
        type: 'talk', target: 'coco', text: 'Talk to Chloe about farm animals', hint: 'Chloe\'s fruit stand has a pink-and-white striped roof in the village square.',
        lines: [
          'A real house AND a farm? You need some animals!',
          'See the broken chicken coop at the south end of your farm? Bob can rebuild it — he\'ll ask you for driftwood and stone.',
          { you: 'What do chickens eat?' },
          'Feed, from a Feeder! Bob builds one too. Fill it with feed you make from crops — wheat, carrots, corn — and your animals eat on their own.',
          'Then collect eggs, milk, honey and more. They\'re great in recipes, and later you\'ll even get a bit of fertilizer when you collect!',
          'Later on Bob can build a cow barn, goat pen, bee hives, a sheep fold and a pig sty. Go see him!',
        ],
      },
      { type: 'construct', target: 'coop', text: 'Get the chicken coop rebuilt', hint: 'Talk to Bob and accept his request "Coop Restoration" (from level 3). Bring him 8 driftwood and 4 stone.' },
      { type: 'construct', target: 'feeder', text: 'Build a Feeder', hint: 'Talk to Bob → "Farm buildings" → Feeder (120 coins, 6 driftwood, 3 stone).' },
      { type: 'makefeed', count: 4, text: 'Make 4 feed at the Feeder', hint: 'Press E at the Feeder (west side of your farm) and turn carrots or wheat into feed.' },
      { type: 'collect', target: 'egg', count: 2, text: 'Collect 2 eggs', hint: 'Your chickens eat from the Feeder, then lay eggs after a few hours. Press E on a chicken with an egg above it.' },
    ],
    rewards: { coins: 80, xp: 140, items: { fertilizer: 2 } },
  },
  m6: {
    main: true, title: 'Setting Sail', next: 'm6b',
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
      { type: 'visit', target: 'coralia', count: 1, text: 'Sail to Coralia Reef', hint: 'Walk next to your boat at the dock, press E → "Set sail", then choose Coralia Reef on the sea chart.' },
    ],
    rewards: { coins: 150, xp: 120 },
  },
  m6b: {
    main: true, title: 'Deep Water', next: 'm7',
    desc: 'Captain Jack shows you how to fish from your own boat, where the big deep-sea fish live.',
    objectives: [
      {
        type: 'talk', target: 'reyes', text: 'Talk to Captain Jack about boat fishing', hint: 'Captain Jack stands at the start of the Palmora dock.',
        lines: [
          'You\'ve got a boat — but have you FISHED from it? Out in deep water the big ones bite.',
          'Walk to your boat at the dock, press E and pick "Fish from the boat". I\'ll have it rowed out for you.',
          'Turn with A and D (or the joystick), face open water and press E to cast. Press Q or "Back to dock" when you\'re done.',
          { you: 'Which fish live out there?' },
          'Tuna, Mahi-Mahi, Swordfish, Marlin... In your Fishdex they\'re marked 🚤. They bite far more often from a boat.',
          'Take these Squid Strips — deep-sea fish love them. And one day, buy my Deep-Sea Trolling Rod. It only works from a boat, but oh boy...',
        ],
        give: { items: { bait_squid: 5 } },
      },
      { type: 'catch', target: 'boat', count: 2, text: 'Catch 2 fish from your boat', hint: 'Press E next to your boat at the dock → "Fish from the boat". Then face the water and press E to cast.' },
    ],
    rewards: { coins: 100, xp: 130 },
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
      { type: 'visit', target: 'ember', count: 1, text: 'Sail to Ember Isle', hint: 'Use your boat at any dock (press E → "Set sail") and pick Ember Isle.' },
      { type: 'own', target: 'weapon:cutlass', count: 1, text: 'Get a Cutlass (or better) from Hank', hint: 'Hank\'s forge is the dark house in Ember Isle\'s village. Talk to him → Shop.' },
    ],
    rewards: { coins: 500, xp: 300, gems: 15 },
  },
  m10: {
    main: true, title: 'The Black Flag', next: 'm11',
    desc: 'It\'s time. Sail to Skull Cay and defeat Captain Blackfin once and for all.',
    objectives: [
      { type: 'own', target: 'boat:galleon', count: 1, text: 'Buy a Galleon (8,500 coins + 25 gems, Lv 12)', hint: 'Talk to Captain Jack on Palmora → Shop → Galleon.' },
      { type: 'visit', target: 'skull', count: 1, text: 'Sail to Skull Cay', hint: 'Use your boat at any dock (press E → "Set sail") and pick Skull Cay.' },
      { type: 'defeat', target: 'blackfin', count: 1, text: 'Defeat Captain Blackfin', hint: 'Blackfin camps in the middle of Skull Cay. Bring food to heal and dodge his charge!' },
    ],
    rewards: { coins: 3000, xp: 800, gems: 100, rods: ['golden'], cosmetics: ['blackfin_hat'] },
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
    rewards: { coins: 50, xp: 60, gems: 5, items: { sugar_candy: 1 } },
  },
  s_finn: {
    title: 'Night Fisher', giver: 'finn', requires: 'm3',
    desc: 'Ross says the best fish come out after dark.',
    offer: 'Real anglers fish at night. Catch me 3 fish after 7 PM and I\'ll make it worth your while.',
    objectives: [{ type: 'catch', target: 'night', count: 3, text: 'Catch 3 fish at night (7 PM–7 AM)', hint: 'Fish any time between 7 PM and 7 AM. Check the clock in the top-right.' }],
    rewards: { coins: 80, xp: 90, items: { bait_glow: 10 } },
  },
  s_marina: {
    title: 'Big Order', giver: 'marina', requires: 'm3',
    desc: 'Megan has a huge order from Coralia.',
    offer: 'I need 12 fish for a banquet order. Any kind! Help me out?',
    objectives: [{ type: 'sell', target: 'type:fish', count: 12, text: 'Sell 12 fish', hint: 'Sell any fish to Megan (or any shop that buys fish).' }],
    rewards: { coins: 150, xp: 120, gems: 5 },
  },
  s_nana: {
    title: 'Grandma\'s Recipe', giver: 'nana', requires: 'm4b',
    desc: 'Grandma Rose wants to pass on her famous recipe.',
    offer: 'Cook me a Fish Taco in your kitchen — 1 fish and 1 pineapple. Then you\'ll be family!',
    objectives: [{ type: 'cook', target: 'fish_taco', count: 1, text: 'Cook a Fish Taco', hint: 'Needs 1 fish + 1 pineapple. Pineapple seeds are sold by Chloe. Cook it in your kitchen.' }],
    rewards: { coins: 120, xp: 120, gems: 8 },
  },
  s_luna: {
    title: 'Fashionista', giver: 'luna', requires: 's_style',
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
    rewards: { coins: 120, xp: 120, items: { sapling_mango: 1 } },
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
  s_lures: {
    title: 'Lure School', giver: 'finn', requires: 'm3',
    desc: 'Old Ross teaches you about lures — every one attracts different fish.',
    offer: 'Worms are fine, kid, but a real angler carries a tackle box. Different lures catch different fish! Want a lesson?',
    objectives: [
      {
        type: 'talk', target: 'finn', text: 'Listen to Ross\'s lure lesson', hint: 'Old Ross stands by the blue-roofed tackle hut at the dock.',
        lines: [
          'There are eight lures on these islands. Each one does something different:',
          'Crickets make fish bite fast. Shrimp brings rarer fish. Spinner Spoons flash in the sun — great by day. Glow Lures shine at night.',
          'Squid Strips call up deep-sea fish, Storm Jigs work best in the rain, and the Magic Lure... well, that\'s magic.',
          { you: 'How do I switch lures?' },
          'Open your Bag → Gear → Bait and press "Use" on the one you want. When you cast, you\'ll see your lure fly through the air!',
          'Here, a few crickets and shrimp to try. Catch me some fish with a lure on — no worms!',
        ],
        give: { items: { bait_cricket: 5, bait_shrimp: 3 } },
      },
      { type: 'catch', target: 'lure', count: 3, text: 'Catch 3 fish using a lure (not worms)', hint: 'Bag → Gear → Bait → press "Use" on Cricket or Shrimp. Then fish anywhere.' },
    ],
    rewards: { coins: 40, xp: 70, items: { bait_spinner: 3 } },
  },
  s_rods: {
    title: 'A Stronger Line', giver: 'finn', requires: 's_lures', minLevel: 3,
    desc: 'Big fish snap weak lines. Ross explains rod power.',
    offer: 'Lost a big one lately? That\'s your rod, not you. Let me tell you about rod power.',
    objectives: [
      {
        type: 'talk', target: 'finn', text: 'Ask Ross about rods', hint: 'Old Ross is at the tackle hut by the dock.',
        lines: [
          'Every rod has POWER. Every fish needs a certain power to land without snapping your line.',
          'Bamboo is power 1 — fine for small fry. Oak is 3, Carbon Pro is 5, and the Golden Rod is 7.',
          'And Captain Jack\'s Deep-Sea Trolling Rod is the strongest of all — but it only works from a boat.',
          { you: 'How do I know what a fish needs?' },
          'Check your Fishdex: it tells you the power each fish needs. Tap the "?" when you\'re reeling — if your rod is straining, it\'ll warn you.',
        ],
      },
      { type: 'own', target: 'rod:oak', count: 1, text: 'Get an Oak Rod', hint: 'Buy it from Ross: talk to him → Shop → Oak Rod (350 coins, level 3).' },
      { type: 'catch', target: 'tier:uncommon', count: 1, text: 'Catch an Uncommon (or rarer) fish', hint: 'Use a good lure like Shrimp for better odds.' },
    ],
    rewards: { coins: 50, xp: 90, items: { bait_shrimp: 5 } },
  },
  s_dex: {
    title: 'Fish Collector', giver: 'marina', requires: 'm3', minLevel: 4,
    desc: 'Megan wants you to fill your Fishdex.',
    offer: 'Did you know there are 52 kinds of fish (and junk!) around the islands? Your Fishdex in the Bag keeps track. Discover 10 for me?',
    objectives: [{ type: 'own', target: 'dex:10', count: 1, text: 'Discover 10 species (Bag → Fishdex)', hint: 'Every new species gives gems! Try fishing at night, in the rain, on other islands, and from your boat.' }],
    rewards: { gems: 5, xp: 100 },
  },
  s_trolling: {
    title: 'Trolling the Deep', giver: 'reyes', requires: 'm6b', minLevel: 11,
    desc: 'Captain Jack\'s Deep-Sea Trolling Rod — the strongest rod there is, for boat fishing only.',
    offer: 'Ready for the big leagues? My Deep-Sea Trolling Rod lands anything that swims — but only from a boat.',
    objectives: [
      { type: 'own', target: 'rod:deepsea', count: 1, text: 'Buy the Deep-Sea Trolling Rod', hint: 'Captain Jack → Shop → Deep-Sea Trolling Rod. Equip it in Bag → Gear.' },
      { type: 'catch', target: 'rod:deepsea', count: 2, text: 'Catch 2 fish with it from your boat', hint: 'Use your boat → "Fish from the boat", with the Deep-Sea Rod equipped.' },
    ],
    rewards: { gems: 10, xp: 300 },
  },
  s_water: {
    title: 'Water & Grow', giver: 'coco', requires: 'm4', minLevel: 2,
    desc: 'Chloe shows you how to make crops grow faster.',
    offer: 'Want your crops to grow faster? Let me show you watering and fertilizer!',
    objectives: [
      {
        type: 'talk', target: 'coco', text: 'Ask Chloe about growing faster', hint: 'Chloe is at the fruit stand in the village square.',
        lines: [
          'Watered crops grow 50% faster! Press E on a growing crop with your watering can — it soaks the patches around it too.',
          'Fertilizer is even better: a growing crop grows 40% faster AND gives an extra harvest. Super Fertilizer does twice that!',
          { you: 'Will I get more soil patches?' },
          'Yes! New patches open up every time you level up — up to fifty. Seeds also fill the empty patches around the one you plant.',
          'Here\'s some fertilizer to try. Later you can buy sprinklers so you never have to water again!',
        ],
        give: { items: { fertilizer: 2 } },
      },
      { type: 'water', count: 4, text: 'Water 4 crops', hint: 'At your farm, tap 🚿 Water on the farm tool bar, then click or drag across growing crops.' },
      { type: 'fertilize', count: 1, text: 'Fertilize a crop', hint: 'Tap 🧴 Fertilize on the farm tool bar, then click a growing crop.' },
    ],
    rewards: { coins: 40, xp: 70 },
  },
  s_sprinkler: {
    title: 'Easy Watering', giver: 'coco', requires: 's_water', minLevel: 6,
    desc: 'Sprinklers water every patch on your farm by themselves.',
    offer: 'Tired of watering? A Sprinkler System waters your whole farm every day!',
    objectives: [{ type: 'own', target: 'irrigation:1', count: 1, text: 'Install a Sprinkler System', hint: 'Chloe → Shop → Sprinkler System (900 coins, level 6).' }],
    rewards: { coins: 100, xp: 160 },
  },
  s_goats: {
    title: 'New Neighbours', giver: 'bo', requires: 's_coop', minLevel: 7,
    desc: 'Bob can build a goat pen — goats give goat milk for cheese.',
    offer: 'How about some goats? I\'ll build you a rocky little pen. Goat milk makes the best cheese!',
    objectives: [
      { type: 'construct', target: 'goatpen', text: 'Build a Goat Pen', hint: 'Talk to Bob → "Farm buildings" → Goat Pen (900 coins, 25 driftwood, 15 stone).' },
      { type: 'buy', target: 'goat', count: 1, text: 'Buy a goat from Chloe', hint: 'Chloe → Shop → Goat (700 coins).' },
      { type: 'collect', target: 'goat_milk', count: 1, text: 'Collect goat milk', hint: 'Keep the Feeder full and press E on your goat when it has milk.' },
    ],
    rewards: { xp: 220, items: { animal_feed: 10 } },
  },
  s_hives: {
    title: 'Sweet as Honey', giver: 'nana', requires: 'm4c', minLevel: 8,
    desc: 'Grandma Rose needs honey for her famous tea.',
    offer: 'Sweetie, my honey jar is empty! If Bob builds you some bee hives, will you make me a Honey Lemon Tea?',
    objectives: [
      { type: 'construct', target: 'hives', text: 'Get Bob to build Bee Hives', hint: 'Talk to Bob → "Farm buildings" → Bee Hives (level 8). Then buy bees from Chloe.' },
      { type: 'collect', target: 'honey', count: 1, text: 'Collect honey', hint: 'Bees don\'t need feeding — press E on the hive when honey appears.' },
      { type: 'cook', target: 'honey_tea', count: 1, text: 'Make Honey Lemon Tea', hint: 'Needs 1 honey + 1 lemon (grow a Lemon Tree). Kitchen → Drinks.' },
    ],
    rewards: { coins: 150, xp: 220, gems: 3 },
  },
  s_baker: {
    title: 'Bake Sale', giver: 'nana', requires: 'm4c', minLevel: 7,
    desc: 'Grandma Rose is running a bake sale for the village.',
    offer: 'It\'s bake sale week! Can you make me some pancakes and a batch of butter cookies?',
    objectives: [
      { type: 'cook', target: 'pancakes', count: 1, text: 'Cook Pancakes', hint: 'Needs flour, an egg and milk. Kitchen → Meals.' },
      { type: 'cook', target: 'cookies', count: 1, text: 'Bake Butter Cookies', hint: 'Needs flour, sugar and butter (from milk). Kitchen → Desserts.' },
    ],
    rewards: { coins: 120, xp: 160 },
  },
  s_dig: {
    title: 'X Marks the Spot', giver: 'pip', requires: 'm1b', minLevel: 2,
    desc: 'Tommy has found treasure marks in the sand.',
    offer: 'I found X marks in the sand! Pirates buried treasure there for SURE. Can you dig one up? I\'m not allowed to have a shovel.',
    objectives: [
      { type: 'have', target: 'shovel', count: 1, text: 'Get a Shovel', hint: 'Chloe sells shovels at the fruit stand (120 coins).' },
      { type: 'collect', target: 'treasure', count: 1, text: 'Dig up a treasure at an X mark', hint: 'Look for red X marks on beaches (tap one to check). Stand on it and press E. Messages in bottles show you more!' },
    ],
    rewards: { coins: 30, xp: 70, items: { bottle: 1 } },
  },
  s_style: {
    title: 'Island Style', giver: 'luna', requires: 'm1b',
    desc: 'Lily shows you the wardrobe.',
    offer: 'Darling, you\'ve been wearing that since you washed ashore! Press C to open your wardrobe and try something new.',
    objectives: [{ type: 'wear', count: 1, text: 'Change your outfit (press C or Style)', hint: 'Open the wardrobe with C or the Style button, and tap any outfit or hairstyle.' }],
    rewards: { coins: 20, xp: 30 },
  },
  s_pet: {
    title: 'A Furry Friend', giver: 'luna', requires: 's_style', minLevel: 4,
    desc: 'Lily sells pets — and every pet helps you somehow.',
    offer: 'Every islander needs a companion! A kitten brings fishing luck, a parrot haggles for better prices... Adopt one from me!',
    objectives: [{ type: 'own', target: 'pet:*', count: 1, text: 'Adopt a pet', hint: 'Lily → Shop → pick a pet. Pets cost gems — get gems from new fish species, treasure and quests.' }],
    rewards: { xp: 120, items: { bait_shrimp: 5 } },
  },
  s_bounty: {
    title: 'Odd Jobs', giver: 'mayor', requires: 'm2',
    desc: 'The bounty board by the well posts new jobs every day.',
    offer: 'Looking for work? The bounty board next to the well gets 3 new jobs every morning. Finish one and come tell me about it!',
    objectives: [{ type: 'bounty', count: 1, text: 'Finish a job from the bounty board', hint: 'Press E at the bounty board near the well (or open Quests → Daily Bounties) to see today\'s jobs.' }],
    rewards: { coins: 40, xp: 60, gems: 2 },
  },
  s_gift: {
    title: 'Island Kindness', giver: 'mayor', requires: 's_mayor',
    desc: 'Gifts make friends — and friends give gifts back.',
    offer: 'Want to make friends fast? Give someone a little gift! Talk to any islander and pick "Give gift". Everyone has favourites.',
    objectives: [{ type: 'gift', count: 1, text: 'Give a gift to any islander', hint: 'Talk to anyone → "Give gift" → pick an item. Hearts grow with each gift; at 3, 6 and 10 hearts they give you something back!' }],
    rewards: { coins: 30, xp: 50 },
  },
  s_coop: {
    title: 'Coop Restoration', giver: 'bo', requires: 'm1', minLevel: 3,
    desc: 'The old chicken coop on your farm has fallen apart. Bob can rebuild it — with your help.',
    offer: 'Have you seen that wreck of a chicken coop on your farm? I can rebuild it! Bring me 8 Driftwood and 4 Stone, and we\'ll have hens laying eggs in no time.',
    objectives: [
      { type: 'have', target: 'driftwood', count: 8, text: 'Bring Bob 8 Driftwood', consume: true, hint: 'Walk over driftwood on the beaches (or buy 5 for 16 coins from Bob), then talk to Bob → "Hand over".' },
      { type: 'have', target: 'stone', count: 4, text: 'Bring Bob 4 Stone', consume: true, hint: 'Pick up small stones near the big grey rocks (or buy them from Bob), then talk to Bob → "Hand over".' },
      {
        type: 'talk', target: 'bo', text: 'Talk to Bob to rebuild the coop', hint: 'Bob\'s workshop has a straw roof, east of the village square.',
        lines: [
          'Perfect timber, perfect stone! Give me a moment...',
          '*hammering noises* ... *more hammering* ... *one very loud BANG*',
          'Done! Your chicken coop is good as new. Better than new, actually — I added a little porch.',
          { you: 'Thanks, Bob! What do the chickens eat?' },
          'Feed, from a Feeder! Animals eat from it on their own. I can build you one — pick "Farm buildings" when you talk to me.',
          'You can make feed from your crops right at the Feeder: wheat, carrots, corn... or buy a bag from Chloe.',
        ],
        give: { buildings: ['coop'] },
      },
      { type: 'construct', target: 'feeder', count: 1, text: 'Build a Feeder', hint: 'Talk to Bob → "Farm buildings" → Feeder (120 coins, 6 Driftwood, 3 Stone).' },
    ],
    rewards: { coins: 60, xp: 120, animals: { chicken: 2 }, items: { animal_feed: 8 } },
  },
  s_barn: {
    title: 'Raise the Barn', giver: 'bo', requires: 's_coop', minLevel: 6,
    desc: 'A storm wrecked the old cow barn. Time to rebuild it with Bob.',
    offer: 'Ready for something bigger? That cow barn on your farm needs a whole new frame. Bring me 20 Driftwood and 10 Stone, and I\'ll raise it!',
    objectives: [
      { type: 'have', target: 'driftwood', count: 20, text: 'Bring Bob 20 Driftwood', consume: true, hint: 'Collect driftwood on any beach, or buy it from Bob. Then talk to Bob → "Hand over".' },
      { type: 'have', target: 'stone', count: 10, text: 'Bring Bob 10 Stone', consume: true, hint: 'Collect stones near big grey rocks, or buy them from Bob. Then "Hand over".' },
      {
        type: 'talk', target: 'bo', text: 'Talk to Bob to raise the barn', hint: 'Find Bob at his workshop east of the square.',
        lines: [
          'Alright, let\'s raise this barn! Hold this end... no, the OTHER end...',
          '*creak* ... *thud* ... There! A proper red barn, just like the old days.',
          'I threw in a cow, too. She\'s called Daisy. She already likes you.',
        ],
        give: { buildings: ['barn'] },
      },
    ],
    rewards: { xp: 250, animals: { cow: 1 }, items: { animal_feed: 10 } },
  },
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
    rewards: { coins: 40, xp: 50, gems: 3 },
  },
  s_bo: {
    title: 'Lumber Run', giver: 'bo', requires: 'm1',
    desc: 'Bob is short on driftwood for a repair job.',
    offer: 'The dock railings need fixing. Could you bring me 6 Driftwood? I\'ll pay well — and it teaches you where to find building stuff!',
    objectives: [{ type: 'have', target: 'driftwood', count: 6, text: 'Bring 6 Driftwood to Bob', consume: true, hint: 'Walk over driftwood logs on the sandy beaches, then talk to Bob and pick "Hand over".' }],
    rewards: { coins: 50, xp: 50, items: { decor_flowerpot: 1 } },
  },
  s_reyes: {
    title: 'Shipshape', giver: 'reyes', requires: 'm2',
    desc: 'Captain Jack needs a strong fish for his crew\'s lunch.',
    offer: 'My crew is starving! Catch me any Uncommon fish or better — the green badge ones.',
    objectives: [{ type: 'catch', target: 'tier:uncommon', count: 1, text: 'Catch an Uncommon (or rarer) fish', hint: 'Keep fishing — about 1 in 4 fish is Uncommon or better. Shrimp bait helps.' }],
    rewards: { coins: 60, xp: 70, items: { bait_shrimp: 10 } },
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
    rewards: { coins: 100, xp: 90, cosmetics: ['sun_visor'] },
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
QUESTS.s_luna.requires = 's_style';
QUESTS.s_finn.requires = 'm2';
QUESTS.s_marina.requires = 'm2';

for (const [id, q] of Object.entries(QUESTS)) q.id = id;

// Daily bounties (posted on the board in Palmora each morning).
export const BOUNTY_TEMPLATES = [
  { type: 'catch', target: '*', counts: [4, 8], text: (n) => `Catch ${n} fish`, reward: (n) => ({ coins: n * 12, xp: n * 6 }), minLevel: 2 },
  { type: 'catch', target: 'tier:uncommon', counts: [2, 4], text: (n) => `Catch ${n} Uncommon+ fish`, reward: (n) => ({ coins: n * 25, xp: n * 12 }), minLevel: 3 },
  { type: 'catch', target: 'tier:rare', counts: [1, 2], text: (n) => `Catch ${n} Rare+ fish`, reward: (n) => ({ coins: n * 50, gems: 2, xp: n * 25 }), minLevel: 5 },
  { type: 'sell', target: 'type:fruit', counts: [3, 6], text: (n) => `Sell ${n} fruits`, reward: (n) => ({ coins: n * 8, xp: n * 5 }) },
  { type: 'harvest', target: '*', counts: [2, 4], text: (n) => `Harvest ${n} crops`, reward: (n) => ({ coins: n * 15, xp: n * 8 }), minLevel: 2 },
  { type: 'collect', target: 'beach', counts: [5, 10], text: (n) => `Pick up ${n} beach items`, reward: (n) => ({ coins: n * 5, xp: n * 4 }) },
  { type: 'cook', target: '*', counts: [1, 3], text: (n) => `Cook ${n} dishes`, reward: (n) => ({ coins: n * 25, xp: n * 15 }), minLevel: 3, building: 'kitchen' },
  { type: 'defeat', target: 'pirate', counts: [2, 5], text: (n) => `Defeat ${n} pirates`, reward: (n) => ({ coins: n * 35, gems: 2, xp: n * 20 }), flag: 'raids' },
  { type: 'talk', target: '*', counts: [3, 5], text: (n) => `Chat with ${n} islanders`, reward: (n) => ({ coins: n * 8, xp: n * 5 }) },
];

export const BEACH_ITEMS = ['shell', 'starfish', 'driftwood', 'coral_piece', 'obsidian', 'doubloon', 'bottle'];
