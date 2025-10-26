// ==========================================
// BELL NOTIFICATION SYSTEM
// File: bell_notification.js
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // NOTIFICATION DATA
    // ==========================================
    
    let notifications = [
        {
            id: 1,
            icon: '🎁',
            iconClass: 'gift',
            title: 'Special discount code!',
            message: 'Get 20% off your first order now!',
            time: '5 minutes ago',
            read: false,
            link: '#promo'
        },
        {
            id: 2,
            icon: '🛍️',
            iconClass: 'shop',
            title: 'New collection',
            message: 'Fall/Winter 2025 collection is now available! Discover now.',
            time: '1 hour ago',
            read: false,
            link: '#collection'
        },
        {
            id: 3,
            icon: '🚚',
            iconClass: 'delivery',
            title: 'Free shipping',
            message: 'Free shipping for orders over 500,000đ!',
            time: '3 hours ago',
            read: false,
            link: '#shipping'
        },
        {
            id: 4,
            icon: 'ℹ️',
            iconClass: 'info',
            title: 'Policy update',
            message: 'We have updated our return policy.',
            time: '1 day ago',
            read: true,
            link: '#policy'
        }
    ];

    // ==========================================
    // CREATE POPUP HTML
    // ==========================================
    
    function createNotificationPopup() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'notification-overlay';
        overlay.className = 'notification-overlay';
        overlay.onclick = closeNotifications;
        
        // Create popup container
        const popup = document.createElement('div');
        popup.id = 'notification-popup';
        popup.className = 'notification-popup';
        
        popup.innerHTML = `
            <div class="popup-header">
                <h3 class="popup-title">Notifications</h3>
                <button class="mark-all-read" onclick="NotificationSystem.markAllAsRead()">
                    Mark all as read
                </button>
            </div>
            
            <div class="notification-list" id="notification-list">
                <!-- Notifications will be rendered here -->
            </div>
            
            <div class="popup-footer">
                <button class="view-all-btn" onclick="NotificationSystem.viewAllNotifications()">
                    View all notifications
                </button>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        // Add styles
        injectStyles();
    }

    // ==========================================
    // INJECT CSS STYLES
    // ==========================================
    
    function injectStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            /* Overlay */
            .notification-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.3);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s;
                z-index: 9998;
            }
            
            .notification-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            /* Notification Popup */
            .notification-popup {
                position: fixed;
                width: 380px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
                overflow: hidden;
            }
            
            .notification-popup.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            /* Arrow pointing to bell */
            .notification-popup::before {
                content: '';
                position: absolute;
                top: -8px;
                width: 16px;
                height: 16px;
                background: white;
                transform: rotate(45deg);
                box-shadow: -3px -3px 8px rgba(0,0,0,0.08);
                z-index: -1;
            }
            
            .notification-popup::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 16px;
                background: white;
                z-index: 1;
            }
            
            /* Popup Header */
            .popup-header {
                padding: 20px 20px 15px 20px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                z-index: 2;
                background: white;
            }
            
            .popup-title {
                font-size: 20px;
                font-weight: 700;
                color: #212529;
            }
            
            .mark-all-read {
                background: none;
                border: none;
                color: #69BD76;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                padding: 6px 12px;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            .mark-all-read:hover {
                background: #f1f8f5;
            }
            
            /* Notification List */
            .notification-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .notification-item {
                padding: 16px 20px;
                border-bottom: 1px solid #f8f9fa;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                gap: 15px;
                position: relative;
            }
            
            .notification-item:hover {
                background: #f8f9fa;
            }
            
            .notification-item.unread {
                background: #f1f8f5;
            }
            
            .notification-item.unread::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: #69BD76;
            }
            
            .notification-icon {
                width: 45px;
                height: 45px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .notification-icon.gift {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            }
            
            .notification-icon.shop {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            
            .notification-icon.delivery {
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            }
            
            .notification-icon.info {
                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-size: 15px;
                font-weight: 600;
                color: #212529;
                margin-bottom: 4px;
                line-height: 1.4;
            }
            
            .notification-message {
                font-size: 14px;
                color: #6c757d;
                line-height: 1.5;
                margin-bottom: 6px;
            }
            
            .notification-time {
                font-size: 12px;
                color: #adb5bd;
            }
            
            /* Empty State */
            .empty-notifications {
                padding: 60px 20px;
                text-align: center;
            }
            
            .empty-icon {
                font-size: 60px;
                margin-bottom: 15px;
                opacity: 0.3;
            }
            
            .empty-text {
                font-size: 16px;
                color: #adb5bd;
            }
            
            /* Popup Footer */
            .popup-footer {
                padding: 15px 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                background: white;
            }
            
            .view-all-btn {
                background: none;
                border: none;
                color: #69BD76;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                padding: 8px 16px;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .view-all-btn:hover {
                background: #f1f8f5;
            }
            
            /* Scrollbar */
            .notification-list::-webkit-scrollbar {
                width: 6px;
            }
            
            .notification-list::-webkit-scrollbar-track {
                background: #f8f9fa;
            }
            
            .notification-list::-webkit-scrollbar-thumb {
                background: #dee2e6;
                border-radius: 10px;
            }
            
            .notification-list::-webkit-scrollbar-thumb:hover {
                background: #ced4da;
            }
        `;
        // 🔹 Compact layout fix to match header spacing
        style.textContent += `
            .notification-popup * {
                font-family: 'Outfit', sans-serif !important;
                line-height: 1.3 !important;
                letter-spacing: 0.2px;
            }

            .notification-item {
                padding: 12px 18px !important; /* giảm padding để gọn hơn */
                gap: 10px !important;
            }

            .notification-icon {
                width: 38px !important;
                height: 38px !important;
                font-size: 20px !important;
            }

            .notification-title {
                font-size: 14.5px !important;
            }

            .notification-message {
                font-size: 13.5px !important;
                margin-bottom: 4px !important;
            }

            .notification-time {
                font-size: 11.5px !important;
                color: #a0a0a0 !important;
            }

            .popup-header, .popup-footer {
                padding: 14px 18px !important;
            }

            .popup-title {
                font-size: 18px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // POSITION POPUP UNDER BELL
    // ==========================================
    
    function positionPopup() {
        const bellButton = document.getElementById('bell-button');
        const popup = document.getElementById('notification-popup');
        
        if (!bellButton || !popup) return;
        
        const bellRect = bellButton.getBoundingClientRect();
        
        // Calculate position
        const popupTop = bellRect.bottom + 10; // 10px below bell
        const popupRight = window.innerWidth - bellRect.right;
        
        // Arrow position
        const arrowRight = (popup.offsetWidth / 2) - 20;
        
        popup.style.top = `${popupTop}px`;
        popup.style.right = `${popupRight}px`;
        
        // Update arrow position
        popup.style.setProperty('--arrow-right', `${arrowRight}px`);
        
        // Add CSS for arrow position
        const existingStyle = document.getElementById('notification-styles');
        if (existingStyle && !existingStyle.textContent.includes('--arrow-right')) {
            existingStyle.textContent += `
                .notification-popup::before {
                    right: var(--arrow-right, 20px);
                }
            `;
        }
    }

    // ==========================================
    // TOGGLE NOTIFICATIONS
    // ==========================================
    
    function toggleNotifications() {
        const popup = document.getElementById('notification-popup');
        const overlay = document.getElementById('notification-overlay');
        
        if (!popup) {
            createNotificationPopup();
            // Wait for DOM update
            setTimeout(() => {
                toggleNotifications();
            }, 10);
            return;
        }
        
        const isOpen = popup.classList.contains('show');
        
        if (isOpen) {
            closeNotifications();
        } else {
            positionPopup();
            popup.classList.add('show');
            overlay.classList.add('show');
            renderNotifications();
        }
    }

    function closeNotifications() {
        const popup = document.getElementById('notification-popup');
        const overlay = document.getElementById('notification-overlay');
        
        if (popup) popup.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }

    // ==========================================
    // RENDER NOTIFICATIONS
    // ==========================================
    
    function renderNotifications() {
        const container = document.getElementById('notification-list');
        if (!container) return;
        
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <div class="empty-icon">🔔</div>
                    <p class="empty-text">No new notifications</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.read ? '' : 'unread'}" 
                 onclick="NotificationSystem.markAsRead(${notif.id})">
                <div class="notification-icon ${notif.iconClass}">
                    ${notif.icon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${notif.time}</div>
                </div>
            </div>
        `).join('');
        
        updateBadge();
    }

    // ==========================================
    // MARK AS READ
    // ==========================================
    
    function markAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            renderNotifications();
            console.log('Clicked notification:', notification.title);
            
            if (notification.link) {
                // Can navigate or trigger event
                console.log('Navigate to:', notification.link);
            }
        }
    }

    function markAllAsRead() {
        notifications.forEach(notif => notif.read = true);
        renderNotifications();
        showToast('All notifications marked as read');
    }

    // ==========================================
    // UPDATE BADGE
    // ==========================================
    
    function updateBadge() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.querySelector('#bell-button .badge');
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ==========================================
    // VIEW ALL NOTIFICATIONS
    // ==========================================
    
    function viewAllNotifications() {
        console.log('View all notifications:', notifications);
        alert('Navigating to notifications page...');
        closeNotifications();
    }

    // ==========================================
    // TOAST NOTIFICATION
    // ==========================================
    
    function showToast(message) {
        let toast = document.getElementById('notification-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'notification-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: #212529;
                color: white;
                padding: 14px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
    }

    // ==========================================
    // ADD NEW NOTIFICATION
    // ==========================================
    
    function addNotification(notification) {
        notifications.unshift({
            id: Date.now(),
            ...notification,
            time: 'Just now',
            read: false
        });
        
        updateBadge();
        showToast('You have a new notification!');
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    
    function initEventListeners() {
        // Click bell button
        const bellButton = document.getElementById('bell-button');
        if (bellButton) {
            bellButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNotifications();
            });
        }
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeNotifications();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('notification-popup');
            const bellButton = document.getElementById('bell-button');
            
            if (popup && 
                popup.classList.contains('show') && 
                !popup.contains(e.target) && 
                !bellButton.contains(e.target)) {
                closeNotifications();
            }
        });
        
        // Reposition on window resize
        window.addEventListener('resize', () => {
            const popup = document.getElementById('notification-popup');
            if (popup && popup.classList.contains('show')) {
                positionPopup();
            }
        });
    }
    // ==========================================
