import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { backdrop, button, label, panel } from '../ui.js';
import { PROVINCE_ROUTE, TOTAL_LEVELS } from '../levels/provinceRoute.js';

const LIST_TOP = 148;
const LIST_BOTTOM = 378;
const ROW_HEIGHT = 39;

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }

  create() {
    backdrop(this);
    label(this, 400, 30, 'CAMBODIA / 24 PROVINCES + CAPITAL / 28 STAGES', 11, '#83b6c5');
    label(this, 400, 64, 'Choose your next destination.', 27, '#f4f1e8');
    this.destination = label(this, 400, 101, 'Levels 1–3: Angkor introduction. Levels 4–28: province journey.', 12, '#a5b6cd');

    panel(this, 20, 119, 300, 265, 0x14263c, 0x786346);
    this.drawRouteMap(1, TOTAL_LEVELS);

    panel(this, 332, 119, 451, 265, 0x101e31, 0x786346);
    label(this, 552, 132, 'ALL STAGES  ·  SCROLL TO EXPLORE', 10, '#d3ad78');

    const viewportHeight = LIST_BOTTOM - LIST_TOP;
    const contentHeight = TOTAL_LEVELS * ROW_HEIGHT;
    this.maxListScroll = Math.max(0, contentHeight - viewportHeight);
    this.listScroll = 0;
    this.levelList = this.add.container(0, 0);
    const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    maskGraphics.fillStyle(0xffffff).fillRect(338, LIST_TOP, 430, viewportHeight);
    this.levelList.setMask(maskGraphics.createGeometryMask());

    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      this.createLevelRow(level, 548, LIST_TOP + 19 + (level - 1) * ROW_HEIGHT);
    }

    this.add.rectangle(777, (LIST_TOP + LIST_BOTTOM) / 2, 5, viewportHeight, 0x293d52, 0.95);
    const thumbHeight = Math.max(36, viewportHeight * viewportHeight / contentHeight);
    this.scrollThumb = this.add.rectangle(777, LIST_TOP + thumbHeight / 2,
      9, thumbHeight, 0xd1ae6f, 1).setInteractive({ useHandCursor: true });
    this.input.setDraggable(this.scrollThumb);
    this.scrollThumb.on('drag', (pointer, dragX, dragY) => {
      const centerY = Phaser.Math.Clamp(dragY, LIST_TOP + thumbHeight / 2,
        LIST_BOTTOM - thumbHeight / 2);
      const ratio = (centerY - LIST_TOP - thumbHeight / 2) /
        Math.max(1, viewportHeight - thumbHeight);
      this.setListScroll(ratio * this.maxListScroll);
    });

    this.input.on('wheel', (pointer, over, deltaX, deltaY) => {
      if (pointer.x >= 332 && pointer.x <= 785 && pointer.y >= LIST_TOP && pointer.y <= LIST_BOTTOM) {
        this.setListScroll(this.listScroll + deltaY * 0.72);
      }
    });

    const back = () => this.scene.start('MainMenuScene');
    button(this, 170, 410, 200, '< Back to menu', back);
    label(this, 560, 410, 'WHEEL OR DRAG THE GOLD HANDLE TO SCROLL', 9, '#93a9c1');
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ESC', back);
      this.input.keyboard.on('keydown-DOWN', () => this.setListScroll(this.listScroll + ROW_HEIGHT));
      this.input.keyboard.on('keydown-UP', () => this.setListScroll(this.listScroll - ROW_HEIGHT));
      this.events.once('shutdown', () => {
        this.input.keyboard?.off('keydown-DOWN');
        this.input.keyboard?.off('keydown-UP');
      });
    }
  }

  createLevelRow(level, x, y) {
    const config = LEVEL_CONFIGS[level];
    const group = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x030914, 0.28).fillRoundedRect(-204, -16, 408, 35, 7);
    bg.fillStyle(level === 2 ? 0x26364a : 0x1b2d43, 1).fillRoundedRect(-205, -18, 408, 35, 7);
    bg.lineStyle(1, level === 2 ? 0xe0ba70 : 0x425970, 0.9).strokeRoundedRect(-205, -18, 408, 35, 7);
    bg.fillStyle(level === 2 ? 0xffcf70 : 0x507571, 1).fillCircle(-187, -1, 12);
    bg.lineStyle(1, 0xffe5a1, 0.8).strokeCircle(-187, -1, 12);
    const number = label(this, -187, -1, String(level).padStart(2, '0'), 10,
      level === 2 ? '#26364a' : '#fff1ce');
    const title = level <= 3
      ? ['BANTEAY CHHMAR', 'ANGKOR WAT CAUSEWAY', 'ANGKOR SUNSET RUINS'][level - 1]
      : config.province.name.toUpperCase();
    const detail = level <= 3 ? 'ANGKOR JOURNEY' : 'CAMBODIA PROVINCE';
    const name = this.add.text(-164, -6, title, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
      fontStyle: 'bold', color: '#e8dfcf', wordWrap: { width: 300 }
    }).setOrigin(0, 0.5);
    const subtitle = this.add.text(174, -5, detail, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '7px',
      color: '#9fb5c7', letterSpacing: 0.4
    }).setOrigin(1, 0.5);
    const startMark = label(this, 188, -1, '›', 18, '#e4c481');
    group.add([bg, number, name, subtitle, startMark]);
    group.setSize(408, 35).setInteractive({ useHandCursor: true });
    group.on('pointerover', () => {
      if (!this.isLevelRowVisible(y)) return;
      group.setScale(1.015);
      this.destination.setText(`${String(level).padStart(2, '0')}  ·  ${config.title}`);
    });
    group.on('pointerout', () => {
      group.setScale(1);
      this.destination.setText('Levels 1–3: Angkor introduction. Levels 4–28: province journey.');
    });
    group.on('pointerdown', () => {
      if (this.isLevelRowVisible(y)) this.startLevel(level);
    });
    this.levelList.add(group);
  }

  isLevelRowVisible(y) {
    const screenY = y - this.listScroll;
    return screenY >= LIST_TOP && screenY <= LIST_BOTTOM;
  }

  setListScroll(value) {
    this.listScroll = Phaser.Math.Clamp(value, 0, this.maxListScroll);
    this.levelList.y = -this.listScroll;
    const trackHeight = LIST_BOTTOM - LIST_TOP;
    const thumbHeight = Math.max(36, trackHeight * trackHeight / (TOTAL_LEVELS * ROW_HEIGHT));
    const travel = trackHeight - thumbHeight;
    this.scrollThumb.y = LIST_TOP + thumbHeight / 2 +
      (this.maxListScroll ? this.listScroll / this.maxListScroll : 0) * travel;
  }

  startLevel(level) {
    this.scene.start('GameScene', { level, score: 0, coins: 0, lives: 3 });
  }

  drawRouteMap(first, last) {
    const left = 28, top = 128, width = 293, height = 250;
    const point = ([x, y]) => ({ x: left + x * width, y: top + y * height });
    const g = this.add.graphics();
    const outline = [[0,.37],[.04,.29],[.14,.25],[.10,.19],[.17,.09],[.32,.06],[.38,.07],[.41,.05],[.49,.06],[.58,.16],[.70,.08],[.78,0],[.82,.08],[.9,.04],[.97,0],[.98,.24],[1,.29],[.98,.39],[.99,.48],[.97,.59],[.87,.62],[.81,.63],[.73,.70],[.75,.83],[.70,.85],[.63,.78],[.59,.83],[.5,.81],[.5,.94],[.41,.99],[.32,1],[.27,.98],[.24,.93],[.19,.93],[.17,.82],[.13,.9],[.08,.85],[.08,.69],[.04,.63],[.05,.51],[0,.49],[.03,.42]].map(point);
    g.fillStyle(0x263f4b).fillPoints(outline, true);
    g.lineStyle(1, 0x698778).strokePoints(outline, true);
    g.fillStyle(0x4e96af).fillEllipse(left + width * .34, top + height * .41, 19, 29);
    g.lineStyle(3, 0x4e96af).strokePoints([[.69,.21],[.67,.44],[.59,.57],[.46,.75],[.50,.91]].map(point), false);
    g.lineStyle(1, 0xd3ad78, .55).strokePoints(PROVINCE_ROUTE.map(province => point(province.map)), false);
    PROVINCE_ROUTE.forEach((province, index) => {
      const level = index + 4, { x, y } = point(province.map);
      const onPage = level >= first && level <= last;
      const dot = this.add.circle(x, y, onPage ? 5 : 3, onPage ? 0xffcf70 : 0x87b5a6)
        .setInteractive({ useHandCursor: true });
      dot.on('pointerover', () => this.destination.setText(`${level}. ${province.name} · ${province.places}`));
      dot.on('pointerdown', () => this.startLevel(level));
      if (onPage) label(this, x + 8, y - 7, String(level), 9, '#fff2cd');
    });
    label(this, 170, 382, 'Geographic game route · tap a destination', 10, '#93a9c1');
  }
}
