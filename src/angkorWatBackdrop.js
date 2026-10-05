// Photo-style Angkor Wat gallery backdrop; decorative only.
export function addAngkorWatBackdrop(scene, map) {
  const texture = scene.textures.get('angkor-wat-level2');
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const source = texture.getSourceImage();
  // Preserve the original 100-tile scale as the playable route gets longer.
  const scale = (100 * map.tileWidth) / source.width;
  const backdrop = scene.add.tileSprite(0, -225, map.widthInPixels,
    source.height * scale, 'angkor-wat-level2')
    .setOrigin(0, 0).setTileScale(scale, scale).setDepth(-20);
  return backdrop;
}
