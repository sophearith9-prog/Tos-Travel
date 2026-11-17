import { prepareProvinceTerrain } from '../provinceScenery.js';

// Platform visuals shared by hand-made terrain and platform mechanics.
// Each style provides two 18x18 frames on one texture: 'top' (walkable edge) and 'fill'.
//   'ground' reuses the stage's biome ground tiles so layouts match the generated stages.

const PLANK_STYLES = {
  stone: { base: '#8f805f', light: '#cdb98a', dark: '#4f4535', seam: '#655a45' },
  wood: { base: '#8a5a34', light: '#c8955a', dark: '#4a2f1c', seam: '#5f3d24' },
  bamboo: { base: '#b9a259', light: '#e6d48a', dark: '#6e5f2c', seam: '#8a7a3a' },
  log: { base: '#7a5232', light: '#b07a4a', dark: '#3e2818', seam: '#55361f' }
};

export function platformTexture(scene, style = 'ground', province = scene.province) {
  if (style === 'ground' && province) {
    const key = prepareProvinceTerrain(scene, province);
    const texture = scene.textures.get(key);
    // Tile 2 (grass top) and tile 22 (fill) of the 20-column, 18px packed tileset.
    if (!texture.has('layout-top')) texture.add('layout-top', 0, 18, 0, 18, 18);
    if (!texture.has('layout-fill')) texture.add('layout-fill', 0, 18, 18, 18, 18);
    return { key, top: 'layout-top', fill: 'layout-fill' };
  }
  const colors = PLANK_STYLES[style] || PLANK_STYLES.stone;
  const key = `layout-platform-${style}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 36, 18);
    const ctx = texture.context;
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    for (const ox of [0, 18]) {
      rect(ox, 0, 18, 18, colors.seam);
      if (style === 'log') {
        // A round floating log: highlight on top, bark lines, darker underside.
        rect(ox, 1, 18, 11, colors.base); rect(ox, 1, 18, 2, colors.light); rect(ox, 10, 18, 2, colors.dark);
        for (let x = 2; x < 18; x += 5) rect(ox + x, 4 + (x % 3), 3, 1, colors.dark);
        ctx.clearRect(ox, 12, 18, 6); ctx.clearRect(ox, 0, 18, 1);
      } else if (style === 'bamboo') {
        for (let x = 0; x < 18; x += 6) { rect(ox + x, 1, 5, 17, colors.base); rect(ox + x + 1, 1, 1, 17, colors.light); rect(ox + x, 8, 5, 1, colors.dark); }
      } else if (style === 'wood') {
        for (let y = 0; y < 18; y += 6) { rect(ox, y + 1, 18, 4, colors.base); rect(ox, y + 1, 18, 1, colors.light); rect(ox + ((y / 6) % 2 ? 4 : 12), y + 1, 1, 4, colors.dark); }
      } else {
        for (let row = 0; row < 3; row++) for (let col = -1; col < 3; col++) {
          const bx = ox + col * 8 + (row % 2) * 4;
          rect(Math.max(ox, bx + 1), row * 6 + 1, 7, 5, colors.base);
          rect(Math.max(ox, bx + 1), row * 6 + 1, 7, 1, colors.light);
        }
      }
    }
    if (style !== 'log') { rect(0, 0, 18, 2, colors.light); rect(0, 2, 18, 1, colors.dark); }   // top frame edge
    texture.add('top', 0, 0, 0, 18, 18);
    texture.add('fill', 0, 18, 0, 18, 18);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  return { key, top: 'top', fill: 'fill' };
}

// Static visual for a platform rectangle (top-left x, y). Returns the created objects.
export function drawPlatform(scene, x, y, width, height, style, depth = -0.6) {
  const art = platformTexture(scene, style);
  const topHeight = Math.min(18, height);
  const parts = [scene.add.tileSprite(x, y, width, topHeight, art.key, art.top).setOrigin(0, 0).setDepth(depth)];
  if (height > 18) {
    parts.push(scene.add.tileSprite(x, y + 18, width, height - 18, art.key, art.fill).setOrigin(0, 0).setDepth(depth));
  }
  return parts;
}

// A single tile-sprite platform suitable for a physics body (moving/sinking platforms).
export function platformSprite(scene, x, y, width, height, style) {
  const art = platformTexture(scene, style);
  return scene.add.tileSprite(x, y, width, height, art.key, art.top).setDepth(-0.4);
}
