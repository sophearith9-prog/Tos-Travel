const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output');
const profile = path.join(root, `.tmp-trailer-chrome-${Date.now()}`);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const trailer = path.join(output, 'Tos-Travel-Game-Trailer.webm');

async function waitForDebugPort() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const version = await fetch('http://127.0.0.1:9333/json/version').then(r => r.json());
      return version.webSocketDebuggerUrl;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error('Chrome DevTools did not start');
}

async function allowDownload(browserSocket) {
  const socket = new WebSocket(browserSocket);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome download setup timed out')), 5000);
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout);
      if (message.error) reject(new Error(message.error.message));
      else resolve();
    });
    socket.send(JSON.stringify({
      id: 1,
      method: 'Browser.setDownloadBehavior',
      params: { behavior: 'allow', downloadPath: output, eventsEnabled: true }
    }));
  });
  socket.close();
}

(async () => {
  if (fs.existsSync(trailer)) fs.unlinkSync(trailer);
  const browser = spawn(chromePath, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-cache',
    '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=9333', `--user-data-dir=${profile}`,
    '--window-size=1280,720', 'http://127.0.0.1:3000/scripts/trailer-studio.html'
  ], { windowsHide: true, stdio: 'ignore' });

  try {
    const ws = await waitForDebugPort();
    await allowDownload(ws);
    console.log('Trailer render started.');
    for (let attempt = 0; attempt < 110; attempt++) {
      if (browser.exitCode !== null) throw new Error(`Chrome exited with code ${browser.exitCode}`);
      if (fs.existsSync(trailer)) {
        const stats = fs.statSync(trailer);
        if (stats.size > 500000) {
          console.log(`Saved ${trailer} (${(stats.size / 1048576).toFixed(1)} MB)`);
          return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Trailer did not finish within 110 seconds');
  } finally {
    browser.kill();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
