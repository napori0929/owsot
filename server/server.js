import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hudPath = path.resolve(__dirname, "../hud");
const uploadDir = path.join(hudPath, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.static(hudPath));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// 업로드
app.post("/upload-logo", upload.single("logo"), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.originalname}` });
});

// 기본 데이터
let hudData = {
  hudType: "normal",
  descriptions: "",
  team1: {
    name: "Team A",
    score: 0,
    total: "0W 0L |",
    logo: "",
    bans: ["hero1"],
    side: "none",
  },
  team2: {
    name: "Team B",
    score: 0,
    total: "| 0W 0L",
    logo: "",
    bans: ["hero2"],
    side: "none",
  },
  mapNumber: 1,
  firstTo: 3,
  setResults: ["Team N/A"],
};

app.get("/hero-list", (req, res) => {
  const heroDir = path.join(__dirname, "../hud/images/heroes");
  try {
    const files = fs
      .readdirSync(heroDir)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
    res.json(files);
  } catch {
    res.json([]);
  }
});

app.get("/data", (req, res) => res.json(hudData));

app.post("/update", (req, res) => {
  console.log("UPDATE:", req.body.team1?.total, req.body.team2?.total); // 디버그
  hudData = req.body;
  res.sendStatus(200);
});

app.listen(3000, () => console.log("HUD Server on :3000"));
