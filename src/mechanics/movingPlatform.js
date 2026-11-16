import { platformSprite } from './platformArt.js';
import { safeColliders } from './helpers.js';

// Platform that travels along a path of points at a fixed speed. Riders are carried by
// Arcade Physics itself (an immovable moving body passes its motion on via body.friction).
//   { type: 'movingPlatform', path: [{x, y}, {x, y}, ...], width = 54, height = 12,
//     speed = 60 (px/s), loop = false (false = ping-pong), pauseMs = 300,
//     oneWay = true (jump up through it), style = 'wood' }
// Points are the platform's top-left corner.
export default {
  type: 'movingPlatform',
  create(scene, cfg) {
    const { width = 54, height = 12, speed = 60, loop = false, pauseMs = 300, style = 'wood', oneWay = true } = cfg;
    const path = (cfg.path?.length ? cfg.path : [{ x: cfg.x, y: cfg.y }]).map(p => ({ x: p.x, y: p.y }));
    const sprite = platformSprite(scene, path[0].x, path[0].y, width, height, style).setOrigin(0, 0);
    scene.physics.add.existing(sprite);
    sprite.body.setAllowGravity(false).setImmovable(true);
    if (oneWay) {
      sprite.body.checkCollision.down = false;
      sprite.body.checkCollision.left = false;
      sprite.body.checkCollision.right = false;
    }
    const removeColliders = safeColliders(scene, [[scene.player, sprite], [scene.enemies, sprite]]);
    let target = path.length > 1 ? 1 : 0, direction = 1, waitUntil = 0;
    return {
      sprite,
      update(time, delta) {
        if (path.length < 2) return;
        if (scene.time.now < waitUntil) { sprite.body.setVelocity(0, 0); return; }
        const goal = path[target];
        const gx = goal.x - sprite.x, gy = goal.y - sprite.y, distance = Math.hypot(gx, gy);
        if (distance <= Math.max(1, (speed * delta) / 1000)) {
          sprite.body.reset(goal.x, goal.y);
          waitUntil = scene.time.now + pauseMs;
          if (loop) target = (target + 1) % path.length;
          else {
            if (target + direction >= path.length || target + direction < 0) direction = -direction;
            target += direction;
          }
        } else {
          sprite.body.setVelocity((gx / distance) * speed, (gy / distance) * speed);
        }
      },
      destroy() { removeColliders(); sprite.destroy(); }
    };
  }
};
