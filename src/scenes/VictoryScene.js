import { backdrop, button, playSound } from '../ui.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    backdrop(this);
    this.sound.stopByKey('bgm');
    playSound(this, 'win', { volume: 0.5 });

    // Confetti stays behind the winner card and is cleaned up with the scene.
    const colors = [0xffd166, 0x60a5fa, 0x4ade80, 0xf472b6];
    for (let i = 0; i < 48; i++) {
      const confetti = this.add.rectangle(
        Phaser.Math.Between(0, 800), Phaser.Math.Between(-450, 0),
        5, 9, colors[i % colors.length]
      );
      this.tweens.add({
        targets: confetti, y: 470, angle: 360,
        duration: Phaser.Math.Between(2500, 5000),
        delay: i * 35, repeat: -1
      });
    }

    const card = this.add.graphics();
    card.fillStyle(0x16213c, 0.97);
    card.fillRoundedRect(110, 22, 580, 404, 22);
    card.lineStyle(2, 0xffd166, 0.8);
    card.strokeRoundedRect(110, 22, 580, 404, 22);

    // Draw a trophy without requiring an extra image asset.
    const trophy = this.add.graphics();
    trophy.lineStyle(6, 0xffd166);
    trophy.strokeCircle(374, 64, 14);
    trophy.strokeCircle(426, 64, 14);
    trophy.fillStyle(0xffd166);
    trophy.fillRoundedRect(376, 42, 48, 48, 12);
    trophy.fillRect(396, 86, 8, 18);
    trophy.fillRoundedRect(380, 102, 40, 7, 3);
    trophy.fillStyle(0xfff0b3);
    trophy.fillRect(383, 49, 5, 23);

    const text = (x, y, label, size, color = '#ffffff') => this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: size + 'px',
      fontStyle: 'bold', color, align: 'center'
    }).setOrigin(0.5);

    text(400, 140, 'YOU WIN!', 42, '#ffd166');
    text(400, 180, 'Angkor Wat reached. Adventure complete!', 17, '#cbd5e1');

    const stats = this.add.graphics();
    stats.fillStyle(0x0b1228);
    stats.fillRoundedRect(155, 212, 235, 72, 10);
    stats.fillRoundedRect(410, 212, 235, 72, 10);
    text(272, 232, 'FINAL SCORE', 12, '#94a3b8');
    text(272, 260, String(this.finalScore), 26, '#4ade80');
    text(528, 232, 'COINS COLLECTED', 12, '#94a3b8');
    text(528, 260, String(this.finalCoins), 26, '#ffd166');

    const replay = () => this.scene.start('GameScene', {
      level: 1, score: 0, coins: 0, lives: 3
    });
    button(this, 275, 323, 210, 'PLAY AGAIN  >', replay, true);
    button(this, 525, 323, 210, 'Choose a level', () => this.scene.start('LevelSelectScene'));

    const menu = text(400, 371, 'BACK TO MAIN MENU', 14, '#cbd5e1');
    menu.setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('MainMenuScene'));
    text(400, 403, 'Press ENTER to play again', 12, '#94a3b8');
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ENTER', replay);
      this.input.keyboard.once('keydown-SPACE', replay);
    }
  }
}
