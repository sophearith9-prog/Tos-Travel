import { playSound } from '../ui.js';
import { sfx } from '../audio/soundManager.js';

// Checkpoint post. Touching it makes it the respawn point: pit falls return here (via
// the last-safe-ground rule) and, when health runs out, the player revives here with
// one unit of health instead of getting Game Over (GameScene.respawnAtCheckpoint).
//   { type: 'checkpoint', x, floorY, label = 'CHECKPOINT' }
// Usually written in a layout's `checkpoints: [{ x, floorY }]` list.
export default {
  type: 'checkpoint',
  create(scene, cfg) {
    const { x, floorY, label = 'CHECKPOINT' } = cfg;
    const spot = { x, y: floorY - 9 };   // player origin sits 9px above its feet
    const pole = scene.add.rectangle(x, floorY, 3, 34, 0x5a4330).setOrigin(0.5, 1).setDepth(-0.3);
    const base = scene.add.rectangle(x, floorY, 12, 4, 0x8f805f).setOrigin(0.5, 1).setDepth(-0.3);
    const banner = scene.add.triangle(x + 2, floorY - 30, 0, 0, 14, 5, 0, 10, 0x8a8f96).setOrigin(0, 0).setDepth(-0.3);
    let wasActive = false;

    return {
      spot,
      update() {
        const active = scene.activeCheckpoint === spot;
        if (active !== wasActive) {
          wasActive = active;
          banner.setFillStyle(active ? 0xe8b23c : 0x8a8f96);
        }
        const player = scene.player;
        if (active || !player?.body?.enable || scene.isLevelFinished) return;
        // A tall column at the post, so jumping past it still counts.
        if (Math.abs(player.x - x) < 16 && player.body.bottom <= floorY + 4 && player.body.bottom >= floorY - 110) {
          scene.activeCheckpoint = spot;
          scene.lastSafeGround = { ...spot };
          sfx(scene).play('checkpoint');
          scene.showFloatingText(x, floorY - 44, label, '#ffe39a');
        }
      },
      destroy() { pole.destroy(); base.destroy(); banner.destroy(); }
    };
  }
};
