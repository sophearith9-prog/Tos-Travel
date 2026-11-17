// Fullscreen for the game frame (.machine). The visible control is drawn by the in-game
// HUD next to the pause button (see src/hud.js), using game.fullscreen.toggle().
// The HTML #fullscreen-button stays in the page, visually hidden, so keyboard and
// screen-reader users can still reach it (it appears when focused).
export function installFullscreen(game) {
  const machine = document.querySelector('.machine');
  const button = document.querySelector('#fullscreen-button');
  if (!machine) return;
  let expanded = false;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const isActive = () => fullscreenElement() === machine || expanded;
  const listeners = new Set();
  const sync = () => {
    const active = isActive();
    machine.classList.toggle('is-fullscreen', active);
    document.body.classList.toggle('game-expanded', active);
    if (button) {
      button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
      button.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
      button.setAttribute('aria-pressed', String(active));
    }
    listeners.forEach(listener => listener(active));
    requestAnimationFrame(() => game.scale.refresh());
  };
  let busy = false;
  const toggle = async () => {
    if (busy) return;
    busy = true;
    try {
      if (fullscreenElement() === machine) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit.call(document);
      } else if (expanded) {
        expanded = false;
      } else {
        const request = machine.requestFullscreen || machine.webkitRequestFullscreen;
        // Browsers without element fullscreen can still fill the browser viewport.
        if (request) {
          try { await request.call(machine); }
          catch { expanded = true; }
        } else expanded = true;
      }
    } finally {
      busy = false;
      sync();
    }
  };
  game.fullscreen = {
    toggle,
    isActive,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  if (button) {
    button.classList.add('is-hud-replaced');
    button.addEventListener('click', toggle);
  }
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) {
      expanded = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      sync();
    }
  }, true);
}
