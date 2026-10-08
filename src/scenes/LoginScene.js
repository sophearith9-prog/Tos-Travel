import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';

const ACCOUNT_KEY = 'tos-travel-local-accounts';
const SESSION_KEY = 'tos-travel-local-session';
const HASH_ROUNDS = 120000;

function readAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); }
  catch { return {}; }
}

async function passwordHash(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure browser cryptography is unavailable. Open the game on localhost or HTTPS.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: HASH_ROUNDS }, key, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function saltBytes(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map(pair => Number.parseInt(pair, 16)));
}

export class LoginScene extends Phaser.Scene {
  constructor() { super('LoginScene'); }

  preload() {
    if (!this.textures.exists('menu-background')) this.load.image('menu-background', 'assets/title-temple-sunset.png');
    if (!this.textures.exists('game-logo')) this.load.image('game-logo', 'assets/game-logo.png');
  }

  create() {
    fadeSceneIn(this);
    this.cameras.main.setBackgroundColor('#382620');
    this.add.image(400, 225, 'menu-background').setDisplaySize(800, 450).setAlpha(0.60);
    this.add.rectangle(400, 225, 800, 450, 0x211713, 0.42);
    const panel = this.add.graphics();
    panel.fillStyle(0x211b18, 0.97).fillRoundedRect(219, 45, 362, 360, 20);
    panel.lineStyle(2, 0xd49a4c, 0.95).strokeRoundedRect(219, 45, 362, 360, 20);
    panel.lineStyle(1, 0x755638, 0.8).strokeRoundedRect(228, 54, 344, 342, 15);
    this.add.image(400, 103, 'game-logo').setDisplaySize(176, 75);
    this.add.text(400, 157, 'YOUR JOURNEY STARTS HERE', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: '#ffd078', letterSpacing: 2
    }).setOrigin(0.5);
    this.status = this.add.text(400, 383, 'Accounts stay on this device and browser.', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px', color: '#d8c5a7',
      align: 'center', wordWrap: { width: 300 }
    }).setOrigin(0.5);

    this.mode = 'login';
    this.form = document.createElement('form');
    this.form.setAttribute('aria-label', 'Game account login');
    Object.assign(this.form.style, {
      width: '292px', display: 'flex', flexDirection: 'column', gap: '7px',
      fontFamily: 'Trebuchet MS, Arial, sans-serif', color: '#f5e5c6'
    });
    this.form.addEventListener('submit', event => {
      event.preventDefault();
      this.submitForm();
    });
    // Anchor from the top: Phaser measures this DOM element before its form fields
    // finish laying out, so centering by its measured height pushed the buttons down.
    this.formElement = this.add.dom(400, 171, this.form).setOrigin(0.5, 0);
    this.renderForm();
    this.formElement.updateSize();
    this.events.once('shutdown', () => this.formElement?.destroy());
    this.events.once('destroy', () => this.formElement?.destroy());
  }

  renderForm() {
    const creating = this.mode === 'create';
    this.form.innerHTML = `
      <label style="font-size:11px;font-weight:bold;letter-spacing:1px">PLAYER NAME
        <input name="username" required minlength="3" maxlength="18" autocomplete="username" pattern="[A-Za-z0-9._-]+" placeholder="3–18 letters or numbers" style="display:block;width:100%;height:34px;margin-top:4px;padding:0 10px;border:1px solid #80643d;border-radius:8px;background:#2e2923;color:#fff1d3;font:13px Trebuchet MS,Arial,sans-serif;outline-color:#ffcf70">
      </label>
      <label style="font-size:11px;font-weight:bold;letter-spacing:1px">PASSWORD
        <input name="password" type="password" required minlength="6" maxlength="72" autocomplete="${creating ? 'new-password' : 'current-password'}" placeholder="At least 6 characters" style="display:block;width:100%;height:34px;margin-top:4px;padding:0 10px;border:1px solid #80643d;border-radius:8px;background:#2e2923;color:#fff1d3;font:13px Trebuchet MS,Arial,sans-serif;outline-color:#ffcf70">
      </label>
      <button type="submit" style="height:38px;margin-top:2px;border:0;border-radius:9px;background:#ffcf70;color:#33251a;font:bold 12px Trebuchet MS,Arial,sans-serif;letter-spacing:1px;cursor:pointer">${creating ? 'CREATE LOCAL ACCOUNT' : 'LOG IN  ›'}</button>
      <!-- <button type="button" name="switch" style="height:24px;border:0;background:transparent;color:#f0c16f;font:bold 10px Trebuchet MS,Arial,sans-serif;cursor:pointer">${creating ? 'I ALREADY HAVE AN ACCOUNT' : 'CREATE A NEW ACCOUNT'}</button> -->
    `;
    this.form.querySelector('[name="switch"]').addEventListener('click', () => {
      this.mode = creating ? 'login' : 'create';
      this.status.setText(creating ? 'Sign in to continue your adventure.' : 'Choose a name and password for this device.');
      this.renderForm();
      this.formElement.updateSize();
    });
  }

  async submitForm() {
    const usernameInput = this.form.querySelector('[name="username"]');
    const passwordInput = this.form.querySelector('[name="password"]');
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!/^[a-z0-9._-]{3,18}$/.test(username)) {
      this.status.setColor('#ff9d79').setText('Use 3–18 letters, numbers, dots, dashes, or underscores.');
      return;
    }
    if (password.length < 6 || password.length > 72) {
      this.status.setColor('#ff9d79').setText('Your password must be 6–72 characters.');
      return;
    }
    const button = this.form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'PLEASE WAIT…';
    this.status.setColor('#d8c5a7').setText('Securing your local account…');
    try {
      const accounts = readAccounts();
      if (this.mode === 'create') {
        if (accounts[username]) throw new Error('That player name is already in use on this device.');
        const salt = randomSalt();
        accounts[username] = { salt, hash: await passwordHash(password, saltBytes(salt)) };
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
      } else {
        const account = accounts[username];
        if (!account || await passwordHash(password, saltBytes(account.salt)) !== account.hash) {
          throw new Error('Player name or password is incorrect.');
        }
      }
      sessionStorage.setItem(SESSION_KEY, username);
      this.status.setColor('#b8e5b5').setText(`Welcome, ${username}! Opening the game…`);
      this.formElement.setVisible(false);
      this.time.delayedCall(450, () => fadeToScene(this, 'MainMenuScene', { profile: username }));
    } catch (error) {
      this.status.setColor('#ff9d79').setText(error?.name === 'QuotaExceededError'
        ? 'This browser has no space left to save your account.'
        : error?.message || 'Could not save this local account.');
      button.disabled = false;
      button.textContent = this.mode === 'create' ? 'CREATE LOCAL ACCOUNT' : 'LOG IN  ›';
    }
  }
}
