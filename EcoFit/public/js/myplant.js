/* globals fetch */

// FINAL VERSION - Enhanced with 3-5 points, Sprout stage, and goal display

(() => {
  // =====================================================
  // 🔐 USER AUTHENTICATION & CONTEXT
  // =====================================================
  function getCurrentUser() {
    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) return null;

      const raw = localStorage.getItem("login_infor");
      if (!raw) return null;

      return JSON.parse(raw);
    } catch (error) {
      console.error("❌ Error parsing login_infor:", error);
      return null;
    }
  }

  let currentUser = getCurrentUser();
  let userId = currentUser?.profile_id || "guest";
  let userKey = `myplant_${userId}`;

  // =====================================================
  // 🎯 DOM ELEMENT REFERENCES
  // =====================================================
  const daysContainer = document.getElementById("days-container");
  const monthTitle = document.getElementById("month-title");
  const rewardBtn = document.getElementById("reward-btn");
  const greenScoreElem = document.getElementById("green-score");
  const periodElem = document.getElementById("period");
  const goalTextElem = document.getElementById("goal-text"); // 👈 NEW

  // =====================================================
  // 📊 STATE MANAGEMENT
  // =====================================================
  let currentDate = new Date();
  let claimedDates = [];
  let streak = 0;
  let greenScore = 0;
  let plantStage = "Seed";
  let progressPercent = 0;
  let dailyPoints = {};

  // =====================================================
  // 🛠️ HELPER FUNCTIONS
  // =====================================================
  function normalizeDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getToday() {
    return normalizeDate(new Date());
  }

  function dateEq(a, b) {
    return normalizeDate(a).getTime() === normalizeDate(b).getTime();
  }

  function dateToString(d) {
    return normalizeDate(d).toISOString().split("T")[0];
  }

  function isMilestone(n) {
    return Number.isFinite(n) && n >= 10 && n % 10 === 0 && n <= 1000;
  }

  // =====================================================
  // 💾 DATA PERSISTENCE - localStorage First Strategy
  // =====================================================
  async function loadUserData() {
    if (userId === "guest") {
      console.log("⚠️ Guest mode - no data");
      return false;
    }

    const localRaw = localStorage.getItem(userKey);
    if (localRaw) {
      try {
        const localData = JSON.parse(localRaw);
        claimedDates = localData.claimedDates.map((d) => new Date(d));
        greenScore = localData.greenScore || 0;
        plantStage = localData.plantStage || "Seed";
        dailyPoints = localData.dailyPoints || {};
        updateLoginInforScore(greenScore);
        return true;
      } catch (e) {
        console.error("Error parsing localStorage:", e);
      }
    }

    try {
      const attendanceResponse = await fetch(
        `../../dataset/attendance.json?v=${new Date().getTime()}`
      );

      if (!attendanceResponse.ok) {
        console.error("Failed to fetch attendance.json");
        return false;
      }

      const attendanceData = await attendanceResponse.json();
      const userAttendance = attendanceData[userId];

      if (!userAttendance) {
        console.log("No attendance data for user:", userId);
        return false;
      }

      claimedDates = (userAttendance.claimedDates || []).map(
        (s) => new Date(s)
      );
      greenScore = Number(userAttendance.greenScore || 0);
      plantStage = userAttendance.plantStage || "Seed";

      dailyPoints = {};
      (userAttendance.claimedDates || []).forEach((dateStr) => {
        dailyPoints[dateStr] = 1;
      });

      recalcStreak();
      updateLoginInforScore(greenScore);
      saveToLocalStorage();

      return true;
    } catch (error) {
      console.error("❌ Error loading data:", error);
      return false;
    }
  }

  function updateLoginInforScore(score) {
    try {
      const loginInfo = JSON.parse(localStorage.getItem("login_infor") || "{}");
      loginInfo.green_score = score;
      localStorage.setItem("login_infor", JSON.stringify(loginInfo));
    } catch (e) {
      console.error("Error updating login_infor:", e);
    }
  }

  function saveToLocalStorage() {
    if (userId === "guest") return;
    const data = {
      userId,
      updatedAt: new Date().toISOString(),
      claimedDates: claimedDates.map((d) => dateToString(d)),
      streak,
      greenScore,
      plantStage,
      progressPercent,
      dailyPoints,
    };

    localStorage.setItem(userKey, JSON.stringify(data));
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("greenScore", String(greenScore));
    localStorage.setItem("plantStage", plantStage);
    updateLoginInforScore(greenScore);
  }

  // =====================================================
  // 🎊 VISUAL EFFECTS & ANIMATIONS
  // =====================================================
  function launchConfetti(durationMs = 2500, count = 120) {
    if (!document.getElementById("confetti-styles")) {
      const style = document.createElement("style");
      style.id = "confetti-styles";
      style.textContent = `
        @keyframes confetti-fall { 
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece { position: fixed; top: -10px; width: 8px; height: 12px; z-index: 9999; opacity: 0.9; border-radius: 2px; }
      `;
      document.head.appendChild(style);
    }
    const colors = [
      "#69bd76",
      "#3da547",
      "#1c5b2b",
      "#ffd166",
      "#06d6a0",
      "#118ab2",
      "#ef476f",
    ];
    const container = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left = Math.random() * 100 + "vw";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animation = `confetti-fall ${
        1.5 + Math.random()
      }s linear ${Math.random()}s forwards`;
      container.appendChild(el);
      setTimeout(() => el.remove(), durationMs + 1000);
    }
    document.body.appendChild(container);
  }

  function showToast(msg, duration = 3000) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1c5b2b; color: white; padding: 12px 24px; border-radius: 8px;
      font-size: 14px; z-index: 9998; animation: slideUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    if (!document.getElementById("toast-anim")) {
      const style = document.createElement("style");
      style.id = "toast-anim";
      style.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // =====================================================
  // 🏆 MILESTONE & REWARDS SYSTEM
  // =====================================================
  function showStreakAlert(count) {
    const lastShown = Number(
      localStorage.getItem(`lastStreakMilestone_${userId}`) || 0
    );
    if (count <= lastShown) return;
    alert(`🔥 Congratulations! You achieved ${count}-day streak! 🔥`);
    launchConfetti();
    localStorage.setItem(`lastStreakMilestone_${userId}`, String(count));
  }

  function showLevelUpPopup(newStage) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;`;
    const popup = document.createElement("div");
    popup.style.cssText = `background: white; border-radius: 16px; padding: 48px 64px; text-align: center; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);`;
    popup.innerHTML = `
      <div style="width: 80px; height: 80px; background: #69bd76; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 12px; color: #1c5b2b;">Congratulations!</h2>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px;">You've reached <strong style="color: #3da547;">${newStage}</strong> level!</p>
      <button id="levelup-ok" style="background: #69bd76; color: white; border: none; padding: 12px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Continue</button>
    `;
    if (!document.getElementById("popup-animations")) {
      const style = document.createElement("style");
      style.id = "popup-animations";
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        #levelup-ok:hover { background: #3da547; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(105,189,118,0.4); }
      `;
      document.head.appendChild(style);
    }
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    popup.querySelector("#levelup-ok").addEventListener("click", () => {
      overlay.style.animation = "fadeIn 0.2s ease reverse";
      setTimeout(() => overlay.remove(), 200);
    });
    launchConfetti(3000, 150);
  }

  function checkScoreMilestone(score) {
    if (!isMilestone(score)) return;
    const lastShown = Number(
      localStorage.getItem(`lastScoreMilestone_${userId}`) || 0
    );
    if (score <= lastShown) return;
    alert(`🎉 Amazing! You've collected ${score} green points! 🎉`);
    launchConfetti();
    localStorage.setItem(`lastScoreMilestone_${userId}`, String(score));
  }

  // =====================================================
  // 🌱 PLANT VISUALS & PROGRESS (UPDATED FOR 5 STAGES)
  // =====================================================
  function updatePlantVisuals() {
    if (greenScoreElem) {
      greenScoreElem.textContent = String(greenScore);
    }

    checkScoreMilestone(greenScore);

    const prevStage = plantStage;
    let percent = 0;

    if (greenScore >= 400) {
      plantStage = "Guardian Tree";
      percent = 100;
    } else if (greenScore >= 200) {
      plantStage = "Tree";
      percent = ((greenScore - 200) / 200) * 100; // 200 → 400: 200 điểm
    } else if (greenScore >= 100) {
      plantStage = "Sapling";
      percent = ((greenScore - 100) / 100) * 100; // 100 → 200: 100 điểm
    } else if (greenScore >= 50) {
      plantStage = "Sprout";
      percent = ((greenScore - 50) / 50) * 100; // 50 → 100: 50 điểm
    } else if (greenScore >= 0) {
      plantStage = "Seed";
      percent = (greenScore / 50) * 100; // 0 → 50: 50 điểm
    } else {
      plantStage = "Seed";
      percent = 0;
    }

    if (periodElem) {
      periodElem.textContent = plantStage;
    }

    // Cập nhật ảnh cây
    const plantImg = document.getElementById("plant-img");
    if (plantImg) {
      const stages = {
        Seed: "../images/hat.png",
        Sprout: "../images/sprout.png", // 👈 YÊU CẦU: tạo file này
        Sapling: "../images/cay_con.png",
        Tree: "../images/cay_lon.png",
        "Guardian Tree": "../images/old_tree.png",
      };
      plantImg.src = stages[plantStage] || stages.Seed;
    }

    // Cập nhật vòng năng lượng
    progressPercent = Math.max(0, Math.min(100, Math.round(percent)));
    const ring = document.getElementById("progress-ring");
    const txt = document.getElementById("progress-percent");
    if (txt) {
      txt.textContent = String(progressPercent);
    }
    if (ring) {
      const radius = Number(ring.getAttribute("r") || 42);
      const circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${
        circumference * (1 - progressPercent / 100)
      }`;
    }

    // Hiển thị mục tiêu tiếp theo
    if (goalTextElem) {
      let nextGoal = "";
      if (greenScore < 50) {
        nextGoal = "Reach 50 to become Sprout";
      } else if (greenScore < 100) {
        nextGoal = "Reach 100 to become Sapling";
      } else if (greenScore < 150) {
        nextGoal = "Reach 150 to become Tree";
      } else if (greenScore < 200) {
        nextGoal = "Reach 200 to become Guardian Tree";
      } else {
        nextGoal = "You're at the top! Keep going 🌳";
      }
      goalTextElem.textContent = nextGoal;
    }

    // Hiển thị popup khi lên cấp
    if (prevStage !== plantStage && prevStage !== "Seed") {
      showLevelUpPopup(plantStage);
    }
  }

  // =====================================================
  // 📅 STREAK CALCULATION
  // =====================================================
  function recalcStreak() {
    if (!claimedDates.length) {
      streak = 0;
      return;
    }
    const arr = claimedDates.map((d) => normalizeDate(d)).sort((a, b) => a - b);
    let currentStreak = 1;
    for (let i = arr.length - 1; i > 0; i--) {
      const diffDays =
        (arr[i].getTime() - arr[i - 1].getTime()) / (24 * 3600 * 1000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    streak = currentStreak;
    if (isMilestone(streak)) showStreakAlert(streak);
  }

  // =====================================================
  // ✅ CLAIM & UNCLAIM FUNCTIONS (UPDATED REWARD)
  // =====================================================
  function canClaimDate(date) {
    const today = getToday();
    return dateEq(date, today) && !claimedDates.some((d) => dateEq(d, date));
  }

  function claimDate(date, isManualClaim = false) {
    if (!canClaimDate(date)) return false;

    // 💚 Nhận 3-5 điểm ngẫu nhiên
    const points = Math.floor(Math.random() * 3) + 3;
    const dateStr = dateToString(date);

    claimedDates.push(normalizeDate(date));
    claimedDates.sort((a, b) => a - b);

    dailyPoints[dateStr] = points;
    greenScore += points;

    recalcStreak();
    updatePlantVisuals();
    saveToLocalStorage();

    if (isManualClaim) {
      showToast(`🌿 +${points} Green Points! Total: ${greenScore}`);
    }
    return true;
  }

  function unclaimDate(date, isManualUnclaim = false) {
    const dateStr = dateToString(date);
    if (!claimedDates.some((d) => dateEq(d, date))) return false;

    const points = dailyPoints[dateStr] || 1;
    greenScore = Math.max(0, greenScore - points);
    delete dailyPoints[dateStr];

    claimedDates = claimedDates.filter((d) => !dateEq(d, date));
    recalcStreak();
    updatePlantVisuals();
    saveToLocalStorage();

    if (isManualUnclaim) {
      showToast(`🔄 Unclaimed! Total: ${greenScore}`);
    }
    return true;
  }

  // =====================================================
  // 📅 CALENDAR RENDERING
  // =====================================================
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

    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const claimedDatesThisMonth = claimedDates.filter(
      (d) => d.getFullYear() === year && d.getMonth() === month
    );
    const claimedSet = new Set(claimedDatesThisMonth.map((d) => d.getDate()));
    const today = getToday();

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "day-cell empty";
      daysContainer.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.day = String(day);

      const isClaimed = claimedSet.has(day);
      const isToday = dateEq(cellDate, today);
      const isPast = cellDate.getTime() < today.getTime();
      const isFuture = cellDate.getTime() > today.getTime();

      if (isToday && !isClaimed) cell.classList.add("next-allowed");
      if (!isToday) {
        cell.classList.add("disabled");
        cell.style.opacity = "0.3";
        cell.style.cursor = "not-allowed";
      }

      if (isClaimed) {
        cell.classList.add("claimed");
        const img = document.createElement("img");
        img.className = "leaf-icon";
        img.alt = "leaf";
        img.src = "../images/EcoFit_logo_black.png";
        cell.appendChild(img);
      } else {
        cell.textContent = day;
      }

      cell.addEventListener("click", () => {
        if (!dateEq(cellDate, today)) {
          showToast("⚠️ Only today can be claimed.");
          return;
        }
        if (isClaimed) {
          if (unclaimDate(cellDate, true)) renderCalendar(currentDate);
        } else {
          if (claimDate(cellDate, true)) renderCalendar(currentDate);
        }
      });

      daysContainer.appendChild(cell);
    }
  }

  // =====================================================
  // 🚀 INITIALIZATION
  // =====================================================
  window.addEventListener("load", async () => {
    if (userId === "guest") {
      alert("👋 Please login to use My Plant & Daily Green Streak!");
      return;
    }
    await loadUserData();
    recalcStreak();
    updatePlantVisuals();
    renderCalendar(currentDate);
  });

  document.getElementById("prev-month")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  rewardBtn?.addEventListener("click", () => {
    const today = getToday();
    if (claimedDates.some((d) => dateEq(d, today))) {
      showToast("ℹ️ Already claimed today.");
      return;
    }
    if (claimDate(today, true)) {
      renderCalendar(currentDate);
      showToast(
        `🔥 ${streak}-day streak! +${
          dailyPoints[dateToString(today)] || "?"
        } Points`
      );
      launchConfetti();
    }
  });

  window.MyPlantAPI = {
    getGreenScore: () => greenScore,
    getStreak: () => streak,
    getUserId: () => userId,
  };
})();
