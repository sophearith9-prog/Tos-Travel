// One 18px carved sandstone block: bevelled edges, a recessed panel with a lotus
// medallion, weathering and a little moss on the top lip.
function drawCarvedSandstone(ctx, x, y) {
  const px = (dx, dy, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x + dx, y + dy, w, h); };
  ctx.clearRect(x, y, 18, 18);
  px(0, 0, 18, 18, '#5a3a1e');            // mortar / outline
  px(0, 0, 17, 17, '#bf8a4c');            // block face
  px(0, 0, 17, 1, '#e8c07c');             // lit top edge
  px(0, 0, 1, 17, '#e2b672');             // lit left edge
  px(1, 16, 16, 1, '#8f6233');            // shaded bottom
  px(16, 1, 1, 16, '#9c6c38');            // shaded right
  // Recessed carved panel.
  px(3, 3, 11, 11, '#99683a');
  px(3, 3, 11, 1, '#7a5228'); px(3, 3, 1, 11, '#7a5228');
  px(4, 13, 10, 1, '#e3bd7c'); px(13, 4, 1, 10, '#e3bd7c');
  // Lotus medallion: four petals around a bud.
  px(8, 5, 2, 3, '#6d4620'); px(8, 10, 2, 3, '#6d4620');
  px(5, 8, 3, 2, '#6d4620'); px(10, 8, 3, 2, '#6d4620');
  px(8, 6, 1, 1, '#f2d39a'); px(6, 8, 1, 1, '#f2d39a');
  px(7, 7, 4, 4, '#82552a'); px(8, 8, 2, 2, '#f4dca6');
  // Weathering and moss.
  for (const [dx, dy] of [[2, 14], [14, 2], [12, 15], [1, 9], [15, 11]]) px(dx, dy, 1, 1, '#9a6a35');
  px(2, 0, 3, 1, '#7d9a4a'); px(11, 0, 2, 1, '#6f8c40'); px(3, 1, 1, 1, '#5d7a34');
}

// Reuse the supplied temple artwork without changing Tiled IDs or collisions.
export function prepareAngkorGround(scene) {
  const key = 'angkor-ground-tiles';
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get('tiles').getSourceImage();
  const artwork = scene.textures.get('temple-part-source').getSourceImage();
  const texture = scene.textures.createCanvas(key, source.width, source.height);
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0);

  // These are complete illustrated blocks, not the arbitrary 32px TSX cells.
  const crops = {
    ledge: [535, 735, 275, 85],
    vineLedge: [380, 853, 175, 65],
    stone: [42, 771, 140, 40],
    cracked: [1240, 751, 110, 58],
    carved: [778, 582, 140, 87],
    lotus: [977, 593, 114, 78]
  };
  const replace = (id, crop) => {
    const x = ((id - 1) % 20) * 18;
    const y = Math.floor((id - 1) / 20) * 18;
    ctx.clearRect(x, y, 18, 18);
    ctx.drawImage(artwork, ...crops[crop], x, y, 18, 18);
  };
  [1, 2, 3].forEach(id => replace(id, 'ledge'));
  replace(21, 'cracked');
  replace(22, 'stone');
  replace(23, 'carved');
  // Tile 48 is the end-of-stage staircase (the guardian stairs); coin blocks cover it with
  // their own overlay. Carved sandstone that matches the temple walls.
  drawCarvedSandstone(ctx, ((48 - 1) % 20) * 18, Math.floor((48 - 1) / 20) * 18);
  texture.refresh();

  // Coin-block overlays also need the temple finish, including the end steps.
  for (const [name, crop] of [['temple-used-block', 'stone'], ['temple-coin-block', 'lotus']]) {
    if (scene.textures.exists(name)) continue;
    const block = scene.textures.createCanvas(name, 18, 18);
    block.context.imageSmoothingEnabled = true;
    block.context.drawImage(artwork, ...crops[crop], 0, 0, 18, 18);
    // Keep reward boxes legible against the detailed temple backdrop.
    if (name === 'temple-coin-block') {
      const ctx = block.context;
      ctx.fillStyle = '#392510';
      ctx.fillRect(0, 0, 18, 18);
      ctx.fillStyle = '#efb94e';
      ctx.fillRect(1, 1, 16, 16);
      ctx.fillStyle = '#ffe49a';
      ctx.fillRect(2, 2, 14, 2);
      ctx.fillStyle = '#a26725';
      ctx.fillRect(2, 14, 14, 2);
      ctx.fillStyle = '#503416';
      const question = ['111', '001', '011', '010', '000', '010'];
      question.forEach((row, y) => [...row].forEach((pixel, x) => {
        if (pixel === '1') ctx.fillRect(6 + x * 2, 3 + y * 2, 2, 2);
      }));
    }
    block.refresh();
  }
  return key;
}
