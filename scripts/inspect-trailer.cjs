(async () => {
  const port = process.argv[2] || '9335';
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  const page = pages.find(item => item.url.includes('trailer-studio'));
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (response.id !== 1) return;
    console.log(response.result.result.value);
    process.exit(0);
  });
  socket.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `JSON.stringify({
        status: document.querySelector('#status')?.textContent,
        frameState: document.querySelector('#game')?.contentDocument?.readyState,
        frameUrl: document.querySelector('#game')?.contentWindow?.location.href,
        scripts: [...(document.querySelector('#game')?.contentDocument?.scripts || [])].map(s => s.src),
        resources: document.querySelector('#game')?.contentWindow?.performance.getEntriesByType('resource').map(r => r.name).filter(n => n.includes('/src/')).slice(-12),
        parentPath: document.querySelector('#game')?.contentWindow?.parent?.location?.pathname,
        frameOrigin: document.querySelector('#game')?.contentWindow?.location?.origin,
        parentOrigin: document.querySelector('#game')?.contentWindow?.parent?.location?.origin,
        gameLikeKeys: Object.keys(document.querySelector('#game')?.contentWindow || {}).filter(key => /game|trailer/i.test(key)).slice(0,20),
        game: !!document.querySelector('#game')?.contentWindow?.__trailerGame,
        phaser: !!document.querySelector('#game')?.contentWindow?.Phaser,
        gameCount: document.querySelector('#game')?.contentWindow?.Phaser?.GAMES?.length,
        phaserKeys: Object.keys(document.querySelector('#game')?.contentWindow?.Phaser || {}).filter(key => /game/i.test(key)).slice(0,12),
        active: document.querySelector('#game')?.contentWindow?.__trailerGame?.scene.getScenes(true).map(s => s.scene.key),
        hasCanvas: !!document.querySelector('#game')?.contentDocument?.querySelector('#game-container canvas')
        ,canvasProps: Object.keys(document.querySelector('#game')?.contentDocument?.querySelector('#game-container canvas') || {}).slice(0,30)
        ,canvasGame: !!document.querySelector('#game')?.contentDocument?.querySelector('#game-container canvas')?.game
      })`,
      returnByValue: true
    }
  }));
})();
