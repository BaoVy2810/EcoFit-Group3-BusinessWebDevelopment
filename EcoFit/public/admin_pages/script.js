/* Cập nhật hiển thị tăng trưởng cho các chỉ số trên dashboard admin */

function updateGrowthDisplay(idPrefix, growthValue, label) {
  const growthEl = document.getElementById(`${idPrefix}-growth`);
  const iconEl = document.getElementById(`${idPrefix}-icon`);
  const noteEl = document.getElementById(`${idPrefix}-note`);

  let iconName = "";
  let color = "";
  let message = "";

  if (growthValue > 0) {
    iconName = "trending-up";
    color = "text-green-600";
    message = `${label} tăng ${growthValue}% so với kỳ trước.`;
  } else if (growthValue < 0) {
    iconName = "trending-down";
    color = "text-red-600";
    message = `${label} giảm ${Math.abs(growthValue)}% so với kỳ trước.`;
  } else {
    iconName = "minus";
    color = "text-gray-500";
    message = `${label} không thay đổi so với kỳ trước.`;
  }

  // Cập nhật text & màu
  growthEl.textContent = `${growthValue}%`;
  growthEl.className = color;

  // Cập nhật icon Lucide
  iconEl.innerHTML = `<i data-lucide="${iconName}" class="${color} w-4 h-4"></i>`;
  lucide.createIcons(); // render lại icon

  // Cập nhật ghi chú
  noteEl.textContent = message;
}