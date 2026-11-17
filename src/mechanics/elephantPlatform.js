import { canvasTexture } from '../biomes/biomeArt.js';
import { safeColliders } from './helpers.js';
import { sfx } from '../audio/soundManager.js';

// A walking elephant whose saddle is a ride-on platform (Arcade carries the rider).
//   { type: 'elephantPlatform', minX, maxX, floorY, speed = 30 (px/s), pauseMs = 900,
//     startX = minX, startDir = 1 }
// minX/maxX bound the elephant's centre; floorY is the ground it walks on. Keep minX/maxX within
// ~34px of the valley walls so there is no gap to fall through when boarding. The legs have no
// body, so it never blocks.
//
// ART CONTRACT (so a hand-made sprite can replace the procedural one with no code changes):
//   assets/mech-elephant.png - 4 frames, each 72 x 52, facing RIGHT, walk cycle 0-3,
//   feet on the bottom row, saddle top at y = SADDLE_TOP, saddle spanning x = BACK_LEFT..BACK_RIGHT.
//   If the file exists it is loaded by GameScene.preload and used instead of the drawing below.

export const FRAME_W = 72, FRAME_H = 52;
export const SADDLE_TOP = 10;                  // top of the saddle cushion inside a frame
const BACK_LEFT = 11, BACK_RIGHT = 53;         // rideable span inside a frame
const BACK_W = BACK_RIGHT - BACK_LEFT;
const BACK_OFFSET = (BACK_LEFT + BACK_RIGHT) / 2 - FRAME_W / 2;   // saddle centre vs frame centre

// Leg x (left edge) in the frame and which walk pair it belongs to. Pair A lands on frame 0,
// pair B on frame 2.
const LEGS = { farRear: [12, 'B'], farFront: [38, 'A'], nearRear: [18, 'A'], nearFront: [44, 'B'] };
const STRIDE = [2, 0, -2, 0];                  // pair A x offset per frame (pair B is mirrored)

const C = {
  ink: '#262020', deep: '#48413d', shade: '#655d58', hide: '#837a74', light: '#a0978f', glint: '#bdb3a8',
  pink: '#bf8c86', pinkDark: '#9a6a66', ivory: '#f1e9d6', ivoryShade: '#c9bea6', nail: '#e4dac6',
  red: '#b3303a', redDark: '#7a1c24', redLight: '#d4505a', gold: '#e8b23c', goldLight: '#f6d98a', strap: '#5a1a1e'
};

