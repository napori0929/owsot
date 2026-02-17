async function loadData() {
  try {
    const res = await fetch("http://localhost:3000/overlay-data", { cache: "no-store" });
    const data = await res.json();
    const mapSets = data.mapSets || [];

    const container = document.getElementById("mapsetContainer");
    if (!container) return;
    container.innerHTML = "";

    // ✅ 한글 → 영어 매핑
    const mapNameEN = {
      "도라도": "Dorado",
      "66번 국도": "Route 66",
      "감시기지 지브롤터": "Watchpoint: Gibraltar",
      "리알토": "Rialto",
      "하바나": "Havana",
      "쓰레기촌": "Junkertown",
      "서킷 로얄": "Circuit Royal",
      "샴발리 수도원": "Shambali Monastery",
      "할리우드": "Hollywood",
      "아이헨발데": "Eichenwalde",
      "왕의 길": "King’s Row",
      "블리자드 월드": "Blizzard World",
      "눔바니": "Numbani",
      "미드타운": "Midtown",
      "파라이수": "Paraiso",
      "일리오스": "Ilios",
      "리장 타워": "Lijiang Tower",
      "네팔": "Nepal",
      "오아시스": "Oasis",
      "부산": "Busan",
      "남극 반도": "Antarctic Peninsula",
      "사모아": "Samoa",
      "콜로세오": "Colosseo",
      "뉴 퀸 스트리트": "New Queen Street",
      "이스페란사": "Esperança",
      "루나사피": "Lunaris",
      "수라바사": "Suravasa",
      "뉴 정크 시티": "New Junk City",
      "아틀리스": "Atelier"
      
    };
    // ✅ firstTo에 따른 map-row 높이 결정
    let rowHeight = 160; // 기본값
    switch (data.firstTo) {
      case 1:
        rowHeight = 240; // 단판이면 크게
        break;
      case 2:
        rowHeight = 180;
        break;
      case 3:
        rowHeight = 180;
        break;
      case 4:
        rowHeight = 125;
        break;
      default:
        rowHeight = 120; // 길어질수록 낮게
        break;
    }

    mapSets.forEach((set, idx) => {
      const row = document.createElement("div");
      row.className = "map-row";

      // ✅ 여기 추가
      row.style.height = `${rowHeight}px`;
      // 맵 이미지
      const mapImg = document.createElement("img");
      mapImg.className = "map-bg";
      mapImg.src = `/assets/maps/${set.map}.png`;
      mapImg.onerror = () => (mapImg.style.display = "none");
      row.appendChild(mapImg);

      // 왼쪽 밴픽 영역
      const left = document.createElement("div");
      left.className = "left-block";

      // 밴픽 여부 판단
      const hasTeam1Ban = set.team1Bans && set.team1Bans[0];
      const hasTeam2Ban = set.team2Bans && set.team2Bans[0];
      const showBanTitle = hasTeam1Ban || hasTeam2Ban; // 하나라도 선택됐을 때만 표시

      left.innerHTML = `
        <div class="ban-section">
          <div class="ban-title">${showBanTitle ? "BANNED" : ""}</div>
          <div class="ban-rows">
            <div class="team-bans team1-bans">
              <img class="hero-icon"
                  src="${hasTeam1Ban
                    ? `/assets/heroes/${set.team1Bans[0]}.png`
                    : `/assets/src/black.png`}"
                  onerror="this.src='/assets/src/black.png'">
            </div>
            <div class="team-bans team2-bans">
              <img class="hero-icon"
                  src="${hasTeam2Ban
                    ? `/assets/heroes/${set.team2Bans[0]}.png`
                    : `/assets/src/black.png`}"
                  onerror="this.src='/assets/src/black.png'">
            </div>
            <div class="set-num">${idx + 1}</div>
          </div>
          <div class="ban-names">
            <div class="team1-name">${hasTeam1Ban ? (data.team1?.name || "") : ""}</div>
            <div class="team2-name">${hasTeam2Ban ? (data.team2?.name || "") : ""}</div>
          </div>
        </div>
      `;



      row.appendChild(left);

      // 중앙 맵 이름 + 모드
      const center = document.createElement("div");
      center.className = "map-center";

      // ✅ 한글 이름 → 영어 변환 (없으면 그대로 표시)
      const mapKo = set.map || "-";
      const mapEn = mapNameEN[mapKo] || mapKo;

      center.innerHTML = `
        <img class="mode-icon" src="/assets/modes-white/${set.mode}.png" alt="${set.mode}" onerror="this.style.display='none'">
        <div class="map-mid">${mapEn.toUpperCase()}</div>
      `;
      row.appendChild(center);

      // 오른쪽 승자 영역
      // 오른쪽 승자 영역
      const right = document.createElement("div");
      right.className = "map-right";

      if (set.winner) {

        let winnerText = "";
        let winnerLogo = "";

        if (set.winner === "team1") {
          winnerText = data.team1?.fullName || data.team1?.name || "-";
          winnerLogo = data.team1?.logo || "";
          row.classList.add("winner1");

        } else if (set.winner === "team2") {
          winnerText = data.team2?.fullName || data.team2?.name || "-";
          winnerLogo = data.team2?.logo || "";
          row.classList.add("winner2");

        } else if (set.winner === "무승부") {
          winnerText = "DRAW";
          winnerLogo = "/assets/logo/무승부.png";   // ✅ 무승부 로고
        }

        right.innerHTML = `
          <div class="win-label">WIN</div>
          <div class="winner-line">
            <div class="winner-text">${winnerText}</div>
            <img class="team-logo" src="${winnerLogo}" alt="">
          </div>
        `;

      } else {
        right.innerHTML = "";
      }


      row.appendChild(right);


      // 색 강조
      if (set.winner === "team1") row.classList.add("winner1");
      if (set.winner === "team2") row.classList.add("winner2");

      container.appendChild(row);
    });
  } catch (err) {
    console.warn("⚠️ Failed to load overlay data:", err);
  }
}

loadData();
setInterval(loadData, 3000);
