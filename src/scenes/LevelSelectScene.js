import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { button, label } from '../ui.js';
import { PROVINCE_ROUTE, TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { prepareProvinceSceneryTexture } from '../provinceScenery.js';
import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';

const LIST_TOP = 148;
const LIST_BOTTOM = 378;
const ROW_HEIGHT = 78;

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }

  preload() {
    this.load.image('stage-preview-1', 'assets/banteay-chhmar-level1-panorama.png');
    this.load.image('stage-preview-2', 'assets/angkor-wat-level2.png');
    this.load.image('stage-preview-3', 'assets/angkor-sunset-level3-pixel.png');
  }

  create() {
    fadeSceneIn(this);
    this.drawJourneyBackdrop();
    PROVINCE_ROUTE.forEach(province => prepareProvinceSceneryTexture(this, province));
    label(this, 400, 30, 'THE LITTLE ARCADE  /  CAMBODIA', 10, '#d8b77d');
    label(this, 400, 64, 'Choose your next destination.', 27, '#fff0d1');
    this.destination = label(this, 400, 101, 'Levels 1–3: Angkor introduction. Levels 4–28: province journey.', 12, '#d0c2aa');

    this.drawRouteMap(1, TOTAL_LEVELS);

    this.flatPanel(332, 119, 451, 265, 0x1c3033);
    label(this, 552, 132, 'ALL STAGES  ·  SCROLL TO EXPLORE', 10, '#e0b66e');

    const viewportHeight = LIST_BOTTOM - LIST_TOP;
    const contentHeight = TOTAL_LEVELS * ROW_HEIGHT;
    this.maxListScroll = Math.max(0, contentHeight - viewportHeight);
    this.listScroll = 0;
    this.levelList = this.add.container(0, 0);
    const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    maskGraphics.fillStyle(0xffffff).fillRect(338, LIST_TOP, 430, viewportHeight);
    this.levelList.setMask(maskGraphics.createGeometryMask());

    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      this.createLevelRow(level, 548, LIST_TOP + 37 + (level - 1) * ROW_HEIGHT);
    }

    this.add.rectangle(777, (LIST_TOP + LIST_BOTTOM) / 2, 4, viewportHeight, 0x3b3036, 0.95);
    const thumbHeight = Math.max(36, viewportHeight * viewportHeight / contentHeight);
    this.scrollThumb = this.add.rectangle(777, LIST_TOP + thumbHeight / 2,
      7, thumbHeight, 0xd6ad68, 1).setInteractive({ useHandCursor: true });
    this.input.setDraggable(this.scrollThumb);
    this.scrollThumb.on('drag', (pointer, dragX, dragY) => {
      const centerY = Phaser.Math.Clamp(dragY, LIST_TOP + thumbHeight / 2,
        LIST_BOTTOM - thumbHeight / 2);
      const ratio = (centerY - LIST_TOP - thumbHeight / 2) /
        Math.max(1, viewportHeight - thumbHeight);
      this.setListScroll(ratio * this.maxListScroll);
    });

    // Drag anywhere over the stage list on touch screens; mouse users can also drag it.
    this.listDrag = null;
    this.input.on('pointerdown', pointer => {
      if (pointer.x >= 332 && pointer.x <= 785 && pointer.y >= LIST_TOP && pointer.y <= LIST_BOTTOM) {
        this.listDrag = { id: pointer.id, startY: pointer.y, startScroll: this.listScroll };
      }
    });
    this.input.on('pointermove', pointer => {
      if (!this.listDrag || pointer.id !== this.listDrag.id || !pointer.isDown) return;
      const deltaY = pointer.y - this.listDrag.startY;
      if (Math.abs(deltaY) > 4) this.setListScroll(this.listDrag.startScroll - deltaY);
    });
    const finishListDrag = pointer => {
      if (this.listDrag?.id === pointer.id) this.listDrag = null;
    };
    this.input.on('pointerup', finishListDrag);
    this.input.on('pointerupoutside', finishListDrag);

    this.input.on('wheel', (pointer, over, deltaX, deltaY) => {
      if (pointer.x >= 332 && pointer.x <= 785 && pointer.y >= LIST_TOP && pointer.y <= LIST_BOTTOM) {
        this.setListScroll(this.listScroll + deltaY * 0.72);
      }
    });

    const back = () => fadeToScene(this, 'MainMenuScene');
    const backButton = button(this, 170, 410, 200, '< Back to menu', back, false, null);
    backButton.list[0].clear().fillStyle(0x302632).fillRoundedRect(-100, -22, 200, 44, 12);
    label(this, 560, 410, 'SWIPE THE LIST OR DRAG THE GOLD HANDLE', 9, '#c5b69d');
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

  drawJourneyBackdrop() {
    this.cameras.main.setBackgroundColor('#14282e');
    const g = this.add.graphics();
    g.fillStyle(0x1d3a3c, 0.78).fillEllipse(620, 90, 590, 280);
    g.fillStyle(0x1b3434, 0.72).fillEllipse(110, 390, 650, 310);
    g.fillStyle(0x0c202a, 0.55).fillEllipse(760, 400, 520, 300);
    g.fillStyle(0xf0d59a, 0.08).fillCircle(670, 82, 94);
    for (let i = 0; i < 20; i++) {
      g.fillStyle(i % 3 ? 0x87a99a : 0xe2bd7b, 0.34);
      g.fillRect((i * 137 + 19) % 800, (i * 73 + 21) % 450, 2, 2);
    }
  }

  flatPanel(x, y, width, height, color) {
    return this.add.graphics().fillStyle(color, 1).fillRoundedRect(x, y, width, height, 15);
  }

  createLevelRow(level, x, y) {
    const config = LEVEL_CONFIGS[level];
    const group = this.add.container(x, y);
    const bg = this.add.graphics();
    const drawRow = (hovered = false) => {
      bg.clear();
      bg.lineStyle(2, hovered || level === 2 ? 0xd09a53 : 0xb7955d, 0.96)
        .strokeRoundedRect(-205, -36, 410, 72, 11);
      bg.lineStyle(1, 0xf8f0df, 0.8).strokeRoundedRect(-201, -32, 402, 64, 8);
      bg.fillStyle(level === 2 ? 0xd9682c : 0xe67e36, 1).fillCircle(-161, 0, 32);
      bg.lineStyle(2, 0x573327, 1).strokeCircle(-161, 0, 32);
      bg.lineStyle(1, 0xf5bd71, 1).strokeCircle(-161, 0, 28);
    };
    drawRow();
    const number = this.add.text(-161, 0, String(level).padStart(2, '0'), {
      fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold', color: '#fff1d5'
    }).setOrigin(0.5);
    const title = level <= 3
      ? ['BANTEAY CHHMAR', 'ANGKOR WAT CAUSEWAY', 'ANGKOR SUNSET RUINS'][level - 1]
      : config.province.name.toUpperCase();
    const detail = level <= 3 ? 'ANGKOR JOURNEY' : 'CAMBODIA PROVINCE';
    const name = this.add.text(-116, -8, title, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#382b29', wordWrap: { width: 195 }
    }).setOrigin(0, 0.5);
    const subtitle = this.add.text(-115, 13, detail, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '7px',
      color: '#806c55', letterSpacing: 0.4
    }).setOrigin(0, 0.5);
    const startMark = label(this, 188, -1, '›', 18, '#e4c481');
    group.add([bg, number, name, subtitle, startMark]);
    startMark.setVisible(false);
    const textureKey = this.getStagePreviewTextureKey(level, config);
    const bannerKey = this.createStageBannerTexture(level, textureKey);
    const bannerArt = this.add.image(0, 0, bannerKey);
    group.removeAll(false);
    group.add([bannerArt, bg, number, name, subtitle]);
    group.setSize(410, 72).setInteractive({ useHandCursor: true });
    group.on('pointerover', () => {
      if (!this.isLevelRowVisible(y)) return;
      drawRow(true);
      this.destination.setText(`${String(level).padStart(2, '0')}  ·  ${config.title}`);
    });
    group.on('pointerout', () => {
      drawRow();
      this.destination.setText('Levels 1–3: Angkor introduction. Levels 4–28: province journey.');
    });
    group.on('pointerup', pointer => {
      const movement = Math.hypot(pointer.upX - pointer.downX, pointer.upY - pointer.downY);
      if (movement < 12 && this.isLevelRowVisible(y)) this.startLevel(level);
    });
    this.levelList.add(group);
  }

  getStagePreviewTextureKey(level, config) {
    if (level <= 3) return `stage-preview-${level}`;
    if (config.province.id === 'banteay-meanchey' && this.textures.exists('banteay-countryside')) {
      return 'banteay-countryside';
    }
    return `province-${config.province.id}`;
  }

  createStageBannerTexture(level, textureKey) {
    const key = `stage-banner-${level}`;
    if (this.textures.exists(key)) return key;
    const texture = this.textures.createCanvas(key, 410, 72);
    const ctx = texture.context;
    const art = this.textures.get(textureKey).getSourceImage();
    const sxRatio = art.width / art.height;
    const targetRatio = 196 / 62;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (sxRatio > targetRatio) {
      sw = art.height * targetRatio;
      sx = (art.width - sw) / 2;
    } else {
      sh = art.width / targetRatio;
      sy = (art.height - sh) / 2;
    }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(1, 1, 408, 70, 10);
    ctx.clip();
    ctx.fillStyle = '#eee5d0';
    ctx.fillRect(0, 0, 410, 72);
    ctx.drawImage(art, sx, sy, sw, sh, 210, 5, 196, 62);
    const fade = ctx.createLinearGradient(188, 0, 318, 0);
    fade.addColorStop(0, '#eee5d0');
    fade.addColorStop(0.54, 'rgba(238,229,208,0.93)');
    fade.addColorStop(1, 'rgba(238,229,208,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(188, 0, 130, 72);
    // Delicate parchment scrollwork echoes the reference along the left edge.
    ctx.strokeStyle = 'rgba(176,143,91,0.23)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(8 + i * 4, 4);
      ctx.bezierCurveTo(30 + i * 4, 18, 4 + i * 4, 39, 27 + i * 4, 68);
      ctx.stroke();
    }
    ctx.restore();
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
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
    fadeToScene(this, 'GameScene', { level, score: 0, coins: 0, lives: 3 });
  }

  drawRouteMap(first, last) {
    const left = 28, top = 128, width = 293, height = 250;
    const point = ([x, y]) => ({ x: left + x * width, y: top + y * height });
    const g = this.add.graphics();
    const outline = [[0,.37],[.04,.29],[.14,.25],[.10,.19],[.17,.09],[.32,.06],[.38,.07],[.41,.05],[.49,.06],[.58,.16],[.70,.08],[.78,0],[.82,.08],[.9,.04],[.97,0],[.98,.24],[1,.29],[.98,.39],[.99,.48],[.97,.59],[.87,.62],[.81,.63],[.73,.70],[.75,.83],[.70,.85],[.63,.78],[.59,.83],[.5,.81],[.5,.94],[.41,.99],[.32,1],[.27,.98],[.24,.93],[.19,.93],[.17,.82],[.13,.9],[.08,.85],[.08,.69],[.04,.63],[.05,.51],[0,.49],[.03,.42]].map(point);
    g.fillStyle(0x263f4b).fillPoints(outline, true);
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
