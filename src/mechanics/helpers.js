// Small helpers shared by mechanics.

// True when the player is standing on top of `body` (an Arcade body).
export function isStandingOn(player, body) {
  const pb = player?.body;
  if (!pb?.enable || !body?.enable) return false;
  return pb.velocity.y >= -1 && Math.abs(pb.bottom - body.top) <= 4
    && pb.right > body.left + 1 && pb.left < body.right - 1;
}

// Move the player (and its physics body) without touching its velocity.
export function shiftPlayer(player, dx, dy = 0) {
  if (!player?.body || (!dx && !dy)) return;
  player.x += dx; player.y += dy;
  player.body.position.x += dx; player.body.position.y += dy;
  player.body.prev.x += dx; player.body.prev.y += dy;
}

export function bodyInRect(body, rect) {
  return !!body?.enable && body.right > rect.x && body.left < rect.x + rect.width
    && body.bottom > rect.y && body.top < rect.y + rect.height;
}

// Create colliders that are safe to destroy during or after scene shutdown.
export function safeColliders(scene, pairs) {
  const colliders = pairs.map(([a, b, cb]) => scene.physics.add.collider(a, b, cb));
  return () => { if (scene.physics?.world) colliders.forEach(c => c.destroy()); };
}
