// Transparent Khmer outfit sheet: five columns with four animation rows.
export function prepareCharacterSkin(scene) {
  if (scene.textures.exists('player-character')) return;
  if (!scene.textures.exists('character-skin-source')) return;
  const source = scene.textures.get('character-skin-source').getSourceImage();
  const sheet = scene.textures.createCanvas('player-character', 96 * 5, 96 * 4);
  const rows = [0, 0.245, 0.485, 0.7, 1].map(y => Math.round(y * source.height));
  const frames = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = Math.round(col * source.width / 5);
      const w = Math.round((col + 1) * source.width / 5) - x;
      const h = rows[row + 1] - rows[row];
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(source, x, rows[row], w, h, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      let left = w, top = h, right = -1, bottom = -1;
      for (let i = 0; i < data.data.length; i += 4) {
        // Preserve light clothing; only transparent pixels are background.
        if (data.data[i + 3] >= 24) {
          const px = (i / 4) % w, py = Math.floor(i / 4 / w);
          left = Math.min(left, px); right = Math.max(right, px);
          top = Math.min(top, py); bottom = Math.max(bottom, py);
        }
      }
      ctx.putImageData(data, 0, 0);
      frames.push({ canvas, left, top, width: Math.max(0, right - left + 1),
        height: Math.max(0, bottom - top + 1), row, col });
    }
  }
  // One scale across all poses prevents size changes during animation.
  const scale = Math.min(88 / Math.max(1, ...frames.map(f => f.width)),
    92 / Math.max(1, ...frames.map(f => f.height)));
  for (const { canvas, left, top, width, height, row, col } of frames) {
    if (width && height) sheet.context.drawImage(canvas, left, top, width, height,
      col * 96 + (96 - width * scale) / 2,
      row * 96 + 96 - height * scale, width * scale, height * scale);
    sheet.add(row * 5 + col, 0, col * 96, row * 96, 96, 96);
  }
  sheet.refresh();
}
