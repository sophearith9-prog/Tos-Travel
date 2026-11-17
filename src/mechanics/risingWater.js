// Water that rises over time; touching it costs one unit of health and returns the
// player to safe ground (same rule as falling into a pit).
//   { type: 'risingWater', startY, topY, speed = 12 (px/s), delayMs = 0,
//     triggerX = null (start rising once the player passes this x),
//     x = 0, width = map width, color = 0x2d7f9a, alpha = 0.72,
//     retreatOnHit = 60 (px below the respawn spot the water drops back to after a catch),
//     graceMs = 1500 (pause before it starts rising again) }
// startY/topY are the water surface's y; smaller y = higher water.
// Static pool (a water-filled pit): set speed: 0 and limit x/width to the pit.
export default {
  type: 'risingWater',
  create(scene, cfg) {
    const { startY, topY = 0, speed = 12, delayMs = 0, triggerX = null, x = 0,
      width = scene.map.widthInPixels, color = 0x2d7f9a, alpha = 0.72, retreatOnHit = 60, graceMs = 1500 } = cfg;
    const bottom = scene.physics.world.bounds.bottom + 40;
    const body = scene.add.rectangle(x, startY, width, bottom - startY, color, alpha).setOrigin(0, 0).setDepth(4);
    const surface = scene.add.rectangle(x, startY, width, 2, 0xd8f4f0, 0.8).setOrigin(0, 0).setDepth(4.1);
    let level = startY, startedAt = null, pausedUntil = 0;
    const createdAt = scene.time.now;

    // Never accept a respawn spot (within this water's span) that the water is about to swallow.
    const filter = spot => spot.x < x || spot.x > x + width || spot.y < level - 16;
    scene.safeGroundFilters.push(filter);

    const place = () => {
      body.setY(level).setSize(width, Math.max(1, bottom - level));
      surface.setY(level);
    };

    return {
      get level() { return level; },
      update(time, delta) {
        const now = scene.time.now;
        if (startedAt === null && now - createdAt >= delayMs && (triggerX === null || scene.player.x >= triggerX)) startedAt = now;
        if (startedAt !== null && !scene.isLevelFinished && now >= pausedUntil) level = Math.max(topY, level - (speed * delta) / 1000);
        surface.setAlpha(0.6 + Math.sin(now * 0.004) * 0.2);
        place();
        const player = scene.player;
        const overWater = player?.body && player.body.right > x && player.body.left < x + width;
        if (overWater && player.body.enable && !scene.isLevelFinished && player.body.bottom > level + 6) {
          const spot = scene.lastSafeGround || scene.spawnPoint;
          // Drop the water well below the respawn spot and pause it, so a catch is not repeated at once.
          level = Math.min(startY, Math.max(level, spot.y + retreatOnHit));
          pausedUntil = now + graceMs;
          place();
          scene.handlePitFall();
        }
      },
      destroy() {
        const i = scene.safeGroundFilters?.indexOf(filter);
        if (i >= 0) scene.safeGroundFilters.splice(i, 1);
        body.destroy(); surface.destroy();
      }
    };
  }
};
