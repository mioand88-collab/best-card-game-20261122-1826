// Ember Clash — everything the player sees: hands, vitals, log, stage
// and the end screen. Rendering is pure DOM; animations are CSS classes.

import { cardDef } from './deck.js';
import { ELEMENTS, effectText, MAX_LIFE } from './cards.js';

const $ = (id) => document.getElementById(id);

// Build one face-up card element. `opts` may carry key (keyboard hint),
// playable (false greys it out) and onClick.
export function buildCardElement(def, opts = {}) {
  const el = document.createElement('div');
  el.className = `card el-${def.element}`;
  el.dataset.cardId = def.id;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `${def.name}, ${ELEMENTS[def.element].label}, cost ${def.cost}, attack ${def.attack}${def.effect !== 'none' ? ', ' + effectText(def.effect) : ''}`);
  el.innerHTML =
    `<span class="cost">${def.cost}</span>` +
    `<span class="elem elem-${def.element}" title="${ELEMENTS[def.element].label} — ${ELEMENTS[def.element].shape}"></span>` +
    `<span class="name">${def.name}</span>` +
    `<span class="art" aria-hidden="true">${def.art}</span>` +
    `<span class="atk">${def.attack}</span>` +
    `<span class="effect">${effectText(def.effect)}</span>` +
    (opts.key ? `<span class="key">${opts.key}</span>` : '');
  if (opts.playable === false) el.classList.add('unaffordable');
  if (opts.onClick) {
    el.addEventListener('click', () => opts.onClick(def, el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onClick(def, el); }
    });
  }
  return el;
}

// Face-down card back for the opponent's hand.
export function buildCardBack() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

// Render both hands. `onPlayCard` is called with (def, element) on a click.
export function renderHands(state, onPlayCard) {
  const youHand = $('you-hand');
  youHand.innerHTML = '';
  state.you.hand.forEach((id, i) => {
    const def = cardDef(id);
    if (!def) return;
    const playable = state.phase === 'player' && def.cost <= state.you.mana;
    youHand.appendChild(buildCardElement(def, {
      key: String(i + 1),
      playable,
      onClick: (d, el) => onPlayCard(d, el),
    }));
  });

  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  state.foe.hand.forEach(() => foeHand.appendChild(buildCardBack()));

  $('you-deck-count').textContent = String(state.you.deck.length);
  $('foe-deck-count').textContent = String(state.foe.deck.length);
}

// Render life, shield, mana and life bars for both duelists.
export function renderVitals(state) {
  $('you-life').textContent = String(Math.max(0, state.you.life));
  $('you-shield').textContent = String(state.you.shield);
  $('you-mana').textContent = String(state.you.mana);
  $('foe-life').textContent = String(Math.max(0, state.foe.life));
  $('foe-shield').textContent = String(state.foe.shield);
  $('foe-mana').textContent = String(state.foe.mana);
  $('you-life-fill').style.width = `${Math.max(0, state.you.life / MAX_LIFE * 100)}%`;
  $('foe-life-fill').style.width = `${Math.max(0, state.foe.life / MAX_LIFE * 100)}%`;
  $('turn-num').textContent = String(state.turn);
  $('turn-who').textContent =
    state.phase === 'player' ? 'Your turn' :
    state.phase === 'ai' ? 'Warden is thinking…' :
    state.phase === 'over' ? 'Duel over' : 'Dealing…';
  $('end-turn-btn').disabled = state.phase !== 'player';
}

// Render the battle log (newest first, capped at 6 lines).
export function renderLog(state) {
  const log = $('battle-log');
  log.innerHTML = '';
  state.log.slice(0, 6).forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry.text;
    if (entry.who) li.classList.add(entry.who);
    log.appendChild(li);
  });
}

// Show a played card on the centre stage for a beat, then clear it.
export function showOnStage(def) {
  const stage = $('stage');
  stage.innerHTML = '';
  stage.appendChild(buildCardElement(def));
  window.setTimeout(() => { stage.innerHTML = ''; }, 900);
}

// Shake a duelist's panel to sell a hit.
export function shakeDuelist(who) {
  const panel = who === 'you'
    ? document.querySelector('.player-side .duelist')
    : document.querySelector('.opponent-side .duelist');
  if (!panel) return;
  panel.classList.remove('shake');
  void panel.offsetWidth;
  panel.classList.add('shake');
}

// Full re-render of the table.
export function renderTable(state, onPlayCard) {
  renderHands(state, onPlayCard);
  renderVitals(state);
  renderLog(state);
}

// Show the win or loss screen, with stats and (on a win) confetti.
export function showEndScreen(state, won) {
  $('table-screen').classList.add('hidden');
  const end = $('end-screen');
  end.classList.remove('hidden');
  const title = $('end-title');
  title.textContent = won ? 'VICTORY' : 'DEFEAT';
  title.className = won ? 'win' : 'loss';
  $('end-sub').textContent = won
    ? 'The Warden’s hearth is cold — the table is yours.'
    : 'Your hearth has gone dark. The Warden keeps the table… this time.';
  $('end-turns').textContent = String(state.turn);
  $('end-you-life').textContent = String(Math.max(0, state.you.life));
  $('end-foe-life').textContent = String(Math.max(0, state.foe.life));
  if (won) launchConfetti();
  $('again-btn').focus();
}

// Canvas confetti burst for the win screen.
export function launchConfetti() {
  const canvas = $('confetti');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  const colors = ['#ff5a1f', '#2fa8ff', '#37d67a', '#ffb02e', '#ffd23e', '#c98bff'];
  const pieces = [];
  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.7,
      y: h * 0.25 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 5,
      vy: 1 + Math.random() * 3.5,
      size: 5 + Math.random() * 7,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
    });
  }
  let frames = 0;
  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    frames++;
    if (frames < 240) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, w, h);
  }
  requestAnimationFrame(tick);
}
