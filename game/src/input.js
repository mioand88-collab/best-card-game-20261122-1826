// Ember Clash — keyboard and mouse input.
// Keys: 1–7 play the matching card in hand, Enter/Space ends the turn (or
// starts / restarts the duel), R restarts, M toggles sound. Mouse: click a
// card to play it, click End Turn to pass.

import { playClick } from './sound.js';

// Wire the top-level buttons once; `actions` supplies the game callbacks.
export function bindButtons(actions) {
  document.getElementById('start-btn').addEventListener('click', () => {
    playClick();
    actions.startGame();
  });
  document.getElementById('again-btn').addEventListener('click', () => {
    playClick();
    actions.startGame();
  });
  document.getElementById('end-turn-btn').addEventListener('click', () => {
    playClick();
    actions.endTurn();
  });
  document.getElementById('restart-btn').addEventListener('click', () => {
    playClick();
    actions.startGame();
  });
  document.getElementById('sound-btn').addEventListener('click', (e) => {
    const muted = actions.toggleMute();
    e.currentTarget.textContent = muted ? 'Sound: Off' : 'Sound: On';
  });
}

// Wire keyboard shortcuts. `actions` supplies the game callbacks and a
// `getState` reader so keys only act when the duel is live.
export function bindKeyboard(actions) {
  document.addEventListener('keydown', (e) => {
    const state = actions.getState();
    if (!state) return;
    const key = e.key.toLowerCase();

    if (key === 'm') {
      const muted = actions.toggleMute();
      document.getElementById('sound-btn').textContent = muted ? 'Sound: Off' : 'Sound: On';
      return;
    }
    if (key === 'r') {
      if (state.screen !== 'title') actions.startGame();
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (state.screen === 'title') { e.preventDefault(); actions.startGame(); return; }
      if (state.screen === 'end') { e.preventDefault(); actions.startGame(); return; }
      if (state.screen === 'table' && state.phase === 'player') {
        e.preventDefault();
        actions.endTurn();
      }
      return;
    }
    // Number keys play a card from hand (1 = leftmost).
    if (state.screen === 'table' && state.phase === 'player' && /^[1-7]$/.test(key)) {
      const idx = Number(key) - 1;
      const cardId = state.you.hand[idx];
      if (cardId) actions.playCardById(cardId);
    }
  });
}
