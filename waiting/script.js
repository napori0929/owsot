let remaining = 0;
let countdownActive = false;
let interval = null;
let fetchLoop = null;

/* 🧭 Countdown + HUD 데이터 Fetch */
async function fetchCountdown() {
  try {
    const [res1, res2] = await Promise.all([
      fetch("http://localhost:3000/countdown-data", { cache: "no-store" }),
      fetch("http://localhost:3000/overlay-data", { cache: "no-store" })
    ]);
    if (!res1.ok || !res2.ok) return;

    const cd = await res1.json();
    const hud = await res2.json();

    updateHUD(hud);

    // Stop/Reset 즉시 반영
    if (!cd.isActive) {
      stopCountdown(0);
      return;
    }

    // Start 시 새로 시작
    if (cd.isActive && !countdownActive) {
      startCountdown(cd.time);
    }
  } catch (err) {
    console.warn("❌ fetchCountdown error:", err);
  }
}

/* 🧩 HUD 업데이트 */
function updateHUD(data) {
  // 상단 팀/로고
  document.getElementById("team1Name").textContent = data.team1?.name || "Team A";
  document.getElementById("team2Name").textContent = data.team2?.name || "Team B";
  document.getElementById("team1Logo").src = data.team1?.logo || "";
  document.getElementById("team2Logo").src = data.team2?.logo || "";

  // 점수
  document.getElementById("team1Score").textContent = data.team1?.score ?? 0;
  document.getElementById("team2Score").textContent = data.team2?.score ?? 0;

  // First To
  document.getElementById("firstToText").textContent = `First To ${data.firstTo ?? 3}`;

  // 하단 고정 팀 컴포넌트
  document.getElementById("team1NameFixed").textContent =
    data.team1?.fullName || data.team1?.name || "Team A";
  document.getElementById("team2NameFixed").textContent =
    data.team2?.fullName || data.team2?.name || "Team B";
  document.getElementById("team1LogoFixed").src = data.team1?.logo || "";
  document.getElementById("team2LogoFixed").src = data.team2?.logo || "";
}

/* ⏱ Countdown 로직 */
function startCountdown(time) {
  clearInterval(interval);

  remaining = time;
  countdownActive = true;
  updateDisplay();

  // ✅ 카운트다운 시작(0 초과) = 슬라이딩 재개
  resumeGuideSlidingIfNeeded();

  interval = setInterval(async () => {
    remaining--;
    updateDisplay();

    if (remaining <= 0) {
      clearInterval(interval);
      countdownActive = false;
      remaining = 0;
      updateDisplay();
      stopGuideSlidingAndVideo();

      // 0초 시 서버 상태 false로 갱신
      try {
        await fetch("http://localhost:3000/countdown-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false, time: 0 })
        });
      } catch (err) {
        console.warn("⚠️ Countdown sync failed:", err);
      }
    }
  }, 1000);
}

function stopCountdown(time = 0) {
  clearInterval(interval);
  countdownActive = false;
  remaining = time;
  updateDisplay();

  // ✅ 중지(0)면 슬라이딩/영상도 중단
  if (remaining <= 0) stopGuideSlidingAndVideo?.();
}



/* 시계 표시 갱신 */
function updateDisplay() {
  const el = document.getElementById("countdownDisplay");
  if (!el) return;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  el.textContent = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/* 주기적 fetch 유지 */
function startFetching() {
  if (fetchLoop) clearInterval(fetchLoop);
  fetchLoop = setInterval(fetchCountdown, 1000);
  fetchCountdown();
}

let guidePausedByCountdownEnd = false;
let guideTimer = null; // 이미지용 타이머 쓰고 있다면 이미 있을 것

function stopGuideSlidingAndVideo() {
  guidePausedByCountdownEnd = true;

  // 이미지 슬라이딩 타이머 중단
  if (guideTimer) {
    clearTimeout(guideTimer);
    guideTimer = null;
  }
  if (guideVideoEl) {
    guideVideoEl.onended = null;
    guideVideoEl.pause();
  }


  // 영상 즉시 중단
  const gv = document.getElementById("guideVideo");
  if (gv) {
    gv.onended = null;
    gv.pause();
    gv.currentTime = 0;
    gv.muted = true;
  }
}

function resumeGuideSlidingIfNeeded() {
  // ✅ 재개 시점엔 반드시 false로 풀고 시작
  guidePausedByCountdownEnd = false;

  // 타이머 정리
  clearGuideTimer();

  // 영상 onended가 제거된 상태일 수 있으니, 다음 실행을 강제로 걸어줌
  showNextGuide();
}


let guideFiles = [];
let currentGuide = -1;

let guideWrap = null;
let guideImageEl = null;
let guideVideoEl = null;

function isVideoFile(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext);
}

function stopGuideVideo() {
  if (!guideVideoEl) return;
  try {
    guideVideoEl.onended = null;
    guideVideoEl.pause();
    guideVideoEl.removeAttribute("src");
    guideVideoEl.load();
  } catch (_) {}
}

function clearGuideTimer() {
  if (guideTimer) {
    clearTimeout(guideTimer);
    guideTimer = null;
  }
}

async function loadGuideListIfNeeded() {
  if (guideFiles.length > 0) return;
  const res = await fetch("http://localhost:3000/guide-list", { cache: "no-store" });
  if (!res.ok) return;
  guideFiles = await res.json();
}

function nextGuideIndex() {
  currentGuide = (currentGuide + 1) % guideFiles.length;
  return currentGuide;
}

async function showNextGuide() {
  try {
    if (guidePausedByCountdownEnd) return;
    if (!guideWrap) guideWrap = document.getElementById("guideMedia");
    if (!guideImageEl) guideImageEl = document.getElementById("guideImage");
    if (!guideVideoEl) guideVideoEl = document.getElementById("guideVideo");

    await loadGuideListIfNeeded();
    if (!guideFiles || guideFiles.length === 0) return;

    clearGuideTimer();

    const idx = nextGuideIndex();
    const file = guideFiles[idx];
    const src = `/assets/guides/${file}`;
    const useVideo = isVideoFile(file);

    // 페이드아웃
    guideWrap.style.opacity = 0;

    setTimeout(async () => {
      if (useVideo) {
        // 영상 모드
        guideImageEl.style.display = "none";
        guideVideoEl.style.display = "block";

        stopGuideVideo();
        guideVideoEl.src = src;

        guideVideoEl.muted = true;   // ✅ 소리 ON
        guideVideoEl.volume = 1.0;
        guideVideoEl.loop = false;
        guideVideoEl.playsInline = true;
        guideVideoEl.setAttribute("muted", "");

        // 영상 끝나면 다음으로
        guideVideoEl.onended = () => {
          showNextGuide();
        };

        try { await guideVideoEl.play(); } catch (e) {
          console.warn("⚠️ guide video play blocked:", e);
        }

        guideWrap.style.opacity = 1;
      } else {
        // 이미지 모드 (예: 15초 뒤 다음)
        stopGuideVideo();
        guideVideoEl.style.display = "none";
        guideImageEl.style.display = "block";

        guideImageEl.onload = () => {
          guideWrap.style.opacity = 1;

          // ✅ 이미지는 고정 시간 후 다음
          guideTimer = setTimeout(() => {
            showNextGuide();
          }, 15000);
        };

        guideImageEl.src = src;
      }
    }, 800);
  } catch (err) {
    console.warn("⚠️ showNextGuide error:", err);
  }
}



// ✅ 기존 setInterval(changeGuideMedia, 15000) / changeGuideMedia() 호출은 제거하고 아래만 남겨
showNextGuide();

/* 초기 실행 */
startFetching();
