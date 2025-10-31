(function() {
    'use strict';

    const CONFIG = {
        isInIframe: window.self !== window.top,
        parentOrigin: '*', 
        debug: true
    };
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
    function sendToParent(message) {
        if (CONFIG.isInIframe && window.parent) {
            window.parent.postMessage(message, CONFIG.parentOrigin);
        }
    }
    function handleParentMessage(event) {
    const data = event.data;
    
    switch (data.type) {
        case 'PARENT_READY':
            updateBadge();
            break;
            
        case 'UPDATE_BADGE':
            updateBadge();
            break;
            
        case 'ADD_NOTIFICATION':
            addNotification(data.notification);
            break;
            
        case 'NOTIFICATION_READ':
            if (data.fromParent) {
                markAsRead(data.notificationId);
            }
            break;
            
        case 'MARK_ALL_READ':
            if (data.fromParent) {
                markAllAsRead();
            }
            break;
            
        case 'VIEW_ALL_NOTIFICATIONS':
            if (data.fromParent) {
                viewAllNotifications();
            }
            break;
        }
    }
    function createNotificationPopup() {
        if (CONFIG.isInIframe) {
            return;
        }
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
        
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        // Add styles
        injectStyles();
    }

    function injectStyles() {
        if (CONFIG.isInIframe || document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            /* ===================================
               OVERLAY - Always on top layer
               =================================== */
            #notification-overlay.notification-overlay {
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
            
            #notification-overlay.notification-overlay.show {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
            
            /* ===================================
               POPUP - Highest z-index possible
               =================================== */
            #notification-popup.notification-popup {
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
            
            #notification-popup.notification-popup.show {
                opacity: 1 !important;
                visibility: visible !important;
                transform: translateY(0) !important;
            }
            
            /* ===================================
               ARROW - Points to bell icon
               =================================== */
            #notification-popup.notification-popup::before {
                content: '' !important;
                position: absolute !important;
                top: -8px !important;
                width: 16px !important;
                height: 16px !important;
                background: white !important;
                transform: rotate(45deg) !important;
                box-shadow: -3px -3px 8px rgba(0,0,0,0.08) !important;
                z-index: -1 !important;
                right: 20px !important;
            }
            
            #notification-popup.notification-popup::after {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 16px !important;
                background: white !important;
                z-index: 1 !important;
            }
            
            /* ===================================
               POPUP HEADER
               =================================== */
            #notification-popup .popup-header {
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
            
            #notification-popup .popup-title {
                font-size: 20px !important;
                font-weight: 700 !important;
                color: #212529 !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1.2 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #notification-popup .mark-all-read {
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
            
            #notification-popup .mark-all-read:hover {
                background: #f1f8f5 !important;
            }
            
            /* ===================================
               NOTIFICATION LIST
               =================================== */
            #notification-popup .notification-list {
                max-height: 400px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                list-style: none !important;
            }
            
            #notification-popup .notification-item {
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
            
            #notification-popup .notification-item:hover {
                background: #f8f9fa !important;
            }
            
            #notification-popup .notification-item.unread {
                background: #f1f8f5 !important;
            }
            
            #notification-popup .notification-item.unread::before {
                content: '' !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                bottom: 0 !important;
                width: 3px !important;
                background: #69BD76 !important;
            }
            
            #notification-popup .notification-icon {
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
            
            #notification-popup .notification-icon.gift {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important;
            }
            
            #notification-popup .notification-icon.shop {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
            }
            
            #notification-popup .notification-icon.delivery {
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
            }
            
            #notification-popup .notification-icon.info {
                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important;
            }
            
            #notification-popup .notification-content {
                flex: 1 !important;
                margin: 0 !important;
                padding: 0 !important;
                min-width: 0 !important;
            }
            
            #notification-popup .notification-title {
                font-size: 15px !important;
                font-weight: 600 !important;
                color: #212529 !important;
                margin: 0 0 4px 0 !important;
                padding: 0 !important;
                line-height: 1.4 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #notification-popup .notification-message {
                font-size: 14px !important;
                color: #6c757d !important;
                line-height: 1.5 !important;
                margin: 0 0 6px 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            #notification-popup .notification-time {
                font-size: 12px !important;
                color: #adb5bd !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* ===================================
               EMPTY STATE
               =================================== */
            #notification-popup .empty-notifications {
                padding: 60px 20px !important;
                text-align: center !important;
                margin: 0 !important;
            }
            
            #notification-popup .empty-icon {
                font-size: 60px !important;
                margin: 0 0 15px 0 !important;
                opacity: 0.3 !important;
                padding: 0 !important;
            }
            
            #notification-popup .empty-text {
                font-size: 16px !important;
                color: #adb5bd !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* ===================================
               POPUP FOOTER
               =================================== */
            #notification-popup .popup-footer {
                padding: 15px 20px !important;
                border-top: 1px solid #e9ecef !important;
                text-align: center !important;
                background: white !important;
                margin: 0 !important;
            }
            
            #notification-popup .view-all-btn {
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
            
            #notification-popup .view-all-btn:hover {
                background: #f1f8f5 !important;
            }
            
            /* ===================================
               SCROLLBAR STYLING
               =================================== */
            #notification-popup .notification-list::-webkit-scrollbar {
                width: 6px !important;
            }
            
            #notification-popup .notification-list::-webkit-scrollbar-track {
                background: #f8f9fa !important;
            }
            
            #notification-popup .notification-list::-webkit-scrollbar-thumb {
                background: #dee2e6 !important;
                border-radius: 10px !important;
            }
            
            #notification-popup .notification-list::-webkit-scrollbar-thumb:hover {
                background: #ced4da !important;
            }
            
            /* ===================================
               TOAST NOTIFICATION
               =================================== */
            #notification-toast {
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
                font-family: "Outfit" !important;
                pointer-events: none !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    function positionPopup() {
        if (CONFIG.isInIframe) return;
        
        const bellButton = document.getElementById('bell-button');
        const popup = document.getElementById('notification-popup');
        
        if (!bellButton || !popup) return;
        
        // Get bell button position
        const bellRect = bellButton.getBoundingClientRect();
        
        // Calculate popup position
        const popupTop = bellRect.bottom + 10; // 10px gap below bell
        const popupRight = window.innerWidth - bellRect.right;
        
        // Calculate arrow position (center of bell button)
        const bellCenter = bellRect.left + (bellRect.width / 2);
        const popupLeft = window.innerWidth - popupRight - popup.offsetWidth;
        const arrowRight = (popupLeft + popup.offsetWidth) - bellCenter - 8; // 8px = half of arrow width
        
        // Apply positions
        popup.style.setProperty('top', `${popupTop}px`, 'important');
        popup.style.setProperty('right', `${popupRight}px`, 'important');
        
        // Update arrow position dynamically
        const styleEl = document.getElementById('notification-styles');
        if (styleEl) {
            // Remove old arrow style if exists
            let styleContent = styleEl.textContent;
            styleContent = styleContent.replace(/right:\s*\d+px\s*!important;/g, '');
            
            // Add new arrow position
            styleContent += `
                #notification-popup.notification-popup::before {
                    right: ${arrowRight}px !important;
                }
            `;
            styleEl.textContent = styleContent;
        }
    }

    function toggleNotifications() {
        if (CONFIG.isInIframe) {
            // Gửi thông tin đến parent
            const bellButton = document.getElementById('bell-button');
            if (bellButton) {
                const rect = bellButton.getBoundingClientRect();
                const iframeRect = document.body.getBoundingClientRect();
                
                sendToParent({
                    type: 'BELL_CLICK',
                    bellPosition: {
                        top: rect.top + iframeRect.top,
                        right: rect.right + iframeRect.left,
                        bottom: rect.bottom + iframeRect.top,
                        left: rect.left + iframeRect.left,
                        width: rect.width,
                        height: rect.height
                    },
                    notifications: notifications, // Gửi cả dữ liệu notifications
                    unreadCount: notifications.filter(n => !n.read).length
                });
            }
            return;
        }
        
        // Chế độ standalone
        const popup = document.getElementById('notification-popup');
        const overlay = document.getElementById('notification-overlay');
        
        if (!popup) {
            createNotificationPopup();
            setTimeout(() => {
                toggleNotifications();
            }, 50);
            return;
        }
        
        const isOpen = popup.classList.contains('show');
        
        if (isOpen) {
            closeNotifications();
        } else {
            positionPopup();
            
            requestAnimationFrame(() => {
                popup.classList.add('show');
                overlay.classList.add('show');
                renderNotifications();
            });
        }
    }

    function closeNotifications() {
        if (CONFIG.isInIframe) {
            sendToParent({ type: 'CLOSE_NOTIFICATIONS' });
            return;
        }
        
        const popup = document.getElementById('notification-popup');
        const overlay = document.getElementById('notification-overlay');
        
        if (popup) popup.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }

    function renderNotifications() {
        if (CONFIG.isInIframe) {
            updateBadge();
            return;
        }
        
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

    function markAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            
            if (CONFIG.isInIframe) {
                sendToParent({ 
                    type: 'NOTIFICATION_READ', 
                    notificationId: id,
                    notification: notification
                });
            }
            
            renderNotifications();
           
            if (notification.link && !CONFIG.isInIframe) {
                // console.log('Navigate to:', notification.link);
            }
        }
    }

    function markAllAsRead() {
        notifications.forEach(notif => notif.read = true);
        
        if (CONFIG.isInIframe) {
            sendToParent({ type: 'MARK_ALL_READ' });
        }
        
        renderNotifications();
        
        if (!CONFIG.isInIframe) {
            showToast('All notifications marked as read');
        }
    }

    function updateBadge() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.querySelector('#bell-button .badge');
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.setProperty('display', 'flex', 'important');
            } else {
                badge.style.setProperty('display', 'none', 'important');
            }
        }
        
        // Gửi thông tin badge đến parent nếu đang trong iframe
        if (CONFIG.isInIframe) {
            sendToParent({ 
                type: 'BADGE_UPDATE', 
                unreadCount: unreadCount 
            });
        }
    }

    function viewAllNotifications() {
        if (CONFIG.isInIframe) {
            sendToParent({ 
                type: 'VIEW_ALL_NOTIFICATIONS',
                notifications: notifications
            });
            return;
        }
        
        alert('Navigating to notifications page...');
        closeNotifications();
    }

    function showToast(message) {
        if (CONFIG.isInIframe) return;
        
        let toast = document.getElementById('notification-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'notification-toast';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.setProperty('opacity', '1', 'important');
        
        setTimeout(() => {
            toast.style.setProperty('opacity', '0', 'important');
        }, 2500);
    }

    function addNotification(notification) {
        notifications.unshift({
            id: Date.now(),
            ...notification,
            time: 'Just now',
            read: false
        });
        
        updateBadge();
        
        if (!CONFIG.isInIframe) {
            showToast('You have a new notification!');
        }
    }
    
    function initEventListeners() {
        // Click bell button
        const bellButton = document.getElementById('bell-button');
        if (bellButton) {
            // Xóa event listeners cũ nếu có
            bellButton.replaceWith(bellButton.cloneNode(true));
            const newBellButton = document.getElementById('bell-button');
            
            newBellButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleNotifications();
            });
        }
        
        // Chỉ thêm các event listeners khác khi không phải iframe
        if (!CONFIG.isInIframe) {
            // Close on Escape key
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
                    bellButton && !bellButton.contains(e.target)) {
                    closeNotifications();
                }
            });
            
            // Reposition on window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const popup = document.getElementById('notification-popup');
                    if (popup && popup.classList.contains('show')) {
                        positionPopup();
                    }
                }, 100);
            });
            
            // Reposition on scroll
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const popup = document.getElementById('notification-popup');
                    if (popup && popup.classList.contains('show')) {
                        positionPopup();
                    }
                }, 100);
            }, { passive: true });
        }
        
        // Lắng nghe message từ parent (chỉ khi trong iframe)
        if (CONFIG.isInIframe) {
            window.addEventListener('message', handleParentMessage);
        }
    }
    
    function init() {
        if (!CONFIG.isInIframe) {
            createNotificationPopup();
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initEventListeners();
                updateBadge();
                
                if (CONFIG.isInIframe) {
                    setTimeout(() => {
                        sendToParent({ type: 'IFRAME_READY' });
                    }, 100);
                }
            });
        } else {
            initEventListeners();
            updateBadge();
            if (CONFIG.isInIframe) {
                setTimeout(() => {
                    sendToParent({ type: 'IFRAME_READY' });
                }, 100);
            }
        }
        
        // Demo: Add notification after 5 seconds (chỉ khi không phải iframe)
        if (!CONFIG.isInIframe) {
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
    }

    window.NotificationSystem = {
        init,
        toggleNotifications,
        closeNotifications,
        markAsRead,
        markAllAsRead,
        viewAllNotifications,
        addNotification,
        notifications,
        updateBadge,
        getUnreadCount: () => notifications.filter(n => !n.read).length
    };

    init();

})();