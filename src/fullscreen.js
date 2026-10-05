export function installFullscreen(game) {
  const machine = document.querySelector('.machine');
  const button = document.querySelector('#fullscreen-button');
  if (!machine || !button) return;
  let expanded = false;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const sync = () => {
    const active = fullscreenElement() === machine || expanded;
    machine.classList.toggle('is-fullscreen', active);
    document.body.classList.toggle('game-expanded', active);
    button.textContent = '⛶';
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
    button.setAttribute('aria-pressed', String(active));
    requestAnimationFrame(() => game.scale.refresh());
  };
  button.addEventListener('click', async () => {
    button.disabled = true;
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
      button.disabled = false;
      sync();
    }
  });
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
