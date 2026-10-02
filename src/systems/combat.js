import * as THREE from 'three';
import { Pirate } from '../entities/actors.js';
import { WEAPONS_BY_ID, PETS_BY_ID } from '../data/gear.js';
import { rand, randInt, wrapAngle } from '../core/utils.js';

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
    this.invuln = 0;
    this.regenT = 0;
    this.inCombatT = 0;
    this.raid = null;
    game.events.on('nightfall', () => this.maybeRaid());
    game.events.on('newDay', () => {
      if (this.game.state) this.game.state.flags.raidDone = false;
    });
  }
  get s() {
    return this.game.state;
  }
  maxHp() {
    const s = this.s;
    return 100 + (s.level - 1) * 6 + (s.pet ? PETS_BY_ID[s.pet]?.hp ?? 0 : 0);
  }
  playerAlive() {
    return this.s && this.s.hp > 0;
  }
  weapon() {
    return WEAPONS_BY_ID[this.s.weapon] || WEAPONS_BY_ID.fists;
  }

  /** Spawn pirates for the current island (Skull Cay) or a raid. */
  onWorldLoaded(world) {
    world.enemies = [];
    if (world.id === 'skull') {
      for (const sp of world.pirateSpots) this.spawn(world, sp.x, sp.z, { level: 8 });
      const s = this.s;
      if (!s.flags.blackfinDay || s.flags.blackfinDay !== s.time.day) this.spawn(world, world.bossSpot.x, world.bossSpot.z, { boss: true });
    }
    if (world.id === 'palmora' && this.raid?.active) this.spawnRaid(world);
  }
  spawn(world, x, z, opts) {
    const e = new Pirate(this.game, x, z, opts);
    world.enemies.push(e);
    world.dynamic.add(e.root);
    return e;
  }

  maybeRaid() {
    const s = this.s;
    const g = this.game;
    if (!s || !s.flags.raids || s.flags.raidDone) return;
    const mainPirate = g.quests.isActive('m8');
    if (!mainPirate && Math.random() > 0.4) return;
    s.flags.raidDone = true;
    this.raid = { active: true, count: mainPirate ? 4 : randInt(3, 5) };
    if (g.world?.id === 'palmora') {
      this.spawnRaid(g.world);
      g.ui.banner('Pirate Raid!', 'Pirates have landed on Palmora\'s east beach!', '🏴‍☠️');
      g.audio.sfx('alarm');
    } else {
      g.ui.toast('🏴‍☠️ Word arrives: pirates are raiding Palmora tonight!', 'warn');
    }
  }
  spawnRaid(world) {
    if (world.enemies.some((e) => e.raid && !e.dead)) return;
    const shore = world.findShore(10, 0, 1, -0.2);
    const lvl = Math.min(2 + Math.floor(this.s.level / 2), 10);
    for (let i = 0; i < this.raid.count; i++) {
      const x = shore.x - 3 - Math.random() * 4;
      const z = shore.z + (i - this.raid.count / 2) * 2.5;
      this.spawn(world, x, z, { level: lvl, raid: true });
    }
  }

  onAggro(enemy) {
    if (enemy.boss && !this.bossAnnounced) {
      this.bossAnnounced = true;
      this.game.ui.banner('Captain Blackfin', '"Ye dare set foot on MY island?!"', '☠️');
      this.game.audio.sfx('alarm');
    }
  }

  tryAttack() {
    const g = this.game;
    if (this.cooldown > 0 || !g.player || g.player.locked) return;
    const w = this.weapon();
    const p = g.player;
    this.cooldown = 0.42;
    if (p.char.heldKind !== 'weapon' || p.char.heldId !== this.s.weapon) p.char.hold('weapon', this.s.weapon);
    p.char.play('swing', 0.38);
    g.audio.sfx('swing');
    this.weaponShow = 3;
    this.pendingHit = 0.14;
  }

  resolveHit() {
    const g = this.game;
    const p = g.player;
    const w = this.weapon();
    let hit = false;
    for (const e of g.world?.enemies || []) {
      if (e.dead) continue;
      const dx = e.pos.x - p.pos.x;
      const dz = e.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - p.yaw));
      if (d < w.range + e.radius && ang < 1.25) {
        const crit = Math.random() < 0.12;
        const dmg = Math.round(w.dmg * rand(0.85, 1.15) * (crit ? 1.8 : 1) * (1 + this.s.level * 0.02));
        e.takeHit(dmg, p.pos);
        g.ui.floatText(e.pos.clone().setY(e.pos.y + 2.2), crit ? `${dmg}!` : `${dmg}`, crit ? 'crit' : 'dmg');
        g.particles.burst(e.pos.clone().setY(e.pos.y + 1.2), { count: 8, color: crit ? '#ffd36b' : '#ffffff', speed: 3, up: 2, life: 0.4 });
        hit = true;
      }
    }
    if (hit) {
      g.audio.sfx('hit');
      g.cam.shake(0.12);
      this.inCombatT = 6;
    }
  }

  damagePlayer(dmg, from) {
    const g = this.game;
    if (this.invuln > 0 || !this.playerAlive() || !g.canBeAttacked()) return;
    if (!g.player.grounded && Math.random() < 0.5) {
      g.ui.floatText(g.player.pos.clone().setY(g.player.pos.y + 2.2), 'Dodged!', 'heal');
      return;
    }
    this.s.hp = Math.max(0, this.s.hp - dmg);
    this.invuln = 0.7;
    this.inCombatT = 6;
    g.player.char.hit();
    if (g.fishing.active) g.fishing.cancel('You were attacked!');
    const dir = new THREE.Vector3(g.player.pos.x - from.x, 0, g.player.pos.z - from.z).normalize();
    g.player.vel.x += dir.x * 9;
    g.player.vel.z += dir.z * 9;
    g.player.vel.y = 3;
    g.player.grounded = false;
    g.ui.floatText(g.player.pos.clone().setY(g.player.pos.y + 2.2), `-${dmg}`, 'hurt');
    g.ui.flashDamage();
    g.audio.sfx('hurt');
    g.cam.shake(0.25);
    g.ui.refreshHud();
    if (this.s.hp <= 0) this.knockedOut();
  }

  knockedOut() {
    const g = this.game;
    g.ui.banner('Knocked Out!', 'You wake up back home, a little lighter in the pocket…', '💫');
    const lost = Math.min(Math.floor(this.s.coins * 0.1), 500);
    this.s.coins -= lost;
    g.audio.sfx('ko');
    setTimeout(() => {
      this.s.hp = this.maxHp();
      g.travelTo('palmora', { home: true, silent: true, hours: 2 });
      if (lost) g.ui.toast(`Lost ${lost} coins.`, 'warn');
    }, 1600);
  }

  healFull(msg) {
    const g = this.game;
    this.s.hp = this.maxHp();
    g.ui.toast(msg || 'Fully healed!', 'good');
    g.audio.sfx('heal');
    g.particles.burst(g.player.pos.clone().setY(g.player.pos.y + 1), { count: 20, color: '#9bf0c8', speed: 2, up: 3 });
    g.ui.refreshHud();
  }
  heal(n) {
    this.s.hp = Math.min(this.maxHp(), this.s.hp + n);
    this.game.ui.floatText(this.game.player.pos.clone().setY(this.game.player.pos.y + 2.2), `+${n}`, 'heal');
    this.game.ui.refreshHud();
  }

  onEnemyDefeated(e) {
    const g = this.game;
    const s = this.s;
    s.stats.pirates++;
    g.audio.sfx('defeat');
    g.particles.burst(e.pos.clone().setY(e.pos.y + 1), { count: 30, color: '#f2c230', speed: 4, up: 4 });
    if (e.boss) {
      s.flags.blackfinDay = s.time.day;
      const first = !s.flags.blackfinBeaten;
      s.flags.blackfinBeaten = true;
      g.give({ coins: first ? 1000 : 400, gems: first ? 30 : 8, xp: 400, items: { doubloon: 5, ruby: first ? 1 : 0 } });
      g.ui.banner(first ? 'Blackfin Defeated!' : 'Blackfin Beaten Again!', first ? 'The seas are safe at last!' : 'He\'ll be back tomorrow…', '🏆');
      this.bossAnnounced = false;
    } else {
      const loot = { coins: randInt(20, 45) + s.level * 3, xp: 25 };
      if (Math.random() < 0.55) loot.items = { doubloon: 1 };
      if (Math.random() < 0.1) loot.gems = 1;
      g.give(loot, { quiet: true });
      g.ui.floatText(e.pos.clone().setY(e.pos.y + 2.6), `+${loot.coins}🪙`, 'coin');
    }
    g.events.emit('defeat', { kind: e.kind });
    if (e.raid && g.world.enemies.filter((x) => x.raid && !x.dead).length === 0) {
      this.raid = null;
      g.ui.banner('Raid Repelled!', 'Palmora is safe. The Mayor sends a reward!', '🎉');
      g.give({ coins: 150 + s.level * 20, gems: 3, xp: 80 });
    }
  }

  update(dt) {
    const g = this.game;
    if (!this.s) return;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.inCombatT = Math.max(0, this.inCombatT - dt);
    if (this.pendingHit > 0) {
      this.pendingHit -= dt;
      if (this.pendingHit <= 0) this.resolveHit();
    }
    if (this.weaponShow > 0) {
      this.weaponShow -= dt;
      if (this.weaponShow <= 0 && !g.fishing.active && g.player?.char.heldKind === 'weapon') g.player.char.hold(null);
    }
    if (g.mode === 'play' && (g.input.pressed('KeyF') || (g.input.mouse.clicked && this.nearEnemy()))) this.tryAttack();
    // passive regen out of combat
    if (this.inCombatT <= 0 && this.s.hp < this.maxHp()) {
      this.regenT += dt;
      const rate = this.s.pet === 'turtle' ? 1.2 : 2.5;
      if (this.regenT > rate) {
        this.regenT = 0;
        this.s.hp = Math.min(this.maxHp(), this.s.hp + 1);
        g.ui.refreshHud();
      }
    }
    const w = g.world;
    if (!w) return;
    for (let i = w.enemies.length - 1; i >= 0; i--) {
      const alive = w.enemies[i].update(dt);
      if (!alive) {
        w.enemies[i].dispose();
        w.enemies.splice(i, 1);
      }
    }
  }
  nearEnemy() {
    const p = this.game.player;
    return (this.game.world?.enemies || []).some((e) => !e.dead && e.pos.distanceTo(p.pos) < 8);
  }
}
