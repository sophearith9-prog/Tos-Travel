// Registry of hand-made layouts for stages 10-28.
// provinceLevels.js asks this registry first and falls back to the generic generator
// when a stage has no layout. Levels 1-9 are never looked up here.
//
// To add a stage: create src/levels/levelNNLayout.js, import it below, and add it to
// HAND_MADE_LAYOUTS.

import { PROVINCE_ROUTE } from './provinceRoute.js';
import { validateLayout } from './layoutFormat.js';

// import level10 from './level10Layout.js';
const HAND_MADE_LAYOUTS = [
  // level10,
];

const layouts = new Map();

// Province expected at a stage: stages 4-28 follow PROVINCE_ROUTE in order.
export function provinceIdForLevel(level) {
  return PROVINCE_ROUTE[level - 4]?.id || null;
}

export function registerLayout(layout) {
  validateLayout(layout, provinceIdForLevel(layout.level));
  layouts.set(layout.level, layout);
  return layout;
}

export function getLayout(level) {
  return layouts.get(level) || null;
}

export function registeredLevels() {
  return [...layouts.keys()].sort((a, b) => a - b);
}

HAND_MADE_LAYOUTS.forEach(registerLayout);
