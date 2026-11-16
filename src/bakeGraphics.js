// Phaser's WebGL renderer re-triangulates every Graphics shape on the CPU every frame
// (rounded rects, ellipses and circles go through earcut). For art that never changes
// after it is drawn, render it once into a texture and show plain Images instead.

const MAX_CHUNK = 2048; // texture pixels per side; safe on mobile GPUs

/**
 * Render a small static Graphics (drawn around its local origin) into a texture and
 * return a centred Image in its place, so scale/angle tweens still pivot correctly.
 * @param {number} radius  half-size of the square region around the local origin to keep
 */
export function bakeCentered(scene, graphics, key, radius, resolution = 1) {
  const [image] = bakeGraphics(scene, graphics, key,
    { x: -radius, y: -radius, width: radius * 2, height: radius * 2 }, resolution);
  return image.setOrigin(0.5).setPosition(image.x + radius, image.y + radius);
}

/**
 * Replace a static Graphics object with Images of its rendered content.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Graphics} graphics  drawn in its local coordinates
 * @param {string} key  texture key; reused on later stages if it already exists
 * @param {{x:number,y:number,width:number,height:number}} bounds  local region to keep
 * @param {number} [resolution]  texture pixels per local unit (use the camera zoom for world art)
 * @returns {Phaser.GameObjects.Image[]} images placed where the graphics content was
 */
export function bakeGraphics(scene, graphics, key, bounds, resolution = 1) {
  const res = Math.max(1, resolution);
  const chunkWidth = Math.floor(MAX_CHUNK / res);
  const chunkHeight = Math.floor(MAX_CHUNK / res);
  const images = [];
  const originX = graphics.x, originY = graphics.y;
  let chunk = 0;
  for (let cy = bounds.y; cy < bounds.y + bounds.height; cy += chunkHeight) {
    for (let cx = bounds.x; cx < bounds.x + bounds.width; cx += chunkWidth) {
      const w = Math.min(chunkWidth, bounds.x + bounds.width - cx);
      const h = Math.min(chunkHeight, bounds.y + bounds.height - cy);
      const chunkKey = `${key}@${res}#${chunk++}`;
      if (!scene.textures.exists(chunkKey)) {
        const texture = scene.textures.addDynamicTexture(chunkKey, Math.ceil(w * res), Math.ceil(h * res));
        if (!texture) continue;
        // Bake at full opacity; the Image carries the Graphics' alpha so it can still fade.
        const { x, y, scaleX, scaleY, scrollFactorX, scrollFactorY, alpha } = graphics;
        graphics.setPosition(0, 0).setScale(res).setScrollFactor(1).setAlpha(1);
        texture.draw(graphics, -cx * res, -cy * res);
        graphics.setPosition(x, y).setScale(scaleX, scaleY)
          .setScrollFactor(scrollFactorX, scrollFactorY).setAlpha(alpha);
      }
      images.push(scene.add.image(originX + cx, originY + cy, chunkKey)
        .setOrigin(0, 0).setScale(1 / res)
        .setDepth(graphics.depth)
        .setScrollFactor(graphics.scrollFactorX, graphics.scrollFactorY)
        .setAlpha(graphics.alpha)
        .setVisible(graphics.visible));
    }
  }
  graphics.destroy();
  return images;
}
