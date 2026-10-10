import * as THREE from 'three';
import { NPCS } from '../people/npcs.js';
import { ITEMS } from '../shared/items.js';
import { ANIMALS } from '../farm/animals.js';
import { ISLANDS } from '../world/islands.js';
import { BEACH_ITEMS } from './quests.js';

/**
 * Works out where the player should go for a quest objective, so the HUD can
 * show a waypoint arrow. Returns { pos, label } or null.
 */
export function objectiveTarget(game, obj, quest = null) {
  const w = game.world;
  const p = game.player;
  if (!w || !p || !obj) return null;
  const s = game.state;

  const npcTarget = (id) => {
    const def = NPCS[id];
    if (!def) return null;
    if (def.island !== w.id) return sailTo(def.island, `${def.name} is on ${ISLANDS[def.island].name}`);
    const n = w.npcs.find((x) => x.id === id);
    if (!n) return null;
    if (!n.available()) return { pos: n.home.clone(), label: `${def.name} (${def.schedule === 'night' ? 'appears at night' : 'back in the morning'})` };
    return { pos: n.pos, label: def.name, follow: n.root };
  };
  const sailTo = (island, label) => {
    if (!w.dock) return null;
    if (game.boatTier() === 0 && island !== w.id) {
      if (w.id !== 'palmora') return null;
      const jack = npcTarget('reyes');
      return jack ? { ...jack, label: `${label} — buy a boat from Captain Jack` } : null;
    }
    return { pos: w.dock.end.clone(), label: `${label} — board your boat` };
  };
  const nearest = (list) => {
    let best = null;
    let bd = Infinity;
    for (const it of list) {
      const d = it.pos.distanceTo(p.pos);
      if (d < bd) {
        bd = d;
        best = it;
      }
    }
    return best;
  };
  const home = (label) => {
    if (w.id !== 'palmora') return sailTo('palmora', 'Your home is on Palmora');
    return game.home.center ? { pos: game.home.center.clone(), label } : null;
  };
  const fishingSpot = () => (w.dock ? { pos: w.dock.end.clone(), label: 'Fishing spot (end of the dock)' } : null);

  switch (obj.type) {
    case 'talk':
      return npcTarget(obj.target);
    case 'sell': {
      const t = obj.target;
      if (t === 'type:fish') return npcTarget(w.id === 'palmora' ? 'marina' : w.id === 'coralia' ? 'shelly' : w.id === 'ember' ? 'sage' : 'patch');
      if (t === 'type:material') return npcTarget('bo');
      return npcTarget('coco');
    }
    case 'collect': {
      if (obj.target === 'fruit') {
        const ready = (w.fruitTrees || []).filter((t) => game.home.treeReady(w.id, t.idx));
        const t = nearest(ready);
        return t ? { pos: t.pos, label: `${ITEMS[t.fruit].name} tree — press E to shake` } : null;
      }
      // animal goods: point at that animal's pen
      const animal = Object.values(ANIMALS).find((a) => a.product === obj.target);
      if (animal) {
        if (w.id !== 'palmora') return home('');
        if (!game.home.isBuilt(animal.building)) return npcTarget('bo');
        return { pos: game.home.penCenter(animal.building), label: `${animal.name} pen — press E on a ${animal.name.toLowerCase()} with ${ITEMS[animal.product].name.toLowerCase()}` };
      }
      if (obj.target === 'treasure') {
        const x = nearest((w.digSpots || []).map((d) => ({ pos: d.pos })));
        return x ? { pos: x.pos, label: 'X mark — press E to dig' } : null;
      }
      const ids = obj.target === 'beach' ? BEACH_ITEMS : [obj.target];
      const pk = nearest(w.pickups.filter((x) => ids.includes(x.id)));
      return pk ? { pos: pk.pos, label: `${ITEMS[pk.id].name} — walk over it` } : null;
    }
    case 'have': {
      const have = s.inventory[obj.target] || 0;
      if (have >= obj.count) return obj.consume && (quest?.turnIn || quest?.giver) ? npcTarget(quest.turnIn || quest.giver) : null;
      const pk = nearest(w.pickups.filter((x) => x.id === obj.target));
      if (pk) return { pos: pk.pos, label: `${ITEMS[pk.id].name} — walk over it` };
      if (ITEMS[obj.target]?.type === 'fruit') {
        const t = nearest((w.fruitTrees || []).filter((x) => x.fruit === obj.target));
        if (t) return { pos: t.pos, label: `${ITEMS[t.fruit].name} tree` };
      }
      return null;
    }
    case 'catch':
      if (obj.target === 'boat' || obj.target === 'rod:deepsea') return w.boardPos ? { pos: w.boardPos.clone(), label: 'Your boat — press E → Fish from the boat' } : fishingSpot();
      return fishingSpot();
    case 'plant':
    case 'harvest':
      return home('Your farm plots');
    case 'cook':
      if (w.id !== 'palmora') return home('');
      return game.home.kitchenPos ? { pos: game.home.kitchenPos.clone(), label: 'Your kitchen — press E to cook' } : home('Your home');
    case 'build':
    case 'construct':
      if (w.id === 'palmora') return npcTarget('bo');
      return sailTo('palmora', 'Bob is on Palmora');
    case 'own': {
      const [kind] = obj.target.split(':');
      if (kind === 'boat') return w.id === 'palmora' ? npcTarget('reyes') : sailTo('palmora', 'Captain Jack is on Palmora');
      if (kind === 'weapon') return npcTarget('ash');
      if (kind === 'cosmetics' || kind === 'pet') return npcTarget('luna');
      if (kind === 'irrigation') return npcTarget('coco');
      if (kind === 'rod') return w.id === 'palmora' ? npcTarget(obj.target === 'rod:deepsea' ? 'reyes' : 'finn') : sailTo('palmora', 'Rods are sold on Palmora');
      if (kind === 'dex') return fishingSpot();
      return null;
    }
    case 'water':
    case 'fertilize':
      return home('Your farm plots');
    case 'makefeed':
      if (w.id !== 'palmora') return home('');
      return game.home.isBuilt?.('feeder') ? { pos: game.home.feederPos(), label: 'Your Feeder — press E' } : npcTarget('bo');
    case 'home':
      if (w.id !== 'palmora') return home('');
      return game.home.door ? { pos: game.home.door.clone(), label: 'Your tent — press E' } : home('Your homestead');
    case 'sleep':
      if (w.id !== 'palmora') return home('');
      return game.home.door ? { pos: game.home.door.clone(), label: 'Your home — press E, then Sleep' } : home('Your home');
    case 'bounty': {
      if (w.id !== 'palmora') return sailTo('palmora', 'The bounty board is on Palmora');
      const b = w.interactables.find((i) => i.icon === '📋');
      return b ? { pos: b.pos, label: 'Bounty Board — press E' } : null;
    }
    case 'visit':
      if (w.id === obj.target) return null;
      return sailTo(obj.target, `Sail to ${ISLANDS[obj.target].name}`);
    case 'compete':
      return npcTarget('mo');
    case 'defeat': {
      const foes = w.enemies.filter((e) => !e.dead && (obj.target !== 'blackfin' || e.boss));
      const f = nearest(foes);
      if (f) return { pos: f.pos, label: f.boss ? 'Captain Blackfin' : 'Pirate', follow: f.root };
      if (obj.target === 'blackfin') return w.id === 'skull' ? null : sailTo('skull', 'Blackfin is on Skull Cay');
      if (w.id === 'palmora') {
        const shore = w.findShore(10, 0, 1, -0.2);
        return { pos: new THREE.Vector3(shore.x - 4, 0, shore.z), label: game.time.isNight() ? 'East beach — raid spot' : 'East beach (pirates raid after 7 PM)' };
      }
      return null;
    }
    default:
      return null;
  }
}
