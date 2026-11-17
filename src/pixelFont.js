// A small 5x7 pixel font with a baked 1px dark outline, registered as a Phaser bitmap
// font ('hud-pixel'). Glyphs are white so BitmapText.setTint() colours them while the
// outline stays dark - readable on bright and dark backgrounds alike.

export const PIXEL_FONT = 'hud-pixel';
const CELL_W = 7, CELL_H = 9;   // 5x7 glyph + 1px outline on every side

// Rows top to bottom; '#' = pixel. Uppercase only (lowercase is mapped to uppercase).
const GLYPHS = {
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  'x': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....']
};
export const PIXEL_CHARS = Object.keys(GLYPHS).join('');

export function ensurePixelFont(scene) {
  if (scene.cache.bitmapFont.exists(PIXEL_FONT)) return PIXEL_FONT;
  const perRow = 16, rows = Math.ceil(PIXEL_CHARS.length / perRow);
  const key = `${PIXEL_FONT}-texture`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, perRow * CELL_W, rows * CELL_H);
    const ctx = texture.context;
    [...PIXEL_CHARS].forEach((ch, i) => {
      const ox = (i % perRow) * CELL_W + 1, oy = Math.floor(i / perRow) * CELL_H + 1;
      const rowsOf = GLYPHS[ch];
      const on = (x, y) => rowsOf[y]?.[x] === '#';
      // Outline: any empty pixel touching a glyph pixel (8 directions) becomes dark.
      ctx.fillStyle = '#120c08';
      for (let y = -1; y <= 7; y++) for (let x = -1; x <= 5; x++) {
        if (on(x, y)) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) { near = true; break; }
        if (near) ctx.fillRect(ox + x, oy + y, 1, 1);
      }
      ctx.fillStyle = '#ffffff';
      for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (on(x, y)) ctx.fillRect(ox + x, oy + y, 1, 1);
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.cache.bitmapFont.add(PIXEL_FONT, Phaser.GameObjects.RetroFont.Parse(scene, {
    image: key, width: CELL_W, height: CELL_H, chars: PIXEL_CHARS, charsPerRow: perRow,
    spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, lineSpacing: 0
  }));
  return PIXEL_FONT;
}

// Pixel text: uppercase, outlined, crisp. `scale` multiplies the 7x9 cell.
export function pixelText(scene, x, y, text, scale = 2, tint = 0xffffff) {
  ensurePixelFont(scene);
  return scene.add.bitmapText(x, y, PIXEL_FONT, String(text).toUpperCase(), CELL_H)
    .setScale(scale).setLetterSpacing(-1).setTint(tint);
}
