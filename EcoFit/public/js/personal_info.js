const ACCOUNTS_JSON_PATH = "../../dataset/accounts.json";
let currentUserData = null;

const btnSelectImage = document.querySelector(".btn-select-image");
const imageUpload = document.getElementById("imageUpload");
const profileImage = document.getElementById("profileImage");
const profileForm = document.querySelector(".profile-form");

if (btnSelectImage) {
  btnSelectImage.addEventListener("click", () => {
    imageUpload.click();
  });
}

if (imageUpload) {
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (file) {
      if (file.size > 1048576) {
        alert("File size must be less than 1 MB!");
        return;
      }

      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Only .JPEG and .PNG files are allowed!");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        profileImage.src = event.target.result;
        localStorage.setItem(
          "userAvatar_" + currentUserData.profile_id,
          event.target.result
        );
      };
      reader.readAsDataURL(file);
    }
  });
}

async function loadUserProfile() {
  console.log("Loading user profile...");
  console.log("Checking all localStorage keys:", Object.keys(localStorage));

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn !== "true") {
    console.log("User not logged in");
    alert("Please login to view your personal information");
    window.location.href = "00_LOGIN.html";
    return;
  }

  let userId = null;
  let userEmail = null;

  userId = localStorage.getItem("userId");
  console.log("Method 1 - userId:", userId);

  userEmail = localStorage.getItem("userEmail");
  console.log("Method 2 - userEmail:", userEmail);

  const loginInfoStr = localStorage.getItem("login_infor");
  console.log("Method 3 - login_infor raw:", loginInfoStr);

  if (loginInfoStr) {
    try {
      const loginInfo = JSON.parse(loginInfoStr);
      console.log("Method 3 - login_infor parsed:", loginInfo);

      userId =
        userId || loginInfo.userId || loginInfo.profile_id || loginInfo.id;
      userEmail = userEmail || loginInfo.email;

      console.log(
        "After parsing login_infor - userId:",
        userId,
        "email:",
        userEmail
      );
    } catch (e) {
      console.log("Error parsing login_infor:", e);
    }
  }

  if (!userId && !userEmail) {
    console.log("No user identifier found in localStorage");
    alert("Session expired. Please login again.");
    window.location.href = "00_LOGIN.html";
    return;
  }

  console.log("Will search for - userId:", userId, "email:", userEmail);

  try {
    const response = await fetch(ACCOUNTS_JSON_PATH);

    if (!response.ok) {
      throw new Error(`Failed to load accounts: ${response.status}`);
    }

    const data = await response.json();
    console.log("Total profiles in JSON:", data.profile.length);

    let userProfile = null;

    if (userId) {
      userProfile = data.profile.find(
        (p) => p.profile_id === userId || p.profile_id === userId.toString()
      );
      console.log("Search by profile_id:", userId, "- Found:", !!userProfile);
    }

    if (!userProfile && userEmail) {
      userProfile = data.profile.find((p) => p.email === userEmail);
      console.log("Search by email:", userEmail, "- Found:", !!userProfile);
    }

    if (!userProfile) {
      console.log("User profile not found");
      console.log(
        "Available profile_ids:",
        data.profile.map((p) => p.profile_id)
      );
      alert("User profile not found. Please login again.");
      return;
    }

    console.log("Found user profile:", userProfile);
    currentUserData = userProfile;

    populateForm(userProfile);
  } catch (error) {
    console.error("❌ Error loading profile:", error);
    alert(`Error loading profile: ${error.message}`);
  }
}

