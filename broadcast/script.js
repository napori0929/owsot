/* overlay-data에서 Game Logo만 불러와 표시 */
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


/* 주기적 갱신 */
fetchOverlayData();
setInterval(fetchOverlayData, 2000);
