// The Khmer stilt-house finish (every stage that ends at the house): a warm glowing doorway,
// sparkles on the stairs, a waving gold flag on the roof, village props in front of the house,
// a middle depth layer of palms / stilt houses / temple towers, and the walk-in finish
// (the hero climbs the stairs, steps through the door, the door flares, then level clear).
import { addRoofFlag } from './finishFlag.js';

// House artwork (1484 x 1060) is shown 112 x 80 world px, bottom-centred on the ground.
const HOUSE_W = 112, HOUSE_H = 80, ART_W = 1484, ART_H = 1060;
const K = HOUSE_W / ART_W;
const art = (hx, base, px, py) => ({ x: hx + (px - ART_W / 2) * K, y: base + (py - ART_H) * K });
// Where the stilts and stair posts end in the artwork (measured from its alpha channel):
// front stilts at y 1003, back stilts at 948 (drawn further back), stair posts at 1043.
const FRONT_FOOT = 1003, BACK_FOOT = 948, STAIR_FOOT = 1043;
const STILT_FEET = [[142, FRONT_FOOT], [1340, FRONT_FOOT], [288, BACK_FOOT], [1191, BACK_FOOT], [615, STAIR_FOOT], [868, STAIR_FOOT]];
const SINK = 4;   // world px the front stilts sink into the ground (hides any seam)

// Top of the solid ground under world x (first colliding tile below the sky band).
function groundTopAt(scene, x) {
  const layer = scene.groundLayer, mapH = scene.map?.heightInPixels || 270;
  if (!layer) return null;
  for (let y = 120; y < mapH; y += 2) {
    const tile = layer.getTileAtWorldXY(x, y);
    if (tile && tile.collides) return tile.pixelY;
  }
  return null;
}

const hex = c => Phaser.Display.Color.HexStringToColor(c).color;
function mixColor(a, b, t) {
  const ca = Phaser.Display.Color.IntegerToColor(a), cb = Phaser.Display.Color.IntegerToColor(b);
  return Phaser.Display.Color.GetColor(
    Math.round(ca.red + (cb.red - ca.red) * t), Math.round(ca.green + (cb.green - ca.green) * t), Math.round(ca.blue + (cb.blue - ca.blue) * t));
}

/* ---------- textures (drawn once, shared by every house stage) ---------- */

function canvas(scene, key, w, h, res, draw, filter = 'LINEAR') {
  if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, Math.ceil(w * res), Math.ceil(h * res));
  t.context.imageSmoothingEnabled = false;
  t.context.scale(res, res);
  draw(t.context);
  t.refresh();
  t.setFilter(Phaser.Textures.FilterMode[filter]);
  return key;
}

