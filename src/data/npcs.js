// spot: a named location defined by the island layout.
// schedule: always | night (19:00-07:00 only) | day
export const NPCS = {
  mayor: {
    name: 'Mayor Kalani', title: 'Mayor of Palmora', island: 'palmora', spot: 'mayor', schedule: 'always',
    look: { gender: 'm', skin: 3, hair: 'buzz', hairColor: 8, eyes: 1, top: 'hawaiian_blue', bottom: 'pants_white', hat: null, acc: 'lei', shoes: '#5a3825' },
    loves: ['fish_starlight_koi', 'fruit_salad'], likes: ['coconut_juice', 'mango', 'pineapple'],
    greet: { day: ['Ah, {name}! Palmora shines brighter with you around.', 'Another beautiful day in paradise!'], night: ['Still awake, {name}? Mind the beaches — pirates prowl at night.', 'The stars are out. Lovely, isn\'t it?'] },
    chat: ['Palmora was founded by fishers. We still judge people by the size of their catch!', 'Coralia Reef holds a fishing tournament every day. You should enter!', 'They say the Leviathan surfaces on rainy nights. Nonsense... probably.', 'Have you visited Nana Leia? Her fish tacos could end wars.', 'I used to sail, you know. Then I got this lovely desk job.'],
  },
  finn: {
    name: 'Old Finn', title: 'Tackle Shop', island: 'palmora', spot: 'finn', schedule: 'always', shop: 'tackle',
    look: { gender: 'm', skin: 1, hair: 'short', hairColor: 8, eyes: 2, top: 'sailor', bottom: 'pants_cargo', hat: 'cap_red', acc: null, shoes: '#3a3040' },
    loves: ['fish_golden_marlin', 'fish_glowfin'], likes: ['grilled_fish', 'bait_magic', 'coconut_juice'],
    greet: { day: ['The fish are bitin\' today, kid.', 'Ahoy! Need a better rod?'], night: ['Night fishin\'? Now you\'re thinkin\' like a pro. Rare ones come out after dark.', 'Glow Bait works wonders at night, mark my words.'] },
    chat: ['Hold the reel when the fish is in the green zone. Let go when it dives!', 'Better rods give you a bigger catch zone and better luck.', 'Some fish only bite in the rain. Patience pays.', 'I once caught a Golden Marlin. Arm hasn\'t been the same since.', 'Night fish fetch a pretty price at Marina\'s stall.'],
  },
  marina: {
    name: 'Marina', title: 'Fish Market', island: 'palmora', spot: 'marina', schedule: 'always', shop: 'fishmarket',
    look: { gender: 'f', skin: 2, hair: 'bun', hairColor: 0, eyes: 0, top: 'tee_white', bottom: 'skirt_teal', hat: null, acc: 'scarf', shoes: '#3f6fa8' },
    loves: ['pearl', 'fish_manta'], likes: ['fish_snapper', 'shell', 'starfish', 'sushi_platter'],
    greet: { day: ['Fresh catch? I\'ll give you a fair price!', 'Mornin\'! Market\'s open.'], night: ['Late delivery? I\'ll still buy.', 'Ooh, night fish? Those are pricey.'] },
    chat: ['Rarer fish sell for way more. Legendaries? Jackpot.', 'A perfect catch — never leaving the zone — is worth a bonus!', 'My dream? Opening a sushi bar. One day.', 'Shells and starfish? Coco buys those, not me.'],
  },
  coco: {
    name: 'Coco', title: 'Fruit & Seeds', island: 'palmora', spot: 'coco', schedule: 'always', shop: 'general',
    look: { gender: 'f', skin: 4, hair: 'curly', hairColor: 0, eyes: 1, top: 'dots_pink', bottom: 'shorts_denim', hat: 'flower_crown', acc: null, shoes: '#e86f8a' },
    loves: ['dragonfruit', 'mango_smoothie'], likes: ['strawberry', 'banana', 'flowerpot'],
    greet: { day: ['Hiya! Seeds, fruit, shovels — I\'ve got it all!', 'Everything grows on Palmora!'], night: ['Shh, the plants are sleeping. What do you need?'] },
    chat: ['Water your crops and they grow 50% faster. Rain waters them for free!', 'Trees take longer, but they keep giving fruit forever.', 'Cooking fruit into products earns WAY more coins.', 'Dragon fruit loves heat. I hear Ember Isle sells cuttings... wait, I sell them!'],
  },
  luna: {
    name: 'Luna', title: 'Boutique & Pets', island: 'palmora', spot: 'luna', schedule: 'always', shop: 'boutique',
    look: { gender: 'f', skin: 0, hair: 'long', hairColor: 9, eyes: 4, top: 'blouse_lilac', bottom: 'skirt_floral', hat: null, acc: 'sunglasses', shoes: '#f2f0ff' },
    loves: ['pearl', 'ruby'], likes: ['flowerpot', 'starfish', 'coral_piece', 'mango_smoothie'],
    greet: { day: ['Darling! That outfit... we can do better.', 'Fashion is an island too, you know.'], night: ['Moonlight fashion show? I\'m in.'] },
    chat: ['Press C anywhere to open your wardrobe and change outfits.', 'Pets are the best accessory. And they help you!', 'Gems buy the most fabulous things. Find them in treasure and rare catches.', 'Clothes don\'t make the islander... but they help.'],
  },
  bo: {
    name: 'Bo', title: 'Builder', island: 'palmora', spot: 'bo', schedule: 'always', shop: 'builder', services: ['build'],
    look: { gender: 'm', skin: 3, hair: 'buzz', hairColor: 0, eyes: 1, top: 'plaid_flannel', bottom: 'pants_cargo', hat: 'straw_hat', acc: null, shoes: '#3a3040' },
    loves: ['seafood_feast'], likes: ['driftwood', 'stone', 'grilled_fish'],
    greet: { day: ['Hammer time! Need a bigger house?', 'Wood, stone, coins — that\'s all I need.'], night: ['Can\'t build in the dark... but I can sell you stuff.'] },
    chat: ['Driftwood washes up on the beaches. Stones sit near rocks.', 'A bigger house means more farm plots!', 'Decorations make your place feel like home. Press B at home to place them.', 'I built the lighthouse. Well, I held the ladder.'],
  },
  reyes: {
    name: 'Captain Reyes', title: 'Shipwright', island: 'palmora', spot: 'reyes', schedule: 'always', shop: 'shipwright', services: ['travel'],
    look: { gender: 'm', skin: 2, hair: 'short', hairColor: 1, eyes: 0, top: 'captain_coat', bottom: 'pants_white', hat: 'captain_hat', acc: null, shoes: '#2a2534' },
    loves: ['doubloon', 'fish_swordfish'], likes: ['coconut_juice', 'fish_tuna'],
    greet: { day: ['Fair winds! Ready to see the world?', 'Every island has its own fish. Go explore!'], night: ['Night sailing? Brave. Or foolish.'] },
    chat: ['A Raft gets you to Coralia. A Sailboat to Ember. Only a Galleon survives Skull Cay.', 'Use any dock to set sail once you own a boat.', 'Captain Blackfin... we don\'t talk about Blackfin.'],
  },
  pip: {
    name: 'Pip', title: 'Island Kid', island: 'palmora', spot: 'pip', schedule: 'day', scale: 0.78,
    look: { gender: 'm', skin: 1, hair: 'spiky', hairColor: 3, eyes: 2, top: 'tee_coral', bottom: 'board_shorts', hat: null, acc: 'backpack', shoes: '#f0846a' },
    loves: ['sugar_candy', 'starfish'], likes: ['shell', 'strawberry', 'berry_jam'],
    greet: { day: ['Wanna see my shell collection?!', 'Race you to the dock! ...Okay, maybe later.'] },
    chat: ['If you find a bottle on the beach, open it! It shows where treasure is!', 'X marks the spot! You need a shovel to dig.', 'My cat once caught a fish bigger than her. True story.', 'Night is spooky. Pirates come at night!'],
  },
  nana: {
    name: 'Nana Leia', title: 'Island Cook', island: 'palmora', spot: 'nana', schedule: 'always',
    look: { gender: 'f', skin: 3, hair: 'bun', hairColor: 8, eyes: 1, top: 'hawaiian_red', bottom: 'skirt_floral', hat: null, acc: 'lei', shoes: '#5a3825' },
    loves: ['fish_taco', 'seafood_feast'], likes: ['coconut', 'pineapple', 'fish_seaweed'],
    greet: { day: ['Eat something, sweetie. You look thin.', 'Smell that? That\'s love. And garlic.'], night: ['Midnight snack? I won\'t tell.'] },
    chat: ['Cook at the campfire by your home. Recipes unlock as you level up.', 'Food heals you — very handy when pirates come knocking.', 'A Seafood Feast sells for a fortune.', 'Seaweed! Don\'t throw it away. Sushi needs it.'],
  },
  moth: {
    name: 'Moth', title: 'Night Merchant', island: 'palmora', spot: 'moth', schedule: 'night', shop: 'night',
    look: { gender: 'f', skin: 0, hair: 'bob', hairColor: 6, eyes: 4, top: 'starry_robe', bottom: 'pants_white', hat: 'witch_hat', acc: null, shoes: '#2a2534' },
    loves: ['fish_leviathan', 'fish_starlight_koi'], likes: ['pearl', 'fish_glowfin', 'fish_squid'],
    greet: { night: ['The moon brought you to me. How... fortunate.', 'I only trade when the stars are out.'] },
    chat: ['The Starlight Koi only swims near Palmora on clear nights.', 'My wares are paid for in gems. Rare things have rare prices.', 'When dawn comes, I vanish. Don\'t ask where.'],
  },

  // Coralia Reef
  shelly: {
    name: 'Shelly', title: 'Reef Diver', island: 'coralia', spot: 'shelly', schedule: 'always', shop: 'reef',
    look: { gender: 'f', skin: 4, hair: 'pigtails', hairColor: 7, eyes: 2, top: 'tank_sun', bottom: 'board_shorts', hat: null, acc: 'sunglasses', shoes: '#58b4a5' },
    loves: ['coral_piece', 'fish_blue_tang'], likes: ['fish_clownfish', 'shell', 'melon_slush'],
    greet: { day: ['Welcome to the reef! Isn\'t the water gorgeous?', 'Dive in! Er, fish in.'], night: ['The reef glows at night. Octopuses come out!'] },
    chat: ['Reef fish love the Coral Rod.', 'Coral pieces wash up here — collect them!', 'Manta rays glide by during the day. Huge ones!'],
  },
  mo: {
    name: 'Big Mo', title: 'Tournament Host', island: 'coralia', spot: 'mo', schedule: 'always', services: ['tournament'], scale: 1.15,
    look: { gender: 'm', skin: 5, hair: 'buzz', hairColor: 0, eyes: 1, top: 'hawaiian_red', bottom: 'shorts_khaki', hat: 'cap_red', acc: 'sunglasses', shoes: '#f2f0e6' },
    loves: ['trophy_gold'], likes: ['fish_tuna', 'fish_mahi', 'fish_taco'],
    greet: { day: ['WELCOME, CHALLENGER! Ready to reel?', 'The crowd is HUNGRY for big fish!'], night: ['Tournaments run from 7AM to 7PM. Come back in the daylight, champ!'] },
    chat: ['Score is based on fish value AND weight. Big rare fish win tournaments!', 'Bronze, Silver, Gold leagues. Win them all and you get my crown. Well, A crown.', 'Rivals get better in higher leagues. Bring your best rod!'],
  },
  kai: {
    name: 'Kai', title: 'Surfer', island: 'coralia', spot: 'kai', schedule: 'day',
    look: { gender: 'm', skin: 2, hair: 'long', hairColor: 3, eyes: 2, top: 'tank_sun', bottom: 'board_shorts', hat: null, acc: 'lei', shoes: '#f7c95c' },
    loves: ['melon_slush'], likes: ['coconut_juice', 'banana'],
    greet: { day: ['Duuude. The waves are gnarly today.', 'Hang loose!'] },
    chat: ['I saw a whale made of rainbows once. Nobody believes me.', 'Rain makes the Coral Dragon come out. Totally real.', 'Life\'s a beach, bro.'],
  },

  // Ember Isle
  ash: {
    name: 'Ash', title: 'Blacksmith', island: 'ember', spot: 'ash', schedule: 'always', shop: 'forge',
    look: { gender: 'm', skin: 4, hair: 'spiky', hairColor: 5, eyes: 0, top: 'ember_jacket', bottom: 'pants_cargo', hat: null, acc: null, shoes: '#2a2534' },
    loves: ['obsidian', 'ruby'], likes: ['doubloon', 'stone', 'dragon_bowl'],
    greet: { day: ['Need a blade? I forge the best.', 'Hot enough for ya?'], night: ['The forge never sleeps. Neither do I.'] },
    chat: ['Pirates hit hard. Better weapon = shorter fights.', 'Obsidian washes up on these black beaches.', 'The Ember Rod? Forged it myself. Worth every coin.'],
  },
  sage: {
    name: 'Sage', title: 'Volcano Mystic', island: 'ember', spot: 'sage', schedule: 'always', shop: 'mystic',
    look: { gender: 'f', skin: 2, hair: 'long', hairColor: 8, eyes: 4, top: 'starry_robe', bottom: 'skirt_teal', hat: null, acc: 'lei', shoes: '#3a2f6b' },
    loves: ['fish_phoenix_fin', 'dragonfruit'], likes: ['obsidian', 'pearl', 'health_tonic'],
    greet: { day: ['The mountain speaks... it says hello.', 'Welcome, child of the tides.'], night: ['The Phoenix Fin stirs on nights like this.'] },
    chat: ['The hot spring heals all wounds. Step in when you\'re hurt.', 'The Phoenix Fin rises from lava waters at night.', 'Fortune favours those who fish in the rain.'],
  },

  // Skull Cay
  patch: {
    name: 'Patch', title: 'Ex-Pirate Trader', island: 'skull', spot: 'patch', schedule: 'always', shop: 'pirate',
    look: { gender: 'm', skin: 3, hair: 'curly', hairColor: 0, eyes: 0, top: 'pirate_vest', bottom: 'pirate_pants', hat: 'bandana_blue', acc: 'eyepatch', shoes: '#2a2534' },
    loves: ['doubloon', 'ruby'], likes: ['coconut_juice', 'fish_barracuda'],
    greet: { day: ['Arr — I mean, hello! I\'m retired.', 'Blackfin\'s crew don\'t like visitors. Watch yerself.'], night: ['Ghost Sharks circle these waters at night...'] },
    chat: ['Blackfin camps at the heart of the island. Bring a big sword.', 'Pirates drop doubloons. I buy \'em at a good price.', 'Defeat Blackfin and his rod is yours. Legendary stuff.'],
  },
};
for (const [id, n] of Object.entries(NPCS)) n.id = id;

export const HEART_REWARDS = {
  3: { coins: 150, text: 'a small thank-you gift' },
  6: { gems: 10, text: 'a shiny gift' },
  10: { gems: 30, text: 'their most treasured gift' },
};
