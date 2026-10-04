// spot: a named location defined by the island layout.
// schedule: always | night (19:00-07:00 only) | day
// topics: conversation choices the player can ask about (multi-line answers).
// Lines can be strings (the islander speaks) or { you: '...' } (the player replies).
export const NPCS = {
  mayor: {
    name: 'Mayor Mike', title: 'Mayor of Palmora', island: 'palmora', spot: 'mayor', schedule: 'always',
    look: { gender: 'm', skin: 3, hair: 'short', hairColor: 8, eyes: 1, top: 'hawaiian_blue', bottom: 'pants_white', hat: null, acc: 'lei', shoes: '#5a3825' },
    loves: ['fish_starlight_koi', 'fruit_salad'], likes: ['coconut_juice', 'mango', 'pineapple'],
    greet: { day: ['Ah, {name}! Palmora shines brighter with you around.', 'Another beautiful day in paradise, {name}!'], night: ['Still awake, {name}? Mind the beaches — pirates prowl at night.', 'The stars are out. Lovely, isn\'t it?'] },
    chat: ['Palmora was founded by fishers. We still judge people by the size of their catch!', 'Coralia Reef holds a fishing tournament every day. You should enter once you have a boat!', 'They say the Leviathan surfaces on rainy nights. Nonsense... probably.', 'Have you visited Grandma Rose? Her fish tacos could end wars.', 'I used to sail, you know. Then I got this lovely desk job.'],
    topics: [
      { q: 'How can I make money?', a: ['Great question! Here are the easy ways to earn coins on Palmora:', '1) Beachcombing — walk over shells, starfish and driftwood on the sand. Chloe at the fruit stand buys shells and starfish.', '2) Fruit — stand next to a fruit tree and press E to shake it. Chloe buys fruit too.', '3) Fishing — Old Ross at the dock gives every newcomer a free rod. Megan at the fish market buys fish.', '4) Farming and cooking — plant seeds at your homestead, and cook at your campfire. Cooked food sells for the most!'] },
      { q: 'Where is everything?', a: ['The village square is right here, with the well in the middle.', 'Chloe\'s fruit stand is on the south side of the square. Lily\'s boutique is west, Grandma Rose\'s kitchen is east, and Bob\'s workshop is further east.', 'Follow the path south to the dock — that\'s where Old Ross, Megan and Captain Jack work.', 'Your homestead is down the path to the west. Press M any time to open the map!'] },
      { q: 'Tell me about the other islands.', a: ['Coralia Reef has crystal lagoons and Coach LeBron\'s fishing tournament.', 'Ember Isle has a volcano, hot springs and Hank the blacksmith.', 'And Skull Cay... that\'s where Captain Blackfin and his pirates hide. Stay away until you\'re strong!', 'Captain Jack at our dock sells boats so you can visit them.'] },
    ],
  },
  finn: {
    name: 'Old Ross', title: 'Tackle Shop', island: 'palmora', spot: 'finn', schedule: 'always', shop: 'tackle',
    look: { gender: 'm', skin: 1, hair: 'short', hairColor: 8, eyes: 2, top: 'sailor', bottom: 'pants_cargo', hat: 'cap_red', acc: null, shoes: '#3a3040' },
    loves: ['fish_golden_marlin', 'fish_glowfin'], likes: ['grilled_fish', 'bait_magic', 'coconut_juice'],
    greet: { day: ['The fish are bitin\' today, kid.', 'Ahoy! Need a better rod or some bait?'], night: ['Night fishin\'? Now you\'re thinkin\' like a pro. Rare ones come out after dark.', 'Glow Bait works wonders at night, mark my words.'] },
    chat: ['Better rods give you a bigger catch zone and better luck.', 'Some fish only bite in the rain. Patience pays.', 'I once caught a Golden Marlin. Arm hasn\'t been the same since.', 'Night fish fetch a pretty price at Megan\'s stall.'],
    topics: [
      { q: 'How do I fish again?', a: ['Easy! Stand at the end of the dock or on the shore and FACE the water.', 'Press E to cast. Wait until the bobber dips and a big "!" pops up — then press E quickly!', 'Now the reel game: HOLD Space, E or the mouse button to lift the green bar. Let go to let it sink.', 'Keep the fish icon inside the green bar and the meter on the right fills up. Fill it to land the fish!'] },
      { q: 'What does bait do?', a: ['Bait makes fish bite faster and brings rarer fish. Each cast uses one.', 'Worms are basic. Shrimp is better. Glow Bait is amazing at night.', 'No bait? You can still fish — it just takes longer.'] },
      { q: 'Which rod should I get?', a: ['Bigger zone means an easier reel game. More luck means rarer fish.', 'The Oak Rod is a great first upgrade at level 3. Save up for it!'] },
    ],
  },
  marina: {
    name: 'Megan', title: 'Fish Market', island: 'palmora', spot: 'marina', schedule: 'always', shop: 'fishmarket',
    look: { gender: 'f', skin: 2, hair: 'bun', hairColor: 0, eyes: 0, top: 'tee_white', bottom: 'skirt_teal', hat: null, acc: 'scarf', shoes: '#3f6fa8' },
    loves: ['pearl', 'fish_manta'], likes: ['fish_snapper', 'shell', 'starfish', 'sushi_platter'],
    greet: { day: ['Fresh catch? I\'ll give you a fair price!', 'Mornin\'! The market\'s open.'], night: ['Late delivery? I\'ll still buy.', 'Ooh, night fish? Those are pricey.'] },
    chat: ['Rarer fish sell for way more. Legendaries? Jackpot.', 'A perfect catch — never letting the fish leave the zone — is worth a bonus!', 'My dream? Opening a sushi bar one day.'],
    topics: [
      { q: 'How does selling work?', a: ['Pick "Sell items" when you talk to me, then press Sell next to any fish.', 'I pay 10% extra for fish compared to other shops!', 'Shells, fruit and food? Take those to Chloe at the fruit stand in the village.'] },
    ],
  },
  coco: {
    name: 'Chloe', title: 'Fruit & Seeds', island: 'palmora', spot: 'coco', schedule: 'always', shop: 'general',
    look: { gender: 'f', skin: 4, hair: 'curly', hairColor: 0, eyes: 1, top: 'dots_pink', bottom: 'shorts_denim', hat: 'flower_crown', acc: null, shoes: '#e86f8a' },
    loves: ['dragonfruit', 'mango_smoothie'], likes: ['strawberry', 'banana', 'flowerpot'],
    greet: { day: ['Hiya! Seeds, fruit, shovels — I\'ve got it all!', 'Everything grows on Palmora!'], night: ['Shh, the plants are sleeping. What do you need?'] },
    chat: ['Water your crops and they grow 50% faster. Rain waters them for free!', 'Trees take longer, but they give fruit forever.', 'Cooking fruit into food earns WAY more coins.'],
    topics: [
      { q: 'What do you buy?', a: ['I buy fruit, cooked food, and beach finds like shells, starfish and coral!', 'Pick "Sell items" when you talk to me to see what you can sell.'] },
      { q: 'How does farming work?', a: ['Buy seeds from me, then go to your homestead west of the village.', 'Stand on a brown soil patch and press E to plant. Press E again to water it each day.', 'When it\'s ripe, press E to harvest. Trees keep fruiting every 12 hours!'] },
    ],
  },
  luna: {
    name: 'Lily', title: 'Boutique & Pets', island: 'palmora', spot: 'luna', schedule: 'always', shop: 'boutique',
    look: { gender: 'f', skin: 0, hair: 'long', hairColor: 9, eyes: 4, top: 'blouse_lilac', bottom: 'skirt_floral', hat: null, acc: 'sunglasses', shoes: '#f2f0ff' },
    loves: ['pearl', 'ruby'], likes: ['flowerpot', 'starfish', 'coral_piece', 'mango_smoothie'],
    greet: { day: ['Darling! That outfit... we can do better.', 'Fashion is an island too, you know.'], night: ['Moonlight fashion show? I\'m in.'] },
    chat: ['Pets are the best accessory. And they actually help you!', 'Gems buy the most fabulous things. Find them in treasure and rare catches.', 'Clothes don\'t make the islander... but they help.'],
    topics: [
      { q: 'How do I change clothes?', a: ['Press C anywhere — or the Style button — to open your wardrobe.', 'Anything you buy from me shows up there instantly. Try things on, darling!'] },
      { q: 'What do pets do?', a: ['A kitten boosts your fishing luck. A puppy sniffs out extra treasure.', 'A parrot haggles so you earn more when selling, and a sea turtle gives you extra health.', 'Pets cost gems. Rare fish, treasure and quests give gems.'] },
    ],
  },
  bo: {
    name: 'Bob', title: 'Builder', island: 'palmora', spot: 'bo', schedule: 'always', shop: 'builder', services: ['build'],
    look: { gender: 'm', skin: 3, hair: 'buzz', hairColor: 0, eyes: 1, top: 'plaid_flannel', bottom: 'pants_cargo', hat: 'straw_hat', acc: null, shoes: '#3a3040' },
    loves: ['seafood_feast'], likes: ['driftwood', 'stone', 'grilled_fish'],
    greet: { day: ['Hammer time! Need a bigger house?', 'Wood, stone, coins — that\'s all I need.'], night: ['Can\'t build in the dark... but I can sell you stuff.'] },
    chat: ['A bigger house means more farm plots!', 'I built the lighthouse. Well, I held the ladder.', 'Decorations make your place feel like home.'],
    topics: [
      { q: 'Where do I find materials?', a: ['Driftwood washes up on the sandy beaches every day — just walk over it.', 'Stones sit next to the big grey rocks around the island.', 'In a hurry? I sell both, 5 at a time.'] },
      { q: 'How do decorations work?', a: ['Buy them from me, then open your Bag, pick the decoration and press "Place at home".', 'You place them inside your homestead fence. R rotates, E places it.'] },
    ],
  },
  reyes: {
    name: 'Captain Jack', title: 'Shipwright', island: 'palmora', spot: 'reyes', schedule: 'always', shop: 'shipwright', services: ['travel'],
    look: { gender: 'm', skin: 2, hair: 'short', hairColor: 1, eyes: 0, top: 'captain_coat', bottom: 'pants_white', hat: 'captain_hat', acc: null, shoes: '#2a2534' },
    loves: ['doubloon', 'fish_swordfish'], likes: ['coconut_juice', 'fish_tuna'],
    greet: { day: ['Fair winds! Ready to see the world?', 'Every island has its own fish. Go explore!'], night: ['Night sailing? Brave. Or foolish.'] },
    chat: ['Captain Blackfin... we don\'t talk about Blackfin.', 'The sea teaches patience. And seasickness.'],
    topics: [
      { q: 'How do I get to other islands?', a: ['You need a boat! A Bamboo Raft gets you to Coralia Reef.', 'A Sailboat reaches Ember Isle, and only a Galleon survives Skull Cay.', 'Once you own one, walk onto any dock and press E next to your boat — or ask me to set sail.'] },
    ],
  },
  pip: {
    name: 'Tommy', title: 'Island Kid', island: 'palmora', spot: 'pip', schedule: 'day', scale: 0.78,
    look: { gender: 'm', skin: 1, hair: 'spiky', hairColor: 3, eyes: 2, top: 'tee_coral', bottom: 'board_shorts', hat: null, acc: 'backpack', shoes: '#f0846a' },
    loves: ['sugar_candy', 'starfish'], likes: ['shell', 'strawberry', 'berry_jam'],
    greet: { day: ['Wanna see my shell collection?!', 'Race you to the dock! ...Okay, maybe later.'] },
    chat: ['My cat once caught a fish bigger than her. True story.', 'Night is spooky. Pirates come at night!'],
    topics: [
      { q: 'Any secrets?', a: ['If you find a bottle on the beach, open it from your Bag! It shows where treasure is buried!', 'X marks the spot! You need a shovel from Chloe to dig.', 'Shells are everywhere on the beach. I collect them!'] },
    ],
  },
  nana: {
    name: 'Grandma Rose', title: 'Island Cook', island: 'palmora', spot: 'nana', schedule: 'always',
    look: { gender: 'f', skin: 3, hair: 'bun', hairColor: 8, eyes: 1, top: 'hawaiian_red', bottom: 'skirt_floral', hat: null, acc: 'lei', shoes: '#5a3825' },
    loves: ['fish_taco', 'seafood_feast'], likes: ['coconut', 'pineapple', 'fish_seaweed'],
    greet: { day: ['Eat something, sweetie. You look thin.', 'Smell that? That\'s love. And garlic.'], night: ['Midnight snack? I won\'t tell.'] },
    chat: ['Food heals you — very handy when pirates come knocking.', 'A Seafood Feast sells for a fortune.', 'Seaweed! Don\'t throw it away. Sushi needs it.'],
    topics: [
      { q: 'How do I cook?', a: ['Go to the campfire next to your home on the west meadow and press E.', 'Pick a recipe and press Cook. Grilled Fish needs just one fish — perfect to start!', 'Cooked food sells for much more than raw fish or fruit. Chloe buys it.', 'You can also eat food from your Bag to heal.'] },
    ],
  },
  moth: {
    name: 'Madison', title: 'Night Merchant', island: 'palmora', spot: 'moth', schedule: 'night', shop: 'night',
    look: { gender: 'f', skin: 0, hair: 'bob', hairColor: 6, eyes: 4, top: 'starry_robe', bottom: 'pants_white', hat: 'witch_hat', acc: null, shoes: '#2a2534' },
    loves: ['fish_leviathan', 'fish_starlight_koi'], likes: ['pearl', 'fish_glowfin', 'fish_squid'],
    greet: { night: ['The moon brought you to me. How... fortunate.', 'I only trade when the stars are out.'] },
    chat: ['The Starlight Koi only swims near Palmora on clear nights.', 'When dawn comes, I vanish. Don\'t ask where.'],
    topics: [
      { q: 'What do you sell?', a: ['Rare things. The Golden Rod. A Storm Trident. Clothes woven from starlight.', 'My wares cost gems. Rare things have rare prices.'] },
    ],
  },

  // Coralia Reef
  shelly: {
    name: 'Sarah', title: 'Reef Diver', island: 'coralia', spot: 'shelly', schedule: 'always', shop: 'reef',
    look: { gender: 'f', skin: 4, hair: 'pigtails', hairColor: 7, eyes: 2, top: 'tank_sun', bottom: 'board_shorts', hat: null, acc: 'sunglasses', shoes: '#58b4a5' },
    loves: ['coral_piece', 'fish_blue_tang'], likes: ['fish_clownfish', 'shell', 'melon_slush'],
    greet: { day: ['Welcome to the reef! Isn\'t the water gorgeous?', 'Dive in! Er, fish in.'], night: ['The reef glows at night. Octopuses come out!'] },
    chat: ['Coral pieces wash up here — collect them!', 'Manta rays glide by during the day. Huge ones!'],
    topics: [{ q: 'What lives on the reef?', a: ['Clownfish, Parrotfish and Blue Tang during the day. Octopus at night.', 'And when it rains... some say a Coral Dragon appears.'] }],
  },
  mo: {
    name: 'Coach LeBron', title: 'Tournament Host', island: 'coralia', spot: 'mo', schedule: 'always', services: ['tournament'], scale: 1.15,
    look: { gender: 'm', skin: 5, hair: 'buzz', hairColor: 0, eyes: 1, top: 'hawaiian_red', bottom: 'shorts_khaki', hat: 'cap_red', acc: 'sunglasses', shoes: '#f2f0e6' },
    loves: ['trophy_gold'], likes: ['fish_tuna', 'fish_mahi', 'fish_taco'],
    greet: { day: ['WELCOME, CHALLENGER! Ready to reel?', 'The crowd is HUNGRY for big fish!'], night: ['Tournaments run from 7AM to 7PM. Come back in the daylight, champ!'] },
    chat: ['Bronze, Silver, Gold leagues. Win them all and you get the crown!', 'Rivals get better in higher leagues. Bring your best rod!'],
    topics: [{ q: 'How do tournaments work?', a: ['Pay the entry fee and you get 3 minutes to fish from this pier.', 'Every fish scores points: rarer and heavier fish score way more. Junk scores nothing!', 'Beat my three rivals and finish top 3 for prizes. First place wins a trophy!'] }],
  },
  kai: {
    name: 'Kyle', title: 'Surfer', island: 'coralia', spot: 'kai', schedule: 'day',
    look: { gender: 'm', skin: 2, hair: 'long', hairColor: 3, eyes: 2, top: 'tank_sun', bottom: 'board_shorts', hat: null, acc: 'lei', shoes: '#f7c95c' },
    loves: ['melon_slush'], likes: ['coconut_juice', 'banana'],
    greet: { day: ['Duuude. The waves are gnarly today.', 'Hang loose!'] },
    chat: ['I saw a whale made of rainbows once. Nobody believes me.', 'Life\'s a beach, bro.'],
    topics: [{ q: 'Seen anything cool?', a: ['Rain makes the Coral Dragon come out. Totally real.', 'Coconut palms here drop tons of coconuts. Shake \'em, bro!'] }],
  },

  // Ember Isle
  ash: {
    name: 'Hank', title: 'Blacksmith', island: 'ember', spot: 'ash', schedule: 'always', shop: 'forge',
    look: { gender: 'm', skin: 4, hair: 'spiky', hairColor: 5, eyes: 0, top: 'ember_jacket', bottom: 'pants_cargo', hat: null, acc: null, shoes: '#2a2534' },
    loves: ['obsidian', 'ruby'], likes: ['doubloon', 'stone', 'dragon_bowl'],
    greet: { day: ['Need a blade? I forge the best.', 'Hot enough for ya?'], night: ['The forge never sleeps. Neither do I.'] },
    chat: ['Obsidian washes up on these black beaches.', 'The Ember Rod? Forged it myself. Worth every coin.'],
    topics: [{ q: 'How do I fight?', a: ['Press F to swing your weapon. Better weapons hit harder and reach further.', 'Watch for the red "!" above a pirate — that means they\'re about to strike. Jump with Space to dodge!', 'Eat food from your Bag to heal, or soak in the hot spring here.'] }],
  },
  sage: {
    name: 'Grace', title: 'Volcano Mystic', island: 'ember', spot: 'sage', schedule: 'always', shop: 'mystic',
    look: { gender: 'f', skin: 2, hair: 'long', hairColor: 8, eyes: 4, top: 'starry_robe', bottom: 'skirt_teal', hat: null, acc: 'lei', shoes: '#3a2f6b' },
    loves: ['fish_phoenix_fin', 'dragonfruit'], likes: ['obsidian', 'pearl', 'health_tonic'],
    greet: { day: ['The mountain speaks... it says hello.', 'Welcome, child of the tides.'], night: ['The Phoenix Fin stirs on nights like this.'] },
    chat: ['The hot spring heals all wounds. Step in when you\'re hurt.', 'Fortune favours those who fish in the rain.'],
    topics: [{ q: 'Tell me about the volcano.', a: ['Its heat feeds rare fish: the Lava Catfish, and at night the Phoenix Fin.', 'Dragon fruit loves this warm soil too.'] }],
  },

  // Skull Cay
  patch: {
    name: 'Pete', title: 'Ex-Pirate Trader', island: 'skull', spot: 'patch', schedule: 'always', shop: 'pirate',
    look: { gender: 'm', skin: 3, hair: 'curly', hairColor: 0, eyes: 0, top: 'pirate_vest', bottom: 'pirate_pants', hat: 'bandana_blue', acc: 'eyepatch', shoes: '#2a2534' },
    loves: ['doubloon', 'ruby'], likes: ['coconut_juice', 'fish_barracuda'],
    greet: { day: ['Arr — I mean, hello! I\'m retired.', 'Blackfin\'s crew don\'t like visitors. Watch yerself.'], night: ['Ghost Sharks circle these waters at night...'] },
    chat: ['Pirates drop doubloons. I buy \'em at a good price.', 'Defeat Blackfin and his rod is yours. Legendary stuff.'],
    topics: [{ q: 'How do I beat Blackfin?', a: ['He camps at the heart of the island. Bring a big sword and plenty of food.', 'When he crouches and yells CHARGE, jump or run sideways!', 'Clear out his crew first — fighting them all at once is a bad idea.'] }],
  },
};
// Extra conversation topics so everyone has plenty to say.
const EXTRA_TOPICS = {
  mayor: [{ q: 'Any work for me?', a: ['Always! Check the bounty board by the well — new jobs are posted every morning.', 'And talk to everyone you meet. Most islanders have a little task for a helpful newcomer.'] }],
  finn: [{ q: 'Tell me about yourself.', a: ['Been fishin\' these waters fifty years. Started with a bamboo rod just like yours.', 'Lost a finger to a barracuda once. Grew back. ...No it didn\'t. I\'m kidding.'] }],
  marina: [
    { q: 'Which fish sell best?', a: ['Rare fish — blue badge or better — sell for 100+ coins.', 'Night fish and rain fish are worth more too. Check the Fishdex in your Bag to see where each fish lives.'] },
    { q: 'What\'s your dream?', a: ['A little sushi bar right here on the dock! Fresh fish, sunset views...', 'If you ever cook a Sushi Platter, I\'d love to try it.'] },
  ],
  coco: [{ q: 'What should I plant first?', a: ['Strawberries! Cheap, fast, and they give 3–4 berries each.', 'Once you have more coins, try pineapples and watermelons — they sell for much more.', 'And plant a mango sapling early. Trees take time, but they fruit forever.'] }],
  luna: [{ q: 'What\'s in style this season?', a: ['Aloha shirts, darling. Bold flowers. And anything that sparkles.', 'Madison sells a Starry Robe at night... I\'m not jealous. Much.'] }],
  bo: [{ q: 'What can I build?', a: ['Tent → Beach Hut → Bungalow → Villa → Seaside Manor!', 'Each upgrade gives you more farm plots. Talk to me and pick "Upgrade my home" to see what you need.'] }],
  reyes: [{ q: 'Tell me a sea story.', a: ['Once I sailed through a storm so wild, the fish were flying over the deck!', 'I caught three with my hat. Best dinner of my life.'] }],
  pip: [
    { q: 'What do you want to be?', a: ['A pirate hunter! Or a fisher! Or a pirate hunter who fishes!', 'Mayor Mike says I have to finish my chores first...'] },
    { q: 'Know any games?', a: ['Try walking along the whole beach without stepping on the grass! It\'s really hard!', 'Also crabs run away if you get close. They\'re so funny.'] },
  ],
  nana: [{ q: 'What\'s your best recipe?', a: ['The Seafood Feast. Five fish, a coconut and a pineapple.', 'It sells for over 400 coins, sweetie. Worth every bite.'] }],
  moth: [{ q: 'Who are you, really?', a: ['A traveller between the stars and the sea.', 'Or perhaps... just someone who doesn\'t like sunburns.'] }],
  shelly: [{ q: 'How do you dive so deep?', a: ['Practice! And holding my breath for a looong time.', 'One day you\'ll see the reef glowing at night. It\'s magical.'] }],
  mo: [{ q: 'Who are the rivals?', a: ['Rachel, Gary and Chad. They\'re GOOD. In the Gold League they\'re legends.', 'But you know what beats talent? A legendary fish on the last second!'] }],
  kai: [{ q: 'Teach me to surf?', a: ['Duuude, first you gotta feel the wave. Be the wave.', '...Actually I just fall off a lot. But it\'s fun!'] }],
  ash: [{ q: 'What\'s the best weapon?', a: ['The Ember Blade — 38 damage and it leaves sparks.', 'But the Storm Trident from that night merchant? Even I\'m impressed.'] }],
  sage: [{ q: 'Can you read my fortune?', a: ['I see... fish. Many fish. And a large pile of coins.', 'Also you should water your crops. The spirits are clear on that.'] }],
  patch: [{ q: 'Why did you quit piracy?', a: ['The hours were terrible and Blackfin never shared the treasure.', 'Now I trade honest goods. Mostly honest. Fairly honest.'] }],
};
for (const [id, topics] of Object.entries(EXTRA_TOPICS)) NPCS[id].topics.push(...topics);

for (const [id, n] of Object.entries(NPCS)) n.id = id;

export const HEART_REWARDS = {
  3: { coins: 150, text: 'a small thank-you gift' },
  6: { gems: 10, text: 'a shiny gift' },
  10: { gems: 30, text: 'their most treasured gift' },
};
