
function checkAuthentication() {  
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole = localStorage.getItem('userRole');  
  const isDataLoaded = window.DataManager.isDataLoaded();

  if (!isLoggedIn || userRole !== 'administrator') {
    alert('Please login as administrator to access this page.');
    window.location.href = '../pages/00_LOGIN.html';
    return false;
  }

  if (!isDataLoaded) {
    console.error('❌ Data not loaded! Redirecting to login...');
    alert('Session expired. Please login again.');
    handleLogout();
    return false;
  }

  // Display user info
  const userName = localStorage.getItem('userName');
  if (userName) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = userName;
    }
  }

  console.log('✅ Authentication check passed');
  return true;
}

// ==================== LOGOUT HANDLER ====================
function handleLogout() {
  const confirmLogout = confirm('Are you sure you want to logout?');

  if (confirmLogout) {
    console.log('🚪 Logging out...');
    
    // Clear all data using DataManager
    window.DataManager.clearAllData();
    
    // Clear authentication info
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
    console.log('✅ Logout successful');
    window.location.href = '../pages/00_LOGIN.html';
  }
}

// ==================== MONTHLY GROWTH CALCULATION ====================
function applyMonthlyGrowth(idPrefix, data, dateField, filterFunc = null) {
  if (!Array.isArray(data) || data.length === 0) return;

  const filteredData = typeof filterFunc === "function" ? data.filter(filterFunc) : data;

  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const currentYear = now.getFullYear();

  // Số lượng tháng hiện tại
  const currentCount = filteredData.filter(item => {
    const d = new Date(item[dateField]);
    return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Số lượng tháng trước
  const previousCount = filteredData.filter(item => {
    const d = new Date(item[dateField]);
    if (isNaN(d)) return false;
    const prevYear = previousMonth === 11 ? currentYear - 1 : currentYear;
    return d.getMonth() === previousMonth && d.getFullYear() === prevYear;
  }).length;

  // Tính growth %
  let growthValue;
  if (previousCount === 0) growthValue = currentCount === 0 ? 0 : 100;
  else if ((previousCount - currentCount) === 0) growthValue = 0;
  else growthValue = Number(((currentCount - previousCount) / previousCount * 100).toFixed(1));

  const absGrowth = Math.abs(growthValue);

  let iconName, addClass;
  if (growthValue > 0) {
    iconName = "trending-up";
    addClass = "text-green-600";
  } else if (growthValue < 0) {
    iconName = "trending-down";
    addClass = "text-red-600";
  } else {
    iconName = "move-right";
    addClass = "text-gray-500";
  }

  // Cập nhật phần tử hiển thị %
  const growthEl = document.getElementById(`${idPrefix}-growth`);
  if (growthEl) {
    growthEl.textContent = `${absGrowth}%`;
    growthEl.classList.remove("text-green-600", "text-red-600", "text-gray-500");
    growthEl.classList.add(addClass);
  }

  // Cập nhật icon
  const statGrowthParent = growthEl ? growthEl.closest(".stat-growth") : null;
  if (statGrowthParent) {
    const iconEl = statGrowthParent.querySelector('i[data-lucide]');
    if (iconEl) {
      iconEl.setAttribute("data-lucide", iconName);
      iconEl.classList.remove("text-green-600", "text-red-600", "text-gray-500");
      iconEl.classList.add(addClass);
    }
  }

  // Render lại Lucide icons
  if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();

  return growthValue;
}

// ==================== UTILITY FUNCTIONS ====================

// Chuyển chuỗi về dạng thường, tránh lỗi khi tìm kiếm
function safeLower(text) {
  return (text || "").toString().toLowerCase();
}

// Hàm lọc dữ liệu dùng chung
function filterData(dataArray, searchInputId, filterSelectId, keyFields = []) {
  const searchInput = document.getElementById(searchInputId);
  const filterSelect = document.getElementById(filterSelectId);

  if (!searchInput || !filterSelect) return dataArray;

  const searchValue = safeLower(searchInput.value);
  const filterValue = filterSelect.value;

  return dataArray.filter((item) => {
    const matchSearch =
      keyFields.length === 0 ||
      keyFields.some((key) => safeLower(item[key]).includes(searchValue));

    const matchFilter =
      filterValue === "all" ||
      Object.values(item).some((val) => safeLower(val) === safeLower(filterValue));

    return matchSearch && matchFilter;
  });
}

// Render table với template
function renderTable(dataArray, tbodySelector, templateRowSelector, mappingFn) {
  const tbody = document.querySelector(tbodySelector);
  const template = document.querySelector(templateRowSelector);

  if (!tbody || !template) return;

  const templateClone = template.cloneNode(true);

  // Xóa tất cả rows trừ template
  const allRows = tbody.querySelectorAll('tr');
  allRows.forEach(row => {
    if (!row.classList.contains('template')) {
      row.remove();
    }
  });

  // Render dữ liệu mới
  dataArray.forEach((item) => {
    const row = templateClone.cloneNode(true);
    row.classList.remove('template');
    row.style.display = "";
    mappingFn(row, item);
    tbody.appendChild(row);
  });

  // Reinitialize Lucide icons
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ==================== CRUD HANDLERS ====================

// Xóa item (dùng chung cho accounts và products)
function deleteItem(itemId, dataKey, idField = 'id') {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }

  try {
    const data = window.DataManager.getData(dataKey);
    if (!data) {
      alert('No data found!');
      return;
    }

    const dataArray = data.profile || data.product;
    const filteredData = dataArray.filter(item => {
      const currentId = item[idField] || item.profile_id || item.product_id;
      return currentId !== itemId;
    });

    if (data.profile) {
      data.profile = filteredData;
    } else {
      data.product = filteredData;
    }
    
    window.DataManager.saveData(dataKey, data);

    alert('Item deleted successfully!');
    location.reload();

  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item!');
  }
}

// Mở modal edit
function openEditModal(itemId, dataKey, idField = 'id') {
  try {
    const data = window.DataManager.getData(dataKey);
    if (!data) {
      alert('No data found!');
      return;
    }

    const dataArray = data.profile || data.product;
    const item = dataArray.find(i => {
      const currentId = i[idField] || i.profile_id || i.product_id;
      return currentId === itemId;
    });

    if (!item) {
      alert('Item not found!');
      return;
    }

    sessionStorage.setItem('editItemId', itemId);
    sessionStorage.setItem('editStorageKey', dataKey);

    if (dataKey === 'accounts') {
      window.location.href = `edit_account.html?id=${itemId}`;
    } else if (dataKey === 'products') {
      window.location.href = `edit_product.html?id=${itemId}`;
    }

  } catch (error) {
    console.error('Error opening edit modal:', error);
    alert('Failed to open edit form!');
  }
}

// ==================== INITIALIZATION ====================
/*window.addEventListener('DOMContentLoaded', () => {
  // Check authentication trên mọi trang admin
  if (window.location.pathname.includes('/admin_pages/')) {
    checkAuthentication();
  }
  
  // Initialize Lucide icons
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }

  console.log('📊 Data load info:', window.DataManager.getDataLoadInfo());
});*/

function handleLogout() {
  const confirmLogout = confirm('Are you sure you want to logout?');

  if (confirmLogout) {
    // Xóa tất cả dữ liệu trong localStorage
    localStorage.clear();

        window.location.href = '../pages/00_LOGIN.html';
  }
}