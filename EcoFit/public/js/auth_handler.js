// ==========================================
// AUTH_HANDLER.JS - Quản lý Authentication toàn hệ thống
// ==========================================

/**
 * Lưu thông tin user vào localStorage
 */
function saveUserSession(user, loginMethod = 'regular') {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', user.fullname);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userId', user.profile_id);
  localStorage.setItem('loginMethod', loginMethod);
  localStorage.setItem('userPhone', user.phone || '');
  localStorage.setItem('userGender', user.gender || '');
  localStorage.setItem('userDob', user.dob || '');
  localStorage.setItem('userAddress', user.address || '');
  localStorage.setItem('greenScore', user.green_score || '0');
  
  console.log('✅ User session saved to localStorage');
}

/**
 * Lấy thông tin user từ localStorage
 */
function getUserSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return null;
  }
  
  return {
    isLoggedIn: true,
    role: localStorage.getItem('userRole'),
    fullname: localStorage.getItem('userName'),
    email: localStorage.getItem('userEmail'),
    profile_id: localStorage.getItem('userId'),
    loginMethod: localStorage.getItem('loginMethod'),
    phone: localStorage.getItem('userPhone'),
    gender: localStorage.getItem('userGender'),
    dob: localStorage.getItem('userDob'),
    address: localStorage.getItem('userAddress'),
    green_score: localStorage.getItem('greenScore')
  };
}

/**
 * Xóa session user (Logout)
 */
function clearUserSession() {
  const keysToRemove = [
    'isLoggedIn',
    'userRole', 
    'userName',
    'userEmail',
    'userId',
    'loginMethod',
    'userPhone',
    'userGender',
    'userDob',
    'userAddress',
    'greenScore'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🔓 User session cleared');
}

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
function isUserLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Load header phù hợp dựa trên trạng thái đăng nhập
 */
function loadAppropriateHeader(headerElementId = 'header-frame') {
  const headerElement = document.getElementById(headerElementId);
  if (!headerElement) {
    console.error('❌ Header element not found:', headerElementId);
    return;
  }
  
  const isLoggedIn = isUserLoggedIn();
  const headerPath = isLoggedIn ? '../template/header.html' : '../template/header0.html';
  
  headerElement.src = headerPath;
  console.log(`📄 Loading header: ${headerPath}`);
  
  return headerElement;
}

/**
 * Redirect user sau khi đăng nhập
 */
function redirectAfterLogin(user) {
  console.log('🔄 Redirecting user...');
  console.log('User role:', user.role);
  
  setTimeout(() => {
    if (user.role === 'administrator') {
      const adminUrl = '../admin_pages/dashboard.html';
      console.log('➡ Redirecting to:', adminUrl);
      window.location.href = adminUrl;
    } else if (user.role === 'customer') {
      const homeUrl = '../pages/01_HOMEPAGE.html';
      console.log('➡ Redirecting to:', homeUrl);
      window.location.href = homeUrl;
    } else {
      alert('Unknown user role: ' + user.role);
    }
  }, 1000);
}

/**
 * Xử lý logout
 */
function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    clearUserSession();
    
    // Clear remember me nếu cần
    if (localStorage.getItem('rememberMe') !== 'true') {
      localStorage.removeItem('savedEmail');
    }
    
    alert('Đã đăng xuất thành công! 👋');
    window.location.href = '../pages/00_LOGIN.html';
  }
}

/**
 * Initialize authentication system cho mỗi page
 */
function initAuth(activeNavId = null) {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auth system initialized');
    
    // Load header phù hợp
    const headerElement = loadAppropriateHeader();
    
    // Set active nav nếu có
    if (headerElement && activeNavId) {
      headerElement.onload = () => {
        headerElement.contentWindow.postMessage({ activeNav: activeNavId }, '*');
      };
    }
    
    // Lắng nghe các message từ header
    setupMessageListeners();
  });
}

/**
 * Setup message listeners cho các sự kiện từ header
 */
function setupMessageListeners() {
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.action) return;
    
    const { action, query } = e.data;
    
    switch(action) {
      case 'goToLogin':
        window.location.href = '../pages/00_LOGIN.html';
        break;
        
      case 'goToSignup':
        window.location.href = '../pages/00_SIGNUP.html';
        break;
        
      case 'loginSuccess':
      case 'loggedIn':
        // Reload header sau khi login thành công
        loadAppropriateHeader();
        break;
        
      case 'logout':
        handleLogout();
        break;
        
      case 'search':
        if (query && query.trim()) {
          window.location.href = `../pages/03_PRODUCT_SearchFilter.html?q=${encodeURIComponent(query.trim())}`;
        }
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Export functions to global scope
 */
if (typeof window !== 'undefined') {
  window.AuthHandler = {
    saveUserSession,
    getUserSession,
    clearUserSession,
    isUserLoggedIn,
    loadAppropriateHeader,
    redirectAfterLogin,
    handleLogout,
    initAuth,
    isValidEmail
  };
}