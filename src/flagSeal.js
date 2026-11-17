// Sealed finish flag: glowing chains and a carved stone lock seal on the flag, a soft
// pulsing barrier, an outlined hint above it, a HUD objective tracker with an edge arrow
// to the objective, and an "unseal" moment when the objective is done.
//
// Used by every stage whose flag is locked until an objective is met:
//   Level 2 (lotus switch), Level 3 (Stone Guardian), and hand-made stages with a
//   `miniBoss` that has `lockGoal` (src/mechanics/miniBoss.js).
import { sfx } from './audio/soundManager.js';

const RES = 3;                       // seal art is drawn at 3x for crisp edges under zoom
const INK = '#1a0d05', INK_HEX = 0x1a0d05;

/* ---------- which stages are sealed ---------- */

function titleCase(name) {
  return String(name).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function sealConfig(scene) {
  if (scene.currentLevel === 3) {
    const guardian = () => scene.enemies?.getChildren().find(e => e.active && e.enemyKind === 'stone-guardian');
    return {
      icon: 'guardian', hint: 'Defeat the Stone Guardian to unseal',
      objective: 'Defeat the Stone Guardian', done: 'Stone Guardian defeated',
      isOpen: () => scene.level3GuardianDefeated, target: guardian, outline: () => [guardian()]
    };
  }
  if (scene.currentLevel === 2) {
    return {
      icon: 'lotus', hint: 'Step on the lotus switch to unseal',
      objective: 'Step on the lotus switch', done: 'Lotus switch pressed',
      isOpen: () => scene.templeSwitchActivated, target: () => scene.templeSwitch, outline: () => []
    };
  }
  const boss = (scene.mechanics || []).find(m => m.type === 'miniBoss' && m.cfg?.lockGoal);
  if (boss) {
    const name = titleCase(boss.cfg.name || 'Guardian');
    return {
      icon: 'guardian', hint: `Defeat the ${name} to unseal`,
      objective: `Defeat the ${name}`, done: `${name} defeated`,
      isOpen: () => boss.defeated, target: () => (boss.defeated ? null : boss.sprite), outline: () => [boss.sprite]
    };
  }
  return null;
}

/* ---------- art ---------- */

// Chain link path from a to b: alternating face-on rings and edge-on bars.
function chain(ctx, ax, ay, bx, by, dark, mid, light) {
  const len = Math.hypot(bx - ax, by - ay), angle = Math.atan2(by - ay, bx - ax), step = 3.9;
  for (let d = 0, i = 0; d <= len; d += step, i++) {
    ctx.save();
    ctx.translate(ax + Math.cos(angle) * d, ay + Math.sin(angle) * d);
    ctx.rotate(angle);
    if (i % 2 === 0) {
      ctx.lineWidth = 2.2; ctx.strokeStyle = dark;
      ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 1.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.1; ctx.strokeStyle = mid;
      ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 1.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.strokeStyle = light;
      ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 1.6, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    } else {
      ctx.fillStyle = dark; ctx.fillRect(-2.6, -1, 5.2, 2);
      ctx.fillStyle = mid; ctx.fillRect(-2.2, -0.5, 4.4, 1);
    }
    ctx.restore();
  }
}

// Seal art is laid out in a 48 x 66 world-unit box; the pole sits at local x = 12.
const BOX = { left: -12, top: -90, w: 48, h: 66 };
const CROSS = { x: 24, y: 38 };
const CHAINS = [[3, 14, 45, 62], [45, 14, 3, 62]];

function sealTextures(scene) {
  if (scene.textures.exists('flag-seal-chains')) return;
  const make = (key, w, h, res, draw) => {
    const t = scene.textures.createCanvas(key, Math.ceil(w * res), Math.ceil(h * res));
    t.context.scale(res, res);
    draw(t.context);
    t.refresh();
  };
  // Glow behind the chains (shadowBlur works on every browser, unlike ctx.filter).
  make('flag-seal-glow', BOX.w, BOX.h, RES, ctx => {
    ctx.shadowColor = 'rgba(255, 200, 90, 1)'; ctx.shadowBlur = 5 * RES;
    ctx.strokeStyle = 'rgba(255, 214, 120, .9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [ax, ay, bx, by] of CHAINS) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255, 214, 120, .9)';
    ctx.beginPath(); ctx.arc(CROSS.x, CROSS.y, 11, 0, Math.PI * 2); ctx.fill();
  });
  make('flag-seal-chains', BOX.w, BOX.h, RES, ctx => {
    for (const [ax, ay, bx, by] of CHAINS) chain(ctx, ax, ay, bx, by, '#2a1606', '#d6a24a', '#fff0b0');
    // Shackle clamps where the chains bite the pole.
    for (const y of [17, 59]) {
      ctx.fillStyle = '#2a1606'; ctx.fillRect(9, y - 2.2, 7, 4.4);
      ctx.fillStyle = '#b98634'; ctx.fillRect(9.8, y - 1.4, 5.4, 2.8);
      ctx.fillStyle = '#ffe7a0'; ctx.fillRect(9.8, y - 1.4, 5.4, 0.8);
    }
    // Carved stone seal disc with a lock.
    const { x, y } = CROSS;
    ctx.fillStyle = '#2a1606'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    const stone = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 10);
    stone.addColorStop(0, '#c9b590'); stone.addColorStop(0.7, '#8f7c5c'); stone.addColorStop(1, '#5e4f3a');
    ctx.fillStyle = stone; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    // Lotus-petal notches around a carved ring.
    ctx.fillStyle = '#4a3c2a';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 7.6, y + Math.sin(a) * 7.6, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#4a3c2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, 6.2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 240, 200, .45)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x, y, 6.9, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
    // Gold padlock.
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2a1606'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, y - 1.2, 2.5, Math.PI, 0); ctx.lineTo(x + 2.5, y + 0.6); ctx.moveTo(x - 2.5, y - 1.2); ctx.lineTo(x - 2.5, y + 0.6); ctx.stroke();
    ctx.strokeStyle = '#f2c35a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y - 1.2, 2.5, Math.PI, 0); ctx.lineTo(x + 2.5, y + 0.6); ctx.moveTo(x - 2.5, y - 1.2); ctx.lineTo(x - 2.5, y + 0.6); ctx.stroke();
    ctx.fillStyle = '#2a1606'; ctx.fillRect(x - 4.1, y - 0.1, 8.2, 6.4);
    const body = ctx.createLinearGradient(0, y, 0, y + 6);
    body.addColorStop(0, '#ffe6a0'); body.addColorStop(1, '#c58a26');
    ctx.fillStyle = body; ctx.fillRect(x - 3.4, y + 0.6, 6.8, 5);
    ctx.fillStyle = '#3a1d08'; ctx.beginPath(); ctx.arc(x, y + 2.6, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 0.4, y + 2.6, 0.8, 1.9);
  });
  // Soft barrier: a tall capsule of gold light around the flag.
  make('flag-seal-barrier', 60, 112, 2, ctx => {
    const path = () => { ctx.beginPath(); ctx.roundRect(5, 5, 50, 102, 22); };
    const fill = ctx.createLinearGradient(5, 0, 55, 0);
    fill.addColorStop(0, 'rgba(255, 210, 120, .32)'); fill.addColorStop(0.5, 'rgba(255, 210, 120, .05)'); fill.addColorStop(1, 'rgba(255, 210, 120, .32)');
    path(); ctx.fillStyle = fill; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = 'rgba(255, 236, 170, .12)';
    for (let y = 9; y < 107; y += 6) ctx.fillRect(5, y, 50, 1);
    ctx.restore();
    ctx.shadowColor = 'rgba(255, 220, 140, 1)'; ctx.shadowBlur = 6;
    path(); ctx.strokeStyle = 'rgba(255, 226, 150, .85)'; ctx.lineWidth = 1.2; ctx.stroke();
  });
  // Particles: gold chain fragments and stone chips.
  make('flag-seal-shard', 4, 3, 3, ctx => {
    ctx.fillStyle = '#2a1606'; ctx.fillRect(0, 0, 4, 3);
    ctx.fillStyle = '#f2c35a'; ctx.fillRect(0.5, 0.5, 3, 2);
    ctx.fillStyle = '#fff0b0'; ctx.fillRect(0.5, 0.5, 3, 0.7);
  });
  make('flag-seal-chip', 3, 3, 3, ctx => {
    ctx.fillStyle = '#4a3c2a'; ctx.fillRect(0, 0, 3, 3);
    ctx.fillStyle = '#a8946f'; ctx.fillRect(0.4, 0.4, 2.2, 2.2);
  });
  make('flag-seal-spark', 6, 6, 3, ctx => {
    const g = ctx.createRadialGradient(3, 3, 0, 3, 3, 3);
    g.addColorStop(0, 'rgba(255, 250, 220, 1)'); g.addColorStop(0.4, 'rgba(255, 214, 110, .9)'); g.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 6, 6);
  });
}

