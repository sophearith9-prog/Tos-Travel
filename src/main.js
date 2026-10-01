import { MainMenuScene } from './scenes/MainMenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { PauseScene } from './scenes/PauseScene.js';

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
    pixelArt: true,
    antialias: false
  },
  scene: [MainMenuScene, LevelSelectScene, GameScene, GameOverScene, VictoryScene, PauseScene]
};

export const game = new Phaser.Game(config);
