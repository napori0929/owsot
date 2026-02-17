const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');


/* ===== 전역 예외 로그 ===== */
process.on("uncaughtException", err => console.error("❌ Uncaught Exception:", err));
process.on("unhandledRejection", err => console.error("❌ Unhandled Rejection:", err));

/* ===== GPU 가속 비활성화 ===== */
app.disableHardwareAcceleration();

/* ===== 외부 링크 열기 ===== */
ipcMain.handle("open-external", (_event, url) => {
  shell.openExternal(url);
});

/* ===== 사용자 설정 저장 ===== */
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
function saveSettings(data) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}
function loadSettings() {
  if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath));
  return {};
}

/* ===== 외부 링크를 Electron 창에서 차단하고 브라우저로 열기 ===== */
function wireExternalOpen(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|tel:)/i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  contents.on('will-navigate', (event, url) => {
    const isLocal =
      url.startsWith('file://') ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1');
    if (!isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

/* ===== 서버 실행 / 중복 방지 / 종료 ===== */
let serverProcess = null;

const { pathToFileURL } = require("url");

function startServerAttached() {
  return new Promise(resolve => {
    const net = require("net");
    const tester = net.createServer()
      .once("error", err => {
        if (err.code === "EADDRINUSE") {
          console.log("♻️ 기존 서버 감지됨, 재시작하지 않음");
          return resolve(false);
        }
      })
      .once("listening", () => {
        tester.close(() => {
          try {
            const serverPath = path.join(__dirname, "server", "server.js");
            console.log("🧩 Electron 내부에서 직접 server.js 실행 (CommonJS)");
            require(serverPath);
            console.log("✅ server.js 로드 완료");
            resolve(true);
          } catch (err) {
            console.error("❌ server.js require 중 오류:");
            console.error(err.stack || err);
            resolve(false);
          }
        });
      })
      .listen(3000);
  });
}





/** 3000 포트 응답(200/404)이 올 때까지 대기 */
function waitForServerReady(port = 3000, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const req = http.get({ hostname: 'localhost', port, path: '/' }, res => {
        res.resume();
        if (res.statusCode === 200 || res.statusCode === 404) return resolve();
        if (Date.now() - start < timeout) return setTimeout(check, 400);
        reject(new Error('Server not responding'));
      });
      req.on('error', () => {
        if (Date.now() - start < timeout) return setTimeout(check, 400);
        reject(new Error('Server failed to start'));
      });
    })();
  });
}

/* ===== Electron 윈도우 생성 ===== */
let dashboardWin;
let overlayWin;

async function createWindows() {
  try {
    await startServerAttached();
    await new Promise(r => setTimeout(r, 1500)); // 서버 안정화 대기
    await waitForServerReady(3000, 8000);
    console.log("✅ 서버 연결 완료");
  } catch (err) {
    console.error("⚠️ 서버 연결 실패:", err);
  }

  const dashboardPath = path.join(__dirname, "dashboard", "dashboard.html");
  console.log("🪟 Dashboard load path:", dashboardPath);

  dashboardWin = new BrowserWindow({
    width: 540,
    height: 845,
    title: "OWSOT Dashboard",
    center: true, // 항상 중앙
    show: false,  // ready-to-show 시 표시
    icon: path.join(__dirname, "assets", "app-icon.ico"), // <- 추가 (윈도우는 .ico 권장)
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  dashboardWin.loadFile(dashboardPath).catch(err => console.error("❌ Dashboard load 실패:", err));

  // 창 표시 강제
  dashboardWin.once("ready-to-show", () => {
    dashboardWin.show();
    dashboardWin.focus();
    console.log("✅ ready-to-show → 대시보드 강제 표시");
  });

  dashboardWin.on("closed", () => {
    console.log("🛑 Dashboard 창 닫힘 → 앱 종료");
    if (serverProcess && !serverProcess.killed) {
      try {
        serverProcess.kill("SIGTERM");
      } catch (e) {
        console.error("❌ 서버 종료 실패:", e);
      }
    }
    serverProcess = null;
    app.quit();
  });

  // 오버레이 창 (숨김 상태)
  overlayWin = new BrowserWindow({
    width: 1280,
    height: 720,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false,
    title: "OWSOT Overlay",
    webPreferences: {
      contextIsolation: true
    }
  });

  overlayWin.loadURL("http://localhost:3000/index.html")
    .then(() => console.log("🎬 Overlay 로드 완료"))
    .catch(err => console.error("❌ Overlay 로드 실패:", err));

  wireExternalOpen(overlayWin.webContents);
}

/* ===== 앱 종료 시 서버도 함께 종료 ===== */
app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    try { serverProcess.kill("SIGTERM"); } catch {}
    serverProcess = null;
  }
});

/* IPC 핸들러 */
ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (_event, data) => saveSettings(data));

/* 앱 초기화 */
app.whenReady().then(createWindows);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