// 13x13 pixel icons for the tracker, outlined in ink.
const ICONS = {
  guardian: {
    rows: ['......y......', '.....yGy.....', '....yGGGy....', '...GGGGGGG...', '..kGGGGGGGk..', '..sSSSSSSSs..',
      '.sSdSSSSSdSs.', '.sSSSSnSSSSs.', '.sSwSmmmSwSs.', '..sSSSSSSSs..', '...sSSSSSs...', '....sssss....'],
    colors: { y: '#fff0b0', G: '#e9b949', k: '#9a6a1f', S: '#93a678', s: '#5f704c', d: '#2a1608', n: '#6e7d58', m: '#3a1d10', w: '#f4ecd6' }
  },
  lotus: {
    rows: ['......P......', '.....PpP.....', '..P..PpP..P..', '.PpP.PpP.PpP.', '.PppPPpPPppP.', '..PppPpPppP..',
      '...PpppppP...', '....PPPPP....', '.ggggggggggg.', '..ggggggggg..'],
    colors: { P: '#e9789c', p: '#ffc6d6', g: '#5f9a5a' }
  }
};

function iconTexture(scene, kind) {
  const key = `seal-icon-${kind}`;
  if (scene.textures.exists(key)) return key;
  const { rows, colors } = ICONS[kind];
  const t = scene.textures.createCanvas(key, 15, 15), ctx = t.context;
  const on = (x, y) => rows[y]?.[x] && rows[y][x] !== '.';
  for (let y = -1; y <= rows.length; y++) for (let x = -1; x <= 13; x++) {
    if (on(x, y)) continue;
    if ([-1, 0, 1].some(dy => [-1, 0, 1].some(dx => on(x + dx, y + dy)))) { ctx.fillStyle = INK; ctx.fillRect(x + 1, y + 1, 1, 1); }
  }
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') { ctx.fillStyle = colors[c]; ctx.fillRect(x + 1, y + 1, 1, 1); } }));
  t.refresh();
  t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

/* ---------- dark rim outline (WebGL only; skipped on canvas) ---------- */

export function addRimOutline(scene, obj, screenPx = 1.6) {
  if (!obj?.preFX || obj.rimOutline) return;
  const zoom = scene.cameras.main.zoom;
  const distance = Phaser.Math.Clamp(Math.round(screenPx / (Math.abs(obj.scaleX) * zoom)), 2, 10);
  obj.preFX.padding = distance + 2;
  obj.rimOutline = obj.preFX.addGlow(INK_HEX, 3, 0, false, 0.12, distance);
}

/* ---------- the seal ---------- */

class FlagSeal {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.base = scene.finishFlagBase;
    this.banner = scene.finishFlag;
    this.opened = false;
    this.unsealed = false;
    this.nextBounce = 0;
    sealTextures(scene);
    const { x, y } = this.base;
    const zoom = scene.cameras.main.zoom;

    // Sealed flag: dull bronze and lowered behind the chains.
    this.raisedY = this.banner.getData('raisedY');
    this.banner.setY(y - 45).setTint(0xc9b58e);
    this.banner.sealed = true;            // no idle sparkles while sealed
    this.banner.setWind?.('limp');

    this.barrier = scene.add.image(x + 12, y - 54, 'flag-seal-barrier').setScale(0.5).setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45);
    this.glow = scene.add.image(x + BOX.left, y + BOX.top, 'flag-seal-glow').setOrigin(0).setScale(1 / RES)
      .setDepth(1.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    this.chains = scene.add.image(x + BOX.left, y + BOX.top, 'flag-seal-chains').setOrigin(0).setScale(1 / RES).setDepth(2);
    this.pulse = [
      scene.tweens.add({ targets: this.barrier, alpha: { from: 0.32, to: 0.7 }, scaleX: { from: 0.5, to: 0.52 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      scene.tweens.add({ targets: this.glow, alpha: { from: 0.35, to: 0.9 }, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    ];

    // Hint above the flag, ~20px tall on screen at any zoom, dark outline for bright skies.
    this.hint = scene.add.text(x + 12, y - 101, cfg.hint, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: `${(20 / zoom).toFixed(2)}px`, fontStyle: 'bold',
      color: '#ffe7a8', stroke: INK, strokeThickness: Math.max(2, 7 / zoom), align: 'center'
    }).setOrigin(0.5, 1).setDepth(12).setResolution(Math.ceil(zoom * 2))
      .setShadow(0, 1 / zoom * 2, 'rgba(0,0,0,.6)', 3 / zoom, true, true);
    this.hintY = this.hint.y;

    this.buildTracker();
    this.applyOutlines();
    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
  }

  isOpen() { return this.opened || !!this.cfg.isOpen(); }

  /* ---------- HUD tracker + edge arrow ---------- */
  buildTracker() {
    const s = this.scene, hud = s.hud;
    if (!hud?.container) return;
    this.hudScale = hud.uiScale || 1;
    const t = this.tracker = s.add.container(8, 42);
    this.trackerBg = s.add.graphics();
    this.trackerIcon = s.add.image(17, 15, iconTexture(s, this.cfg.icon)).setScale(2);
    this.trackerText = s.add.text(34, 15, this.cfg.objective, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px', fontStyle: 'bold',
      color: '#fff3cf', stroke: INK, strokeThickness: 4
    }).setOrigin(0, 0.5).setResolution(2);
    this.trackerCheck = s.add.graphics();
    t.add([this.trackerBg, this.trackerIcon, this.trackerText, this.trackerCheck]);
    this.drawTracker();
    // Edge arrow pointing at the objective (or at the flag once it is open) when off-screen.
    this.arrow = s.add.container(0, 0).setVisible(false);
    const g = s.add.graphics();
    g.fillStyle(INK_HEX, 1).fillTriangle(15, 0, -6, -11, -6, 11);
    g.fillStyle(0xf2c35a, 1).fillTriangle(11, 0, -3.5, -7.5, -3.5, 7.5);
    g.fillStyle(0xfff0b0, 1).fillTriangle(11, 0, -3.5, -7.5, -1, -2);
    this.arrowHead = g;
    this.arrowIcon = s.add.image(0, 0, iconTexture(s, this.cfg.icon)).setScale(2);
    this.arrow.add([g, this.arrowIcon]);
    hud.container.add([t, this.arrow]);
  }

  drawTracker() {
    const done = this.opened;
    const w = 34 + this.trackerText.width + 34, h = 30;
    this.trackerBg.clear()
      .fillStyle(0x000000, 0.3).fillRoundedRect(1, 2, w, h, 9)
      .fillStyle(0x0c141f, 0.82).fillRoundedRect(0, 0, w, h, 9)
      .lineStyle(1.5, done ? 0x9ee59b : 0xd9b46a, 0.95).strokeRoundedRect(0.5, 0.5, w - 1, h - 1, 9);
    const cx = w - 18, cy = 15;
    this.trackerCheck.clear().setPosition(cx, cy)
      .fillStyle(0x060a10, 0.9).fillRoundedRect(-7, -7, 14, 14, 3)
      .lineStyle(1.5, done ? 0x9ee59b : 0xe4bd67, 1).strokeRoundedRect(-7, -7, 14, 14, 3);
    if (done) {
      this.trackerCheck.lineStyle(4, INK_HEX, 1).beginPath().moveTo(-4, 0).lineTo(-1, 3.5).lineTo(5, -4).strokePath();
      this.trackerCheck.lineStyle(2.4, 0x9ee59b, 1).beginPath().moveTo(-4, 0).lineTo(-1, 3.5).lineTo(5, -4).strokePath();
    }
  }

  updateArrow() {
    if (!this.arrow) return;
    const s = this.scene, cam = s.cameras.main, view = cam.worldView;
    let target = null;
    if (!s.isLevelFinished && !s.stageClearOpen) {
      if (this.opened) target = { x: this.base.x + 12, y: this.base.y - 50, flag: true };
      else {
        const t = this.cfg.target();
        if (t?.active !== false && t) target = { x: t.x, y: t.y - (t.displayHeight || 0) / 2 };
      }
    }
    const margin = 6;
    if (!target || (target.x > view.x - margin && target.x < view.right + margin && target.y > view.y - margin && target.y < view.bottom + margin)) {
      this.arrow.setVisible(false);
      return;
    }
    const k = cam.zoom / this.hudScale, W = 800 / this.hudScale, H = 450 / this.hudScale;
    const dx = (target.x - view.centerX) * k, dy = (target.y - view.centerY) * k;
    const t = Math.min((W / 2 - 30) / Math.max(1e-3, Math.abs(dx)), (H / 2 - 34) / Math.max(1e-3, Math.abs(dy)));
    const angle = Math.atan2(dy, dx), bob = Math.sin(s.time.now / 160) * 3;
    const ax = W / 2 + dx * t, ay = Math.max(84, H / 2 + dy * t);
    this.arrow.setVisible(true).setPosition(ax + Math.cos(angle) * bob, ay + Math.sin(angle) * bob);
    this.arrowHead.setRotation(angle).setPosition(Math.cos(angle) * 8, Math.sin(angle) * 8);
    this.arrowIcon.setPosition(-Math.cos(angle) * 12, -Math.sin(angle) * 12)
      .setVisible(!target.flag);
  }

  /* ---------- contrast ---------- */
  // Guardian and flag only: the player never gets a glow, shadow or outline.
  applyOutlines() {
    const s = this.scene;
    [s.finishFlagPole, this.banner, ...this.cfg.outline()].forEach(obj => { if (obj !== s.player) addRimOutline(s, obj); });
  }

  /* ---------- touching the sealed flag ---------- */
  touch(player) {
    const s = this.scene, now = s.time.now;
    if (now < this.nextBounce) return;
    this.nextBounce = now + 450;
    // Push away from the pole (never into it); a small hop clears the trigger zone.
    const dir = player.x <= this.base.x + 6 ? -1 : 1;
    player.setVelocity(dir * 210, Math.min(player.body.velocity.y, -150));
    s.pushbackUntil = now + 240;
    sfx(s).play('locked');
    s.cameras.main.shake(90, 0.003);
    this.hint.setColor('#ffb48a');
    s.tweens.add({ targets: this.hint, scale: 1.16, duration: 110, yoyo: true, repeat: 1, ease: 'Sine.easeOut',
      onComplete: () => { if (!this.opened) this.hint.setColor('#ffe7a8'); } });
    s.tweens.add({ targets: this.barrier, alpha: 1, duration: 90, yoyo: true });
    s.tweens.add({ targets: [this.chains, this.glow], x: `+=${dir * -1.2}`, duration: 45, yoyo: true, repeat: 2 });
  }

  /* ---------- objective done ---------- */
  update() {
    if (!this.opened && this.cfg.isOpen()) this.open();
    // Keep the hint fully on screen while the flag is near the edge of the view.
    if (this.hint?.active) {
      const v = this.scene.cameras.main.worldView, half = this.hint.displayWidth / 2 + 4, fx = this.base.x + 12;
      const flagNearView = fx > v.x - 20 && fx < v.right + 20;
      this.hint.x = flagNearView && half * 2 < v.width ? Phaser.Math.Clamp(fx, v.x + half, v.right - half) : fx;
      // ...and below the HUD pills (taller on phones), with a gentle bob while sealed.
      const cam = this.scene.cameras.main, hudBottom = 46 * (this.hudScale || 1) / cam.zoom;
      const bob = this.unsealed ? 0 : Math.sin(this.scene.time.now / 350) * 1.2;
      this.hint.y = Math.max(this.hintY, v.y + hudBottom + this.hint.displayHeight) + bob;
    }
    if (this.opened && !this.unsealed && this.flagOnScreen()) this.unseal();
    this.updateArrow();
  }

  flagOnScreen() {
    // Well inside the view, so the whole shatter is seen.
    const v = this.scene.cameras.main.worldView, x = this.base.x + 12, y = this.base.y - 50;
    const inset = Math.min(60, v.width * 0.18);
    return x > v.x + inset && x < v.right - inset && y > v.y && y < v.bottom;
  }

  open() {
    this.opened = true;
    const s = this.scene;
    if (this.trackerText) {
      this.trackerText.setText(this.cfg.done).setColor('#c8f5c0');
      this.drawTracker();
      this.trackerCheck.setScale(0.2);
      s.tweens.add({ targets: this.trackerCheck, scale: 1, duration: 420, ease: 'Back.Out', easeParams: [3] });
      s.tweens.add({ targets: this.tracker, scale: 1.1, duration: 140, yoyo: true, ease: 'Sine.easeOut' });
    }
    // If the flag is off-screen the unseal plays when it comes into view; tick now.
    if (!this.flagOnScreen()) sfx(s).play('checkpoint');
  }

  unseal() {
    this.unsealed = true;
    const s = this.scene, { x, y } = this.base;
    const cx = x + BOX.left + CROSS.x, cy = y + BOX.top + CROSS.y;
    sfx(s).play('unseal');
    this.pulse.forEach(t => t.stop());
    // Chains shatter: gold link fragments and stone chips from both chains and the seal.
    const burst = (texture, count, speed) => {
      const emitter = s.add.particles(0, 0, texture, {
        speed, angle: { min: 0, max: 360 }, gravityY: 420, lifespan: { min: 600, max: 1100 },
        rotate: { min: 0, max: 360 }, scale: { start: 1 / RES * 1.4, end: 1 / RES * 0.6 }, alpha: { start: 1, end: 0 }, emitting: false
      }).setDepth(13);
      for (const [ax, ay, bx, by] of CHAINS) {
        for (let i = 0; i <= 6; i++) {
          const f = i / 6;
          emitter.explode(Math.ceil(count / 14), x + BOX.left + ax + (bx - ax) * f, y + BOX.top + ay + (by - ay) * f);
        }
      }
      s.time.delayedCall(1300, () => emitter.destroy());
      return emitter;
    };
    burst('flag-seal-shard', 40, { min: 50, max: 150 });
    burst('flag-seal-chip', 18, { min: 40, max: 120 });
    const sparks = s.add.particles(cx, cy, 'flag-seal-spark', {
      speed: { min: 30, max: 110 }, lifespan: 900, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', emitting: false
    }).setDepth(14);
    sparks.explode(26);
    s.time.delayedCall(1000, () => sparks.destroy());
    this.chains.destroy();
    s.tweens.add({ targets: this.glow, alpha: 0, scale: this.glow.scale * 1.4, duration: 260, onComplete: () => this.glow.destroy() });
    s.tweens.add({ targets: this.barrier, alpha: 0, scaleX: 0.9, duration: 500, ease: 'Cubic.easeOut', onComplete: () => this.barrier.destroy() });
    // The flag turns gold (white flash) and rises up the pole.
    this.banner.sealed = false;
    this.banner.setWind?.('gust', 1700, 'normal');   // whips free, then settles into the normal wave
    this.banner.clearTint().setTintFill(0xfff4c8);
    s.time.delayedCall(90, () => this.banner.active && this.banner.clearTint());
    s.tweens.add({ targets: this.banner, y: this.base.y - 58, duration: 900, delay: 120, ease: 'Back.Out' });
    // Hint becomes the good news, then fades.
    this.hint.setText('The way is open!').setColor('#fff0b0');
    s.tweens.add({ targets: this.hint, scale: { from: 0.6, to: 1 }, duration: 380, ease: 'Back.Out' });
    s.tweens.add({ targets: this.hint, alpha: 0, delay: 4200, duration: 700, onComplete: () => this.hint.destroy() });
  }
}

export function installFlagSeal(scene) {
  if (!scene.finishFlag || !scene.finishFlagBase) return null;
  const cfg = sealConfig(scene);
  return cfg ? new FlagSeal(scene, cfg) : null;
}
