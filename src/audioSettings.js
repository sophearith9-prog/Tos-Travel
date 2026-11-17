const STORAGE_KEY = 'angkor-adventure-audio';

// On/off toggles:   music, sound (sound effects), ambienceOn
// Volume levels 0..1: musicVolume, sfx, ambience (pause-menu sliders)
// SETTINGS_VERSION 2: music files were loudness-normalized (-14 LUFS) and the music slider
// became the real track volume; older saved music levels are reset to the new default.
const SETTINGS_VERSION = 2;
const DEFAULTS = { music: true, sound: true, ambienceOn: true, musicVolume: 0.8, sfx: 0.8, ambience: 0.6 };
const level = (value, fallback) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if ((saved.version || 1) < SETTINGS_VERSION) {
      // Old saves were tuned for the very quiet files: start music fresh at the default.
      delete saved.musicVolume;
      saved.music = true;
    }
    return {
      version: SETTINGS_VERSION,
      music: saved.music !== false,
      sound: saved.sound !== false,
      ambienceOn: saved.ambienceOn !== false,
      musicVolume: level(saved.musicVolume, DEFAULTS.musicVolume),
      sfx: level(saved.sfx, DEFAULTS.sfx),
      ambience: level(saved.ambience, DEFAULTS.ambience)
    };
  } catch {
    return { version: SETTINGS_VERSION, ...DEFAULTS };
  }
}

export const audioSettings = readSettings();
const listeners = new Set();
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(audioSettings)); } catch { /* Storage may be unavailable. */ }

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

// Playback volume for music tracks: the slider value itself (files are normalized to
// about -14 LUFS, so no extra per-track multipliers are needed).
export function musicVolume() {
  return audioSettings.music ? audioSettings.musicVolume : 0;
}

// Set a Phaser music track to the current music volume.
// Phaser 3.60's setVolume() schedules the new gain at time 0, which is ignored when the
// gain node already has later automation (after play/pause/resume), so the slider looked
// saved but the real output never changed. Write the gain at the context's current time too.
export function applyMusicVolume(track) {
  if (!track) return;
  const volume = musicVolume();
  track.setVolume(volume);
  const gain = track.volumeNode?.gain, context = track.manager?.context;
  if (gain && context) {
    gain.cancelScheduledValues(0);
    gain.setValueAtTime(volume, context.currentTime);
  }
}

export function onAudioSettingsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
