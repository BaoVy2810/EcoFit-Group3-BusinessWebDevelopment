
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

  // Chỉ dùng giá trị growth tuyệt đối để hiển thị số
  const absGrowth = Math.abs(growthValue);

  if (growthValue > 0) {
    iconName = "trending-up";
    addClass = "text-green-600";
  } else if (growthValue < 0) {
    iconName = "trending-down";
    addClass = "text-red-600";
  } else if (growthValue==0) {
    iconName = "move-right";
    addClass = "text-gray-500";
  }


  // Cập nhật phần tử hiển thị %
  const growthEl = document.getElementById(`${idPrefix}-growth`);
  if (growthEl) {
    growthEl.textContent = `${absGrowth}%`; // chỉ hiện số tuyệt đối
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

// 🧠 Utility: chuyển chuỗi về dạng thường, tránh lỗi khi tìm kiếm
function safeLower(text) {
  return (text || "").toString().toLowerCase();
}

// 🔍 Hàm lọc dữ liệu dùng chung
function filterData(dataArray, searchInputId, filterSelectId, keyFields = []) {
  const searchInput = document.getElementById(searchInputId);
  const filterSelect = document.getElementById(filterSelectId);

  if (!searchInput || !filterSelect) return dataArray;

  const searchValue = safeLower(searchInput.value);
  const filterValue = filterSelect.value;

  return dataArray.filter((item) => {
    // Tìm kiếm trong các trường (keyFields)
    const matchSearch =
      keyFields.length === 0 ||
      keyFields.some((key) => safeLower(item[key]).includes(searchValue));

    // Lọc theo loại (role / status / category / v.v)
    const matchFilter =
      filterValue === "all" ||
      Object.values(item).some((val) => safeLower(val) === safeLower(filterValue));

    return matchSearch && matchFilter;
  });
}

function renderTable(dataArray, tbodySelector, templateRowSelector, mappingFn) {
  const tbody = document.querySelector(tbodySelector);
  const template = document.querySelector(templateRowSelector);

  if (!tbody || !template) return;

  // LƯU TEMPLATE TRƯỚC KHI XÓA
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
    row.classList.remove('template'); // Xóa class template khỏi row mới
    row.style.display = ""; // Hiện dòng ra
    mappingFn(row, item);
    tbody.appendChild(row);
  });

  // Reinitialize Lucide icons
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ==================== CRUD HANDLER - COMMON SCRIPT ====================
// File: crud-handler.js

// Hàm xóa item (dùng chung cho accounts và products)
function deleteItem(itemId, storageKey, idField = 'id') {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }

  try {
    // Đọc dữ liệu từ localStorage
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      alert('No data found!');
      return;
    }

    const data = JSON.parse(storedData);
    const dataArray = data.profile || data.product; // accounts có profile, products có product

    // Lọc bỏ item cần xóa
    const filteredData = dataArray.filter(item => {
      const currentId = item[idField] || item.profile_id || item.product_id;
      return currentId !== itemId;
    });

    // Cập nhật lại localStorage
    if (data.profile) {
      data.profile = filteredData;
    } else {
      data.product = filteredData;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(data));

    // Reload trang để cập nhật UI
    alert('Item deleted successfully!');
    location.reload();

  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item!');
  }
}

// Hàm mở modal edit (dùng chung)
function openEditModal(itemId, storageKey, idField = 'id') {
  try {
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      alert('No data found!');
      return;
    }

    const data = JSON.parse(storedData);
    const dataArray = data.profile || data.product;

    // Tìm item cần edit
    const item = dataArray.find(i => {
      const currentId = i[idField] || i.profile_id || i.product_id;
      return currentId === itemId;
    });

    if (!item) {
      alert('Item not found!');
      return;
    }

    // Lưu itemId vào sessionStorage để sử dụng khi save
    sessionStorage.setItem('editItemId', itemId);
    sessionStorage.setItem('editStorageKey', storageKey);

    // Điều hướng đến trang edit tương ứng
    if (storageKey === 'accounts') {
      window.location.href = `edit_account.html?id=${itemId}`;
    } else if (storageKey === 'products') {
      window.location.href = `edit_product.html?id=${itemId}`;
    }

  } catch (error) {
    console.error('Error opening edit modal:', error);
    alert('Failed to open edit form!');
  }
}