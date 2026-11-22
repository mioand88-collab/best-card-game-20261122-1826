// Ember Clash — the card catalogue. Every card is an original design:
// four elements (Ember / Tide / Gale / Stone), each told apart by colour
// AND shape, a mana cost, an attack value, and at most one simple effect.

export const ELEMENTS = {
  ember: { label: 'Ember', color: '#ff5a1f', shape: 'triangle', art: '🔥' },
  tide:  { label: 'Tide',  color: '#2fa8ff', shape: 'droplet',  art: '💧' },
  gale:  { label: 'Gale',  color: '#37d67a', shape: 'diamond',  art: '🍃' },
  stone: { label: 'Stone', color: '#ffb02e', shape: 'hexagon',  art: '🪨' },
};

// effect kinds:
//   none    — plain attack
//   draw n  — draw n cards after playing
//   shield n — gain n shield (absorbs damage before life)
//   heal n  — restore n life
//   double  — strike twice (attack applied two times)
//   steal n — deal damage and heal yourself for n
export const CARD_DEFS = [
  { id: 'cinder-imp',    name: 'Cinder Imp',     element: 'ember', cost: 1, attack: 2, effect: 'none',     art: '😈' },
  { id: 'spark-sprite',  name: 'Spark Sprite',   element: 'ember', cost: 2, attack: 3, effect: 'none',     art: '✨' },
  { id: 'flame-lash',    name: 'Flame Lash',     element: 'ember', cost: 3, attack: 5, effect: 'none',     art: '🌋' },
  { id: 'twin-embers',   name: 'Twin Embers',    element: 'ember', cost: 4, attack: 3, effect: 'double',   art: '🔥' },
  { id: 'phoenix-dive',  name: 'Phoenix Dive',   element: 'ember', cost: 6, attack: 8, effect: 'none',     art: '🦅' },
  { id: 'ember-scholar', name: 'Ember Scholar',  element: 'ember', cost: 2, attack: 1, effect: 'draw 2',   art: '📖' },
  { id: 'tide-wisp',     name: 'Tide Wisp',      element: 'tide',  cost: 1, attack: 1, effect: 'draw 1',   art: '🫧' },
  { id: 'coral-guard',   name: 'Coral Guard',    element: 'tide',  cost: 2, attack: 2, effect: 'shield 3', art: '🪸' },
  { id: 'deep-current',  name: 'Deep Current',   element: 'tide',  cost: 3, attack: 4, effect: 'draw 1',   art: '🌊' },
  { id: 'wavebreaker',   name: 'Wavebreaker',    element: 'tide',  cost: 5, attack: 6, effect: 'shield 4', art: '🌊' },
  { id: 'mist-dancer',   name: 'Mist Dancer',    element: 'tide',  cost: 4, attack: 3, effect: 'heal 4',   art: '🌫️' },
  { id: 'gale-runner',   name: 'Gale Runner',    element: 'gale',  cost: 1, attack: 2, effect: 'none',     art: '💨' },
  { id: 'thornvine',     name: 'Thornvine',      element: 'gale',  cost: 2, attack: 3, effect: 'steal 2',  art: '🌿' },
  { id: 'zephyr-blade',  name: 'Zephyr Blade',   element: 'gale',  cost: 3, attack: 4, effect: 'double',   art: '🗡️' },
  { id: 'stormhawk',     name: 'Stormhawk',      element: 'gale',  cost: 4, attack: 5, effect: 'draw 1',   art: '🦅' },
  { id: 'bramble-trap',  name: 'Bramble Trap',   element: 'gale',  cost: 2, attack: 2, effect: 'steal 3',  art: '🕸️' },
  { id: 'pebble-golem',  name: 'Pebble Golem',   element: 'stone', cost: 2, attack: 1, effect: 'shield 5', art: '🗿' },
  { id: 'granite-fist',  name: 'Granite Fist',   element: 'stone', cost: 3, attack: 4, effect: 'none',     art: '🥊' },
  { id: 'mountain-heart',name: "Mountain's Heart", element: 'stone', cost: 4, attack: 2, effect: 'heal 6', art: '⛰️' },
  { id: 'quake-slam',    name: 'Quake Slam',     element: 'stone', cost: 6, attack: 7, effect: 'shield 3', art: '💥' },
];

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 7;
export const START_HAND = 4;

// Human-readable effect text for the card face.
export function effectText(effect) {
  if (effect === 'none') return '';
  if (effect === 'double') return 'Strikes twice';
  if (effect.startsWith('draw')) return `Draw ${effect.split(' ')[1]} card${effect.endsWith('1') ? '' : 's'}`;
  if (effect.startsWith('shield')) return `Gain ${effect.split(' ')[1]} shield`;
  if (effect.startsWith('heal')) return `Restore ${effect.split(' ')[1]} life`;
  if (effect.startsWith('steal')) return `Heal yourself ${effect.split(' ')[1]}`;
  return effect;
}

// Rough value of a card, used by the AI to rank plays.
export function cardValue(def) {
  let v = def.attack;
  if (def.effect === 'double') v += def.attack;
  if (def.effect.startsWith('draw')) v += 1.5 * Number(def.effect.split(' ')[1]);
  if (def.effect.startsWith('shield')) v += Number(def.effect.split(' ')[1]) * 0.8;
  if (def.effect.startsWith('heal')) v += Number(def.effect.split(' ')[1]) * 0.7;
  if (def.effect.startsWith('steal')) v += Number(def.effect.split(' ')[1]) * 0.9;
  return v;
}
