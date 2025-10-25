// myplant.js - cleaned & stable
/* globals fetch, localStorage */

(() => {
  // --- Element refs ---
  const daysContainer = document.getElementById("days-container");
  const monthTitle = document.getElementById("month-title");
  const rewardBtn = document.getElementById("reward-btn");
  const greenScoreElem = document.getElementById("green-score");
  const periodElem = document.getElementById("period");

  // --- State ---
  let currentDate = new Date();
  let claimedDates = (
    JSON.parse(localStorage.getItem("claimedDates") || "[]") || []
  ).map((s) => new Date(s));
  let streak = Number(localStorage.getItem("streak") || 0);
  let greenScore = Number(localStorage.getItem("greenScore") || 0);
  let plantStage = localStorage.getItem("plantStage") || "Seed";

  const MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const LAST_MILESTONE_KEY = "lastMilestoneShown";

  // --- Helpers ---
  function normalizeDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function getToday() {
    return normalizeDate(new Date());
  }
  function dateEq(a, b) {
    return normalizeDate(a).getTime() === normalizeDate(b).getTime();
  }
  function isMilestone(n) {
    return Number.isFinite(n) && MILESTONES.includes(n);
  }

  // --- Persistence ---
  function saveState() {
    localStorage.setItem(
      "claimedDates",
      JSON.stringify(claimedDates.map((d) => d.toISOString()))
    );
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("greenScore", String(greenScore));
    localStorage.setItem("plantStage", plantStage);
  }

  function exportStreakJSON(fileName = "myplant.json") {
    const data = {
      updatedAt: new Date().toISOString(),
      streak,
      greenScore,
      claimedDates: claimedDates.map(
        (d) => normalizeDate(d).toISOString().split("T")[0]
      ),
    };
    localStorage.setItem("myplant_calendar_export", JSON.stringify(data));
    // optional: attempt best-effort PUT (may fail on static hosting)
    try {
      fetch("../../dataset/myplant.json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch (_) {}
  }

  // --- UI: green alert ---
  function showAlert(msg, duration = 3000) {
    const existing = document.querySelector(".green-alert");
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.className = "green-alert";
    box.innerHTML = `<div class="green-alert-content"><span>${msg}</span><button aria-label="close">✕</button></div>`;
    document.body.appendChild(box);
    // force layout then show
    requestAnimationFrame(() => box.classList.add("show"));
    box.querySelector("button").addEventListener("click", () => box.remove());
    if (duration > 0) setTimeout(() => box.remove(), duration);
  }

  // --- Milestone UI (uses same green alert for simplicity) ---
  function onMilestoneReached(days) {
    const lastShown = Number(localStorage.getItem(LAST_MILESTONE_KEY) || 0);
    if (days <= lastShown) return; // already shown
    showAlert(`🌿 Congratulations! ${days}-day streak reached!`);
    exportStreakJSON();
    localStorage.setItem(LAST_MILESTONE_KEY, String(days));
  }

  // --- Update plant visuals & circular progress ---
  function updatePlantVisuals() {
    greenScore = claimedDates.length;
    if (greenScoreElem) greenScoreElem.textContent = String(greenScore);

    if (greenScore >= 170) plantStage = "Guardian Tree";
    else if (greenScore >= 100) plantStage = "Tree";
    else if (greenScore >= 50) plantStage = "Sapling";
    else plantStage = "Seed";

    if (periodElem) periodElem.textContent = plantStage;
    // update plant image if present
    const plantImg = document.getElementById("plant-img");
    if (plantImg) {
      const map = {
        Seed: "../images/hat.png",
        Sapling: "../images/cay_con.png",
        Tree: "../images/cay_lon.png",
        "Guardian Tree": "../images/old_tree.png",
      };
      plantImg.src = map[plantStage] || map.Seed;
    }

    // circular progress (if present)
    if (typeof updateCircularProgress === "function") {
      // map to percent in a reasonable way:
      let percent = 0;
      if (greenScore >= 170) percent = 100;
      else if (greenScore >= 100) percent = 100;
      else percent = Math.min(Math.round((greenScore / 20) * 100), 100);
      updateCircularProgress(percent);
    }
  }

  // --- Streak calculation (consecutive tail ending at latest claim) ---
  function recalcStreak() {
    if (!claimedDates.length) {
      streak = 0;
      return;
    }
    // sort normalized
    const arr = claimedDates.map((d) => normalizeDate(d)).sort((a, b) => a - b);
    // calculate consecutive tail length from the newest
    let tail = 1;
    for (let i = arr.length - 1; i > 0; i--) {
      const diffDays =
        (arr[i].getTime() - arr[i - 1].getTime()) / (24 * 3600 * 1000);
      if (diffDays === 1) tail++;
      else break;
    }
    streak = tail;
    // milestone
    if (isMilestone(streak)) onMilestoneReached(streak);
  }

  // --- Claim rules & actions ---
  function canClaimDate(date) {
    // allowed if first ever claim OR equal to next day after latest claimed date
    if (!claimedDates.length) return true;
    const latest = new Date(Math.max(...claimedDates.map((d) => d.getTime())));
    const nextAllowed = normalizeDate(
      new Date(latest.getFullYear(), latest.getMonth(), latest.getDate() + 1)
    );
    return dateEq(date, nextAllowed);
  }

  function claimDate(date) {
    // no double-claim
    if (claimedDates.some((d) => dateEq(d, date))) return false;
    if (!canClaimDate(date)) return false;

    claimedDates.push(normalizeDate(date));
    claimedDates.sort((a, b) => a - b);
    recalcStreak();
    updatePlantVisuals();
    saveState();
    return true;
  }

  // --- Calendar render ---
  function renderCalendar(forDate = new Date()) {
    if (!daysContainer) return;
    const year = forDate.getFullYear();
    const month = forDate.getMonth();
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
    if (monthTitle) monthTitle.textContent = `${monthNames[month]} ${year}`;

    daysContainer.innerHTML = "";
    // Monday-first grid: convert JS getDay() (0=Sun..6=Sat) to (0=Mon..6=Sun)
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // claimed days set for this month for quick lookup
    const claimedSet = new Set(
      claimedDates
        .filter((d) => d.getFullYear() === year && d.getMonth() === month)
        .map((d) => d.getDate())
    );

    const cells = [];

    // leading blanks (Mon-first)
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "day-cell empty";
      daysContainer.appendChild(blank);
      cells.push(blank);
    }

    // day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.day = String(day);

      const isToday = dateEq(cellDate, getToday());
      const isClaimed = claimedSet.has(day);

      // mark next allowed day with ring
      if (!claimedDates.length) {
        if (day === 1) cell.classList.add("next-allowed");
      }

      if (!claimedDates.length === false) {
        const latest =
          claimedDates.length > 0
            ? new Date(Math.max(...claimedDates.map((d) => d.getTime())))
            : null;
        if (latest) {
          const nextAllowed = new Date(
            latest.getFullYear(),
            latest.getMonth(),
            latest.getDate() + 1
          );
          if (
            nextAllowed.getFullYear() === year &&
            nextAllowed.getMonth() === month &&
            nextAllowed.getDate() === day
          ) {
            cell.classList.add("next-allowed");
          }
        }
      }

      if (isClaimed) {
        cell.classList.add("claimed");
        const img = document.createElement("img");
        img.className = "leaf-icon";
        img.alt = "leaf";
        img.src = "../images/leaf.png";
        cell.appendChild(img);
      } else {
        cell.textContent = day;
      }

      // click to attempt claim
      cell.addEventListener("click", () => {
        // only allow clicking actual day numbers (ignore blanks)
        if (cell.classList.contains("empty")) return;
        // check if already claimed
        if (isClaimed) return;
        const success = claimDate(cellDate);
        if (!success) {
          showAlert("⚠️ You can only claim the next day in sequence.");
        } else {
          // visual sprout effect when claimed: replace number with leaf and small animation
          renderCalendar(currentDate); // re-render ensures correct streak classes too
          showAlert("🌿 Day claimed!");
        }
      });

      daysContainer.appendChild(cell);
      cells.push(cell);
    }

    // apply streak pseudo classes (start/mid/end) within same week
    for (let i = 0; i < cells.length; i++) {
      const el = cells[i];
      if (!el || el.classList.contains("empty")) continue;
      el.classList.remove("streak-start", "streak-mid", "streak-end");
      if (!el.classList.contains("claimed")) continue;

      // compute dow for position in week (Mon-first grid)
      const dow = i % 7; // 0..6 (Mon..Sun)
      const prev = cells[i - 1];
      const next = cells[i + 1];
      const prevClaimed =
        prev &&
        !prev.classList.contains("empty") &&
        prev.classList.contains("claimed") &&
        dow !== 0;
      const nextClaimed =
        next &&
        !next.classList.contains("empty") &&
        next.classList.contains("claimed") &&
        dow !== 6;

      if (prevClaimed && nextClaimed) el.classList.add("streak-mid");
      else if (!prevClaimed && nextClaimed) el.classList.add("streak-start");
      else if (prevClaimed && !nextClaimed) el.classList.add("streak-end");
      // else single claimed: no streak pseudo
    }
  }

  // --- Enforce expiry (reset if missed > 1 day) ---
  function enforceStreakExpiry() {
    if (!claimedDates.length) return;
    const latest = new Date(Math.max(...claimedDates.map((d) => d.getTime())));
    const diffDays = Math.floor(
      (getToday().getTime() - normalizeDate(latest).getTime()) /
        (24 * 3600 * 1000)
    );
    if (diffDays > 1) {
      claimedDates = [];
      streak = 0;
      greenScore = 0;
      plantStage = "Seed";
      saveState();
      exportStreakJSON();
    }
  }

  // --- Init and events ---
  window.addEventListener("load", () => {
    // normalize claimedDates stored as strings
    claimedDates = claimedDates.map((d) => normalizeDate(new Date(d)));
    enforceStreakExpiry();
    recalcStreak();
    updatePlantVisuals();
    renderCalendar(currentDate);
  });

  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });

  if (rewardBtn)
    rewardBtn.addEventListener("click", () => {
      const today = getToday();
      // allow claim only if it's next allowed date
      if (claimDate(today)) {
        renderCalendar(currentDate);
        showAlert("🌿 Day claimed!");
      } else {
        showAlert("⚠️ You can only claim the next day in sequence.");
      }
    });

  // expose export function globally (optional)
  window.exportMyPlantStreak = exportStreakJSON;
})();
