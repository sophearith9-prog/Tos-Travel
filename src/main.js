import { installFullscreen } from './fullscreen.js';
import { IntroScene } from './scenes/IntroScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { installMobileControls } from './mobileControls.js';

// Remove local credentials created by the retired sign-in flow.
localStorage.removeItem('tos-travel-local-accounts');
sessionStorage.removeItem('tos-travel-local-session');

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 650 },
      debug: false
    }
  },
  render: {
    pixelArt: false,
    antialias: true
  },
  dom: { createContainer: true },
  scene: [IntroScene, MainMenuScene, LevelSelectScene, GameScene, GameOverScene, VictoryScene, PauseScene]
};

export const game = new Phaser.Game(config);
if (window.parent !== window && window.parent.location.pathname === '/scripts/trailer-studio.html') {
  window.parent.__trailerGame = game;
}
installMobileControls(game);

installFullscreen(game);
