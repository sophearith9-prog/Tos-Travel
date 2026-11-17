// Sound-effect definitions and synthesized placeholders.
//
// Each entry: { file?, alias?, synth?, volume, pitchVar, volVar, rate, max, cooldown, bus, range, streak }
//   file   - Phaser audio cache key of a real recording (loaded in a scene's preload).
//            To use your own recording, add it to SFX_FILES below and set `file`.
//   alias  - reuse another sound's buffer (e.g. a pitched-up copy).
//   synth  - placeholder renderer used when no file is available; rendered ONCE into an
//            AudioBuffer and cached, so playing it costs one buffer source.
//   bus    - 'sfx' (default, paused with the game), 'ui' (plays in menus), 'priority'
//            (hurt / boss warnings: never stolen, briefly ducks everything else).
//   max    - simultaneous copies (default 3); cooldown - min ms between plays.
//   range  - world distance at which playAt() fades to silence.

// Real recordings already in assets/audio (loaded by the scenes that use them).
export const SFX_FILES = {
  jump: 'assets/audio/jump.wav',
  coin: 'assets/audio/coin.wav',
  stomp: 'assets/audio/stomp.wav',
  win: 'assets/audio/win.wav',
  lose: 'assets/audio/lose.wav'
};

const TAU = Math.PI * 2;

/* ---------- tiny DSP helpers (offline, run once per sound) ---------- */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}
const make = (sr, seconds) => new Float32Array(Math.max(1, Math.round(sr * seconds)));

// Attack/decay envelope value at time t (seconds).
const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

function noise(n, seed = 1) {
  const r = rng(seed), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r();
  return out;
}
function brown(n, seed = 2) {
  const r = rng(seed), out = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) { v = (v + r() * 0.02) * 0.998; out[i] = v * 8; }
  return out;
}
function lowpass(data, cutoff, sr) {
  const a = Math.exp(-TAU * cutoff / sr);
  let y = 0;
  for (let i = 0; i < data.length; i++) { y = (1 - a) * data[i] + a * y; data[i] = y; }
  return data;
}
function highpass(data, cutoff, sr) {
  const a = Math.exp(-TAU * cutoff / sr);
  let y = 0, prev = 0;
  for (let i = 0; i < data.length; i++) { y = a * (y + data[i] - prev); prev = data[i]; data[i] = y; }
  return data;
}
function bandpass(data, freq, q, sr) {
  const w = TAU * freq / sr, alpha = Math.sin(w) / (2 * q), cos = Math.cos(w);
  const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; data[i] = y;
  }
  return data;
}
// Oscillator with a pitch sweep and an envelope, mixed into `out` at `start` seconds.
function tone(out, sr, { start = 0, dur, f0, f1 = f0, wave = 'sine', vol = 1, attack = 0.004, decay = dur / 3, vibrato = 0, vibRate = 6 }) {
  const s0 = Math.round(start * sr), n = Math.round(dur * sr);
  // Running multipliers instead of pow/exp per sample (keeps rendering fast).
  const sweep = Math.pow(f1 / f0, 1 / n), fall = Math.exp(-1 / (decay * sr));
  const attackN = Math.max(1, Math.round(attack * sr)), tailN = sr * 0.004;
  let phase = 0, f = f0, amp = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const fv = vibrato ? f * (1 + vibrato * Math.sin(TAU * vibRate * i / sr)) : f;
    phase += fv / sr; if (phase >= 1) phase -= 1;
    const p = phase;
    const v = wave === 'sine' ? Math.sin(TAU * p)
      : wave === 'tri' ? 1 - 4 * Math.abs(p - 0.5)
        : wave === 'square' ? (p < 0.5 ? 1 : -1) * 0.6
          : (p * 2 - 1) * 0.7;   // saw
    amp = i < attackN ? i / attackN : (i === attackN ? 1 : amp * fall);
    out[s0 + i] += v * vol * amp * Math.min(1, (n - i) / tailN);
    f *= sweep;
  }
  return out;
}
// Filtered noise burst mixed into `out`.
function burst(out, sr, { start = 0, dur, vol = 1, attack = 0.002, decay = dur / 3, lp = 0, hp = 0, bp = 0, q = 1, seed = 3 }) {
  const n = Math.round(dur * sr);
  let d = noise(n, seed);
  if (bp) d = bandpass(d, bp, q, sr);
  if (lp) d = lowpass(d, lp, sr);
  if (hp) d = highpass(d, hp, sr);
  const s0 = Math.round(start * sr);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    out[s0 + i] += d[i] * vol * env(i / sr, attack, decay) * Math.min(1, (n - i) / (sr * 0.004));
  }
  return out;
}
function normalize(data, peak = 0.9) {
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i]));
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] *= peak / max;
  return data;
}
// Seamless loop: render seconds + crossfade, then blend the tail into the head.
function loop(sr, seconds, render, fade = 0.6) {
  const total = make(sr, seconds + fade);
  render(total, seconds + fade);
  const n = Math.round(seconds * sr), f = Math.round(fade * sr), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = total[i];
  for (let i = 0; i < f; i++) { const k = i / f; out[i] = total[i] * k + total[n + i] * (1 - k); }
  return normalize(out, 0.5);
}

