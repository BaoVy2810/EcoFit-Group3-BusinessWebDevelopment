// myplant.js - flexible attendance with real-time sync
/* globals fetch, localStorage */

(() => {
  // =====================================================
  // 🔐 USER AUTHENTICATION & CONTEXT
  // =====================================================
  function getCurrentUser() {
    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        console.log("⚠️ User not logged in (isLoggedIn = false)");
        return null;
      }

      const raw = localStorage.getItem("login_infor");
      if (!raw) {
        console.log("⚠️ No login_infor found in localStorage");
        return null;
      }

      const user = JSON.parse(raw);
      console.log("✅ Found login_infor:", user);
      return user;
    } catch (error) {
      console.error("❌ Error parsing login_infor:", error);
      return null;
    }
  }

  // Use let instead of const so we can re-initialize
  let currentUser = null;
  let userId = "guest";
  let userKey = "myplant_user_guest";

  function initializeUser() {
    currentUser = getCurrentUser();
    // Đảm bảo lấy profile_id và convert sang string
    userId =
      currentUser &&
      (currentUser.id || currentUser.profile_id || currentUser.email)
        ? String(currentUser.id || currentUser.profile_id || currentUser.email)
        : "guest";
    userKey = `myplant_user_${userId}`;

    // Debug log
    console.log("🔍 MyPlant Debug Info:");
    console.log("  - isLoggedIn:", localStorage.getItem("isLoggedIn"));
    console.log("  - login_infor raw:", localStorage.getItem("login_infor"));
    console.log("  - Current User:", currentUser);
    console.log("  - User ID:", userId);
    console.log("  - User Key:", userKey);

    // Alert if guest mode for debugging
    if (userId === "guest") {
      console.warn("⚠️ RUNNING IN GUEST MODE - No account data will be loaded");
    }

    return userId;
  }

  // Initialize user on script load
  initializeUser();

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
  let dailyPoints = {}; // Store points earned per day

  const LAST_STREAK_MILESTONE = `lastStreakMilestone_${userId}`;
  const LAST_SCORE_MILESTONE = `lastScoreMilestone_${userId}`;

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
  // 💾 DATA PERSISTENCE (localStorage + JSON sync)
  // =====================================================

  // Load initial state from attendance.json first, then fallback to localStorage
  async function loadStateFromAttendance() {
    console.log(`🔄 Loading attendance data for userId: ${userId}`);

    try {
      // First try to load from attendance.json
      const response = await fetch("../../dataset/attendance.json");
      if (response.ok) {
        const attendanceData = await response.json();

        console.log("📦 Attendance data loaded");
        console.log(`🔍 Looking for user ${userId}...`);
        console.log(
          "   Available users:",
          Object.keys(attendanceData.users || {})
        );

        // Check if user data exists in attendance.json
        if (attendanceData.users && attendanceData.users[userId]) {
          const userData = attendanceData.users[userId];
          claimedDates = userData.claimedDates.map((s) => new Date(s));
          streak = Number(userData.streak || 0);
          greenScore = Number(userData.greenScore || 0);
          plantStage = userData.plantStage || "Seed";
          dailyPoints = userData.dailyPoints || {};

          console.log(`✅ Loaded attendance data for user ${userId}:`);
          console.log(`   - Streak: ${streak} days`);
          console.log(`   - Green Score: ${greenScore} points`);
          console.log(`   - Plant Stage: ${plantStage}`);
          console.log(`   - Claimed Dates: ${claimedDates.length} days`);
          return true;
        } else {
          console.warn(`⚠️ User ${userId} not found in attendance.json`);
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not load from attendance.json:", error.message);
    }

    // Fallback to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(userKey) || "null");
      if (saved && Array.isArray(saved.claimedDates)) {
        claimedDates = saved.claimedDates.map((s) => new Date(s));
        streak = Number(saved.streak || 0);
        greenScore = Number(saved.greenScore || 0);
        plantStage = saved.plantStage || "Seed";
        dailyPoints = saved.dailyPoints || {};
        console.log(
          `✅ Loaded attendance data for user ${userId} from localStorage`
        );
        return true;
      }
    } catch (_) {}

    console.log(
      `ℹ️ No existing attendance data found for user ${userId}, starting fresh`
    );
    return false;
  }

  // Legacy function for backwards compatibility
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(userKey) || "null");
      if (saved && Array.isArray(saved.claimedDates)) {
        claimedDates = saved.claimedDates.map((s) => new Date(s));
        streak = Number(saved.streak || 0);
        greenScore = Number(saved.greenScore || 0);
        plantStage = saved.plantStage || "Seed";
        dailyPoints = saved.dailyPoints || {};
      }
    } catch (_) {}
  }

  // Save state to localStorage and sync to JSON file
  async function saveState() {
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

    // Save to localStorage
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("greenScore", String(greenScore));
    localStorage.setItem("plantStage", plantStage);
    localStorage.setItem(
      userKey,
      JSON.stringify({
        claimedDates: claimedDates.map((d) => d.toISOString()),
        streak,
        greenScore,
        plantStage,
        progressPercent,
        dailyPoints,
      })
    );

    // Export for other modules
    localStorage.setItem("myplant_calendar_export", JSON.stringify(data));

    // Sync to JSON file (real-time save)
    await syncToAttendanceFile(data);
  }

  // Sync data to attendance.json file
  async function syncToAttendanceFile(data) {
    try {
      // First, load existing data from attendance.json
      const response = await fetch("../../dataset/attendance.json");
      let attendanceData = {};

      if (response.ok) {
        attendanceData = await response.json();
      }

      // Update or create user's attendance record
      if (!attendanceData.users) {
        attendanceData.users = {};
      }

      attendanceData.users[userId] = {
        userId,
        updatedAt: data.updatedAt,
        claimedDates: data.claimedDates,
        streak: data.streak,
        greenScore: data.greenScore,
        plantStage: data.plantStage,
        dailyPoints: data.dailyPoints,
      };

      attendanceData.lastUpdated = data.updatedAt;

      // Save to localStorage as simulation
      localStorage.setItem("attendance_data", JSON.stringify(attendanceData));

      console.log("✅ Attendance data synced to localStorage");

      // Also sync green_score back to accounts.json
      await syncToAccountsJson(data.greenScore);
    } catch (error) {
      console.warn(
        "⚠️ Could not sync to file (expected in browser):",
        error.message
      );
    }
  }

  // Sync green_score back to accounts.json
  async function syncToAccountsJson(newGreenScore) {
    if (userId === "guest") return; // Don't sync for guest

    try {
      const response = await fetch("../../dataset/accounts.json");
      if (!response.ok) return;

      const accountsData = await response.json();
      const profiles = accountsData.profile || [];

      // Find and update the user's profile
      const userProfile = profiles.find(
        (p) => String(p.profile_id) === String(userId)
      );
      if (userProfile) {
        userProfile.green_score = newGreenScore;

        // Save to localStorage as simulation
        localStorage.setItem("accounts_data", JSON.stringify(accountsData));

        // Update login_infor as well
        if (currentUser) {
          currentUser.green_score = newGreenScore;
          localStorage.setItem("login_infor", JSON.stringify(currentUser));
        }

        console.log(
          `✅ Green score ${newGreenScore} synced to accounts.json for user ${userId}`
        );
      }
    } catch (error) {
      console.warn("⚠️ Could not sync to accounts.json:", error.message);
    }
  }

  // Load user's green score from external sources (extensible for future)
  async function loadUserGreenScore() {
    // TODO: In the future, fetch user's actual green score from orders/cart
    // For now, use the claimed dates count
    return claimedDates.length;
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
    const lastShown = Number(localStorage.getItem(LAST_STREAK_MILESTONE) || 0);
    if (count <= lastShown) return;

    alert(`🔥 Congratulations! You achieved ${count}-day streak! 🔥`);
    launchConfetti();
    localStorage.setItem(LAST_STREAK_MILESTONE, String(count));
    saveState();
  }

  function showLevelUpPopup(newStage) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const popup = document.createElement("div");
    popup.style.cssText = `
      background: white; border-radius: 16px; padding: 48px 64px;
      text-align: center; max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    popup.innerHTML = `
      <div style="width: 80px; height: 80px; background: #69bd76; border-radius: 50%; 
                  margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 12px; color: #1c5b2b;">
        Congratulations!
      </h2>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px;">
        You've reached <strong style="color: #3da547;">${newStage}</strong> level!
      </p>
      <button id="levelup-ok" style="
        background: #69bd76; color: white; border: none; padding: 12px 48px;
        border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;
        transition: all 0.2s;">
        Continue
      </button>
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

    const btn = popup.querySelector("#levelup-ok");
    btn.addEventListener("click", () => {
      overlay.style.animation = "fadeIn 0.2s ease reverse";
      setTimeout(() => overlay.remove(), 200);
    });

    launchConfetti(3000, 150);
    saveState();
  }

  function checkScoreMilestone(score) {
    if (!isMilestone(score)) return;
    const lastShown = Number(localStorage.getItem(LAST_SCORE_MILESTONE) || 0);
    if (score <= lastShown) return;

    alert(`🎉 Amazing! You've collected ${score} green points! 🎉`);
    launchConfetti();
    localStorage.setItem(LAST_SCORE_MILESTONE, String(score));
    saveState();
  }

  // =====================================================
  // 🎁 CLAIM REWARD CALCULATION
  // =====================================================

  /**
   * Calculate reward points based on various factors
   * This allows for dynamic point values per claim
   */
  function calculateRewardPoints(date) {
    let points = 1; // Base point

    // Bonus for consecutive days (streak)
    if (streak > 0) {
      if (streak >= 30) points += 3; // 30+ day streak: +3 bonus
      else if (streak >= 14) points += 2; // 14+ day streak: +2 bonus
      else if (streak >= 7) points += 1; // 7+ day streak: +1 bonus
    }

    // Weekend bonus
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      points += 1; // Weekend bonus
    }

    // Monthly milestone bonus (1st, 15th of month)
    const dayOfMonth = date.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      points += 2; // Special day bonus
    }

    // Future extensibility: Add user's shopping green score
    // const userGreenScore = await loadUserGreenScore();
    // if (userGreenScore > 100) points += 1;

    return points;
  }

  // =====================================================
  // 🌱 PLANT VISUALS & PROGRESS
  // =====================================================

  function updatePlantVisuals() {
    // ONLY recalculate if greenScore is 0 or dailyPoints changed
    // Otherwise keep the loaded greenScore from attendance.json
    const calculatedScore = Object.values(dailyPoints).reduce(
      (sum, pts) => sum + pts,
      0
    );

    // If we have a loaded greenScore (from attendance.json), use it
    // Only recalculate if it's 0 or doesn't match
    if (greenScore === 0 || calculatedScore !== greenScore) {
      greenScore = calculatedScore;
      console.log("🔄 Recalculated green score:", greenScore);
    }

    console.log("🌱 Updating Plant Visuals:");
    console.log("  - Green Score:", greenScore);
    console.log("  - Daily Points:", dailyPoints);

    if (greenScoreElem) {
      greenScoreElem.textContent = String(greenScore);
      console.log("  - Updated Green Score Element:", greenScore);
    }
    checkScoreMilestone(greenScore);

    const prevStage = plantStage;
    let percent = 0;

    // Plant growth stages based on green score
    if (greenScore > 170) {
      plantStage = "Guardian Tree";
      percent = 100;
    } else if (greenScore >= 100) {
      plantStage = "Tree";
      percent = ((greenScore - 100) / 70) * 100;
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

    console.log("  - Plant Stage:", plantStage);

    if (periodElem) {
      periodElem.textContent = plantStage;
      console.log("  - Updated Period Element:", plantStage);
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
      console.log("  - Updated Plant Image:", plantImg.src);
    }

    // Update progress ring
    progressPercent = Math.max(0, Math.min(100, Math.round(percent)));
    const ring = document.getElementById("progress-ring");
    const txt = document.getElementById("progress-percent");
    if (txt) {
      txt.textContent = String(progressPercent);
      console.log("  - Progress Percent:", progressPercent);
    }
    if (ring) {
      const radius = Number(ring.getAttribute("r") || 42);
      const circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${
        circumference * (1 - progressPercent / 100)
      }`;
    }

    // Level up celebration
    if (prevStage !== plantStage && prevStage !== "Seed") {
      showLevelUpPopup(plantStage);
    }
  }

  // =====================================================
  // 📅 STREAK CALCULATION (Flexible - allows gaps)
  // =====================================================

  /**
   * Calculate the longest continuous streak ending at the most recent date
   * This now allows for gaps - streak resets only if explicitly broken
   */
  function recalcStreak() {
    if (!claimedDates.length) {
      streak = 0;
      return;
    }

    const arr = claimedDates.map((d) => normalizeDate(d)).sort((a, b) => a - b);

    // Find longest consecutive sequence ending at last date
    let currentStreak = 1;
    for (let i = arr.length - 1; i > 0; i--) {
      const diffDays =
        (arr[i].getTime() - arr[i - 1].getTime()) / (24 * 3600 * 1000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break; // Stop counting when gap is found
      }
    }

    streak = currentStreak;

    if (isMilestone(streak)) showStreakAlert(streak);
  }

  // =====================================================
  // ✅ CLAIM DATE FUNCTIONS (Flexible - no sequence required)
  // =====================================================

  /**
   * NEW LOGIC: Allow claiming any date, not just sequential
   * Users can skip days without breaking their ability to claim
   */
  function canClaimDate(date) {
    // Cannot claim future dates
    const today = getToday();
    if (date.getTime() > today.getTime()) {
      return false;
    }

    // Cannot claim already claimed dates
    if (claimedDates.some((d) => dateEq(d, date))) {
      return false;
    }

    // Can claim any past or present date
    return true;
  }

  function claimDate(date, isManualClaim = false) {
    if (!canClaimDate(date)) return false;

    const dateStr = dateToString(date);
    const points = calculateRewardPoints(date);

    console.log("🎯 Claiming date:", dateStr);
    console.log("  - Points earned:", points);

    // Add to claimed dates
    claimedDates.push(normalizeDate(date));
    claimedDates.sort((a, b) => a - b);

    // Store points for this specific date
    dailyPoints[dateStr] = points;

    console.log("  - Total claimed dates:", claimedDates.length);
    console.log("  - Daily points:", dailyPoints);

    // Recalculate streak and update visuals
    recalcStreak();
    console.log("  - New streak:", streak);

    updatePlantVisuals();
    console.log("  - New green score:", greenScore);
    console.log("  - New plant stage:", plantStage);

    // Save state immediately
    saveState();

    // Show appropriate feedback
    if (isManualClaim) {
      if (points > 1) {
        showToast(`🎉 +${points} Green Points earned! (Bonus applied)`);
      } else {
        showToast(`🌿 +${points} Green Point earned!`);
      }
    }

    return true;
  }

  // =====================================================
  // 👤 USER DISPLAY FUNCTIONS
  // =====================================================

  /**
   * Display user information and handle non-logged-in state
   */
  function displayUserInfo() {
    // Re-check user in case it changed
    initializeUser();

    const isGuest = userId === "guest";
    const userFullname = currentUser
      ? currentUser.fullname || currentUser.email
      : "Guest";

    console.log("📊 Display User Info:");
    console.log("  - Is Guest:", isGuest);
    console.log("  - User ID:", userId);
    console.log("  - Fullname:", userFullname);
    console.log("  - Streak:", streak);
    console.log("  - Green Score:", greenScore);

    if (isGuest) {
      // Show guest alert
      console.log("⚠️ User is not logged in. Showing guest mode.");
      alert(
        "👋 Welcome, Guest!\n\nYour progress is being saved locally. Please login to sync across devices and unlock all features!"
      );
    } else {
      // User is logged in
      console.log(`✅ Welcome back, ${userFullname}! (User ID: ${userId})`);
      console.log(
        `Current Streak: ${streak} days | Green Score: ${greenScore} points`
      );
    }
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

    console.log(`📅 Rendering Calendar for ${monthNames[month]} ${year}:`);
    console.log(`  - Total Claimed Dates: ${claimedDates.length}`);
    console.log(
      `  - Claimed Dates This Month: ${claimedDatesThisMonth.length}`,
      claimedDatesThisMonth
    );

    const claimedSet = new Set(claimedDatesThisMonth.map((d) => d.getDate()));

    const cells = [];

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "day-cell empty";
      daysContainer.appendChild(blank);
      cells.push(blank);
    }

    const today = getToday();

    // Render days
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.day = String(day);

      const isClaimed = claimedSet.has(day);
      const isToday = dateEq(cellDate, today);
      const isFuture = cellDate.getTime() > today.getTime();

      // Highlight today
      if (isToday && !isClaimed) {
        cell.classList.add("next-allowed");
      }

      // Disable future dates
      if (isFuture) {
        cell.classList.add("disabled");
        cell.style.opacity = "0.3";
        cell.style.cursor = "not-allowed";
      }

      if (isClaimed) {
        cell.classList.add("claimed");
        const dateStr = dateToString(cellDate);
        const points = dailyPoints[dateStr] || 1;

        // Show leaf icon only
        const img = document.createElement("img");
        img.className = "leaf-icon";
        img.alt = "leaf";
        img.src = "../images/EcoFit_logo_black.png";
        cell.appendChild(img);
      } else {
        cell.textContent = day;
      }

      // Click handler
      cell.addEventListener("click", () => {
        if (isFuture || isClaimed) return;

        if (claimDate(cellDate, true)) {
          renderCalendar(currentDate);
        } else {
          showToast("⚠️ Cannot claim this date.");
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
    console.log("🚀 Initializing MyPlant system...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Re-initialize user in case login happened
    const detectedUserId = initializeUser();
    console.log(`👤 Detected User ID: ${detectedUserId}`);

    // Load user's attendance data from attendance.json first
    console.log("📥 Loading attendance data...");
    const loadedFromAttendance = await loadStateFromAttendance();

    if (!loadedFromAttendance) {
      console.log(
        "⚠️ No data loaded from attendance.json, user may be new or guest"
      );
    }

    // Normalize and process dates
    console.log("🔄 Processing dates...");
    claimedDates = claimedDates.map((d) => normalizeDate(new Date(d)));

    // Calculate streak
    console.log("📈 Calculating streak...");
    recalcStreak();

    // Update plant visuals
    console.log("🌱 Updating plant visuals...");
    updatePlantVisuals();

    // Render calendar
    console.log("📅 Rendering calendar...");
    renderCalendar(currentDate);

    // Display user info if logged in
    console.log("👋 Displaying user info...");
    displayUserInfo();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ MyPlant initialization complete!");
    console.log(`   User: ${detectedUserId}`);
    console.log(`   Streak: ${streak} days`);
    console.log(`   Green Score: ${greenScore} points`);
    console.log(`   Plant Stage: ${plantStage}`);
    console.log(`   Claimed Dates: ${claimedDates.length}`);
  });

  // Month navigation
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });
  }

  // Claim Reward button
  if (rewardBtn) {
    rewardBtn.addEventListener("click", () => {
      const today = getToday();

      if (claimedDates.some((d) => dateEq(d, today))) {
        showToast("ℹ️ Already claimed today.");
        return;
      }

      if (claimDate(today, true)) {
        renderCalendar(currentDate);
        const points = dailyPoints[dateToString(today)] || 1;
        showToast(`🔥 ${streak} day streak! +${points} Green Points`);
        launchConfetti();
      } else {
        showToast("⚠️ Cannot claim reward for today.");
      }
    });
  }

  // Export function for external use
  window.exportMyPlantStreak = saveState;
  window.MyPlantAPI = {
    getGreenScore: () => greenScore,
    getStreak: () => streak,
    getClaimedDates: () => [...claimedDates],
    getUserId: () => userId,
  };
})();
