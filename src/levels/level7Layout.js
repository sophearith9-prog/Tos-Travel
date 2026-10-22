// Preah Vihear pilgrimage route aligned to the regenerated panorama.
export const LEVEL7 = {
  width: 1620,
  height: 810,
  spawn: { x: 70, y: 625 },
  finish: { x: 1530, doorX: 1550, floorY: 245 },
  ledges: [
    // World coordinates map directly to the four clear grass caps in the art.
    { x: 0, y: 644, width: 640 },
    { x: 365, y: 478, width: 780 },
    { x: 850, y: 338, width: 480 },
    { x: 1170, y: 245, width: 450 }
  ],
  coins: [
    { x: 150, y: 614 }, { x: 270, y: 614 }, { x: 420, y: 448 },
    { x: 560, y: 448 }, { x: 700, y: 448 }, { x: 840, y: 448 },
    { x: 930, y: 308 }, { x: 1080, y: 308 }, { x: 1230, y: 215 },
    { x: 1400, y: 215 }, { x: 1540, y: 215 }
  ],
  enemies: [
    { x: 220, y: 620 }, { x: 500, y: 454 }, { x: 760, y: 454 },
    { x: 1030, y: 314 }, { x: 1250, y: 221 }, { x: 1500, y: 221 }
  ]
};

export function installLevel7Terrain(scene) {
  const surfaces = LEVEL7.ledges;
  const group = scene.physics.add.staticGroup();
  for (const surface of surfaces) {
    const platform = scene.add.rectangle(surface.x + surface.width / 2,
      surface.y + 5, surface.width, 10, 0xffffff, 0);
    group.add(platform);
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
  }
  scene.level7Terrain = {
    group,
    surfaces,
    hasSupport: (x, y) => surfaces.some(s => x >= s.x && x <= s.x + s.width && Math.abs(s.y - y) < 7)
  };
  return group;
}
