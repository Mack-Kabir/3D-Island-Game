import * as THREE from 'three';
import { Events } from './shared/events.js';
import { Input } from './shared/input.js';
import { clamp, damp, dampAngle, randInt } from './shared/utils.js';
import { Sky } from './world/sky.js';
import { Water } from './world/water.js';
import { Environment } from './world/environment.js';
import { Rain, Fireflies, Particles } from './world/effects.js';
import { FX } from './world/fx.js';
import { IslandWorld } from './world/island.js';
import { Player } from './people/player.js';
import { Pet } from './people/pets.js';
import { TimeSystem } from './shared/time.js';
import { Weather } from './world/weather.js';
import { AudioSystem } from './shared/audio.js';
import { QuestSystem } from './story/questSystem.js';
import { FishingSystem } from './fishing/fishing.js';
import { BoatTrip } from './fishing/boatFishing.js';
import { Intro } from './story/intro.js';
import { FarmTools } from './farm/farmTools.js';
import { HomeSystem } from './home/homestead.js';
import { CombatSystem } from './combat/combat.js';
import { Competition } from './fishing/tournament.js';
import { newState, saveGame, loadGame, loadSettings, saveSettings } from './shared/save.js';
import { UI } from './ui/ui.js';
import { Dialogue } from './people/dialogue.js';
import { showTitle, hideScreens } from './ui/screens.js';
import { ISLANDS } from './world/islands.js';
import { ITEMS } from './shared/items.js';
import { ANIMALS } from './farm/animals.js';
import { IRRIGATION } from './farm/crops.js';
import { FISH } from './fishing/fish.js';
import { RODS_BY_ID, BOATS_BY_ID } from './fishing/gear.js';
import { WEAPONS, WEAPONS_BY_ID } from './combat/weapons.js';
import { PETS_BY_ID } from './people/pets.js';
import { COSMETICS } from './people/cosmetics.js';
import { SHOPS } from './people/shops.js';
import { el } from './shared/utils.js';
import { CookingMethods } from './kitchen/cooking.js';
import { FishingProgressMethods } from './fishing/progress.js';
export class Game {
  constructor() {
    this.settings = loadSettings();
    this.events = new Events();
    this.state = null;
    this.mode = 'boot';
    this.modal = 0;
    this.t = 0;
    this.travelling = false;

    const canvas = document.getElementById('scene');
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1400);
    this.camera.position.set(60, 40, 90);

    this.input = new Input(this, canvas);
    this.audio = new AudioSystem(this);
    this.time = new TimeSystem(this);
    this.ui = new UI(this);
    this.weather = new Weather(this);
    this.env = new Environment(this.scene);
    this.sky = new Sky(this.scene);
    this.water = new Water(this.scene);
    this.rain = new Rain(this.scene);
    this.fireflies = new Fireflies(this.scene);
    this.particles = new Particles(this.scene);
    this.fx = new FX(this);
    this.quests = new QuestSystem(this);
    this.fishing = new FishingSystem(this);
    this.boatTrip = new BoatTrip(this);
    this.farmTools = new FarmTools(this);
    this.intro = new Intro(this);
    this.home = new HomeSystem(this);
    this.combat = new CombatSystem(this);
    this.competition = new Competition(this);
    this.dialogue = new Dialogue(this);

    this.cam = {
      yaw: 0.5, pitch: 0.42, dist: 10, mode: 'orbit', target: new THREE.Vector3(), shakeT: 0, orbit: 0, lastDrag: -10, portraitYaw: 0,
      shake: (a) => {
        if (!this.settings.reduceMotion) this.cam.shakeT = Math.max(this.cam.shakeT, a);
      },
    };
    this.initPortraits();
    this.applySettings();
    window.addEventListener('resize', () => this.resize());
    // phones report the new size a moment after rotating
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    screen.orientation?.addEventListener?.('change', () => setTimeout(() => this.resize(), 250));
    this.resize();

