import { playSound } from '../ui.js';
import { platformTexture } from './platformArt.js';
import { bodyInRect } from './helpers.js';

// A hidden room. A rock cover hides it until the player steps inside; then the cover
// fades away, a dim cave interior shows, and a one-time bonus is awarded.
//   { type: 'secretArea', x, y, width, height, label = 'SECRET FOUND!', bonus = 500,
//     style = the layout's terrainStyle (so the cover blends into the surrounding rock) }
// Put bonus coins inside it with the layout's normal `coins` list.
export default {
  type: 'secretArea',
  create(scene, cfg) {
    const { x, y, width, height, label = 'SECRET FOUND!', bonus = 500 } = cfg;
    const rect = { x, y, width, height };
    // Cave interior (behind the player and coins) ...
    const interior = scene.add.rectangle(x, y, width, height, 0x241a16, 1).setOrigin(0, 0).setDepth(-0.8);
    const drips = [];
    for (let dx = 8; dx < width - 6; dx += 17) {
      drips.push(scene.add.triangle(x + dx, y, 0, 0, 8, 0, 4, 6 + (dx % 3) * 3, 0x3a2c24).setOrigin(0, 0).setDepth(-0.75));
    }
    // ... and the rock cover in front of everything until it is discovered.
    const art = platformTexture(scene, cfg.style || scene.layout?.terrainStyle || 'stone');
    const cover = scene.add.tileSprite(x, y, width, height, art.key, art.fill)
      .setOrigin(0, 0).setDepth(7);
    let found = false;

    return {
      get found() { return found; },
      update() {
        if (found || !bodyInRect(scene.player?.body, rect)) return;
        found = true;
        scene.tweens.add({ targets: cover, alpha: 0, duration: 450, onComplete: () => cover.setVisible(false) });
        scene.score += bonus;
        scene.updateHUD();
        playSound(scene, 'coin', { volume: 0.6, rate: 1.2 });
        scene.showFloatingText(x + width / 2, y - 6, `${label}  +${bonus}`, '#ffe69b');
      },
      destroy() { interior.destroy(); drips.forEach(d => d.destroy()); cover.destroy(); }
    };
  }
};
