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

/* team 2 rosterPlayers → 카드 렌더 */
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
    const most2 = Array.isArray(p.Mosts) && p.Mosts.length > 0
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
    playerImg.alt = most2;
    playerImg.src = most2
      ? safeAssetPath(`/assets/heroes/${most2}.png`)
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
  const t2 = data.team2 || {};

  const t2NameTop = document.getElementById("team2NameTop");
  const t2FullTop = document.getElementById("team2FullNameTop");
  const team2Labels = document.querySelector(".team2-labels");
  if (t2NameTop) t2NameTop.textContent = t2.name || "";
  if (t2FullTop) t2FullTop.textContent = t2.fullName || "";

  if (team2Labels && t2.color) {
    team2Labels.style.borderColor = t2.color;
  }
  renderTeamRoster("team2Cards", t2.rosterPlayers || []);
}

/* 주기적 갱신 */
fetchOverlayData();
setInterval(fetchOverlayData, 2000);
