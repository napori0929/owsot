const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function saveSettings(data) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}
function loadSettings() {
  if (fs.existsSync(settingsPath))
    return JSON.parse(fs.readFileSync(settingsPath));
  return {};
}

function startServer() {
  const devServerPath = path.join(__dirname, 'server', 'server.js');
  const prodServerPath = path.join(process.resourcesPath, 'server', 'server.js');
  const serverPath = fs.existsSync(devServerPath) ? devServerPath : prodServerPath;

  console.log('[Electron] Launching server:', serverPath);

  const serverProcess = spawn('node', [serverPath], {
    shell: true,
    detached: true,
    stdio: 'ignore',
  });

  app.on('will-quit', () => {
    try { process.kill(-serverProcess.pid); } catch {}
  });

  return new Promise(resolve => {
    // ✅ 1초 후 “서버 준비됨”으로 판단 (필요시 조정 가능)
    setTimeout(() => resolve(), 1000);
  });
}

async function createWindowAfterServer() {
  // 1️⃣ 서버 먼저 실행
  await startServer();

  // 2️⃣ 대시보드 창 실행
  const win = new BrowserWindow({
    width: 540,
    height: 805,
    resizable: true,
    title: 'OWSOT - Overwatch Scoreboard Overlay Tool (옵솟)',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'dashboard', 'dashboard.html'));
}

ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (event, data) => saveSettings(data));

// 앱 실행 시 순서 제어 함수로 교체
app.whenReady().then(createWindowAfterServer);
