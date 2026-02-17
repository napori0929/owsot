/* overlay-data 불러오기 */
async function fetchOverlayData() {
  try {
    const res = await fetch("http://localhost:3000/overlay-data", { cache: "no-store" });
    if (!res.ok) throw new Error("overlay-data fetch failed");
    const data = await res.json();
    updateHUD(data);
  } catch (err) {
    console.warn("⚠️ overlay fetch error:", err);
  }
}

/* 한글/공백 경로 대응 */
function safeAssetPath(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return encodeURI(path);
}

/* TEAM 1 rosterPlayers → 카드 렌더 */
function renderTeamRoster(containerId, rosterPlayers) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  (rosterPlayers || []).forEach((p) => {
    if (!p || !p.Name) return;

    const role = (p.Role || "").trim();
    const name = p.Name.trim();
    const desc = (p.Desc || "").trim();
    const tier = (p.Tier || "").trim();
    const most1 = Array.isArray(p.Mosts) && p.Mosts.length > 0
      ? p.Mosts[0].trim()
      : "";

    const card = document.createElement("div");
    card.className = "player-card";

    /* 좌상단 Role */
    const roleIcon = document.createElement("img");
    roleIcon.className = "role-icon";
    roleIcon.src = safeAssetPath(`/assets/src/${role}.png`);
    roleIcon.alt = role;

    /* 메인 이미지 = Mosts[0] */
    const playerImg = document.createElement("img");
    playerImg.className = "player-img";
    playerImg.alt = most1;
    playerImg.src = most1
      ? safeAssetPath(`/assets/heroes/${most1}.png`)
      : "/assets/src/default.png";

    /* 우하단 Tier */
    const tierIcon = document.createElement("img");
    tierIcon.className = "tier-icon";
    tierIcon.src = tier
      ? safeAssetPath(`/assets/src/${tier}.png`)
      : "";
    tierIcon.style.display = tier ? "block" : "none";

    /* 하단 텍스트 */
    const info = document.createElement("div");
    info.className = "player-info";

    const nameEl = document.createElement("div");
    nameEl.className = "player-name";
    nameEl.textContent = name;

    const descEl = document.createElement("div");
    descEl.className = "player-desc";
    descEl.textContent = desc;

    info.appendChild(nameEl);
    info.appendChild(descEl);

    card.appendChild(roleIcon);
    card.appendChild(playerImg);
    card.appendChild(tierIcon);
    card.appendChild(info);

    container.appendChild(card);
  });
}

/* HUD 갱신 */
function updateHUD(data) {
  const t1 = data.team1 || {};
  
  const t1NameTop = document.getElementById("team1NameTop");
  const t1FullTop = document.getElementById("team1FullNameTop");
  const team1Labels = document.querySelector(".team1-labels");
  if (t1NameTop) t1NameTop.textContent = t1.name || "";
  if (t1FullTop) t1FullTop.textContent = t1.fullName || "";

  if (team1Labels && t1.color) {
    team1Labels.style.borderColor = t1.color;
  }
  renderTeamRoster("team1Cards", t1.rosterPlayers || []);
}

/* 주기적 갱신 */
fetchOverlayData();
setInterval(fetchOverlayData, 2000);
