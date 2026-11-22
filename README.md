# Ember Clash

[![best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/mioand88-collab/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/mioand88-collab/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original turn-based card duel for the browser. You are the Emberwright,
facing the Rival Warden across a felt table. Both duelists have 30 hearth
(life), gain embers (mana) each turn, and draw from a 40-card deck of
original cards in four elements — Ember, Tide, Gale and Stone — each told
apart by colour *and* shape. Play cards to strike, raise shields, heal,
draw, double-strike or siphon life. Reduce the Warden's hearth to zero
before yours falls.

## Rules in brief

- **Hearth:** 30 life each. Damage hits shield first, then life.
- **Embers:** start at 1, +1 each turn, max 10. Cards cost embers to play.
- **Turns:** draw a card, play as many as you can afford, then End Turn.
  The Warden draws, gains an ember, and plays its best-value cards.
- **Cards:** 20 original designs — attacks, shields, heals, draws,
  double-strikes and life-steals across the four elements.
- **Win / lose:** first hearth to zero decides the duel.

## Run it

Serve `game/` with any static server and open `game/index.html`:

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080
```

No build step, no network requests, no libraries. Mouse and keyboard
play: click a card (or press 1–7) to play it, Enter ends your turn,
R restarts, M mutes the WebAudio sound effects.

## Layout

- `game/index.html` — the table, title and end screens
- `game/src/style.css` — table, cards and animations (all art is CSS)
- `game/src/cards.js` — the original card catalogue
- `game/src/deck.js` — deck building, shuffling, drawing
- `game/src/ai.js` — the Rival Warden's readable, counterable play
- `game/src/render.js` — hands, vitals, log, stage and end screen
- `game/src/input.js` — mouse and keyboard bindings
- `game/src/sound.js` — WebAudio synth effects, no audio files
- `game/src/main.js` — duel state, turn flow and card resolution
- `main.ts` — the make.fun hand-in program (copies `game/` and
  `screenshots/` to `/output`, writes `dossier.json`)
