import { LEVEL6 } from './levels/level6Layout.js';
import { LEVEL8 } from './levels/level8Layout.js';

// Shared by every level: "Reach the golden flag". A carved gold pole on a sandstone plinth
// with a swallow-tailed gold banner and a Khmer lotus (kbach) pattern.
// Drawn at 2x and shown at half scale so the carving stays crisp under camera zoom.
const RES = 2;
const BANNER_W = 80, BANNER_H = 66, BANNER_SCALE = 0.35;   // banner art units; 28 x 23 world px on screen
const STRIPS = 10;                                          // vertical strips that ripple pole -> tip

function bannerPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(25, 15); ctx.lineTo(50, 15);
  ctx.bezierCurveTo(61, 15, 60, 25, 75, 25);
  ctx.lineTo(102, 25); ctx.lineTo(92, 35); ctx.lineTo(102, 43);
  ctx.lineTo(92, 53); ctx.lineTo(102, 62); ctx.lineTo(92, 72);
  ctx.lineTo(102, 79); ctx.lineTo(73, 79);
  ctx.bezierCurveTo(57, 79, 64, 69, 47, 69);
  ctx.lineTo(25, 69); ctx.closePath();
}

// Small carved lotus diamond with side curls (kbach), centred on x, y.
function kbach(ctx, x, y, s, dark, light) {
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.8, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.35, y); ctx.lineTo(x, y + s * 0.45); ctx.lineTo(x - s * 0.35, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 0.9;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.arc(x + side * s * 1.25, y - s * 0.35, s * 0.42, side > 0 ? Math.PI * 0.6 : Math.PI * 1.4, side > 0 ? Math.PI * 2.1 : Math.PI * 2.9 - Math.PI * 2, side < 0); ctx.stroke();
  }
}

function drawBanner(ctx) {
  ctx.save();
  bannerPath(ctx); ctx.clip();
  const gold = ctx.createLinearGradient(0, 15, 0, 80);
  gold.addColorStop(0, '#ffe08a'); gold.addColorStop(0.45, '#f2bf4a'); gold.addColorStop(1, '#c98a24');
  ctx.fillStyle = gold; ctx.fillRect(25, 10, 79, 75);
  // Soft cloth folds.
  ctx.fillStyle = 'rgba(255, 246, 200, .35)';
  for (const x of [40, 66, 88]) ctx.fillRect(x, 10, 3, 75);
  ctx.fillStyle = 'rgba(120, 60, 10, .18)';
  for (const x of [52, 78]) ctx.fillRect(x, 10, 4, 75);
  // Lotus-petal bands above and below the motif row.
  const band = (y, flip) => {
    ctx.fillStyle = '#8a3a14'; ctx.fillRect(25, y, 79, 1.6);
    ctx.fillStyle = '#a8521d';
    for (let x = 27; x < 104; x += 5) {
      ctx.beginPath(); ctx.moveTo(x, y + (flip ? 0 : 1.6)); ctx.lineTo(x + 2.5, y + (flip ? -3 : 4.6)); ctx.lineTo(x + 5, y + (flip ? 0 : 1.6)); ctx.closePath(); ctx.fill();
    }
  };
  band(33, false);
  band(62, true);
  // Central row of carved kbach diamonds.
  for (const x of [35, 49, 63, 77, 90]) kbach(ctx, x, 47.5, 6, '#7a3416', '#fff0b8');
  ctx.restore();
  // Dark rim and a fine gold light line so the banner reads on bright sunsets.
  bannerPath(ctx);
  ctx.strokeStyle = '#4a2208'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); bannerPath(ctx); ctx.clip();
  ctx.strokeStyle = 'rgba(255, 240, 180, .7)'; ctx.lineWidth = 1;
  ctx.translate(0.8, 0.8); bannerPath(ctx); ctx.stroke();
  ctx.restore();
}

