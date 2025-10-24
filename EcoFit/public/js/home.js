// home.js
document.addEventListener("DOMContentLoaded", () => {
  const headerFrame = document.getElementById("header-frame");

  // Kiểm tra trạng thái đăng nhập (dựa theo localStorage)
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Nếu chưa đăng nhập → hiển thị header0 (chưa login)
  if (!isLoggedIn) {
    headerFrame.src = "../template/header0.html";
  } else {
    headerFrame.src = "../template/header.html";
  }

  // Lắng nghe sự kiện đăng nhập thành công
  window.addEventListener("message", (e) => {
    if (e.data && e.data.action === "loginSuccess") {
      localStorage.setItem("isLoggedIn", "true");
      headerFrame.src = "../template/header.html";
      window.location.href = "01_HOMEPAGE.html"; // chuyển qua trang chính
    }
  });

  // Lắng nghe sự kiện đăng xuất
  window.addEventListener("message", (e) => {
    if (e.data && e.data.action === "logout") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("login_infor");
      headerFrame.src = "../template/header0.html";
    }
  });

  // ✅ Lắng nghe sự kiện "goToLogin" và "goToSignup" từ header0.html
  window.addEventListener("message", (e) => {
    if (e.data && e.data.action === "goToLogin") {
      window.location.href = "00_LOGIN.html";
    }
    if (e.data && e.data.action === "goToSignup") {
      window.location.href = "00_SIGNUP.html";
    }
  });
});
