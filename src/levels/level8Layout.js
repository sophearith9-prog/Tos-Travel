// Level 8: The Inner Sanctum & Floating Ruins.
export const LEVEL8 = {
  title: 'The Ancient Floating Sanctuary & Market Ruins',
  width: 2160,
  height: 1260,
  spawn: { x: 100, y: 1068 },
  finish: { x: 2080, doorX: 2100, floorY: 700 },
  sections: {
    verticalAscent: { startX: 0, endX: 570 },
    snackShop: { x: 465, floorY: 550 },
    gauntlet: { startX: 570, endX: 1515 },
    sanctuary: { startX: 1515, endX: 2160 }
  },
  ledges: [
    // Section 1 · vertical ascent. Keep rises within one normal jump.
    { x: 0, y: 1090, width: 300 },
    { x: 250, y: 1000, width: 120 },
    { x: 100, y: 910, width: 120 },
    { x: 250, y: 820, width: 120 },
    { x: 100, y: 730, width: 120 },
    { x: 270, y: 640, width: 130 },
    { x: 420, y: 550, width: 150 },
    // Hidden alcove behind the false naga wall.
    { x: 390, y: 790, width: 160 },
    // Section 2 · timed dart and swinging-spike gauntlet.
    { x: 570, y: 500, width: 140 },
    { x: 750, y: 570, width: 110, collapsing: true },
    { x: 920, y: 505, width: 120 },
    { x: 1080, y: 585, width: 120, collapsing: true },
    { x: 1245, y: 520, width: 130 },
    { x: 1390, y: 620, width: 160 },
    // Section 3 · guardian arena and sanctum gate.
    { x: 1515, y: 700, width: 645 }
  ],
  movingPlatforms: [
    { x: 185, y: 855, width: 100, minY: 815, maxY: 930, speed: 46 },
    { x: 835, y: 505, width: 105, minY: 455, maxY: 560, speed: 54 }
  ],
  // The ascent uses stepped ledges and moving platforms; keep the shop clear
  // of the hanging vine artwork that previously crossed through its roof.
  vines: [],
  switches: [
    { x: 545, y: 550, label: 'ASCENT' },
    { x: 980, y: 505, label: 'GAUNTLET' },
    { x: 1615, y: 700, label: 'SANCTUM' }
  ],
  dartStatues: [
    { x: 690, y: 470, direction: -1, interval: 1900, phase: 350 },
    { x: 1175, y: 555, direction: 1, interval: 2200, phase: 850 }
  ],
  swingingSpikes: [
    // Lift the swing arcs above the walking line so players can pass below.
    { x: 865, y: 375, interval: 1900, activeFor: 680, phase: 0 },
    { x: 1305, y: 390, interval: 2100, activeFor: 720, phase: 600 }
  ],
  treasures: [
    { x: 155, y: 1060 }, { x: 315, y: 970 }, { x: 160, y: 880 },
    { x: 315, y: 790 }, { x: 500, y: 760 }, { x: 485, y: 520 },
    { x: 640, y: 470 }, { x: 980, y: 475 }, { x: 1460, y: 590 },
    { x: 2050, y: 670 }
  ],
  enemies: [
    { x: 310, y: 970 }, { x: 635, y: 470 }, { x: 1020, y: 475 },
    { x: 1450, y: 590 },
    { x: 1820, y: 676, kind: 'stone-guardian', variant: 2, level8Boss: true }
  ],
  coins: [
    { x: 125, y: 1060 }, { x: 285, y: 970 }, { x: 145, y: 880 },
    { x: 285, y: 790 }, { x: 335, y: 610 }, { x: 470, y: 520 },
    { x: 625, y: 470 }, { x: 805, y: 540 }, { x: 975, y: 475 },
    { x: 1135, y: 555 }, { x: 1300, y: 490 }, { x: 1460, y: 590 },
    { x: 1690, y: 670 }, { x: 1990, y: 670 }
  ]
};
