import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { backdrop, button, label, panel } from '../ui.js';
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }
  create() {
    backdrop(this);
    label(this, 400, 38, 'CHOOSE YOUR ADVENTURE', 11, '#83b6c5');
    label(this, 400, 77, 'A whole world to explore.', 32, '#f4f1e8');
    label(this, 400, 111, 'Start anywhere. Reach the flag. Reach the temple at Angkor Wat.', 14, '#a5b6cd');
    for (let i = 1; i <= 10; i++) {
      const x = 120 + ((i - 1) % 5) * 140;
      const y = 190 + Math.floor((i - 1) / 5) * 110;
      const group = this.add.container(x, y);
      const bg = panel(this, -62, -46, 124, 92, i === 10 ? 0x3a3040 : 0x182c43,
        i === 10 ? 0xd2a365 : 0x36536a);
      const number = label(this, 0, -18, String(i).padStart(2, '0'), 28, i === 10 ? '#ffcf70' : '#86d9ce');
      const title = label(this, 0, 18, LEVEL_CONFIGS[i].title, 11, '#d5e0ee');
      title.setStyle({ wordWrap: { width: 108 }, align: 'center' });
      group.add([bg, number, title]);
      group.setSize(124, 92).setInteractive({ useHandCursor: true });
      group.on('pointerover', () => group.setScale(1.05));
      group.on('pointerout', () => group.setScale(1));
      group.on('pointerdown', () => this.scene.start('GameScene', { level: i, score: 0, coins: 0, lives: 3 }));
    }
    const back = () => this.scene.start('MainMenuScene');
    button(this, 400, 394, 204, '<  Back to menu', back);
    if (this.input.keyboard) this.input.keyboard.once('keydown-ESC', back);
  }
}
