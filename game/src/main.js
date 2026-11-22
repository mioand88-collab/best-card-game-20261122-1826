// Ember Clash — the duel itself: state, turn flow, card resolution and
// the Rival Warden's turn. Debug hooks (harmless, for testing only):
//   ?shot=title|table|win|loss  — jump straight to a screen
//   ?autowin / ?autolose        — start with the rival / your hearth at 1

import { MAX_LIFE, MAX_MANA, MAX_HAND, START_HAND } from './cards.js';
import { buildDeck, drawCards, cardDef } from './deck.js';
import { planTurn } from './ai.js';
import { renderTable, renderVitals, renderLog, showOnStage, showEndScreen, shakeDuelist } from './render.js';
import { bindButtons, bindKeyboard } from './input.js';
import * as sound from './sound.js';

const $ = (id) => document.getElementById(id);

let state = null;
let aiTimer = null;

function newDuelist() {
  return { life: MAX_LIFE, shield: 0, mana: 1, deck: [], hand: [] };
}

function freshState() {
  return {
    screen: 'title', // title | table | end
    phase: 'dealing', // dealing | player | ai | over
    turn: 1,
    you: newDuelist(),
    foe: newDuelist(),
    log: [],
    winner: null,
  };
}

function log(text, who) {
  state.log.unshift({ text, who: who || '' });
  if (state.log.length > 12) state.log.length = 12;
  renderLog(state);
}

function setScreen(name) {
  state.screen = name;
  $('title-screen').classList.toggle('hidden', name !== 'title');
  $('table-screen').classList.toggle('hidden', name !== 'table');
  $('end-screen').classList.toggle('hidden', name !== 'end');
}

// Deal opening hands and start turn 1.
function startGame() {
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
  state = freshState();
  state.you.deck = buildDeck();
  state.foe.deck = buildDeck();
  drawCards(state.you.deck, state.you.hand, START_HAND, MAX_HAND);
  drawCards(state.foe.deck, state.foe.hand, START_HAND, MAX_HAND);
  const params = new URLSearchParams(location.search);
  if (params.has('autowin')) state.foe.life = 1;
  if (params.has('autolose')) state.you.life = 1;
  setScreen('table');
  state.phase = 'player';
  log('The duel begins — your turn. Spend embers, play a card.', 'you');
  renderTable(state, onPlayCard);
  sound.playTurn();
}

// Resolve one played card: pay, attack, apply its effect, check for a win.
function playCardById(cardId) {
  if (!state || state.screen !== 'table' || state.phase !== 'player') return false;
  const idx = state.you.hand.indexOf(cardId);
  if (idx < 0) return false;
  const def = cardDef(cardId);
  if (!def || def.cost > state.you.mana) return false;
  state.you.hand.splice(idx, 1);
  state.you.mana -= def.cost;
  resolveCard(def, state.you, state.foe, 'you');
  renderTable(state, onPlayCard);
  if (state.phase === 'over') return true;
  return true;
}

function onPlayCard(def, el) {
  if (!state || state.phase !== 'player') return;
  if (def.cost > state.you.mana) { sound.playClick(); return; }
  if (el) el.classList.add('played');
  showOnStage(def);
  sound.playCard();
  window.setTimeout(() => playCardById(def.id), 120);
}

// Apply a card's attack and effect from `caster` onto `target`.
function resolveCard(def, caster, target, who) {
  const hits = def.effect === 'double' ? 2 : 1;
  let dealt = 0;
  for (let h = 0; h < hits; h++) {
    const absorbed = Math.min(target.shield, def.attack);
    target.shield -= absorbed;
    const dmg = def.attack - absorbed;
    target.life -= dmg;
    dealt += dmg;
  }
  const casterName = who === 'you' ? 'You' : 'Warden';
  const targetName = who === 'you' ? 'the Warden' : 'you';
  log(`${casterName} played ${def.name} — ${dealt} damage to ${targetName}${hits > 1 ? ' (double strike)' : ''}.`, who);
  shakeDuelist(who === 'you' ? 'foe' : 'you');
  sound.playDamage();

  if (def.effect.startsWith('draw')) {
    const n = Number(def.effect.split(' ')[1]);
    const drawn = drawCards(caster.deck, caster.hand, n, MAX_HAND);
    if (drawn.length) {
      log(`${casterName} drew ${drawn.length} card${drawn.length > 1 ? 's' : ''}.`, who);
      sound.playDraw();
    }
  } else if (def.effect.startsWith('shield')) {
    const n = Number(def.effect.split(' ')[1]);
    caster.shield += n;
    log(`${casterName} raised ${n} shield.`, who);
    sound.playShield();
  } else if (def.effect.startsWith('heal')) {
    const n = Number(def.effect.split(' ')[1]);
    caster.life = Math.min(MAX_LIFE, caster.life + n);
    log(`${casterName} restored ${n} life.`, who);
    sound.playHeal();
  } else if (def.effect.startsWith('steal')) {
    const n = Number(def.effect.split(' ')[1]);
    caster.life = Math.min(MAX_LIFE, caster.life + n);
    log(`${casterName} siphoned ${n} life.`, who);
    sound.playHeal();
  }

  renderVitals(state);
  checkEnd();
}

