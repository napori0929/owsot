const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const express = require('express');

// ----------------------------
// ✅ Electron 캐시·데이터 경로 지정 (권한 문제 방지)
// ----------------------------
app.setPath('userData', path.join(app.getPath('appData'), 'OWSOT'));

// ----------------------------
// ✅ Express 서버 설정
// ----------------------------
const expressApp = express();
expressApp.use(express.static("public"));
expressApp.listen(3000, () => console.log("Express server started on port 3000"));

// ----------------------------
// ✅ 설정 저장/불러오기
// ----------------------------
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function saveSettings(data) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

function loadSettings() {
  if (fs.existsSync(settingsPath))
    return JSON.parse(fs.readFileSync(settingsPath));
  return {};
}

// ----------------------------
// ✅ 로컬 서버 실행 함수
// ----------------------------
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

  return new Promise(resolve => setTimeout(resolve, 1000)); // 서버 준비 대기
}

// ----------------------------
// ✅ Electron 윈도우 생성
// ----------------------------
async function createWindowAfterServer() {
  await startServer();

  const win = new BrowserWindow({
    width: 550,
    height: 630,
    resizable: true,
    title: 'OWSOT - Overwatch Scoreboard Overlay Tool (옵솟)',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'dashboard', 'dashboard.html'));
}

// ----------------------------
// ✅ IPC 이벤트 처리
// ----------------------------
ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (event, data) => saveSettings(data));

// ----------------------------
// ✅ 앱 실행 흐름
// ----------------------------
app.whenReady().then(createWindowAfterServer);
