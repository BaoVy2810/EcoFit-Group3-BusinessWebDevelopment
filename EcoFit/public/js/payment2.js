document.addEventListener("DOMContentLoaded", () => {
  const paymentInfo = getData("paymentInfo");

  if (!paymentInfo) {
    alert("Không tìm thấy thông tin đơn hàng. Vui lòng quay lại trang thanh toán.");
    window.location.href = "../pages/07_PAYMENT1.html";
    return;
  }

  // 1️⃣ Mã đơn hàng
  const orderTitle = document.querySelector(".page-title span");
  if (orderTitle) {
    orderTitle.textContent = `#${paymentInfo.orderId || "0000"}`;
  }

  // 2️⃣ Địa chỉ giao hàng
  const deliveryText = document.querySelector(".delivery-text");
  if (deliveryText) {
    deliveryText.innerHTML =
      paymentInfo.userInfo?.address ||
      "No address information. Please enter in Checkout page.";
  }

  // 3️⃣ Danh sách sản phẩm
  const orderDetail = document.querySelector(".order-detail");
  if (orderDetail && paymentInfo.cart && paymentInfo.cart.length > 0) {
    const itemsHTML = paymentInfo.cart
      .map((item) => `
          <div class="order-item">
            <img src="${item.image || "../images/Product_images/organic_cotton_tee.png"}" alt="">
            <div class="order-item-info">
              <h4>${item.name}</h4>
              <p>Color: ${item.color || "-"} | Size: ${item.size || "-"}</p>
              <span class="order-item-price">${formatNumber(item.price)}</span>
            </div>
            <span class="order-item-qty">x${item.qty}</span>
          </div>
        `)
      .join("");

    orderDetail.innerHTML = `<h3>ORDER DETAIL</h3>${itemsHTML}<hr />`;
  } else {
    orderDetail.innerHTML = "<p>Không có sản phẩm nào trong đơn hàng.</p>";
  }

  // 4️⃣ Tóm tắt đơn hàng
  const summary = document.querySelector(".order-summary");
  if (summary) {
    summary.innerHTML = `
      <h3>ORDER SUMMARY</h3>
      <div class="summary-item"><span>Subtotal Product</span><span>${formatNumber(paymentInfo.subtotal || 0)}</span></div>
      <div class="summary-item"><span>Shipping Cost</span><span>${formatNumber(paymentInfo.shipping || 0)}</span></div>
      <div class="summary-item"><span>Discount</span><span>-${formatNumber(paymentInfo.discount || 0)}</span></div>
      <hr />
      <div class="total"><span>Total</span><span>${formatNumber(paymentInfo.total || 0)}</span></div>
    `;
  }

  // 5️⃣ Thanh tiến trình
  const progress = document.querySelector(".order-progress");
  if (progress) {
    progress.setAttribute("data-step", "2");
  }

  // 6️⃣ Lưu lịch sử đơn hàng
  saveOrderHistory(paymentInfo);

  // 7️⃣ Hiển thị ảnh minh chứng thanh toán
  const proofContainer = document.querySelector(".payment-proof");
  if (proofContainer && paymentInfo.proofImage) {
    proofContainer.innerHTML = `
      <h3>PAYMENT PROOF</h3>
      <img src="${paymentInfo.proofImage}" alt="Payment proof" class="proof-img" style="max-width:200px; border-radius:8px; margin-top:8px;">
    `;
  }

  // Xoá paymentInfo sau khi lưu để tránh trùng đơn
  localStorage.removeItem("paymentInfo");
});

// -------------------------------
// 🔧 Hàm hỗ trợ
// -------------------------------
function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Lỗi đọc localStorage:", e);
    return null;
  }
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString("vi-VN");
}

function saveOrderHistory(order) {
  try {
    const allOrders = JSON.parse(localStorage.getItem("orders")) || [];
    const exists = allOrders.some((o) => o.orderId === order.orderId);
    if (!exists) {
      allOrders.push({
        orderId: order.orderId,
        date: new Date().toLocaleString("vi-VN"),
        total: order.total,
        address: order.userInfo?.address || "",
        items: order.cart,
        status: "Confirmed",
      });
      localStorage.setItem("orders", JSON.stringify(allOrders));
    }
  } catch (e) {
    console.warn("Không thể lưu lịch sử đơn hàng:", e);
  }
}