// End the player's turn: hand over to the Warden.
function endTurn() {
  if (!state || state.screen !== 'table' || state.phase !== 'player') return;
  state.phase = 'ai';
  renderVitals(state);
  log('You end your turn. The Warden stirs…', 'you');
  aiTimer = window.setTimeout(runAiTurn, 700);
}

// The Warden's turn: draw, gain an ember, play its planned cards one by one.
function runAiTurn() {
  if (!state || state.phase !== 'ai') return;
  state.foe.mana = Math.min(MAX_MANA, state.foe.mana + 1);
  drawCards(state.foe.deck, state.foe.hand, 1, MAX_HAND);
  renderTable(state, onPlayCard);
  const plan = planTurn(state.foe, state.you);
  let step = 0;
  const playNext = () => {
    if (!state || state.phase !== 'ai') return;
    if (step >= plan.length) { beginPlayerTurn(); return; }
    const def = cardDef(plan[step]);
    step++;
    if (!def) { playNext(); return; }
    const idx = state.foe.hand.indexOf(def.id);
    if (idx < 0 || def.cost > state.foe.mana) { playNext(); return; }
    state.foe.hand.splice(idx, 1);
    state.foe.mana -= def.cost;
    showOnStage(def);
    sound.playCard();
    resolveCard(def, state.foe, state.you, 'foe');
    renderTable(state, onPlayCard);
    if (state.phase === 'over') return;
    aiTimer = window.setTimeout(playNext, 950);
  };
  aiTimer = window.setTimeout(playNext, 650);
}

// Start the player's next turn: new ember, draw, turn counter up.
function beginPlayerTurn() {
  if (!state || state.phase === 'over') return;
  state.turn += 1;
  state.you.mana = Math.min(MAX_MANA, state.you.mana + 1);
  drawCards(state.you.deck, state.you.hand, 1, MAX_HAND);
  state.phase = 'player';
  log(`Turn ${state.turn} — your move.`, 'you');
  sound.playTurn();
  renderTable(state, onPlayCard);
}

function checkEnd() {
  if (state.you.life <= 0 && state.foe.life <= 0) {
    // A mutual fall favours the player who struck last — the caster wins.
    endDuel(state.foe.life <= 0);
    return;
  }
  if (state.foe.life <= 0) endDuel(true);
  else if (state.you.life <= 0) endDuel(false);
}

function endDuel(won) {
  state.phase = 'over';
  state.winner = won ? 'you' : 'foe';
  log(won ? 'The Warden’s hearth is cold — victory!' : 'Your hearth has gone dark.', won ? 'you' : 'foe');
  renderTable(state, onPlayCard);
  window.setTimeout(() => {
    setScreen('end');
    showEndScreen(state, won);
    if (won) sound.playWin(); else sound.playLose();
  }, 700);
}

// Screenshot / test hooks: jump straight to a screen with a plausible table.
function applyShotParam() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  startGame();
  if (shot === 'title') { setScreen('title'); return; }
  if (shot === 'table') {
    // Seed a mid-game table: some embers spent, shields up, hands full.
    state.you.mana = 5; state.foe.mana = 4;
    state.you.shield = 3; state.foe.shield = 2;
    state.you.life = 24; state.foe.life = 21;
    state.turn = 5;
    drawCards(state.you.deck, state.you.hand, 3, MAX_HAND);
    drawCards(state.foe.deck, state.foe.hand, 3, MAX_HAND);
    log('Turn 5 — the table is hot. Your move.', 'you');
    renderTable(state, onPlayCard);
    return;
  }
  if (shot === 'win' || shot === 'loss') {
    const won = shot === 'win';
    state.foe.life = won ? 0 : 14;
    state.you.life = won ? 17 : 0;
    state.turn = 8;
    state.phase = 'over';
    state.winner = won ? 'you' : 'foe';
    setScreen('end');
    showEndScreen(state, won);
  }
}

// Boot: wire input, then honour any ?shot= debug jump.
function boot() {
  state = freshState();
  bindButtons({
    startGame,
    endTurn,
    toggleMute: () => sound.toggleMute(),
  });
  bindKeyboard({
    getState: () => state,
    startGame,
    endTurn,
    playCardById,
    toggleMute: () => sound.toggleMute(),
  });
  const params = new URLSearchParams(location.search);
  if (params.get('shot')) applyShotParam();
  else setScreen('title');
}

boot();
