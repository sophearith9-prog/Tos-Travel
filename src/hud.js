import { bakeGraphics } from './bakeGraphics.js';
import { canvasTexture } from './biomes/biomeArt.js';
import { pixelText } from './pixelFont.js';
import { PROVINCE_ROUTE, TOTAL_LEVELS } from './levels/provinceRoute.js';
import { sfx } from './audio/soundManager.js';

// Compact in-game HUD (Khmer gold-trim style, max ~40px tall at 800x450):
//   top-left  - hero portrait, one heart per hit point, thin segmented shield bar
//   top-right - score, coins, stage + province, pause and fullscreen buttons
// Laid out in 800x450 screen units inside a container that counters the camera zoom.
// Small separate pills (no full-width bar) so the level shows through.

const GOLD = 0xd9b46a, PILL = 0x0c141f, H = 32, TOP = 5, GAP = 5;
const HEART_SCALE = 2, HEART_STEP = 22;   // whole-pixel scale keeps the pixel hearts crisp
const INTRO_PROVINCES = { 1: 'Banteay Meanchey', 2: 'Siem Reap', 3: 'Siem Reap' };   // Levels 1-3 have no route entry

function provinceName(level) {
  return INTRO_PROVINCES[level] || PROVINCE_ROUTE[level - 4]?.name || '';
}

// Rounded dark pill with a fine gold rim, baked once per size.
function pill(scene, x, y, w, h = H) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.28).fillRoundedRect(1, 2, w, h, 9);
  g.fillStyle(PILL, 0.74).fillRoundedRect(0, 0, w, h, 9);
  g.lineStyle(1, GOLD, 0.85).strokeRoundedRect(0.5, 0.5, w - 1, h - 1, 9);
  g.fillStyle(0xf1d69d, 0.35).fillRect(9, 2, w - 18, 1);
  const [image] = bakeGraphics(scene, g, `hud-pill-${w}x${h}`, { x: -1, y: -1, width: w + 3, height: h + 4 });
  return image.setPosition(x - 1, y - 1);
}

function heartTextures(scene) {
  const shape = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
  const make = (key, fill, light, shade) => canvasTexture(scene, key, 11, 10, p => {
    const on = (x, y) => shape[y]?.[x] === '#';
    for (let y = -1; y <= 8; y++) for (let x = -1; x <= 9; x++) {
      if (on(x, y)) continue;
      if ([-1, 0, 1].some(dy => [-1, 0, 1].some(dx => on(x + dx, y + dy)))) p.rect(x + 1, y + 1, 1, 1, '#140a0c');
    }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) if (on(x, y)) p.rect(x + 1, y + 1, 1, 1, y >= 5 ? shade : fill);
    if (light) { p.rect(2, 2, 2, 1, light); p.rect(2, 3, 1, 1, light); }
  });
  return {
    full: make('hud-heart-full', '#e0384e', '#ff9aa8', '#a8203a'),
    empty: make('hud-heart-empty', '#3a2228', null, '#2a181c'),
    bonus: make('hud-heart-bonus', '#f2c14e', '#fff0b0', '#c08a28')
  };
}

// Round portrait cut from the hero's idle frame, with a gold ring.
function portraitTexture(scene) {
  const key = 'hud-portrait';
  if (scene.textures.exists(key) || !scene.textures.exists('player-character')) return scene.textures.exists(key) ? key : null;
  const tex = scene.textures.get('player-character');
  const frame = tex.get(0), src = tex.getSourceImage();
  const canvas = scene.textures.createCanvas(key, 30, 30), ctx = canvas.context;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#5a3b22'; ctx.beginPath(); ctx.arc(15, 15, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.arc(15, 12, 10, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(15, 15, 12.5, 0, Math.PI * 2); ctx.clip();
  // Head and shoulders: the top ~40% of the 96px frame, centred.
  ctx.drawImage(src, frame.cutX + 26, frame.cutY + 2, 44, 44, 1, 2, 28, 28);
  ctx.restore();
  ctx.strokeStyle = '#140a0c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(15, 15, 13.5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e2bf78'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(15, 15, 13.5, 0, Math.PI * 2); ctx.stroke();
  canvas.refresh();
  return key;
}

