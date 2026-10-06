export function addTempleAmbience(scene, width) {
  // Dark canopy edges frame the temple without hiding the route or platforms.
  const canopy = scene.add.graphics().setDepth(-18);
  for (let x = -30, index = 0; x < width + 40; x += 245, index++) {
    const reach = 34 + (index % 3) * 12;
    canopy.lineStyle(4, 0x263829, 0.9).lineBetween(x, -8, x + reach, 38 + (index % 2) * 10);
    canopy.lineStyle(2, 0x53613a, 0.82).lineBetween(x + 8, -2, x + reach + 13, 31);
    for (let leaf = 0; leaf < 5; leaf++) {
      const lx = x + 8 + leaf * 12 + (index % 2) * 5;
      const ly = 21 + (leaf % 2) * 10;
      canopy.fillStyle(leaf % 2 ? 0x50633b : 0x70804a, 0.9)
        .fillEllipse(lx, ly, 11, 5);
    }
  }

  // Golden fireflies drift through the ruins at several depths.
  for (let i = 0; i < Math.ceil(width / 125); i++) {
    const x = 52 + i * 119;
    const y = 76 + (i * 43) % 105;
    const glow = scene.add.circle(x, y, i % 4 === 0 ? 2 : 1.4, 0xffd681, 0.7)
      .setDepth(-14);
    scene.tweens.add({ targets: glow, x: x + 8, y: y - 7, alpha: 0.08,
      duration: 1300 + (i % 5) * 230, yoyo: true, repeat: -1, delay: i * 95,
      ease: 'Sine.easeInOut' });
  }
}
