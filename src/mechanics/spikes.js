import { bakeGraphics } from '../bakeGraphics.js';
import { bodyInRect } from './helpers.js';

// A strip of floor spikes. Touching them is an enemy-style hit (shield first, then
// health) with a knock-back, so the player bounces off rather than falling through.
//   { type: 'spikes', x, floorY, width, height = 10 }
// x is the left edge; floorY is the top of the ground the spikes stand on.
export default {
  type: 'spikes',
  create(scene, cfg) {
    const { x, floorY, width, height = 10 } = cfg;
    const g = scene.add.graphics().setDepth(-0.2);
    for (let sx = x; sx + 6 <= x + width; sx += 6) {
      g.fillStyle(0x3a3330, 1).fillTriangle(sx - 1, floorY, sx + 7, floorY, sx + 3, floorY - height - 2);
      g.fillStyle(0xd9d4c3, 1).fillTriangle(sx, floorY, sx + 6, floorY, sx + 3, floorY - height);
      g.fillStyle(0xfff7dc, 1).fillRect(sx + 2, floorY - height + 1, 2, 3);
    }
    const [art] = bakeGraphics(scene, g, `mech-spikes-${width}-${height}`,
      { x: x - 2, y: floorY - height - 3, width: width + 4, height: height + 4 }, scene.cameras.main.zoom);
    // bakeGraphics caches textures by key, so position the image for this instance.
    art.setPosition(x - 2, floorY - height - 3);
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
