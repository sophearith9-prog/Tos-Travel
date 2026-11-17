// Small SVG maps of Cambodia for the finish screens (same outline and route coordinates
// as the Level Select map in src/scenes/LevelSelectScene.js).
import { PROVINCE_ROUTE } from './levels/provinceRoute.js';
import { LEVEL_CONFIGS } from './levels/levelConfigs.js';

const OUTLINE = [[0,.37],[.04,.29],[.14,.25],[.10,.19],[.17,.09],[.32,.06],[.38,.07],[.41,.05],[.49,.06],[.58,.16],[.70,.08],[.78,0],[.82,.08],[.9,.04],[.97,0],[.98,.24],[1,.29],[.98,.39],[.99,.48],[.97,.59],[.87,.62],[.81,.63],[.73,.70],[.75,.83],[.70,.85],[.63,.78],[.59,.83],[.5,.81],[.5,.94],[.41,.99],[.32,1],[.27,.98],[.24,.93],[.19,.93],[.17,.82],[.13,.9],[.08,.85],[.08,.69],[.04,.63],[.05,.51],[0,.49],[.03,.42]];
const MEKONG = [[.69,.21],[.67,.44],[.59,.57],[.46,.75],[.50,.91]];
const W = 100, H = 85;   // the Level Select map's 293 x 250 proportions
const pt = ([x, y]) => `${(x * W).toFixed(1)},${(y * H).toFixed(1)}`;
const xy = ([x, y]) => ({ x: +(x * W).toFixed(1), y: +(y * H).toFixed(1) });
const escapeHtml = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Stages 1-3 are the opening Banteay Chhmar and Angkor stages; 4-28 follow the province route.
export function provinceForLevel(level) {
  if (level >= 4) return PROVINCE_ROUTE[level - 4] || null;
  return PROVINCE_ROUTE.find(p => p.id === (level === 1 ? 'banteay-meanchey' : 'siem-reap'));
}

// The landmark name shown under the province on the Stage Clear card.
export function landmarkForLevel(level) {
  const config = LEVEL_CONFIGS[level];
  const province = provinceForLevel(level);
  const title = config?.title || '';
  if (title && title !== province?.name) {
    // "Mondulkiri - Bou Sra Falls" -> "Bou Sra Falls"
    const parts = title.split(/\s+[-–—:·]\s+/);
    return parts.length > 1 && parts[0] === province?.name ? parts.slice(1).join(' · ') : title;
  }
  return province?.places?.split('·')[0].trim() || title;
}

function baseMap() {
  return `<polygon class="map-land" points="${OUTLINE.map(pt).join(' ')}"/>
    <ellipse class="map-lake" cx="${0.34 * W}" cy="${0.41 * H}" rx="3.3" ry="5"/>
    <polyline class="map-river" points="${MEKONG.map(pt).join(' ')}"/>`;
}

// "Next stop": every province visited so far, a dotted line from this stop to the next.
export function nextStopMapSvg(level, nextLevel) {
  const here = provinceForLevel(level), next = nextLevel ? provinceForLevel(nextLevel) : null;
  const routeUpTo = Math.max(0, level - 4);
  const visited = PROVINCE_ROUTE.map((p, i) => {
    const { x, y } = xy(p.map);
    const seen = level >= 4 ? i <= routeUpTo : (p.id === here?.id);
    return `<circle class="map-dot${seen ? ' is-seen' : ''}" cx="${x}" cy="${y}" r="${seen ? 1.6 : 1.2}"/>`;
  }).join('');
  const a = xy(here.map), b = next ? xy(next.map) : null;
  const sameStop = b && a.x === b.x && a.y === b.y;
  const line = b && !sameStop ? `<line class="map-next-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>` : '';
  const nextPin = b ? `<g class="map-pin is-next" transform="translate(${b.x} ${b.y})"><circle class="map-pulse" r="3"/><circle r="2.6"/></g>` : '';
  return `<svg class="finish-map-svg" viewBox="-6 -6 ${W + 12} ${H + 12}" role="img"
      aria-label="Route map: ${escapeHtml(here.name)}${next ? ` to ${escapeHtml(next.name)}` : ''}">
    ${baseMap()}<polyline class="map-route" points="${PROVINCE_ROUTE.map(p => pt(p.map)).join(' ')}"/>
    ${visited}${line}
    <g class="map-pin is-here" transform="translate(${a.x} ${a.y})"><circle r="${sameStop ? 3.4 : 2.6}"/></g>${sameStop ? '' : nextPin}
  </svg>`;
}

// Victory: the whole route, each province lighting up in order (CSS animation delays).
export function journeyMapSvg(stepMs = 110, startMs = 400) {
  const dots = PROVINCE_ROUTE.map((p, i) => {
    const { x, y } = xy(p.map);
    return `<g class="map-light" style="--d:${startMs + i * stepMs}ms" transform="translate(${x} ${y})"><circle class="map-glow" r="4.2"/><circle r="2"/></g>`;
  }).join('');
  const route = PROVINCE_ROUTE.map(p => pt(p.map)).join(' ');
  return `<svg class="finish-map-svg is-journey" viewBox="-6 -6 ${W + 12} ${H + 12}" role="img"
      aria-label="Map of Cambodia with all ${PROVINCE_ROUTE.length} provinces visited">
    ${baseMap()}
    <polyline class="map-route" points="${route}"/>
    <polyline class="map-route-draw" pathLength="100" points="${route}"
      style="--d:${startMs}ms; --len:${PROVINCE_ROUTE.length * stepMs}ms"/>
    ${dots}
  </svg>`;
}
