export function prepareEnemySkin(scene) {
  if (scene.textures.exists('enemy-guardians') || !scene.textures.exists('enemy-source')) return;
  const source = scene.textures.get('enemy-source').getSourceImage();
  const texture = scene.textures.createCanvas('enemy-guardians', 96 * 3, 96);
  texture.context.imageSmoothingEnabled = false;
  const crops = Array.from({ length: 3 }, (_, frame) => {
    const x = Math.floor(frame * source.width / 3);
    return [x, 0, Math.floor((frame + 1) * source.width / 3) - x, source.height];
  });
  crops.forEach(([x, y, w, h], frame) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    // Trim transparent padding before sizing each guardian to the existing frame.
    let left = w, right = 0, top = h, bottom = -1;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      if (pixels.data[(py * w + px) * 4 + 3] <= 16) continue;
      left = Math.min(left, px); right = Math.max(right, px);
      top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    if (bottom >= top) {
      const width = right - left + 1, height = bottom - top + 1;
      const scale = Math.min(92 / width, 92 / height);
      texture.context.drawImage(canvas, left, top, width, height,
        frame * 96 + (96 - width * scale) / 2, 96 - height * scale,
        width * scale, height * scale);
    }
    texture.add(frame, 0, frame * 96, 0, 96, 96);
  });
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
