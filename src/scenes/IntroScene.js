import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';
import { prepareCharacterSkin } from '../characterSkin.js';
import { createLongboat } from '../longboat.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
    this.finished = false;
  }

  preload() {
    if (!this.textures.exists('intro-background')) {
      this.load.image('intro-background', 'assets/intro-temple-dusk.png');
    }
    if (!this.textures.exists('game-logo')) {
      this.load.image('game-logo', 'assets/game-logo.png');
    }
    if (!this.textures.exists('character-skin-source')) {
      this.load.image('character-skin-source', 'assets/character-khmer.png');
    }
  }

  create() {
    this.finished = false;
    fadeSceneIn(this);
    prepareCharacterSkin(this);
    this.cameras.main.setBackgroundColor('#4c2924');
    this.add.image(400, 225, 'intro-background').setDisplaySize(800, 450);

    for (let i = 0; i < 14; i++) {
      const mote = this.add.circle((i * 137 + 31) % 800, 180 + (i * 67) % 220,
        i % 5 === 0 ? 1.8 : 1, 0xffd175, 0.2 + (i % 4) * 0.1);
      this.tweens.add({ targets: mote, alpha: 0.12, duration: 900 + (i % 5) * 250,
        yoyo: true, repeat: -1, delay: i * 23 });
    }

    if (!this.anims.exists('intro-traveler-idle')) {
      this.anims.create({
        key: 'intro-traveler-idle',
        frames: this.anims.generateFrameNumbers('player-character', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 5,
        repeat: -1
      });
    }
    const boat = createLongboat(this, -190, 421, 0.82);
    boat.rider.play('intro-traveler-idle');
    this.tweens.add({ targets: boat, x: 520, duration: 6500, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: boat, y: 419.5, duration: 1500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const eyebrow = this.add.text(400, 36, 'A LITTLE ARCADE PRESENTS', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px',
      fontStyle: 'bold', color: '#ffd06f', letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);
    const titleScale = 430 / this.textures.get('game-logo').getSourceImage().width;
    const title = this.add.image(400, 166, 'game-logo')
      .setScale(titleScale * 0.92).setAlpha(0);
    const subtitle = this.add.text(400, 272, 'A JOURNEY THROUGH CAMBODIA', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px',
      fontStyle: 'bold', color: '#ffd06f', letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: eyebrow, alpha: 1, y: 38, duration: 650, delay: 250 });
    this.tweens.add({ targets: title, alpha: 1, scale: titleScale, y: 159, duration: 900,
      delay: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 650, delay: 1050 });

    const credit = this.add.text(400, 386, 'DEVELOPED BY CHIEM SOPHEARITH', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#ffd06f', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: credit, alpha: 1, duration: 700, delay: 1400 });

    const hint = this.add.text(400, 412, 'TAP OR PRESS ANY KEY TO CONTINUE', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px',
      fontStyle: 'bold', color: '#ffe2a0', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.85, duration: 500, delay: 1800,
      yoyo: true, repeat: -1 });

    this.input.once('pointerdown', this.finishIntro, this);
    this.input.keyboard?.once('keydown', this.finishIntro, this);
    this.time.delayedCall(7000, this.finishIntro, [], this);
  }

  finishIntro() {
    if (this.finished) return;
    this.finished = true;
    fadeToScene(this, 'LoginScene', undefined, { duration: 520 });
  }
}
