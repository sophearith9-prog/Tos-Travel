// Sandstone palettes: warm Angkor sunset stone, and the grey-green mossy stone of Banteay Chhmar.
export const SANDSTONE = {
  warm: { mortar: '#5a3a1e', face: '#bf8a4c', lit: '#e8c07c', litSide: '#e2b672', shadeB: '#8f6233', shadeR: '#9c6c38',
    panel: '#99683a', panelDark: '#7a5228', panelLit: '#e3bd7c', carve: '#6d4620', carveLit: '#f2d39a', bud: '#82552a', budLit: '#f4dca6',
    wear: '#9a6a35', moss: ['#7d9a4a', '#6f8c40', '#5d7a34'], crack: '#5e3c1e' },
  mossy: { mortar: '#2e2516', face: '#8f7a4e', lit: '#bba274', litSide: '#a99062', shadeB: '#64532f', shadeR: '#6f5c36',
    panel: '#76643f', panelDark: '#54462a', panelLit: '#ae9566', carve: '#4a3d24', carveLit: '#cdb582', bud: '#5f4f30', budLit: '#d8c08c',
    wear: '#66552f', moss: ['#6f8f3a', '#5a7a30', '#3f5e26'], crack: '#382c18' }
};

// One 18px weathered carved sandstone block: bevelled edges, a recessed panel with a lotus
// medallion, a hairline crack, weathering and moss on the top lip.
export function drawCarvedSandstone(ctx, x, y, c = SANDSTONE.warm) {
  const px = (dx, dy, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x + dx, y + dy, w, h); };
  ctx.clearRect(x, y, 18, 18);
  px(0, 0, 18, 18, c.mortar);             // mortar / outline
  px(0, 0, 17, 17, c.face);               // block face
  px(0, 0, 17, 1, c.lit);                 // lit top edge
  px(0, 0, 1, 17, c.litSide);             // lit left edge
  px(1, 16, 16, 1, c.shadeB);             // shaded bottom
  px(16, 1, 1, 16, c.shadeR);             // shaded right
  // Recessed carved panel.
  px(3, 3, 11, 11, c.panel);
  px(3, 3, 11, 1, c.panelDark); px(3, 3, 1, 11, c.panelDark);
  px(4, 13, 10, 1, c.panelLit); px(13, 4, 1, 10, c.panelLit);
  // Lotus medallion: four petals around a bud.
  px(8, 5, 2, 3, c.carve); px(8, 10, 2, 3, c.carve);
  px(5, 8, 3, 2, c.carve); px(10, 8, 3, 2, c.carve);
  px(8, 6, 1, 1, c.carveLit); px(6, 8, 1, 1, c.carveLit);
  px(7, 7, 4, 4, c.bud); px(8, 8, 2, 2, c.budLit);
  // Hairline crack, weathering and moss.
  px(14, 9, 1, 2, c.crack); px(15, 11, 1, 2, c.crack); px(14, 13, 1, 1, c.crack);
  for (const [dx, dy] of [[2, 14], [14, 2], [12, 15], [1, 9], [15, 6]]) px(dx, dy, 1, 1, c.wear);
  px(1, 0, 4, 1, c.moss[0]); px(10, 0, 3, 1, c.moss[1]); px(2, 1, 2, 1, c.moss[2]); px(11, 1, 1, 1, c.moss[2]); px(0, 1, 1, 3, c.moss[1]);
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
