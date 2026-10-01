export const touchControls = { left: false, right: false, jump: false };

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
    const scale = canvas.width / 800;
    controls.style.setProperty('--controls-left', `${canvas.left - container.left}px`);
    controls.style.setProperty('--controls-top', `${canvas.top - container.top + canvas.height - 90 * scale}px`);
    controls.style.setProperty('--controls-scale', String(scale));
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
    if (action === 'pause') {
      button.addEventListener('click', () => {
        if (playable()) game.scene.getScene('GameScene').pauseGame();
        reset();
      });
      continue;
    }
    button.addEventListener('pointerdown', event => {
      if (!playable() || event.button !== 0) return;
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
