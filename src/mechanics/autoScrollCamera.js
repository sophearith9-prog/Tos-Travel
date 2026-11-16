import { shiftPlayer } from './helpers.js';

// Auto-scrolling section: once the player passes `startX`, the camera moves right at a
// fixed speed until its right edge reaches `endX`, then normal follow resumes.
// The left screen edge pushes the player; being squeezed against a wall by it counts
// as a hit (one unit of health, respawn on safe ground inside the view).
//   { type: 'autoScrollCamera', startX, endX, speed = 50 (px/s), followY = true }
export default {
  type: 'autoScrollCamera',
  create(scene, cfg) {
    const { startX, endX, speed = 50, followY = true } = cfg;
    const cam = scene.cameras.main;
    let state = 'waiting', nextCrushAt = 0;
    const viewLeft = () => cam.scrollX + 400 - 400 / cam.zoom;
    const viewWidth = () => 800 / cam.zoom;
    // While scrolling, only respawn somewhere the camera can still see.
    const filter = spot => state !== 'scrolling' || spot.x > viewLeft() + 30;
    scene.safeGroundFilters.push(filter);

    return {
      get state() { return state; },
      update(time, delta) {
        const player = scene.player;
        if (state === 'waiting') {
          if (player.x < startX) return;
          state = 'scrolling';
          cam.stopFollow();
        }
        if (state !== 'scrolling') return;
        if (scene.isLevelFinished) { state = 'done'; cam.startFollow(player, false, 0.1, 0.1); return; }
        cam.scrollX += (speed * delta) / 1000;
        if (followY) cam.scrollY += (player.y - 225 - cam.scrollY) * 0.1;
        if (viewLeft() + viewWidth() >= endX) {
          state = 'done';
          cam.startFollow(player, false, 0.1, 0.1);
          return;
        }
        if (!player.body?.enable) return;
        const left = viewLeft() + 2, right = viewLeft() + viewWidth() - 2;
        if (player.body.left < left) {
          shiftPlayer(player, left - player.body.left);
          if (player.body.blocked.right && scene.time.now >= nextCrushAt) {
            nextCrushAt = scene.time.now + 1000;
            scene.handlePitFall();
          }
        } else if (player.body.right > right) {
          shiftPlayer(player, right - player.body.right);
        }
      },
      destroy() {
        const i = scene.safeGroundFilters?.indexOf(filter);
        if (i >= 0) scene.safeGroundFilters.splice(i, 1);
      }
    };
  }
};