function drawPole(ctx) {
  // Dark outline, carved gold shaft, rings every 14px.
  ctx.fillStyle = '#2c1806'; ctx.fillRect(18.5, 10, 11, 171);
  const shaft = ctx.createLinearGradient(19, 0, 29, 0);
  shaft.addColorStop(0, '#8a5a1c'); shaft.addColorStop(0.35, '#ffe08a'); shaft.addColorStop(0.6, '#e3ac44'); shaft.addColorStop(1, '#8a5a1c');
  ctx.fillStyle = shaft; ctx.fillRect(20, 12, 8, 168);
  for (let y = 26; y < 166; y += 14) {
    ctx.fillStyle = '#6e4413'; ctx.fillRect(19, y, 10, 2.4);
    ctx.fillStyle = '#ffeaa0'; ctx.fillRect(19, y - 1, 10, 1);
    ctx.fillStyle = 'rgba(110, 68, 19, .55)';   // small carved diamond between rings
    ctx.beginPath(); ctx.moveTo(24, y + 5); ctx.lineTo(26, y + 7.5); ctx.lineTo(24, y + 10); ctx.lineTo(22, y + 7.5); ctx.closePath(); ctx.fill();
  }
  // Lotus-bud finial with a small spire.
  ctx.fillStyle = '#2c1806';
  ctx.beginPath(); ctx.moveTo(24, -1); ctx.bezierCurveTo(31, 5, 31, 10, 30, 14); ctx.lineTo(18, 14); ctx.bezierCurveTo(17, 10, 17, 5, 24, -1); ctx.fill();
  const bud = ctx.createLinearGradient(18, 0, 30, 0);
  bud.addColorStop(0, '#b97d26'); bud.addColorStop(0.4, '#fff0b0'); bud.addColorStop(1, '#c48a2c');
  ctx.fillStyle = bud;
  ctx.beginPath(); ctx.moveTo(24, 1); ctx.bezierCurveTo(29.5, 6, 29.5, 10, 28.6, 13); ctx.lineTo(19.4, 13); ctx.bezierCurveTo(18.5, 10, 18.5, 6, 24, 1); ctx.fill();
  ctx.strokeStyle = '#8a5a1c'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(24, 3); ctx.lineTo(24, 13); ctx.moveTo(21, 7); ctx.quadraticCurveTo(24, 11, 27, 7); ctx.stroke();
  // Khmer-inspired sandstone plinth: stepped terraces and a lotus-petal band.
  ctx.fillStyle = '#45372b'; ctx.fillRect(1, 185, 46, 5);
  ctx.fillStyle = '#a78351'; ctx.fillRect(2, 185, 44, 3);
  ctx.fillStyle = '#d9b779'; ctx.fillRect(4, 182, 40, 3);
  ctx.fillStyle = '#715437'; ctx.fillRect(7, 173, 34, 9);
  ctx.fillStyle = '#b58a53'; ctx.fillRect(8, 174, 32, 7);
  for (let x = 11; x <= 37; x += 6) {
    ctx.fillStyle = '#e5c587';
    ctx.beginPath(); ctx.moveTo(x, 173); ctx.lineTo(x + 2, 177);
    ctx.lineTo(x, 180); ctx.lineTo(x - 2, 177); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#715437'; ctx.fillRect(x, 177, 1, 3);
  }
  ctx.fillStyle = '#e5c587'; ctx.fillRect(6, 171, 36, 3);
  ctx.fillStyle = '#987246'; ctx.fillRect(10, 168, 28, 3);
  ctx.fillStyle = '#d9b779'; ctx.fillRect(12, 166, 24, 2);
}

