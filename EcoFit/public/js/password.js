// Password page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const passwordForm = document.querySelector('form');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const saveButton = document.querySelector('.save-password-button');

  // QUAN TRỌNG: Đổi type của nút Save thành button
  if (saveButton) {
    saveButton.type = 'button';
  }

  // Password validation function
  function validatePassword(password) {
    return password.length >= 6;
  }

  // Show error message
  function showError(input, message) {
    const inputWrapper = input.closest('.input-wrapper');
    let errorMsg = inputWrapper.querySelector('.error-message');
    
    if (!errorMsg) {
      errorMsg = document.createElement('small');
      errorMsg.className = 'error-message';
      errorMsg.style.color = '#dc3545';
      errorMsg.style.display = 'block';
      errorMsg.style.marginTop = '6px';
      inputWrapper.appendChild(errorMsg);
    }
    
    errorMsg.textContent = message;
    input.style.borderColor = '#dc3545';
  }

  // Clear error message
  function clearError(input) {
    const inputWrapper = input.closest('.input-wrapper');
    const errorMsg = inputWrapper.querySelector('.error-message');
    
    if (errorMsg) {
      errorMsg.remove();
    }
    
    input.style.borderColor = '#d1d1d1';
  }

  // Real-time validation for current password
  if (currentPasswordInput) {
    currentPasswordInput.addEventListener('input', function() {
      clearError(this);
      
      if (this.value && !validatePassword(this.value)) {
        showError(this, 'Password must be at least 6 characters');
      }
    });
  }

  // Real-time validation for new password
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      clearError(this);
      
      if (this.value && !validatePassword(this.value)) {
        showError(this, 'Password must be at least 6 characters');
      }
    });
  }

  // Xử lý sự kiện click trên nút Save
  if (saveButton) {
    saveButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      let isValid = true;
      
      // Clear all previous errors
      if (currentPasswordInput) clearError(currentPasswordInput);
      if (newPasswordInput) clearError(newPasswordInput);
      
      // Validate current password
      if (!currentPasswordInput.value) {
        showError(currentPasswordInput, 'Current password is required');
        isValid = false;
      } else if (!validatePassword(currentPasswordInput.value)) {
        showError(currentPasswordInput, 'Password must be at least 6 characters');
        isValid = false;
      }
      
      // Validate new password
      if (!newPasswordInput.value) {
        showError(newPasswordInput, 'New password is required');
        isValid = false;
      } else if (!validatePassword(newPasswordInput.value)) {
        showError(newPasswordInput, 'Password must be at least 6 characters');
        isValid = false;
      }
      
      // Check if new password is different from current
      if (isValid && currentPasswordInput.value === newPasswordInput.value) {
        showError(newPasswordInput, 'New password must be different from current password');
        isValid = false;
      }
      
      if (isValid) {
        // Show loading state
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
          // Reset button state
          saveButton.disabled = false;
          saveButton.textContent = originalText;
          
          // Clear form
          if (currentPasswordInput) currentPasswordInput.value = '';
          if (newPasswordInput) newPasswordInput.value = '';
          
          // Show success message
          alert('Password changed successfully!');
        }, 1000);
      }
    });
  }

  // QUAN TRỌNG: Ngăn chặn form submit hoàn toàn
  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    });

    // Thêm event listener khác để chắc chắn
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      return false;
    }, true);
  }

  // Thêm style cơ bản
  const style = document.createElement('style');
  style.textContent = `
    .save-password-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    input[type="password"]:focus {
      outline: none;
      border-color: #3DA547 !important;
      box-shadow: 0 0 0 3px rgba(61, 165, 71, 0.1);
    }
  `;
  document.head.appendChild(style);

  // Toggle hiển thị mật khẩu
  if (currentPasswordInput) addPasswordToggle(currentPasswordInput);
  if (newPasswordInput) addPasswordToggle(newPasswordInput);

  function addPasswordToggle(input) {
    const wrapper = input.closest('.input-wrapper');
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '';
    toggleBtn.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      opacity: 0.6;
      transition: opacity 0.2s;
    `;
    
    // Make wrapper relative for absolute positioning
    wrapper.style.position = 'relative';
    
    toggleBtn.addEventListener('click', function() {
      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = '';
      } else {
        input.type = 'password';
        this.innerHTML = '';
      }
    });
    
    toggleBtn.addEventListener('mouseenter', function() {
      this.style.opacity = '1';
    });
    
    toggleBtn.addEventListener('mouseleave', function() {
      this.style.opacity = '0.6';
    });
    
    wrapper.appendChild(toggleBtn);
  }
});