    this.events.on('dawn', () => this.mode === 'play' && this.ui.toast('☀️ Good morning! A new day on the islands.', 'info'));
    this.events.on('nightfall', () => this.mode === 'play' && this.ui.toast('🌙 Night falls. Rare fish stir… and Madison opens shop on the west beach.', 'info'));
    this.events.on('newDay', () => {
      if (!this.state) return;
      this.weather.rollDay();
      this.world?.refreshDaily();
      this.quests.refreshBounties();
    });
  }

  // ── boot ─────────────────────────────────────────
  start() {
    this.loadWorld('palmora');
    this.enterTitle();
    this.clock = {
      last: performance.now(),
      getDelta() {
        const now = performance.now();
        const d = (now - this.last) / 1000;
        this.last = now;
        return d;
      },
    };
    const loop = () => {
      requestAnimationFrame(loop);
      this.tick();
    };
    loop();
    document.getElementById('boot')?.remove();
    setInterval(() => this.mode === 'play' && !this.travelling && this.save(), 30000);
    window.addEventListener('beforeunload', () => this.mode === 'play' && this.save());
  }

  enterTitle() {
    this.mode = 'title';
    this.cam.mode = 'orbit';
    this.ui.showHud(false);
    if (this.player) this.player.root.visible = false;
    this.pet?.dispose();
    this.pet = null;
    showTitle(this);
  }
  backToTitle() {
    hideScreens(this);
    this.enterTitle();
  }

  beginCreator(look) {
    this.mode = 'create';
    this.time.titleMinutes = 10 * 60 + 30;
    this.ensurePlayer(look);
    this.player.root.visible = true;
    this.player.teleport(-1.5, 12, 0.5);
    this.cam.mode = 'portrait';
    this.cam.portraitYaw = 0;
  }
  previewLook(look) {
    this.player.setLook(look);
    this.player.char.play('wave', 0.9);
  }
  ensurePlayer(look) {
    if (!this.player) {
      this.player = new Player(this, look);
      this.scene.add(this.player.root);
    } else this.player.setLook(look);
  }

  startNewGame(name, look) {
    this.state = newState(name, look);
    return this.beginPlay(true);
  }
  continueGame() {
    const s = loadGame();
    if (!s) return;
    this.state = migrate(s);
    return this.beginPlay(false);
  }

  async beginPlay(isNew) {
    const s = this.state;
    hideScreens(this);
    await this.ui.fade(true, 350);
    this.ensurePlayer(s.look);
    this.player.root.visible = true;
    this.time.wasNight = null;
    this.weather.rollDay(true);
    this.weather.rain = this.weather.intensity();
    if (this.world?.id !== s.island) this.loadWorld(s.island);
    else this.attachWorldSystems();
    if (s.pos && !isNew) this.player.teleport(s.pos.x, s.pos.z, s.pos.yaw ?? 0);
    else {
      const sp = this.world.spawn;
      this.player.teleport(sp.x, sp.z, Math.PI);
    }
    this.setPet(s.pet);
    this.quests.refreshBounties();
    if (isNew) {
      // washed ashore: play the opening cutscene before handing over control
      this.mode = 'intro';
      this.ui.showHud(false);
      const done = this.intro.start();
      await this.ui.fade(false, 900);
      await done;
    }
    this.cam.mode = 'follow';
    this.cam.yaw = this.player.yaw + Math.PI;
    this.cam.pitch = 0.42;
    this.cam.curDist = 0;
    this.cam.target.copy(this.player.pos);
    this.mode = 'play';
    if (isNew) this.quests.start('m1', true);
    this.quests.refresh();
    this.refreshPortrait();
    this.ui.showHud(true);
    this.ui.refreshHud();
    await this.ui.fade(false, 500);
    if (isNew) {
      this.ui.banner(`Welcome to Palmora, ${s.name}!`, 'Find Mayor Mike in the village square.', '🌴');
      this.ui.toast(this.input.isTouch ? 'Tip: Move with the joystick, talk with the action button. The quest tracker (top-left) shows what to do next.' : 'Tip: Walk with WASD, talk with E. The quest tracker (top-left) shows what to do next.', 'info');
    } else this.ui.banner(`Welcome back, ${s.name}!`, ISLANDS[s.island].name, '🌴');
    this.dailyLogin();
    this.save();
  }

  dailyLogin() {
    const s = this.state;
    const today = new Date().toDateString();
    if (s.lastLogin === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.streak = s.lastLogin === yesterday ? s.streak + 1 : 1;
    s.lastLogin = today;
    const day = ((s.streak - 1) % 7) + 1;
    const reward = { coins: day === 7 ? 120 : 10 + day * 10, gems: day === 7 ? 10 : day >= 4 ? 1 : 0 };
    setTimeout(() => {
      this.ui.banner(`Daily reward · Day ${day} streak`, `+${reward.coins} coins${reward.gems ? ` +${reward.gems} gems` : ''}`, '🎁');
      this.give(reward, { quiet: true });
    }, 2500);
  }

  quitToTitle() {
    this.save();
    this.fishing.cleanup();
    this.boatTrip.reset();
    this.home.cancelPlacing();
    if (this.competition.active) this.competition.end(true);
    this.state = null;
    this.home.detach();
    for (const e of this.world?.enemies || []) e.dispose();
    if (this.world) this.world.enemies = [];
    this.enterTitle();
  }

  save(manual = false) {
    if (!this.state || this.mode !== 'play') return;
    const p = this.player;
    this.state.island = this.world.id;
    const at = this.boatTrip.active ? this.boatTrip.savePos() : p.pos;
    this.state.pos = { x: at.x, z: at.z, yaw: p.yaw };
    const ok = saveGame(this.state);
    if (manual) this.ui.toast(ok ? '💾 Game saved!' : 'Could not save (browser storage blocked).', ok ? 'good' : 'warn');
  }

  // ── world ────────────────────────────────────────
  loadWorld(id) {
    if (this.world) {
      this.boatTrip.reset();
      this.home.detach();
      this.world.dispose();
    }
    const def = ISLANDS[id];
    this.world = new IslandWorld(this, def);
    this.scene.add(this.world.group);
    const ht = this.world.heightTex;
    this.water.setHeightMap(ht.tex, ht.minX, ht.minZ, ht.size, ht.minH, ht.maxH);
    if (this.state) this.attachWorldSystems();
  }
  attachWorldSystems() {
    const w = this.world;
    w.refreshDaily();
    this.home.attach(w);
    this.combat.onWorldLoaded(w);
    w.setBoatModel(this.boatTier());
  }
  worldState(id) {
    if (!this.state) return (this._tmpWorld ||= {}), (this._tmpWorld[id] ||= { day: 0, taken: [], dug: [], extra: [] });
    const w = this.state.world;
    return (w[id] ||= { day: 0, taken: [], dug: [], extra: [] });
  }

  /** Choice at the boat: go fishing in deep water or sail to another island. */
  boatMenu() {
    const opt = (icon, title, sub) => `<span class="emoji" style="font-size:30px" aria-hidden="true">${icon}</span><span class="slot-name">${title}<small class="muted"> ${sub}</small></span>`;
    this.ui.openPicker({
      title: 'Your boat',
      items: ['fish', 'sail'],
      render: (id) => (id === 'fish' ? opt('🎣', 'Fish from the boat', 'Deep-sea fish bite far more often') : opt('⛵', 'Set sail', 'Travel to another island')),
      onPick: (id) => (id === 'fish' ? this.boatTrip.start() : this.openTravel()),
    });
  }

  openTravel(fromNpc = false) {
    if (this.boatTier() === 0) {
      this.ui.toast('You need a boat! Captain Jack sells them at the Palmora dock.', 'warn');
      if (!fromNpc) return;
    }
    this.ui.openPanel('map', { travel: true, tab: 'chart' });
  }
  canReach(id) {
    const isl = ISLANDS[id];
    if (!isl.boat) return this.boatTier() > 0 || this.world?.id === id;
    return this.boatTier() >= BOATS_BY_ID[isl.boat].tier;
  }

  async travelTo(id, { home = false, silent = false, hours = null } = {}) {
    if (this.travelling) return;
    this.travelling = true;
    this.fishing.cleanup();
    this.boatTrip.reset();
    this.home.cancelPlacing();
    const isl = ISLANDS[id];
    this.audio.sfx('travel');
    await this.ui.fade(true, 500);
    let card = null;
    if (!silent) {
      card = el('div', { class: 'sail-card' }, [el('div', { class: 'sail-sea' }, [el('span', { class: 'sail-boat', text: this.boatTier() >= 3 ? '🚢' : this.boatTier() >= 2 ? '⛵' : '🛶' })]), el('b', { text: `Sailing to ${isl.name}…` })]);
      this.ui.root.append(card);
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (this.world.id !== id) this.loadWorld(id);
    else this.attachWorldSystems();
    const w = this.world;
    if (home && w.homestead && this.home.door) {
      this.player.teleport(this.home.door.x, this.home.door.z + 1, 0);
    } else {
      const a = w.arrival;
      this.player.teleport(a.x, a.z, w.dock.rot + Math.PI);
    }
    this.cam.yaw = this.player.yaw + Math.PI;
    this.cam.target.copy(this.player.pos);
    this.time.skip((hours ?? isl.travelHours ?? 1) * 60);
    this.setPet(this.state.pet);
    card?.remove();
    await this.ui.fade(false, 600);
    this.travelling = false;
    if (!silent) {
      this.ui.banner(isl.name, isl.subtitle, { palmora: '🌴', coralia: '🪸', ember: '🌋', skull: '☠️' }[id]);
      this.events.emit('visit', { island: id });
    }
    this.ui.refreshHud();
    this.save();
  }

  async sleep() {
    const s = this.state;
    await this.ui.fade(true, 700);
    const skipped = this.time.sleepUntilMorning();
    this.events.emit('sleep', {});
    s.hp = this.combat.maxHp();
    this.weather.rain = this.weather.intensity();
    await new Promise((r) => setTimeout(r, 600));
    await this.ui.fade(false, 700);
    this.ui.banner(skipped ? 'Rise and shine!' : 'Well rested', skipped ? `Day ${s.time.day} · 7:00 AM` : 'Health restored', '☀️');
    this.ui.refreshHud();
    this.save();
  }

  // ── state helpers ────────────────────────────────
  hasItem(id) {
    return (this.state?.inventory[id] || 0) > 0;
  }
  addItem(id, n = 1, quiet = false) {
    const inv = this.state.inventory;
    inv[id] = (inv[id] || 0) + n;
    if (!quiet) this.ui.itemToast(id, n);
    this.events.emit('inventory', { id, n });
    this.ui.refreshHud();
  }
  removeItem(id, n = 1, quiet = true) {
    const inv = this.state.inventory;
    inv[id] = Math.max(0, (inv[id] || 0) - n);
    if (inv[id] === 0) delete inv[id];
    this.events.emit('inventory', { id, n: -n });
    this.ui.refreshHud();
  }
  spend(coins = 0, gems = 0) {
    this.state.coins -= coins;
    this.state.gems -= gems;
    this.ui.refreshHud();
  }
  /** XP needed to go from level l to l+1: 200 at first, climbing steeply later on. */
  xpForLevel(l) {
    return Math.round((200 + 90 * Math.pow(l - 1, 1.75)) / 10) * 10;
  }
  addXP(n) {
    const s = this.state;
    if (!s || !n) return;
    s.xp += n;
    let leveled = false;
    while (s.xp >= this.xpForLevel(s.level) && s.level < 50) {
      s.xp -= this.xpForLevel(s.level);
      s.level++;
      leveled = true;
    }
    if (leveled) {
      s.hp = this.combat.maxHp();
      this.ui.banner(`Level ${s.level}!`, 'New gear, recipes and islands may be unlocked.', '⭐');
      this.audio.sfx('levelup');
      if (this.player) this.particles.burst(this.player.pos.clone().setY(this.player.pos.y + 1), { count: 40, color: '#f7c95c', speed: 4, up: 5, life: 1.2 });
      this.events.emit('level', { level: s.level });
    }
    this.ui.refreshHud();
  }
  give(r = {}, { quiet = false } = {}) {
    const s = this.state;
    if (!s || !r) return;
    if (r.coins) {
      s.coins += r.coins;
      s.stats.earned += r.coins;
      if (!quiet) this.ui.toast(`+${r.coins} 🪙 coins`, 'gold');
      this.audio.sfx('coin');
    }
    if (r.gems) {
      s.gems += r.gems;
      if (!quiet) this.ui.toast(`+${r.gems} 💎 gems`, 'gem');
      this.audio.sfx('gem');
    }
    if (r.items) for (const [id, n] of Object.entries(r.items)) if (n) this.addItem(id, n, quiet && false);
    if (r.rods)
      for (const id of r.rods) {
        if (!s.rods.includes(id)) s.rods.push(id);
        if (!s.rod || RODS_BY_ID[id].luck > RODS_BY_ID[s.rod].luck) s.rod = id;
        this.ui.toast(`🎣 New rod: ${RODS_BY_ID[id].name}`, 'good');
      }
    if (r.weapons)
      for (const id of r.weapons) {
        if (!s.weapons.includes(id)) s.weapons.push(id);
        if (WEAPONS_BY_ID[id].dmg > WEAPONS_BY_ID[s.weapon].dmg) s.weapon = id;
        this.ui.toast(`⚔️ New weapon: ${WEAPONS_BY_ID[id].name} (press F)`, 'good');
      }
    if (r.cosmetics)
      for (const id of r.cosmetics) {
        if (!s.cosmetics.includes(id)) s.cosmetics.push(id);
        this.ui.toast(`👕 New outfit: ${COSMETICS[id].name} — press C to wear it`, 'good');
      }
    if (r.tent) this.home.pitchTent();
    if (r.buildings) for (const id of r.buildings) this.home.setBuilt(id);
    if (r.animals) for (const [id, n] of Object.entries(r.animals)) for (let i = 0; i < n; i++) this.home.addAnimal(id);
    if (r.flag) s.flags[r.flag] = true;
    if (r.xp) this.addXP(r.xp);
    this.quests.refresh();
    this.ui.refreshHud();
  }

  collectPickup(id, pos) {
    if (id === 'bottle') {
      this.addItem('bottle', 1);
      this.ui.toast('A message in a bottle! Open it from your bag to find treasure.', 'info');
    } else this.addItem(id, 1);
    this.audio.sfx('pickup');
    this.particles.burst(pos.clone().setY(pos.y + 0.4), { count: 10, color: '#fff6c0', speed: 1.5, up: 2.5, life: 0.6 });
    this.events.emit('collect', { item: id });
    this.addXP(1);
  }

  sellMultiplier(shop) {
    return 1 + (shop?.bonus || 0) + (this.state.pet ? PETS_BY_ID[this.state.pet]?.sellBonus || 0 : 0);
  }
  sell(id, n, shop, quiet = false) {
    const it = ITEMS[id];
    const have = this.state.inventory[id] || 0;
    n = Math.min(n, have);
    if (!n || !it) return;
    const coins = Math.floor(it.sell * this.sellMultiplier(shop)) * n;
    this.removeItem(id, n);
    this.state.coins += coins;
    this.state.stats.earned += coins;
    this.state.stats.sold += n;
    if (!quiet) this.audio.sfx('coin');
    this.events.emit('sell', { item: id, count: n, coins, shop: shop?.id });
    this.ui.refreshHud();
  }
  buy(e, shop) {
    const s = this.state;
    const coins = e.price || 0;
    const gems = e.gems || 0;
    if (s.coins < coins || s.gems < gems) {
      this.audio.sfx('error');
      return this.ui.toast('Not enough money!', 'warn');
    }
    if (s.level < (e.level || 1)) return this.ui.toast(`Requires level ${e.level}.`, 'warn');
    if (e.kind === 'animal' && !this.home.isBuilt(ANIMALS[e.id].building)) return this.ui.toast(`Build a ${ANIMALS[e.id].name} home first — ask Bob.`, 'warn');
    if (e.kind === 'animal' && this.home.animalCount(e.id) >= ANIMALS[e.id].max) return this.ui.toast(`Your ${ANIMALS[e.id].name.toLowerCase()} pen is full.`, 'warn');
    if (e.kind === 'irrigation' && (s.farm.irrigation || 0) !== e.irr - 1) return this.ui.toast((s.farm.irrigation || 0) >= e.irr ? 'Already installed.' : `Install the ${IRRIGATION[e.irr - 1].name} first.`, 'warn');
    this.spend(coins, gems);
    this.audio.sfx('buy');
    switch (e.kind) {
      case 'rod':
        s.rods.push(e.id);
        s.rod = e.id;
        this.ui.toast(`🎣 Equipped ${RODS_BY_ID[e.id].name}!`, 'good');
        break;
      case 'weapon':
        s.weapons.push(e.id);
        s.weapon = e.id;
        this.ui.toast(`⚔️ Equipped ${WEAPONS_BY_ID[e.id].name}! Press F to attack.`, 'good');
        break;
      case 'boat':
        s.boat = e.id;
        this.world.setBoatModel(this.boatTier());
        this.ui.banner('New Boat!', `${BOATS_BY_ID[e.id].name} — use any dock to set sail`, BOATS_BY_ID[e.id].icon);
        break;
      case 'cosmetic':
        s.cosmetics.push(e.id);
        this.ui.toast(`👕 ${COSMETICS[e.id].name} added to your wardrobe (C)`, 'good');
        break;
      case 'animal':
        this.home.addAnimal(e.id);
        this.ui.banner('New Farm Animal!', `${ANIMALS[e.id].name} — find it in its pen at your homestead`, ANIMALS[e.id].icon);
        break;
      case 'irrigation':
        this.home.setIrrigation(e.irr);
        this.ui.banner('Farm Upgrade!', `${IRRIGATION[e.irr].name} installed`, IRRIGATION[e.irr].icon);
        break;
      case 'pet':
        s.pets.push(e.id);
        this.equip('pet', e.id);
        this.ui.banner('New Friend!', `${PETS_BY_ID[e.id].name} joins you!`, PETS_BY_ID[e.id].icon);
        break;
      default:
        this.addItem(e.id, e.qty || 1);
    }
    this.events.emit('buy', { id: e.id, kind: e.kind });
    this.quests.refresh();
    this.ui.refreshHud();
  }
  equip(kind, id) {
    const s = this.state;
    if (kind === 'rod') s.rod = id;
    else if (kind === 'weapon') s.weapon = id;
    else if (kind === 'pet') {
      s.pet = id;
      this.setPet(id);
    }
    this.audio.sfx('click');
    this.ui.refreshHud();
    this.events.emit('equip', { id, kind });
  }
  setPet(id) {
    this.pet?.dispose();
    this.pet = null;
    if (id && this.player) {
      this.pet = new Pet(this, id);
      this.scene.add(this.pet.root);
    }
  }
  useItem(id) {
    const it = ITEMS[id];
    if (!this.hasItem(id)) return;
    if (it.heal) {
      if (this.state.hp >= this.combat.maxHp()) return this.ui.toast('You\'re already at full health.', 'info');
      this.removeItem(id, 1);
      this.combat.heal(it.heal);
      this.audio.sfx('eat');
    } else if (it.use === 'bottle') {
      this.removeItem(id, 1);
      const w = this.world;
      for (let t = 0; t < 100; t++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * w.def.radius * 0.9;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const h = w.heightAt(x, z);
        if (h > 0.3 && h < 4 && w.slope(x, z) < 0.15) {
          const ws = this.worldState(w.id);
          ws.extra = ws.extra || [];
          ws.extra.push({ x, z });
          w.addDigSpot(50 + ws.extra.length - 1, new THREE.Vector3(x, h, z));
          break;
        }
      }
      this.ui.banner('Treasure Map!', 'A new ✕ appeared on your map. Grab a shovel!', '🗺️');
    }
  }
  ownsWeaponAtLeast(id) {
    const min = WEAPONS_BY_ID[id].dmg;
    return this.state.weapons.some((w) => WEAPONS_BY_ID[w].dmg >= min);
  }

  setLook(look) {
    this.state.look = look;
    this.player.setLook(look);
    this.player.char.play('wave', 0.8);
    this.audio.sfx('click');
    this.events.emit('wear', {});
  }

  // ── portraits ────────────────────────────────────
  initPortraits() {
    try {
      this.pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.pr.setPixelRatio(1);
      this.pr.setSize(160, 160);
      this.pr.outputColorSpace = THREE.SRGBColorSpace;
      this.pScene = new THREE.Scene();
      this.pScene.add(new THREE.HemisphereLight('#ffffff', '#9a8f80', 1.4));
      const d = new THREE.DirectionalLight('#fff3e0', 1.4);
      d.position.set(2, 3, 4);
      this.pScene.add(d);
      this.pCam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    } catch {
      this.pr = null;
    }
    this.portraits = new Map();
  }
  renderPortrait(char) {
    if (!this.pr) return null;
    const root = char.root;
    const parent = root.parent;
    const pos = root.position.clone();
    const rot = root.rotation.clone();
    const vis = root.visible;
    this.pScene.add(root);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0.3, 0);
    root.visible = true;
    const s = root.scale.y;
    const headY = 1.72 * s;
    this.pCam.position.set(0.35 * s, headY + 0.1 * s, 1.75 * s);
    this.pCam.lookAt(0, headY - 0.1 * s, 0);
    this.pr.render(this.pScene, this.pCam);
    const url = this.pr.domElement.toDataURL('image/png');
    this.pScene.remove(root);
    parent?.add(root);
    root.position.copy(pos);
    root.rotation.copy(rot);
    root.visible = vis;
    return url;
  }
  portraitOf(npc) {
    if (!this.portraits.has(npc.id)) this.portraits.set(npc.id, this.renderPortrait(npc.char));
    return this.portraits.get(npc.id);
  }
  refreshPortrait() {
    if (!this.player) return;
    this.playerPortrait = this.renderPortrait(this.player.char);
    this.ui.refreshHud();
  }

  // ── settings / misc ──────────────────────────────
  applySettings() {
    const s = this.settings;
    saveSettings(s);
    this.ui.applySettings();
    this.audio.applyVolumes();
    const high = s.quality !== 'low';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 2 : 1));
    this.env.sun.castShadow = high;
    this.resize();
    this.ui.hud?.tickClock(true); // 12/24-hour and real-clock changes show right away
  }
  setCameraMode(mode) {
    this.cam.mode = mode;
    if (mode === 'portrait') this.cam.portraitYaw = 0;
  }
  onPanelChange(open) {
    this.modal = open ? 1 : 0;
    if (!open && this.dialogue.isOpen()) this.modal = 1;
    if (!open && (this.ui.panel || this.ui.pickerEl || this.ui.resultsOpen)) this.modal = 1;
  }
  isPaused() {
    return this.modal > 0 || this.travelling;
  }
  canMove() {
    return this.mode === 'play' && !this.isPaused();
  }
  canBeAttacked() {
    return this.mode === 'play' && !this.isPaused();
  }
  /** Fullscreen (hides the browser bars on phones) and keep landscape if possible. */
  async toggleFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        return;
      }
      if (!req) throw new Error('unsupported');
      await req.call(el, { navigationUI: 'hide' });
      try {
        await screen.orientation?.lock?.('landscape');
      } catch {
        /* rotating by hand still works */
      }
    } catch {
      this.ui.toast('Tip: tap Share → "Add to Home Screen" to play full screen.', 'info');
    }
    setTimeout(() => this.resize(), 300);
  }

  flashLightning() {
    this.ui.flashLightning();
    setTimeout(() => this.audio.sfx('thunder'), 600 + Math.random() * 900);
  }
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 50;
    this.camera.updateProjectionMatrix();
  }

  // ── frame ────────────────────────────────────────
  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;
    const paused = this.isPaused();
    const playing = this.mode === 'play';
    if (this.mode === 'title') this.time.update(dt, { title: true });
    else if (playing) this.time.update(dt, { paused });
    this.weather.update(playing ? dt : 0);
    const hour = this.mode === 'play' || this.mode === 'intro' ? this.time.hour() : this.time.titleMinutes / 60;
    const focus = this.player && this.mode !== 'title' ? this.player.pos : this.cam.target;
    const env = this.env.update(hour, this.weather.rain, focus);
    this.sky.update(dt, this.camera, { ...env, wind: 1 }, this.t);
    this.water.update(dt, env, this.t, this.world?.def.palette);
    this.rain.update(dt, this.camera.position, env.rain);
    this.fireflies.update(dt, this.t, focus, env.nightAmount * (1 - env.rain), this.world ? (x, z) => this.world.heightAt(x, z) : null);
    this.particles.update(dt);
    if (this.player) this.fx.update(dt);
    this.world?.update(dt, this.t);
    this.home.updateDecorGlow(env.glow);
    if (playing) this.home.update(dt);
    if (playing) this.farmTools.update(dt);
    else if (this.farmTools.active) this.farmTools.stop();

    if (playing && !paused) this.boatTrip.update(dt);
    if (this.player && (playing || this.mode === 'create')) {
      this.player.update(dt);
    }
    if (this.mode === 'intro') this.intro.update(dt);
    if (playing && !paused) {
      this.fishing.update(dt);
      this.home.updatePlacing();
      this.updateInteract();
      this.combat.update(dt);
      this.competition.update(dt);
      this.state.stats.playSeconds += dt;
      if (this.state.hp <= 0) this.state.hp = 0;
    } else if (playing) {
      this.competition.update(0);
      if (!this.home.placing) this.ui.setPrompt(null);
    }
    this.pet?.update(dt);
    this.audio.update(dt);
    this.updateCamera(dt);
    this.ui.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  updateInteract() {
    const g = this;
    const p = this.player;
    if (this.fishing.active || this.home.placing || this.travelling) return;
    if (this.boatTrip.active) {
      if (this.boatTrip.busy) return g.ui.setPrompt(null);
      if (this.fishing.spotAhead()) {
        g.ui.setPrompt({ key: 'E', text: 'Cast from your boat', icon: '🎣' });
        if (g.input.pressed('KeyE')) this.fishing.start();
      } else g.ui.setPrompt({ key: this.input.isTouch ? '↔' : 'A/D', text: 'Turn toward open water', icon: '🚤' });
      return;
    }
    let best = null;
    let bestScore = Infinity;
    const f = p.forward();
    for (const it of this.world.interactables) {
      if (!it.enabled()) continue;
      const dx = it.pos.x - p.pos.x;
      const dz = it.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > it.r || Math.abs(it.pos.y - p.pos.y) > 3) continue;
      const facing = d > 0.01 ? (dx * f.x + dz * f.z) / d : 1;
      const score = d - it.priority * 0.6 - facing * 0.6;
      if (score < bestScore) {
        bestScore = score;
        best = it;
      }
    }
    if (best) {
      g.ui.setPrompt({ key: 'E', text: best.label(), icon: best.icon });
      if (g.input.pressed('KeyE')) best.action();
      return;
    }
    if (this.fishing.spotAhead()) {
      if (this.state.rod) {
        g.ui.setPrompt({ key: 'E', text: 'Cast your line', icon: '🎣' });
        if (g.input.pressed('KeyE')) this.fishing.start();
      } else g.ui.setPrompt({ key: '—', text: 'You need a fishing rod (see Old Ross)', icon: '🎣' });
      return;
    }
    g.ui.setPrompt(null);
  }

  updateCamera(dt) {
    const c = this.cam;
    const cam = this.camera;
    const input = this.input;
    const sens = this.settings.sensitivity;
    if (c.mode === 'orbit') {
      c.orbit += dt * (this.settings.reduceMotion ? 0.015 : 0.035);
      const R = this.world.def.radius * 1.25;
      cam.position.set(Math.cos(c.orbit) * R, 30 + Math.sin(c.orbit * 0.7) * 6, Math.sin(c.orbit) * R);
      c.target.set(0, 4, 0);
      cam.lookAt(c.target);
      return;
    }
    const p = this.player;
    if (!p || c.mode === 'intro') return;
    if (input.mouse.dragging || input.mouse.dx) c.lastDrag = this.t;
    if (c.mode === 'portrait') {
      c.portraitYaw -= input.mouse.dx * 0.008 * sens;
      const yaw = p.yaw + c.portraitYaw;
      const tgt = p.pos.clone().add(new THREE.Vector3(0, 1.15, 0));
      const panel = this.ui.panel || this.mode === 'create';
      const side = window.innerWidth > 800 && panel ? 1 : 0;
      const pos = tgt.clone().add(new THREE.Vector3(Math.sin(yaw) * 4.2, 0.35, Math.cos(yaw) * 4.2));
      // shift so the character sits beside the side panel
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      pos.addScaledVector(right, -side * 1.3);
      tgt.addScaledVector(right, -side * 1.3);
      cam.position.lerp(pos, 1 - Math.exp(-8 * dt));
      c.target.lerp(tgt, 1 - Math.exp(-8 * dt));
      cam.lookAt(c.target);
      return;
    }
    // follow
    // dragging with a farm tool paints the field instead of turning the camera
    if (!this.farmTools.painting) {
      c.yaw -= input.mouse.dx * 0.006 * sens;
      c.pitch += input.mouse.dy * 0.004 * sens * (this.settings.invertY ? -1 : 1);
    }
    c.pitch = clamp(c.pitch, 0.05, 1.25);
    if (this.fishing.active && c.pitch < 0.5) c.pitch = damp(c.pitch, 0.5, 3, dt);
    c.dist = clamp(c.dist * (1 + input.mouse.wheel * 0.0012), 4.5, 24);
    // gentle auto-follow behind the player while walking
    const speed = Math.hypot(p.vel.x, p.vel.z);
    if (speed > 1 && this.t - c.lastDrag > 2.5 && !this.fishing.active) c.yaw = dampAngle(c.yaw, p.yaw + Math.PI, 0.9, dt);
    // on the boat the camera swings round behind you as you turn
    if (this.boatTrip.active && this.t - c.lastDrag > 1.5) c.yaw = dampAngle(c.yaw, p.yaw + Math.PI, 2.5, dt);
    const tgt = p.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
    c.target.lerp(tgt, 1 - Math.exp(-10 * dt));
    const dirAt = (pitch) => {
      const cp = Math.cos(pitch);
      return new THREE.Vector3(Math.sin(c.yaw) * cp, Math.sin(pitch), Math.cos(c.yaw) * cp);
    };
    // if a building is behind you, first try lifting the camera up over its roof…
    let lift = 0;
    if (this.cameraClearance(c.target, dirAt(c.pitch), c.dist) < c.dist * 0.85) {
      for (const l of [0.25, 0.45, 0.65]) {
        if (c.pitch + l > 1.3) break;
        if (this.cameraClearance(c.target, dirAt(c.pitch + l), c.dist) >= c.dist * 0.85) {
          lift = l;
          break;
        }
      }
    }
    c.lift = damp(c.lift || 0, lift, 7, dt);
    const dir = dirAt(Math.min(1.3, c.pitch + c.lift));
    // …and only move in closer if that isn't enough
    const clear = this.cameraClearance(c.target, dir, c.dist);
    // ease in front of walls quickly but smoothly, and drift back out slowly — never snap
    c.curDist = c.curDist ? damp(c.curDist, clear, clear < c.curDist ? 4 : 2.5, dt) : clear;
    const pos = c.target.clone().addScaledVector(dir, c.curDist);
    const ground = this.world.groundAt(pos.x, pos.z);
    pos.y = Math.max(pos.y, Math.max(ground, 0) + 0.8);
    cam.position.copy(pos);
    if (c.shakeT > 0) {
      c.shakeT = Math.max(0, c.shakeT - dt);
      const a = c.shakeT * 0.6;
      cam.position.x += (Math.random() - 0.5) * a;
      cam.position.y += (Math.random() - 0.5) * a;
    }
    cam.lookAt(c.target);
  }
}
Object.assign(Game.prototype, CookingMethods, FishingProgressMethods);

