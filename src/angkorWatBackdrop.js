// Photo-style Angkor Wat gallery backdrop; decorative only.
export function addAngkorWatBackdrop(scene, map) {
  scene.textures.get('angkor-wat-level2')
    .setFilter(Phaser.Textures.FilterMode.NEAREST);
  const backdrop = scene.add.image(0, -225, 'angkor-wat-level2')
    .setOrigin(0, 0)
    .setDisplaySize(map.widthInPixels, map.widthInPixels / 3)
    .setDepth(-20);
  return backdrop;
}
