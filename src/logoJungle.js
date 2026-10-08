// Pixel-shaped foliage to seat the title mark naturally in the temple scenes.
export function addLogoJungle(scene, mode = 'intro') {
  const g = scene.add.graphics();
  const compact = mode === 'menu';
  const top = compact ? 58 : 42;
  const end = compact ? 194 : 240;

  const branch = (points, width = 6) => {
    g.lineStyle(width, 0x183321, 0.98);
    g.beginPath();
    points.forEach(([x, y], index) => index ? g.lineTo(x, y) : g.moveTo(x, y));
    g.strokePath();
    g.lineStyle(Math.max(2, width - 3), 0x39702f, 0.95);
    g.beginPath();
    points.forEach(([x, y], index) => index ? g.lineTo(x, y - 1) : g.moveTo(x, y - 1));
    g.strokePath();
  };

  const leaf = (x, y, direction, size = 13) => {
    const tipX = x + direction * size;
    g.fillStyle(0x10291d, 0.98).fillPoints([
      { x, y }, { x: tipX, y: y - 5 }, { x: tipX + direction * 3, y: y + 2 },
      { x: x + direction * 3, y: y + 6 }
    ], true);
    g.fillStyle(0x478537, 1).fillPoints([
      { x: x + direction * 2, y: y }, { x: tipX - direction, y: y - 4 },
      { x: tipX, y: y }, { x: x + direction * 4, y: y + 4 }
    ], true);
    g.fillStyle(0x8ebc42, 0.92).fillRect(x + direction, y - 1, Math.max(3, size * 0.32), 2);
  };

  // Canopy branches frame the title from above; side creepers tuck behind its edges.
  branch([[0, top], [36, top + 7], [71, top + 3], [103, top + 13], [142, top + 10], [177, top + 19]], 8);
  branch([[800, top + 3], [766, top + 13], [732, top + 8], [699, top + 18], [662, top + 15], [628, top + 25]], 8);
  branch([[compact ? 43 : 74, top + 8], [compact ? 60 : 88, top + 45], [compact ? 52 : 98, top + 77],
    [compact ? 69 : 86, top + 106], [compact ? 61 : 100, end]], 5);
  branch([[compact ? 365 : 726, top + 14], [compact ? 351 : 707, top + 49], [compact ? 367 : 716, top + 81],
    [compact ? 348 : 696, top + 112], [compact ? 362 : 713, end - 3]], 5);

  for (const [x, y, direction] of [
    [25, top + 10, 1], [57, top + 14, 1], [93, top + 8, 1], [130, top + 18, 1],
    [775, top + 14, -1], [741, top + 17, -1], [704, top + 18, -1], [668, top + 25, -1],
    [compact ? 58 : 88, top + 39, -1], [compact ? 59 : 92, top + 67, 1],
    [compact ? 64 : 91, top + 94, -1], [compact ? 63 : 96, top + 126, 1],
    [compact ? 356 : 709, top + 42, 1], [compact ? 359 : 711, top + 70, -1],
    [compact ? 354 : 704, top + 99, 1], [compact ? 357 : 708, top + 128, -1]
  ]) leaf(x, y, direction, compact ? 11 : 15);

  // Small moss tufts along the title's lower edge connect it to the ruins.
  for (const x of (compact ? [72, 105, 315, 339] : [187, 225, 574, 612])) {
    g.fillStyle(0x1c3a24).fillRect(x, end - 8, 5, 14);
    leaf(x + 3, end - 2, x < 400 ? 1 : -1, compact ? 10 : 13);
  }
  return g;
}
