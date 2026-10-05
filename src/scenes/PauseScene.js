import { label } from '../ui.js';
import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { audioSettings, onAudioSettingsChange, setAudioEnabled } from '../audioSettings.js';

function drawRomdoul(graphics, x, y, radius, color, alpha = 1) {
  const center = { x, y };
  const petals = [-90, 30, 150];
  graphics.fillStyle(color, alpha);
  for (const degrees of petals) {
    const angle = degrees * Math.PI / 180;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const tip = { x: x + ux * radius, y: y + uy * radius };
    const shoulder = { x: x + ux * radius * 0.56, y: y + uy * radius * 0.56 };
    graphics.fillPoints([
      center,
      { x: shoulder.x + px * radius * 0.28, y: shoulder.y + py * radius * 0.28 },
      tip,
      { x: shoulder.x - px * radius * 0.28, y: shoulder.y - py * radius * 0.28 }
    ], true);
  }
  graphics.fillStyle(color === 0x633f32 ? 0xf7dca3 : 0xf1cf84, alpha);
  graphics.fillCircle(center.x, center.y, radius * 0.15);
}

function actionButton(scene, x, y, width, height, title, action, primary = false) {
  const container = scene.add.container(x, y);
  const art = scene.add.graphics();
  const left = -width / 2;
  const top = -height / 2;
  const base = primary ? 0xe7c891 : 0x203957;
  const edge = primary ? 0xb48a53 : 0x547395;
  const flower = primary ? 0x80563b : 0xd4b574;
  art.fillStyle(0x030914, 0.5).fillRoundedRect(left, top + 4, width, height, 7);
  art.fillStyle(base).fillRoundedRect(left, top, width, height, 7);
  art.lineStyle(1, edge, 1).strokeRoundedRect(left, top, width, height, 7);
  art.lineStyle(1, primary ? 0xf4d9a4 : 0x304968, 0.9)
    .lineBetween(left + 28, top + 5, -42, top + 5)
    .lineBetween(42, top + 5, -left - 28, top + 5);
  for (const side of [-1, 1]) {
    drawRomdoul(art, side * (width / 2 - 15), 0, 7.3, flower, 1);
  }
  const caption = scene.add.text(0, 0, title, {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: primary ? '16px' : '15px',
    fontStyle: 'bold',
    color: primary ? '#172337' : '#d5dfeb'
  }).setOrigin(0.5);
  container.add([art, caption]);
  container.setSize(width, height).setInteractive({ useHandCursor: true });
  container.on('pointerover', () => container.setScale(1.025));
  container.on('pointerout', () => container.setScale(1));
  container.on('pointerdown', action);
  return { container, caption };
}