/* ---------- placeholder synths ---------- */

const step = (sr, kind) => {
  const out = make(sr, kind === 'water' ? 0.16 : 0.09);
  if (kind === 'stone') { burst(out, sr, { dur: 0.05, hp: 1800, decay: 0.012, vol: 0.8, seed: 11 }); tone(out, sr, { dur: 0.05, f0: 140, f1: 90, decay: 0.015, vol: 0.6 }); }
  if (kind === 'grass') { burst(out, sr, { dur: 0.08, bp: 3200, q: 0.8, attack: 0.01, decay: 0.025, vol: 1, seed: 12 }); }
  if (kind === 'wood') { tone(out, sr, { dur: 0.07, f0: 260, f1: 190, decay: 0.02, vol: 0.8 }); tone(out, sr, { dur: 0.05, f0: 720, wave: 'tri', decay: 0.012, vol: 0.25 }); burst(out, sr, { dur: 0.02, hp: 2500, decay: 0.005, vol: 0.4, seed: 13 }); }
  if (kind === 'water') { burst(out, sr, { dur: 0.14, bp: 1300, q: 1.2, attack: 0.008, decay: 0.04, vol: 1, seed: 14 }); tone(out, sr, { start: 0.03, dur: 0.06, f0: 700, f1: 1100, decay: 0.02, vol: 0.25 }); }
  return normalize(out, 0.9);
};

const swingBuffer = (sr, heavy) => {
  const dur = heavy ? 0.3 : 0.2, n = Math.round(dur * sr), out = make(sr, dur);
  const d = noise(n, heavy ? 21 : 22);
  // Sweep a band-pass upward by processing in short blocks: a rising "whoosh".
  const block = 128;
  for (let b = 0; b < n; b += block) {
    const k = b / n, f = heavy ? 500 + 1900 * k : 900 + 2400 * k;
    const seg = bandpass(d.slice(b, b + block), f, 1.1, sr);
    for (let i = 0; i < seg.length; i++) out[b + i] = seg[i] * Math.sin(Math.PI * Math.min(1, (b + i) / n)) * 1.4;
  }
  tone(out, sr, { start: 0.01, dur: heavy ? 0.22 : 0.12, f0: heavy ? 900 : 1200, f1: heavy ? 420 : 520, wave: 'tri', decay: heavy ? 0.08 : 0.04, vol: 0.18 });
  return normalize(out, 0.9);
};

const bell = (out, sr, start, freq, dur, vol = 0.5) => {
  for (const [ratio, amp] of [[1, 1], [2.01, 0.45], [3.02, 0.22], [4.17, 0.12]]) {
    tone(out, sr, { start, dur, f0: freq * ratio, decay: dur / (2 + ratio), vol: vol * amp });
  }
};