function prepareFlagTextures(scene) {
  if (scene.textures.exists('golden-flag-pole')) return;
  const pole = scene.textures.createCanvas('golden-flag-pole', 104 * RES, 192 * RES);
  pole.context.scale(RES, RES);
  drawPole(pole.context);
  pole.refresh();
  // The cloth is separate so it can travel along the stationary pole.
  const banner = scene.textures.createCanvas('golden-flag-banner', 80 * RES, 66 * RES);
  banner.context.scale(RES, RES);
  banner.context.translate(-24, -15);
  drawBanner(banner.context);
  banner.refresh();
  // One shared set of strip frames reused by every flag (the cloth is never redrawn).
  const stripW = BANNER_W * RES / STRIPS;
  for (let i = 0; i < STRIPS; i++) banner.add(`strip${i}`, 0, i * stripW, 0, stripW, BANNER_H * RES);
  // Tiny 5x5 pixel-art sparkle (a plus with a bright core).
  const spark = scene.textures.createCanvas('flag-sparkle', 5, 5), sc = spark.context;
  sc.fillStyle = '#f2c35a'; sc.fillRect(2, 0, 1, 5); sc.fillRect(0, 2, 5, 1);
  sc.fillStyle = '#fff6cf'; sc.fillRect(1, 2, 3, 1); sc.fillRect(2, 1, 1, 3);
  spark.refresh();
  spark.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/* ---------- wind ---------- */

// Stronger on coast and highland levels, gentler in temples and jungle.
const WIND_BY_TERRAIN = {
  coast: 1.35, 'highland-forest': 1.3, 'cliff-temple': 1.3, 'crater-lake': 1.25, 'highland-falls': 1.3,
  'mekong-river': 1.05, 'river-islands': 1.05, 'floating-village': 1, 'rice-fields': 1, city: 0.9,
  'temple-jungle': 0.75, angkor: 0.75, 'forest-temple': 0.75, 'temple-lake': 0.8
};
function windStrength(scene) {
  const config = scene.levelConfig || {};
  const key = config.environment?.biome || config.province?.theme;
  return WIND_BY_TERRAIN[key] ?? 0.75;   // opening Angkor stages: gentle temple air
}

// Wind states the flag eases between: [amplitude (world px at the tip), speed (rad/s)].
const MODES = {
  limp: [0.35, 1.6],      // sealed: hangs nearly still
  normal: [2.1, 6.5],
  gust: [4.2, 13],        // just unsealed: whips hard, then settles
  fast: [3.3, 17]         // reached: flutters fast at the top of the pole
};

// A banner made of strip images in a container. Behaves like the old banner image for
// callers: y / setY / setVisible / getData('raisedY') / setTint / clearTint / setTintFill.
function createWavingBanner(scene, x, y, raisedY) {
  const zoom = scene.cameras.main.zoom;
  const scale = BANNER_SCALE / RES, stripWorld = BANNER_W * BANNER_SCALE / STRIPS;
  const banner = scene.add.container(x, y).setDepth(-1).setData('raisedY', raisedY);
  const strips = [];
  for (let i = 0; i < STRIPS; i++) {
    strips.push(scene.add.image(i * stripWorld, 0, 'golden-flag-banner', `strip${i}`).setOrigin(0, 0).setScale(scale));
  }
  banner.add(strips);
  const wind = windStrength(scene);
  const state = { mode: 'normal', amp: MODES.normal[0] * wind, speed: MODES.normal[1] * wind, phase: Math.random() * 6, until: 0, after: 'normal' };
  let tint = 0xffffff, fill = null;
  const mul = (a, b) => (((a >> 16 & 255) * (b >> 16 & 255) / 255) << 16) | (((a >> 8 & 255) * (b >> 8 & 255) / 255) << 8) | ((a & 255) * (b & 255) / 255);
  banner.setTint = color => { tint = color; fill = null; return banner; };
  banner.clearTint = () => { tint = 0xffffff; fill = null; return banner; };
  banner.setTintFill = color => { fill = color; return banner; };
  // mode: 'limp' | 'normal' | 'gust' | 'fast'; optional duration, then `after`.
  banner.setWind = (mode, duration = 0, after = 'normal') => {
    state.mode = mode; state.until = duration ? scene.time.now + duration : 0; state.after = after;
    return banner;
  };

  const update = (time, delta) => {
    if (!banner.active || !banner.visible) return;
    if (state.until && time >= state.until) { state.mode = state.after; state.until = 0; }
    const [tAmp, tSpeed] = MODES[state.mode];
    const k = state.mode === 'limp' ? 1 : wind;
    const ease = 1 - Math.exp(-delta / (state.mode === 'gust' || state.mode === 'fast' ? 120 : 650));
    state.amp += (tAmp * k - state.amp) * ease;
    state.speed += (tSpeed * k - state.speed) * ease;
    // Gentle, uneven gusting so the rhythm never looks mechanical.
    const t = time / 1000;
    const gustiness = 1 + 0.18 * Math.sin(t * 0.43) + 0.1 * Math.sin(t * 1.37 + 1.3);
    state.phase += state.speed * gustiness * delta / 1000;
    for (let i = 0; i < STRIPS; i++) {
      const u = (i + 0.5) / STRIPS;                  // 0 at the pole, 1 at the tip
      const wave = state.phase - u * 2.6 * Math.PI;  // ripple travels pole -> tip
      const lift = state.amp * Math.pow(u, 1.15) * Math.sin(wave);
      // Snap to whole screen pixels: crisp pixel-art movement, no sub-pixel shimmer.
      strips[i].y = Math.round(lift * zoom) / zoom;
      // Folds facing away from the light are a little darker.
      const shade = Math.round(255 * (0.9 + 0.1 * Math.cos(wave)) - (state.amp > 0.6 ? 0 : 6));
      if (fill !== null) strips[i].setTintFill(fill);
      else strips[i].setTint(mul(tint, (shade << 16) | (shade << 8) | shade));
    }
  };
  scene.events.on('update', update);
  banner.once('destroy', () => scene.events.off('update', update));
  scene.events.once('shutdown', () => scene.events.off('update', update));
  update(scene.time.now, 16);
  return banner;
}

// A few gold sparkles drift around the flag every ~1.5 s so players notice it.
function addIdleSparkles(scene, banner, poleX) {
  const zoom = scene.cameras.main.zoom;
  const snap = v => Math.round(v * zoom) / zoom;
  const emit = (count, spread, rise, life) => {
    for (let i = 0; i < count; i++) {
      const x = snap(poleX + 2 + Math.random() * 30), y = snap(banner.y + 2 + Math.random() * 22);
      const s = scene.add.image(x, y, 'flag-sparkle').setDepth(3).setScale(0).setAlpha(1);
      scene.tweens.add({ targets: s, scale: { from: 0.2, to: 1 / zoom * 2 }, duration: life * 0.35, yoyo: true, hold: life * 0.2, ease: 'Sine.easeOut' });
      scene.tweens.add({ targets: s, x: snap(x + (Math.random() - 0.5) * spread), y: snap(y - rise - Math.random() * rise),
        alpha: 0, duration: life, ease: 'Sine.easeOut', onComplete: () => s.destroy() });
    }
  };
  const timer = scene.time.addEvent({ delay: 1500, loop: true, callback: () => {
    const view = scene.cameras.main.worldView;
    if (!banner.active || !banner.visible || banner.sealed || poleX < view.x - 40 || poleX > view.right + 40) return;
    emit(2 + Math.floor(Math.random() * 2), 12, 8, 1100);
  } });
  banner.burst = () => emit(18, 46, 22, 900);
  banner.once('destroy', () => timer.remove());
}

// A small copy of the waving gold flag (same shared strips and wind) on a slim gold pole,
// used on the roof of the stilt-house finish. Returns the banner container.
export function addRoofFlag(scene, x, baseY, { poleHeight = 17, scale = 0.55, depth = -0.9 } = {}) {
  prepareFlagTextures(scene);
  if (!scene.textures.exists('roof-flag-pole')) {
    const t = scene.textures.createCanvas('roof-flag-pole', 4 * RES, (poleHeight + 3) * RES), ctx = t.context;
    ctx.scale(RES, RES);
    ctx.fillStyle = '#2c1806'; ctx.fillRect(1, 2, 2, poleHeight + 1);
    ctx.fillStyle = '#f2c35a'; ctx.fillRect(1.4, 2, 1.2, poleHeight + 1);
    ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(2, 1.6, 1.4, 0, Math.PI * 2); ctx.fill();
    t.refresh();
  }
  scene.add.image(x, baseY, 'roof-flag-pole').setOrigin(0.5, 1).setScale(1 / RES).setDepth(depth);
  const top = baseY - poleHeight;
  const banner = createWavingBanner(scene, x + 0.6, top, top).setScale(scale).setDepth(depth);
  return banner;
}

export function addFinishFlag(scene, map) {
  const column = map.width - 15;
  scene.groundLayer.forEachTile(tile => {
    if ((tile.x === column && tile.y >= 2 && tile.y <= 10) ||
        (tile.x === column + 1 && (tile.y === 3 || tile.y === 4))) {
      tile.alpha = 0;
      tile.setCollision(false, false, false, false);
    }
  });
  if (scene.currentLevel === 1) return null;
  prepareFlagTextures(scene);
  const poleX = scene.layout ? scene.layout.finish.x : scene.currentLevel === 6 ? LEVEL6.finish.x
    : scene.currentLevel === 8 ? LEVEL8.finish.x : column * 18 + 9;
  const baseY = scene.layout ? scene.layout.finish.floorY : scene.currentLevel === 6 ? LEVEL6.finish.floorY
    : scene.currentLevel === 8 ? LEVEL8.finish.floorY : 198;
  scene.finishFlagPole = scene.add.image(poleX, baseY, 'golden-flag-pole')
    .setOrigin(24 / 104, 190 / 192).setScale(0.5 / RES).setDepth(-1);
  scene.finishFlagBase = { x: poleX, y: baseY };
  // Waves halfway up the pole; slides to the top when the player reaches it (GameScene.reachGoal).
  const raisedY = baseY - (190 - 15) * 0.5;
  const banner = createWavingBanner(scene, poleX + 2, baseY - 58, raisedY);
  addIdleSparkles(scene, banner, poleX);
  return banner;
}
