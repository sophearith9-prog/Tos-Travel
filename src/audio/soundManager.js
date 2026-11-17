import { audioSettings, onAudioSettingsChange } from '../audioSettings.js';
import { SOUNDS, LOOPS, renderSynth } from './sfxLibrary.js';

// Sound effects and ambience on Phaser's shared Web Audio context (music is untouched:
// it still plays through Phaser's own sound manager).
//
//   sfx bus      -> game sounds; muted while the game is paused or the tab is hidden
//   ui bus       -> menu sounds; still audible in the pause menu
//   priority bus -> hurt / boss warnings; never stolen, briefly ducks the rest
//   ambience bus -> biome bed + waterfall loop, kept well under the music
// All buses meet in a gentle limiter (no clipping crackle when many sounds stack).
//
// Every sound is an AudioBuffer prepared once (a recording from the Phaser cache, or a
// synthesized placeholder rendered on first use). Each sound owns up to `max` (3)
// persistent voices (gain + stereo pan) that are reused; a play only creates the
// one-shot buffer source, which is disconnected as soon as it ends.

const AMBIENCE_FOR_BIOME = {
  'temple-jungle': 'ambJungle', 'rice-fields': 'ambJungle', 'mekong-river': 'ambRiver',
  coast: 'ambCoast', 'highland-forest': 'ambHighland', city: 'ambCityNight', 'floating-village': 'ambFloatingVillage'
};
// Levels 1-9 predate the biome system.
const AMBIENCE_FOR_LEVEL = { 1: 'ambJungle', 2: 'ambJungle', 3: 'ambJungle', 4: 'ambJungle', 5: 'ambJungle', 6: 'ambJungle', 7: 'ambHighland', 8: 'ambRiver', 9: 'ambHighland' };
const SURFACE_FOR_BIOME = {
  'temple-jungle': 'stone', 'rice-fields': 'grass', 'mekong-river': 'grass', coast: 'grass',
  'highland-forest': 'grass', city: 'stone', 'floating-village': 'wood'
};
const SURFACE_FOR_LEVEL = { 1: 'stone', 2: 'stone', 3: 'stone', 4: 'stone', 5: 'stone', 6: 'grass', 7: 'stone', 8: 'stone', 9: 'grass' };

const BUS_LEVEL = { sfx: 0.9, ui: 0.8, priority: 1, ambience: 0.38 };
const WATERFALL_RANGE = 380;

