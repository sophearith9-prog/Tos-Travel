// Mirror each repeat so the landscape scrolls without a hard edge or empty space.
export function addScrollingBackdrop(scene, key, depth, parallax = 0.22, cropToView = false) {
  const repeatKey = `${key}-panorama`;
  const source = scene.textures.get(key).getSourceImage();
  const viewRatio = 800 / 450;
  const cropWidth = cropToView && source.width / source.height > viewRatio
    ? source.height * viewRatio : source.width;
  const cropX = (source.width - cropWidth) / 2;
  if (!scene.textures.exists(repeatKey)) {
    const texture = scene.textures.createCanvas(repeatKey, cropWidth * 2, source.height);
    const ctx = texture.context;
    ctx.drawImage(source, cropX, 0, cropWidth, source.height, 0, 0, cropWidth, source.height);
    ctx.save();
    ctx.translate(cropWidth * 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, cropX, 0, cropWidth, source.height, 0, 0, cropWidth, source.height);
    ctx.restore();
    texture.refresh();
    if (cropToView) texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const zoom = scene.cameras.main.zoom;
  const width = 800 / zoom, height = 450 / zoom;
  const backdrop = scene.add.tileSprite(400, 225, width, height, repeatKey)
    .setScrollFactor(0).setDepth(depth)
    .setTileScale(width / cropWidth, height / source.height);
  const update = () => {
    // Track walking even while the camera is held at either end of the level.
    backdrop.tilePositionX = (scene.player.x - 50) * parallax / backdrop.tileScaleX;
  };
  scene.events.on('postupdate', update);
  scene.events.once('shutdown', () => scene.events.off('postupdate', update));
  update();
  return backdrop;
}
