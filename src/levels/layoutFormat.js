// Hand-made level layout format (stages 10-28).
//
// A layout file (src/levels/levelNNLayout.js) default-exports `defineLayout({...})`.
// All coordinates are world pixels; tiles are 18px, so multiples of 18 line up with
// the rest of the game. See src/levels/levelTemplateLayout.js for an annotated example.
//
//   level        stage number (10-28); must match the province at that position in the route
//   province     PROVINCE_ROUTE id for that stage, e.g. 'mondulkiri' (checked at registration)
//   title        optional stage title (defaults to the province name)
//   width/height world size in px. Keep height 270 and camera.zoom 2.2 to match the
//                biome backdrop of the generated stages; taller stages work too.
//   camera       { zoom }                       default 2.2
//   terrainStyle 'ground' (biome tiles) | 'stone' | 'wood' | 'bamboo'   default 'ground'
//   spawn        { x, y }                       player start (feet position)
//   finish       { x, floorY, doorX?, flag? }   flag pole x and the floor y under it
//   platforms    [{ x, y, width, height = 18, oneWay = false, style? }]   static solid ground
//   coins        [{ x, y }]
//   enemies      [{ x, y, variant?, kind? }]    same format as Levels 1-9
//   hazards      [{ type: 'spikes' | ..., ... }]     mechanics that hurt (sugar for mechanics)
//   checkpoints  [{ x, floorY, label? }]             sugar for { type: 'checkpoint' } mechanics
//   mechanics    [{ type: 'movingPlatform' | 'sinkingPlatform' | 'risingWater' |
//                   'autoScrollCamera' | 'windZone' | 'checkpoint' | 'spikes' | 'miniBoss', ... }]
//   assets       [{ key, url }]                 extra images loaded in GameScene.preload
//   environment  optional override of the biome/time/weather/landmark from biomeConfig.js

export const TILE = 18;

export function defineLayout(spec) {
  const layout = {
    title: null,
    height: 270,
    camera: { zoom: 2.2 },
    terrainStyle: 'ground',
    platforms: [],
    coins: [],
    enemies: [],
    hazards: [],
    checkpoints: [],
    mechanics: [],
    assets: [],
    environment: null,
    ...spec
  };
  layout.camera = { zoom: 2.2, ...(spec.camera || {}) };
  layout.finish = { flag: true, doorX: spec.finish?.x, ...(spec.finish || {}) };
  return layout;
}

// Every mechanic a layout asks for, with hazards and checkpoints folded in.
export function layoutMechanics(layout) {
  return [
    ...layout.checkpoints.map(cp => ({ type: 'checkpoint', ...cp })),
    ...layout.hazards,
    ...layout.mechanics
  ];
}

export function validateLayout(layout, provinceId) {
  const problems = [];
  const need = (cond, message) => { if (!cond) problems.push(message); };
  need(Number.isInteger(layout.level) && layout.level >= 10, 'level must be an integer from 10 to 28 (Levels 1-9 are hand-built elsewhere)');
  need(!provinceId || layout.province === provinceId, `province must be '${provinceId}' for level ${layout.level}`);
  need(layout.width > 0 && layout.width % TILE === 0, `width must be a positive multiple of ${TILE}`);
  need(layout.height > 0 && layout.height % TILE === 0, `height must be a positive multiple of ${TILE}`);
  need(layout.spawn && Number.isFinite(layout.spawn.x) && Number.isFinite(layout.spawn.y), 'spawn {x, y} is required');
  need(layout.finish && Number.isFinite(layout.finish.x) && Number.isFinite(layout.finish.floorY), 'finish {x, floorY} is required');
  need(layout.platforms.length > 0, 'at least one platform is required');
  layout.platforms.forEach((p, i) => need(p.width > 0 && Number.isFinite(p.x) && Number.isFinite(p.y), `platforms[${i}] needs x, y and width`));
  layoutMechanics(layout).forEach((m, i) => need(typeof m.type === 'string', `mechanic ${i} needs a type`));
  if (problems.length) throw new Error(`Layout for level ${layout.level}:\n - ${problems.join('\n - ')}`);
  return layout;
}

// An empty tilemap the size of the layout. GameScene still needs a map for bounds and
// the (invisible) Platforms layer; real collisions come from installLayoutTerrain().
export function createLayoutMap(layout) {
  const width = Math.round(layout.width / TILE), height = Math.round(layout.height / TILE);
  return { width, height, tilewidth: TILE, tileheight: TILE, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: new Array(width * height).fill(0) }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: TILE, tileheight: TILE,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}