/**
 * Distance along `dir` from `from` before the camera would end up inside a building.
 * Trees and small props (lamps, crates, rocks) are ignored so the view never jumps in
 * just because you walked past a palm.
 */
Game.prototype.cameraClearance = function (from, dir, maxDist) {
  const w = this.world;
  const near = w.colliders.filter((c) => c.type === 'box' && Math.min(c.hw, c.hd) > 0.35 && Math.hypot(c.x - from.x, c.z - from.z) < maxDist + 10);
  if (!near.length) return maxDist;
  const p = new THREE.Vector3();
  for (let d = 2; d <= maxDist; d += 0.35) {
    p.copy(from).addScaledVector(dir, d);
    const above = p.y - w.heightAt(p.x, p.z);
    if (above > 4.2) continue;
    for (const c of near) {
      const cs = Math.cos(c.rot || 0);
      const sn = Math.sin(c.rot || 0);
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      if (Math.abs(dx * cs - dz * sn) < c.hw + 0.3 && Math.abs(dx * sn + dz * cs) < c.hd + 0.3) return Math.max(3, d - 0.5);
    }
  }
  return maxDist;
};

function migrate(s) {
  s.flags ||= {};
  s.stats ||= {};
  s.world ||= {};
  s.npcs ||= {};
  s.tournament ||= { best: {}, wins: {} };
  return s;
}

export { randInt, damp, FISH, SHOPS, WEAPONS };
