const daysContainer = document.getElementById("days-container");
const monthTitle = document.getElementById("month-title");
const rewardBtn = document.getElementById("reward-btn");
const greenScoreElem = document.getElementById("green-score");
const periodElem = document.getElementById("period");

let currentDate = new Date();
let claimedDates = []; // lưu ngày đã claim
let streak = 0; // số ngày liên tiếp claim
let greenScore = 0; // điểm xanh
let plantStage = "Seed 🌱"; // giai đoạn cây
const today = new Date(2025, 10, 22);

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

    // Click to claim
    dayCell.addEventListener("click", () => {
      const alreadyClaimed = claimedDates.some(
        (d) => d.toDateString() === cellDate.toDateString()
      );
      if (!alreadyClaimed) {
        claimedDates.push(cellDate);
        saveClaimedDates();
        updateStreak();
        updatePlant();
        renderCalendar(currentDate);
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

  // Tính streak dài nhất
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < claimedDates.length; i++) {
    const diff =
      (claimedDates[i] - claimedDates[i - 1]) / (1000 * 60 * 60 * 24);

    if (Math.abs(diff - 1) < 0.1) {
      // Các ngày liên tiếp
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // Dùng tổng số ngày để tính cấp độ (dễ hơn)
  streak = claimedDates.length;

  localStorage.setItem("streak", streak);
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
    progressPercent = 100; // Max 100%
  } else if (streak >= 15) {
    plantStage = "Tree";
    plantStageName = "Tree";
    progressPercent = Math.min(((streak - 15) / 15) * 100, 100); // 15-30 ngày
  } else if (streak >= 5) {
    plantStage = "Sapling";
    plantStageName = "Sapling";
    progressPercent = Math.min(((streak - 5) / 10) * 100, 100); // 5-15 ngày
  } else {
    plantStage = "Seed";
    plantStageName = "Seed";
    progressPercent = (streak / 5) * 100; // 0-5 ngày
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
        plantImg.src = "../images/hat.png"; // Cấp 1: Hạt giống (0-4 ngày)
        console.log("🌱 Cấp 1 - Hạt giống");
        break;
      case "Sapling":
        plantImg.src = "../images/cay_con.png"; // Cấp 2: Cây con (5-14 ngày)
        console.log("🌱🌿 Cấp 2 - Cây con");
        break;
      case "Tree":
        plantImg.src = "../images/cay_lon.png"; // Cấp 3: Cây trưởng thành (15-29 ngày)
        console.log("🌳 Cấp 3 - Cây trưởng thành");
        break;
      case "Guardian Tree":
        plantImg.src = "../images/old_tree.png"; // Cấp 4: Cây bảo hộ (30+ ngày)
        console.log("🌳🏆 Cấp 4 - Cây bảo hộ");
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

    // Animate the progress ring
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

  // Kiểm tra đã claim hôm nay chưa
  const alreadyClaimed = claimedDates.some(
    (d) => d.toDateString() === todayStr
  );
  if (alreadyClaimed) {
    alert("You have already claimed today's reward!");
    return;
  }

  claimedDates.push(today); // claim ngày hôm nay
  saveClaimedDates(); // lưu xuống localstorage
  updateStreak(); // cập nhật streak liên tiếp
  updatePlant(); // cập nhật greenscore & cây
  renderCalendar(currentDate); // render calendar
});
