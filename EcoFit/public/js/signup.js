// Hàm kiểm tra email đã tồn tại trong accounts
function check_email_exists(json_accounts, email) {
    for (let i = 0; i < json_accounts.accounts.length; i++) {
        if (json_accounts.accounts[i].email === email) {
            return true;
        }
    }
    return false;
}

// Hàm tạo ID mới cho user
function generate_user_id(json_accounts) {
    if (json_accounts.accounts.length === 0) {
        return 1;
    }
    const maxId = Math.max(...json_accounts.accounts.map(ac => parseInt(ac.id) || 0));
    return maxId + 1;
}

// Hàm xử lý đăng ký - logic tương tự process_login
function process_signup() {
    // Lấy các element - với kiểm tra an toàn
    const nameEl = document.getElementById("name");
    const genderEl = document.getElementById("gender");
    const birthdayEl = document.getElementById("birthday");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const confirmEl = document.getElementById("confirm_password");

    // Kiểm tra xem các element có tồn tại không
    if (!nameEl || !genderEl || !birthdayEl || !phoneEl || !emailEl || !passwordEl || !confirmEl) {
        console.error("Missing form elements. Please check your HTML IDs:");
        console.log({
            name: !!nameEl,
            gender: !!genderEl,
            birthday: !!birthdayEl,
            phone: !!phoneEl,
            email: !!emailEl,
            password: !!passwordEl,
            confirm: !!confirmEl
        });
        alert("Form error: Missing required fields. Check console for details.");
        return;
    }

    // Lấy giá trị
    const name = nameEl.value.trim();
    const gender = genderEl.value;
    const birthday = birthdayEl.value;
    const phone = phoneEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    const confirm = confirmEl.value.trim();

    // Kiểm tra trống
    if (!name || !gender || !birthday || !phone || !email || !password || !confirm) {
        alert("Please fill out all fields.");
        return;
    }

    // Kiểm tra khớp mật khẩu
    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    // Đọc file accounts.json - tương tự process_login
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "../../dataset/accounts.json", true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let json_accounts = JSON.parse(xhr.responseText);

            // Kiểm tra email trùng
            if (check_email_exists(json_accounts, email)) {
                alert("This email is already registered!");
                return;
            }

            // Tạo ID mới
            const newUserId = generate_user_id(json_accounts);

            // Tạo tài khoản mới cho accounts.json
            let new_account = {
                id: newUserId.toString(),
                email: email,
                password: password,
                role: "user"
            };

            // Cập nhật accounts.json (giả lập bằng localStorage)
            json_accounts.accounts.push(new_account);
            localStorage.setItem("accounts", JSON.stringify(json_accounts));

            // Tạo profile mới cho profiles.json
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

            // Đọc profiles hiện có từ localStorage hoặc tạo mới
            let profiles_data = JSON.parse(localStorage.getItem("profiles")) || { profiles: [] };
            
            // Đảm bảo có mảng profiles
            if (!profiles_data.profiles) {
                profiles_data = { profiles: [] };
            }

            // Thêm profile mới vào mảng
            profiles_data.profiles.push(new_profile);

            // Lưu vào localStorage (giả lập lưu file profiles.json)
            localStorage.setItem("profiles", JSON.stringify(profiles_data));

            // Thông báo thành công và chuyển hướng
            alert("Sign up successful! Redirecting to login page...");
            window.location.href = "00_LOGIN.html";
        }
        else if (xhr.readyState == 4 && xhr.status != 200) {
            alert("Cannot access accounts.json (Check your path)");
        }
    };
}

// Debug: In ra các ID element khi trang load
window.addEventListener('DOMContentLoaded', function() {
    console.log("Checking form elements:");
    console.log("name:", document.getElementById("name"));
    console.log("gender:", document.getElementById("gender"));
    console.log("gender_select:", document.getElementById("gender_select"));
    console.log("birthday:", document.getElementById("birthday"));
    console.log("phone:", document.getElementById("phone"));
    console.log("email:", document.getElementById("email"));
    console.log("password:", document.getElementById("password"));
    console.log("confirm-password:", document.getElementById("confirm_password"));
    console.log("confirm_password:", document.getElementById("confirm_password"));
});