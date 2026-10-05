import { audioSettings, onAudioSettingsChange, setAudioEnabled } from './audioSettings.js';

const MUSIC_KEYS = ['bgm-default', 'bgm-level-2'];

export function installAudioControls(game) {
  const musicButton = document.querySelector('#music-button');
  const soundButton = document.querySelector('#sound-button');
  if (!musicButton || !soundButton) return;
  const sync = () => {
    musicButton.textContent = audioSettings.music ? '\u266b' : '\u266a\u0338';
    soundButton.textContent = audioSettings.sound ? '\u{1f50a}\ufe0e' : '\u{1f507}\ufe0e';
    musicButton.setAttribute('aria-pressed', String(audioSettings.music));
    soundButton.setAttribute('aria-pressed', String(audioSettings.sound));
    musicButton.setAttribute('aria-label', `Turn music ${audioSettings.music ? 'off' : 'on'}`);
    soundButton.setAttribute('aria-label', `Turn sound effects ${audioSettings.sound ? 'off' : 'on'}`);
    musicButton.title = `Music ${audioSettings.music ? 'on' : 'off'}`;
    soundButton.title = `Sound ${audioSettings.sound ? 'on' : 'off'}`;
    MUSIC_KEYS.forEach(key => {
      const music = game.sound.get(key);
      if (music) music.setVolume(audioSettings.music ? 0.25 : 0);
    });
    if (!audioSettings.sound) {
      game.sound.sounds.forEach(sound => {
        if (!MUSIC_KEYS.includes(sound.key) && sound.isPlaying) sound.stop();
      });
    }
  };
  musicButton.addEventListener('click', () => setAudioEnabled('music', !audioSettings.music));
  soundButton.addEventListener('click', () => setAudioEnabled('sound', !audioSettings.sound));
  const unsubscribe = onAudioSettingsChange(sync);
  window.addEventListener('pagehide', unsubscribe, { once: true });
  sync();
}
