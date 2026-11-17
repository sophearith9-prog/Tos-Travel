import { bakeGraphics } from '../bakeGraphics.js';
import { bodyInRect } from './helpers.js';

// A strip of floor spikes. Touching them is an enemy-style hit (shield first, then
// health) with a knock-back, so the player bounces off rather than falling through.
//   { type: 'spikes', x, floorY, width, height = 10, style = 'metal' | 'thorns' }
// x is the left edge; floorY is the top of the ground the spikes stand on.
export default {
  type: 'spikes',
  create(scene, cfg) {
    const { x, floorY, width, height = 10, style = 'metal' } = cfg;
    const g = scene.add.graphics().setDepth(-0.2);
    if (style === 'thorns') {
      // Thorny bramble: dark tangled stems with pale thorn tips.
      for (let sx = x; sx < x + width; sx += 7) {
        const h = height - ((sx * 7) % 4);
        g.fillStyle(0x24361f, 1).fillRect(sx, floorY - h, 7, h);
        g.fillStyle(0x3d5a2c, 1).fillRect(sx + 1, floorY - h + 1, 5, h - 2);
        g.fillStyle(0x6b4a2a, 1).fillRect(sx + 3, floorY - h - 3, 1, 4).fillRect(sx, floorY - h + 3, 2, 1).fillRect(sx + 6, floorY - h + 5, 2, 1);
        g.fillStyle(0xf2e6c8, 1).fillRect(sx + 3, floorY - h - 4, 1, 1).fillRect(sx - 1, floorY - h + 3, 1, 1).fillRect(sx + 8, floorY - h + 5, 1, 1);
      }
    } else for (let sx = x; sx + 6 <= x + width; sx += 6) {
      g.fillStyle(0x3a3330, 1).fillTriangle(sx - 1, floorY, sx + 7, floorY, sx + 3, floorY - height - 2);
      g.fillStyle(0xd9d4c3, 1).fillTriangle(sx, floorY, sx + 6, floorY, sx + 3, floorY - height);
      g.fillStyle(0xfff7dc, 1).fillRect(sx + 2, floorY - height + 1, 2, 3);
    }
    const [art] = bakeGraphics(scene, g, `mech-spikes-${style}-${width}-${height}`,
      { x: x - 2, y: floorY - height - 6, width: width + 6, height: height + 7 }, scene.cameras.main.zoom);
    const rect = { x, y: floorY - height + 3, width, height: height - 3 };

    return {
      update() {
        const player = scene.player;
        if (scene.isLevelFinished || scene.isInvulnerable || !bodyInRect(player?.body, rect)) return;
        const center = x + width / 2;
        scene.handlePlayerEnemyCollision(player, { x: player.x < center ? player.x + 20 : player.x - 20 }, true);
      },
      destroy() { art.destroy(); }
    };
  }
};
