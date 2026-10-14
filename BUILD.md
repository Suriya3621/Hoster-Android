# Building Hoster as an app

Hoster always runs **on your PC** (it needs your drives). Two apps are included:

| App | What it is | Where |
|---|---|---|
| **Windows app (.exe)** | The Hoster server + window + tray icon in one program | `desktop/` |
| **Android app (.apk)** | A full-screen Hoster client that connects to your PC | `mobile/` |

---

## Windows app

**Just run it:** unzip `Hoster-Windows-x64.zip` and double-click `Hoster.exe`.

**Build the installer yourself** (needs Node.js 18+ on Windows):

```bat
npm run install:all
npm run dist:win
```

You get, in `release/`:
- `Hoster-Setup-2.0.0.exe` — installer (Start menu + desktop shortcut)
- `Hoster-Portable-2.0.0.exe` — single file, no install

Try it without packaging: `npm run desktop`.

How it behaves
- Closing the window keeps Hoster running in the **system tray** (so your phone still works). Quit from the tray icon.
- Tray menu: *Open Hoster*, *Copy phone address*, *Start with Windows*, *Quit*.
- Your shared folders and notes are saved in `%APPDATA%\Hoster\data\` (not inside the app), so updates never erase them.
- First launch: Windows Firewall asks to allow Hoster on your network — click **Allow** (private networks), or your phone can't connect.
- Port 4173 is used. To change it, set the `HOSTER_PORT` environment variable.

Run without Electron (server + browser): `npm start`, then open http://localhost:4173.

---

## Android app (APK)

The phone app can't contain your files — it connects to Hoster on your PC. On first launch you type the address
shown on the PC's Home screen (e.g. `192.168.1.20:4173`); it is remembered and reconnects automatically.
*Settings → "Connect to a different PC"* switches server.

### Option A — build in the cloud (no Android Studio)
1. Put this project on GitHub.
2. **Actions** tab → **Build Android APK** → **Run workflow**.
3. Download **Hoster-debug-apk** from the finished run, unzip, copy `app-debug.apk` to your phone and install it
   (allow "install unknown apps" when asked).

### Option B — Android Studio
1. Install Android Studio. In `mobile/`: `npm install`
2. `npx cap sync android` then `npx cap open android`
3. Build ▸ Build APK(s). Output: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

Command line (Android SDK + JDK 17 installed): `cd mobile/android && gradlew assembleDebug`

### Notes
- The APK is a *debug* build (signed with a debug key) — fine for your own phone. For the Play Store you would create a release keystore.
- The app allows plain `http://` because Hoster lives on your local network.
- Downloads from Hoster are saved to the phone's **Downloads** folder.

---

## Phone without installing anything
Open the PC's address in the phone browser and choose **Add to Home screen** — it works like an app too.
