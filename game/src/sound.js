// Ember Clash — sound effects, synthesized live with WebAudio.
// No audio files, no network: every sound is an oscillator envelope.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  return muted;
}

// Lazily create the audio context on the first user gesture.
function audio() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// One short tone: frequency slide, gain envelope, optional delay.
function tone(freqFrom, freqTo, duration, type, volume, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playClick()   { tone(660, 520, 0.07, 'triangle', 0.12); }
export function playCard()    { tone(420, 840, 0.16, 'triangle', 0.18); tone(840, 1240, 0.12, 'sine', 0.10, 0.05); }
export function playDraw()    { tone(900, 1400, 0.09, 'sine', 0.08); }
export function playDamage()  { tone(220, 70, 0.25, 'sawtooth', 0.20); tone(110, 55, 0.3, 'square', 0.10, 0.02); }
export function playShield()  { tone(520, 780, 0.18, 'sine', 0.14); tone(780, 1040, 0.14, 'sine', 0.08, 0.08); }
export function playHeal()    { tone(523, 523, 0.12, 'sine', 0.12); tone(659, 659, 0.12, 'sine', 0.12, 0.1); tone(784, 784, 0.2, 'sine', 0.12, 0.2); }
export function playTurn()    { tone(392, 392, 0.09, 'triangle', 0.10); tone(523, 523, 0.09, 'triangle', 0.10, 0.09); }
export function playWin() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.28, 'triangle', 0.16, i * 0.11));
  tone(262, 262, 0.5, 'sine', 0.10, 0.1);
}
export function playLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.94, 0.3, 'triangle', 0.14, i * 0.14));
}
