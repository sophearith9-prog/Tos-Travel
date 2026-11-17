import { audioSettings, musicVolume, applyMusicVolume } from './audioSettings.js';

const MUSIC_KEY = 'intro-menu-music';

export function ensureIntroMenuMusic(scene) {
  const manager = scene.game.sound;
  let music = manager.get(MUSIC_KEY);
  if (!music) music = manager.add(MUSIC_KEY, { loop: true, volume: 0 });
  music.setLoop(true);
  applyMusicVolume(music);
  if (!music.isPlaying) {
    music.play();
    console.info(`[music] menu: ${MUSIC_KEY} volume=${musicVolume().toFixed(2)}`
      + ` (setting ${Math.round(audioSettings.musicVolume * 100)}%, audio ${manager.locked ? 'waiting for first tap/click' : 'unlocked'})`);
  }
  return music;
}

export function stopIntroMenuMusic(scene) {
  scene.game.sound.stopByKey(MUSIC_KEY);
}
