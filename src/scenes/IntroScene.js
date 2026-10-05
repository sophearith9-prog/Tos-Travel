export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
    this.finished = false;
  }

  create() {
    this.finished = false;
    this.cameras.main.setBackgroundColor('#111b2a');
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x111b2a, 0x111b2a, 0x492b3c, 0x492b3c, 1);
    sky.fillRect(0, 0, 800, 450);

    for (let i = 0; i < 34; i++) {
      const star = this.add.circle((i * 137 + 31) % 800, (i * 67 + 19) % 215,
        i % 5 === 0 ? 1.8 : 1, 0xffe7b5, 0.15 + (i % 4) * 0.12);
      this.tweens.add({ targets: star, alpha: 0.15, duration: 650 + (i % 5) * 250,
        yoyo: true, repeat: -1, delay: i * 23 });
    }

    const sun = this.add.circle(400, 250, 64, 0xffbd69, 0.94).setAlpha(0);
    this.tweens.add({ targets: sun, alpha: 0.94, y: 208, duration: 1800, ease: 'Sine.easeOut' });
    const glow = this.add.circle(400, 250, 92, 0xf27f62, 0.14).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: 0.14, y: 208, duration: 1800, ease: 'Sine.easeOut' });

    const temple = this.add.graphics().setAlpha(0);
    temple.fillStyle(0x211f2c, 1);
    temple.fillRect(0, 303, 800, 147);
    temple.fillPoints([
      { x: 204, y: 308 }, { x: 220, y: 292 }, { x: 238, y: 308 },
      { x: 242, y: 279 }, { x: 254, y: 261 }, { x: 267, y: 279 },
      { x: 270, y: 308 }, { x: 285, y: 295 }, { x: 300, y: 308 },
      { x: 316, y: 278 }, { x: 335, y: 260 }, { x: 354, y: 278 },
      { x: 359, y: 308 }, { x: 376, y: 288 }, { x: 400, y: 265 },
      { x: 424, y: 288 }, { x: 441, y: 308 }, { x: 446, y: 278 },
      { x: 465, y: 260 }, { x: 484, y: 278 }, { x: 489, y: 308 },
      { x: 505, y: 295 }, { x: 520, y: 308 }, { x: 533, y: 279 },
      { x: 546, y: 261 }, { x: 559, y: 279 }, { x: 563, y: 308 },
      { x: 580, y: 292 }, { x: 596, y: 308 }
    ], true);
    temple.fillStyle(0x47333a, 1).fillRect(170, 307, 460, 12);
    temple.fillStyle(0x151e28, 1).fillRect(0, 320, 800, 130);
    this.tweens.add({ targets: temple, alpha: 1, duration: 1300, delay: 650,
      ease: 'Sine.easeOut' });

    const water = this.add.graphics();
    water.fillStyle(0x152c38, 0.9).fillRect(0, 365, 800, 85);
    for (let i = 0; i < 22; i++) {
      const x = (i * 79 + 13) % 800;
      const line = this.add.rectangle(x, 380 + (i * 19) % 60, 12 + (i % 4) * 8, 2,
        i % 2 ? 0xe39c63 : 0xffd47b, 0.5);
      this.tweens.add({ targets: line, x: x + 14, alpha: 0.08, duration: 900 + (i % 5) * 180,
        yoyo: true, repeat: -1, delay: i * 41 });
    }

    const eyebrow = this.add.text(400, 112, 'A LITTLE ARCADE PRESENTS', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px',
      fontStyle: 'bold', color: '#f0cf98', letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);
    const title = this.add.text(400, 163, 'ANGKOR ADVENTURE', {
      fontFamily: 'Georgia, serif', fontSize: '39px', fontStyle: 'bold',
      color: '#fff0ce', stroke: '#442b31', strokeThickness: 7,
      letterSpacing: 2, shadow: { offsetX: 0, offsetY: 4, color: '#17151f', blur: 10, fill: true }
    }).setOrigin(0.5).setAlpha(0).setScale(0.92);
    const subtitle = this.add.text(400, 220, 'A JOURNEY THROUGH CAMBODIA', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px',
      fontStyle: 'bold', color: '#f5cb83', letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: eyebrow, alpha: 1, y: 104, duration: 650, delay: 250 });
    this.tweens.add({ targets: title, alpha: 1, scale: 1, y: 155, duration: 900,
      delay: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 650, delay: 1050 });

    const credit = this.add.text(400, 386, 'DEVELOPED BY CHIEM SOPHEARITH', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#f0cf98', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: credit, alpha: 1, duration: 700, delay: 1400 });

    const hint = this.add.text(400, 412, 'TAP OR PRESS ANY KEY TO CONTINUE', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px',
      fontStyle: 'bold', color: '#e9d5ad', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.85, duration: 500, delay: 1800,
      yoyo: true, repeat: -1 });

    this.input.once('pointerdown', this.finishIntro, this);
    this.input.keyboard?.once('keydown', this.finishIntro, this);
    this.time.delayedCall(5200, this.finishIntro, [], this);
  }

  finishIntro() {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(320, 10, 13, 20);
    this.time.delayedCall(320, () => this.scene.start('MainMenuScene'));
  }
}
