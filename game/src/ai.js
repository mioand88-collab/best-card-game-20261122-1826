// Ember Clash — the Rival Warden's brain.
// Readable, counterable play: the Warden spends its embers on the best-value
// affordable card, prefers finishing blows, saves a big card when it is one
// turn away from affording it, and sometimes holds back a cheap card to
// bluff a shielded turn.

import { cardDef } from './deck.js';
import { cardValue } from './cards.js';

// Pick the next card the AI should play, or null to pass.
// `ai` is the AI duelist state { hand, mana, life, shield };
// `foe` is the player duelist state (used to spot lethal).
export function chooseNextCard(ai, foe, random = Math.random) {
  const affordable = ai.hand
    .map((id) => cardDef(id))
    .filter((d) => d && d.cost <= ai.mana);
  if (affordable.length === 0) return null;

  // Lethal first: any card whose attack alone ends the duel.
  const lethal = affordable.find((d) => damageAfterShield(d, foe) >= foe.life);
  if (lethal) return lethal;

  // Hold back: if the AI is one ember short of its biggest card and the
  // board is not urgent, save the mana for next turn.
  const biggest = Math.max(...ai.hand.map((id) => cardDef(id).cost));
  const almostAffordable = biggest > ai.mana && biggest - ai.mana === 1;
  const urgent = foe.life <= 8 || ai.life <= 8;
  if (almostAffordable && !urgent && random() < 0.6) return null;

  // Otherwise play the best value per ember, with a small random tie-break
  // so the Warden does not feel mechanical.
  let best = null;
  let bestScore = -Infinity;
  for (const d of affordable) {
    const score = cardValue(d) / d.cost + random() * 0.35;
    if (score > bestScore) { bestScore = score; best = d; }
  }

  // Occasionally (1 in 6) hold a cheap card in hand to keep the player guessing.
  if (best && best.cost <= 2 && affordable.length > 1 && random() < 0.16) {
    const others = affordable.filter((d) => d !== best);
    return others[Math.floor(random() * others.length)];
  }
  return best;
}

// Damage a card would deal after the target's shield absorbs what it can.
export function damageAfterShield(def, target) {
  const hits = def.effect === 'double' ? 2 : 1;
  let remaining = def.attack * hits;
  const absorbed = Math.min(target.shield, remaining);
  return remaining - absorbed;
}

// Plan a whole AI turn as a list of card ids, in play order, without
// mutating state — main.js replays them one at a time with pauses.
export function planTurn(ai, foe, random = Math.random) {
  const sim = {
    hand: [...ai.hand],
    mana: ai.mana,
    life: ai.life,
    shield: ai.shield,
  };
  const foeSim = { life: foe.life, shield: foe.shield };
  const plan = [];
  for (;;) {
    const pick = chooseNextCard(sim, foeSim, random);
    if (!pick) break;
    plan.push(pick.id);
    const idx = sim.hand.indexOf(pick.id);
    if (idx >= 0) sim.hand.splice(idx, 1);
    sim.mana -= pick.cost;
    // Simulate the attack so later picks can spot lethal.
    const hits = pick.effect === 'double' ? 2 : 1;
    for (let h = 0; h < hits; h++) {
      const absorbed = Math.min(foeSim.shield, pick.attack);
      foeSim.shield -= absorbed;
      foeSim.life -= (pick.attack - absorbed);
    }
    if (foeSim.life <= 0) break;
  }
  return plan;
}
