import { backdrop, button, label, playSound } from '../ui.js';
import { prepareCharacterSkin } from '../characterSkin.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
    this.failedLevel = data.level || 1;
  }

  preload() {
    if (!this.cache.audio.exists('lose')) this.load.audio('lose', 'assets/audio/lose.wav');
    if (!this.textures.exists('character-skin-source')) {
      this.load.image('character-skin-source', 'assets/character-khmer.png');
    }
  }

  create() {
    prepareCharacterSkin(this);
    this.sound.stopByKey('bgm-level-2');
    this.sound.stopByKey('bgm-default');
    this.time.delayedCall(220, () => playSound(this, 'lose', { volume: 0.55 }));
    this.events.once('shutdown', () => this.sound.stopByKey('lose'));
    backdrop(this);

    const shade = this.add.rectangle(400, 225, 800, 450, 0x120e1c, 0.48).setAlpha(0);
    this.tweens.add({ targets: shade, alpha: 1, duration: 450 });
    this.drawTempleAndPetals();

    const card = this.add.graphics().setAlpha(0).setY(6);
    card.fillStyle(0x080f20, 0.6).fillRoundedRect(82, 29, 640, 398, 22);
    card.fillStyle(0x14243b, 0.98).fillRoundedRect(80, 25, 640, 398, 20);
    card.lineStyle(2, 0xb58b56, 0.94).strokeRoundedRect(80, 25, 640, 398, 20);
    card.lineStyle(1, 0x425774, 0.9).strokeRoundedRect(87, 32, 626, 384, 15);
    this.tweens.add({ targets: card, alpha: 1, y: 0, duration: 560, ease: 'Back.Out' });

    const topTrim = this.add.graphics().setAlpha(0);
    topTrim.lineStyle(1, 0x9d7749, 0.8).lineBetween(120, 52, 680, 52);
    for (const x of [132, 668]) {
      topTrim.fillStyle(0xd8b574, 0.95);
      topTrim.fillTriangle(x, 47, x + 5, 52, x, 57);
      topTrim.fillTriangle(x, 47, x - 5, 52, x, 57);
    }
    this.tweens.add({ targets: topTrim, alpha: 1, duration: 360, delay: 160 });

    const eyebrow = label(this, 400, 72, `LEVEL ${this.failedLevel}  /  28`, 11, '#d5bd91').setAlpha(0);
    const title = this.add.text(400, 107, 'GAME OVER', {
      fontFamily: 'Georgia, Trebuchet MS, serif', fontSize: '39px',
      fontStyle: 'bold', color: '#f3ca79', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setScale(0.88);
    const message = label(this, 400, 146, 'The journey is not over. Rise and try again.', 15, '#c3d0dc').setAlpha(0);
    [eyebrow, title, message].forEach((item, i) => this.tweens.add({
      targets: item, alpha: 1, scale: 1, duration: 380, delay: 180 + i * 90, ease: 'Sine.Out'
    }));

    // Give the familiar Khmer-outfit hero a little fall, then a breathing idle pose.
    if (!this.anims.exists('gameover-crouch')) {
      this.anims.create({
        key: 'gameover-crouch',
        frames: this.anims.generateFrameNumbers('player-character', { frames: [15, 16] }),
        frameRate: 2.5, repeat: -1
      });
    }
    const halo = this.add.circle(400, 204, 37, 0xf1bd65, 0.12).setAlpha(0);
    this.tweens.add({ targets: halo, alpha: 0.34, scale: 1.18, duration: 720, yoyo: true, repeat: -1, delay: 360 });
    const hero = this.add.sprite(400, 178, 'player-character', 15).setOrigin(0.5, 1)
      .setScale(0.56).setAlpha(0).setDepth(2);
    this.tweens.add({ targets: hero, y: 211, alpha: 1, angle: -4, duration: 560, ease: 'Bounce.Out', delay: 240,
      onComplete: () => { hero.setAngle(0); hero.play('gameover-crouch'); }
    });

    const stats = this.add.graphics().setAlpha(0);
    stats.fillStyle(0x0c182b, 0.92).fillRoundedRect(164, 247, 218, 58, 10);
    stats.fillStyle(0x0c182b, 0.92).fillRoundedRect(418, 247, 218, 58, 10);
    stats.lineStyle(1, 0x3a506b, 0.9).strokeRoundedRect(164, 247, 218, 58, 10);
    stats.strokeRoundedRect(418, 247, 218, 58, 10);
    this.tweens.add({ targets: stats, alpha: 1, y: -2, duration: 420, delay: 420, ease: 'Back.Out' });
    const scoreLabel = label(this, 273, 261, 'SCORE', 10, '#91a9bd').setAlpha(0);
    const scoreValue = label(this, 273, 286, String(this.finalScore), 23, '#f0d393').setAlpha(0);
    const coinLabel = label(this, 527, 261, 'COINS', 10, '#91a9bd').setAlpha(0);
    const coinValue = label(this, 527, 286, String(this.finalCoins), 23, '#f0c674').setAlpha(0);
    [scoreLabel, scoreValue, coinLabel, coinValue].forEach(item => this.tweens.add({
      targets: item, alpha: 1, duration: 300, delay: 470
    }));

    const retry = () => this.scene.start('GameScene', {
      level: this.failedLevel, score: this.finalScore, coins: this.finalCoins, lives: 3
    });
    const actions = [
      button(this, 211, 351, 172, 'TRY AGAIN  >', retry, true),
      button(this, 400, 351, 172, 'LEVEL SELECT', () => this.scene.start('LevelSelectScene')),
      button(this, 589, 351, 172, 'HOME', () => this.scene.start('MainMenuScene'))
    ];
    actions.forEach((item, i) => {
      item.setAlpha(0).setY(365);
      this.tweens.add({ targets: item, alpha: 1, y: 351, duration: 360, delay: 580 + i * 90, ease: 'Back.Out' });
    });
    const hint = label(this, 400, 397, 'ENTER / SPACE  ·  TRY AGAIN', 10, '#a5b7c9').setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 300, delay: 820 });

    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ENTER', retry);
      this.input.keyboard.once('keydown-SPACE', retry);
    }
  }

  drawTempleAndPetals() {
    const temple = this.add.graphics().setAlpha(0.2);
    temple.fillStyle(0x0a1322, 0.9);
    temple.fillRect(0, 407, 800, 43);
    const tower = (x, base, width, height) => {
      temple.fillRect(x - width / 2, base - 17, width, 17);
      for (let tier = 0; tier < 6; tier++) {
        const tierWidth = width - tier * (width - 5) / 6;
        const tierHeight = (height - 17) / 6;
        temple.fillRect(x - tierWidth / 2, base - 17 - (tier + 1) * tierHeight, tierWidth, tierHeight + 1);
      }
      temple.fillTriangle(x, base - height - 9, x - 3, base - height + 2, x + 3, base - height + 2);
    };
    temple.fillStyle(0x0a1322, 0.95).fillRect(265, 389, 270, 25);
    tower(307, 395, 25, 45);
    tower(354, 395, 30, 60);
    tower(400, 395, 40, 78);
    tower(446, 395, 30, 60);
    tower(493, 395, 25, 45);
    for (let i = 0; i < 24; i++) {
      const petal = this.add.ellipse(Phaser.Math.Between(12, 788), Phaser.Math.Between(-100, -12),
        Phaser.Math.Between(4, 7), Phaser.Math.Between(7, 11), i % 3 ? 0xd88c70 : 0xe2bd78, 0.72)
        .setDepth(-1);
      this.tweens.add({
        targets: petal, y: 475, x: petal.x + Phaser.Math.Between(-28, 28), angle: Phaser.Math.Between(150, 420),
        duration: Phaser.Math.Between(4200, 7600), delay: i * 100, repeat: -1
      });
    }
  }
}