const SYNTHS = {
  stepStone: sr => step(sr, 'stone'),
  stepGrass: sr => step(sr, 'grass'),
  stepWood: sr => step(sr, 'wood'),
  stepWater: sr => step(sr, 'water'),
  land: sr => { const o = make(sr, 0.14); tone(o, sr, { dur: 0.12, f0: 110, f1: 50, decay: 0.035, vol: 1 }); burst(o, sr, { dur: 0.06, lp: 900, decay: 0.02, vol: 0.6, seed: 31 }); return normalize(o); },
  hurt: sr => { const o = make(sr, 0.26); tone(o, sr, { dur: 0.22, f0: 360, f1: 170, wave: 'square', decay: 0.08, vol: 0.7 }); burst(o, sr, { dur: 0.08, bp: 1500, q: 0.7, decay: 0.03, vol: 0.8, seed: 32 }); tone(o, sr, { dur: 0.1, f0: 120, f1: 60, decay: 0.04, vol: 0.6 }); return normalize(o); },
  death: sr => { const o = make(sr, 1.0); tone(o, sr, { dur: 0.95, f0: 440, f1: 110, wave: 'tri', decay: 0.4, vol: 0.7, vibrato: 0.02, vibRate: 7 }); tone(o, sr, { start: 0.05, dur: 0.3, f0: 90, f1: 45, decay: 0.12, vol: 0.6 }); return normalize(o); },
  swing: sr => swingBuffer(sr, false),
  swing3: sr => swingBuffer(sr, true),
  hitStone: sr => { const o = make(sr, 0.22); burst(o, sr, { dur: 0.08, hp: 2200, decay: 0.02, vol: 0.9, seed: 41 }); burst(o, sr, { dur: 0.16, bp: 600, q: 1.5, decay: 0.05, vol: 0.6, seed: 42 }); tone(o, sr, { dur: 0.14, f0: 95, f1: 55, decay: 0.05, vol: 0.7 }); return normalize(o); },
  hitAnimal: sr => { const o = make(sr, 0.2); tone(o, sr, { dur: 0.15, f0: 160, f1: 70, decay: 0.05, vol: 1 }); burst(o, sr, { dur: 0.08, lp: 1100, decay: 0.025, vol: 0.8, seed: 43 }); return normalize(o); },
  deflect: sr => { const o = make(sr, 0.6); for (const [f, a] of [[840, 1], [1290, 0.7], [1960, 0.5], [2840, 0.35], [3710, 0.2]]) tone(o, sr, { dur: 0.58, f0: f, decay: 0.12 + 60 / f, vol: a * 0.5 }); burst(o, sr, { dur: 0.02, hp: 3000, decay: 0.004, vol: 0.6, seed: 44 }); return normalize(o); },
  treasure: sr => { const o = make(sr, 0.7); [1047, 1319, 1568, 2093].forEach((f, i) => bell(o, sr, i * 0.07, f, 0.45, 0.4)); return normalize(o); },
  secret: sr => { const o = make(sr, 1.4); [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => bell(o, sr, i * 0.09, f, 0.9, 0.35)); tone(o, sr, { start: 0.5, dur: 0.9, f0: 2093, decay: 0.4, vol: 0.15, vibrato: 0.01 }); return normalize(o); },
  // Sealed flag: a dull metallic clunk with a low thud.
  locked: sr => { const o = make(sr, 0.34); tone(o, sr, { dur: 0.16, f0: 240, f1: 170, wave: 'square', decay: 0.05, vol: 0.45 }); for (const [f, a] of [[620, 0.5], [935, 0.35], [1410, 0.2]]) tone(o, sr, { dur: 0.3, f0: f, decay: 0.07, vol: a }); burst(o, sr, { dur: 0.05, bp: 2400, q: 1.2, decay: 0.012, vol: 0.7, seed: 71 }); tone(o, sr, { dur: 0.12, f0: 95, f1: 55, decay: 0.04, vol: 0.6 }); return normalize(o, 0.85); },
  // Unseal: chains shatter, then a rising temple-bell flourish.
  unseal: sr => { const o = make(sr, 1.5); const r = rng(72); for (let i = 0; i < 10; i++) { const t = i * 0.022 + Math.abs(r()) * 0.02; burst(o, sr, { start: t, dur: 0.05, hp: 2800, decay: 0.012, vol: 0.5, seed: 73 + i }); tone(o, sr, { start: t, dur: 0.12, f0: 1800 + Math.abs(r()) * 1800, decay: 0.03, vol: 0.18 }); } tone(o, sr, { dur: 0.3, f0: 110, f1: 60, decay: 0.09, vol: 0.5 }); [587, 740, 880, 1175].forEach((f, i) => bell(o, sr, 0.28 + i * 0.1, f, 0.9, 0.42)); return normalize(o); },
  checkpoint: sr => { const o = make(sr, 0.9); bell(o, sr, 0, 784, 0.6, 0.5); bell(o, sr, 0.16, 1175, 0.7, 0.5); return normalize(o); },
  splash: sr => { const o = make(sr, 0.55); burst(o, sr, { dur: 0.5, bp: 900, q: 0.8, attack: 0.005, decay: 0.15, vol: 1, seed: 51 }); burst(o, sr, { dur: 0.3, hp: 2500, decay: 0.06, vol: 0.4, seed: 52 }); for (let i = 0; i < 5; i++) tone(o, sr, { start: 0.1 + i * 0.06, dur: 0.05, f0: 500 + i * 90, f1: 900 + i * 120, decay: 0.015, vol: 0.18 }); return normalize(o); },
  logSink: sr => { const o = make(sr, 0.8); const r = rng(53); for (let i = 0; i < 9; i++) tone(o, sr, { start: i * 0.08 + Math.abs(r()) * 0.03, dur: 0.07, f0: 180 + Math.abs(r()) * 160, f1: 320 + Math.abs(r()) * 220, decay: 0.025, vol: 0.4 }); burst(o, sr, { dur: 0.7, lp: 400, attack: 0.1, decay: 0.25, vol: 0.4, seed: 54 }); return normalize(o, 0.8); },
  elephant: sr => { const o = make(sr, 0.95); tone(o, sr, { dur: 0.9, f0: 280, f1: 470, wave: 'saw', attack: 0.06, decay: 0.45, vol: 0.6, vibrato: 0.03, vibRate: 9 }); tone(o, sr, { dur: 0.9, f0: 560, f1: 940, wave: 'square', attack: 0.06, decay: 0.4, vol: 0.2, vibrato: 0.03, vibRate: 9 }); return normalize(bandpass(o, 900, 0.7, sr)); },
  boarSnort: sr => { const o = make(sr, 0.4); burst(o, sr, { dur: 0.12, bp: 500, q: 1.2, decay: 0.04, vol: 1, seed: 61 }); burst(o, sr, { start: 0.18, dur: 0.14, bp: 450, q: 1.2, decay: 0.05, vol: 0.9, seed: 62 }); tone(o, sr, { start: 0.17, dur: 0.16, f0: 120, f1: 90, wave: 'saw', decay: 0.06, vol: 0.3 }); return normalize(o); },
  boarCharge: sr => { const o = make(sr, 0.55); tone(o, sr, { dur: 0.3, f0: 150, f1: 95, wave: 'saw', decay: 0.12, vol: 0.5 }); for (let i = 0; i < 6; i++) burst(o, sr, { start: 0.05 + i * 0.075, dur: 0.05, lp: 700, decay: 0.015, vol: 0.6, seed: 63 + i }); return normalize(o); },
  kiteScreech: sr => { const o = make(sr, 0.55); tone(o, sr, { dur: 0.22, f0: 2300, f1: 1700, attack: 0.02, decay: 0.12, vol: 0.6, vibrato: 0.02, vibRate: 30 }); tone(o, sr, { start: 0.26, dur: 0.26, f0: 2100, f1: 1400, attack: 0.02, decay: 0.14, vol: 0.55, vibrato: 0.02, vibRate: 30 }); return normalize(o); },
  guardianStep: sr => { const o = make(sr, 0.15); tone(o, sr, { dur: 0.13, f0: 105, f1: 48, wave: 'square', decay: 0.035, vol: 0.6 }); return normalize(lowpass(o, 420, sr)); },
  guardianJump: sr => { const o = make(sr, 0.26); tone(o, sr, { dur: 0.24, f0: 210, f1: 82, wave: 'tri', decay: 0.08, vol: 0.7 }); return normalize(o); },
  guardianAttack: sr => { const o = make(sr, 0.36); tone(o, sr, { dur: 0.34, f0: 170, f1: 42, wave: 'saw', decay: 0.12, vol: 0.7 }); return normalize(lowpass(o, 720, sr)); },
  bossWarn: sr => { const o = make(sr, 0.5); tone(o, sr, { dur: 0.45, f0: 80, f1: 150, wave: 'saw', attack: 0.04, decay: 0.25, vol: 0.8, vibrato: 0.04, vibRate: 11 }); tone(o, sr, { dur: 0.45, f0: 160, f1: 300, wave: 'square', attack: 0.04, decay: 0.2, vol: 0.25 }); return normalize(bandpass(o, 500, 0.6, sr)); },
  impact: sr => { const o = make(sr, 0.2); tone(o, sr, { dur: 0.18, f0: 92, f1: 35, wave: 'square', decay: 0.05, vol: 0.8 }); return normalize(lowpass(o, 320, sr)); },
  uiTap: sr => { const o = make(sr, 0.05); tone(o, sr, { dur: 0.04, f0: 1150, f1: 900, decay: 0.012, vol: 0.7 }); burst(o, sr, { dur: 0.01, hp: 3000, decay: 0.003, vol: 0.3, seed: 71 }); return normalize(o, 0.7); },
  menuMove: sr => { const o = make(sr, 0.035); tone(o, sr, { dur: 0.03, f0: 1500, decay: 0.008, vol: 0.6 }); return normalize(o, 0.5); },
  pause: sr => { const o = make(sr, 0.3); tone(o, sr, { dur: 0.12, f0: 659, decay: 0.05, vol: 0.5, wave: 'tri' }); tone(o, sr, { start: 0.1, dur: 0.18, f0: 494, decay: 0.07, vol: 0.5, wave: 'tri' }); return normalize(o, 0.7); },

  /* ---- loops ---- */
  waterfall: sr => loop(sr, 4, (o, d) => {
    const n = o.length, w = highpass(lowpass(noise(n, 81), 1900, sr), 180, sr), b = brown(n, 82);
    for (let i = 0; i < n; i++) o[i] = w[i] * (0.8 + 0.2 * Math.sin(TAU * i / sr * 0.7)) + b[i] * 0.25;
  }),
  ambJungle: sr => loop(sr, 8, (o, d) => {
    const n = o.length, wind = lowpass(noise(n, 91), 500, sr), r = rng(92);
    for (let i = 0; i < n; i++) o[i] = wind[i] * 0.35;
    // Crickets: fast pulsed high tones.
    for (let c = 0; c < 2; c++) {
      const f = 4300 + c * 600;
      for (let t = 0.1 + c * 0.3; t < d - 0.3; t += 0.9 + Math.abs(r()) * 0.6) for (let k = 0; k < 4; k++) tone(o, sr, { start: t + k * 0.05, dur: 0.03, f0: f, decay: 0.01, vol: 0.12 });
    }
    // Distant birds.
    for (let t = 0.8; t < d - 0.5; t += 2.2 + Math.abs(r())) tone(o, sr, { start: t, dur: 0.18, f0: 2400 + r() * 300, f1: 3100, attack: 0.02, decay: 0.07, vol: 0.1, vibrato: 0.03, vibRate: 25 });
  }),
  ambRiver: sr => loop(sr, 8, (o, d) => {
    const n = o.length, flow = lowpass(brown(n, 101), 650, sr), r = rng(102);
    for (let i = 0; i < n; i++) o[i] = flow[i] * (0.8 + 0.2 * Math.sin(TAU * i / sr * 0.31));
    for (let t = 0.3; t < d - 0.2; t += 0.35 + Math.abs(r()) * 0.6) burst(o, sr, { start: t, dur: 0.12, bp: 700 + Math.abs(r()) * 500, q: 2, attack: 0.02, decay: 0.04, vol: 0.18, seed: 103 + Math.round(t * 10) });
  }),
  ambCoast: sr => loop(sr, 8, (o, d) => {
    const n = o.length, surf = lowpass(noise(n, 111), 1200, sr), wind = lowpass(noise(n, 112), 300, sr);
    for (let i = 0; i < n; i++) {
      const t = i / sr, swell = Math.pow(Math.max(0, Math.sin(TAU * t / 4)), 2);   // two waves per loop
      o[i] = surf[i] * (0.15 + 0.85 * swell) + wind[i] * 0.3;
    }
  }),
  ambHighland: sr => loop(sr, 8, (o, d) => {
    const n = o.length, wind = bandpass(noise(n, 121), 420, 0.6, sr), r = rng(122);
    for (let i = 0; i < n; i++) { const t = i / sr; o[i] = wind[i] * (0.5 + 0.5 * Math.pow(Math.sin(TAU * t / 8 + 0.5), 2)); }
    for (let t = 1.2; t < d - 0.4; t += 2.6 + Math.abs(r())) { tone(o, sr, { start: t, dur: 0.12, f0: 1800, f1: 2600, decay: 0.05, vol: 0.08 }); tone(o, sr, { start: t + 0.16, dur: 0.12, f0: 1900, f1: 2700, decay: 0.05, vol: 0.07 }); }
  }),
  ambCityNight: sr => loop(sr, 8, (o, d) => {
    const n = o.length, rumble = lowpass(brown(n, 131), 140, sr), r = rng(132);
    for (let i = 0; i < n; i++) o[i] = rumble[i] * 0.9;
    for (let t = 0.2; t < d - 0.3; t += 1.4 + Math.abs(r())) for (let k = 0; k < 3; k++) tone(o, sr, { start: t + k * 0.06, dur: 0.035, f0: 4600, decay: 0.012, vol: 0.07 });
    tone(o, sr, { start: 3, dur: 2.5, f0: 72, f1: 66, wave: 'saw', attack: 0.8, decay: 1.2, vol: 0.12 });   // distant engine hum
  }),
  ambFloatingVillage: sr => loop(sr, 8, (o, d) => {
    const n = o.length, water = lowpass(brown(n, 141), 500, sr), wind = lowpass(noise(n, 142), 350, sr), r = rng(143);
    for (let i = 0; i < n; i++) { const t = i / sr; o[i] = water[i] * (0.6 + 0.4 * Math.sin(TAU * t * 0.5)) + wind[i] * 0.2; }
    for (let t = 1; t < d - 0.6; t += 2.8 + Math.abs(r())) tone(o, sr, { start: t, dur: 0.5, f0: 110, f1: 95, wave: 'tri', attack: 0.1, decay: 0.2, vol: 0.12, vibrato: 0.05, vibRate: 3 });   // wood creak
    bell(o, sr, 5.2, 1568, 1.2, 0.05);   // distant temple bell
  })
};

