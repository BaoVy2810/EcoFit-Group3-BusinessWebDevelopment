(function() {
    'use strict';
    
    let notificationPopup = null;
    let notificationOverlay = null;
    let currentNotifications = [];
    window.addEventListener('message', function(event) {
        const data = event.data;
        
        switch (data.type) {
            case 'IFRAME_READY':
                // Gửi thông báo đã sẵn sàng
                event.source.postMessage({ type: 'PARENT_READY' }, event.origin);
                break;
                
            case 'BELL_CLICK':
                handleBellClick(data.bellPosition, data.notifications);
                break;
                
            case 'BADGE_UPDATE':
                // Có thể cập nhật badge trên parent nếu cần
                console.log('Badge update:', data.unreadCount);
                break;
        }
    });
    
    // ==========================================
    // XỬ LÝ CLICK BELL TỪ IFRAME
    // ==========================================
    
    function handleBellClick(bellPosition, notifications = []) {
        if (notifications && notifications.length > 0) {
            currentNotifications = notifications;
        }
        
        if (!notificationPopup) {
            createNotificationPopup();
        }
        
        positionPopup(bellPosition);
        showNotifications();
    }
    
    function createNotificationPopup() {
        // Tạo overlay
        notificationOverlay = document.createElement('div');
        notificationOverlay.id = 'parent-notification-overlay';
        notificationOverlay.className = 'parent-notification-overlay';
        notificationOverlay.onclick = closeNotifications;
        
        // Tạo popup container
        notificationPopup = document.createElement('div');
        notificationPopup.id = 'parent-notification-popup';
        notificationPopup.className = 'parent-notification-popup';
        
        notificationPopup.innerHTML = `
            <div class="popup-header">
                <h3 class="popup-title">Notifications</h3>
                <button class="mark-all-read" id="parent-mark-all-read">
                    Mark all as read
                </button>
            </div>
            
            <div class="notification-list" id="parent-notification-list">
                <!-- Notifications will be rendered here -->
            </div>
            
            <div class="popup-footer">
                <button class="view-all-btn" id="parent-view-all">
                    View all notifications
                </button>
            </div>
        `;
        
        document.body.appendChild(notificationOverlay);
        document.body.appendChild(notificationPopup);
        
        // Thêm event listeners
        document.getElementById('parent-mark-all-read').addEventListener('click', handleMarkAllRead);
        document.getElementById('parent-view-all').addEventListener('click', handleViewAll);
        
        injectParentStyles();
        renderNotifications();
    }
    
    // ==========================================
    // STYLES CHO POPUP TRONG TRANG CHA
    // ==========================================
    
    function injectParentStyles() {
        if (document.getElementById('parent-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'parent-notification-styles';
        style.textContent = `
            /* OVERLAY - Trang cha */
            #parent-notification-overlay.parent-notification-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0,0,0,0.3) !important;
                opacity: 0 !important;
                visibility: hidden !important;
                transition: opacity 0.3s ease, visibility 0.3s ease !important;
                z-index: 2147483646 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                pointer-events: none !important;
            }
            
            #parent-notification-overlay.parent-notification-overlay.show {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
            
            /* POPUP - Trang cha */
            #parent-notification-popup.parent-notification-popup {
                position: fixed !important;
                width: 380px !important;
                max-width: 380px !important;
                min-width: 380px !important;
                background: white !important;
                border-radius: 16px !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
                opacity: 0 !important;
                visibility: hidden !important;
                transform: translateY(-10px) !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                z-index: 2147483647 !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 1px solid rgba(0,0,0,0.05) !important;
                box-sizing: border-box !important;
                pointer-events: auto !important;
            }
            
            #parent-notification-popup.parent-notification-popup.show {
                opacity: 1 !important;
                visibility: visible !important;
                transform: translateY(0) !important;
            }
            
            /* ARROW - Điều chỉnh vị trí */
            #parent-notification-popup.parent-notification-popup::before {
                content: '' !important;
                position: absolute !important;
                top: -8px !important;
                width: 16px !important;
                height: 16px !important;
                background: white !important;
                transform: rotate(45deg) !important;
                box-shadow: -3px -3px 8px rgba(0,0,0,0.08) !important;
                z-index: -1 !important;
            }
            
            #parent-notification-popup.parent-notification-popup::after {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 16px !important;
                background: white !important;
                z-index: 1 !important;
            }
            
            /* POPUP HEADER */
            #parent-notification-popup .popup-header {
                padding: 20px 20px 15px 20px !important;
                border-bottom: 1px solid #e9ecef !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                position: relative !important;
                z-index: 2 !important;
                background: white !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            
            #parent-notification-popup .popup-title {
                font-size: 20px !important;
                font-weight: 700 !important;
                color: #212529 !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1.2 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #parent-notification-popup .mark-all-read {
                background: none !important;
                border: none !important;
                color: #69BD76 !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                padding: 6px 12px !important;
                border-radius: 6px !important;
                transition: background 0.2s ease !important;
                margin: 0 !important;
                outline: none !important;
                box-shadow: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #parent-notification-popup .mark-all-read:hover {
                background: #f1f8f5 !important;
            }
            
            /* NOTIFICATION LIST */
            #parent-notification-popup .notification-list {
                max-height: 400px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                list-style: none !important;
            }
            
            #parent-notification-popup .notification-item {
                padding: 16px 20px !important;
                border-bottom: 1px solid #f8f9fa !important;
                cursor: pointer !important;
                transition: background 0.2s ease !important;
                display: flex !important;
                gap: 15px !important;
                position: relative !important;
                margin: 0 !important;
                list-style: none !important;
                box-sizing: border-box !important;
            }
            
            #parent-notification-popup .notification-item:hover {
                background: #f8f9fa !important;
            }
            
            #parent-notification-popup .notification-item.unread {
                background: #f1f8f5 !important;
            }
            
            #parent-notification-popup .notification-item.unread::before {
                content: '' !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                bottom: 0 !important;
                width: 3px !important;
                background: #69BD76 !important;
            }
            
            #parent-notification-popup .notification-icon {
                width: 45px !important;
                height: 45px !important;
                min-width: 45px !important;
                min-height: 45px !important;
                border-radius: 12px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 24px !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            #parent-notification-popup .notification-icon.gift {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important;
            }
            
            #parent-notification-popup .notification-icon.shop {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
            }
            
            #parent-notification-popup .notification-icon.delivery {
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
            }
            
            #parent-notification-popup .notification-icon.info {
                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important;
            }
            
            #parent-notification-popup .notification-content {
                flex: 1 !important;
                margin: 0 !important;
                padding: 0 !important;
                min-width: 0 !important;
            }
            
            #parent-notification-popup .notification-title {
                font-size: 15px !important;
                font-weight: 600 !important;
                color: #212529 !important;
                margin: 0 0 4px 0 !important;
                padding: 0 !important;
                line-height: 1.4 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #parent-notification-popup .notification-message {
                font-size: 14px !important;
                color: #6c757d !important;
                line-height: 1.5 !important;
                margin: 0 0 6px 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #parent-notification-popup .notification-time {
                font-size: 12px !important;
                color: #adb5bd !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* EMPTY STATE */
            #parent-notification-popup .empty-notifications {
                padding: 60px 20px !important;
                text-align: center !important;
                margin: 0 !important;
            }
            
            #parent-notification-popup .empty-icon {
                font-size: 60px !important;
                margin: 0 0 15px 0 !important;
                opacity: 0.3 !important;
                padding: 0 !important;
            }
            
            #parent-notification-popup .empty-text {
                font-size: 16px !important;
                color: #adb5bd !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* POPUP FOOTER */
            #parent-notification-popup .popup-footer {
                padding: 15px 20px !important;
                border-top: 1px solid #e9ecef !important;
                text-align: center !important;
                background: white !important;
                margin: 0 !important;
            }
            
            #parent-notification-popup .view-all-btn {
                background: none !important;
                border: none !important;
                color: #69BD76 !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                padding: 8px 16px !important;
                border-radius: 8px !important;
                transition: background 0.2s ease !important;
                margin: 0 !important;
                outline: none !important;
                box-shadow: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #parent-notification-popup .view-all-btn:hover {
                background: #f1f8f5 !important;
            }
            
            /* SCROLLBAR STYLING */
            #parent-notification-popup .notification-list::-webkit-scrollbar {
                width: 6px !important;
            }
            
            #parent-notification-popup .notification-list::-webkit-scrollbar-track {
                background: #f8f9fa !important;
            }
            
            #parent-notification-popup .notification-list::-webkit-scrollbar-thumb {
                background: #dee2e6 !important;
                border-radius: 10px !important;
            }
            
            #parent-notification-popup .notification-list::-webkit-scrollbar-thumb:hover {
                background: #ced4da !important;
            }
            
            /* TOAST NOTIFICATION */
            #parent-notification-toast {
                position: fixed !important;
                bottom: 30px !important;
                right: 30px !important;
                background: #212529 !important;
                color: white !important;
                padding: 14px 20px !important;
                border-radius: 10px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                font-size: 14px !important;
                z-index: 2147483647 !important;
                opacity: 0 !important;
                transition: opacity 0.3s ease !important;
                margin: 0 !important;
                border: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                pointer-events: none !important;
            }
            
            #parent-notification-toast.show {
                opacity: 1 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // ==========================================
    // ĐỊNH VỊ POPUP DƯỚI ICON CHUÔNG
    // ==========================================
    
    function positionPopup(bellPosition) {
        if (!notificationPopup) return;
        
        // Tính toán vị trí dựa trên vị trí bell trong iframe
        const popupTop = bellPosition.bottom + 10;
        const popupRight = window.innerWidth - bellPosition.right;
        
        notificationPopup.style.setProperty('top', `${popupTop}px`, 'important');
        notificationPopup.style.setProperty('right', `${popupRight}px`, 'important');
        
        // Tính toán vị trí mũi tên
        const bellCenter = bellPosition.left + (bellPosition.width / 2);
        const popupLeft = window.innerWidth - popupRight - 380; // 380 = popup width
        const arrowRight = (popupLeft + 380) - bellCenter - 8;
        
        // Cập nhật vị trí mũi tên
        updateArrowPosition(arrowRight);
    }
    
    function updateArrowPosition(arrowRight) {
        const styleEl = document.getElementById('parent-notification-styles');
        if (styleEl) {
            let styleContent = styleEl.textContent;
            
            // Xóa style arrow cũ
            styleContent = styleContent.replace(/#parent-notification-popup\.parent-notification-popup::before\s*\{[^}]+\}/g, '');
            
            // Thêm style arrow mới
            styleContent += `
                #parent-notification-popup.parent-notification-popup::before {
                    right: ${arrowRight}px !important;
                }
            `;
            
            styleEl.textContent = styleContent;
        }
    }
    
    // ==========================================
    // HIỂN THỊ/ẨN POPUP
    // ==========================================
    
    function showNotifications() {
        if (!notificationPopup || !notificationOverlay) return;
        
        notificationPopup.classList.add('show');
        notificationOverlay.classList.add('show');
        renderNotifications();
    }
    
    function closeNotifications() {
        if (notificationPopup) notificationPopup.classList.remove('show');
        if (notificationOverlay) notificationOverlay.classList.remove('show');
    }
    
    // ==========================================
    // RENDER NOTIFICATIONS (Dummy data)
    // ==========================================
    
    function renderNotifications() {
        const container = document.getElementById('parent-notification-list');
        if (!container) return;
        const notifications = [
            {
                id: 1,
                icon: '🎁',
                iconClass: 'gift',
                title: 'Special discount code!',
                message: 'Get 20% off your first order now!',
                time: '5 minutes ago',
                read: false
            },
            {
                id: 2,
                icon: '🛍️',
                iconClass: 'shop',
                title: 'New collection',
                message: 'Fall/Winter 2025 collection is now available!',
                time: '1 hour ago',
                read: false
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
                 data-id="${notif.id}">
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
        
        // Thêm event listeners cho các notification items
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const notificationId = this.getAttribute('data-id');
                handleNotificationClick(notificationId);
            });
        });
    }
    
    // ==========================================
    // TOAST NOTIFICATION
    // ==========================================
    
    function showToast(message) {
        let toast = document.getElementById('parent-notification-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'parent-notification-toast';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
    
    // ==========================================
    // XỬ LÝ CÁC HÀM KHÁC
    // ==========================================
    
    function handleNotificationClick(notificationId) {
        console.log('Notification clicked:', notificationId);
        showToast('Notification clicked: ' + notificationId);
        closeNotifications();
    }
    
    function handleMarkAllRead() {
        console.log('Mark all as read');
        showToast('All notifications marked as read');
        closeNotifications();
    }
    
    function handleViewAll() {
        console.log('View all notifications');
        showToast('Viewing all notifications');
        closeNotifications();
    }
    
    // ==========================================
    // INIT
    // ==========================================
    
    function init() {
        console.log('🔔 Parent notification handler initialized');
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeNotifications();
        });
        
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('parent-notification-popup');
            if (popup && popup.classList.contains('show') && !popup.contains(e.target)) {
                closeNotifications();
            }
        });
    }
    
    init();
    
})();