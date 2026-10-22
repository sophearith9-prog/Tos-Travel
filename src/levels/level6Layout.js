// Coordinates measured on the artwork displayed at 810 x 810 world pixels.
// Physics and decoration share this layout so their positions cannot drift.
export const LEVEL6 = {
  size: 810,
  spawn: { x: 70, y: 210 },
  // Temple doorway on the middle-right ledge in the level artwork.
  finish: { x: 575, doorX: 575, floorY: 422 },
  ledges: [
    { x: 0, y: 234, width: 345 },
    { x: 520, y: 198, width: 290 },
    { x: 484, y: 422, width: 236 },
    { x: 0, y: 634, width: 378 },
    { x: 501, y: 634, width: 309 }
  ],
  footholds: [
    // A short, visible crossing between the two upper islands.
    { x: 382, y: 222, width: 48 },
    { x: 452, y: 210, width: 48 },
    // Right cliff: each ascent is at most 58 pixels (normal jump: 94).
    { x: 752, y: 254, width: 44 },
    { x: 718, y: 310, width: 44 },
    { x: 752, y: 366, width: 44 },
    { x: 742, y: 476, width: 44 },
    { x: 688, y: 530, width: 48 },
    // Left cliff, alongside the carved face and its existing staircase.
    { x: 18, y: 294, width: 44 },
    { x: 42, y: 354, width: 44 },
    { x: 18, y: 414, width: 44 }
  ],
  bridge: { x: 378, y: 634, width: 123 },
  coins: [
    { x: 200, y: 213 }, { x: 406, y: 200 }, { x: 476, y: 188 },
    { x: 620, y: 177 }, { x: 774, y: 233 }, { x: 740, y: 289 },
    { x: 774, y: 345 }, { x: 590, y: 401 }, { x: 764, y: 455 },
    { x: 710, y: 509 }, { x: 640, y: 569 }, { x: 440, y: 613 },
    { x: 240, y: 613 }, { x: 40, y: 393 }, { x: 64, y: 333 }
  ],
  enemies: [
    { x: 270, y: 210 }, { x: 630, y: 174 },
    { x: 660, y: 398, kind: 'stone-guardian' }, { x: 180, y: 610 }, { x: 690, y: 610 }
  ]
};

export function level6Surfaces() {
  const surfaces = [...LEVEL6.ledges, ...LEVEL6.footholds, LEVEL6.bridge];
  // Follow the visible treads of the two diagonal Khmer staircases.
  for (let y = 450; y <= 618; y += 8) {
    surfaces.push({ x: 84 + (y - 450) * 0.86, y, width: 34 });
  }
  for (let y = 538; y <= 626; y += 8) {
    surfaces.push({ x: 665 - (y - 538) * 0.96, y, width: 38 });
  }
  return surfaces;
}

export function installLevel6Terrain(scene) {
  const surfaces = level6Surfaces();
  const group = scene.physics.add.staticGroup();
  for (const surface of surfaces) {
    const platform = scene.add.rectangle(surface.x + surface.width / 2, surface.y + 5,
      surface.width, 10, 0xffffff, 0);
    group.add(platform);
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
  }
  const texture = scene.textures.get('level6-forest-platforms');
  if (!texture.has('foothold')) {
    const source = texture.getSourceImage();
    const scale = source.width / LEVEL6.size;
    texture.add('foothold', 0, Math.round(270 * scale), Math.round(234 * scale),
      Math.round(48 * scale), Math.round(27 * scale));
  }
  for (const surface of LEVEL6.footholds) {
    scene.add.image(surface.x, surface.y, texture.key, 'foothold')
      .setOrigin(0).setDisplaySize(surface.width, 27).setDepth(-5);
  }
  // A real, visible bridge replaces the old invisible floor over the waterfall.
  const g = scene.add.graphics().setDepth(-4);
  const { x, y, width } = LEVEL6.bridge;
  g.fillStyle(0x453327).fillRect(x, y + 4, width, 7);
  for (let dx = 0; dx < width; dx += 9) {
    g.fillStyle(0xb38c52).fillRect(x + dx, y, Math.min(8, width - dx), 5);
    g.fillStyle(0xe0bd79).fillRect(x + dx, y, Math.min(8, width - dx), 1);
  }
  for (const px of [x + 2, x + width - 4]) {
    g.fillStyle(0x705033).fillRect(px, y - 22, 4, 30);
    g.fillStyle(0xc7a76c).fillRect(px, y - 22, 2, 27);
  }
  g.lineStyle(2, 0xc7a76c).beginPath().moveTo(x + 3, y - 19)
    .lineTo(x + width / 2, y - 12).lineTo(x + width - 2, y - 19).strokePath();
  scene.level6Terrain = {
    group,
    surfaces,
    hasSupport: (x, y) => surfaces.some(s => x >= s.x && x <= s.x + s.width && Math.abs(s.y - y) < 7)
  };
  return group;
}
