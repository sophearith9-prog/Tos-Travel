// Mirror each repeat so the landscape scrolls without a hard edge or empty space.
export function addScrollingBackdrop(scene, key, depth) {
  const repeatKey = `${key}-panorama`;
  const source = scene.textures.get(key).getSourceImage();
  if (!scene.textures.exists(repeatKey)) {
    const texture = scene.textures.createCanvas(repeatKey, source.width * 2, source.height);
    const ctx = texture.context;
    ctx.drawImage(source, 0, 0);
    ctx.save();
    ctx.translate(source.width * 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, 0, 0);
    ctx.restore();
    texture.refresh();
  }
  const zoom = scene.cameras.main.zoom;
  const width = 800 / zoom, height = 450 / zoom;
  const backdrop = scene.add.tileSprite(400, 225, width, height, repeatKey)
    .setScrollFactor(0).setDepth(depth)
    .setTileScale(width / source.width, height / source.height);
  const update = () => {
    // Track walking even while the camera is held at either end of the level.
    backdrop.tilePositionX = (scene.player.x - 50) * 0.22 / backdrop.tileScaleX;
  };
  scene.events.on('postupdate', update);
  scene.events.once('shutdown', () => scene.events.off('postupdate', update));
  update();
  return backdrop;
}
