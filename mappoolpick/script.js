let current1 = "";
let current2 = "";

/* ===== 1. 서버 데이터 요청 ===== */
async function getData() {
  try {
    const res = await fetch("http://localhost:3000/overlay-data", { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return {};
  }
}

/* ===== 2. 전체 오버레이 갱신 ===== */
async function updateOverlay() {
  const data = await getData();
  if (!data || Object.keys(data).length === 0) {
    console.warn("⚠️ overlay-data empty or unreachable");
    return;
  }

  /* 🎥 영상 */
  const team1Video = document.getElementById("team1Video");
  const team2Video = document.getElementById("team2Video");

  if (team1Video && data.team1?.video) {
    if (current1 !== data.team1.video) {
      current1 = data.team1.video;
      team1Video.src = current1;
      team1Video.load();
      team1Video.play().catch(() => {});
    }
  }
  if (team2Video && data.team2?.video) {
    if (current2 !== data.team2.video) {
      current2 = data.team2.video;
      team2Video.src = current2;
      team2Video.load();
      team2Video.play().catch(() => {});
    }
  }

  /* 🏆 상단 정보 */
  setText("team1Name", data.team1?.name || "Team A");
  setText("team2Name", data.team2?.name || "Team B");
  setText("team1Score", data.team1?.score ?? 0);
  setText("team2Score", data.team2?.score ?? 0);
  setText("descriptions", data.descriptions || "OVERWATCH TOURNAMENT");
  setSrc("team1Logo", data.team1?.logo || "");
  setSrc("team2Logo", data.team2?.logo || "");

  /* 🧩 세트 결과 */
  PutSets(data);

  /* 🗺️ Details 표시 */
  if (data.details) renderDetails(data.details);

  /* 🎯 맵 강조 (색상, 로고 포함) */
  highlightPickedMapElements(data);
  addPickLogos(data);
  showMapPickedText(data);
}

/* ===== 3. 보조 함수 ===== */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setSrc(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

/* ===== 4. 세트 결과 ===== */
function PutSets(data) {
  const element = document.getElementById("setResultsBox");
  if (!element || !data) return;

  const { team1, team2, setResults = [], firstTo = 3 } = data;
  element.innerHTML = "";

  let totalBoxes =
    firstTo === 1 ? 1 :
    firstTo === 2 ? 3 :
    firstTo === 3 ? 5 :
    firstTo === 4 ? 7 : firstTo * 2 - 1;

  const valid = (setResults || []).filter(v => v && v.trim() !== "");

  // ✅ 무승부 개수만큼 박스 추가
  const drawCount = valid.filter(v => v.trim() === "무승부").length;
  totalBoxes += drawCount;

  // ✅ 혹시 setResults가 더 길면(무승부 포함) 전부 보이도록 보정
  totalBoxes = Math.max(totalBoxes, valid.length);

  for (let i = 0; i < totalBoxes; i++) {
    const box = document.createElement("div");
    box.className = "set-logo-box";
    const val = valid[i] ? valid[i].trim().toLowerCase() : null;
    if (val && team1?.name?.trim().toLowerCase() === val && team1.logo) {

      const img = document.createElement("img");
      img.src = team1.logo;
      img.className = "set-logo";
      box.appendChild(img);

    } else if (val && team2?.name?.trim().toLowerCase() === val && team2.logo) {

      const img = document.createElement("img");
      img.src = team2.logo;
      img.className = "set-logo";
      box.appendChild(img);

    } else if (val && val === "무승부") {

      const img = document.createElement("img");
      img.src = "/assets/logo/무승부.png";   // ✅ 무승부 로고 경로
      img.className = "set-logo";
      box.appendChild(img);

    } else if (val) {

      const span = document.createElement("span");
      span.textContent = valid[i];
      span.className = "set-text";
      box.appendChild(span);

    } else {
      box.classList.add("empty");
    }

    element.appendChild(box);
  }
}


/* ===== 5. Details 표시 (맵 이미지 + 텍스트) ===== */
let lastDetails = {};
function renderDetails(details) {
  const categories = ["escort", "hybrid", "control", "push", "flashpoint"];
  const basePath = "/assets/mappoolpick/maps/";
  const possibleExts = [".png", ".jpg", ".jpeg", ".webp"];

  categories.forEach(cat => {
    const list = document.querySelector(`#${cat} .map-list`);
    if (!list) return;

    const maps = details[cat] || [];
    const prev = lastDetails[cat] || [];
    if (JSON.stringify(maps) === JSON.stringify(prev)) return;
    lastDetails[cat] = maps;
    list.innerHTML = "";

    if (maps.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No maps selected";
      list.appendChild(li);
      return;
    }

    const count = maps.length;
    const ratio =
      count <= 2 ? 4.75 :
      count <= 3 ? 3.2 :
      count <= 4 ? 2.2 :
      count <= 5 ? 1.6 :
      count <= 6 ? 1.2 :
      count <= 7 ? 1 :
      count <= 8 ? 0.8 : 0.45;
    const imgHeight = Math.max(60 * ratio, 30);

    maps.forEach(mapName => {
      const li = document.createElement("li");

      // ✅ 맵 썸네일
      const img = document.createElement("img");
      img.alt = mapName;
      img.className = "map-thumb";
      img.loading = "lazy";
      img.style.height = `${imgHeight}px`;
      img.style.display = "none";

      (async () => {
        // ✅ 공백, 특수문자 그대로 두고 URL 인코딩만 적용
        const safeName = encodeURIComponent(mapName.trim());
        for (const ext of possibleExts) {
          const url = `/assets/maps/${safeName}${ext}`;
          try {
            const res = await fetch(url, { method: "HEAD" });
            if (res.ok) {
              img.src = url;
              img.style.display = "block";
              break;
            }
          } catch {}
        }
      })();

      // 맵 이름
      const text = document.createElement("span");
      text.textContent = mapName;

      li.appendChild(img);
      li.appendChild(text);
      list.appendChild(li);
    });
  });
}



// 결과/픽 순서에서 팀 토큰을 team1/team2로 정규화
function normalizePickerToken(token, data) {
  const t = String(token || "").trim().toLowerCase();

  const t1 = (data.team1?.name || "team 1").trim().toLowerCase();
  const t2 = (data.team2?.name || "team 2").trim().toLowerCase();

  // ✅ 완전 일치 우선 비교
  if (t === t1) return "team1";
  if (t === t2) return "team2";

  // ✅ 일반적인 토큰 비교 (단, "t1"/"t2" 단축키는 실제 이름과 다를 때만)
  if ((t === "team 1" || (t === "t1" && t1 !== "t1") || t === "1")) return "team1";
  if ((t === "team 2" || (t === "t2" && t2 !== "t2") || t === "2")) return "team2";

  return null;
}


/* ===== 맵 리스트 하이라이트 ===== */
function highlightPickedMapElements(data) {
  const results = data.mapPickResults || [];     // 맵 이름 배열
  const order = data.setResults || [];           // ✅ mapPickOrder → setResults

  if (!results.length || !order.length) return;
  const team1Color = data.team1?.color || "#e74c3c";
  const team2Color = data.team2?.color || "#3498db";

  // 초기화
  document.querySelectorAll(".map-list li").forEach(li => {
    li.style.outline = "none";
    li.style.backgroundColor = "transparent";
  });
  document.querySelectorAll(".map-list span").forEach(span => {
    span.style.fontWeight = "normal";
  });
  document.querySelectorAll(".map-thumb").forEach(img => {
    img.style.borderColor = "transparent";
  });

  // results[i]의 맵을 order[i]가 픽한 것으로 간주
  results.forEach((mapName, i) => {
    const resultToken = (order[i] || "").trim();

    const pickerKey = normalizePickerToken(resultToken, data); // "team1" | "team2" | null

    const teamColor =
      pickerKey === "team1" ? team1Color :
      pickerKey === "team2" ? team2Color :
      null;

    const target = (mapName || "").trim().toLowerCase();

    document.querySelectorAll(".map-list li").forEach(li => {
      const span = li.querySelector("span");
      const img = li.querySelector(".map-thumb");
      const text = (span?.textContent || "").trim().toLowerCase();
      if (text !== target) return;

      // 🔵 팀 결과면 팀 색 테두리
      if (teamColor) {
        span.style.fontWeight = "bold";
        if (img) img.style.borderColor = teamColor;
        li.style.outline = `2px solid ${teamColor}`;
        li.style.backgroundColor = `${teamColor}22`;
      }
    });
  });
};
/* ===== 선택된 맵 위에 "Map Picked" 표시 ===== */
function showMapPickedText(data) {
  const selected = (data.mapName || "").trim().toLowerCase();
  if (!selected) return;

  // 기존 텍스트 제거
  document.querySelectorAll(".map-picked-text").forEach(el => el.remove());

  // 해당 맵 찾기
  document.querySelectorAll(".map-list li").forEach(li => {
    const span = li.querySelector("span");
    if (!span) return;
    const map = span.textContent.trim().toLowerCase();
    if (map === selected) {
      const txt = document.createElement("div");
      txt.className = "map-picked-text";
      txt.textContent = "MAP PICKED";
      li.appendChild(txt);
    }
  });
}



/* ===== 맵 썸네일 위 팀 로고 오버레이 ===== */
function addPickLogos(data) {
  const results = data.mapPickResults || [];
  const order = data.setResults || [];           // ✅ mapPickOrder → setResults
  if (!results.length || !order.length) return;

  const team1Logo = data.team1?.logo || "";
  const team2Logo = data.team2?.logo || "";

  // 기존 오버레이 제거
  document.querySelectorAll(".map-logo-overlay").forEach(el => el.remove());

  results.forEach((mapName, i) => {
    const pickerKey = normalizePickerToken(order[i], data);
    const logo = pickerKey === "team1" ? team1Logo
               : pickerKey === "team2" ? team2Logo
               : null;
    if (!logo) return;

    const target = (mapName || "").trim().toLowerCase();
    document.querySelectorAll(".map-list li").forEach(li => {
      const span = li.querySelector("span");
      const text = (span?.textContent || "").trim().toLowerCase();
      if (text === target) {
        const existing = li.querySelector(".map-logo-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("img");
        overlay.src = logo;
        overlay.className = "map-logo-overlay"; // CSS에 position 등 이미 있음
        li.appendChild(overlay);
      }
    });
  });
}



/* ===== 8. 주기적 갱신 ===== */
updateOverlay();
setInterval(updateOverlay, 3000);
