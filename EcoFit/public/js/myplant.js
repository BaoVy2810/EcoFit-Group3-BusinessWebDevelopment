const daysContainer = document.getElementById("days-container");
const monthTitle = document.getElementById("month-title");
const rewardBtn = document.getElementById("reward-btn");
const greenScoreElem = document.getElementById("green-score");
const periodElem = document.getElementById("period");

let currentDate = new Date();
let claimedDates = []; // lưu ngày đã claim
let streak = 0; // số ngày liên tiếp claim
let greenScore = 0; // điểm xanh
let plantStage = "Seed"; // giai đoạn cây
const today = new Date(2025, 10, 22);
const MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Helper: milestone checker (10..100)
function isMilestoneDay(value) {
  return (
    Number.isFinite(value) && value > 0 && value % 10 === 0 && value <= 100
  );
}

// Track last milestone toast shown to avoid duplicates across sessions
let lastMilestoneShown =
  Number(localStorage.getItem("lastMilestoneShown")) || 0;

// ======== Toast helpers (non-blocking) ========
function showToast(message, type = "success", timeoutMs = 2500) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${message}</span><button class="toast-close" aria-label="Close">✕</button>`;
  const close = () => {
    el.style.animation = "toast-out 180ms ease-in forwards";
    setTimeout(() => container.removeChild(el), 200);
  };
  el.querySelector(".toast-close").addEventListener("click", close);
  container.appendChild(el);
  if (timeoutMs > 0) setTimeout(close, timeoutMs);
}

// ======== Export streak JSON (silent save only, no download) ========
function exportStreakJSON(fileName = "streak.json") {
  const data = {
    updatedAt: new Date().toISOString(),
    streak,
    greenScore: streak,
    claimedDates: claimedDates.map((d) => d.toISOString().split("T")[0]),
  };
  // Silent persistence only (no download dialog)
  localStorage.setItem("myplant_calendar_export", JSON.stringify(data));
}

function onMilestoneReached() {
  // Toast only, save silently
  showToast(
    `🎉 Congratulations! You reached a new milestone: ${streak} days`,
    "success"
  );
  exportStreakJSON("streak.json");
  lastMilestoneShown = streak;
  localStorage.setItem("lastMilestoneShown", String(lastMilestoneShown));
}

// ======== Đọc dữ liệu từ localStorage (nếu có) ========
window.addEventListener("load", () => {
  const storedDates = JSON.parse(localStorage.getItem("claimedDates") || "[]");
  claimedDates = storedDates.map((d) => new Date(d)); // chuyển string → Date

  streak = Number(localStorage.getItem("streak")) || 0;
  greenScore = Number(localStorage.getItem("greenScore")) || 0;
  plantStage = localStorage.getItem("plantStage") || "Seed";

  updatePlant();
  renderCalendar(currentDate);
});

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  monthTitle.textContent = `${monthNames[month]} ${year}`;
  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells with references for streak styling
  const cells = []; // all grid cells including leading blanks
  const claimedSet = new Set(
    claimedDates
      .filter((d) => d.getMonth() === month && d.getFullYear() === year)
      .map((d) => d.getDate())
  );

  // Leading blanks
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    cells.push(emptyCell);
    daysContainer.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("day-cell");
    dayCell.textContent = day;

    const cellDate = new Date(year, month, day);
    const isToday = cellDate.toDateString() === today.toDateString();
    const isClaimed = claimedSet.has(day);

    if (isToday) dayCell.classList.add("today");
    if (isClaimed) dayCell.classList.add("claimed");

    // Click to claim (only allow next sequential day)
    dayCell.addEventListener("click", () => {
      const alreadyClaimed = claimedDates.some(
        (d) => d.toDateString() === cellDate.toDateString()
      );
      if (alreadyClaimed) return;

      // Enforce sequential claim: next allowed date is
      // either the first claim, or exactly one day after the latest claimed date
      let canClaim = false;
      if (claimedDates.length === 0) {
        canClaim = true;
      } else {
        const maxDate = new Date(
          Math.max.apply(
            null,
            claimedDates.map((d) => d.getTime())
          )
        );
        const nextAllowed = new Date(maxDate);
        nextAllowed.setDate(maxDate.getDate() + 1);
        canClaim = cellDate.toDateString() === nextAllowed.toDateString();
      }

      if (!canClaim) {
        showToast("You can only claim the next day in sequence.", "error");
        return;
      }

      claimedDates.push(cellDate);
      saveClaimedDates();
      updateStreak();
      updatePlant();
      renderCalendar(currentDate);

      // Show congrats at milestones, otherwise generic streak toast
      if (isMilestoneDay(streak)) {
        onMilestoneReached();
      } else {
        showToast(`Reached new streak ${streak} days`, "success");
      }
    });

    cells.push(dayCell);
    daysContainer.appendChild(dayCell);
  }

  // Add grey streak band across consecutive claimed days within the same week
  for (let day = 1; day <= daysInMonth; day++) {
    if (!claimedSet.has(day)) continue;

    const gridIndex = firstDay + (day - 1);
    const dow = gridIndex % 7; // 0..6
    const prevClaimed = day > 1 && claimedSet.has(day - 1) && dow !== 0; // not crossing week
    const nextClaimed =
      day < daysInMonth && claimedSet.has(day + 1) && dow !== 6; // not crossing week

    const cell = cells[gridIndex];
    if (!cell) continue;

    if (prevClaimed && nextClaimed) {
      cell.classList.add("streak-mid");
    } else if (prevClaimed && !nextClaimed) {
      cell.classList.add("streak-end");
    } else if (!prevClaimed && nextClaimed) {
      cell.classList.add("streak-start");
    } else {
      // single claimed day - keep as claimed only
    }
  }
}

// Tính streak liên tiếp
function updateStreak() {
  if (claimedDates.length === 0) {
    streak = 0;
    return;
  }

  // Sắp xếp các ngày theo thứ tự
  claimedDates.sort((a, b) => a - b);

  // Dùng tổng số ngày để tính cấp độ (đơn giản hoá)
  streak = claimedDates.length;

  localStorage.setItem("streak", streak);
  // Ensure milestone toast even if claim handlers miss it
  if (isMilestoneDay(streak) && streak > lastMilestoneShown) {
    onMilestoneReached();
  }
  // Also persist export JSON snapshot on each update
  localStorage.setItem(
    "myplant_calendar_export",
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      streak,
      greenScore: streak,
      claimedDates: claimedDates.map((d) => d.toISOString().split("T")[0]),
    })
  );
}

// Cập nhật greenscore và giai đoạn cây
function updatePlant() {
  greenScore = streak;
  greenScoreElem.textContent = greenScore + "%";

  // === 4 cấp độ cây ===
  let plantStageName = "";
  let progressPercent = 0;
  if (streak >= 30) {
    plantStage = "Guardian Tree";
    plantStageName = "Guardian Tree";
    progressPercent = 100;
  } else if (streak >= 15) {
    plantStage = "Tree";
    plantStageName = "Tree";
    progressPercent = Math.min(((streak - 15) / 15) * 100, 100);
  } else if (streak >= 5) {
    plantStage = "Sapling";
    plantStageName = "Sapling";
    progressPercent = Math.min(((streak - 5) / 10) * 100, 100);
  } else {
    plantStage = "Seed";
    plantStageName = "Seed";
    progressPercent = (streak / 5) * 100;
  }

  localStorage.setItem("greenScore", greenScore);
  localStorage.setItem("plantStage", plantStage);
  periodElem.textContent = plantStageName;

  // Update circular progress
  updateCircularProgress(progressPercent);

  // === Thay đổi hình ảnh cây tương ứng với 4 cấp độ ===
  const plantImg = document.getElementById("plant-img");
  if (plantImg) {
    switch (plantStage) {
      case "Seed":
        plantImg.src = "../images/hat.png";
        break;
      case "Sapling":
        plantImg.src = "../images/cay_con.png";
        break;
      case "Tree":
        plantImg.src = "../images/cay_lon.png";
        break;
      case "Guardian Tree":
        plantImg.src = "../images/old_tree.png";
        break;
    }
  }
}

// Update circular progress bar
function updateCircularProgress(percent) {
  const progressRing = document.getElementById("progress-ring");
  const progressText = document.getElementById("progress-percent");
  if (progressRing && progressText) {
    const circumference = 2 * Math.PI * 42; // 2πr where r=42
    const offset = circumference - (percent / 100) * circumference;
    setTimeout(() => {
      progressRing.style.strokeDashoffset = offset;
      progressText.textContent = Math.round(percent);
    }, 100);
  }
}

// ======== Lưu danh sách claimed ========
function saveClaimedDates() {
  localStorage.setItem("claimedDates", JSON.stringify(claimedDates));
}

// ======== Optional: expose export feature ========
window.exportMyPlantStreak = exportStreakJSON;

// Render lần đầu
renderCalendar(currentDate);
updatePlant();

// Chuyển tháng
document.getElementById("prev-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

document.getElementById("next-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

// Nút claim reward
rewardBtn.addEventListener("click", () => {
  const todayStr = today.toDateString();
  const alreadyClaimed = claimedDates.some(
    (d) => d.toDateString() === todayStr
  );
  if (alreadyClaimed) return;

  // Sequential guard for button as well
  let canClaim = false;
  if (claimedDates.length === 0) {
    canClaim = true;
  } else {
    const maxDate = new Date(
      Math.max.apply(
        null,
        claimedDates.map((d) => d.getTime())
      )
    );
    const nextAllowed = new Date(maxDate);
    nextAllowed.setDate(maxDate.getDate() + 1);
    canClaim = today.toDateString() === nextAllowed.toDateString();
  }
  if (!canClaim) {
    showToast("You can only claim the next day in sequence.", "error");
    return;
  }

  claimedDates.push(today);
  saveClaimedDates();
  updateStreak();
  updatePlant();
  renderCalendar(currentDate);
  if (isMilestoneDay(streak)) {
    onMilestoneReached();
  } else {
    showToast(`Reached new streak ${streak} days`, "success");
  }
});
