/* ============================================================================
   audio.js — the score.
   One shared AudioContext feeds a single master gain:
     - ambient drone (distant wind/embers) — begins on Enter, loops forever
     - a music-box "Happy Birthday" — fired once when the letter scrolls in
   Nothing autoplays before a real gesture (Enter counts); the sound toggle
   fades the master in/out. Everything is synthesized — no audio files.
   ========================================================================== */

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99,
};

/* "Happy Birthday" — public domain melody. [note, beats]. */
const MELODY = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
];

const BEAT = 0.62; // gentle tempo

export function createScore() {
  let ctx = null;
  let master = null;
  let bus = null;
  let enabled = false;
  let bdayArmed = false; // letter reached — loop whenever sound is on
  let bdayTimer = 0;

  const build = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);

    // Ambient drone — soft voices through a breathing lowpass.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.8;
    filter.connect(bus);

    for (const v of [
      { type: 'sine', freq: 55, gain: 0.5 },
      { type: 'sine', freq: 82.41, gain: 0.28, detune: 4 },
      { type: 'triangle', freq: 110, gain: 0.12, detune: -6 },
    ]) {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      if (v.detune) osc.detune.value = v.detune;
      const g = ctx.createGain();
      g.gain.value = v.gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    }

    // Slow breathing on the filter cutoff.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    return true;
  };

  const ensure = () => {
    if (!ctx && !build()) return false;
    if (ctx.state === 'suspended') {
      ctx.resume();
      // If we got here without a gesture (e.g. entered via scroll),
      // arm a one-shot resume on the next real tap/click.
      document.addEventListener('pointerdown', () => ctx.resume(), { once: true });
    }
    return true;
  };

  const fade = (on) => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(on ? 0.22 : 0, now + (on ? 1.4 : 0.8));
  };

  /* One full pass of the melody, then re-queue itself after a breath. */
  const schedulePass = () => {
    clearTimeout(bdayTimer);
    if (!enabled || !ctx) {
      bdayTimer = 0;
      return;
    }
    if (ctx.state !== 'running') ctx.resume();
    let t = ctx.currentTime + 0.25;
    for (const [n, beats] of MELODY) {
      const dur = beats * BEAT;
      chime(NOTE[n], t, dur, 0.3);
      t += dur * 0.94;
    }
    bdayTimer = setTimeout(schedulePass, (t - ctx.currentTime + 1.8) * 1000);
  };

  /* Bell-ish voice: bright triangle + warm octave-below sine. */
  const chime = (freq, t, dur, peak) => {
    for (const [type, f, p] of [
      ['triangle', freq, peak],
      ['sine', freq / 2, peak * 0.45],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 0.92));
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  };

  return {
    get enabled() {
      return enabled;
    },
    /* Called on the Enter click — a real gesture, so audio may start. */
    start() {
      if (!ensure()) return;
      enabled = true;
      fade(true);
      if (bdayArmed && !bdayTimer) schedulePass();
    },
    /* Music-box birthday melody — loops once armed, while sound is on. */
    playBirthday() {
      bdayArmed = true;
      if (!enabled || !ctx || bdayTimer) return;
      schedulePass();
    },
    /* A soft breath of filtered noise — the candle gust. */
    whoosh() {
      if (!enabled || !ctx) return;
      if (ctx.state !== 'running') ctx.resume();
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(1400, t);
      f.frequency.exponentialRampToValueAtTime(280, t + 0.45);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      src.connect(f);
      f.connect(g);
      g.connect(bus);
      src.start(t);
    },
    toggle() {
      if (!ensure()) return enabled;
      enabled = !enabled;
      fade(enabled);
      if (enabled && bdayArmed && !bdayTimer) schedulePass();
      return enabled;
    },
  };
}
