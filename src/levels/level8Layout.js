// Mekong river-island route aligned to the Level 8 panorama.
export const LEVEL8 = {
  width: 1620,
  height: 810,
  spawn: { x: 70, y: 500 },
  finish: { x: 1550, doorX: 1570, floorY: 347 },
  ledges: [
    { x: 0, y: 514, width: 310 },
    { x: 365, y: 476, width: 790 },
    { x: 1135, y: 384, width: 250 },
    { x: 1480, y: 347, width: 140 }
  ],
  coins: [
    { x: 100, y: 484 }, { x: 230, y: 484 },
    { x: 450, y: 446 }, { x: 600, y: 446 }, { x: 750, y: 446 }, { x: 900, y: 446 },
    { x: 1190, y: 354 }, { x: 1320, y: 354 }, { x: 1515, y: 317 }, { x: 1590, y: 317 }
  ],
  enemies: [
    { x: 180, y: 490 }, { x: 530, y: 454 }, { x: 820, y: 454 },
    { x: 1215, y: 362 }, { x: 1550, y: 325 }
  ]
};

export function installLevel8Terrain(scene) {
  const surfaces = LEVEL8.ledges;
  const group = scene.physics.add.staticGroup();
  for (const surface of surfaces) {
    const platform = scene.add.rectangle(surface.x + surface.width / 2,
      surface.y + 5, surface.width, 10, 0xffffff, 0);
    group.add(platform);
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
  }
  scene.level8Terrain = { group, surfaces };
  return group;
}
