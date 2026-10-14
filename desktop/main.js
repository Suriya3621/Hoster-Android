/**
 * Hoster desktop app (Electron).
 *
 * Starts the Hoster server inside the app, shows the web UI in a window, and
 * keeps running in the system tray so your phone can still reach your files
 * after you close the window. Quit from the tray icon.
 */
const { app, BrowserWindow, Tray, Menu, shell, dialog, clipboard, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

const PORT = Number(process.env.HOSTER_PORT) || 4173;
const ORIGIN = `http://localhost:${PORT}`;

// Packaged app: server/ and client-dist/ sit next to this file.
// Dev ("npm start" inside desktop/): use the repo's server/ and client/dist.
const packaged = fs.existsSync(path.join(__dirname, 'server', 'server.js'));
const serverDir = packaged ? path.join(__dirname, 'server') : path.join(__dirname, '..', 'server');
const clientDist = packaged ? path.join(__dirname, 'client-dist') : path.join(__dirname, '..', 'client', 'dist');
const iconPath = path.join(__dirname, 'icon.png');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.setAppUserModelId('com.hoster.app');

let win = null;
let tray = null;
let quitting = false;
let hintShown = false;

function lanAddress() {
  try {
    const { getPrimaryLocalIP } = require(path.join(serverDir, 'utils', 'network.js'));
    return `http://${getPrimaryLocalIP()}:${PORT}`;
  } catch {
    return ORIGIN;
  }
}

function startServer() {
  // Settings (shared folders, notes) live in the user's profile, not inside the app.
  process.env.HOSTER_DATA_DIR = process.env.HOSTER_DATA_DIR || path.join(app.getPath('userData'), 'data');
  process.env.HOSTER_CLIENT_DIST = clientDist;
  process.env.HOSTER_PORT = String(PORT);

  return new Promise((resolve, reject) => {
    const { httpServer } = require(path.join(serverDir, 'server.js'));
    httpServer.once('listening', resolve);
    httpServer.once('error', reject);
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 560,
    title: 'Hoster',
    icon: iconPath,
    backgroundColor: '#0b0d12',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  win.loadURL(ORIGIN);

  // Links to the outside world open in the normal browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(ORIGIN)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    win.hide();
    if (!hintShown && Notification.isSupported()) {
      hintShown = true;
      new Notification({
        title: 'Hoster is still running',
        body: 'Your phone can still reach your files. Quit from the tray icon.',
      }).show();
    }
  });
}

function showWindow() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function buildTray() {
  const image = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  tray = new Tray(image);
  tray.setToolTip('Hoster');
  const menu = () =>
    Menu.buildFromTemplate([
      { label: 'Open Hoster', click: showWindow },
      { label: 'Open in browser', click: () => shell.openExternal(ORIGIN) },
      {
        label: `Copy phone address  (${lanAddress()})`,
        click: () => clipboard.writeText(lanAddress()),
      },
      { type: 'separator' },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
      },
      { type: 'separator' },
      { label: 'Quit Hoster', click: () => { quitting = true; app.quit(); } },
    ]);
  tray.setContextMenu(menu());
  tray.on('click', showWindow);
  tray.on('right-click', () => tray.setContextMenu(menu())); // refresh the address if Wi-Fi changed
}

app.on('second-instance', showWindow);
app.on('before-quit', () => { quitting = true; });
// Keep running in the tray when every window is closed.
app.on('window-all-closed', () => {});

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (err) {
    const inUse = err && err.code === 'EADDRINUSE';
    dialog.showErrorBox(
      'Hoster could not start',
      inUse
        ? `Port ${PORT} is already in use. Close the other Hoster (or whatever uses that port) and try again.`
        : `The Hoster server failed to start:\n${err && err.message}`
    );
    app.exit(1);
    return;
  }
  buildTray();
  createWindow();
});
