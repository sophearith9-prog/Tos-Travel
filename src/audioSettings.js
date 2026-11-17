const STORAGE_KEY = 'angkor-adventure-audio';

// On/off toggles:   music, sound (sound effects), ambienceOn
// Volume levels 0..1: musicVolume, sfx, ambience (pause-menu sliders)
const DEFAULTS = { music: true, sound: true, ambienceOn: true, musicVolume: 0.7, sfx: 0.8, ambience: 0.6 };
const level = (value, fallback) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      music: saved.music !== false,
      sound: saved.sound !== false,
      ambienceOn: saved.ambienceOn !== false,
      musicVolume: level(saved.musicVolume, DEFAULTS.musicVolume),
      sfx: level(saved.sfx, DEFAULTS.sfx),
      ambience: level(saved.ambience, DEFAULTS.ambience)
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export const audioSettings = readSettings();
const listeners = new Set();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(audioSettings)); } catch { /* Storage may be unavailable. */ }
  listeners.forEach(listener => listener(audioSettings));
}

// kind: 'music' | 'sound' | 'ambienceOn'
export function setAudioEnabled(kind, enabled) {
  audioSettings[kind] = enabled;
  save();
}

// kind: 'musicVolume' | 'sfx' | 'ambience'; value 0..1
export function setAudioLevel(kind, value) {
  audioSettings[kind] = level(value, audioSettings[kind]);
  save();
}

// Actual playback volume for a music track whose designed level is `base`.
// The 70% default reproduces `base` exactly; 100% is about twice as loud (+6 dB).
export function musicVolume(base) {
  if (!audioSettings.music) return 0;
  return base * Math.pow(audioSettings.musicVolume / DEFAULTS.musicVolume, 2);
}

export function onAudioSettingsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
