// Ember Clash — deck building, shuffling and drawing.
// Each duelist gets a 24-card deck: two copies of twelve catalogue cards,
// shuffled with a Fisher–Yates pass.

import { CARD_DEFS } from './cards.js';

const COPIES_PER_CARD = 2;
const DECK_CARD_IDS = [
  'cinder-imp', 'spark-sprite', 'flame-lash', 'twin-embers',
  'ember-scholar', 'tide-wisp', 'coral-guard', 'deep-current',
  'gale-runner', 'thornvine', 'zephyr-blade', 'stormhawk',
  'pebble-golem', 'granite-fist', 'mountain-heart', 'quake-slam',
  'phoenix-dive', 'wavebreaker', 'mist-dancer', 'bramble-trap',
];

// Build a fresh shuffled deck: an array of card-definition ids.
export function buildDeck(random = Math.random) {
  const defs = new Map(CARD_DEFS.map((d) => [d.id, d]));
  const deck = [];
  for (const id of DECK_CARD_IDS) {
    if (!defs.has(id)) continue;
    for (let i = 0; i < COPIES_PER_CARD; i++) deck.push(id);
  }
  shuffleDeck(deck, random);
  return deck;
}

// In-place Fisher–Yates shuffle.
export function shuffleDeck(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw up to `count` cards from the deck into a hand (respecting the cap).
export function drawCards(deck, hand, count, maxHand) {
  const drawn = [];
  while (count > 0 && deck.length > 0 && hand.length < maxHand) {
    const id = deck.shift();
    hand.push(id);
    drawn.push(id);
    count--;
  }
  return drawn;
}

// Look up a card definition by id.
export function cardDef(id) {
  return CARD_DEFS.find((d) => d.id === id);
}
