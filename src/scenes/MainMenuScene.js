import { button, label } from '../ui.js';

import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { prepareCharacterSkin } from '../characterSkin.js';
import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';
import { addLogoJungle } from '../logoJungle.js';
import { addMoatWater, createLongboat } from '../longboat.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  preload() {
    if (!this.textures.exists('menu-background')) {
      this.load.image('menu-background', 'assets/title-temple-sunset.png');
    }
    if (!this.textures.exists('game-logo')) {
      this.load.image('game-logo', 'assets/game-logo.png');
    }
    if (!this.textures.exists('character-skin-source')) {
      this.load.image('character-skin-source', 'assets/character-khmer.png');
    }
  }

  create() {
    fadeSceneIn(this);
    this.journeyStarted = false;
    prepareCharacterSkin(this);
    this.cameras.main.setBackgroundColor('#3a2822');
    this.drawAngkor();
    addLogoJungle(this, 'menu');
    const decor = this.add.graphics();
    decor.lineStyle(1, 0xd79a48, 0.8).strokeRoundedRect(17, 15, 766, 420, 18);
    for (const y of [19, 431]) {
      decor.lineStyle(1, 0xd79a48, 0.8).lineBetween(35, y, 765, y);
      for (let x = 47; x < 760; x += 28) {
        decor.fillStyle(0xe2bd7b, 0.78);
        decor.fillTriangle(x, y - 3, x + 4, y, x, y + 3);
        decor.fillTriangle(x, y - 3, x - 4, y, x, y + 3);
      }
    }

    label(this, 155, 48, 'THE LITTLE ARCADE  /  CAMBODIA', 10, '#f0bd68');
    const signedInAs = sessionStorage.getItem('tos-travel-local-session');
    if (signedInAs) {
      const signOut = this.add.text(765, 48, `${signedInAs.toUpperCase()}  ·  LOG OUT`, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
        fontStyle: 'bold', color: '#f0d6a5', letterSpacing: 1
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      signOut.on('pointerover', () => signOut.setColor('#ffcf70'));
      signOut.on('pointerout', () => signOut.setColor('#f0d6a5'));
      signOut.on('pointerdown', () => {
        sessionStorage.removeItem('tos-travel-local-session');
        fadeToScene(this, 'IntroScene');
      });
    }
    this.add.image(206, 137, 'game-logo').setDisplaySize(300, 130);
    this.add.text(69, 220, 'A little courage. A journey across Cambodia.\nExplore 24 provinces, the capital, and hidden treasures.', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px',
      color: '#f5f4f0', lineSpacing: 6, wordWrap: { width: 277 }
    });
    const start = () => this.beginJourney();
    button(this, 207, 315, 274, 'BEGIN JOURNEY  >', start, true);
    const choose = button(this, 207, 365, 274, 'CHOOSE A STAGE', () => fadeToScene(this, 'LevelSelectScene'));
    const bg = choose.list[0];
    bg.clear().fillStyle(0x314033).fillRoundedRect(-137, -22, 274, 44, 12)
      .lineStyle(1, 0x8a7948).strokeRoundedRect(-137, -22, 274, 44, 12);
    label(this, 205, 407, `${TOTAL_LEVELS} STAGES  ·  ARROWS / WASD MOVE  ·  SPACE JUMP`, 9, '#ddc79f');
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ENTER', start);
      this.input.keyboard.once('keydown-SPACE', start);
    }
  }

  drawPlaqueFlowers(graphics) {
    graphics.lineStyle(1, 0x806545, 0.7);
    for (const side of [-1, 1]) {
      const cx = 209 + side * 158;
      const cy = 91;
      graphics.lineBetween(cx, cy, cx - side * 11, cy + 11);
      graphics.lineBetween(cx - side * 11, cy + 11, cx, cy + 22);
      graphics.fillStyle(0xd0ae73, 0.9);
      graphics.fillTriangle(cx, cy - 5, cx + 4, cy, cx, cy + 5);
      graphics.fillTriangle(cx, cy - 5, cx - 4, cy, cx, cy + 5);
    }
  }

  beginJourney() {
    if (this.journeyStarted) return;
    if (!sessionStorage.getItem('tos-travel-local-session')) {
      fadeToScene(this, 'LoginScene');
      return;
    }
    this.journeyStarted = true;
    this.arrivalTweens?.forEach(tween => tween.stop());
    const data = { level: 1, score: 0, coins: 0, lives: 3 };
    this.tweens.add({
      targets: this.menuBoat,
      x: 850,
      duration: 1250,
      ease: 'Cubic.easeIn',
      onComplete: () => fadeToScene(this, 'GameScene', data)
    });
  }

  drawAngkor() {
    this.add.image(400, 225, 'menu-background').setDisplaySize(800, 450);
    addMoatWater(this);

    if (!this.anims.exists('menu-player-walk')) {
      this.anims.create({
        key: 'menu-player-walk',
        frames: this.anims.generateFrameNumbers('player-character', { frames: [5, 6, 7, 8, 9] }),
        frameRate: 11,
        repeat: -1
      });
    }
    if (!this.anims.exists('menu-player-idle')) {
      this.anims.create({
        key: 'menu-player-idle',
        frames: this.anims.generateFrameNumbers('player-character', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 5,
        repeat: -1
      });
    }

    const boat = createLongboat(this, -190, 421, 0.82);
    this.menuBoat = boat;
    boat.rider.play('menu-player-walk');
    this.arrivalTweens = [
      this.tweens.add({ targets: boat, x: 520, duration: 3600,
        ease: 'Sine.easeInOut', onComplete: () => boat.rider.play('menu-player-idle') }),
      this.tweens.add({ targets: boat, y: 419.5, duration: 1500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    ];

    for (let i = 0; i < 12; i++) {
      const x = 390 + (i * 61) % 390;
      const y = 190 + (i * 37) % 178;
      const mote = this.add.circle(x, y, i % 3 ? 1.5 : 2, i % 2 ? 0xffdc91 : 0xf4b775, 0.62);
      this.tweens.add({ targets: mote, y: y - 7, alpha: 0.14,
        duration: 1300 + (i % 4) * 350, yoyo: true, repeat: -1, delay: i * 90 });
    }
  }
}
