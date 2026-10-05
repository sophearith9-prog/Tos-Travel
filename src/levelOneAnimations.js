export function addLivingMorning(scene, width) {
  // Keep the morning light visible from the first screen of the level.
  const sunX = 260;
  const glow = scene.add.circle(sunX, 75, 62, 0xffdf91, 0.13).setDepth(-19);
  scene.tweens.add({ targets: glow, scale: 1.25, alpha: 0.06, duration: 3000,
    ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

  const rays = scene.add.graphics().setDepth(-19);
  rays.fillStyle(0xffe3a6, 0.055);
  rays.fillPoints([{ x: 260, y: 83 }, { x: 208, y: 196 }, { x: 246, y: 196 }], true);
  rays.fillPoints([{ x: 265, y: 81 }, { x: 284, y: 196 }, { x: 332, y: 196 }], true);
  rays.fillPoints([{ x: 257, y: 84 }, { x: 354, y: 195 }, { x: 388, y: 195 }], true);
  scene.tweens.add({ targets: rays, alpha: 0.55, duration: 3400,
    ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

  // Thin cloud ribbons drift across the morning sky above the distant scenery.
  for (let i = 0; i < Math.ceil(width / 230); i++) {
    const x = 80 + i * 230;
    const y = 42 + (i % 4) * 18;
    const cloud = scene.add.graphics().setPosition(x, y).setDepth(-19).setAlpha(0.32);
    cloud.lineStyle(2, 0xffffff, 0.72);
    cloud.lineBetween(0, 1, 28, -2);
    cloud.lineBetween(20, 0, 56, -1);
    cloud.lineStyle(1, 0xfff4db, 0.58);
    cloud.lineBetween(38, 6, 68, 5);
    scene.tweens.add({ targets: cloud, x: x + 25, alpha: 0.16,
      duration: 4200 + (i % 3) * 500, yoyo: true, repeat: -1, delay: i * 270 });
  }

  // A small flock glides over Trapeang Thmor, replacing the painted, static birds.
  const flock = scene.add.container(1645, 112).setDepth(-18);
  for (let i = 0; i < 3; i++) {
    const bird = scene.add.graphics().setPosition(i * 19, i % 2 ? 8 : 0);
    bird.lineStyle(1.5, 0x51483d, 0.9);
    bird.strokePoints([
      { x: -6, y: 1 }, { x: -3, y: -2 }, { x: 0, y: 0 },
      { x: 3, y: -2 }, { x: 6, y: 1 }
    ], false);
    flock.add(bird);
    scene.tweens.add({ targets: bird, scaleY: 0.55, duration: 320 + i * 65,
      yoyo: true, repeat: -1, delay: i * 100, ease: 'Sine.easeInOut' });
  }
  scene.tweens.add({ targets: flock, x: 1785, y: 103, duration: 7800,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Sunlight flickers gently on the marsh water and lotus leaves.
  for (let i = 0; i < 11; i++) {
    const x = 1580 + (i * 31) % 300;
    const y = 155 + (i * 13) % 38;
    const glint = scene.add.ellipse(x, y, 5 + (i % 3) * 2, 1.2, 0xffe4a0, 0.55)
      .setDepth(-18);
    scene.tweens.add({ targets: glint, x: x + 9, alpha: 0.08,
      duration: 700 + (i % 4) * 210, yoyo: true, repeat: -1, delay: i * 120 });
  }

  // Warm pollen motes drift through the light above the fields and ruins.
  for (let i = 0; i < Math.ceil(width / 150); i++) {
    const x = 55 + i * 143;
    const y = 93 + (i * 47) % 93;
    const mote = scene.add.circle(x, y, i % 3 === 0 ? 1.5 : 1, 0xffe6a3, 0.45)
      .setDepth(-14);
    scene.tweens.add({ targets: mote, y: y - 7, alpha: 0.08,
      duration: 1100 + (i % 4) * 260, yoyo: true, repeat: -1, delay: i * 80 });
  }
}
