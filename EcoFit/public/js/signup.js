function check_email_exists(json_accounts, email) {
    for (let i = 0; i < json_accounts.profile.length; i++) {
        if (json_accounts.profile[i].email === email) {
            return true;
        }
    }
    return false;
}
function generate_user_id(json_accounts) {
    if (json_accounts.profile.length === 0) {
        return 1;
    }
    const maxId = Math.max(...json_accounts.profile.map(ac => parseInt(ac.id) || 0));
    return maxId + 1;
}

function generate_verification_code() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function send_verification_email(email, code) {    
    console.log(`📧 Sending verification code to ${email}`);
    console.log(`🔑 Verification code: ${code}`);
        return true;
}

function show_verification_modal(email, correctCode, userData) {
    const modalHTML = `
        <div id="verificationModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #69bd76 0%, #3da547 100%);
                    border-radius: 50%;
                    margin: 0 auto 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </div>
                
                <h2 style="
                    font-size: 28px;
                    font-weight: 700;
                    color: #000;
                    margin-bottom: 12px;
                    font-family: 'Outfit', sans-serif;
                ">Verify Your Email</h2>
                
                <p style="
                    font-size: 16px;
                    color: #666;
                    margin-bottom: 24px;
                    line-height: 1.6;
                    font-family: 'Outfit', sans-serif;
                ">We've sent a 6-digit verification code to<br><strong style="color: #3da547;">${email}</strong></p>
                
                <div style="
                    background: #f8f8f8;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                ">
                    <p style="
                        font-size: 14px;
                        color: #999;
                        margin-bottom: 8px;
                        font-family: 'Outfit', sans-serif;
                    ">For testing purposes, your code is:</p>
                    <p style="
                        font-size: 32px;
                        font-weight: 700;
                        color: #3da547;
                        letter-spacing: 8px;
                        font-family: 'Outfit', sans-serif;
                    ">${correctCode}</p>
                </div>
                
                <input 
                    type="text" 
                    id="verificationCodeInput" 
                    placeholder="Enter 6-digit code"
                    maxlength="6"
                    style="
                        width: 100%;
                        padding: 16px;
                        border: 2px solid #e8e8e8;
                        border-radius: 12px;
                        font-size: 24px;
                        text-align: center;
                        letter-spacing: 8px;
                        font-weight: 600;
                        margin-bottom: 16px;
                        font-family: 'Outfit', sans-serif;
                        transition: all 0.3s;
                    "
                    oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                />
                
                <div id="verificationError" style="
                    color: #e74c3c;
                    font-size: 14px;
                    margin-bottom: 16px;
                    display: none;
                    font-family: 'Outfit', sans-serif;
                ">Incorrect verification code. Please try again.</div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="verify_code('${correctCode}', ${JSON.stringify(userData).replace(/"/g, '&quot;')})" style="
                        flex: 1;
                        padding: 14px;
                        background: linear-gradient(180deg, #69BD76 0%, #3DA547 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        font-family: 'Outfit', sans-serif;
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(92, 184, 92, 0.3)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        Verify
                    </button>
                    
                    <button onclick="resend_code('${email}')" style="
                        flex: 1;
                        padding: 14px;
                        background: white;
                        color: #3da547;
                        border: 2px solid #3da547;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        font-family: 'Outfit', sans-serif;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='#f0f9f1';" onmouseout="this.style.background='white';">
                        Resend Code
                    </button>
                </div>
                
                <button onclick="close_verification_modal()" style="
                    width: 100%;
                    padding: 14px;
                    background: transparent;
                    color: #999;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    margin-top: 12px;
                    font-family: 'Outfit', sans-serif;
                    transition: all 0.3s;
                " onmouseover="this.style.background='#f5f5f5';" onmouseout="this.style.background='transparent';">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus vào input
    setTimeout(() => {
        document.getElementById('verificationCodeInput').focus();
    }, 100);
    
    // Cho phép nhấn Enter để verify
    document.getElementById('verificationCodeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verify_code(correctCode, userData);
        }
    });
}

// Hàm đóng modal
function close_verification_modal() {
    const modal = document.getElementById('verificationModal');
    if (modal) {
        modal.remove();
    }
}

// Hàm xác thực mã
function verify_code(correctCode, userData) {
    const inputCode = document.getElementById('verificationCodeInput').value.trim();
    const errorDiv = document.getElementById('verificationError');
    
    if (inputCode === correctCode) {
        // Mã đúng - Tiến hành đăng ký
        complete_signup(userData);
        close_verification_modal();
    } else {
        // Mã sai - Hiển thị lỗi
        errorDiv.style.display = 'block';
        document.getElementById('verificationCodeInput').style.borderColor = '#e74c3c';
        document.getElementById('verificationCodeInput').value = '';
        
        // Reset border sau 2 giây
        setTimeout(() => {
            errorDiv.style.display = 'none';
            document.getElementById('verificationCodeInput').style.borderColor = '#e8e8e8';
        }, 2000);
    }
}

// Hàm gửi lại mã
function resend_code(email) {
    const newCode = generate_verification_code();
    send_verification_email(email, newCode);
    
    // Cập nhật mã mới trong modal
    const modal = document.getElementById('verificationModal');
    const codeDisplay = modal.querySelector('p[style*="font-size: 32px"]');
    codeDisplay.textContent = newCode;
    
    // Cập nhật nút verify
    const verifyBtn = modal.querySelector('button[onclick^="verify_code"]');
    const userData = verifyBtn.getAttribute('onclick').match(/verify_code\('.*?', (.*?)\)/)[1];
    verifyBtn.setAttribute('onclick', `verify_code('${newCode}', ${userData})`);
    
    alert('✅ A new verification code has been sent to your email!');
}

function complete_signup(userData) {
    const { json_accounts, new_account, new_profile } = userData;
    
    json_accounts.profile.push(new_account);
    
    const accounts = JSON.parse(localStorage.getItem("accounts")) || json_accounts;
    accounts.profile = json_accounts.profile;
    localStorage.setItem("accounts", JSON.stringify(accounts));
    
    let profiles_data = JSON.parse(localStorage.getItem("profiles")) || { profiles: [] };
    if (!profiles_data.profiles) profiles_data = { profiles: [] };
    profiles_data.profiles.push(new_profile);
    localStorage.setItem("profiles", JSON.stringify(profiles_data));
    
    localStorage.setItem("login_infor", JSON.stringify(new_account));
    localStorage.setItem("isLoggedIn", "true");
    
    window.parent.postMessage({ action: "loginSuccess" }, "*");
    
    alert("✅ Account verified successfully! Welcome to EcoFit!");
    
    if (window.top === window.self) {
        window.open("../pages/01_HOMEPAGE.html", "_self");
    }
}

function process_signup() {
    const nameEl = document.getElementById("name");
    const genderEl = document.getElementById("gender");
    const birthdayEl = document.getElementById("birthday");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const confirmEl = document.getElementById("confirm_password");
    const termsEl = document.getElementById("terms");

    if (!nameEl || !genderEl || !birthdayEl || !phoneEl || !emailEl || !passwordEl || !confirmEl) {
        alert("⚠️ Form error: Missing required fields.");
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
        alert("⚠️ Please fill out all fields.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("⚠️ Please enter a valid email address.");
        return;
    }

    if (password !== confirm) {
        alert("⚠️ Passwords do not match!");
        return;
    }

    if (password.length < 6) {
        alert("⚠️ Password must be at least 6 characters long.");
        return;
    }

    if (!termsEl.checked) {
        alert("⚠️ Please agree to the Terms & Privacy Policy.");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "../../dataset/accounts.json", true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let json_accounts = JSON.parse(xhr.responseText);

            if (check_email_exists(json_accounts, email)) {
                alert("⚠️ This email is already registered!");
                return;
            }

            const newUserId = generate_user_id(json_accounts);

            let new_account = {
                id: newUserId.toString(),
                email: email,
                password: password,
                role: "user"
            };

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

            // Tạo mã xác thực
            const verificationCode = generate_verification_code();
            
            // Gửi email (mô phỏng)
            send_verification_email(email, verificationCode);
            
            // Hiển thị modal nhập mã
            const userData = {
                json_accounts: json_accounts,
                new_account: new_account,
                new_profile: new_profile
            };
            
            show_verification_modal(email, verificationCode, userData);
            
        } else if (xhr.readyState == 4 && xhr.status != 200) {
            alert("⚠️ Cannot access accounts.json. Please check your path.");
        }
    };
}

window.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Signup form with email verification loaded and ready.");
});