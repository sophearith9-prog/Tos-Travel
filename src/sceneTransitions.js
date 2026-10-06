const DEFAULT_DURATION = 420;

export function fadeSceneIn(scene, duration = DEFAULT_DURATION) {
  scene.transitioning = false;
  scene.cameras.main.fadeIn(duration, 5, 10, 18);
}

export function fadeToScene(scene, destination, data, { duration = DEFAULT_DURATION, stop = [] } = {}) {
  if (scene.transitioning) return;
  scene.transitioning = true;
  const camera = scene.cameras.main;
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    stop.forEach(key => scene.scene.stop(key));
    scene.scene.start(destination, data);
  });
  camera.fadeOut(duration, 5, 10, 18);
}
