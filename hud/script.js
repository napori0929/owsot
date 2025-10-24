async function loadHUD() {
  try {
    const res = await fetch("http://localhost:3000/data");
    const data = await res.json();
    console.log("DATA:", data.team1?.total, data.team2?.total);

    const type = data.hudType || 'normal';
    document.body.setAttribute('data-hud', type);

    document.querySelector(".boxText1").textContent =
      `Map ${data.mapNumber} - First to ${data.firstTo}`;
    PutSets(data.setResults);

    const descEl = document.getElementById("descriptions");
    if (descEl) descEl.textContent = data.descriptions || "";

    updateTeam(document.getElementById("team1"), data.team1, "team1", type);
    updateTeam(document.getElementById("team2"), data.team2, "team2", type);

  } catch (err) {
    console.error("HUD Load Error:", err);
  }
}

function updateTeam(el, teamData, prefix, type) {
  el.querySelector(".team-name").textContent = teamData.name;
  el.querySelector(".score").textContent = teamData.score;
  el.querySelector(".total-score").textContent = teamData.total || ""; // 정상 반영

  el.querySelector(`.${prefix}-ban`).src = `images/heroes/${teamData.bans[0]}.png`;
  el.querySelector(`.${prefix}-logo`).src =
    teamData.logo ? `http://localhost:3000${teamData.logo}` : `images/teams/${prefix}_logo.png`;

  const sideImg = el.querySelector(`.${prefix}-side`);
  if (type === "payload") {
    sideImg.style.display = "block";
    if (teamData.side === "attack")
      sideImg.src = "images/sides/attack.png";
    else if (teamData.side === "defense")
      sideImg.src = "images/sides/defense.png";
    else
      sideImg.src = "";
  } else {
    sideImg.style.display = "none";
  }
}

function PutSets(inputs) {
  const element = document.querySelector('#top-rightInfoBox .setText1');
  if (!element || !Array.isArray(inputs)) return;
  const valid = inputs.filter(v => v && v.trim() !== "");
  const textWithIndex = valid.map((value, index) => `SET ${index + 1}: ${value} WIN`).join("     ");
  element.innerText = textWithIndex || "N/A";
}

loadHUD();
setInterval(loadHUD, 1000);
