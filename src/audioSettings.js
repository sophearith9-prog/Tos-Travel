const STORAGE_KEY = 'angkor-adventure-audio';

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { music: saved.music !== false, sound: saved.sound !== false };
  } catch {
    return { music: true, sound: true };
  }
}

export const audioSettings = readSettings();
const listeners = new Set();

export function setAudioEnabled(kind, enabled) {
  audioSettings[kind] = enabled;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(audioSettings)); } catch { /* Storage may be unavailable. */ }
  listeners.forEach(listener => listener(audioSettings));
}

export function onAudioSettingsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
