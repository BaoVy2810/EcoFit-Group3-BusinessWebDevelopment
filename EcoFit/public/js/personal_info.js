// Xử lý upload ảnh profile
const btnSelectImage = document.querySelector('.btn-select-image');
const imageUpload = document.getElementById('imageUpload');
const profileImage = document.getElementById('profileImage');

btnSelectImage.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    if (file) {
        // Kiểm tra kích thước file (1MB = 1048576 bytes)
        if (file.size > 1048576) {
            alert('File size must be less than 1 MB!');
            return;
        }
        
        // Kiểm tra định dạng file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Only .JPEG and .PNG files are allowed!');
            return;
        }
        
        // Đọc và hiển thị ảnh
        const reader = new FileReader();
        reader.onload = (event) => {
            profileImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Xử lý form submit
const profileForm = document.querySelector('.profile-form');

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Lấy dữ liệu từ form
    const formData = {
        username: document.getElementById('username').value,
        fullname: document.getElementById('fullname').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };
    
    // Kiểm tra các trường bắt buộc
    if (!formData.username || !formData.fullname || !formData.email) {
        alert('Please fill in all required fields!');
        return;
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address!');
        return;
    }
    
    console.log('Form data:', formData);
    alert('Changes saved successfully!');
});

// Format date input (DD/MM/YYYY)
const dobInput = document.getElementById('dob');

dobInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
        value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    
    e.target.value = value;
});