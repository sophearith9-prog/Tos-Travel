export const MAX_ARROW_AMMO = 24;

export function addArrowAmmo(scene, amount) {
  const previous = Math.max(0, Number(scene.arrows) || 0);
  scene.arrows = Math.min(MAX_ARROW_AMMO, previous + amount);
  return scene.arrows - previous;
}