/* ---------- the sound table ---------- */

export const SOUNDS = {
  // Hero
  stepStone: { synth: 'stepStone', volume: 0.22, pitchVar: 0.08, max: 2, cooldown: 120 },
  stepGrass: { synth: 'stepGrass', volume: 0.2, pitchVar: 0.1, max: 2, cooldown: 120 },
  stepWood: { synth: 'stepWood', volume: 0.24, pitchVar: 0.08, max: 2, cooldown: 120 },
  stepWater: { synth: 'stepWater', volume: 0.26, pitchVar: 0.1, max: 2, cooldown: 120 },
  jump: { file: 'jump', volume: 0.42, pitchVar: 0.03 },
  doubleJump: { file: 'jump', rate: 1.3, volume: 0.45, pitchVar: 0.03 },
  land: { synth: 'land', volume: 0.32, cooldown: 120 },
  hurt: { synth: 'hurt', volume: 0.8, bus: 'priority', pitchVar: 0.04, max: 1 },
  // 'ui' bus so it carries over into the Game Over screen instead of being cut at scene change.
  death: { synth: 'death', volume: 0.75, bus: 'ui', pitchVar: 0, max: 1 },
  // Sword: three rising combo swings + a heavier finisher
  swing1: { synth: 'swing', alias: 'swing', volume: 0.5, rate: 1.0, pitchVar: 0.03 },
  swing2: { synth: 'swing', alias: 'swing', volume: 0.52, rate: 1.12, pitchVar: 0.03 },
  swing3: { synth: 'swing', alias: 'swing', volume: 0.55, rate: 1.26, pitchVar: 0.03 },
  swingFinisher: { synth: 'swing3', volume: 0.6, pitchVar: 0.03 },
  hitStone: { synth: 'hitStone', volume: 0.6 },
  hitAnimal: { synth: 'hitAnimal', volume: 0.6 },
  deflect: { synth: 'deflect', volume: 0.5, pitchVar: 0.04 },
  // Pickups
  coin: { file: 'coin', volume: 0.38, pitchVar: 0.01, streak: { window: 1300, step: 0.06, max: 8 } },
  treasure: { synth: 'treasure', volume: 0.5 },
  secret: { synth: 'secret', volume: 0.6, pitchVar: 0, max: 1 },
  // World
  locked: { synth: 'locked', volume: 0.5, pitchVar: 0.03, cooldown: 250 },
  unseal: { synth: 'unseal', volume: 0.65, pitchVar: 0, max: 1 },
  checkpoint: { synth: 'checkpoint', volume: 0.55, pitchVar: 0 },
  levelClear: { file: 'win', volume: 0.55, pitchVar: 0, max: 1 },
  splash: { synth: 'splash', volume: 0.55, range: 420 },
  logSink: { synth: 'logSink', volume: 0.4, cooldown: 900, range: 360 },
  elephant: { synth: 'elephant', volume: 0.45, cooldown: 1500, range: 520 },
  boarSnort: { synth: 'boarSnort', volume: 0.5, range: 360 },
  boarCharge: { synth: 'boarCharge', volume: 0.55, range: 380 },
  kiteScreech: { synth: 'kiteScreech', volume: 0.45, range: 460 },
  guardianStep: { synth: 'guardianStep', volume: 0.22, max: 2, cooldown: 140, range: 380 },
  guardianJump: { synth: 'guardianJump', volume: 0.3, range: 420 },
  guardianAttack: { synth: 'guardianAttack', volume: 0.45, range: 420 },
  bossWarn: { synth: 'bossWarn', volume: 0.75, bus: 'priority', max: 1, cooldown: 300 },
  impact: { synth: 'impact', volume: 0.5, range: 420 },
  stomp: { file: 'stomp', volume: 0.5 },
  // UI (plays while the game is paused)
  uiTap: { synth: 'uiTap', volume: 0.4, bus: 'ui', pitchVar: 0.02 },
  menuMove: { synth: 'menuMove', volume: 0.3, bus: 'ui', cooldown: 70, pitchVar: 0.02 },
  pause: { synth: 'pause', volume: 0.45, bus: 'ui', pitchVar: 0 },
  gameOver: { file: 'lose', volume: 0.55, bus: 'ui', pitchVar: 0, max: 1 },
  victory: { file: 'win', volume: 0.55, bus: 'ui', pitchVar: 0, max: 1 }
};

// Looping beds (rendered once). Ambience is chosen from the level's biome.
export const LOOPS = {
  waterfall: { synth: 'waterfall' },
  ambJungle: { synth: 'ambJungle' },
  ambRiver: { synth: 'ambRiver' },
  ambCoast: { synth: 'ambCoast' },
  ambHighland: { synth: 'ambHighland' },
  ambCityNight: { synth: 'ambCityNight' },
  ambFloatingVillage: { synth: 'ambFloatingVillage' }
};

export function renderSynth(name, sampleRate) {
  const synth = SYNTHS[name];
  return synth ? synth(sampleRate) : null;
}
