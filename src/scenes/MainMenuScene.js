import { button, label } from '../ui.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#211b20');
    const decor = this.add.graphics();
    decor.fillStyle(0x362127).fillCircle(790, 30, 290);
    decor.fillStyle(0x292a27).fillCircle(70, 440, 210);
    // Repeating woven diamonds and fine gold rails frame the menu.
    for (const y of [16, 434]) {
      decor.lineStyle(1, 0x8e6948, 0.65).lineBetween(28, y - 7, 772, y - 7);
      decor.lineBetween(28, y + 7, 772, y + 7);
      for (let x = 38; x < 774; x += 22) {
        decor.fillStyle(x % 44 < 22 ? 0x986344 : 0xb58b56, 0.7);
        decor.fillTriangle(x, y - 4, x - 4, y, x + 4, y);
        decor.fillTriangle(x, y + 4, x - 4, y, x + 4, y);
      }
    }
    label(this, 166, 53, 'THE LITTLE ARCADE / CAMBODIA', 11, '#d3ad78');
    label(this, 698, 53, '10 STAGES', 11, '#e6c58e');
    this.add.text(52, 100, 'Angkor\nAdventure', {
      fontFamily: 'Georgia, serif', fontSize: '49px',
      fontStyle: 'bold', color: '#fff0d1', lineSpacing: -5
    });
    this.add.text(55, 222, 'A little courage. A journey to Angkor.\nFind hidden treasures. Reach the temple.', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '15px',
      color: '#c8b399', lineSpacing: 7
    });
    const start = () => this.scene.start('GameScene', { level: 1, score: 0, coins: 0, lives: 3 });
    button(this, 148, 317, 190, 'BEGIN JOURNEY  >', start, true);
    const choose = button(this, 340, 317, 158, 'Pick a level', () => this.scene.start('LevelSelectScene'));
    const bg = choose.list[0];
    bg.clear().fillStyle(0x4c2b30).fillRoundedRect(-79, -22, 158, 44, 16)
      .lineStyle(1, 0x9a7250).strokeRoundedRect(-79, -22, 158, 44, 16);
    this.drawAngkor();
    label(this, 219, 380, 'ARROWS / WASD  move    SPACE  jump', 11, '#b6a58d');
    label(this, 400, 411, 'GOLDEN SKIES. ANCIENT TOWERS. A NEW ADVENTURE.', 9, '#b59061');
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ENTER', start);
      this.input.keyboard.once('keydown-SPACE', start);
    }
  }

  drawAngkor() {
    const g = this.add.graphics({ x: 445, y: 88 });
    g.fillStyle(0x8b573e).fillRoundedRect(-3, -3, 316, 292, 19);
    g.fillStyle(0xe2a968).fillRoundedRect(0, 0, 310, 286, 16);
    g.fillStyle(0xf6d891).fillCircle(196, 83, 44);
    g.fillStyle(0xf4c482, 0.7).fillRoundedRect(26, 50, 90, 5, 3);
    g.fillRoundedRect(218, 38, 60, 4, 2);
    g.fillStyle(0xb48058).fillRect(0, 157, 310, 40);
    const rect = (x, y, w, h, color) => g.fillStyle(color).fillRect(x, y, w, h);
    const tower = (x, base, width, height, color) => {
      rect(x - width / 2, base - 24, width, 24, color);
      for (let i = 0; i < 6; i++) {
        const w = width - i * (width - 5) / 6;
        const step = (height - 27) / 6;
        rect(x - w / 2, base - 24 - (i + 1) * step, w, step + 2, color);
        rect(x - w / 2 - 2, base - 24 - i * step, w + 4, 2, color);
      }
      rect(x - 2, base - height - 5, 4, 9, color);
    };
    tower(116, 176, 24, 88, 0x79513e);
    tower(218, 176, 24, 88, 0x79513e);
    rect(64, 167, 210, 35, 0x503d32);
    rect(60, 163, 218, 5, 0x654632);
    tower(80, 181, 25, 67, 0x503d32);
    tower(251, 181, 25, 67, 0x503d32);
    tower(167, 181, 37, 125, 0x46382e);
    for (let x = 72; x < 270; x += 13) rect(x, 176, 5, 21, 0xa1754b);
    rect(155, 176, 24, 27, 0x2a2c27);
    rect(56, 202, 224, 5, 0x806040);
    rect(49, 207, 238, 4, 0x503d32);
    // Water and reflected sunset below the temple causeway.
    g.fillStyle(0x435b50).fillRoundedRect(0, 211, 310, 75, { tl: 0, tr: 0, bl: 16, br: 16 });
    for (let i = 0; i < 7; i++) {
      rect(126 - i * 3, 219 + i * 8, 82 + i * 6, 2, i % 2 ? 0x809273 : 0xaaa77c);
    }
    // Sugar-palm silhouette on the bank.
    rect(32, 138, 5, 76, 0x303e30);
    for (const [dx, dy] of [[-26,-8],[-23,9],[-12,-19],[15,-18],[28,-5],[24,12]]) {
      g.lineStyle(5, 0x303e30).lineBetween(34, 139, 34 + dx, 139 + dy);
      g.lineStyle(3, 0x303e30).lineBetween(34 + dx, 139 + dy, 34 + dx * 1.1, 149 + dy);
    }
    label(this, 600, 365, 'A JOURNEY THROUGH CAMBODIA', 9, '#e6d4a3');
  }
}