function drawFrame(p, o, f) {
  const bob = [0, 1, 0, 1][f];
  const s = STRIDE[f];
  const lift = { A: f === 3 ? 2 : 0, B: f === 1 ? 2 : 0 };
  const off = pair => (pair === 'A' ? s : -s);

  const leg = (x, pair, far) => {
    const lx = o + x + off(pair), top = 31 + bob, bottom = 51 - lift[pair];
    const base = far ? C.shade : C.hide, dark = far ? C.deep : C.shade, lit = far ? C.hide : C.light;
    p.rect(lx - 1, top, 10, bottom - top + 1, C.ink);
    p.rect(lx, top, 8, bottom - top, base);
    p.rect(lx, top, 1, bottom - top - 2, lit);
    p.rect(lx + 6, top, 2, bottom - top, dark);
    // Knee wrinkles and a wider foot with toenails.
    const knee = top + Math.round((bottom - top) * 0.5);
    p.rect(lx + 1, knee, 5, 1, dark); p.rect(lx + 2, knee + 2, 4, 1, dark);
    p.rect(lx - 1, bottom - 3, 10, 3, C.ink);
    p.rect(lx, bottom - 3, 8, 2, base);
    if (!far) for (const n of [1, 4, 6]) p.rect(lx + n, bottom - 2, 1, 1, C.nail);
  };

  // Far legs behind the body.
  leg(LEGS.farRear[0], LEGS.farRear[1], true);
  leg(LEGS.farFront[0], LEGS.farFront[1], true);

  // Tail with a tuft.
  p.rect(o + 6, 19 + bob, 2, 12, C.ink); p.rect(o + 7, 19 + bob, 1, 11, C.shade);
  p.rect(o + 5, 30 + bob, 4, 3, C.ink); p.rect(o + 6, 31 + bob, 2, 1, C.deep);

  // Body: flat-topped barrel with outline, belly shade, back light and wrinkles.
  p.oval(o + 31, 27 + bob, 25, 15, C.ink);
  p.rect(o + 10, 12 + bob, 44, 6, C.ink);
  p.oval(o + 31, 27 + bob, 24, 14, C.hide);
  p.rect(o + 11, 13 + bob, 42, 6, C.hide);
  p.oval(o + 31, 35 + bob, 21, 6, C.shade);
  p.rect(o + 12, 40 + bob, 38, 1, C.deep);
  for (let x = 12; x < 50; x += 2) p.rect(o + x + ((x / 2) % 2), 31 + bob, 1, 1, C.shade);   // dither
  p.rect(o + 13, 22 + bob, 34, 1, C.light);
  for (const x of [16, 25, 34]) p.rect(o + x, 23 + bob, 3, 1, C.glint);
  for (const [x, y, h] of [[15, 25, 6], [20, 27, 5], [41, 24, 6], [46, 26, 5], [29, 29, 4]]) p.rect(o + x, y + bob, 1, h, C.deep);

  // Red Khmer saddle: cushion (fixed line), blanket draped over the back, gold trim and tassels.
  const bl = 16, br = 46;                                                      // blanket span
  p.rect(o + bl, SADDLE_TOP + 4, br - bl, 8 + bob, C.redDark);
  p.rect(o + bl + 1, SADDLE_TOP + 4, br - bl - 2, 7 + bob, C.red);
  p.rect(o + bl + 1, SADDLE_TOP + 10 + bob, br - bl - 2, 1, C.gold);
  p.rect(o + bl + 1, SADDLE_TOP + 5, br - bl - 2, 1, C.gold);
  for (let x = bl + 3; x < br - 3; x += 5) { p.rect(o + x, SADDLE_TOP + 7 + bob, 3, 1, C.goldLight); p.rect(o + x + 1, SADDLE_TOP + 6 + bob, 1, 3, C.gold); }
  for (const x of [bl + 1, br - 3]) { p.rect(o + x, SADDLE_TOP + 12 + bob, 2, 2, C.gold); p.rect(o + x, SADDLE_TOP + 14 + bob, 2, 1, C.goldLight); }
  p.rect(o + 30, SADDLE_TOP + 12 + bob, 2, 18, C.strap);                       // belly strap
  p.rect(o + 14, SADDLE_TOP - 1, 36, 5, C.ink);                                  // cushion outline
  p.rect(o + 15, SADDLE_TOP, 34, 4, C.red);
  p.rect(o + 15, SADDLE_TOP, 34, 1, C.redLight);
  p.rect(o + 15, SADDLE_TOP + 3, 34, 1, C.gold);
  for (let x = 17; x < 48; x += 4) p.rect(o + x, SADDLE_TOP + 1, 1, 1, C.goldLight);

  // Head with forehead light, cheek shade, mouth and eye.
  p.oval(o + 58, 21 + bob, 12, 13, C.ink);
  p.oval(o + 58, 21 + bob, 11, 12, C.hide);
  p.oval(o + 60, 13 + bob, 7, 3, C.light);
  p.rect(o + 58, 11 + bob, 5, 1, C.glint);
  p.oval(o + 56, 28 + bob, 7, 4, C.shade);
  p.rect(o + 60, 30 + bob, 2, 1, C.deep);

  // Ear flaps forward/back through the cycle.
  const flap = [0, 2, 3, 1][f];
  p.oval(o + 50 - flap, 21 + bob, 6 + flap, 10, C.ink);
  p.oval(o + 50 - flap, 21 + bob, 5 + flap, 9, C.shade);
  p.oval(o + 50 - flap, 21 + bob, 3 + flap, 6, C.pink);
  p.rect(o + 49 - flap, 17 + bob, 1, 8, C.pinkDark);
  p.rect(o + 45 - flap * 2, 15 + bob, 1, 11, C.deep);

  // Eye with a wrinkle above it.
  p.rect(o + 61, 18 + bob, 4, 3, C.ink);
  p.rect(o + 62, 19 + bob, 2, 1, '#e8e0d0');
  p.rect(o + 63, 19 + bob, 1, 1, '#140c08');
  p.rect(o + 60, 16 + bob, 5, 1, C.deep);

  // Trunk swinging with the walk, ringed with wrinkles, curled tip.
  const swing = [0, 2, 3, 1][f];
  let tipX = 0, tipY = 0;
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const tx = o + 63 + Math.round(Math.sin(i / 3) * 1.4 + Math.pow(t, 1.6) * swing * 1.6);
    const ty = 27 + bob + i * 2.2, w = Math.round(6 - t * 2);
    p.rect(tx - 1, ty, w + 2, 3, C.ink);
    p.rect(tx, ty, w, 3, i % 2 ? C.hide : C.shade);
    if (i % 2) p.rect(tx, ty + 1, w, 1, C.deep);
    tipX = tx; tipY = ty;
  }
  p.rect(tipX + 3, tipY + 1, 3, 2, C.ink); p.rect(tipX + 4, tipY + 1, 1, 1, C.pinkDark);

  // Tusks curving forward.
  p.rect(o + 60, 31 + bob, 7, 3, C.ink);
  p.rect(o + 61, 31 + bob, 5, 1, C.ivory); p.rect(o + 61, 32 + bob, 5, 1, C.ivoryShade);
  p.rect(o + 66, 30 + bob, 2, 2, C.ink); p.rect(o + 66, 30 + bob, 1, 1, C.ivory);

  // Near legs in front of the body.
  leg(LEGS.nearRear[0], LEGS.nearRear[1], false);
  leg(LEGS.nearFront[0], LEGS.nearFront[1], false);
}

