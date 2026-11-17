import { canvasTexture } from '../biomes/biomeArt.js';
import { safeColliders } from './helpers.js';

// A walking elephant whose back is a ride-on platform (Arcade carries the rider).
//   { type: 'elephantPlatform', minX, maxX, floorY, speed = 30 (px/s), pauseMs = 900,
//     startX = minX, startDir = 1 }
// minX/maxX bound the elephant's centre; floorY is the ground it walks on. Its back is a
// 60px-wide platform 52px above floorY (just below a 54px-deep valley's rim, so riders
// step off the rim onto it). Keep minX/maxX within ~34px of the valley walls so there is
// no gap to fall through when boarding. The legs have no body, so it never blocks.

const FRAME_W = 72, FRAME_H = 52;

function elephantTexture(scene) {
  return canvasTexture(scene, 'mech-elephant', FRAME_W * 4, FRAME_H, (p, texture) => {
    const ink = '#3c3836', hide = '#8c8884', shade = '#6e6a66', light = '#aba7a2';
    for (let f = 0; f < 4; f++) {
      const o = f * FRAME_W;
      const step = [0, 2, 0, -2][f];
      // Legs (far pair darker), alternating with the walk cycle.
      const legs = [[14, step, shade], [40, -step, shade], [21, -step, hide], [47, step, hide]];
      for (const [lx, dx, c] of legs) {
        const lift = dx > 0 ? 1 : 0;
        p.rect(o + lx + dx - 1, 33, 9, 17 - lift, ink);
        p.rect(o + lx + dx, 33, 7, 16 - lift, c);
        p.rect(o + lx + dx, 48 - lift, 7, 1, light);
        p.rect(o + lx + dx + 1, 47 - lift, 1, 1, '#e8e0d0'); p.rect(o + lx + dx + 4, 47 - lift, 1, 1, '#e8e0d0');
      }
      // Body with outline, belly shade and back highlight.
      p.oval(o + 32, 24, 25, 16, ink);
      p.oval(o + 32, 24, 24, 15, hide);
      p.oval(o + 32, 31, 20, 7, shade);
      p.rect(o + 18, 11, 26, 1, light);
      // Tail.
      p.rect(o + 7, 20, 2, 10, ink); p.rect(o + 6, 30, 3, 2, ink);
      // Khmer saddle blanket marks the rideable back.
      p.rect(o + 19, 7, 26, 7, '#7a1f24');
      p.rect(o + 20, 8, 24, 5, '#b8323a');
      p.rect(o + 20, 8, 24, 1, '#e8b23c'); p.rect(o + 20, 12, 24, 1, '#e8b23c');
      for (let k = 22; k < 44; k += 5) p.rect(o + k, 10, 2, 1, '#f2d27a');
      p.rect(o + 19, 14, 1, 4, '#e8b23c'); p.rect(o + 44, 14, 1, 4, '#e8b23c');
      // Head, ear, eye, tusk and a swaying trunk.
      p.oval(o + 56, 18, 12, 12, ink);
      p.oval(o + 56, 18, 11, 11, hide);
      p.oval(o + 49, 20, 8, 11, ink);
      p.oval(o + 49, 20, 7, 10, shade);
      p.oval(o + 49, 21, 4, 6, '#b88a86');
      p.rect(o + 60, 13, 2, 2, '#1a1616');
      p.rect(o + 61, 12, 1, 1, '#ffffff');
      p.rect(o + 61, 25, 5, 2, '#f2ece0'); p.rect(o + 65, 24, 2, 2, '#f2ece0');
      const sway = [0, 1, 2, 1][f];
      for (let s = 0; s < 9; s++) {
        const tx = o + 63 + Math.round(Math.sin(s / 3) * 2) + Math.round((s / 8) * sway * 2);
        p.rect(tx - 1, 20 + s * 3, 6, 4, ink);
        p.rect(tx, 20 + s * 3, 4, 3, s % 2 ? hide : shade);
      }
      texture.add(f, 0, o, 0, FRAME_W, FRAME_H);
    }
  });
}

export default {
  type: 'elephantPlatform',
  create(scene, cfg) {
    const { minX, maxX, floorY, speed = 30, pauseMs = 900, startX = minX, startDir = 1 } = cfg;
    const key = elephantTexture(scene);
    const sprite = scene.add.image(startX, floorY, key, 0).setOrigin(0.5, 1).setDepth(-0.2);
    // The back: a one-way immovable body moved by velocity so Arcade carries the rider.
    const back = scene.add.rectangle(startX, floorY - 52 + 4, 60, 8, 0xffffff, 0);
    scene.physics.add.existing(back);
    back.body.setAllowGravity(false).setImmovable(true);
    back.body.checkCollision.down = back.body.checkCollision.left = back.body.checkCollision.right = false;
    const removeColliders = safeColliders(scene, [[scene.player, back]]);
    let direction = startDir, waitUntil = 0, stride = 0;

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
          back.body.setVelocityX(0);
        } else {
          back.body.setVelocityX(speed * direction);
          stride += delta;
        }
        // The sprite follows the back; bob slightly with each step.
        const frame = Math.floor(stride / 180) % 4;
        sprite.setPosition(back.x, floorY + (frame % 2 ? -1 : 0))
          .setFlipX(direction < 0).setFrame(now < waitUntil ? 0 : frame);
      },
      destroy() { removeColliders(); sprite.destroy(); back.destroy(); }
    };
  }
};
