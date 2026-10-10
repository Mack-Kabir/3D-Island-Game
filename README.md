# Tidewander — 3D Island Game

A cozy island-life adventure built with **Three.js**: fish, farm, build, sail, make friends and fight pirates across a hand-drawn, cel-shaded archipelago.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a static site in `dist/` you can host anywhere.

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move (Shift to run) |
| Space | Jump (also dodges attacks) |
| E | Talk, fish, plant, pick, interact |
| F / click near enemies | Attack |
| Mouse drag / wheel | Rotate / zoom camera |
| I or Tab · J · M · C | Bag · Quests · Map · Wardrobe |
| Esc | Menu / close |

Touch devices get an on-screen joystick and action buttons.

## Features

- **Male or female character** with skin, hair style/colour, eyes and a wardrobe of tops, bottoms, hats and accessories (patterned fabrics, sunglasses, crowns…).
- **Day & night** — night runs 7 PM to 7 AM. Use game time (24-minute days) or switch to your real-world clock in Settings. Night brings stars, lanterns, fireflies, night-only fish, a night merchant and pirate raids.
- **Fishing** — 36 species in 7 rarity tiers (Junk → Mythic), time/weather/island-specific fish, a reel-in minigame with treasure snags, perfect-catch bonuses and a Fishdex.
- **Gear** — 8 rods, 4 baits, 6 weapons, 3 boats, 4 pets with perks.
- **Economy** — sell fish, fruit, cooked food and treasure for coins; earn gems from rare catches, quests, tournaments, digging and bounties.
- **Farming & cooking** — plant seeds and fruit trees, water them, harvest, then cook 11 recipes that sell for more and heal you.
- **Building** — upgrade from tent to Seaside Manor (more farm plots each level) and place decorations.
- **4 islands** — Palmora (home), Coralia Reef (fishing tournaments), Ember Isle (volcano, blacksmith, hot spring) and Skull Cay (pirate lair and boss).
- **15 NPCs** with dialogue, friendship hearts, gifts and side quests; an 11-part main story; daily bounties; daily login streak; weather (rain & storms).
- **Accessible UI** — keyboard navigable, text-size options, high-contrast mode, reduced motion, rarity shown with icons + text (not colour alone), screen-reader announcements.

## Project layout

Code is grouped by feature: everything about fishing lives in `fishing/`, everything about the farm in `farm/`, and so on.

```
src/
  main.js, game.js   boot, game loop, camera, saving, coins/XP, buying & selling
  shared/    item catalogue, input, events, helpers, audio, save files, game clock
  world/     islands, terrain, ocean, sky, weather, trees & buildings, critters, foraging
  fishing/   fish, rods & lures, boats, fishing minigame, boat fishing, tournaments
  farm/      crops, fruit trees, animals, farm buildings, the field, farm tools, feeder
  kitchen/   recipes, cooking, the recipe book, kitchen models
  home/      your house & upgrades, tent, decorations, home menu
  people/    your character, islanders, dialogue, shops, outfits, pets
  combat/    weapons, pirates, fighting
  story/     main & side quests, quest log, waypoint guide, opening cutscene
  ui/        HUD, menus, title & character creator, icons
```

All art and audio are generated in code — no external assets.
