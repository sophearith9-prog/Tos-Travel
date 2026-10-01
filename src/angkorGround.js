// Reuse the supplied temple artwork without changing Tiled IDs or collisions.
export function prepareAngkorGround(scene) {
  const key = 'angkor-ground-tiles';
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get('tiles').getSourceImage();
  const artwork = scene.textures.get('temple-part-source').getSourceImage();
  const texture = scene.textures.createCanvas(key, source.width, source.height);
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;
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
  replace(48, 'lotus');
  texture.refresh();

  // Coin-block overlays also need the temple finish, including the end steps.
  for (const [name, crop] of [['temple-used-block', 'stone'], ['temple-coin-block', 'lotus']]) {
    if (scene.textures.exists(name)) continue;
    const block = scene.textures.createCanvas(name, 18, 18);
    block.context.imageSmoothingEnabled = false;
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
