export function installFullscreen(game) {
  const machine = document.querySelector('.machine');
  const button = document.querySelector('#fullscreen-button');
  if (!machine || !button) return;
  let expanded = false;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const positionButton = () => {
    if (!game.canvas || !button.parentElement) return;
    const canvas = game.canvas.getBoundingClientRect();
    const frame = button.parentElement.getBoundingClientRect();
    // Stack just below the pause HUD at (770, 28) in the game's 800x450 layout.
    button.style.left = `${canvas.left - frame.left + canvas.width * (770 / 800)}px`;
    button.style.top = `${canvas.top - frame.top + canvas.height * (78 / 450)}px`;
  };
  const sync = () => {
    const active = fullscreenElement() === machine || expanded;
    machine.classList.toggle('is-fullscreen', active);
    document.body.classList.toggle('game-expanded', active);
    button.textContent = '⛶';
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
    button.setAttribute('aria-pressed', String(active));
    requestAnimationFrame(() => { game.scale.refresh(); positionButton(); });
  };
  game.scale.on('resize', positionButton);
  window.addEventListener('resize', positionButton);
  window.addEventListener('orientationchange', positionButton);
  new ResizeObserver(positionButton).observe(button.parentElement);
  requestAnimationFrame(positionButton);
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
