import { backdrop, button, label, panel, playSound } from '../ui.js';
export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
    this.failedLevel = data.level || 1;
  }
  preload() {
    this.load.audio('lose', 'assets/audio/lose.wav');
  }
  create() {
    this.sound.stopByKey('bgm');
    playSound(this, 'lose', { volume: 0.55 });
    this.events.once('shutdown', () => this.sound.stopByKey('lose'));
    backdrop(this);
    panel(this, 135, 38, 530, 374);
    label(this, 400, 79, 'TAKE A BREATHER', 12, '#ef9d90');
    label(this, 400, 132, 'One more try?', 44, '#f4f1e8');
    label(this, 400, 177, 'Level ' + this.failedLevel + ' is waiting for your comeback.', 17, '#a5b6cd');
    panel(this, 179, 212, 210, 66, 0x0c182b);
    panel(this, 411, 212, 210, 66, 0x0c182b);
    label(this, 284, 230, 'SCORE', 10, '#83b6c5');
    label(this, 284, 256, String(this.finalScore), 24, '#86d9ce');
    label(this, 516, 230, 'COINS', 10, '#83b6c5');
    label(this, 516, 256, String(this.finalCoins), 24, '#ffcf70');
    const retry = () => this.scene.start('GameScene', {
      level: this.failedLevel, score: this.finalScore, coins: this.finalCoins, lives: 3
    });
    button(this, 284, 325, 210, 'TRY AGAIN  >', retry, true);
    button(this, 516, 325, 210, 'Choose a level', () => this.scene.start('LevelSelectScene'));
    label(this, 400, 383, 'ENTER or SPACE to get back out there', 12, '#93a9c1');
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ENTER', retry);
      this.input.keyboard.once('keydown-SPACE', retry);
    }
  }
}
