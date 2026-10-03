import { PROVINCE_ROUTE } from './provinceRoute.js';
import { createProvinceLevel } from './provinceLevels.js';

export const LEVEL_CONFIGS = {
  1: {
    title: 'Banteay Chhmar Journey - Angor Wat',
    skyColor: '#879c86',
    enemySpeed: 40,
    coins: [
      { x: 150, y: 120 }, { x: 170, y: 120 }, { x: 190, y: 120 },
      { x: 295, y: 100 }, { x: 315, y: 100 }, { x: 335, y: 100 },
      { x: 470, y: 80 },  { x: 490, y: 60 },  { x: 510, y: 80 },
      { x: 600, y: 120 }, { x: 620, y: 100 }, { x: 640, y: 120 },
      { x: 800, y: 110 }, { x: 830, y: 90 },  { x: 860, y: 110 },
      { x: 1000, y: 120 }, { x: 1050, y: 90 }, { x: 1100, y: 120 },
      { x: 1300, y: 100 }, { x: 1350, y: 80 }, { x: 1400, y: 100 },
      { x: 1500, y: 120 }, { x: 1550, y: 80 }, { x: 1600, y: 60 },
      { x: 1700, y: 115 }, { x: 1740, y: 90 }, { x: 1780, y: 115 },
      { x: 1870, y: 115 }, { x: 1910, y: 88 }, { x: 1950, y: 115 },
      { x: 2080, y: 110 }, { x: 2120, y: 80 }, { x: 2160, y: 110 },
      { x: 2260, y: 115 }, { x: 2300, y: 85 }
    ],
    enemies: [
      { x: 320, y: 170 },
      { x: 620, y: 170 },
      { x: 850, y: 170 },
      { x: 1150, y: 170 },
      { x: 1420, y: 170 },
      { x: 1760, y: 170 },
      { x: 2040, y: 170 },
      { x: 2240, y: 170 }
    ]
  },
  2: {
    title: 'Angkor Wat Causeway',
    skyColor: '#d9c58f',
    enemySpeed: 45,
    coins: [
      { x: 220, y: 120 }, { x: 240, y: 100 }, { x: 260, y: 120 },
      { x: 480, y: 120 }, { x: 500, y: 100 }, { x: 520, y: 120 },
      { x: 780, y: 120 }, { x: 800, y: 90 },  { x: 820, y: 120 },
      { x: 1050, y: 100 }, { x: 1100, y: 80 }, { x: 1150, y: 100 },
      { x: 1350, y: 110 }, { x: 1400, y: 80 }, { x: 1450, y: 110 },
      { x: 1550, y: 120 }, { x: 1600, y: 70 }
    ],
    enemies: [
      { x: 117, y: 99 },
      { x: 441, y: 153 },
      { x: 981, y: 99 }
    ]
  },
  3: {
    title: 'Angkor Sunset Ruins',
    skyColor: '#d97745',
    enemySpeed: 50,
    coins: [
      { x: 260, y: 110 }, { x: 280, y: 90 }, { x: 300, y: 110 },
      { x: 530, y: 90 },  { x: 550, y: 70 }, { x: 570, y: 90 },
      { x: 880, y: 80 },  { x: 900, y: 60 }, { x: 920, y: 80 },
      { x: 1230, y: 100 }, { x: 1250, y: 80 }, { x: 1270, y: 100 },
      { x: 1410, y: 120 }, { x: 1440, y: 100 }, { x: 1470, y: 120 },
      { x: 1560, y: 100 }, { x: 1590, y: 85 }, { x: 1620, y: 100 },
      { x: 1750, y: 110 }, { x: 1780, y: 90 }, { x: 1810, y: 110 },
      { x: 1940, y: 120 }, { x: 1970, y: 100 }, { x: 2000, y: 120 },
      { x: 2110, y: 85 }, { x: 2140, y: 65 }, { x: 2170, y: 85 },
      { x: 2390, y: 100 }, { x: 2420, y: 80 }, { x: 2450, y: 100 },
      { x: 2590, y: 120 }, { x: 2620, y: 100 }, { x: 2650, y: 120 },
      { x: 2820, y: 120 }, { x: 2850, y: 100 }, { x: 2880, y: 120 },
      { x: 3050, y: 100 }, { x: 3080, y: 80 }, { x: 3110, y: 100 },
      { x: 3260, y: 120 }, { x: 3290, y: 100 }, { x: 3320, y: 120 },
      { x: 3410, y: 100 }, { x: 3440, y: 80 }, { x: 3470, y: 100 },
      { x: 3540, y: 110 }, { x: 3580, y: 85 }, { x: 3620, y: 65 }
    ],
    // Edit this list to place Level 3 enemies. x/y are pixel coordinates in level3.tmj.
    // variant: 0 = green, 1 = black (throws rocks), 2 = gold. Omit it to use the default.
    enemies: [
      //{ x: 350, y: 110, variant: 0 },
      { x: 580, y: 90, variant: 0},
      { x: 920, y: 80 },
      //{ x: 1260, y: 100 },
      //{ x: 1440, y: 125 },
      //{ x: 1770, y: 125 },
      //{ x: 2150, y: 90 },
      //{ x: 2570, y: 170 },
      //{ x: 2850, y: 125 },
      //{ x: 3090, y: 105 },
      //{ x: 3470, y: 105 }
    ]
  },

  3: {
    title: 'Angkor Sunset Ruins',
    skyColor: '#d97745',
    enemySpeed: 50,
    coins: [
      { x: 260, y: 110 }, { x: 280, y: 90 }, { x: 300, y: 110 },
      { x: 530, y: 90 },  { x: 550, y: 70 }, { x: 570, y: 90 },
      { x: 880, y: 80 },  { x: 900, y: 60 }, { x: 920, y: 80 },
      { x: 1230, y: 100 }, { x: 1250, y: 80 }, { x: 1270, y: 100 },
      { x: 1410, y: 120 }, { x: 1440, y: 100 }, { x: 1470, y: 120 },
      { x: 1560, y: 100 }, { x: 1590, y: 85 }, { x: 1620, y: 100 },
      { x: 1750, y: 110 }, { x: 1780, y: 90 }, { x: 1810, y: 110 },
      { x: 1940, y: 120 }, { x: 1970, y: 100 }, { x: 2000, y: 120 },
      { x: 2110, y: 85 }, { x: 2140, y: 65 }, { x: 2170, y: 85 },
      { x: 2390, y: 100 }, { x: 2420, y: 80 }, { x: 2450, y: 100 },
      { x: 2590, y: 120 }, { x: 2620, y: 100 }, { x: 2650, y: 120 },
      { x: 2820, y: 120 }, { x: 2850, y: 100 }, { x: 2880, y: 120 },
      { x: 3050, y: 100 }, { x: 3080, y: 80 }, { x: 3110, y: 100 },
      { x: 3260, y: 120 }, { x: 3290, y: 100 }, { x: 3320, y: 120 },
      { x: 3410, y: 100 }, { x: 3440, y: 80 }, { x: 3470, y: 100 },
      { x: 3540, y: 110 }, { x: 3580, y: 85 }, { x: 3620, y: 65 }
    ],
    // Edit this list to place Level 3 enemies. x/y are pixel coordinates in level3.tmj.
    // variant: 0 = green, 1 = black (throws rocks), 2 = gold. Omit it to use the default.
    enemies: [
      //{ x: 350, y: 110, variant: 0 },
      { x: 580, y: 90, variant: 0},
      { x: 920, y: 80 },
      //{ x: 1260, y: 100 },
      { x: 1440, y: 125 },
      //{ x: 1770, y: 125 },
      { x: 2150, y: 90 },
      { x: 2570, y: 170 },
      //{ x: 2850, y: 125 },
      { x: 3090, y: 105 },
      { x: 3470, y: 105 }
    ]
  },
};

PROVINCE_ROUTE.forEach((province, index) => {
  LEVEL_CONFIGS[index + 4] = createProvinceLevel(province, index);
});

// Spread the requested rock throwers across each stage; retain gold and green enemies.
for (const [level, blackCount] of [[3, 1], [4, 2], [5, 3]]) {
  const enemies = LEVEL_CONFIGS[level].enemies;
  enemies.forEach((enemy, index) => { enemy.variant = index % 2 === 0 ? 0 : 2; });
  for (let i = 0; i < blackCount; i++) {
    enemies[Math.floor((i + 0.5) * enemies.length / blackCount)].variant = 1;
  }
  let otherIndex = 0;
  enemies.forEach(enemy => {
    if (enemy.variant !== 1) enemy.variant = otherIndex++ % 2 === 0 ? 2 : 0;
  });
}
