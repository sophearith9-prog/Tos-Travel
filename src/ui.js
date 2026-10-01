export function label(scene, x, y, value, size = 16, color = '#eaf1ff') {
  return scene.add.text(x, y, value, {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: size + 'px',
    fontStyle: 'bold', color
  }).setOrigin(0.5);
}
export function panel(scene, x, y, w, h, fill = 0x14243b, border = 0x30445e) {
  const g = scene.add.graphics();
  g.fillStyle(0x030914, 0.3).fillRoundedRect(x, y + 5, w, h, 16);
  g.fillStyle(fill).fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(1, border).strokeRoundedRect(x, y, w, h, 16);
  return g;
}
export function button(scene, x, y, w, title, action, primary = false) {
  const group = scene.add.container(x, y);
  const bg = panel(scene, -w / 2, -22, w, 44,
    primary ? 0xffcf70 : 0x20334b, primary ? 0xffe3a7 : 0x405671);
  const caption = label(scene, 0, 0, title, 15, primary ? '#202b39' : '#eaf1ff');
  group.add([bg, caption]);
  group.setSize(w, 44).setInteractive({ useHandCursor: true });
  group.on('pointerover', () => group.setScale(1.035));
  group.on('pointerout', () => group.setScale(1));
  group.on('pointerdown', action);
  return group;
}
export function backdrop(scene) {
  scene.cameras.main.setBackgroundColor('#0c182b');
  const g = scene.add.graphics();
  g.fillStyle(0x152b42).fillCircle(725, 50, 220);
  g.fillStyle(0x11253b).fillCircle(40, 420, 260);
  for (let i = 0; i < 38; i++) {
    g.fillStyle(i % 3 ? 0x54748a : 0xffcf70, 0.45);
    g.fillRect((i * 137 + 19) % 800, (i * 73 + 21) % 450, 2, 2);
  }
}
export function landscape(scene, x, y) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x7dd4de).fillRoundedRect(0, 0, 310, 278, 20);
  g.fillStyle(0xffe4a3).fillCircle(246, 49, 24);
  g.fillStyle(0xffffff, 0.7);
  [[36, 51], [156, 31]].forEach(([cx, cy]) => {
    g.fillRoundedRect(cx, cy, 66, 14, 7).fillCircle(cx + 24, cy, 13);
  });
  g.fillStyle(0x4baf91).fillTriangle(0, 227, 76, 107, 169, 227);
  g.fillStyle(0x329a83).fillTriangle(94, 227, 203, 121, 310, 227);
  g.fillStyle(0x254e50).fillRoundedRect(0, 218, 310, 60, { tl: 0, tr: 0, bl: 20, br: 20 });
  g.fillStyle(0x8cd882).fillRect(0, 213, 310, 10);
  g.fillStyle(0xe2a964);
  for (let i = 0; i < 3; i++) g.fillRoundedRect(59 + i * 27, 133, 23, 23, 3);
  g.fillStyle(0xffd66e);
  for (let i = 0; i < 3; i++) g.fillCircle(70 + i * 27, 113, 6);
  g.fillStyle(0xf5f2d9).fillRect(243, 89, 4, 124);
  g.fillStyle(0xffcf70).fillCircle(245, 85, 5);
  g.fillStyle(0xef7467).fillTriangle(247, 93, 278, 106, 247, 119);
  g.fillStyle(0xef7467).fillRect(151, 177, 22, 7).fillRect(147, 184, 30, 5);
  g.fillStyle(0xffd3a5).fillRect(153, 189, 18, 10);
  g.fillStyle(0x29486d).fillRect(149, 199, 24, 14);
  g.fillStyle(0x17283f).fillRect(147, 209, 10, 5).fillRect(165, 209, 10, 5);
  return g;
}

export function playSound(scene, key, options) {
  // A failed audio download or unavailable decoder should not stop the game.
  if (scene.cache.audio.exists(key)) scene.sound.play(key, options);
}