function prepareTextures(scene) {
  // Warm lamp-lit doorway that fills the dark door opening.
  canvas(scene, 'house-door-light', 11, 16, 4, ctx => {
    const g = ctx.createLinearGradient(0, 0, 0, 16);
    g.addColorStop(0, '#ffcf72'); g.addColorStop(0.55, '#f5a346'); g.addColorStop(1, '#d9772c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 11, 16);
    const c = ctx.createRadialGradient(5.5, 7, 0.5, 5.5, 7, 6);
    c.addColorStop(0, 'rgba(255, 238, 180, .8)'); c.addColorStop(1, 'rgba(255, 238, 180, 0)');
    ctx.fillStyle = c; ctx.fillRect(0, 0, 11, 16);
    ctx.fillStyle = 'rgba(120, 60, 20, .35)'; ctx.fillRect(0, 0, 11, 1.2);   // lintel shadow
  });
  canvas(scene, 'house-glow', 64, 64, 1, ctx => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 214, 130, 1)'); g.addColorStop(0.35, 'rgba(255, 190, 100, .55)'); g.addColorStop(1, 'rgba(255, 170, 80, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  });
  // Contact patch: soft dark ellipse.
  canvas(scene, 'house-contact', 32, 8, 2, ctx => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(22, 14, 6, .55)'); g.addColorStop(0.6, 'rgba(22, 14, 6, .25)'); g.addColorStop(1, 'rgba(22, 14, 6, 0)');
    ctx.save(); ctx.scale(1, 0.25); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(16, 16, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  });
  // Grass tuft with a little dirt (a sand mound on beach stages) around each stilt foot.
  canvas(scene, 'house-tuft', 14, 7, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    px(1, 5, 12, 2, '#5a3e22'); px(2, 4, 10, 1, '#6e4e2c'); px(3, 6, 2, 1, '#3e2a16'); px(9, 6, 1, 1, '#8a6a42');
    for (const [x, h, c] of [[1, 3, '#3f6f2e'], [2, 4, '#5f9a43'], [4, 2, '#4c7f36'], [9, 3, '#5f9a43'], [11, 4, '#3f6f2e'], [12, 2, '#7fb04e']]) px(x, 5 - h, 1, h, c);
  }, 'NEAREST');
  canvas(scene, 'house-tuft-sand', 14, 7, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    px(1, 5, 12, 2, '#cdb47c'); px(2, 4, 10, 1, '#e3cf9a'); px(4, 3, 6, 1, '#efe0b4'); px(3, 6, 1, 1, '#a88e58'); px(10, 5, 1, 1, '#a88e58');
  }, 'NEAREST');
  canvas(scene, 'house-step', 26, 5, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    px(0, 2, 26, 3, '#4a331c'); px(1, 1, 24, 2, '#7a5a36'); px(2, 1, 22, 1, '#9a7a4e');
    for (const [x, h] of [[0, 2], [1, 3], [23, 3], [25, 2]]) px(x, 3 - h, 1, h, '#5f9a43');
  }, 'NEAREST');
  // Laterite stone footing (only for stages with uneven ground under the house).
  canvas(scene, 'house-footing', 18, 18, 1, ctx => {
    ctx.fillStyle = '#5c3a26'; ctx.fillRect(0, 0, 18, 18);
    ctx.fillStyle = '#9c5c3a'; ctx.fillRect(0, 0, 17, 8); ctx.fillRect(0, 9, 8, 8); ctx.fillRect(9, 9, 8, 8);
    ctx.fillStyle = '#b8744c'; ctx.fillRect(0, 0, 17, 1); ctx.fillRect(0, 9, 8, 1); ctx.fillRect(9, 9, 8, 1);
    ctx.fillStyle = '#7a4a2e'; for (const [x, y] of [[3, 3], [12, 5], [5, 12], [14, 14]]) ctx.fillRect(x, y, 2, 1);
  }, 'NEAREST');
  // Pixel-art village props.
  canvas(scene, 'prop-jar', 10, 12, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    px(2, 0, 6, 1, '#4a2414'); px(3, 1, 4, 1, '#8a4426');
    px(1, 2, 8, 1, '#4a2414'); px(0, 3, 10, 7, '#4a2414'); px(1, 10, 8, 1, '#4a2414'); px(2, 11, 6, 1, '#4a2414');
    px(1, 3, 8, 7, '#b5623a'); px(2, 10, 6, 1, '#8a4426'); px(2, 2, 6, 1, '#c8744a');
    px(2, 4, 2, 3, '#e09a6a'); px(6, 7, 3, 3, '#8a4426'); px(1, 6, 8, 1, '#9a4c2c');
  }, 'NEAREST');
  canvas(scene, 'prop-fence', 34, 14, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    for (let x = 0; x < 34; x += 4) { px(x, 1, 3, 13, '#4d3d16'); px(x + 0.5, 1.5, 2, 12.5, x % 8 ? '#c9b46a' : '#b39f55'); px(x + 0.5, 1.5, 0.8, 12.5, '#e6d58e'); px(x, 5, 3, 0.6, '#8f7d3e'); }
    for (const y of [4, 9]) { px(0, y, 34, 1.6, '#4d3d16'); px(0, y + 0.3, 34, 1, '#a8924a'); }
    for (let x = 1; x < 34; x += 8) px(x, 3.6, 1.6, 2.4, '#5d3a1c');
  }, 'NEAREST');
  canvas(scene, 'prop-banana', 22, 26, 2, ctx => {
    const leaf = (x0, y0, x1, y1, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 4, x1, y1); ctx.stroke(); };
    ctx.fillStyle = '#5b6b2a'; ctx.fillRect(10, 11, 2.4, 15); ctx.fillStyle = '#7f8f3c'; ctx.fillRect(10.4, 11, 0.8, 15);
    for (const [x1, y1, c] of [[1, 13, '#3f6f2e'], [21, 12, '#3f6f2e'], [3, 4, '#5f9a43'], [19, 3, '#5f9a43'], [11, 0.5, '#8cc05a']]) {
      leaf(11, 11, x1, y1, 4.2, '#28461c'); leaf(11, 11, x1, y1, 3, c);
    }
    ctx.fillStyle = '#c9b245'; for (const [x, y] of [[13, 14], [14.5, 15.5], [13, 16.5]]) ctx.fillRect(x, y, 2, 1.4);
    ctx.fillStyle = '#7a2f3a'; ctx.fillRect(13.5, 18, 1.5, 2.2);
  });
  // Chicken: frame 0 standing, frame 1 pecking.
  canvas(scene, 'prop-chicken', 18, 8, 2, ctx => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const body = ox => { px(ox + 1, 3, 6, 3, '#3b2414'); px(ox + 2, 3, 4, 3, '#f1e6cf'); px(ox + 1, 2, 2, 2, '#3b2414'); px(ox + 1.4, 2.4, 1.4, 1.2, '#c8814a'); px(ox + 3, 6, 0.8, 2, '#d99a2b'); px(ox + 5, 6, 0.8, 2, '#d99a2b'); px(ox + 2.5, 4, 2, 1, '#d8c7a6'); };
    body(0); px(6, 1, 2, 3, '#3b2414'); px(6.3, 1.3, 1.4, 2.4, '#f1e6cf'); px(6.5, 0, 1, 1.2, '#d33a2c'); px(8, 2.2, 1, 0.8, '#e2a23a'); px(7, 1.8, 0.6, 0.6, '#140a04');
    body(9); px(15, 4, 2, 3, '#3b2414'); px(15.3, 4.3, 1.4, 2.4, '#f1e6cf'); px(15.5, 3.2, 1, 1.2, '#d33a2c'); px(16.8, 6.4, 1, 0.8, '#e2a23a');
  }, 'NEAREST');
  const chicken = scene.textures.get('prop-chicken');
  if (!chicken.has('stand')) { chicken.add('stand', 0, 0, 0, 18, 16); chicken.add('peck', 0, 18, 0, 18, 16); }
  canvas(scene, 'prop-cloth', 5, 7, 2, ctx => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 5, 7); ctx.fillStyle = '#d9d9d9'; ctx.fillRect(0, 0, 5, 0.8); });
  canvas(scene, 'prop-krama', 5, 7, 2, ctx => {
    ctx.fillStyle = '#f2ead8'; ctx.fillRect(0, 0, 5, 7); ctx.fillStyle = '#b8323a';
    for (let y = 0; y < 7; y += 2) for (let x = (y / 2) % 2; x < 5; x += 2) ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(0, 6, 5, 1);
  });
  // Middle-layer silhouettes, drawn light grey so a haze tint colours them per stage.
  canvas(scene, 'mid-palm', 26, 62, 2, ctx => {
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(12, 14, 2, 48);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + i * Math.PI / 13, r = 9 + (i % 3);
      ctx.beginPath(); ctx.moveTo(13, 13); ctx.lineTo(13 + Math.cos(a) * r - 1.5, 13 + Math.sin(a) * r * 0.75); ctx.lineTo(13 + Math.cos(a) * r + 1.5, 13 + Math.sin(a) * r * 0.75 + 1); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(13, 13, 5.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillRect(2 + i * 4, 13 + (i % 2), 3, 5 - (i % 2)); }
  });
  canvas(scene, 'mid-stilthouse', 48, 36, 2, ctx => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(2, 15); ctx.lineTo(10, 6); ctx.lineTo(38, 6); ctx.lineTo(46, 15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, 7); ctx.lineTo(24, 0); ctx.lineTo(30, 7); ctx.closePath(); ctx.fill();
    ctx.fillRect(1, 12, 2, 4); ctx.fillRect(45, 12, 2, 4);
    ctx.fillStyle = '#e4e4e4'; ctx.fillRect(7, 15, 34, 9);
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(13, 17, 4, 4); ctx.fillRect(31, 17, 4, 4); ctx.fillRect(22, 16, 4, 8);
    ctx.fillStyle = '#e0e0e0'; ctx.fillRect(5, 24, 38, 2);
    for (const x of [8, 18, 30, 40]) ctx.fillRect(x, 26, 2, 10);
  });
  canvas(scene, 'far-towers', 92, 60, 2, ctx => {
    const tower = (x, base, w, h) => {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 7; i++) {
        const tw = w * (1 - i / 8), ty = base - (i + 1) * h / 8;
        ctx.fillRect(x - tw / 2, ty, tw, h / 8 + 0.6);
        ctx.fillStyle = i % 2 ? '#ececec' : '#ffffff';
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x - w * 0.12, base - h * 0.85); ctx.lineTo(x, base - h - 3); ctx.lineTo(x + w * 0.12, base - h * 0.85); ctx.closePath(); ctx.fill();
    };
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(4, 48, 84, 12);
    tower(20, 52, 16, 34); tower(72, 52, 16, 34); tower(46, 50, 22, 48);
    ctx.fillStyle = '#d6d6d6'; for (let x = 6; x < 88; x += 6) ctx.fillRect(x, 50, 2, 3);
  });
  // Thin stepped sunset cloud streak in the same pixel style as the painted sky.
  canvas(scene, 'sky-cloud', 72, 10, 1, ctx => {
    const rows = [[22, 26, '#ffe1a8'], [12, 44, '#ffcf8f'], [4, 62, '#f7b878'], [10, 52, '#ec9d68'], [20, 30, '#df8a5e']];
    rows.forEach(([x, w, c], y) => { ctx.fillStyle = c; ctx.fillRect(x, y * 2, w, 2); });
  }, 'NEAREST');
}

