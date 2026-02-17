let currentBan1 = "";
let currentBan2 = "";
let currentMap = "";

/* 서버에서 overlay-data 불러오기 */
async function getData() {
  try {
    const res = await fetch("http://localhost:3000/overlay-data", { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return {};
  }
}


/* 메인 갱신 루프 */
async function updateBanpick() {
  const data = await getData();
  PutSets(data);

  /* 기존 기본 정보 표시 */
  document.getElementById("team1Name").textContent = data.team1?.name || "Team 1";
  document.getElementById("team2Name").textContent = data.team2?.name || "Team 2";
  document.getElementById("team1Score").textContent = data.team1?.score ?? 0;
  document.getElementById("team2Score").textContent = data.team2?.score ?? 0;
  document.getElementById("descriptions").textContent = data.descriptions || "OVERWATCH TOURNAMENT";

  document.getElementById("team1Logo").src = data.team1?.logo || "";
  document.getElementById("team2Logo").src = data.team2?.logo || "";
  const mapName = data?.mapName || "";

  /* ===== 🔹 Hero & Map Media Display 추가 ===== */
  try {
    const ban1 = data.team1?.ban || "HERO1";
    const ban2 = data.team2?.ban || "HERO2";
    const mapName = data.mapName || "";
    
    // 🎥 영상 경로 (/assets/videos/)
    const vid1 = `/assets/videos/${ban1}.webm`;
    const vid2 = `/assets/videos/${ban2}.webm`;

    // 🖼️ 이미지 경로
    const heroImg1 = `/assets/heroes/${ban1}.png`;
    const heroImg2 = `/assets/heroes/${ban2}.png`;
    const mapImg = `/assets/maps/${mapName}.png`;

    // ✅ Team1/2 영상 업데이트
    const team1Video = document.getElementById("team1Video");
    const team2Video = document.getElementById("team2Video");

    if (team1Video) {
      if (ban1 && currentBan1 !== ban1) {
        currentBan1 = ban1;
        await setVideoSmooth(team1Video, `/assets/videos/${encodeURIComponent(ban1)}.webm`);
      } else if (!ban1 && currentBan1) {
        team1Video.pause();
        team1Video.removeAttribute("src");
        team1Video.load();
        team1Video.dataset.src = "";
        currentBan1 = "";
      }
    }

    if (team2Video) {
      if (ban2 && currentBan2 !== ban2) {
        currentBan2 = ban2;
        await setVideoSmooth(team2Video, `/assets/videos/${encodeURIComponent(ban2)}.webm`);
      } else if (!ban2 && currentBan2) {
        team2Video.pause();
        team2Video.removeAttribute("src");
        team2Video.load();
        team2Video.dataset.src = "";
        currentBan2 = "";
      }
    }
      /* 🔹 Ban 순서 (Initial / Follow-up) */
  const team1BanOrder = document.getElementById("team1-ban-order");
  const team2BanOrder = document.getElementById("team2-ban-order");

  const init = data.initialBan;
  if (init === "1") {
    if (team1BanOrder) team1BanOrder.textContent = "Initial Ban";
    if (team2BanOrder) team2BanOrder.textContent = "Follow-up Ban";
  } else if (init === "2") {
    if (team1BanOrder) team1BanOrder.textContent = "Follow-up Ban";
    if (team2BanOrder) team2BanOrder.textContent = "Initial Ban";
  } else {
    if (team1BanOrder) team1BanOrder.textContent = "";
    if (team2BanOrder) team2BanOrder.textContent = "";
  }
  const mapNameEl = document.getElementById("mapName");

  if (mapNameEl) mapNameEl.textContent = data.mapName || "MAP";

    // ✅ Hero 이미지 갱신
    const heroImgEl1 = document.getElementById("team1HeroImg");
    const heroImgEl2 = document.getElementById("team2HeroImg");
    if (heroImgEl1) heroImgEl1.src = heroImg1;
    if (heroImgEl2) heroImgEl2.src = heroImg2;

    // ✅ Map 이미지 갱신
    const mapImgEl = document.getElementById("mapImage");
    if (mapImgEl) mapImgEl.src = mapImg;

    // ✅ 텍스트 반영
    const banText1 = document.getElementById("team1-ban-text");
    const banText2 = document.getElementById("team2-ban-text");
    if (banText1) banText1.textContent = ban1;
    if (banText2) banText2.textContent = ban2;

    const mapText = document.getElementById("mapNameText");
    if (mapText) mapText.textContent = mapName;
  } catch (err) {
    console.warn("⚠️ Hero/Map media update failed:", err);
  }
  const mapBg = document.getElementById("mapBg");
  const safeMap = (mapName || "").trim();

  if (mapBg) {
    // ✅ 맵이 바뀔 때만 교체 (깜빡임 방지)
    if (safeMap && safeMap !== currentMap) {
      currentMap = safeMap;

      const url = `/assets/maps/${encodeURIComponent(safeMap)}.png`; // ✅ Date.now 제거

      // ✅ 프리로드 후 스왑 (로드 중 깜빡임 최소화)
      const img = new Image();
      img.onload = () => {
        mapBg.style.backgroundImage = `url("${url}")`;
      };
      img.src = url;

    } else if (!safeMap && currentMap) {
      // 맵이 비워졌을 때만 제거
      currentMap = "";
      mapBg.style.backgroundImage = "";
    }
  }

}

/* ✅ 세트 결과 표시 (기존 유지) */
function PutSets(data) {
  const element = document.getElementById("setResultsBox");
  if (!element || !data) return;
  const { team1, team2, setResults = [], firstTo = 1 } = data;
  element.innerHTML = "";

  let totalBoxes =
    firstTo === 1 ? 1 :
    firstTo === 2 ? 3 :
    firstTo === 3 ? 5 :
    firstTo === 4 ? 7 : firstTo * 2 - 1;

  // ✅ 무승부가 하나라도 있으면 박스 +1
  const valid = (setResults || []).filter(v => v && v.trim() !== "");

  // ✅ 무승부 개수만큼 박스 추가
  const drawCount = valid.filter(v => v.trim() === "무승부").length;
  totalBoxes += drawCount;

  // ✅ 혹시 데이터가 base 박스 수보다 길면(무승부 포함) 전부 보이도록 보정
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
function setVideoSmooth(videoEl, url) {
  return new Promise((resolve) => {
    if (!videoEl) return resolve(false);

    // 같은 소스면 아무것도 안 함
    if (videoEl.dataset.src === url) return resolve(true);
    videoEl.dataset.src = url;

    // 바꾸는 순간 깜빡/끊김 체감 줄이기: 잠깐 숨김
    videoEl.classList.add("is-loading");

    // 이벤트 1회용
    const done = () => {
      videoEl.removeEventListener("canplay", done);
      videoEl.classList.remove("is-loading");
      // 재생 보장 (muted+autoplay면 대부분 OK)
      videoEl.play().catch(() => {});
      resolve(true);
    };

    videoEl.addEventListener("canplay", done, { once: true });

    videoEl.src = url;     // ✅ 캐시버스터 금지
    videoEl.load();
  });
}

/* 주기적 갱신 */
setInterval(updateBanpick, 3000);
updateBanpick();
