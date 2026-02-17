/* =========================
   OVERVIEW (overlay-data -> image)
   ========================= */
const OVERVIEW_IMG_BASE = "/assets/overview";
const OVERLAY_DATA_URL = "/overlay-data";

let lastFile = null;

async function tick() {
  let file = "";
  try {
    const res = await fetch(`${OVERLAY_DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    file = (data?.overviewImage || "").trim();
  } catch (e) {
    // 네트워크/서버 문제면 그냥 빈값 처리
    file = "";
  }

  if (file === lastFile) return;
  lastFile = file;

  const img = document.getElementById("overviewImg");
  const hint = document.getElementById("overviewHint");
  if (!img) return;

  if (!file) {
    img.style.display = "none";
    img.removeAttribute("src");
    if (hint) hint.style.display = "block";
    return;
  }

  if (hint) hint.style.display = "none";
  img.style.display = "block";
  img.src = `${OVERVIEW_IMG_BASE}/${encodeURIComponent(file)}?t=${Date.now()}`;
}

setInterval(tick, 500);
tick();