function iconTextures(scene) {
  const ink = '#140a0c';
  const score = canvasTexture(scene, 'hud-icon-score', 13, 13, p => {
    // A gold star: score.
    const star = ['.....#.....', '....###....', '....###....', '###########', '.#########.', '..#######..', '..#######..', '.####.####.', '.###...###.', '##.......##'];
    const on = (x, y) => star[y]?.[x] === '#';
    for (let y = -1; y <= 10; y++) for (let x = -1; x <= 11; x++) {
      if (!on(x, y) && [-1, 0, 1].some(dy => [-1, 0, 1].some(dx => on(x + dx, y + dy)))) p.rect(x + 1, y + 1, 1, 1, ink);
    }
    for (let y = 0; y < 10; y++) for (let x = 0; x < 11; x++) if (on(x, y)) p.rect(x + 1, y + 1, 1, 1, y < 4 ? '#ffe27a' : y < 7 ? '#f2c14e' : '#c08a28');
    p.rect(6, 4, 1, 2, '#fff8d8');
  });
  const pause = canvasTexture(scene, 'hud-icon-pause', 12, 12, p => {
    for (const x of [2, 7]) { p.rect(x - 1, 1, 5, 10, ink); p.rect(x, 2, 3, 8, '#f4f1df'); }
  });
  const enter = canvasTexture(scene, 'hud-icon-fullscreen', 13, 13, p => {
    for (const [x, y, w, h] of [[1, 1, 5, 2], [1, 1, 2, 5], [7, 1, 5, 2], [10, 1, 2, 5], [1, 10, 5, 2], [1, 7, 2, 5], [7, 10, 5, 2], [10, 7, 2, 5]]) {
      p.rect(x - 1, y - 1, w + 2, h + 2, ink);
    }
    for (const [x, y, w, h] of [[1, 1, 5, 2], [1, 1, 2, 5], [7, 1, 5, 2], [10, 1, 2, 5], [1, 10, 5, 2], [1, 7, 2, 5], [7, 10, 5, 2], [10, 7, 2, 5]]) {
      p.rect(x, y, w, h, '#f4f1df');
    }
  });
  const exit = canvasTexture(scene, 'hud-icon-fullscreen-exit', 13, 13, p => {
    for (const [x, y, w, h] of [[4, 1, 2, 5], [1, 4, 5, 2], [7, 1, 2, 5], [7, 4, 5, 2], [4, 7, 2, 5], [1, 7, 5, 2], [7, 7, 2, 5], [7, 7, 5, 2]]) {
      p.rect(x - 1, y - 1, w + 2, h + 2, ink);
    }
    for (const [x, y, w, h] of [[4, 1, 2, 5], [1, 4, 5, 2], [7, 1, 2, 5], [7, 4, 5, 2], [4, 7, 2, 5], [1, 7, 5, 2], [7, 7, 2, 5], [7, 7, 5, 2]]) {
      p.rect(x, y, w, h, '#f4f1df');
    }
  });
  return { score, pause, enter, exit };
}

export class GameHUD {
  constructor(scene) {
    this.scene = scene;
    const zoom = scene.cameras.main.zoom;
    // Phones get a slightly larger HUD so it stays readable on a small canvas.
    const mobile = document.body.classList.contains('is-mobile-device');
    this.uiScale = mobile ? 1.25 : 1;
    this.width = 800 / this.uiScale;
    this.container = scene.add.container(400 - 400 / zoom, 225 - 225 / zoom)
      .setScale(this.uiScale / zoom).setScrollFactor(0).setDepth(200).setAlpha(0);
    this.hearts = heartTextures(scene);
    this.icons = iconTextures(scene);
    this.last = {};
    this.buildLeft();
    this.buildRight(mobile);
    this.update(true);
    scene.tweens.add({ targets: this.container, alpha: 1, duration: 600, delay: 120, ease: 'Sine.easeOut' });
  }

  /* ---------- left: portrait, hearts, shield ---------- */

  buildLeft() {
    const s = this.scene;
    this.leftPill = null;
    const portraitKey = portraitTexture(s);
    this.portrait = portraitKey ? s.add.image(22, TOP + H / 2, portraitKey) : null;
    this.heartIcons = [];
    this.shieldBar = s.add.graphics();
    this.container.add([this.shieldBar, ...(this.portrait ? [this.portrait] : [])]);
  }

