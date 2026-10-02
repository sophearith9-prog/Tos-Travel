import { addScrollingBackdrop } from './scrollingBackdrop.js';

// Level 5 begins outside; walking into the gate reveals the temple grounds.
export function addTempleEntrance(scene) {
  const camera = scene.cameras.main;
  const inside = addScrollingBackdrop(scene, 'banteay-temple-interior', -19).setAlpha(0);
  const center = 180, ground = 198, width = 136, height = 100;
  const left = center - width / 2, top = ground - height;
  const gate = scene.add.image(center, ground, 'khmer-entrance-gate')
    .setOrigin(0.5, 1).setDisplaySize(width, height).setDepth(-4);

  // Match the opening in the gate artwork so the destination is visible inside it.
  const opening = scene.make.graphics({ x: 0, y: 0, add: false });
  opening.fillStyle(0xffffff).fillPoints([
    { x: left + width * 0.458, y: top + height * 0.959 },
    { x: left + width * 0.458, y: top + height * 0.650 },
    { x: left + width * 0.486, y: top + height * 0.579 },
    { x: left + width * 0.514, y: top + height * 0.579 },
    { x: left + width * 0.542, y: top + height * 0.650 },
    { x: left + width * 0.542, y: top + height * 0.959 }
  ], true);
  const mask = opening.createGeometryMask();
  const glimpse = scene.add.image(center, ground - 35, 'banteay-temple-interior')
    .setDisplaySize(120, 70).setDepth(-3).setMask(mask);
  const hint = scene.add.text(center, ground + 8, 'WALK RIGHT INTO THE GATE →', {
    fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#fff0bb',
    stroke: '#25291c', strokeThickness: 2
  }).setOrigin(0.5, 0).setDepth(5);
  let entered = false;
  let transitioning = false;
  const hiddenTiles = [];
  scene.groundLayer.forEachTile(tile => {
    if (tile.y >= 11 || tile.index < 0) return;
    hiddenTiles.push({ tile, alpha: tile.alpha, collision: [tile.collideLeft, tile.collideRight, tile.collideUp, tile.collideDown] });
    tile.alpha = 0;
    tile.setCollision(false, false, false, false);
  });
  const hiddenObjects = [
    ...scene.enemies.getChildren(), ...scene.coinsGroup.getChildren(),
    ...[...scene.coinBlocks.values()].map(block => block.image)
  ].filter(Boolean).map(object => ({ object, visible: object.visible, enabled: object.body?.enable }));
  hiddenObjects.forEach(({ object }) => {
    object.setVisible(false);
    if (object.body) object.body.enable = false;
  });

  scene.events.once('shutdown', () => {
    glimpse.clearMask();
    mask.destroy();
    opening.destroy();
  });

  return {
    get outside() { return !entered; },
    update() {
      if (entered) return false;
      if (transitioning) return true;
      if (scene.player.x < center - 3) return false;
      // Land at the doorway if the player jumps toward the entrance.
      scene.player.x = center - 3;
      if (!scene.player.body.blocked.down) return false;
      transitioning = true;
      scene.player.setVelocity(0, 0).play('player-idle', true);
      scene.physics.world.pause();
      camera.fadeOut(300, 15, 21, 12);
      scene.time.delayedCall(300, () => {
        inside.setAlpha(1);
        gate.setVisible(false);
        glimpse.setVisible(false);
        hint.setVisible(false);
        hiddenTiles.forEach(({ tile, alpha, collision }) => {
          tile.alpha = alpha;
          tile.setCollision(...collision);
        });
        hiddenObjects.forEach(({ object, visible, enabled }) => {
          object.setVisible(visible);
          if (object.body) object.body.enable = enabled;
        });
        scene.player.body.reset(50, 180);
        camera.centerOn(scene.player.x, scene.player.y);
        camera.fadeIn(550, 15, 21, 12);
        scene.time.delayedCall(550, () => {
          entered = true;
          transitioning = false;
          scene.physics.world.resume();
        });
      });
      return true;
    }
  };
}
