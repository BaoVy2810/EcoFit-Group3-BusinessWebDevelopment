document.addEventListener('DOMContentLoaded', function() {

  const toggleAllLinks = document.querySelectorAll('.toggle-all');
  
  toggleAllLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const section = this.closest('.notification-section');
      const checkboxes = section.querySelectorAll('.notification-checkbox');
      
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
      });
    });
  });

  const updateBtn = document.querySelector('.update-notifications-btn');
  
  updateBtn.addEventListener('click', function() {
    const settings = {
      alerts: [],
      accountActivity: [],
      newsletters: []
    };

    const sections = document.querySelectorAll('.notification-section');
    
    sections.forEach((section, index) => {
      const checkboxes = section.querySelectorAll('.notification-checkbox');
      const sectionSettings = [];
      
      checkboxes.forEach(checkbox => {
        const label = checkbox.closest('.notification-label');
        const text = label.querySelector('.notification-title').textContent;
        sectionSettings.push({
          name: text,
          enabled: checkbox.checked
        });
      });

      if (index === 0) settings.alerts = sectionSettings;
      else if (index === 1) settings.accountActivity = sectionSettings;
      else if (index === 2) settings.newsletters = sectionSettings;
    });

    console.log('Updated notification settings:', settings);

    showSuccessMessage();
  });

  function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = '✓ Notification preferences updated successfully!';
    message.style.cssText = `
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
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

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
  `;
  document.head.appendChild(style);
});