/**
 * Assembles desktop/stage/ — the folder electron-builder packs into the app:
 *   main.js, icon.png, server/ (Express + Socket.IO), client-dist/ (built web UI)
 * plus a package.json that lists the server's dependencies so they get bundled.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const stage = path.join(__dirname, '..', 'stage');
const dist = path.join(root, 'client', 'dist');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('\nThe web UI is not built yet. Run:  npm run build --prefix client   (or "npm run build" in the project root)\n');
  process.exit(1);
}

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

fs.copyFileSync(path.join(__dirname, '..', 'main.js'), path.join(stage, 'main.js'));
fs.copyFileSync(path.join(__dirname, '..', 'icon.png'), path.join(stage, 'icon.png'));

const skip = new Set(['node_modules', 'data', 'sample-data', 'package-lock.json']);
fs.cpSync(path.join(root, 'server'), path.join(stage, 'server'), {
  recursive: true,
  filter: (src) => !skip.has(path.basename(src)),
});
fs.cpSync(dist, path.join(stage, 'client-dist'), { recursive: true });

const desktopPkg = require('../package.json');
const serverPkg = require('../../server/package.json');
fs.writeFileSync(
  path.join(stage, 'package.json'),
  JSON.stringify(
    {
      name: 'hoster',
      productName: 'Hoster',
      version: desktopPkg.version,
      description: desktopPkg.description,
      author: desktopPkg.author,
      main: 'main.js',
      dependencies: serverPkg.dependencies,
    },
    null,
    2
  )
);
console.log('Staged app in', stage);