function populateForm(userProfile) {
  console.log("📝 Populating form with data:", userProfile);

  try {
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
      usernameInput.value = userProfile.fullname || "";
      console.log("✓ Set username:", userProfile.fullname);
    }

    const fullnameInput = document.getElementById("fullname");
    if (fullnameInput) {
      fullnameInput.value = userProfile.fullname || "";
      console.log("✓ Set fullname:", userProfile.fullname);
    }

    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.value = userProfile.email || "";
      emailInput.readOnly = true;
      console.log("✓ Set email:", userProfile.email);
    }

    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.value = userProfile.phone || "";
      console.log("✓ Set phone:", userProfile.phone);
    }

    const genderInput = document.getElementById("gender");
    if (genderInput) {
      genderInput.value = userProfile.gender || "";
      console.log("✓ Set gender:", userProfile.gender);
    }

    const addressInput = document.getElementById("address");
    if (addressInput) {
      addressInput.value = userProfile.address || "";
      console.log("✓ Set address:", userProfile.address);
    }

    const dobInput = document.getElementById("dob");
    if (dobInput && userProfile.dob) {
      let dobValue = userProfile.dob;

      if (dobValue) {
        if (dobValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dobInput.value = dobValue;
        } else if (dobValue.includes("/")) {
          const parts = dobValue.split("/");
          if (parts.length === 3) {
            dobInput.value = `${parts[2]}-${parts[1].padStart(
              2,
              "0"
            )}-${parts[0].padStart(2, "0")}`;
          }
        } else if (dobValue.includes("T")) {
          dobInput.value = dobValue.split("T")[0];
        }
        console.log("✓ Set dob:", dobInput.value);
      }
    }

    if (profileImage) {
      const savedAvatar = localStorage.getItem(
        "userAvatar_" + userProfile.profile_id
      );

      if (savedAvatar) {
        profileImage.src = savedAvatar;
        console.log("Loaded avatar from localStorage");
      } else if (userProfile.avatar && userProfile.avatar !== "") {
        profileImage.src = userProfile.avatar;
        console.log("Loaded avatar from profile");
      } else {
        profileImage.src = "../images/avatar_select_image.png";
        console.log("Using default avatar");
      }
    }

    console.log("Form populated successfully");
  } catch (error) {
    console.error("Error populating form:", error);
  }
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Saving changes...");

    if (!currentUserData) {
      alert("No user data loaded! Please refresh the page.");
      return;
    }

    const formData = {
      fullname: document.getElementById("fullname")?.value.trim() || "",
      dob: document.getElementById("dob")?.value || "",
      gender: document.getElementById("gender")?.value || "",
      email: document.getElementById("email")?.value.trim() || "",
      phone: document.getElementById("phone")?.value.trim() || "",
      address: document.getElementById("address")?.value.trim() || "",
    };

    console.log("Form data:", formData);

    if (!formData.fullname) {
      alert("Please enter your full name!");
      return;
    }

    if (!formData.email) {
      alert("Email is required!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address!");
      return;
    }

    currentUserData.fullname = formData.fullname;
    currentUserData.phone = formData.phone;
    currentUserData.gender = formData.gender;
    currentUserData.dob = formData.dob;
    currentUserData.address = formData.address;

    localStorage.setItem("userName", currentUserData.fullname);

    const loginInfoStr = localStorage.getItem("login_infor");
    if (loginInfoStr) {
      try {
        const loginInfo = JSON.parse(loginInfoStr);
        loginInfo.fullname = currentUserData.fullname;
        loginInfo.phone = currentUserData.phone;
        loginInfo.gender = currentUserData.gender;
        loginInfo.dob = currentUserData.dob;
        loginInfo.address = currentUserData.address;
        localStorage.setItem("login_infor", JSON.stringify(loginInfo));
        console.log("Updated login_infor:", loginInfo);
      } catch (e) {
        console.log("Could not update login_infor:", e);
      }
    }

    console.log("Changes saved to localStorage");

    alert("Changes saved successfully!");
  });
}

const dobInput = document.getElementById("dob");
if (dobInput) {
  dobInput.addEventListener("blur", (e) => {
    const value = e.target.value;
    if (value && !value.includes("-") && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        e.target.value = `${parts[2]}-${parts[1].padStart(
          2,
          "0"
        )}-${parts[0].padStart(2, "0")}`;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Personal Info page loaded");
  console.log("Current path:", window.location.pathname);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  console.log("Login status:", isLoggedIn);

  if (isLoggedIn !== "true") {
    console.log("Not logged in, redirecting...");
    alert("Please login to view your personal information");
    window.location.href = "00_LOGIN.html";
    return;
  }

  console.log("LocalStorage contents:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value?.substring(0, 100));
  }

  setTimeout(() => {
    loadUserProfile();
  }, 100);
});

window.debugPersonalInfo = {
  loadUserProfile,
  getCurrentData: () => currentUserData,
  checkStorage: () => {
    console.log("=== STORAGE DEBUG ===");
    console.log("isLoggedIn:", localStorage.getItem("isLoggedIn"));
    console.log("userId:", localStorage.getItem("userId"));
    console.log("userEmail:", localStorage.getItem("userEmail"));
    console.log("userName:", localStorage.getItem("userName"));
    console.log("login_infor:", localStorage.getItem("login_infor"));
    console.log("currentUserData:", currentUserData);
    console.log("===================");
  },
  reloadProfile: () => {
    console.log("Manually reloading profile...");
    loadUserProfile();
  },
};
