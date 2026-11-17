import { musicVolume } from './audioSettings.js';

const MUSIC_KEY = 'intro-menu-music';

export function ensureIntroMenuMusic(scene) {
  const manager = scene.game.sound;
  let music = manager.get(MUSIC_KEY);
  if (!music) music = manager.add(MUSIC_KEY, { loop: true, volume: 0 });
  music.setLoop(true);
  music.setVolume(musicVolume(0.3));
  if (!music.isPlaying) music.play();
  return music;
}

export function stopIntroMenuMusic(scene) {
  scene.game.sound.stopByKey(MUSIC_KEY);
}