function simpleIconButton(scene, x, y, icon, action) {
  const container = scene.add.container(x, y);
  const art = scene.add.graphics();
  art.fillStyle(0x09172a, 0.38).fillRoundedRect(-21, -21, 42, 42, 9);
  art.fillStyle(0x1b304a, 1).fillRoundedRect(-22, -23, 44, 42, 9);
  art.lineStyle(1, 0x49617e, 0.9).strokeRoundedRect(-22, -23, 44, 42, 9);
  const caption = scene.add.text(0, -2, icon, {
    fontFamily: 'Arial, sans-serif', fontSize: '21px', color: '#f0d294'
  }).setOrigin(0.5);
  container.add([art, caption]);
  container.setSize(44, 44).setInteractive({ useHandCursor: true });
  container.on('pointerover', () => container.setScale(1.06));
  container.on('pointerout', () => container.setScale(1));
  container.on('pointerdown', action);
  return { container, caption };
}

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create({ resumeMusic = false } = {}) {
    this.add.rectangle(400, 225, 800, 450, 0x060e1c, 0.8).setInteractive();
    const game = this.scene.get('GameScene');
    const frame = this.add.graphics();
    frame.fillStyle(0x020814, 0.42).fillRoundedRect(207, 29, 386, 397, 18);
    frame.fillStyle(0x12243c, 0.98).fillRoundedRect(210, 25, 380, 397, 16);
    frame.lineStyle(1, 0x45617e, 0.9).strokeRoundedRect(210, 25, 380, 397, 16);
    frame.lineStyle(1, 0x2b4667, 0.8).strokeRoundedRect(216, 31, 368, 385, 12);

    // A bold stepped pediment recalls Khmer prasat roofs and temple lintels.
    const pediment = this.add.graphics();
    pediment.fillStyle(0x7d613e, 0.18);
    pediment.fillPoints([
      { x: 400, y: 29 }, { x: 414, y: 40 }, { x: 464, y: 40 },
      { x: 478, y: 48 }, { x: 516, y: 48 }, { x: 531, y: 57 },
      { x: 563, y: 57 }, { x: 572, y: 66 }, { x: 228, y: 66 },
      { x: 237, y: 57 }, { x: 269, y: 57 }, { x: 284, y: 48 },
      { x: 322, y: 48 }, { x: 336, y: 40 }, { x: 386, y: 40 }
    ], true);
    pediment.lineStyle(2, 0xb99057, 0.96);
    pediment.strokePoints([
      { x: 226, y: 67 }, { x: 237, y: 55 }, { x: 270, y: 55 },
      { x: 284, y: 46 }, { x: 322, y: 46 }, { x: 337, y: 38 },
      { x: 385, y: 38 }, { x: 400, y: 27 }, { x: 415, y: 38 },
      { x: 463, y: 38 }, { x: 478, y: 46 }, { x: 516, y: 46 },
      { x: 530, y: 55 }, { x: 563, y: 55 }, { x: 574, y: 67 }
    ], false);
    pediment.lineBetween(246, 73, 554, 73);
    pediment.lineBetween(260, 78, 540, 78);
    pediment.lineStyle(1.5, 0xe0bc79, 0.95);
    pediment.lineBetween(400, 27, 400, 40);
    pediment.fillStyle(0xe0bc79, 1);
    pediment.fillPoints([
      { x: 400, y: 23 }, { x: 404, y: 29 },
      { x: 400, y: 35 }, { x: 396, y: 29 }
    ], true);
    for (const side of [-1, 1]) {
      pediment.lineBetween(400 + side * 155, 67, 400 + side * 165, 61);
      pediment.lineBetween(400 + side * 165, 61, 400 + side * 158, 56);
      pediment.lineBetween(400 + side * 158, 56, 400 + side * 151, 60);
      pediment.fillPoints([
        { x: 400 + side * 165, y: 61 }, { x: 400 + side * 173, y: 56 },
        { x: 400 + side * 169, y: 66 }
      ], true);
    }
    this.add.text(400, 58, 'GAME PAUSED', {
      fontFamily: 'Georgia, Trebuchet MS, sans-serif', fontSize: '28px',
      color: '#f0c978', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5);
    this.add.text(400, 91, `LEVEL ${game.currentLevel} / ${TOTAL_LEVELS}`, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px',
      color: '#b5c5d7', letterSpacing: 1
    }).setOrigin(0.5);

    let resumed = false;
    const resume = () => {
      if (resumed) return;
      resumed = true;
      game.input.keyboard?.resetKeys();
      if (resumeMusic) this.sound.get(game.musicKey)?.resume();
      this.scene.resume('GameScene');
      this.scene.stop();
    };
    const leave = (destination, data) => {
      if (resumed) return;
      resumed = true;
      game.input.keyboard?.resetKeys();
      this.sound.stopByKey(game.musicKey);
      this.scene.stop('GameScene');
      this.scene.start(destination, data);
    };

    actionButton(this, 400, 145, 280, 44, 'RESUME  >', resume, true);
    actionButton(this, 400, 199, 280, 44, 'Restart Level', () => leave('GameScene', {
      level: game.currentLevel, score: game.levelStartScore,
      coins: game.levelStartCoins, lives: 3
    }));
    actionButton(this, 400, 253, 280, 44, 'Level Select', () => leave('LevelSelectScene'));
    actionButton(this, 400, 307, 280, 44, 'Back to Home', () => leave('MainMenuScene'));

    const musicToggle = simpleIconButton(this, 370, 364, audioSettings.music ? '\u266b' : '\u266a', () => setAudioEnabled('music', !audioSettings.music));
    const soundToggle = simpleIconButton(this, 430, 364, audioSettings.sound ? '\u{1f50a}\ufe0e' : '\u{1f507}\ufe0e', () => setAudioEnabled('sound', !audioSettings.sound));
    const syncAudioButtons = () => {
      musicToggle.caption.setText(audioSettings.music ? '\u266b' : '\u266a');
      soundToggle.caption.setText(audioSettings.sound ? '\u{1f50a}\ufe0e' : '\u{1f507}\ufe0e');
    };
    const unsubscribeAudio = onAudioSettingsChange(syncAudioButtons);
    this.events.once('shutdown', unsubscribeAudio);
    label(this, 400, 402, 'ESC to resume', 11, '#a4b6cb');

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