class SoundManager {
  constructor(game) {
    this.game = game;
    this.ctx = game.sound?.context || null;   // Web Audio only; HTML5-audio browsers stay silent for SFX
    this.buffers = new Map();
    this.voices = new Map();
    this.lastPlay = new Map();
    this.streaks = new Map();
    this.paused = false;
    this.hidden = typeof document !== 'undefined' && document.hidden;
    this.ambience = null;
    this.waterfall = null;
    this.waterfallSources = [];
    if (!this.ctx) return;
    const c = this.ctx;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -14; this.limiter.knee.value = 8; this.limiter.ratio.value = 6;
    this.limiter.attack.value = 0.003; this.limiter.release.value = 0.2;
    this.limiter.connect(c.destination);
    this.duck = c.createGain(); this.duck.connect(this.limiter);           // ducked by priority sounds
    this.buses = {};
    for (const name of ['sfx', 'ui', 'priority', 'ambience']) {
      const bus = c.createGain();
      bus.gain.value = 0;
      bus.connect(name === 'priority' || name === 'ui' ? this.limiter : this.duck);
      this.buses[name] = bus;
    }
    this.applyLevels(true);
    onAudioSettingsChange(() => this.applyLevels());
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      if (this.hidden) this.stopVoices(v => v.bus !== 'ui');
      this.applyLevels();
    });
  }

  /* ---------- levels ---------- */

  applyLevels(immediate = false) {
    if (!this.ctx) return;
    // Effects and ambience have independent mute toggles; both go quiet while paused/hidden.
    const effects = audioSettings.sound && !this.hidden;
    const world = effects && !this.paused;
    const ambience = audioSettings.ambienceOn && !this.hidden && !this.paused;
    const target = {
      sfx: world ? BUS_LEVEL.sfx * audioSettings.sfx : 0,
      priority: world ? BUS_LEVEL.priority * Math.max(0.35, audioSettings.sfx) : 0,   // hurt stays audible even at low SFX volume
      ui: effects ? BUS_LEVEL.ui * audioSettings.sfx : 0,
      ambience: ambience ? BUS_LEVEL.ambience * audioSettings.ambience : 0
    };
    const t = this.ctx.currentTime;
    for (const [name, value] of Object.entries(target)) {
      const g = this.buses[name].gain;
      g.cancelScheduledValues(t);
      if (immediate) g.setValueAtTime(value, t); else g.setTargetAtTime(value, t, 0.06);
    }
  }

  setPaused(paused) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.stopVoices(v => v.bus !== 'ui');
    this.applyLevels();
  }

  /* ---------- buffers ---------- */

  buffer(name, def) {
    const key = def.alias || name;
    if (this.buffers.has(key)) return this.buffers.get(key);
    let buffer = null;
    if (def.file && this.game.cache.audio.exists(def.file)) {
      const cached = this.game.cache.audio.get(def.file);
      if (cached instanceof AudioBuffer) buffer = cached;
    }
    if (!buffer && def.synth) {
      const data = renderSynth(def.synth, this.ctx.sampleRate);
      if (data) {
        buffer = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
        buffer.copyToChannel(data, 0);
      }
    }
    // Only cache real buffers: a recording may not be loaded yet on the first call.
    if (buffer) this.buffers.set(key, buffer);
    return buffer;
  }

  /* ---------- voices ---------- */

  voiceFor(name, def) {
    const bus = def.bus || 'sfx';
    let list = this.voices.get(name);
    if (!list) { list = []; this.voices.set(name, list); }
    const free = list.find(v => !v.source);
    if (free) return free;
    const max = def.max || 3;
    if (list.length < max) {
      const gain = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (pan) { gain.connect(pan); pan.connect(this.buses[bus]); } else gain.connect(this.buses[bus]);
      const voice = { gain, pan, bus, source: null, startedAt: 0 };
      list.push(voice);
      return voice;
    }
    if (bus === 'priority') return null;      // never cut off a hurt/warning sound
    const oldest = list.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b));
    this.release(oldest);
    return oldest;
  }

  // Fade a voice out quickly (no click) and let its source end on its own.
  release(voice) {
    if (!voice.source) return;
    const t = this.ctx.currentTime, src = voice.source;
    voice.source = null;
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setTargetAtTime(0, t, 0.008);
    try { src.stop(t + 0.04); } catch { /* already stopped */ }
  }

  stopVoices(filter = () => true) {
    if (!this.ctx) return;
    for (const list of this.voices.values()) for (const v of list) if (v.source && filter(v)) this.release(v);
  }

  /* ---------- playback ---------- */

  // opts: { volume = 1, rate = 1, pan = 0, cooldown }
  play(name, opts = {}) {
    const def = SOUNDS[name];
    if (!def || !this.ctx || !audioSettings.sound || this.hidden) return null;
    const bus = def.bus || 'sfx';
    if (this.paused && bus !== 'ui') return null;
    if (this.ctx.state === 'suspended') this.ctx.resume?.();
    const now = performance.now();
    const cooldown = opts.cooldown ?? def.cooldown ?? 0;
    if (cooldown && now - (this.lastPlay.get(name) || -1e9) < cooldown) return null;
    const buffer = this.buffer(name, def);
    if (!buffer) return null;
    const voice = this.voiceFor(name, def);
    if (!voice) return null;
    this.lastPlay.set(name, now);

    let rate = (opts.rate || 1) * (def.rate || 1) * (1 + (Math.random() * 2 - 1) * (def.pitchVar ?? 0.05));
    if (def.streak) {
      // Quick pickups climb in pitch (coins in a row), reset after a pause.
      const s = this.streaks.get(name) || { count: 0, at: 0 };
      s.count = now - s.at < def.streak.window ? Math.min(def.streak.max, s.count + 1) : 0;
      s.at = now;
      this.streaks.set(name, s);
      rate *= 1 + s.count * def.streak.step;
    }
    const volume = (def.volume ?? 0.5) * (opts.volume ?? 1) * (1 + (Math.random() * 2 - 1) * (def.volVar ?? 0.08));
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(Math.min(1.5, volume), t);
    if (voice.pan) voice.pan.pan.value = Math.max(-1, Math.min(1, opts.pan || 0));
    src.connect(voice.gain);
    src.onended = () => {
      src.disconnect();
      if (voice.source === src) voice.source = null;
    };
    voice.source = src;
    voice.startedAt = now;
    src.start(t);
    if (bus === 'priority') this.duckOthers();
    return src;
  }

  // World sound at (x, y): fades with distance from the camera centre and pans left/right.
  playAt(scene, name, x, y, opts = {}) {
    const def = SOUNDS[name];
    if (!def || !scene?.cameras?.main) return null;
    const mid = scene.cameras.main.midPoint;
    const dx = x - mid.x, dy = (y - mid.y) * 1.4;
    const range = def.range || 420;
    const falloff = 1 - Math.hypot(dx, dy) / range;
    if (falloff <= 0.04) return null;
    return this.play(name, { ...opts, volume: (opts.volume ?? 1) * falloff * falloff, pan: Math.max(-0.8, Math.min(0.8, dx / 280)) });
  }

  duckOthers() {
    const t = this.ctx.currentTime, g = this.duck.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.5, t, 0.02);
    g.setTargetAtTime(1, t + 0.35, 0.15);
  }

  /* ---------- loops: ambience and waterfalls ---------- */

  startLoop(name, level) {
    const def = LOOPS[name];
    if (!def || !this.ctx) return null;
    let buffer = this.buffers.get(`loop:${name}`);
    if (!buffer) {
      const data = renderSynth(def.synth, this.ctx.sampleRate);
      buffer = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
      buffer.copyToChannel(data, 0);
      this.buffers.set(`loop:${name}`, buffer);
    }
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.buses.ambience);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    src.connect(gain);
    src.start();
    gain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.8);   // slow fade-in
    return { src, gain };
  }

  stopLoop(loop) {
    if (!loop || !this.ctx) return;
    const t = this.ctx.currentTime;
    loop.gain.gain.cancelScheduledValues(t);
    loop.gain.gain.setTargetAtTime(0, t, 0.15);
    try { loop.src.stop(t + 0.8); } catch { /* already stopped */ }
    loop.src.onended = () => { loop.src.disconnect(); loop.gain.disconnect(); };
  }

  // Waterfalls register their position; the loop gets louder as the player gets closer.
  addWaterfall(source) {
    this.waterfallSources.push(source);
    if (!this.waterfall && this.ctx) this.waterfall = this.startLoop('waterfall', 0);
    return () => { this.waterfallSources = this.waterfallSources.filter(s => s !== source); };
  }

  // Render every synthesized placeholder ahead of use, one per frame, so a first play
  // never stalls a frame. Buffers are cached for the whole session.
  prewarm(scene) {
    const pending = Object.entries(SOUNDS).filter(([name, def]) => !this.buffers.has(def.alias || name));
    const step = () => {
      const next = pending.shift();
      if (!next || !scene.sys?.isActive()) return;
      this.buffer(next[0], next[1]);
      scene.time.delayedCall(16, step);
    };
    scene.time.delayedCall(400, step);
  }

  /* ---------- per-scene wiring ---------- */

  // Called from GameScene.create: biome ambience, footstep surface, pause/visibility handling.
  attach(scene) {
    if (!this.ctx) return;
    this.scene = scene;
    this.setPaused(false);
    const biome = scene.levelConfig?.environment?.biome;
    const ambienceName = AMBIENCE_FOR_BIOME[biome] || AMBIENCE_FOR_LEVEL[scene.currentLevel] || 'ambJungle';
    this.defaultSurface = SURFACE_FOR_BIOME[biome] || SURFACE_FOR_LEVEL[scene.currentLevel] || 'grass';
    this.stopLoop(this.ambience);
    this.ambienceName = ambienceName;
    this.ambience = this.startLoop(ambienceName, 0.9);
    this.prewarm(scene);
    const onPause = () => this.setPaused(true);
    const onResume = () => this.setPaused(false);
    const onUpdate = () => this.update(scene);
    scene.events.on('pause', onPause);
    scene.events.on('resume', onResume);
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => {
      scene.events.off('pause', onPause);
      scene.events.off('resume', onResume);
      scene.events.off('update', onUpdate);
      this.stopVoices(v => v.bus !== 'ui');
      this.stopLoop(this.ambience); this.ambience = null;
      this.stopLoop(this.waterfall); this.waterfall = null;
      this.waterfallSources = [];
      this.paused = false;
      this.applyLevels();
      this.scene = null;
    });
  }

  update(scene) {
    if (!this.waterfall || !scene.player) return;
    const p = scene.player;
    let level = 0;
    for (const s of this.waterfallSources) {
      // Distance to the nearest point of the falling column.
      const dx = Math.max(0, Math.abs(p.x - s.x) - (s.halfWidth || 0));
      const dy = Math.max(0, s.top !== undefined ? Math.max(s.top - p.y, p.y - s.bottom) : 0) * 0.6;
      level = Math.max(level, 1 - Math.hypot(dx, dy) / WATERFALL_RANGE);
    }
    level = Math.max(0, level);
    this.waterfall.gain.gain.setTargetAtTime(level * level * 1.6, this.ctx.currentTime, 0.12);
  }

  // Footstep surface under the player: platform data, wading, or the level default.
  surfaceUnder(scene) {
    const p = scene.player;
    if (!p?.body) return this.defaultSurface || 'grass';
    if (scene.time.now - (p.getData('wadingAt') || -1e9) < 150) return 'water';
    const b = p.body;
    for (const hit of scene.physics.overlapRect(b.left + 2, b.bottom, b.width - 4, 3, true, true)) {
      const surface = hit.gameObject?.getData?.('surface');
      if (surface) return surface;
    }
    return this.defaultSurface || 'grass';
  }

  footstep(scene) {
    const surface = this.surfaceUnder(scene);
    const name = `step${surface[0].toUpperCase()}${surface.slice(1)}`;
    return this.play(SOUNDS[name] ? name : 'stepGrass');
  }
}

let instance = null;
export function soundManager(game) {
  if (!instance || instance.game !== game) instance = new SoundManager(game);
  return instance;
}
// Convenience: sfx(scene).play('coin'), sfx(scene).playAt(scene, 'splash', x, y)
export function sfx(scene) {
  return soundManager(scene.game);
}
