export function prepareEnemySkin(scene) {
  if (scene.textures.exists('enemy-crabs') || !scene.textures.exists('enemy-source')) return;
  const source = scene.textures.get('enemy-source').getSourceImage();
  const texture = scene.textures.createCanvas('enemy-crabs', 96 * 3, 96);
  const crops = [[86, 320, 302, 239], [410, 320, 348, 239], [782, 320, 334, 239]];
  crops.forEach(([x, y, w, h], frame) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    // Remove only cyan connected to the outside, preserving the blue crab's body.
    const seen = new Uint8Array(w * h), queue = [];
    const visit = p => {
      if (seen[p]) return;
      seen[p] = 1;
      const i = p * 4;
      const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
      if (g - r > 35 && b - r > 35 && Math.abs(g - b) < 35 && g > 120) {
        pixels.data[i + 3] = 0;
        queue.push(p);
      }
    };
    for (let px = 0; px < w; px++) { visit(px); visit((h - 1) * w + px); }
    for (let py = 0; py < h; py++) { visit(py * w); visit(py * w + w - 1); }
    for (let q = 0; q < queue.length; q++) {
      const p = queue[q], px = p % w, py = Math.floor(p / w);
      if (px > 0) visit(p - 1);
      if (px < w - 1) visit(p + 1);
      if (py > 0) visit(p - w);
      if (py < h - 1) visit(p + w);
    }
    ctx.putImageData(pixels, 0, 0);
    const scale = 92 / w;
    texture.context.drawImage(canvas, frame * 96 + 2, 96 - h * scale, 92, h * scale);
    texture.add(frame, 0, frame * 96, 0, 96, 96);
  });
  texture.refresh();
}
