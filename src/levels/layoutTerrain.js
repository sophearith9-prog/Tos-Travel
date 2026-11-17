import { drawPlatform } from '../mechanics/platformArt.js';
import { TILE } from './layoutFormat.js';

// Static ground for a hand-made layout: one invisible static body per platform plus its art.
// Also exposes scene.patrolTerrain.hasSupport() so enemies turn at edges (see combat.js).
export function installLayoutTerrain(scene, layout) {
  const group = scene.physics.add.staticGroup();
  for (const p of layout.platforms) {
    const height = p.height || TILE;
    drawPlatform(scene, p.x, p.y, p.width, height, p.style || layout.terrainStyle);
    const body = scene.add.rectangle(p.x + p.width / 2, p.y + height / 2, p.width, height, 0xffffff, 0);
    group.add(body);
    // Footstep surface for planks and stone (biome ground uses the level default).
    const style = p.style || layout.terrainStyle;
    if (style !== 'ground') body.setData('surface', style === 'stone' ? 'stone' : 'wood');
    if (p.oneWay) {
      body.body.checkCollision.down = false;
      body.body.checkCollision.left = false;
      body.body.checkCollision.right = false;
    }
  }
  scene.patrolTerrain = {
    group,
    hasSupport: (x, y) => layout.platforms.some(p => x >= p.x && x <= p.x + p.width && Math.abs(p.y - y) < 7)
  };
  return group;
}
