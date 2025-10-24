// Password page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const passwordForm = document.querySelector('form');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const saveButton = document.querySelector('.save-password-button');

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
  currentPasswordInput.addEventListener('input', function() {
    clearError(this);
    
    if (this.value && !validatePassword(this.value)) {
      showError(this, 'Password must be at least 6 characters');
    }
  });

  // Real-time validation for new password
  newPasswordInput.addEventListener('input', function() {
    clearError(this);
    
    if (this.value && !validatePassword(this.value)) {
      showError(this, 'Password must be at least 6 characters');
    }
  });

  // Form submission
  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let isValid = true;
    
    // Clear all previous errors
    clearError(currentPasswordInput);
    clearError(newPasswordInput);
    
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
      // Simulate password change (in production, this would be an API call)
      const passwordData = {
        currentPassword: currentPasswordInput.value,
        newPassword: newPasswordInput.value
      };
      
      console.log('Password change data:', passwordData);
      
      // Show loading state
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      // Simulate API call
      setTimeout(() => {
        // Reset button state
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
        
        // Clear form
        passwordForm.reset();
        
        // Show success message
        showSuccessMessage('Password changed successfully!');
      }, 1500);
    }
  });

  // Success message function
  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
      <span style="margin-right: 8px;">✓</span>
      ${message}
    `;
    successDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      background: linear-gradient(135deg, #69BD76 0%, #3DA547 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 500;
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      successDiv.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => successDiv.remove(), 300);
    }, 3000);
  }

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

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

  // Optional: Add password visibility toggle
  addPasswordToggle(currentPasswordInput);
  addPasswordToggle(newPasswordInput);

  function addPasswordToggle(input) {
    const wrapper = input.closest('.input-wrapper');
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '👁️';
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
        this.innerHTML = '🙈';
      } else {
        input.type = 'password';
        this.innerHTML = '👁️';
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