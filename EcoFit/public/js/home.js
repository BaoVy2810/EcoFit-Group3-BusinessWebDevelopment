document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header-container");
  const mainFrame = document.getElementById("main-frame");

  // Kiểm tra trạng thái đăng nhập từ localStorage
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (isLoggedIn) {
    // Đã đăng nhập → hiển thị header chính + homepage
    headerContainer.innerHTML = `<iframe src="../template/header.html" class="header-frame" id="header-frame"></iframe>`;
    mainFrame.src = "../pages/01_HOMEPAGE.html";
  } else {
    // Chưa đăng nhập → header0 + login
    headerContainer.innerHTML = `<iframe src="../template/header0.html" class="header-frame" id="header-frame"></iframe>`;
    mainFrame.src = "../pages/00_LOGIN.html";
  }

  // Nghe tín hiệu từ các iframe con
  window.addEventListener("message", (event) => {
    if (!event.data || !event.data.action) return;

    switch (event.data.action) {
      case "goToLogin":
        mainFrame.src = "../pages/00_LOGIN.html";
        break;

      case "goToSignup":
        mainFrame.src = "../pages/00_SIGNUP.html";
        break;

      case "loggedIn":
        // Khi đăng nhập hoặc đăng ký thành công
        localStorage.setItem("isLoggedIn", "true");
        headerContainer.innerHTML = `<iframe src="../template/header.html" class="header-frame" id="header-frame"></iframe>`;
        mainFrame.src = "../pages/01_HOMEPAGE.html";
        break;

      case "logout":
        localStorage.removeItem("isLoggedIn");
        headerContainer.innerHTML = `<iframe src="../template/header0.html" class="header-frame" id="header-frame"></iframe>`;
        mainFrame.src = "../pages/00_LOGIN.html";
        break;
    }
  });
});
