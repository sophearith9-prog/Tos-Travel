// Level 9: The Volcanic Crater Lake & Highland Jungle.
export const LEVEL9 = {
  title: 'The Volcanic Crater Lake & Highland Jungle',
  width: 2160,
  height: 1260,
  spawn: { x: 100, y: 1068 },
  finish: { x: 2080, doorX: 2100, floorY: 700 },
  sections: {
    vineAscent: { startX: 0, endX: 670 },
    craterLogs: { startX: 670, endX: 1375 },
    hiddenCave: { startX: 1375, endX: 1550 },
    guardianArena: { startX: 1550, endX: 2160 }
  },
  ledges: [
    // Red-earth cliff steps for the opening vine ascent.
    { x: 0, y: 1090, width: 220 },
    { x: 205, y: 1000, width: 115 },
    { x: 350, y: 905, width: 110 },
    { x: 220, y: 810, width: 115 },
    { x: 400, y: 715, width: 125 },
    { x: 550, y: 630, width: 130 },
    // Narrow landing before the lake log route.
    { x: 1375, y: 700, width: 100 },
    // A gap above the cave shelf lets curious players descend behind the waterfall.
    { x: 1400, y: 840, width: 210, cave: true },
    // Crater guardian platform and exit gate.
    { x: 1550, y: 700, width: 610 }
  ],
  swingingVines: [
    { x: 300, y: 850, length: 96, arc: 0.78, speed: 0.0017, phase: 0 },
    { x: 470, y: 665, length: 92, arc: 0.82, speed: 0.0019, phase: 1.4 },
    { x: 625, y: 560, length: 88, arc: 0.72, speed: 0.0016, phase: 2.1 }
  ],
  floatingLogs: [
    { x: 720, y: 650, width: 108, phase: 0 },
    { x: 875, y: 595, width: 104, phase: 0.9 },
    { x: 1035, y: 645, width: 108, phase: 1.8 },
    { x: 1195, y: 590, width: 104, phase: 2.5 },
    { x: 1350, y: 650, width: 108, phase: 3.4 }
  ],
  water: { x: 660, y: 805, width: 720, height: 190 },
  waterfall: { x: 1500, y: 730, width: 64, height: 112 },
  treasures: [
    { x: 1440, y: 805 }, { x: 1500, y: 805 }, { x: 1570, y: 805 }
  ],
  enemies: [
    { x: 465, y: 685 }, { x: 1120, y: 560 },
    { x: 1850, y: 676, kind: 'stone-guardian', variant: 2, level9Boss: true }
  ],
  coins: [
    { x: 145, y: 1060 }, { x: 260, y: 970 }, { x: 400, y: 875 },
    { x: 265, y: 780 }, { x: 455, y: 685 }, { x: 620, y: 600 },
    { x: 720, y: 610 }, { x: 875, y: 555 }, { x: 1035, y: 605 },
    { x: 1195, y: 550 }, { x: 1350, y: 610 }, { x: 1700, y: 670 },
    { x: 1990, y: 670 }
  ]
};
