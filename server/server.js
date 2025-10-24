import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ ESM 환경에서 __dirname 생성
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ 절대 경로 지정
const hudPath = path.resolve(__dirname, '../hud');
const uploadDir = path.join(hudPath, 'uploads');

// ✅ 폴더가 없으면 생성
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ 정적 파일 서빙 (HUD + uploads 모두)
app.use(express.static(hudPath));
app.use('/uploads', express.static(uploadDir));

// ✅ 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ✅ 업로드 엔드포인트
app.post('/upload-logo', upload.single('logo'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.originalname}` });
});

// ✅ HUD 데이터
let hudData = {
  team1: { name: 'Team A', score: 0, logo: '', bans: ['hero1'], descriptions: '0W 0L |' },
  team2: { name: 'Team B', score: 0, logo: '', bans: ['hero2'], descriptions: '| 0W 0L' },
  mapNumber: 1,
  firstTo: 3,
  setResults: ['Team N/A']
};

// ✅ hero 이미지 목록 제공
app.get('/hero-list', (req, res) => {
  const heroDir = path.join(__dirname, '../hud/images/heroes');
  try {
    const files = fs.readdirSync(heroDir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)); // 이미지 확장자만
    res.json(files);
  } catch (err) {
    console.error('Hero list error:', err);
    res.json([]);
  }
});

app.get('/data', (req, res) => res.json(hudData));
app.post('/update', (req, res) => {
  hudData = req.body;
  res.sendStatus(200);
});

// ✅ 서버 실행
app.listen(3000, () => console.log('HUD Server on :3000'));

console.log("Serving static from:", hudPath);
console.log("Uploads absolute path:", uploadDir);