// INIT (iframe-aware)
// ==========================================

function init() {
  console.log('🔔 Notification system initialized');

  // Nếu file chạy trong header iframe
  const inIframe = window.parent && window.parent !== window;

  if (inIframe) {
    const bellButton = document.getElementById('bell-button');
    if (bellButton) {
      bellButton.addEventListener('click', (e) => {
        e.stopPropagation();

        const rect = bellButton.getBoundingClientRect();
        const bellPosition = { top: rect.bottom, right: window.innerWidth - rect.right };

        // Gửi toàn bộ dữ liệu notification lên parent page
        window.parent.postMessage({
          action: "toggleNotifications",
          bellPosition,
          notifications
        }, "*");
      });
    }

    // Không tạo popup trong iframe
    updateBadge();
    return;
  }

  // Nếu đang chạy trực tiếp (trong trang cha)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEventListeners();
      updateBadge();
    });
  } else {
    initEventListeners();
    updateBadge();
  }

  // Demo: thêm thông báo mới sau 5s
  setTimeout(() => {
    addNotification({
      icon: '⭐',
      iconClass: 'gift',
      title: 'New reward points!',
      message: 'You just received 100 reward points from your recent order.',
      link: '#rewards'
    });
  }, 5000);
}

// ==========================================
// EXPORT PUBLIC API
// ==========================================

window.NotificationSystem = {
  init,
  toggleNotifications,
  closeNotifications,
  markAsRead,
  markAllAsRead,
  viewAllNotifications,
  addNotification,
  notifications
};

// Lắng nghe tín hiệu từ iframe header
window.addEventListener("message", (e) => {
  if (e.data?.action === "toggleNotifications") {
    const { bellPosition, notifications: data } = e.data;
    if (data) notifications = data; // đồng bộ dữ liệu
    toggleNotifications(bellPosition);
  }
});

// Auto init
init();

})();