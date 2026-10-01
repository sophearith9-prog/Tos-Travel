import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { backdrop, button, label, panel } from '../ui.js';
import { PROVINCE_ROUTE, TOTAL_LEVELS } from '../levels/provinceRoute.js';
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }
  create({ page = 0 } = {}) {
    backdrop(this);
    label(this, 400, 30, 'CAMBODIA / 24 PROVINCES + CAPITAL / 28 STAGES', 11, '#83b6c5');
    label(this, 400, 64, 'Choose your next destination.', 27, '#f4f1e8');
    this.destination = label(this, 400, 101, 'Levels 1–3: Angkor introduction. Levels 4–28: province journey.', 12, '#a5b6cd');
    const first = page * 10 + 1, last = Math.min(first + 9, TOTAL_LEVELS);
    this.drawRouteMap(first, last);
    for (let i = first; i <= last; i++) {
      const cell = i - first;
      const x = 445 + (cell % 2) * 214;
      const y = 150 + Math.floor(cell / 2) * 48;
      const group = this.add.container(x, y);
      const bg = panel(this, -100, -21, 200, 42, i === TOTAL_LEVELS ? 0x3a3040 : 0x182c43);
      const number = label(this, -78, 0, String(i).padStart(2, '0'), 19, '#86d9ce');
      const config = LEVEL_CONFIGS[i];
      const title = label(this, 17, config.province ? -6 : 0, config.title, 11, '#d5e0ee');
      title.setStyle({ wordWrap: { width: 145 }, align: 'center' });
      group.add([bg, number, title]);
      if (config.province) group.add(label(this, 17, 9, config.province.khmer, 10, '#d3ad78')
        .setFontFamily('Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif'));
      group.setSize(200, 42).setInteractive({ useHandCursor: true });
      group.on('pointerover', () => group.setScale(1.05));
      group.on('pointerout', () => group.setScale(1));
      group.on('pointerdown', () => this.scene.start('GameScene', { level: i, score: 0, coins: 0, lives: 3 }));
    }
    const back = () => this.scene.start('MainMenuScene');
    const pages = Math.ceil(TOTAL_LEVELS / 10);
    button(this, 405, 400, 110, '< Previous', () => this.scene.restart({ page: (page + pages - 1) % pages }));
    label(this, 550, 400, `${page + 1} / ${pages}`, 13, '#d3ad78');
    button(this, 695, 400, 110, 'Next >', () => this.scene.restart({ page: (page + 1) % pages }));
    button(this, 170, 410, 200, '< Back to menu', back);
    if (this.input.keyboard) this.input.keyboard.once('keydown-ESC', back);
  }
  drawRouteMap(first, last) {
    const left = 28, top = 128, width = 293, height = 250;
    const point = ([x,y]) => ({ x:left+x*width, y:top+y*height });
    const g = this.add.graphics();
    const outline = [[0,.37],[.04,.29],[.14,.25],[.10,.19],[.17,.09],[.32,.06],[.38,.07],[.41,.05],[.49,.06],[.58,.16],[.70,.08],[.78,0],[.82,.08],[.9,.04],[.97,0],[.98,.24],[1,.29],[.98,.39],[.99,.48],[.97,.59],[.87,.62],[.81,.63],[.73,.70],[.75,.83],[.70,.85],[.63,.78],[.59,.83],[.5,.81],[.5,.94],[.41,.99],[.32,1],[.27,.98],[.24,.93],[.19,.93],[.17,.82],[.13,.9],[.08,.85],[.08,.69],[.04,.63],[.05,.51],[0,.49],[.03,.42]].map(point);
    g.fillStyle(0x263f4b).fillPoints(outline,true);
    g.lineStyle(1,0x698778).strokePoints(outline,true);
    g.fillStyle(0x4e96af).fillEllipse(left+width*.34,top+height*.41,19,29);
    g.lineStyle(3,0x4e96af).strokePoints([[.69,.21],[.67,.44],[.59,.57],[.46,.75],[.50,.91]].map(point),false);
    g.lineStyle(1,0xd3ad78,.55).strokePoints(PROVINCE_ROUTE.map(p=>point(p.map)),false);
    PROVINCE_ROUTE.forEach((province,index)=>{
      const level = index + 4, {x,y} = point(province.map);
      const onPage = level >= first && level <= last;
      const dot = this.add.circle(x,y,onPage?5:3,onPage?0xffcf70:0x87b5a6).setInteractive({useHandCursor:true});
      dot.on('pointerover',()=>this.destination.setText(`${level}. ${province.name} · ${province.places}`));
      dot.on('pointerdown',()=>this.scene.start('GameScene',{level,score:0,coins:0,lives:3}));
      if(onPage)label(this,x+8,y-7,String(level),9,'#fff2cd');
    });
    label(this,170,382,'Geographic game route · tap a destination',10,'#93a9c1');
  }
}
