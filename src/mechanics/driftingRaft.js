import { platformSprite } from './platformArt.js';
import { safeColliders } from './helpers.js';

// Rafts carried by a river current: each drifts from `fromX` to `toX`, sinks at the end
// of its run and reappears upstream, like a conveyor. Riders are carried (Arcade friction).
//   { type: 'driftingRaft', fromX, toX, y /* raft top */, speed = 32 (px/s),
//     count = 2 (rafts evenly spaced along the run), width = 56 }
// fromX/toX are the raft's left edge. toX < fromX makes the current flow left.
// A rider still on board when it sinks drops into the water.
export default {
  type: 'driftingRaft',
  create(scene, cfg) {
    const { fromX, toX, y, speed = 32, count = 2, width = 56 } = cfg;
    const dir = Math.sign(toX - fromX) || 1;
    const length = Math.abs(toX - fromX);
    const SINK = 450, APPEAR = 350;
    const rafts = Array.from({ length: count }, (_, i) => {
      const sprite = platformSprite(scene, fromX, y, width, 10, 'raft').setOrigin(0, 0).setDepth(3.4);
      scene.physics.add.existing(sprite);
      sprite.body.setAllowGravity(false).setImmovable(true);
      sprite.setData('surface', 'wood');
      sprite.body.checkCollision.down = sprite.body.checkCollision.left = sprite.body.checkCollision.right = false;
      const start = fromX + dir * (length * i) / count;
      sprite.body.reset(start, y);
      return { sprite, state: 'drift', since: 0 };
    });
    const removeColliders = safeColliders(scene, rafts.map(r => [scene.player, r.sprite]));

    return {
      rafts: rafts.map(r => r.sprite),
      update() {
        const now = scene.time.now;
        for (const raft of rafts) {
          const s = raft.sprite;
          s.setData('state', raft.state);   // 'drift' | 'sink' | 'appear' (readable by other code)
          if (raft.state === 'drift') {
            s.body.setVelocityX(speed * dir);
            if ((dir > 0 && s.x >= toX) || (dir < 0 && s.x <= toX)) { raft.state = 'sink'; raft.since = now; }
          } else if (raft.state === 'sink') {
            const k = (now - raft.since) / SINK;
            s.body.setVelocity(speed * dir * 0.3, 18);
            s.setAlpha(1 - k);
            if (k >= 1) {
              s.body.enable = false;
              s.body.reset(fromX, y);
              raft.state = 'appear'; raft.since = now;
            }
          } else if (raft.state === 'appear') {
            const k = (now - raft.since) / APPEAR;
            s.setAlpha(k);
            if (k >= 1) { s.body.enable = true; s.body.reset(fromX, y); raft.state = 'drift'; }
          }
        }
      },
      destroy() { removeColliders(); rafts.forEach(r => r.sprite.destroy()); }
    };
  }
};
