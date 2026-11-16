import { bodyInRect, shiftPlayer } from './helpers.js';

// Area that pushes the player sideways and/or lifts them (updraft).
//   { type: 'windZone', x, y, width, height,
//     force = { x: 90, y: 0 },   // x: px/s push; y: px/s² vertical accel (negative = up)
//     gust = null | { on: 1800, off: 1200 },  // optional on/off cycle in ms
//     streaks = true }           // visible wind lines while blowing
export default {
  type: 'windZone',
  create(scene, cfg) {
    const { x, y, width, height, force = { x: 90, y: 0 }, gust = null, streaks = true } = cfg;
    const rect = { x, y, width, height };
    const fx = force.x || 0, fy = force.y || 0;
    const lines = streaks ? Array.from({ length: 12 }, (_, i) => ({
      shape: scene.add.rectangle(0, 0, 7, 1, 0xf2f6f0, 0.55).setDepth(6),
      px: (i * 53) % width, py: (i * 37) % height
    })) : [];

    return {
      get active() { return !gust || (scene.time.now % (gust.on + gust.off)) < gust.on; },
      update(time, delta) {
        const blowing = this.active;
        const dt = delta / 1000;
        const player = scene.player;
        if (blowing && !scene.isLevelFinished && bodyInRect(player.body, rect)) {
          if (fx) shiftPlayer(player, fx * dt);
          if (fy) player.body.setVelocityY(Math.max(-260, player.body.velocity.y + fy * dt));
        }
        const dir = Math.sign(fx) || 0, vdir = Math.sign(fy) || 0;
        for (const line of lines) {
          line.px = Phaser.Math.Wrap(line.px + dir * 160 * dt, 0, width);
          line.py = Phaser.Math.Wrap(line.py + vdir * 120 * dt, 0, height);
          line.shape.setPosition(x + line.px, y + line.py).setVisible(blowing)
            .setSize(vdir && !dir ? 1 : 7, vdir && !dir ? 7 : 1);
        }
      },
      destroy() { lines.forEach(line => line.shape.destroy()); }
    };
  }
};
