// Hàm kiểm tra email đã tồn tại trong accounts
function check_email_exists(json_accounts, email) {
    
    for (let i = 0; i < json_accounts.profile.length; i++) {
        if (json_accounts.profile[i].email === email) {
            return true;
        }
    }
    return false;
}

// Hàm tạo ID mới cho user
function generate_user_id(json_accounts) {
    if (json_accounts.profile.length === 0) {
        return 1;
    }
    const maxId = Math.max(...json_accounts.profile.map(ac => parseInt(ac.id) || 0));
    return maxId + 1;
}

// Hàm xử lý đăng ký
function process_signup() {
    const nameEl = document.getElementById("name");
    const genderEl = document.getElementById("gender");
    const birthdayEl = document.getElementById("birthday");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const confirmEl = document.getElementById("confirm_password");

    if (!nameEl || !genderEl || !birthdayEl || !phoneEl || !emailEl || !passwordEl || !confirmEl) {
        alert("Form error: Missing required fields.");
        return;
    }

    const name = nameEl.value.trim();
    const gender = genderEl.value;
    const birthday = birthdayEl.value;
    const phone = phoneEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    const confirm = confirmEl.value.trim();

    if (!name || !gender || !birthday || !phone || !email || !password || !confirm) {
        alert("Please fill out all fields.");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "../../dataset/accounts.json", true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let json_accounts = JSON.parse(xhr.responseText);

            if (check_email_exists(json_accounts, email)) {
                alert("This email is already registered!");
                return;
            }

            const newUserId = generate_user_id(json_accounts);

            let new_account = {
                id: newUserId.toString(),
                email: email,
                password: password,
                role: "user"
            };

            // ✅ Giả lập cập nhật vào localStorage
            json_accounts.profile.push(new_account);
            localStorage.setItem("accounts", JSON.stringify(json_accounts));

            let new_profile = {
                id: newUserId.toString(),
                name: name,
                email: email,
                gender: gender,
                birthday: birthday,
                phone: phone,
                address: "",
                avatar: "../images/default-avatar.png",
                created_at: new Date().toISOString(),
                role: "user"
            };

            let profiles_data = JSON.parse(localStorage.getItem("profiles")) || { profiles: [] };
            if (!profiles_data.profiles) profiles_data = { profiles: [] };
            profiles_data.profiles.push(new_profile);
            localStorage.setItem("profiles", JSON.stringify(profiles_data));

            // ✅ Lưu trạng thái đăng nhập + gửi tín hiệu
            localStorage.setItem("login_infor", JSON.stringify(new_account));
            localStorage.setItem("isLoggedIn", "true");

            // ✅ Gửi tín hiệu sang trang cha (home.js)
            window.parent.postMessage({ action: "loginSuccess" }, "*");

            // ✅ Nếu mở riêng, chuyển trực tiếp
            if (window.top === window.self) {
                alert("Sign up successful! Redirecting to homepage...");
                window.open("../pages/01_HOMEPAGE.html", "_self");
            }
        } else if (xhr.readyState == 4 && xhr.status != 200) {
            alert("Cannot access accounts.json (Check your path)");
        }
    };
}

// Debug: In ra các ID element khi trang load
window.addEventListener('DOMContentLoaded', function() {
    console.log("Signup form loaded and ready.");
});