function elephantTexture(scene) {
  // A loaded sprite sheet (assets/mech-elephant.png) already owns this key and is used as-is.
  return canvasTexture(scene, 'mech-elephant', FRAME_W * 4, FRAME_H, (p, texture) => {
    for (let f = 0; f < 4; f++) {
      drawFrame(p, f * FRAME_W, f);
      texture.add(f, 0, f * FRAME_W, 0, FRAME_W, FRAME_H);
    }
  });
}

function pathTextures(scene) {
  // Earth-and-grass strip under the elephant's path, and a small dust puff.
  canvasTexture(scene, 'elephant-path', 36, 12, p => {
    p.rect(0, 3, 36, 9, '#6b4a2e');
    p.rect(0, 3, 36, 2, '#4f7a38');
    p.rect(0, 2, 36, 1, '#6f9a4a');
    for (let x = 0; x < 36; x += 3) p.rect(x, 1 - (x % 2), 1, 2, x % 6 ? '#5f8a40' : '#86ad56');
    for (const [x, y] of [[4, 7], [13, 9], [22, 6], [30, 9], [9, 10], [26, 10]]) p.rect(x, y, 2, 1, '#8a6a46');
    p.rect(0, 11, 36, 1, '#4a321f');
  });
  canvasTexture(scene, 'elephant-dust', 8, 5, p => {
    p.oval(4, 3, 3, 2, '#c9ad84', 0.9); p.oval(3, 2, 2, 1, '#e2cca4', 0.9);
  });
}

export default {
  type: 'elephantPlatform',
  create(scene, cfg) {
    const { minX, maxX, floorY, speed = 30, pauseMs = 900, startX = minX, startDir = 1 } = cfg;
    const key = elephantTexture(scene);
    pathTextures(scene);
    // Clear ground under the whole path so the feet always touch something.
    const path = scene.add.tileSprite(minX - 44, floorY - 3, maxX - minX + 88, 12, 'elephant-path')
      .setOrigin(0, 0).setDepth(-0.3);
    const sprite = scene.add.image(startX, floorY, key, 0).setOrigin(0.5, 1).setDepth(-0.2);
    // The saddle: a one-way immovable body moved by velocity so Arcade carries the rider.
    // Its top is exactly the top of the drawn saddle cushion.
    const saddleTop = floorY - FRAME_H + SADDLE_TOP;
    const back = scene.add.rectangle(startX, saddleTop + 4, BACK_W, 8, 0xffffff, 0);
    scene.physics.add.existing(back);
    back.body.setAllowGravity(false).setImmovable(true);
    back.body.checkCollision.down = back.body.checkCollision.left = back.body.checkCollision.right = false;
    back.setData('surface', 'grass');   // soft footsteps on the saddle blanket
    const removeColliders = safeColliders(scene, [[scene.player, back]]);
    let direction = startDir, waitUntil = 0, stride = 0, lastFrame = 0;
    const puffs = [];

    const dust = (frame, facing) => {
      const v = scene.cameras.main.worldView;
      if (back.x < v.x - 60 || back.x > v.right + 60) return;
      const landed = frame === 0 ? 'A' : 'B';
      for (const [x, pair] of Object.values(LEGS)) {
        if (pair !== landed) continue;
        const local = x + (pair === 'A' ? STRIDE[frame] : -STRIDE[frame]) + 4 - FRAME_W / 2;
        const wx = sprite.x + local * facing;
        for (let i = 0; i < 2; i++) {
          const puff = scene.add.image(wx + (i ? 3 : -3) * facing, floorY - 1, 'elephant-dust').setDepth(-0.15).setAlpha(0.85).setScale(0.6);
          puffs.push(puff);
          scene.tweens.add({ targets: puff, x: puff.x + (i ? 5 : -5), y: floorY - 4, scale: 1.3, alpha: 0, duration: 520, ease: 'Sine.easeOut',
            onComplete: () => { puff.destroy(); puffs.splice(puffs.indexOf(puff), 1); } });
        }
      }
    };

    return {
      sprite, back,
      update(time, delta) {
        const now = scene.time.now;
        const cx = back.x;
        if (now < waitUntil) {
          back.body.setVelocityX(0);
        } else if ((direction > 0 && cx >= maxX) || (direction < 0 && cx <= minX)) {
          direction = -direction;
          waitUntil = now + pauseMs;
          sfx(scene).playAt(scene, 'elephant', back.x, floorY - 30);
          back.body.setVelocityX(0);
        } else {
          back.body.setVelocityX(speed * direction);
          stride += delta;
        }
        // The sprite follows the saddle (the saddle is a little behind the frame centre).
        const walking = now >= waitUntil;
        const frame = walking ? Math.floor(stride / 180) % 4 : 0;
        const facing = direction < 0 ? -1 : 1;
        sprite.setPosition(back.x - BACK_OFFSET * facing, floorY).setFlipX(facing < 0).setFrame(frame);
        if (walking && frame !== lastFrame && (frame === 0 || frame === 2)) dust(frame, facing);
        lastFrame = frame;
      },
      destroy() { removeColliders(); puffs.forEach(p => p.destroy()); path.destroy(); sprite.destroy(); back.destroy(); }
    };
  }
};
