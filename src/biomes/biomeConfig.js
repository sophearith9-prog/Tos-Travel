// Biome palettes, time-of-day presets and the per-province environment assignment.
// Stages 1-9 keep their hand-made art; stages 10-28 are painted from these settings.

// Base colours per biome. Layers further away are mixed toward the time-of-day haze.
export const BIOMES = {
  'temple-jungle': {
    ground: '#7a6a4a', grass: '#6f8f4a', dark: '#2f4a35', mid: '#4d6e44', light: '#86a35a',
    trunk: '#5a4330', stone: '#9c8a62', stoneLight: '#c9b484', stoneDark: '#5d5240',
    brick: '#a65a3c', brickLight: '#cf7d52', water: '#5f8f86', waterLight: '#a9d2c2',
    roof: '#8a4b33', accent: '#d9a441', sand: '#c8b07a', farA: '#5f7d6a', farB: '#7f9a80'
  },
  'mekong-river': {
    ground: '#8a6a45', grass: '#7fa05a', dark: '#35553c', mid: '#56784a', light: '#93b265',
    trunk: '#6a5238', stone: '#b09a72', stoneLight: '#dcc596', stoneDark: '#6a5a44',
    brick: '#a8603e', brickLight: '#cf8a5a', water: '#6f9a95', waterLight: '#c4e0d0',
    roof: '#9a5a3a', accent: '#e0b04a', sand: '#d2bb86', farA: '#6f8f7c', farB: '#93ad95'
  },
  'rice-fields': {
    ground: '#80603c', grass: '#9fbf5a', dark: '#3f6a3a', mid: '#6e9a48', light: '#b8d36a',
    trunk: '#6a5034', stone: '#b8a27a', stoneLight: '#e2cc9a', stoneDark: '#6e5c45',
    brick: '#a8603e', brickLight: '#d08a5c', water: '#86b0a8', waterLight: '#d6eadc',
    roof: '#a2603c', accent: '#e8bf55', sand: '#d8c08a', farA: '#7f9f78', farB: '#a5bd92'
  },
  coast: {
    ground: '#c9a871', grass: '#8fb35e', dark: '#2f5a48', mid: '#4f8058', light: '#8fbf68',
    trunk: '#7a6040', stone: '#b8a88a', stoneLight: '#e6d8b4', stoneDark: '#6e6250',
    brick: '#b0603e', brickLight: '#d88a5c', water: '#3fa6b4', waterLight: '#c8f0ee',
    roof: '#b0603e', accent: '#f0c25a', sand: '#ecd9a8', farA: '#5d9aa0', farB: '#8fc0bc'
  },
  'highland-forest': {
    ground: '#8e4f34', grass: '#6f9a52', dark: '#264a36', mid: '#3f6a46', light: '#7aa35c',
    trunk: '#4f3a2a', stone: '#8f8a78', stoneLight: '#c2bca4', stoneDark: '#55524a',
    brick: '#9a5236', brickLight: '#c27a52', water: '#6fb3b8', waterLight: '#e2f6f2',
    roof: '#8a4a32', accent: '#e2b04a', sand: '#c49a6a', farA: '#4f7466', farB: '#7c9a8a'
  },
  'floating-village': {
    ground: '#7a6448', grass: '#86a35c', dark: '#3a5a44', mid: '#5d7f50', light: '#9ab86a',
    trunk: '#5e4a34', stone: '#a8987a', stoneLight: '#d6c49a', stoneDark: '#65584a',
    brick: '#a05c3c', brickLight: '#c88458', water: '#7aa4a2', waterLight: '#d0e6dc',
    roof: '#8f5b3c', accent: '#e0b450', sand: '#cdb88a', farA: '#7e9a8c', farB: '#a4b8a6'
  },
  city: {
    ground: '#7d756a', grass: '#6f9256', dark: '#2e3f3a', mid: '#4c6a52', light: '#88a868',
    trunk: '#5a4634', stone: '#d8c08a', stoneLight: '#f2dca6', stoneDark: '#8a6e46',
    brick: '#b06a40', brickLight: '#d89060', water: '#4f7d90', waterLight: '#b8dce4',
    roof: '#c98a3a', accent: '#f2c45a', sand: '#cdb98c', farA: '#5c6d78', farB: '#7d8c94'
  }
};

