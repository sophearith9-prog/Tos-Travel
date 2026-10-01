import { panel, label, button } from '../ui.js';

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create({ resumeMusic = false } = {}) {
    this.add.rectangle(400, 225, 800, 450, 0x060e1c, 0.78).setInteractive();
    const game = this.scene.get('GameScene');
    panel(this, 210, 32, 380, 386);
    label(this, 400, 73, 'GAME PAUSED', 30, '#ffcf70');
    label(this, 400, 110, 'LEVEL ' + game.currentLevel + ' / 10', 13, '#a5b6cd');
    let resumed = false;
    const resume = () => {
      if (resumed) return;
      resumed = true;
      game.input.keyboard?.resetKeys();
      if (resumeMusic) this.sound.get('bgm')?.resume();
      this.scene.resume('GameScene');
      this.scene.stop();
    };
    const leave = (destination, data) => {
      if (resumed) return;
      resumed = true;
      game.input.keyboard?.resetKeys();
      this.sound.stopByKey('bgm');
      this.scene.stop('GameScene');
      this.scene.start(destination, data);
    };
    button(this, 400, 161, 280, 'RESUME  >', resume, true);
    button(this, 400, 219, 280, 'Restart Level', () => leave('GameScene', {
      level: game.currentLevel, score: game.levelStartScore,
      coins: game.levelStartCoins, lives: 3
    }));
    button(this, 400, 277, 280, 'Level Select', () => leave('LevelSelectScene'));
    button(this, 400, 335, 280, 'Back to Home', () => leave('MainMenuScene'));
    label(this, 400, 389, 'ESC to resume', 12, '#93a9c1');
    if (this.input.keyboard) {
      // Ignore the Escape event that opened the menu and held-key repeats.
      let ready = false;
      this.time.delayedCall(180, () => { ready = true; });
      const escape = event => { if (ready && !event.repeat) resume(); };
      this.input.keyboard.on('keydown-ESC', escape);
      this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', escape));
    }
  }
}
