// ✅ 최신 HUD 데이터 주기적 로드
async function loadHUD() {
  try {
    const res = await fetch(`http://localhost:3000/overlay-data?nocache=${Date.now()}`);
    const data = await res.json();
    PutSets(data);
    const type = data.hudType || 'normal';
    document.body.setAttribute('data-hud', type);
    // 색상
    const t1Color = data.team1?.color || "#06F5F5";
    const t2Color = data.team2?.color || "#E42D50";
    document.documentElement.style.setProperty("--team1-color", t1Color);
    document.documentElement.style.setProperty("--team2-color", t2Color);

    // 상단
    const topBox = document.querySelector(".boxText1");
    if (topBox)
      topBox.textContent = `Map ${data.mapNumber || 1} - First to ${data.firstTo || 3}`;

    // 설명
    const descEl = document.getElementById("descriptions");
    if (descEl) descEl.textContent = data.descriptions || "Match Name";

    // 팀 정보 강제 갱신
    updateTeam(document.getElementById("team1"), data.team1, "team1", data.hudType);
    updateTeam(document.getElementById("team2"), data.team2, "team2", data.hudType);

    // 색 박스 갱신
    const team1Box = document.querySelector("#team1 .name-box");
    const team2Box = document.querySelector("#team2 .name-box");
    if (team1Box) team1Box.style.backgroundColor = t1Color;
    if (team2Box) team2Box.style.backgroundColor = t2Color;

  } catch (err) {
    console.error("HUD Load Error:", err);
  }
}


// ✅ 팀별 UI 업데이트
function updateTeam(el, teamData, prefix, type) {
  if (!el || !teamData) return;

  // 🔹 이름 표시: fullName 우선 표시, 없으면 name
  const defaultName = prefix === "team1" ? "Team A" : "Team B";
  const teamName = teamData.fullName || teamData.name || defaultName;
  el.querySelector(".team-name").textContent = teamName;

  // 점수 표시
// 점수 표시
el.querySelector(".score").textContent = teamData.score ?? 0;

// ✅ total-score 표시 (문자열 그대로 출력)
const totalEl = el.querySelector(".total-score");
if (totalEl) {
  const totalValue = teamData.total || "0W 0L";
  if (prefix === "team1") totalEl.textContent = `${totalValue} |`;
  else totalEl.textContent = `| ${totalValue}`;
}


// ✅ 밴 이미지 표시 (단일 ban 또는 배열 모두 지원)
const banEl = el.querySelector(`.${prefix}-ban`);
if (banEl) {
  let heroName = "";
  if (Array.isArray(teamData.bans) && teamData.bans.length > 0) {
    heroName = teamData.bans[0];
  } else if (typeof teamData.ban === "string" && teamData.ban.trim() !== "") {
    heroName = teamData.ban.trim();
  }

  if (heroName) {
    // 실제 폴더 구조에 맞게 경로 수정
    banEl.src = `/assets/HUD-img/heroes/${encodeURIComponent(heroName)}.png`;
  } else {
    banEl.src = `/assets/HUD-img/heroes/default.png`;
  }
}


  // 팀 로고
  const logoEl = el.querySelector(`.${prefix}-logo`);
  if (logoEl)
    logoEl.src = teamData.logo
      ? `http://localhost:3000${teamData.logo}`
      : `/assets/src/${prefix}_logo.png`;

  // 사이드 아이콘
  const sideImg = el.querySelector(`.${prefix}-side`);
  if (sideImg) {
    if (type === "payload") {
      sideImg.style.display = "block";
      if (teamData.side === "attack")
        sideImg.src = "/assets/HUD-img/sides/attack.png";
      else if (teamData.side === "defense")
        sideImg.src = "/assets/HUD-img/sides/defense.png";
      else sideImg.src = "";
    } else {
      sideImg.style.display = "none";
    }
  }
}


// ✅ 세트 결과 표시
// 승리 기록을 상단/하단 바 등에 뿌려주는 함수 (로고 + 팀 약어)
function PutSets(data) {
  const container = document.getElementById("setResultsContainer");
  if (!container) {
    console.warn("⚠️ setResultsContainer not found");
    return;
  }

  container.innerHTML = "";

  if (!data || (!data.mapSets && !data.setResults)) {
    console.warn("⚠️ No valid data for PutSets");
    return;
  }

  const t1 = data.team1 || {};
  const t2 = data.team2 || {};

  const logoUrl = (key) => {
    const team = key === "team1" ? t1 : t2;
    if (team.logo) return `http://localhost:3000${team.logo}`;
    return `/assets/HUD-img/teams/${key}_logo.png`;
  };

  const shortName = (key) =>
    key === "team1" ? t1.name || "T1" : t2.name || "T2";

  // ✅ 승리 정보 정확히 판별
  const wins = [];
  if (Array.isArray(data.mapSets) && data.mapSets.length) {
    data.mapSets.forEach((s) => {
      if (s.winner === "team1" || s.winner === "team2") wins.push(s.winner);
    });
  } else if (Array.isArray(data.setResults) && data.setResults.length) {
    const t1n = (t1.name || "team 1").trim().toLowerCase();
    const t2n = (t2.name || "team 2").trim().toLowerCase();

    data.setResults.forEach((w) => {
      const s = String(w).trim().toLowerCase();

      // ✅ 완전 일치 우선
      if (s === t1n) wins.push("team1");
      else if (s === t2n) wins.push("team2");

      // ✅ 그 외 숫자 토큰 판별 (T1/T2 오탐 방지)
      else if (s === "1" || s === "team1" || s === "team 1") wins.push("team1");
      else if (s === "2" || s === "team2" || s === "team 2") wins.push("team2");
    });
  }

  if (!wins.length) {
    console.warn("⚠️ No winner data found");
    return;
  }

  // 렌더링
  wins.forEach((who) => {
    const el = document.createElement("div");
    el.className = "set-result";
    el.innerHTML = `
      <img class="set-logo" src="${logoUrl(who)}" alt="${shortName(who)}">
      <span class="set-name">${shortName(who)}</span>
    `;
    container.appendChild(el);
  });

  // 🔹 firstTo 값으로 간격 자동 조정
  const ft =
    Number(data.firstTo ?? data.match?.firstTo ?? data.config?.firstTo ?? 3);

  const gapMap = {
    1: 12,
    2: 170,
    3: 54,
    4: 16,
    5: 5,
  };
  const gap = gapMap[ft] ?? Math.max(3, 12 - ft);

  container.style.setProperty("gap", `${gap}px`, "important");
  container.querySelectorAll(".set-result").forEach((node) => {
    node.style.padding = "2px 4px";
    node.style.margin = "0";
  });

  console.log(`✅ PutSets gap applied: firstTo=${ft}, gap=${gap}px`);
}



// ✅ 첫 실행 및 주기적 갱신

loadHUD();
setInterval(loadHUD, 3000);