  layoutLeft(count) {
    const s = this.scene;
    const width = 42 + count * HEART_STEP + 6;
    if (this.leftWidth !== width) {
      this.leftWidth = width;
      this.leftPill?.destroy();
      this.leftPill = pill(s, 6, TOP, width);
      this.container.addAt(this.leftPill, 0);
    }
    while (this.heartIcons.length < count) {
      const i = this.heartIcons.length;
      const heart = s.add.image(42 + i * HEART_STEP + 10, TOP + 12, this.hearts.full).setScale(HEART_SCALE);
      heart.homeX = heart.x;
      this.heartIcons.push(heart);
      this.container.add(heart);
    }
    while (this.heartIcons.length > count) this.heartIcons.pop().destroy();
  }

  drawShield(shields, recharge, flashIndex = -1) {
    const g = this.shieldBar.clear();
    const x0 = 42, y = TOP + 24, w = 20, h = 4;
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * HEART_STEP;
      g.fillStyle(0x140a0c, 1).fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle(0x1c2638, 1).fillRect(x, y, w, h);
      if (i < shields) {
        g.fillStyle(i === flashIndex ? 0xffffff : 0x5aa6ff, 1).fillRect(x, y, w, h);
        g.fillStyle(0xc8e6ff, 0.8).fillRect(x, y, w, 1);
      } else if (i === shields && recharge > 0) {
        g.fillStyle(0x3a5f9a, 1).fillRect(x, y, Math.round(w * recharge), h);
      }
      if (i === flashIndex && i >= shields) g.fillStyle(0xffffff, 0.9).fillRect(x, y, w, h);
    }
  }

  /* ---------- right: score, coins, stage, pause, fullscreen ---------- */

  buildRight(mobile) {
    const s = this.scene;
    let right = this.width - 6;
    const button = (icon, onPress, event = 'pointerdown') => {
      const x = right - 30;
      const box = s.add.container(x + 15, TOP + 16);
      const plate = pill(s, -15, -16, 30, H);
      const glyph = s.add.image(0, 0, icon).setScale(1.5);
      box.add([plate, glyph]).setSize(32, 34).setInteractive({ useHandCursor: true }).setScrollFactor(0);
      box.on('pointerover', () => box.setScale(1.08));
      box.on('pointerout', () => box.setScale(1));
      box.on(event, (...args) => { sfx(s).play('uiTap'); onPress(...args); });
      this.container.add(box);
      right = x - 4;
      return { box, glyph };
    };
    // Fullscreen (desktop only; mobile layouts already fill the screen) and pause, same style.
    const fullscreen = s.game.fullscreen;
    if (fullscreen && !mobile) {
      const fs = button(fullscreen.isActive() ? this.icons.exit : this.icons.enter, () => fullscreen.toggle(), 'pointerup');
      const off = fullscreen.onChange(active => fs.glyph.setTexture(active ? this.icons.exit : this.icons.enter));
      s.events.once('shutdown', off);
    }
    button(this.icons.pause, () => s.pauseGame());
    right -= GAP - 4;

    // Stage pill: "11/28" with the province name beside it in small type
    // (two-word names wrap onto two short lines to keep the pill compact).
    const stage = `${s.currentLevel}/${TOTAL_LEVELS}`;
    let name = provinceName(s.currentLevel).toUpperCase();
    if (name.length > 9 && name.includes(' ')) {
      const words = name.split(' ');
      let best = 1, bestDiff = Infinity;
      for (let i = 1; i < words.length; i++) {
        const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      }
      name = `${words.slice(0, best).join(' ')}
${words.slice(best).join(' ')}`;
    }
    const stageText = pixelText(s, 0, 0, stage, 2, 0xf4f1df).setOrigin(0, 0.5);
    const nameText = pixelText(s, 0, 0, name, 1, 0xe2c88a).setOrigin(0, 0.5);
    const stageW = Math.ceil(stageText.width + (name ? nameText.width + 6 : 0)) + 16;
    const stageX = right - stageW;
    this.container.add(pill(s, stageX, TOP, stageW));
    stageText.setPosition(stageX + 8, TOP + H / 2 + 1);
    nameText.setPosition(stageX + 8 + stageText.width + 6, TOP + H / 2 + 1);
    this.container.add([stageText, nameText]);
    right = stageX - GAP;

    // Coins and score: icon + fixed-width number so the pills never resize.
    const counter = (iconKey, frame, digits, tint) => {
      const reserve = pixelText(s, 0, 0, '0'.repeat(digits), 2);
      const textW = Math.ceil(reserve.width); reserve.destroy();
      const w = 8 + 14 + 5 + textW + 8;
      const x = right - w;
      this.container.add(pill(s, x, TOP, w));
      const icon = (frame === undefined ? s.add.image(x + 15, TOP + H / 2, iconKey) : s.add.image(x + 15, TOP + H / 2, iconKey, frame))
        .setDisplaySize(14, 14);
      const text = pixelText(s, x + 8 + 14 + 5 + textW / 2, TOP + H / 2 + 1, '', 2, tint).setOrigin(0.5);
      this.container.add([icon, text]);
      right = x - GAP;
      return { icon, text, iconScale: { x: icon.scaleX, y: icon.scaleY } };
    };
    this.coinCounter = counter('khmer-coin', 2, 3, 0xffe39a);
    this.scoreCounter = counter(this.icons.score, undefined, 6, 0xf4f1df);
    this.rightEdge = right;
  }

  pop(counter) {
    const { icon, text, iconScale } = counter;
    this.scene.tweens.killTweensOf([icon, text]);
    text.setScale(2); icon.setScale(iconScale.x, iconScale.y);
    this.scene.tweens.add({ targets: text, scale: 2.5, duration: 90, yoyo: true, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: icon, scaleX: iconScale.x * 1.3, scaleY: iconScale.y * 1.3, duration: 90, yoyo: true });
  }

  flash(target, homeX) {
    const s = this.scene;
    s.tweens.killTweensOf(target);
    target.x = homeX;
    s.tweens.add({ targets: target, x: homeX + 2, duration: 40, yoyo: true, repeat: 3, onComplete: () => { target.x = homeX; } });
    if (target.setTintFill) {
      target.setTintFill(0xffffff);
      s.time.delayedCall(140, () => target.active && target.clearTint());
    }
  }

  /* ---------- per-frame update (cheap: only redraws what changed) ---------- */

  update(force = false) {
    const s = this.scene, last = this.last;
    const hp = Math.max(0, Math.ceil(s.health / 50));
    const bonus = Math.max(0, s.lives - 3);
    const count = Math.max(3, 3 + bonus);
    if (force || count !== last.count) this.layoutLeft(count);
    if (force || hp !== last.hp || bonus !== last.bonus) {
      this.heartIcons.forEach((heart, i) => {
        const key = i < 3 ? (i < hp ? this.hearts.full : this.hearts.empty) : this.hearts.bonus;
        heart.setTexture(key);
      });
      if (!force && last.hp !== undefined) {
        // Flash the heart that was just lost (bonus hearts are lost first).
        if (bonus < last.bonus) { const h = this.heartIcons[3 + bonus]; if (h) this.flash(h, h.homeX); }
        else if (hp < last.hp) { const h = this.heartIcons[hp]; if (h) this.flash(h, h.homeX); }
      }
    }
    const now = s.time?.now || 0;
    const recharge = s.shields >= 3 ? 0 : (s.nextShieldRecoveryAt > now ? 1 - (s.nextShieldRecoveryAt - now) / 8000 : 0);
    const rechargeStep = Math.round(recharge * 34);
    const lostShield = !force && last.shields !== undefined && s.shields < last.shields;
    if (force || s.shields !== last.shields || rechargeStep !== last.rechargeStep || lostShield) {
      this.drawShield(s.shields, recharge, lostShield ? s.shields : -1);
      if (lostShield) {
        this.flash(this.shieldBar, 0);
        s.time.delayedCall(150, () => this.shieldBar.active && this.drawShield(s.shields, recharge));
      }
    }
    if (force || s.score !== last.score) {
      this.scoreCounter.text.setText(String(s.score).padStart(6, '0'));
      if (!force && s.score > last.score) this.pop(this.scoreCounter);
    }
    if (force || s.coins !== last.coins) {
      this.coinCounter.text.setText(String(s.coins).padStart(3, '0'));
      if (!force && s.coins > last.coins) this.pop(this.coinCounter);
    }
    Object.assign(last, { hp, bonus, count, shields: s.shields, rechargeStep, score: s.score, coins: s.coins });
  }
}
