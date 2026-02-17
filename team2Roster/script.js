let lastRosterKey = "";
let lastTeamKey = "";
let isFetching = false;
const POLL_MS = 5000;


async function fetchOverlayData() {
  if (isFetching) return;
  isFetching = true;

  try {
    const res = await fetch("http://localhost:3000/overlay-data", { cache: "no-store" });
    if (!res.ok) throw new Error("overlay-data fetch failed");
    const data = await res.json();
    updateHUD(data);
  } catch (err) {
    console.warn("⚠️ overlay fetch error:", err);
  } finally {
    isFetching = false;
  }
}


/* 한글/공백 경로 대응 */
function safeAssetPath(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return encodeURI(path);
}

function renderTeamRoster(containerId, rosterPlayers) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  (rosterPlayers || []).forEach((p) => {
    if (!p || !p.Name) return;

    const role = (p.Role || "").trim();
    const name = (p.Name || "").trim();
    const tier = (p.Tier || "").trim();
    const desc = (p.Desc || "").trim();
    const cheer = (p.Cheer || "").trim();
    const mosts = Array.isArray(p.Mosts) ? p.Mosts : [];

    const most1 = mosts[0] ? String(mosts[0]).trim() : "";
    const most2 = mosts[1] ? String(mosts[1]).trim() : "";
    const most3 = mosts[2] ? String(mosts[2]).trim() : "";

    // 선수 1명 단위
    const split = document.createElement("div");
    split.className = "player-split";

    /* ===== 상단 파트 (영웅 이미지 대신 VIDEO) ===== */
    const top = document.createElement("div");
    top.className = "part-box top-part";

    // ✅ VIDEO: most1 기반 (두번째 script.js 방식)
if (most1) {
  const vid = document.createElement("video");
  vid.className = "hero-video portrait";
  vid.src = safeAssetPath(`/assets/videos/${most1}.webm`);
  vid.setAttribute("preload", "auto");
  vid.setAttribute("playsinline", "");
  vid.setAttribute("muted", "");
  vid.setAttribute("autoplay", "");
  vid.setAttribute("loop", "true");

  // ✅ 프레임 안정에 도움(가능한 환경에서)
  vid.setAttribute("disablePictureInPicture", "");
  vid.setAttribute("controlsList", "nodownload noplaybackrate");


  vid.addEventListener("canplay", () => {
    vid.play().catch(() => {});
  });


  vid.onerror = () => {
    // fallback 이미지
    const img = document.createElement("img");
    img.className = "hero-img portrait";
    img.src = safeAssetPath(`/assets/heroes/${most1}.png`);
    img.onerror = () => { img.src = "/assets/src/default.png"; };
    top.insertBefore(img, top.firstChild);
    vid.remove();
  };

  top.appendChild(vid);
}
 else {
      // most1이 없으면 기존처럼 기본 이미지
      const heroImg = document.createElement("img");
      heroImg.className = "hero-img portrait";
      heroImg.alt = "default";
      heroImg.src = "/assets/src/default.png";
      top.appendChild(heroImg);
    }

    // role icon (원형)
    const roleWrap = document.createElement("div");
    roleWrap.className = "role-wrap";

    const roleIcon = document.createElement("img");
    roleIcon.className = "role-icon";
    roleIcon.alt = role;
    roleIcon.src = safeAssetPath(`/assets/src/${role}.png`);
    roleIcon.onerror = () => { roleWrap.style.display = "none"; };
    roleWrap.appendChild(roleIcon);

    // name overlay
    const nameOverlay = document.createElement("div");
    nameOverlay.className = "name-overlay";
    nameOverlay.textContent = name;

    // tier (중앙)
    const tierIcon = document.createElement("img");
    tierIcon.className = "tier-mid";
    tierIcon.alt = tier;
    tierIcon.src = tier ? safeAssetPath(`/assets/src/${tier}.png`) : "";
    tierIcon.style.display = tier ? "block" : "none";
    tierIcon.onerror = () => { tierIcon.style.display = "none"; };

    top.appendChild(roleWrap);
    top.appendChild(nameOverlay);
    top.appendChild(tierIcon);

    /* ===== 하단 파트 (most3 + desc + cheer) ===== */
    const bottom = document.createElement("div");
    bottom.className = "part-box bottom-part";

    const mostsRow = document.createElement("div");
    mostsRow.className = "mosts-row";

    [most1, most2, most3].forEach((h) => {
      if (!h) return;
      const img = document.createElement("img");
      img.className = "most-hero";
      img.alt = h;
      img.src = safeAssetPath(`/assets/heroes/${h}.png`);
      img.onerror = () => { img.style.display = "none"; };
      mostsRow.appendChild(img);
    });

    const descEl = document.createElement("div");
    descEl.className = "player-desc";
    descEl.textContent = desc;

    // flag 이미지 (cheer 뒤 배경용)
    bottom.appendChild(mostsRow);
    bottom.appendChild(descEl);

    if (cheer) {
      // flag
      const flagImg = document.createElement("img");
      flagImg.className = "cheer-flag";
      flagImg.src = "/assets/src/flag.png";

      // cheer
      const cheerImg = document.createElement("img");
      cheerImg.className = "cheer-img";
      cheerImg.alt = cheer;
      cheerImg.src = safeAssetPath(`/assets/cheers/${cheer}.png`);
      cheerImg.onerror = () => { cheerImg.style.display = "none"; };

      bottom.appendChild(cheerImg);
      bottom.appendChild(flagImg);
    }



    split.appendChild(top);
    split.appendChild(bottom);
    container.appendChild(split);

  });
}

function updateHUD(data) {
  const t2 = data.team2 || {};
  const roster = t2.rosterPlayers || [];

  // 팀 변경 감지(팀 선택 바뀌면 즉시 반영)
  const teamKey = JSON.stringify({
    name: t2.name || "",
    fullName: t2.fullName || "",
    logo: t2.logo || "",
    color: t2.color || ""
  });

  // 로스터 변경 감지(영상 src/텍스트 바뀌면 렌더)
  const rosterKey = JSON.stringify(
    roster.map(p => ({
      n: p.Name || "",
      r: p.Role || "",
      t: p.Tier || "",
      d: p.Desc || "",
      c: p.Cheer || "",
      m1: Array.isArray(p.Mosts) ? (p.Mosts[0] || "") : "",
      m2: Array.isArray(p.Mosts) ? (p.Mosts[1] || "") : "",
      m3: Array.isArray(p.Mosts) ? (p.Mosts[2] || "") : ""
    }))
  );

  // 헤더는 팀Key 바뀌면 즉시
  if (teamKey !== lastTeamKey) {
    lastTeamKey = teamKey;

    const teamHeader = document.getElementById("teamHeader");
    const teamLogoBig = document.getElementById("teamLogoBig");
    const teamNameBig = document.getElementById("teamNameBig");

    if (teamLogoBig) teamLogoBig.src = t2.logo || "";
    if (teamNameBig) teamNameBig.textContent = t2.fullName || t2.name || "";
    if (teamHeader) teamHeader.style.setProperty("--team-color", t2.color || "#00c36a");
  }

  // 로스터는 rosterKey 바뀔 때만 다시 그려서 영상 리셋 최소화
  if (rosterKey !== lastRosterKey) {
    lastRosterKey = rosterKey;
    renderTeamRoster("team2RosterCards", roster);
  }
}


/* 주기적 갱신 */
fetchOverlayData();
setInterval(fetchOverlayData, POLL_MS);