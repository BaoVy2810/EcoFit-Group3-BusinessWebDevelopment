(function() {
    'use strict';
    
    let notificationPopup = null;
    let notificationOverlay = null;
    let currentNotifications = [];
    let headerIframe = null;
    
    window.addEventListener('message', function(event) {
        const data = event.data;
        switch (data.type) {
            case 'IFRAME_READY':
                event.source.postMessage({ type: 'PARENT_READY' }, event.origin);
                headerIframe = event.source;
                break;
                
            case 'BELL_CLICK':
                handleBellClick(data.bellPosition, data.notifications);
                break;
                
            case 'BADGE_UPDATE':
                break;
                
            case 'NOTIFICATION_READ':
                handleNotificationRead(data.notificationId, data.notification);
                break;
                
            case 'MARK_ALL_READ':
                handleMarkAllReadFromIframe();
                break;
                
            case 'VIEW_ALL_NOTIFICATIONS':
                handleViewAllNotificationsFromIframe(data.notifications);
                break;
                
            case 'CLOSE_NOTIFICATIONS':
                closeNotifications();
                break;
        }
    });
    
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
        notificationOverlay = document.createElement('div');
        notificationOverlay.id = 'parent-notification-overlay';
        notificationOverlay.className = 'parent-notification-overlay';
        notificationOverlay.onclick = closeNotifications;
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
        document.getElementById('parent-mark-all-read').addEventListener('click', markAllAsRead);
        document.getElementById('parent-view-all').addEventListener('click', viewAllNotifications);
        
        injectParentStyles();
        renderNotifications();
    }
    
    function injectParentStyles() {
        if (document.getElementById('parent-notification-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'parent-notification-styles';
        style.textContent = `
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
        `;
        
        document.head.appendChild(style);
    }
    
    function positionPopup(bellPosition) {
        if (!notificationPopup) return;
        const popupTop = bellPosition.bottom + 10;
        const popupRight = window.innerWidth - bellPosition.right;
        
        notificationPopup.style.setProperty('top', `${popupTop}px`, 'important');
        notificationPopup.style.setProperty('right', `${popupRight}px`, 'important');
        
        const bellCenter = bellPosition.left + (bellPosition.width / 2);
        const popupLeft = window.innerWidth - popupRight - 380;
        const arrowRight = (popupLeft + 380) - bellCenter - 8;
        
        updateArrowPosition(arrowRight);
    }
    
    function updateArrowPosition(arrowRight) {
        const styleEl = document.getElementById('parent-notification-styles');
        if (styleEl) {
            let styleContent = styleEl.textContent;
            styleContent = styleContent.replace(/#parent-notification-popup\.parent-notification-popup::before\s*\{[^}]+\}/g, '');
            styleContent += `
                #parent-notification-popup.parent-notification-popup::before {
                    right: ${arrowRight}px !important;
                }
            `;
            styleEl.textContent = styleContent;
        }
    }
    
    function showNotifications() {
        if (!notificationPopup || !notificationOverlay) {
            return;
        }
        
        notificationPopup.classList.add('show');
        notificationOverlay.classList.add('show');
        renderNotifications();
    }
    
    function closeNotifications() {
        if (notificationPopup) notificationPopup.classList.remove('show');
        if (notificationOverlay) notificationOverlay.classList.remove('show');
    }
    
    function renderNotifications() {
        const container = document.getElementById('parent-notification-list');
        if (!container) {
            return;
        }
    
        if (currentNotifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <div class="empty-icon">🔔</div>
                    <p class="empty-text">No new notifications</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = currentNotifications.map(notif => `
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
        
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const notificationId = this.getAttribute('data-id');
                markAsRead(notificationId);
            });
        });
        
    }
    
    function markAsRead(notificationId) {
        if (headerIframe) {
            headerIframe.postMessage({
                type: 'NOTIFICATION_READ',
                notificationId: parseInt(notificationId),
                fromParent: true
            }, '*');
        }
    
        
        const notif = currentNotifications.find(n => n.id === parseInt(notificationId));
        if (notif) {
            notif.read = true;
            if (notificationPopup && notificationPopup.classList.contains('show')) {
                renderNotifications();
            }
        }
        
        showToast('Notification marked as read');
        closeNotifications();
    }
    function markAllAsRead() {
        if (headerIframe) {
            headerIframe.postMessage({
                type: 'MARK_ALL_READ',
                fromParent: true
            }, '*');
        }
        
        currentNotifications.forEach(notif => notif.read = true);
        if (notificationPopup && notificationPopup.classList.contains('show')) {
            renderNotifications();
        }
        
        showToast('All notifications marked as read');
        closeNotifications();
    }
    
    function viewAllNotifications() {
        if (headerIframe) {
            headerIframe.postMessage({
                type: 'VIEW_ALL_NOTIFICATIONS',
                fromParent: true
            }, '*');
        }
        
        console.log('View all notifications:', currentNotifications);
        alert('Navigating to notifications page...');
        closeNotifications();
    }
    
    function addNotification(notification) {
        if (headerIframe) {
            headerIframe.postMessage({
                type: 'ADD_NOTIFICATION',
                notification: notification,
                fromParent: true
            }, '*');
        }
        
        const newNotification = {
            id: Date.now(),
            ...notification,
            time: 'Just now',
            read: false
        };
        
        currentNotifications.unshift(newNotification);
        if (notificationPopup && notificationPopup.classList.contains('show')) {
            renderNotifications();
        }
        
        showToast('You have a new notification!');
    }
    
    function handleNotificationRead(notificationId, notification) {
        const notif = currentNotifications.find(n => n.id === notificationId);
        if (notif) {
            notif.read = true;
        }
        
        if (notificationPopup && notificationPopup.classList.contains('show')) {
            renderNotifications();
        }
    }
    
    function handleMarkAllReadFromIframe() {
        currentNotifications.forEach(notif => notif.read = true);
        
        if (notificationPopup && notificationPopup.classList.contains('show')) {
            renderNotifications();
        }
        
        showToast('All notifications marked as read');
    }
    
    function handleViewAllNotificationsFromIframe(notifications) {
        if (notifications) {
            currentNotifications = notifications;
        }
        
        console.log('View all notifications:', currentNotifications);
        alert('Navigating to notifications page...');
    }
    
    function showToast(message) {
        let toast = document.getElementById('parent-notification-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'parent-notification-toast';
            toast.style.cssText = `
                font-family: "Outfit" !important;
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
                pointer-events: none !important;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.setProperty('opacity', '1', 'important');
        
        setTimeout(() => {
            toast.style.setProperty('opacity', '0', 'important');
        }, 2500);
    }
    
    window.ParentNotificationHandler = {
        toggleNotificationPopup: function() {
            const isOpen = notificationPopup && notificationPopup.classList.contains('show');
            
            if (isOpen) {
                closeNotifications();
            } else {
                if (!notificationPopup) {
                    createNotificationPopup();
                }
                notificationPopup.style.setProperty('top', '80px', 'important');
                notificationPopup.style.setProperty('right', '20px', 'important');
                showNotifications();
            }
        },
        closeNotifications,
        markAsRead,
        markAllAsRead,
        viewAllNotifications,
        addNotification,
        getNotifications: () => currentNotifications,
        getUnreadCount: () => currentNotifications.filter(n => !n.read).length
    };
    
    function init() {
        headerIframe = document.querySelector('iframe[src*="header.html"]');
       
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeNotifications();
            }
        });
        
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('parent-notification-popup');
            if (popup && popup.classList.contains('show') && !popup.contains(e.target)) {
                closeNotifications();
            }
        });

        setTimeout(() => {
        addNotification({
            icon: '⭐',
            iconClass: 'gift',
            title: 'New reward points from Parent!',
            message: 'You just received 100 reward points from the parent page.',
            link: '#rewards'
        });
    }, 5000);
}
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 