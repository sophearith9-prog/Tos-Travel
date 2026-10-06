import { button, label } from '../ui.js';

import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { prepareCharacterSkin } from '../characterSkin.js';
import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  preload() {
    if (!this.textures.exists('character-skin-source')) {
      this.load.image('character-skin-source', 'assets/character-khmer.png');
    }
  }

  create() {
    fadeSceneIn(this);
    this.journeyStarted = false;
    prepareCharacterSkin(this);
    this.cameras.main.setBackgroundColor('#211b20');
    this.drawAngkor();
    const decor = this.add.graphics();
    decor.lineStyle(1, 0xd1a968, 0.65).strokeRoundedRect(17, 15, 766, 420, 18);
    for (const y of [19, 431]) {
      decor.lineStyle(1, 0xd1a968, 0.65).lineBetween(35, y, 765, y);
      for (let x = 47; x < 760; x += 28) {
        decor.fillStyle(0xe2bd7b, 0.78);
        decor.fillTriangle(x, y - 3, x + 4, y, x, y + 3);
        decor.fillTriangle(x, y - 3, x - 4, y, x, y + 3);
      }
    }

    label(this, 155, 91, 'THE LITTLE ARCADE  /  CAMBODIA', 10, '#d8b77d');
    this.add.text(66, 105, 'នគរ', {
      fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Georgia, serif', fontSize: '40px',
      fontStyle: 'bold', color: '#fff0d1', letterSpacing: 1
    });
    this.add.text(68, 145, 'ADVENTURE', {
      fontFamily: 'Georgia, serif', fontSize: '27px',
      fontStyle: 'bold', color: '#f3c978', letterSpacing: 3
    });
    const divider = this.add.graphics();
    const dividerY = 195;
    divider.lineStyle(1, 0xb68a52, 0.85).lineBetween(68, dividerY, 345, dividerY);
    divider.fillStyle(0xe5c47e).fillPoints([
      { x: 206, y: dividerY - 5 }, { x: 211, y: dividerY },
      { x: 206, y: dividerY + 5 }, { x: 201, y: dividerY }
    ], true);
    this.add.text(69, 220, 'A little courage. A journey across Cambodia.\nExplore 24 provinces, the capital, and hidden treasures.', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px',
      color: '#d0c2aa', lineSpacing: 6, wordWrap: { width: 277 }
    });
    const start = () => this.beginJourney();
    button(this, 207, 315, 274, 'BEGIN JOURNEY  >', start, true);
    const choose = button(this, 207, 365, 274, 'CHOOSE A STAGE', () => fadeToScene(this, 'LevelSelectScene'));
    const bg = choose.list[0];
    bg.clear().fillStyle(0x1e3248).fillRoundedRect(-137, -22, 274, 44, 12)
      .lineStyle(1, 0x658091).strokeRoundedRect(-137, -22, 274, 44, 12);
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
    this.journeyStarted = true;
    this.arrivalTweens?.forEach(tween => tween.stop());
    const data = { level: 1, score: 0, coins: 0, lives: 3 };
    const rideOut = { duration: 1900, ease: 'Cubic.easeIn' };
    this.tweens.add({
      targets: this.menuBoat,
      x: 820,
      ...rideOut,
      onComplete: () => fadeToScene(this, 'GameScene', data)
    });
    this.tweens.add({ targets: this.menuHero, x: 1430, ...rideOut });
  }

  drawAngkor() {
    const g = this.add.graphics();
    const band = (y, h, color) => g.fillStyle(color).fillRect(0, y, 800, h);
    band(0, 82, 0x251e30);
    band(82, 58, 0x563143);
    band(140, 56, 0xa94f43);
    band(196, 45, 0x79423e);
    band(241, 55, 0x353b38);
    band(296, 49, 0x263b3c);
    band(345, 105, 0x172c39);

    // Late sun, cloud ribbons, and the distant Tonle Sap ridge.
    g.fillStyle(0xffd17e, 0.18).fillCircle(646, 160, 57);
    g.fillStyle(0xffd98b).fillCircle(646, 160, 39);
    g.fillStyle(0xf7b86a, 0.55);
    [[474, 118, 72], [583, 104, 46], [687, 127, 68]].forEach(([x, y, width]) =>
      g.fillRoundedRect(x, y, width, 3, 2));
    g.fillStyle(0x4a3c3c).fillPoints([
      { x: 386, y: 224 }, { x: 478, y: 196 }, { x: 540, y: 215 },
      { x: 618, y: 185 }, { x: 706, y: 214 }, { x: 800, y: 192 },
      { x: 800, y: 278 }, { x: 386, y: 278 }
    ], true);

    const rect = (x, y, w, h, color) => g.fillStyle(color).fillRect(x, y, w, h);
    const tower = (x, base, width, height, color, highlight) => {
      rect(x - width / 2 - 4, base - 6, width + 8, 6, highlight);
      rect(x - width / 2, base - 24, width, 20, color);
      for (let i = 0; i < 7; i++) {
        const w = width - i * (width - 5) / 7;
        const step = (height - 27) / 7;
        const y = base - 24 - (i + 1) * step;
        rect(x - w / 2, y, w, step + 2, color);
        rect(x - w / 2 - 2, y + step, w + 4, 2, highlight);
      }
      rect(x - 2, base - height - 6, 4, 10, highlight);
      rect(x - 1, base - height - 10, 2, 4, 0xffd98b);
    };

    // Reflected wall and five lotus towers of Angkor Wat.
    rect(425, 271, 375, 13, 0x705044);
    rect(420, 284, 380, 8, 0x493a36);
    tower(486, 271, 25, 68, 0x664738, 0xb77a4b);
    tower(550, 271, 27, 91, 0x684538, 0xc08950);
    tower(619, 271, 35, 123, 0x553a35, 0xe0a65b);
    tower(690, 271, 27, 91, 0x684538, 0xc08950);
    tower(752, 271, 25, 68, 0x664738, 0xb77a4b);
    rect(456, 263, 312, 18, 0x563d36);
    rect(449, 258, 326, 5, 0xb47b4a);
    for (let x = 466; x <= 760; x += 17) {
      rect(x, 264, 5, 16, x % 2 ? 0xa76f47 : 0x473833);
    }
    rect(608, 255, 23, 27, 0x302c30);

    // Palm silhouettes frame the temple like the Cambodian countryside.
    rect(752, 188, 6, 115, 0x26332e);
    for (const [dx, dy] of [[-33,-9],[-28,12],[-16,-24],[14,-25],[31,-8],[24,13]]) {
      g.lineStyle(5, 0x26332e).lineBetween(755, 191, 755 + dx, 191 + dy);
      g.lineStyle(3, 0x26332e).lineBetween(755 + dx, 191 + dy, 755 + dx * 1.12, 204 + dy);
    }
    rect(427, 292, 373, 12, 0x342f31);
    rect(425, 304, 375, 5, 0x9a6946);
    rect(416, 309, 384, 36, 0x2c3838);

    // Dark water with warm, slowly moving reflections.
    for (let i = 0; i < 9; i++) {
      const x = 480 + (i * 43) % 270;
      const y = 352 + i * 9;
      const reflection = this.add.rectangle(x, y, 20 + (i % 3) * 9, 2, i % 2 ? 0xb87653 : 0xe0ad69, 0.7);
      this.tweens.add({ targets: reflection, alpha: 0.12, x: x + 12, duration: 1100 + i * 90, yoyo: true, repeat: -1, delay: i * 100 });
    }

    // A Cambodian longboat with a lifted naga prow crosses the temple reflection.
    const boat = this.add.graphics();
    boat.fillStyle(0x170f19, 0.42).fillPoints([
      { x: 526, y: 359 }, { x: 688, y: 359 }, { x: 673, y: 370 },
      { x: 643, y: 376 }, { x: 592, y: 376 }, { x: 551, y: 369 }
    ], true);
    boat.fillStyle(0x813f37, 1).fillPoints([
      { x: 521, y: 351 }, { x: 534, y: 354 }, { x: 562, y: 359 },
      { x: 602, y: 363 }, { x: 647, y: 361 }, { x: 678, y: 354 },
      { x: 691, y: 347 }, { x: 683, y: 361 }, { x: 668, y: 370 },
      { x: 642, y: 375 }, { x: 593, y: 375 }, { x: 557, y: 369 },
      { x: 537, y: 362 }
    ], true);
    boat.lineStyle(2, 0xe3b66c, 0.98).strokePoints([
      { x: 521, y: 351 }, { x: 548, y: 357 }, { x: 586, y: 362 },
      { x: 630, y: 363 }, { x: 665, y: 357 }, { x: 691, y: 347 }
    ], false);
    boat.lineStyle(1, 0xb9784e, 0.95).strokePoints([
      { x: 542, y: 363 }, { x: 572, y: 368 }, { x: 613, y: 370 },
      { x: 652, y: 367 }, { x: 677, y: 360 }
    ], false);
    boat.fillStyle(0xe6bd77, 1);
    for (const x of [555, 575, 595, 615, 635, 655]) {
      boat.fillTriangle(x - 3, 364, x, 360, x + 3, 365);
    }
    // Raised carved ends and curled naga heads.
    boat.lineStyle(2, 0xf0cf8a, 1);
    boat.lineBetween(526, 352, 518, 344);
    boat.lineBetween(518, 344, 523, 338);
    boat.lineBetween(523, 338, 530, 342);
    boat.lineBetween(530, 342, 524, 345);
    boat.lineBetween(686, 350, 694, 342);
    boat.lineBetween(694, 342, 689, 336);
    boat.lineBetween(689, 336, 682, 340);
    boat.lineBetween(682, 340, 688, 343);
    boat.fillStyle(0xf1d99c, 1).fillCircle(523, 339, 1.5).fillCircle(689, 337, 1.5);
    boat.setX(-720);
    this.menuBoat = boat;
    this.tweens.add({ targets: boat, y: -1.5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

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
    const hero = this.add.sprite(-110, 361, 'player-character', 0)
      .setOrigin(0.5, 1).setScale(0.48).setDepth(0);
    this.menuHero = hero;
    const arrival = { duration: 3400, ease: 'Cubic.easeOut' };
    this.arrivalTweens = [
      this.tweens.add({ targets: boat, x: 0, ...arrival }),
      this.tweens.add({ targets: hero, x: 610, ...arrival })
    ];
    hero.play('menu-player-idle');
    // Keep the passenger seated while the boat glides into its final position.
    this.tweens.add({ targets: hero, y: 359.5, duration: 1500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 13; i++) {
      const x = 420 + (i * 61) % 365;
      const y = 113 + (i * 37) % 155;
      const mote = this.add.circle(x, y, i % 3 ? 1.5 : 2.2, i % 2 ? 0xffdc91 : 0xf4b775, 0.65);
      this.tweens.add({ targets: mote, y: y - 7, alpha: 0.15, duration: 1300 + (i % 4) * 350, yoyo: true, repeat: -1, delay: i * 90 });
    }
  }
}
