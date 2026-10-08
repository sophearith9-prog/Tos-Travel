export function addMoatWater(scene) {
  const water = scene.add.graphics();
  water.fillStyle(0x173a36, 0.92).fillRect(0, 405, 800, 45);
  water.fillStyle(0x52714d, 0.78).fillRect(0, 405, 800, 2);
  for (let i = 0; i < 18; i++) {
    const x = (i * 83 + 17) % 800;
    const y = 416 + (i * 19) % 30;
    const ripple = scene.add.rectangle(x, y, 9 + (i % 4) * 5, 2,
      i % 2 ? 0xc47b3e : 0xf3c05b, 0.55).setDepth(1);
    scene.tweens.add({ targets: ripple, x: x + 12, alpha: 0.12, duration: 900 + (i % 5) * 170,
      yoyo: true, repeat: -1, delay: i * 45 });
  }
  return water;
}

export function createLongboat(scene, x, y, scale = 1) {
  const boat = scene.add.container(x, y).setScale(scale).setDepth(0);
  const hull = scene.add.graphics();
  hull.fillStyle(0x120f16, 0.58).fillPoints([
    { x: 1, y: 3 }, { x: 165, y: 3 }, { x: 148, y: 17 },
    { x: 116, y: 22 }, { x: 59, y: 22 }, { x: 17, y: 15 }
  ], true);
  hull.fillStyle(0x713b2e).fillPoints([
    { x: -5, y: -5 }, { x: 17, y: 0 }, { x: 54, y: 6 }, { x: 104, y: 9 },
    { x: 143, y: 4 }, { x: 166, y: -6 }, { x: 157, y: 8 }, { x: 141, y: 17 },
    { x: 111, y: 22 }, { x: 59, y: 22 }, { x: 19, y: 15 }, { x: 3, y: 7 }
  ], true);
  hull.lineStyle(2, 0xf0c36d, 1).strokePoints([
    { x: -5, y: -5 }, { x: 26, y: 2 }, { x: 66, y: 8 }, { x: 110, y: 8 },
    { x: 147, y: 2 }, { x: 166, y: -6 }
  ], false);
  hull.lineStyle(2, 0xf1d38c, 1)
    .lineBetween(0, -4, -8, -12).lineBetween(-8, -12, -2, -18)
    .lineBetween(161, -4, 170, -12).lineBetween(170, -12, 165, -18);
  for (let x = 28; x <= 138; x += 22) {
    hull.fillStyle(0xf3cd7b).fillTriangle(x - 3, 7, x, 3, x + 3, 8);
  }
  const rider = scene.add.sprite(79, 1, 'player-character', 0)
    .setOrigin(0.5, 1).setScale(0.39);
  boat.add([hull, rider]);
  boat.rider = rider;
  return boat;
}
