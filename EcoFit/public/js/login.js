function select_one(json_accounts, uid, pwd) {
  // Sửa: đổi từ .accounts sang .profile để khớp với accounts.json
  const profiles = json_accounts.profile || json_accounts.accounts || [];
  for (let i = 0; i < profiles.length; i++) {
    let ac = profiles[i];
    if (ac.email == uid && ac.password == pwd) {
      return ac;
    }
  }
  return null;
}

function process_login() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "../../dataset/accounts.json", true);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      let json_accounts = JSON.parse(xhr.responseText);
      let ac = select_one(
        json_accounts,
        my_form.email.value,
        my_form.password.value
      );
      if (ac == null) {
        alert("Login failed, contact ADMIN");
      } else {
        // Clear old guest data before login
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("myplant_guest")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Save login info
        let string_json = JSON.stringify(ac);
        localStorage.setItem("login_infor", string_json);
        localStorage.setItem("save_infor", my_form.save_infor.checked);
        localStorage.setItem("isLoggedIn", "true"); // ✅ lưu trạng thái đăng nhập

        console.log(
          "✅ Login successful for:",
          ac.email,
          "Profile ID:",
          ac.profile_id
        );

        // ✅ Gửi tín hiệu login thành công sang trang cha (home.js sẽ nhận)
        window.parent.postMessage({ action: "loginSuccess" }, "*");

        // ✅ Chuyển hướng nếu không chạy trong iframe (khi test trực tiếp)
        if (window.top === window.self) {
          if (ac.role == "administrator") {
            window.open("../public/admin_pages/admin_dashboard.html", "_self");
          } else {
            window.open("../pages/01_HOMEPAGE.html", "_self");
          }
        }
      }
    }
  };
}

function load_login_infor() {
  let json_string = localStorage.getItem("login_infor");
  let json_object = JSON.parse(json_string);
  let save = localStorage.getItem("save_infor");
  if (save == "true" && json_object) {
    my_form.email.value = json_object.email;
    my_form.password.value = json_object.password;
    my_form.save_infor.checked = true;
  }
}
load_login_infor();
