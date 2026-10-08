export const touchControls = { left: false, right: false, jump: false, shoot: false, attack: false };

export function installMobileControls(game) {
  const controls = document.querySelector('.touch-controls');
  if (!controls) return;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    || navigator.userAgentData?.mobile === true;
  document.body.classList.toggle('is-mobile-device', isMobileDevice);
  const held = new Map();
  const buttons = [...controls.querySelectorAll('button')];
  const alignControls = () => {
    if (!game.canvas) return;
    const canvas = game.canvas.getBoundingClientRect();
    const container = controls.parentElement.getBoundingClientRect();
    // Keep touch targets in screen pixels so small phones do not shrink them.
    const size = Math.max(50, Math.min(60, canvas.width / 7.5));
    const height = size + 8;
    controls.style.setProperty('--controls-left', `${canvas.left - container.left}px`);
    controls.style.setProperty('--controls-top', `${canvas.top - container.top + canvas.height - height}px`);
    controls.style.setProperty('--controls-width', `${canvas.width}px`);
    controls.style.setProperty('--controls-height', `${height}px`);
    controls.style.setProperty('--controls-size', `${size}px`);
  };
  game.scale.on('resize', alignControls);
  const resizeObserver = new ResizeObserver(alignControls);
  resizeObserver.observe(controls.parentElement);
  alignControls();
  const playable = () => {
    const scene = game.scene.getScene('GameScene');
    return !!scene && scene.scene.isActive() && !scene.isLevelFinished;
  };
  const refresh = () => {
    for (const action of Object.keys(touchControls)) {
      touchControls[action] = [...held.values()].includes(action);
      controls.querySelector(`[data-action="${action}"]`)
        .classList.toggle('is-held', touchControls[action]);
    }
  };
  const reset = () => { held.clear(); refresh(); };
  for (const button of buttons) {
    const action = button.dataset.action;
    button.addEventListener('pointerdown', event => {
      if (!playable() || event.button !== 0) return;
      if (action === 'shoot' && game.scene.getScene('GameScene').currentLevel < 4) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      held.set(event.pointerId, action);
      refresh();
    });
    const release = event => { held.delete(event.pointerId); refresh(); };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, release);
    }
    button.addEventListener('contextmenu', event => event.preventDefault());
  }
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('orientationchange', reset);
  document.addEventListener('visibilitychange', reset);
  let wasPlayable;
  let watchedScene;
  game.events.on('poststep', () => {
    const scene = game.scene.getScene('GameScene');
    controls.querySelector('[data-action="shoot"]').hidden = !scene || scene.currentLevel < 4;
    if (scene && scene !== watchedScene) {
      watchedScene = scene;
      for (const event of ['pause', 'shutdown']) scene.events.on(event, reset);
    }
    const enabled = isMobileDevice && playable();
    if (enabled === wasPlayable) return;
    wasPlayable = enabled;
    controls.classList.toggle('is-playable', enabled);
    if (enabled) alignControls();
    reset();
    for (const button of buttons) button.disabled = !enabled;
  });
}
