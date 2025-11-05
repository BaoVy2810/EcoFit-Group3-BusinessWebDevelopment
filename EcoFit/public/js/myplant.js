// myplant.js - Fetch JSON (base) + Merge localStorage (local changes)
/* globals fetch */

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

  console.log("🔍 MyPlant User:", userId);

  // =====================================================
  // 🎯 DOM ELEMENT REFERENCES
  // =====================================================
  const daysContainer = document.getElementById("days-container");
  const monthTitle = document.getElementById("month-title");
  const rewardBtn = document.getElementById("reward-btn");
  const greenScoreElem = document.getElementById("green-score");
  const periodElem = document.getElementById("period");

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
  // 💾 DATA PERSISTENCE - MERGE Strategy
  // =====================================================

  async function loadUserData() {
    if (userId === "guest") {
      console.log("⚠️ Guest mode - no data");
      return false;
    }

    console.log(`📥 Loading data for profile_id: ${userId}`);

    let baseProfile = null;
    let localData = null;

    // Step 1: ALWAYS try to fetch the JSON (The "Server" Truth)
    try {
      const response = await fetch(
        `../../dataset/accounts.json?v=${new Date().getTime()}`
      );
      if (response.ok) {
        const accountsData = await response.json();
        baseProfile = accountsData.profile.find(
          (p) => p.profile_id === userId || p.profile_id === String(userId)
        );
        console.log("✅ Fetched base data from accounts.json");
      } else {
        console.warn(
          "⚠️ Failed to fetch accounts.json, will rely on localStorage"
        );
      }
    } catch (error) {
      console.warn(
        "❌ Error fetching accounts.json, will rely on localStorage:",
        error
      );
    }

    // Step 2: ALWAYS try to load from localStorage (The "Local" Changes)
    const localRaw = localStorage.getItem(userKey);
    if (localRaw) {
      try {
        localData = JSON.parse(localRaw);
        console.log("✅ Loaded local data from localStorage");
      } catch (e) {
        console.warn("⚠️ localStorage data corrupted");
      }
    }

    // Step 3: Merge Logic - Trộn dữ liệu
    if (!baseProfile && !localData) {
      console.error("❌ No data source found. Cannot load user.");
      return false;
    }

    if (baseProfile) {
      // JSON là nguồn chính cho điểm GỐC
      const baseGreenScore = Number(baseProfile.green_score || 0);

      const baseAttendance = baseProfile.attendance || {};
      const basePoints = baseAttendance.dailyPoints || {};
      const baseDates = new Set(Object.keys(basePoints));

      const localPoints =
        localData && localData.dailyPoints ? localData.dailyPoints : {};

      let newPoints = 0;
      let mergedDailyPoints = { ...basePoints };
      let allClaimedDates = new Set(Object.keys(basePoints));

      // Duyệt qua các điểm local
      for (const dateStr in localPoints) {
        if (!baseDates.has(dateStr)) {
          // Đây là ngày đã claim (local) mà JSON không có
          const points = localPoints[dateStr];
          newPoints += points;
          mergedDailyPoints[dateStr] = points;
          allClaimedDates.add(dateStr);
          console.log(` 	- Merging local-only claim: ${dateStr} (+${points})`);
        }
        // *Ghi chú: Nếu một ngày bị 'unclaim', nó sẽ bị xóa khỏi localPoints,
        // và sẽ không được tính vào `newPoints` ở lần F5 tiếp theo. Điều này là đúng!
      }

      greenScore = baseGreenScore + newPoints;
      claimedDates = Array.from(allClaimedDates).map((s) => new Date(s));
      dailyPoints = mergedDailyPoints;
      plantStage =
        localData && localData.plantStage
          ? localData.plantStage
          : baseAttendance.plantStage || "Seed";

      console.log(`✅ Merged data:`);
      console.log(` 	- Base Score (JSON): ${baseGreenScore}`);
      console.log(` 	- New Local Points: ${newPoints}`);
      console.log(` 	- Final Green Score: ${greenScore}`);

      // BỔ SUNG: Lưu greenScore đã gộp vào localData để lần reload sau dùng lại
      if (localData) localData.greenScore = greenScore;
    } else if (localData) {
      // Fetch JSON lỗi, nhưng có local data -> dùng tạm
      console.log("⚠️ Using localStorage as fallback");
      claimedDates = (localData.claimedDates || []).map((s) => new Date(s));
      streak = Number(localData.streak || 0);
      greenScore = Number(localData.greenScore || 0);
      plantStage = localData.plantStage || "Seed";
      dailyPoints = localData.dailyPoints || {};
    }

    // Step 4: Tính toán lại streak VÀ LƯU dữ liệu đã gộp
    recalcStreak();
    saveToLocalStorage();
    return true;
  }

  function saveToLocalStorage() {
    if (userId === "guest") return;

    const data = {
      userId,
      updatedAt: new Date().toISOString(),
      claimedDates: claimedDates.map((d) => dateToString(d)),
      streak,
      greenScore, // Lưu điểm đã gộp (tăng hoặc giảm)
      plantStage,
      progressPercent,
      dailyPoints, // Lưu các điểm đã gộp
    };

    localStorage.setItem(userKey, JSON.stringify(data));

    // Also update individual items for compatibility
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("greenScore", String(greenScore));
    localStorage.setItem("plantStage", plantStage);

    // Update green_score in login_infor
    try {
      const loginInfo = JSON.parse(localStorage.getItem("login_infor") || "{}");
      loginInfo.green_score = greenScore;
      localStorage.setItem("login_infor", JSON.stringify(loginInfo));
    } catch (e) {
      console.warn("Could not update login_infor:", e);
    }

    console.log(`💾 Saved merged data to localStorage (${userKey})`);
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
  // 🎁 CLAIM REWARD CALCULATION
  // =====================================================

  function calculateRewardPoints(date) {
    let points = 1;
    if (streak > 0) {
      if (streak >= 30) points += 3;
      else if (streak >= 14) points += 2;
      else if (streak >= 7) points += 1;
    }
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) points += 1;
    const dayOfMonth = date.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) points += 2;
    return points;
  }

  // =====================================================
  // 🌱 PLANT VISUALS & PROGRESS
  // =====================================================

  function updatePlantVisuals() {
    console.log("🌱 Updating Plant Visuals:");
    console.log(` 	- Current Green Score: ${greenScore}`);

    if (greenScoreElem) {
      greenScoreElem.textContent = String(greenScore);
    }

    checkScoreMilestone(greenScore);

    const prevStage = plantStage;
    let percent = 0;

    // Plant stages based on green_score
    if (greenScore >= 200) {
      plantStage = "Guardian Tree";
      percent = 100;
    } else if (greenScore >= 100) {
      plantStage = "Tree";
      percent = ((greenScore - 100) / 100) * 100;
    } else if (greenScore >= 50) {
      plantStage = "Sapling";
      percent = ((greenScore - 50) / 50) * 100;
    } else if (greenScore >= 20) {
      plantStage = "Seed";
      percent = ((greenScore - 20) / 30) * 100;
    } else {
      plantStage = "Seed";
      percent = (greenScore / 20) * 100;
    }

    console.log(` 	- Plant Stage: ${plantStage}`);

    if (periodElem) {
      periodElem.textContent = plantStage;
    }

    const plantImg = document.getElementById("plant-img");
    if (plantImg) {
      const stages = {
        Seed: "../images/hat.png",
        Sapling: "../images/cay_con.png",
        Tree: "../images/cay_lon.png",
        "Guardian Tree": "../images/old_tree.png",
      };
      plantImg.src = stages[plantStage] || stages.Seed;
    }

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
  // ✅ CLAIM & UNCLAIM FUNCTIONS (ĐÃ CẬP NHẬT)
  // =====================================================

  function canClaimDate(date) {
    const today = getToday();
    if (date.getTime() > today.getTime()) return false;
    if (claimedDates.some((d) => dateEq(d, date))) return false;
    return true;
  }

  function claimDate(date, isManualClaim = false) {
    if (!canClaimDate(date)) return false;

    const dateStr = dateToString(date);
    const points = calculateRewardPoints(date);

    console.log("🎯 Claiming date:", dateStr, "→ +" + points + " points");

    claimedDates.push(normalizeDate(date));
    claimedDates.sort((a, b) => a - b);

    dailyPoints[dateStr] = points;
    greenScore += points; // Add points to green score

    recalcStreak();
    updatePlantVisuals();
    saveToLocalStorage();

    if (isManualClaim) {
      if (points > 1) {
        showToast(`🎉 +${points} Green Points! (Bonus applied)`);
      } else {
        showToast(`🌿 +${points} Green Point!`);
      }
    }
    return true;
  }

  /**
   * 🌟 HÀM MỚI: Bỏ điểm danh một ngày
   */
  function unclaimDate(date, isManualUnclaim = false) {
    const dateStr = dateToString(date);

    // Kiểm tra 1: Ngày này có được claim không?
    if (!claimedDates.some((d) => dateEq(d, date))) {
      console.warn(`Attempted to unclaim a non-claimed date: ${dateStr}`);
      return false;
    }

    // Kiểm tra 2: Ngày này có điểm trong dailyPoints không?
    const points = dailyPoints[dateStr];
    if (points === undefined || points === null) {
      console.error(
        `Data inconsistency: ${dateStr} is claimed but has no points in dailyPoints.`
      );
      return false; // Không cho unclaim nếu không có điểm
    }

    console.log(`⏪ Unclaiming date:`, dateStr, `→ -${points} points`);

    // 1. Trừ điểm
    greenScore -= Number(points);
    if (greenScore < 0) greenScore = 0; // Không bao giờ cho điểm âm

    // 2. Xóa điểm khỏi dailyPoints
    delete dailyPoints[dateStr];

    // 3. Xóa ngày khỏi claimedDates
    claimedDates = claimedDates.filter((d) => !dateEq(d, date));

    // 4. Cập nhật mọi thứ
    recalcStreak();
    updatePlantVisuals();
    saveToLocalStorage(); // Lưu điểm số mới (đã giảm)

    if (isManualUnclaim) {
      showToast(`🔄 Unclaimed! -${points} Green Points.`);
    }

    return true;
  }

  // =====================================================
  // 📅 CALENDAR RENDERING (ĐÃ CẬP NHẬT)
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
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "day-cell empty";
      daysContainer.appendChild(blank);
      cells.push(blank);
    }

    const today = getToday();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.day = String(day);

      const isClaimed = claimedSet.has(day);
      const isToday = dateEq(cellDate, today);
      const isFuture = cellDate.getTime() > today.getTime();

      if (isToday && !isClaimed) cell.classList.add("next-allowed");

      if (isFuture) {
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

      /**
       * 🌟 LOGIC CLICK ĐÃ CẬP NHẬT
       * Bây giờ có thể xử lý cả claim và unclaim
       */
      cell.addEventListener("click", () => {
        if (isFuture) return; // Không click ngày tương lai

        if (isClaimed) {
          // --- LOGIC UNCLAIM MỚI ---
          if (unclaimDate(cellDate, true)) {
            renderCalendar(currentDate); // Vẽ lại lịch để hiện số
          } else {
            showToast("⚠️ Lỗi khi bỏ điểm danh.");
          }
        } else {
          // --- LOGIC CLAIM CŨ ---
          if (claimDate(cellDate, true)) {
            renderCalendar(currentDate); // Vẽ lại lịch để hiện lá
          } else {
            showToast("⚠️ Không thể điểm danh ngày này.");
          }
        }
      });

      daysContainer.appendChild(cell);
      cells.push(cell);
    }

    // Visual streak effects
    for (let i = 0; i < cells.length; i++) {
      const el = cells[i];
      if (
        !el ||
        el.classList.contains("empty") ||
        !el.classList.contains("claimed")
      )
        continue;
      el.classList.remove("streak-start", "streak-mid", "streak-end");
      const dow = i % 7;
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
    }
  }

  // =====================================================
  // 🚀 INITIALIZATION
  // =====================================================

  window.addEventListener("load", async () => {
    console.log("🚀 Initializing MyPlant...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (userId === "guest") {
      console.log("⚠️ Guest mode - please login");
      alert("👋 Please login to use My Plant & Daily Green Streak!");
      return;
    }

    await loadUserData();

    recalcStreak();
    updatePlantVisuals();
    renderCalendar(currentDate);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ MyPlant ready!");
    console.log(`   User: ${userId}`);
    console.log(`   Green Score: ${greenScore}`);
    console.log(`   Streak: ${streak} days`);
    console.log(`   Plant Stage: ${plantStage}`);
  });

  // Month navigation
  document.getElementById("prev-month")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  // Claim Reward button
  rewardBtn?.addEventListener("click", () => {
    const today = getToday();

    if (claimedDates.some((d) => dateEq(d, today))) {
      showToast("ℹ️ Already claimed today.");
      return;
    }

    if (claimDate(today, true)) {
      renderCalendar(currentDate);
      const points = dailyPoints[dateToString(today)] || 1;
      showToast(`🔥 ${streak} day streak! +${points} Points`);
      launchConfetti();
    }
  });

  // Export API
  window.MyPlantAPI = {
    getGreenScore: () => greenScore,
    getStreak: () => streak,
    getUserId: () => userId,
  };
})();
