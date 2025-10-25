const daysContainer = document.getElementById("days-container");
const monthTitle = document.getElementById("month-title");
const rewardBtn = document.getElementById("reward-btn");
const greenScoreElem = document.getElementById("green-score");
const periodElem = document.getElementById("period");

let currentDate = new Date();
let claimedDates = JSON.parse(localStorage.getItem("claimedDates") || "[]").map(
  (d) => new Date(d)
);
let streak = +localStorage.getItem("streak") || 0;
let greenScore = +localStorage.getItem("greenScore") || 0;
let plantStage = localStorage.getItem("plantStage") || "Seed";

const normalizeDate = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const getToday = () => normalizeDate(new Date());

// === Render Calendar ===
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

  // Grid alignment (Sun -> Sat)
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.classList.add("day-cell", "empty");
    daysContainer.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    cell.textContent = day;

    const cellDate = new Date(year, month, day);
    const today = getToday();
    const isClaimed = claimedDates.some(
      (d) => d.toDateString() === cellDate.toDateString()
    );

    if (cellDate.toDateString() === today.toDateString()) {
      cell.classList.add("today");
    }

    if (isClaimed) {
      cell.classList.add("claimed");

      // Leaf icon center
      const leaf = document.createElement("img");
      leaf.src = "../images/leaf.png";
      leaf.alt = "leaf";
      leaf.classList.add("leaf-icon");
      cell.textContent = "";
      cell.appendChild(leaf);
    }

    // Claim click
    cell.addEventListener("click", () => claimDay(cellDate));
    daysContainer.appendChild(cell);
  }
}

// === Claim logic ===
function claimDay(date) {
  if (claimedDates.some((d) => d.toDateString() === date.toDateString()))
    return;

  const today = getToday();
  const canClaim =
    !claimedDates.length ||
    date.toDateString() === today.toDateString() ||
    date - new Date(Math.max(...claimedDates.map((d) => d.getTime()))) <=
      24 * 3600 * 1000;

  if (!canClaim) {
    showAlert("⚠️ You can only claim consecutive days!");
    return;
  }

  claimedDates.push(date);
  streak = claimedDates.length;
  greenScore = streak;
  localStorage.setItem(
    "claimedDates",
    JSON.stringify(claimedDates.map((d) => d.toISOString()))
  );
  localStorage.setItem("streak", streak);
  localStorage.setItem("greenScore", greenScore);

  updatePlant();
  renderCalendar(currentDate);
  showAlert("🌱 Day claimed successfully!");
}

// === Plant progress ===
function updatePlant() {
  greenScoreElem.textContent = greenScore;

  if (streak >= 100) plantStage = "Guardian Tree";
  else if (streak >= 50) plantStage = "Tree";
  else if (streak >= 20) plantStage = "Sapling";
  else plantStage = "Seed";

  periodElem.textContent = plantStage;
  localStorage.setItem("plantStage", plantStage);

  const plantImg = document.getElementById("plant-img");
  if (plantImg) {
    const imgMap = {
      Seed: "../images/hat.png",
      Sapling: "../images/cay_con.png",
      Tree: "../images/cay_lon.png",
      "Guardian Tree": "../images/old_tree.png",
    };
    plantImg.src = imgMap[plantStage];
  }
}

// === Claim Reward button ===
rewardBtn.addEventListener("click", () => claimDay(getToday()));

// === Alert đẹp ===
function showAlert(msg) {
  const box = document.createElement("div");
  box.className = "green-alert";
  box.innerHTML = `
    <div class="green-alert-content">
      <span>${msg}</span>
      <button>&times;</button>
    </div>`;
  document.body.appendChild(box);
  setTimeout(() => box.classList.add("show"), 10);
  box.querySelector("button").onclick = () => box.remove();
  setTimeout(() => box.remove(), 3000);
}

window.addEventListener("load", () => {
  renderCalendar(currentDate);
  updatePlant();
});
