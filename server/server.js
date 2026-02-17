const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");


const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const baseAssets = path.join(__dirname, "../assets");


// -------------------- 경로 설정 --------------------
const hudPath = path.resolve(__dirname, "../hud");
const banpickPath = path.resolve(__dirname, "../banpick");
const dashboardPath = path.resolve(__dirname, "../dashboard");
const uploadDir = path.join(hudPath, "uploads");
const overlayPath = path.resolve(__dirname, "../mappoolpick");
const waitingPath = path.resolve(__dirname, "../waiting");
const team1RosterPath = path.resolve(__dirname, "../team1Roster");
const team2RosterPath = path.resolve(__dirname, "../team2Roster");
const assetsPath = path.resolve(__dirname, "../assets");
const broadcast1Path = path.resolve(__dirname, "../broadcast");
const broadcast2Path = path.resolve(__dirname, "../team1_interview");
const broadcast3Path = path.resolve(__dirname, "../team2_interview");
const mapSetsPath = path.resolve(__dirname, "../mapSets");
const EXCEL_PATH = path.join(assetsPath, "excel", "team-table.xlsx");
const overviewPath = path.join(__dirname, "../overview");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -------------------- 정적 파일 제공 --------------------
app.use("/assets", express.static(assetsPath));
app.use(express.static(hudPath));
app.use("/uploads", express.static(uploadDir));
app.use("/banpick", express.static(banpickPath));
app.use("/dashboard", express.static(dashboardPath));
app.use("/mappoolpick", express.static(overlayPath));
app.use("/waiting", express.static(waitingPath));
app.use("/team1Roster", express.static(team1RosterPath));
app.use("/team2Roster", express.static(team2RosterPath));
app.use("/broadcast", express.static(broadcast1Path));
app.use("/team1_interview", express.static(broadcast2Path));
app.use("/team2_interview", express.static(broadcast3Path));
app.use("/mapSets", express.static(mapSetsPath));
app.use("/overview", express.static(overviewPath));

// -------------------- 업로드 --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });



// -------------------- 기본 HUD 데이터 --------------------
// -------------------- 기본 HUD 데이터 --------------------

// -------------------- HUDData.json 완전 초기화 --------------------
const defaultHUD = {
  hudType: "normal",
  descriptions: "",
  mapName: "",
  initialBan: "",
  team1: {
    name: "",
    fullName: "",
    score: 0,
    total: "",
    ban: "",
    color: "#06f5f5",
    logo: "",
    side: "none",
    rosterPlayers: []   // ✅ 추가
    // players: {...}    // ❌ 제거
  },
  team2: {
    name: "",
    fullName: "",
    score: 0,
    total: "",
    ban: "",
    color: "#e42d50",
    logo: "",
    side: "none",
    rosterPlayers: []   // ✅ 추가
    // players: {...}    // ❌ 제거
  },
  mapNumber: 1,
  firstTo: 3,
  mapPickResults: [],
  mapPickOrder: [],
  setResults: [""],
  details: { escort: [], hybrid: [], control: [], push: [], flashpoint: [] },
  gameLogo: "",
  overviewImage: "",   // ✅ 추가

};

// ✅ hudData를 먼저 선언
let hudData = defaultHUD;

// ✅ HUDData.json 덮어쓰기
try {
  fs.writeFileSync("HUDData.json", JSON.stringify(defaultHUD, null, 2));
  console.log("🧹 HUDData.json 초기화 완료");
} catch (e) {
  console.error("❌ HUD 초기화 실패:", e);
}


let countdownData = { isActive: false, time: 0 };




// -------------------- API들 --------------------
app.get("/font-list", (req, res) => {
  try {
    const fontDirs = [
      path.join(hudPath, "../assets/fonts"),
      path.join(banpickPath, "../assets/fonts"),
      path.join(dashboardPath, "../assets/fonts"),
    ];
    let fonts = [];
    for (const dir of fontDirs) {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter(f => /\.(ttf|otf|woff2?)$/i.test(f))
          .map(f => ({ name: f.replace(/\.[^.]+$/, ""), folder: path.basename(path.dirname(dir)) }));
        fonts = fonts.concat(files);
      }
    }
    res.json(fonts);
  } catch (err) {
    console.error("⚠️ font-list error:", err);
    res.json([]);
  }
});

