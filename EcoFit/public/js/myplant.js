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
  plantStage = localStorage.getItem("plantStage") || "Seed 🌱";

  updatePlant();
  renderCalendar(currentDate);
});

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  monthTitle.textContent = `${monthNames[month]} ${year}`;
  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Thêm ô trống đầu tuần
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    daysContainer.appendChild(emptyCell);
  }

  // Tạo các ô ngày
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("day-cell");
    dayCell.textContent = day;

    const cellDate = new Date(year, month, day);
    const isToday = cellDate.toDateString() === today.toDateString();
    const isClaimed = claimedDates.some(
      (d) => d.toDateString() === cellDate.toDateString()
    );

    if (isToday) {
      dayCell.classList.add("today");
    }

    if (isClaimed) {
      dayCell.classList.add("claimed");
      dayCell.textContent = "🌱";
    }

    // Cho phép click vào bất kỳ ngày nào để claim
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

    daysContainer.appendChild(dayCell);
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
  greenScoreElem.textContent = greenScore;

  // === 4 cấp độ cây ===
  if (streak >= 30) {
    plantStage = "Guardian Tree 🌳🏆";
  } else if (streak >= 15) {
    plantStage = "Tree 🌳";
  } else if (streak >= 5) {
    plantStage = "Sapling 🌱🌿";
  } else {
    plantStage = "Seed 🌱";
  }

  localStorage.setItem("greenScore", greenScore);
  localStorage.setItem("plantStage", plantStage);
  periodElem.textContent = plantStage;

  // === Thay đổi hình ảnh cây tương ứng với 4 cấp độ ===
  const plantImg = document.getElementById("plant-img");

  if (plantImg) {
    switch (plantStage) {
      case "Seed 🌱":
        plantImg.src = "../images/hat.png"; // Cấp 1: Hạt giống (0-4 ngày)
        console.log("🌱 Cấp 1 - Hạt giống");
        break;
      case "Sapling 🌱🌿":
        plantImg.src = "../images/cay_con.png"; // Cấp 2: Cây con (5-14 ngày)
        console.log("🌱🌿 Cấp 2 - Cây con");
        break;
      case "Tree 🌳":
        plantImg.src = "../images/cay_lon.png"; // Cấp 3: Cây trưởng thành (15-29 ngày)
        console.log("🌳 Cấp 3 - Cây trưởng thành");
        break;
      case "Guardian Tree 🌳🏆":
        plantImg.src = "../images/old_tree.png"; // Cấp 4: Cây bảo hộ (30+ ngày)
        console.log("🌳🏆 Cấp 4 - Cây bảo hộ");
        break;
    }
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