/* ---------- the house ---------- */

export function addFinishHouse(scene, map, { midground = true, softSky = false } = {}) {
  prepareTextures(scene);
  const hx = (map.width - 7) * 18 + 9;
  const zoom = scene.cameras.main.zoom || 2.2;

  // Ground the house on the real ground line under it, not a fixed Y.
  const samples = [];
  for (let x = hx - HOUSE_W / 2 - 4; x <= hx + HOUSE_W / 2 + 4; x += 6) samples.push(groundTopAt(scene, x));
  const found = samples.filter(v => v !== null);
  const counts = new Map();
  found.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  const ground = found.length ? [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0] : 11 * 18;
  const uneven = found.length !== samples.length || found.some(v => v !== ground);
  // Bottom edge of the artwork, placed so the front stilts sink SINK px; the back stilts then just touch.
  const base = ground + (ART_H - FRONT_FOOT) * K + SINK;
  scene.textures.get('khmer-finish-house').setFilter(Phaser.Textures.FilterMode.LINEAR);
  const house = scene.add.image(hx, base, 'khmer-finish-house').setOrigin(0.5, 1).setDisplaySize(HOUSE_W, HOUSE_H).setDepth(-1);
  scene.finishHouseGround = { ground, base, uneven, samples };

  // Uneven ground or a gap under the house: a flat laterite footing, solid to stand on.
  if (uneven) {
    const lowest = Math.max(...found, ground) + 18;
    scene.add.tileSprite(hx, ground, HOUSE_W + 14, lowest - ground + 2, 'house-footing').setOrigin(0.5, 0).setDepth(0.05);
    const block = scene.add.rectangle(hx, ground + (lowest - ground) / 2, HOUSE_W + 14, lowest - ground, 0, 0);
    scene.physics.add.existing(block, true);
    scene.finishHouseFooting = block;   // GameScene adds the player collider once the player exists
  }

  // Soft dark contact patch under the house and at every stilt foot (on the ground, behind the player).
  scene.add.image(hx, ground + 0.6, 'house-contact').setDisplaySize(HOUSE_W + 6, 6).setDepth(0).setAlpha(0.7);
  const sandy = /coast/.test(scene.levelConfig?.environment?.biome || '');
  for (const [px, foot] of STILT_FEET) {
    const x = hx + (px - ART_W / 2) * K;
    scene.add.image(x, ground + 0.4, 'house-contact').setDisplaySize(foot === STAIR_FOOT ? 6 : 9, 3).setDepth(0).setAlpha(0.85);
    scene.add.image(x, ground + 1, sandy ? 'house-tuft-sand' : 'house-tuft').setOrigin(0.5, 1).setScale(0.5)
      .setFlipX(px > ART_W / 2).setDepth(0);
  }
  // Dirt step at the foot of the stairs so the bottom tread meets the ground.
  scene.add.image(hx, ground + 1, sandy ? 'house-tuft-sand' : 'house-step').setOrigin(0.5, 1).setScale(0.5).setDepth(0);

  // Parallax objects are placed so they sit at `x` when the camera rests at the stage end.
  const worldW = map.widthInPixels, camEnd = Math.max(0, worldW - 800 / zoom);
  const parallaxX = (x, f) => x - camEnd * (1 - f);
  const sky = hex(scene.levelConfig?.skyColor || '#c9dcc8');

  /* sky softening (flat sunset skies) */
  if (softSky) {
    // Warm low sun glow behind the house roof.
    scene.add.image(parallaxX(hx + 30, 0.06), 128, 'house-glow').setScrollFactor(0.06, 1).setScale(5.2, 3.2)
      .setDepth(-19.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(1).setTint(0xffe9b8);
    for (const [x, y, s, a] of [[-150, 112, 1, 0.75], [-30, 98, 0.8, 0.6], [110, 118, 1.1, 0.7], [210, 104, 0.8, 0.55], [-250, 100, 0.9, 0.55]]) {
      const cloud = scene.add.image(parallaxX(hx + x, 0.14), y, 'sky-cloud').setScrollFactor(0.14, 1)
        .setScale(s).setDepth(-19.5).setAlpha(a);
      scene.tweens.add({ targets: cloud, x: cloud.x + 10, duration: 9000 + x * 7, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /* middle layer: distant temple towers, other stilt houses, sugar palms */
  if (midground) {
    const far = mixColor(sky, 0x2e2c38, 0.42), mid = mixColor(sky, 0x23221f, 0.6);
    const place = (key, x, f, scale, tint, depth, alpha = 1) =>
      scene.add.image(parallaxX(x, f), ground + 2, key).setOrigin(0.5, 1).setScrollFactor(f, 1).setScale(scale / 2).setTint(tint).setDepth(depth).setAlpha(alpha);
    place('far-towers', hx + 110, 0.35, 1, far, -16, 0.9);
    place('far-towers', hx - 230, 0.35, 0.8, far, -16, 0.85);
    place('mid-stilthouse', hx - 120, 0.62, 1, mid, -12);
    place('mid-stilthouse', hx + 150, 0.62, 0.85, mid, -12);
    for (const [dx, sc] of [[-190, 1.05], [-70, 0.95], [70, 1.1], [215, 0.9], [-300, 1]]) {
      const palm = place('mid-palm', hx + dx, 0.66, sc, mixColor(mid, 0x0e1a10, 0.15), -11);
      scene.tweens.add({ targets: palm, angle: { from: -1.2, to: 1.2 }, duration: 2600 + dx * 3, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /* glowing doorway */
  const door = art(hx, base, 742, 605);                  // centre of the door opening
  const doorLight = scene.add.image(door.x, door.y + 0.4, 'house-door-light').setScale(1 / 4).setDepth(-0.95).setAlpha(0.85);
  const doorGlow = scene.add.image(door.x, door.y, 'house-glow').setDepth(-0.9).setBlendMode(Phaser.BlendModes.ADD).setScale(0.55).setAlpha(0.65);
  const stairs = art(hx, base, 742, 1000);
  const stairGlow = scene.add.image(stairs.x, stairs.y, 'house-glow').setDepth(-0.92).setBlendMode(Phaser.BlendModes.ADD).setScale(0.75, 0.3).setAlpha(0.45);
  scene.tweens.add({ targets: doorGlow, alpha: { from: 0.35, to: 0.7 }, scale: { from: 0.5, to: 0.62 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens.add({ targets: [doorLight, stairGlow], alpha: '-=0.18', duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  /* gentle sparkles on the stairs */
  const snap = v => Math.round(v * zoom) / zoom;
  const sparkle = (x, y, rise, life, scale = 2) => {
    const s = scene.add.image(snap(x), snap(y), 'flag-sparkle').setDepth(-0.4).setScale(0);
    scene.tweens.add({ targets: s, scale: { from: 0.2, to: scale / zoom }, duration: life * 0.35, yoyo: true, hold: life * 0.2, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: s, y: snap(y - rise), alpha: 0, duration: life, ease: 'Sine.easeOut', onComplete: () => s.destroy() });
  };
  scene.time.addEvent({ delay: 650, loop: true, callback: () => {
    const v = scene.cameras.main.worldView;
    if (hx < v.x - 40 || hx > v.right + 40 || scene.isLevelFinished) return;
    const top = art(hx, base, 742, 740).y, bottom = ground - 2;
    sparkle(hx + (Math.random() - 0.5) * 12, top + Math.random() * (bottom - top), 7, 1100, 1.6);
  } });

  /* animated gold flag on the roof spire */
  const spire = art(hx, base, 742, 30);
  addRoofFlag(scene, spire.x, spire.y + 1, { poleHeight: 15, scale: 0.55, depth: -0.9 });

  /* village props: in front of the house, behind the player, no physics */
  const prop = (key, x, frame, depth = -0.5) => scene.add.image(x, ground + 1, key, frame).setOrigin(0.5, 1).setScale(0.5).setDepth(depth);
  prop('prop-banana', hx - 50, undefined, -0.6);
  prop('prop-banana', hx + 60, undefined, -0.6).setFlipX(true);
  prop('prop-fence', hx + 28, undefined, -0.55);
  prop('prop-jar', hx - 22);
  prop('prop-jar', hx - 31).setScale(0.38);
  // Laundry line between two posts, cloth swaying in the breeze.
  const lineL = hx - 84, lineR = hx - 60, lineY = ground - 15;
  const g = scene.add.graphics().setDepth(-0.58);
  g.fillStyle(0x4d3d16).fillRect(lineL - 0.6, lineY - 1, 1.2, 16).fillRect(lineR - 0.6, lineY - 1, 1.2, 16);
  g.lineStyle(0.5, 0x3a2a14, 1).beginPath().moveTo(lineL, lineY).lineTo((lineL + lineR) / 2, lineY + 1.6).lineTo(lineR, lineY).strokePath();
  [['prop-krama', 0xffffff, 4], ['prop-cloth', 0x5b7fb8, 11], ['prop-cloth', 0xe2b84a, 17]].forEach(([key, tint, dx], i) => {
    const cloth = scene.add.image(lineL + dx, lineY + 0.4 + (dx > 6 && dx < 18 ? 0.8 : 0.3), key).setOrigin(0.5, 0).setScale(0.5).setTint(tint).setDepth(-0.57);
    scene.tweens.add({ targets: cloth, angle: { from: -7, to: 7 }, duration: 1200 + i * 230, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 180 });
  });
  // Two chickens that wander a little and peck.
  for (const [cx, range] of [[hx - 38, 10], [hx + 44, 8]]) {
    const hen = scene.add.image(cx, ground + 0.5, 'prop-chicken', 'stand').setOrigin(0.5, 1).setScale(0.5).setDepth(-0.45);
    const wander = () => {
      if (!hen.active) return;
      const to = cx + (Math.random() - 0.5) * 2 * range;
      hen.setFlipX(to < hen.x);
      scene.tweens.add({ targets: hen, x: snap(to), duration: Math.abs(to - hen.x) * 90 + 200, ease: 'Linear',
        onComplete: () => {
          hen.setFrame('peck');
          scene.time.delayedCall(260, () => hen.active && hen.setFrame('stand'));
          scene.time.delayedCall(900 + Math.random() * 1500, wander);
        } });
    };
    scene.time.delayedCall(Math.random() * 1200, wander);
  }

  /* walk-in finish: up the stairs, through the door, the door flares, then level clear */
  const porchY = art(hx, base, 742, 722).y;
  return {
    x: hx, door, house,
    enter(player, done) {
      player.setFlipX(false).play('player-walk', true);
      scene.tweens.chain({ targets: player, tweens: [
        { x: hx, y: ground - 9, duration: 260, ease: 'Linear' },
        { y: porchY - 9, duration: 560, ease: 'Linear' },
        { y: porchY - 10, duration: 120, ease: 'Linear', onStart: () => player.play('player-idle', true) },
        { alpha: 0, scaleX: player.scaleX * 0.88, scaleY: player.scaleY * 0.94, duration: 320, ease: 'Sine.easeIn',
          onStart: () => {
            scene.tweens.add({ targets: doorLight, alpha: 1, duration: 200 });
            scene.tweens.killTweensOf(doorGlow);
            scene.tweens.add({ targets: doorGlow, alpha: 1, scale: 1.4, duration: 380, ease: 'Sine.easeOut' });
            for (let i = 0; i < 10; i++) sparkle(door.x + (Math.random() - 0.5) * 14, door.y + (Math.random() - 0.3) * 12, 16, 800, 2.2);
          } },
        { alpha: 0, duration: 200, onComplete: () => { player.setAlpha(1).setVisible(false); done?.(); } }
      ] });
    }
  };
}