app.post("/countdown-update", (req, res) => {
  try {
    countdownData = { ...countdownData, ...req.body };
    console.log("⏱️ Countdown updated:", countdownData);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -------------------- countdown 데이터 조회 --------------------
app.get("/countdown-data", (req, res) => {
  res.json(countdownData);
});

// -------------------- overview image update (partial) --------------------
app.post("/update-overview", (req, res) => {
  try {
    const { overviewImage } = req.body || {};

    // 문자열만 허용 (원하면 파일명 화이트리스트 검증도 가능)
    hudData.overviewImage = typeof overviewImage === "string" ? overviewImage : "";

    fs.writeFileSync("HUDData.json", JSON.stringify(hudData, null, 2));
    console.log("✅ Overview image updated:", hudData.overviewImage);

    res.json({ ok: true, overviewImage: hudData.overviewImage });
  } catch (err) {
    console.error("❌ Failed to update overviewImage:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});



app.get("/video-list", (req, res) => {
  const videoDir = path.resolve(__dirname, "../assets/videos");
  try {
    const files = fs.readdirSync(videoDir).filter(f => /\.(mp4|webm|mov|m4v)$/i.test(f));
    res.json(files);
  } catch (err) {
    console.warn("⚠️ video-list load failed:", err.message);
    res.json([]);
  }
});

// -------------------- overlay-data --------------------
// -------------------- overlay-data --------------------
app.get("/overlay-data", (req, res) => {
  try {
    const filePath = path.resolve("HUDData.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      res.json(parsed);
    } else {
      res.json(hudData); // 파일이 없을 때만 기본값
    }
  } catch (err) {
    console.error("❌ overlay-data load error:", err);
    res.status(500).json({});
  }
});


// -------------------- update --------------------

app.get("/hero-list", (req, res) => {
  const heroDir = path.join(hudPath, "../assets/heroes");
  try {
    const files = fs.readdirSync(heroDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    res.json(files);
  } catch {
    res.json([]);
  }
});

app.get("/map-list", (req, res) => {
  const mapsPath = path.join(dashboardPath, "../assets/maps");
  try {
    const files = fs.readdirSync(mapsPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    res.json(files);
  } catch (err) {
    console.warn("⚠️ maps 폴더 읽기 실패:", err.message);
    res.json([]);
  }
});

// -------------------- 업로드 --------------------
// 업로드 라우트 교체
// ✅ 최종 /upload-logo (즉시 반영 + 파일 저장)
app.post("/upload-logo", upload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = `/uploads/${req.file.originalname}`;

  // ✅ 업로드한 필드가 'gameLogoFile'일 때만 게임 로고로 반영
  const fieldName = req.file.fieldname;
  if (fieldName === "gameLogoFile") {
    hudData.gameLogo = filePath;
    fs.writeFileSync("HUDData.json", JSON.stringify(hudData, null, 2));
    console.log("✅ Game logo uploaded and saved:", filePath);
  } else {
    console.log("✅ Team logo uploaded (no gameLogo overwrite):", filePath);
  }

  res.json({ filePath });
});


// -------------------- mapSets 업데이트 --------------------
app.post("/update-mapsets", (req, res) => {
  try {
    const { mapSets } = req.body;
    if (!Array.isArray(mapSets)) {
      return res.status(400).json({ ok: false, error: "mapSets must be an array" });
    }

    hudData.mapSets = mapSets;
    fs.writeFileSync("HUDData.json", JSON.stringify(hudData, null, 2));

    console.log("✅ MapSets updated:", mapSets.length, "sets");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to update mapSets:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/guide-list", (req, res) => {
  const guideDir = path.join(__dirname, "../assets/guides");
  fs.readdir(guideDir, (err, files) => {
    if (err) return res.status(500).json([]);

    const media = files.filter(f => /\.(png|jpg|jpeg|gif|webp|mp4|webm|mov|m4v)$/i.test(f));
    res.json(media);
  });
});


// ==================== ROSTERS (single workbook + multi sheets) ====================
// rosters.xlsx 경로: /assets/rosters/rosters.xlsx (원하는 위치면 여기만 바꾸면 됨)



// -------------------- update --------------------
app.post("/update", (req, res) => {
  try {
    const newData = req.body;
        // ✅ overviewImage: payload에 없으면 기존 유지
    if (newData.overviewImage === undefined) {
      newData.overviewImage = hudData.overviewImage || "";
    }

    // ✅ gameLogo: 새 업로드 시 갱신, 입력 비어 있으면 완전히 리셋
    if (typeof newData.gameLogo !== "string" || newData.gameLogo.trim() === "") {
      newData.gameLogo = "";
    }

    if (!newData.mapName) newData.mapName = hudData.mapName;
    if (!Array.isArray(newData.setResults)) newData.setResults = [];

    // ✅ 팀 병합 유지
    ["team1", "team2"].forEach(teamKey => {
      const oldTeam = hudData[teamKey] || {};
      const newTeam = newData[teamKey] || {};

      // ✅ 로고: undefined면 유지, 빈 문자열/경로는 교체
      if (newTeam.logo === undefined) {
        newTeam.logo = oldTeam.logo;
      }

      // ✅ ban은 undefined/null일 때만 유지 (빈문자면 교체)
      if (newTeam.ban === undefined || newTeam.ban === null) {
        newTeam.ban = oldTeam.ban;
      }

      if (!newTeam.color) newTeam.color = oldTeam.color;
      if (!newTeam.side) newTeam.side = oldTeam.side;
      if (!newTeam.fullName) newTeam.fullName = oldTeam.fullName;
      if (newTeam.name === undefined) newTeam.name = oldTeam.name;
      if (newTeam.score === undefined || newTeam.score === null)
        newTeam.score = oldTeam.score;
      if (newTeam.total === undefined) newTeam.total = oldTeam.total;

      // ✅ rosterPlayers (6~8명)
      if (newTeam.rosterPlayers === undefined) {
        // payload에 없으면 기존 유지
        newTeam.rosterPlayers = oldTeam.rosterPlayers || [];
      } else if (!Array.isArray(newTeam.rosterPlayers)) {
        newTeam.rosterPlayers = [];
      } else {
        // 길이 제한
        if (newTeam.rosterPlayers.length > 8) newTeam.rosterPlayers = newTeam.rosterPlayers.slice(0, 8);
      }
      // 🔥 여기서 호출
      if (newTeam.rosterPlayers === undefined || newTeam.rosterPlayers.length === 0) {
        const autoRoster = getRosterFromExcelByTeamName(newTeam.name);

        console.log(
          `[AUTO ROSTER] ${teamKey} / team=${newTeam.name} / loaded=${autoRoster.length}`
        );

        newTeam.rosterPlayers = autoRoster;
      }



      newData[teamKey] = newTeam;
    });

    if (!Array.isArray(newData.mapSets)) {
      newData.mapSets = hudData.mapSets || [];
    }

    // ✅ 최종 덮어쓰기
    hudData = newData;
    fs.writeFileSync("HUDData.json", JSON.stringify(hudData, null, 2));

    console.log("✅ HUD Data Updated:");
    console.log(`  - MapName: ${hudData.mapName}`);
    console.log(`  - SetResults: ${hudData.setResults}`);
    console.log(`  - Team1 logo: ${hudData.team1?.logo}`);
    console.log(`  - Team2 logo: ${hudData.team2?.logo}`);
    console.log(`  - GameLogo: ${hudData.gameLogo}`);
    console.log("team1:", hudData.team1?.name, "roster:", hudData.team1?.rosterPlayers?.length);
    console.log("team2:", hudData.team2?.name, "roster:", hudData.team2?.rosterPlayers?.length);
    console.log("EXCEL_PATH =", EXCEL_PATH, "exists?", fs.existsSync(EXCEL_PATH));
    console.log("incoming team1/team2:", req.body?.team1?.name, req.body?.team2?.name);


    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Update Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }

  

});

function loadWorkbook() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel not found: ${EXCEL_PATH}`);
  }
  return XLSX.readFile(EXCEL_PATH);
}

function pickKeyCaseInsensitive(obj, candidates) {
  if (!obj) return null;
  const keys = Object.keys(obj);
  const lowerMap = new Map(keys.map(k => [String(k).toLowerCase().trim(), k]));
  for (const c of candidates) {
    const hit = lowerMap.get(String(c).toLowerCase().trim());
    if (hit) return hit;
  }
  return null;
}

function normalizeRosterRows(rows, teamNameForLog = "") {
  const arr = Array.isArray(rows) ? rows : [];
  if (arr.length === 0) return [];

  // ✅ 헤더 자동 감지 (엑셀 컬럼명이 뭐든 최대한 맞춰줌)
  const sample = arr.find(r => r && typeof r === "object") || {};
  const nameKey = pickKeyCaseInsensitive(sample, ["Name", "Player", "PlayerName", "IGN", "InGameName", "선수", "선수명", "닉네임"]);
  const roleKey = pickKeyCaseInsensitive(sample, ["Role", "Position", "포지션"]);
  const mostsKey = pickKeyCaseInsensitive(sample, ["Mosts", "Most", "Mains", "Heroes", "주영웅"]);
  const tierKey = pickKeyCaseInsensitive(sample, ["Tier", "Rank", "티어"]);
  const descKey = pickKeyCaseInsensitive(sample, ["Desc", "Description", "설명"]);
  const cheerKey = pickKeyCaseInsensitive(sample, ["Cheer", "Cheering", "응원"]);
  const capKey = pickKeyCaseInsensitive(sample, ["Cap", "Captain", "주장"]);

  if (!nameKey) {
    console.warn(`⚠️ [${teamNameForLog}] No name column found. First row keys:`, Object.keys(sample));
    return [];
  }

  const cleaned = arr
    .map(r => ({
      Role: roleKey ? (r[roleKey] ?? "") : "",
      Name: String(r[nameKey] ?? "").trim(),
      Mosts: mostsKey
        ? (String(r[mostsKey] ?? "").trim()
            ? String(r[mostsKey]).split(/[,/|]/).map(s => s.trim()).filter(Boolean)
            : [])
        : [],
      Tier: tierKey ? (r[tierKey] ?? "") : "",
      Desc: descKey ? (r[descKey] ?? "") : "",
      Cheer: cheerKey ? (r[cheerKey] ?? "") : "",
      Cap: capKey ? (r[capKey] ?? "") : ""
    }))
    .filter(p => p.Name !== "");

  return cleaned.slice(0, 8);
}


function getRosterFromExcelByTeamName(teamName) {
  const name = String(teamName || "").trim();
  if (!name) return [];

  const wb = loadWorkbook();
  const ws = wb.Sheets[name];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return normalizeRosterRows(rows, name);
}



app.get("/excel-tabs", (req, res) => {
  try {
    const wb = loadWorkbook();
    res.json(wb.SheetNames);
  } catch (e) {
    console.error("❌ /excel-tabs:", e.message);
    res.status(500).json([]);
  }
});

app.get("/excel-sheet", (req, res) => {
  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: "missing name" });

    const wb = loadWorkbook();
    const ws = wb.Sheets[name];
    if (!ws) return res.status(404).json({ error: "sheet not found" });

    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    res.json(rows);
  } catch (e) {
    console.error("❌ /excel-sheet:", e.message);
    res.status(500).json([]);
  }
});


app.get("/excel-team-catalog", (req, res) => {
  try {
    // ✅ 여기만 교체
    const excelPath = path.join(assetsPath, "excel", "team-lists.xlsx");
    // 또는 const excelPath = path.join(baseAssets, "excel", "team-lists.xlsx");

    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({ error: "team-lists.xlsx not found", path: excelPath });
    }

    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const teams = rows
      .map(r => ({
        id: String(r.id || "").trim(),
        name: String(r.name || "").trim(),
        fullName: String(r.fullName || "").trim(),
        color: String(r.color || "").trim(),
        logoPath: String(r.logoPath || "").trim(),
      }))
      .filter(t => t.id && t.name);

    res.json({ teams });
  } catch (e) {
    console.error("excel-team-catalog error:", e);
    res.status(500).json({ error: "failed to load team catalog" });
  }
});


const OVERVIEW_DIR = path.join(__dirname, "assets", "overview");
const OVERVIEW_URL_BASE = "/assets/overview";

// (이미 하고 있겠지만) 정적 서빙 확인
// app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/overview-list", (req, res) => {
  const overviewDir = path.join(hudPath, "../assets/overview");
  try {
    const files = fs.readdirSync(overviewDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    res.json(files);
  } catch {
    res.json([]);
  }
});


app.get("/debug-roster", (req, res) => {
  const team = String(req.query.team || "").trim();
  try {
    const wb = loadWorkbook();
    const sheets = wb.SheetNames || [];
    const exists = sheets.includes(team);
    res.json({ team, exists, sheets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});







// -------------------- 디버그 --------------------
app.get("/debug-data", (req, res) => res.json(hudData));

// -------------------- 서버 실행 --------------------
const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on :${PORT}`);
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Port ${PORT} already in use, retrying...`);
    setTimeout(() => {
      const newServer = app.listen(0, () => {
        const { port } = newServer.address();
        console.log(`✅ Server reloaded on :${port}`);
      });
    }, 1000);
  } else {
    console.error("❌ Server error:", err);
  }
});
