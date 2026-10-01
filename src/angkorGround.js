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
    ledge: [205, 5, 88, 94],
    vineLedge: [305, 5, 88, 94],
    stone: [7, 7, 86, 91],
    cracked: [107, 7, 86, 91],
    carved: [206, 110, 87, 86],
    lotus: [405, 7, 87, 91]
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
    block.refresh();
  }
  return key;
}