// Sky gradient, sun/moon, haze for distant layers, and a light overlay on the world.
export const TIMES = {
  sunrise: {
    skyTop: '#6c80b4', skyMid: '#e7a2a0', skyBottom: '#ffd8a0', haze: '#f0c8ac', cloud: '#ffe0c8', cloudShade: '#d99a98',
    sun: { x: 300, y: 104, r: 15, color: '#fff2c4', glow: '#ffb47a' }, overlay: [0xff9a6a, 0.06]
  },
  midday: {
    skyTop: '#4f9fdc', skyMid: '#88c6ee', skyBottom: '#d8f0f2', haze: '#cfe4ea', cloud: '#ffffff', cloudShade: '#c6dceb',
    sun: { x: 322, y: 38, r: 12, color: '#fffbe8', glow: '#fff1a8' }, overlay: null
  },
  afternoon: {
    skyTop: '#6aa2d4', skyMid: '#a8cde0', skyBottom: '#f0e0b6', haze: '#e4dcc2', cloud: '#fff8e8', cloudShade: '#d8cdb8',
    sun: { x: 330, y: 60, r: 13, color: '#fff6d6', glow: '#ffdf96' }, overlay: [0xffc070, 0.04]
  },
  sunset: {
    skyTop: '#46407a', skyMid: '#d8656a', skyBottom: '#ffb25c', haze: '#e49a7e', cloud: '#ffb48a', cloudShade: '#a8526a',
    sun: { x: 300, y: 118, r: 19, color: '#ffe8a2', glow: '#ff8a4a' }, overlay: [0xff7a3a, 0.08]
  },
  night: {
    skyTop: '#0a1330', skyMid: '#1c2c55', skyBottom: '#35507c', haze: '#2c4366', cloud: '#3c4c72', cloudShade: '#25335a',
    moon: { x: 320, y: 42, r: 10, color: '#fff6d8', glow: '#9fb6e8' }, stars: true, overlay: [0x0b1430, 0.26]
  },
  mist: {
    skyTop: '#9db2b8', skyMid: '#c8d3ce', skyBottom: '#e8e6d6', haze: '#dfe3da', cloud: '#f4f4ec', cloudShade: '#c8d0cc',
    sun: { x: 300, y: 66, r: 13, color: '#fffbea', glow: '#f2efdc' }, overlay: [0xe6ebe6, 0.07]
  }
};

// Rain darkens the sky toward an overcast grey and adds its own overlay.
export const RAIN = { skyMix: '#7a8792', amount: 0.55, overlay: [0x4a5a6a, 0.16] };

// Per-province environment (stages 10-28). `landmark` selects the midground set piece.
export const PROVINCE_ENVIRONMENTS = {
  mondulkiri: { biome: 'highland-forest', time: 'sunrise', weather: 'clear', landmark: 'bousra-falls' },
  kratie: { biome: 'mekong-river', time: 'sunset', weather: 'clear', landmark: 'kampi-dolphins' },
  'tboung-khmum': { biome: 'rice-fields', time: 'midday', weather: 'clear', landmark: 'rubber-plantation' },
  'svay-rieng': { biome: 'rice-fields', time: 'midday', weather: 'clear', landmark: 'bavet-gate' },
  'prey-veng': { biome: 'rice-fields', time: 'sunset', weather: 'clear', landmark: 'ba-phnom' },
  kandal: { biome: 'mekong-river', time: 'afternoon', weather: 'clear', landmark: 'silk-island' },
  'phnom-penh': { biome: 'city', time: 'night', weather: 'clear', landmark: 'royal-palace' },
  takeo: { biome: 'temple-jungle', time: 'sunset', weather: 'clear', landmark: 'phnom-da' },
  kep: { biome: 'coast', time: 'midday', weather: 'clear', landmark: 'kep-crab-market' },
  kampot: { biome: 'coast', time: 'afternoon', weather: 'rain', landmark: 'bokor-river' },
  'preah-sihanouk': { biome: 'coast', time: 'midday', weather: 'clear', landmark: 'koh-rong' },
  'koh-kong': { biome: 'coast', time: 'afternoon', weather: 'rain', landmark: 'mangrove-tatai' },
  pailin: { biome: 'highland-forest', time: 'mist', weather: 'clear', landmark: 'phnom-yat' },
  battambang: { biome: 'rice-fields', time: 'sunset', weather: 'clear', landmark: 'phnom-sampov' },
  pursat: { biome: 'highland-forest', time: 'afternoon', weather: 'rain', landmark: 'cardamom-falls' },
  'kampong-speu': { biome: 'highland-forest', time: 'sunrise', weather: 'clear', landmark: 'kirirom-pines' },
  'kampong-chhnang': { biome: 'floating-village', time: 'mist', weather: 'clear', landmark: 'tonle-sap-village' },
  'kampong-thom': { biome: 'temple-jungle', time: 'sunset', weather: 'clear', landmark: 'sambor-prei-kuk' },
  'kampong-cham': { biome: 'mekong-river', time: 'midday', weather: 'clear', landmark: 'koh-pen-wat-nokor' }
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// Resolve the full look for one stage: palette, sky and the haze-adjusted layer palettes.
export function resolveEnvironment(env) {
  const base = BIOMES[env.biome] || BIOMES['rice-fields'];
  const time = { ...(TIMES[env.time] || TIMES.midday) };
  const rain = env.weather === 'rain';
  if (rain) {
    for (const key of ['skyTop', 'skyMid', 'skyBottom', 'haze', 'cloud', 'cloudShade']) {
      time[key] = mix(time[key], RAIN.skyMix, RAIN.amount);
    }
  }
  const night = env.time === 'night';
  // Night also darkens the land itself; distant layers fade into the haze colour.
  const toned = Object.fromEntries(Object.entries(base).map(([k, v]) =>
    [k, night ? mix(v, '#1a2440', 0.5) : rain ? mix(v, '#5a6670', 0.2) : v]));
  const layer = amount => Object.fromEntries(Object.entries(toned).map(([k, v]) => [k, mix(v, time.haze, amount)]));
  return {
    ...env, rain, night, time,
    palette: toned,
    far: layer(night ? 0.35 : 0.5),
    mid: layer(night ? 0.18 : 0.26),
    near: layer(night ? 0.05 : 0.06),
    overlay: rain ? RAIN.overlay : time.overlay
  };
}
