async function loadHUD() {
  try {
    const res = await fetch("http://localhost:3000/data");
    const data = await res.json();

    // === 상단 정보 ===
    document.querySelector(".boxText1").textContent =
      `Map ${data.mapNumber} - First to ${data.firstTo}`;

    // ✅ 세트 결과 표시
    PutSets(data.setResults);

    // === 팀1 ===
    const team1 = document.getElementById("team1");
    team1.querySelector(".team-name").textContent = data.team1.name;
    team1.querySelector(".score").textContent = data.team1.score;
    team1.querySelector(".total-score").textContent = data.team1.descriptions;
    team1.querySelector(".ban-text").textContent = "Banned";
    team1.querySelector(".team1-ban").src =
      `images/heroes/${data.team1.bans[0]}.png`;
    team1.querySelector(".team1-logo").src =
      data.team1.logo ? `http://localhost:3000${data.team1.logo}` : "images/teams/team1_logo.png";

    // === 팀2 ===
    const team2 = document.getElementById("team2");
    team2.querySelector(".team-name").textContent = data.team2.name;
    team2.querySelector(".score").textContent = data.team2.score;
    team2.querySelector(".total-score").textContent = data.team2.descriptions;
    team2.querySelector(".ban-text").textContent = "Banned";
    team2.querySelector(".team2-ban").src =
      `images/heroes/${data.team2.bans[0]}.png`;
    team2.querySelector(".team2-logo").src =
      data.team2.logo ? `http://localhost:3000${data.team2.logo}` : "images/teams/team2_logo.png";

  } catch (err) {
    console.error("HUD Load Error:", err);
  }
}

// ✅ 주기적 업데이트
loadHUD();
setInterval(loadHUD, 1000);

// ✅ 세트 결과 표시 함수
function PutSets(inputs) {
  const element = document.querySelector('#top-rightInfoBox .setText1');
  if (!element || !Array.isArray(inputs)) return;

  const valid = inputs.filter(v => v && v.trim() !== "");
  const textWithIndex = valid
    .map((value, index) => `SET ${index + 1}: ${value} WIN`)
    .join("     ");

  element.innerText = textWithIndex || "N/A";
}
