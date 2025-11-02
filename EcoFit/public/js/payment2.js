document.addEventListener("DOMContentLoaded", () => {
  const paymentInfo = tryParse(localStorage.getItem("paymentInfo"));

  if (!paymentInfo) {
    alert("⚠️ Unable to find payment data. Go back to Payment 1!");
    window.location.href = "../pages/07_PAYMENT1.html";
    return;
  }

  const items = paymentInfo.cart || [];
  const subtotal = safeNumber(paymentInfo.subtotal) || calcSubtotal(items);
  const shipping = safeNumber(paymentInfo.shipping ?? 30000);
  const discount = safeNumber(paymentInfo.discount ?? 0);
  const total = safeNumber(paymentInfo.total) || subtotal + shipping - discount;
  const orderId = paymentInfo.orderId || generateOrderId();

  const orderSpan = document.querySelector(".page-title span");
  if (orderSpan) orderSpan.textContent = `#${orderId}`;

  const deliveryText = document.querySelector(".delivery-text");
  if (deliveryText) {
    if (paymentInfo.customer) {
      const c = paymentInfo.customer;
      deliveryText.innerHTML = `
        ${c.fullname || "-"} | ${c.phone || "-"}<br>
        ${c.address || "-"}
      `;
    } else {
      deliveryText.innerHTML = paymentInfo.address || "- | -<br>-";
    }
  }

  renderOrderItems(items);
  renderOrderSummary(subtotal, shipping, discount, total);

  // Lưu đơn hàng vào lịch sử (nếu cần)
  pushOrderHistory({
    orderId,
    total,
    cart: items,
    address: paymentInfo.address,
  });
});

// ======================= HÀM HỖ TRỢ =======================
function tryParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
}
function safeNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d\-]/g, "");
  return s === "" ? 0 : Number(s);
}
function calcSubtotal(cart) {
  return (cart || []).reduce(
    (s, it) => s + safeNumber(it.price) * Number(it.qty ?? it.quantity ?? 1),
    0
  );
}
function formatNumber(num) {
  return (Number(num) || 0).toLocaleString("vi-VN");
}
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function renderOrderItems(list) {
  const rd = document.querySelector(".order-detail");
  if (!rd) return;
  const normalized = list.map(normalizeItem);
  if (!normalized.length) {
    rd.innerHTML =
      '<p style="text-align:center;padding:20px;color:#999;">No items</p>';
    return;
  }
  let html = '<h3 style="margin-bottom:12px;">ORDER DETAIL</h3>';
  normalized.forEach((item) => {
    html += `
      <div class="order-item"
           style="display:flex;
                  align-items:center;
                  justify-content:space-between;
                  padding:8px 0;
                  border-bottom:1px solid #eee;">
        <div style="display:flex;
                    align-items:center;
                    gap:12px;
                    flex:1;">
          <a href="../pages/04_PRODUCT_Detail.html?id=${escapeHtml(
            item.id || ""
          )}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"
                 style="width:70px;height:70px;object-fit:cover;border-radius:8px;"
                 onerror="this.src='../images/Product_images/default.png'">
          </a>
          <div class="order-item-info" style="flex:1;min-width:0;">
            <h4 style="margin:0;
                      white-space:nowrap;
                      overflow:hidden;
                       text-overflow:ellipsis;
                       font-size:15px;
                       font-weight:600;">
              ${escapeHtml(item.name)}
            </h4>
            <p style="margin:2px 0;
                      color:#666;
                      font-size:14px;">
              Color: ${escapeHtml(item.color)} | Size: ${escapeHtml(item.size)}
            </p>
            <span style="font-weight:500;
                          font-size:14px;">
              ${formatNumber(item.price)}đ
            </span>
          </div>
        </div>
        <span style="min-width:40px;
                    text-align:right;
                    font-weight:600;
                    color:#333;
                    font-size:14px;">x${item.qty}</span>
      </div>`;
  });
  rd.innerHTML =
    html +
    '<hr style="border:none;border-top:1px solid #ccc;margin-top:10px;">';
}
function renderOrderSummary(subtotal, shipping, discount, total) {
  document.querySelector(".subtotal").textContent =
    formatNumber(subtotal) + "đ";
  document.querySelector(".shipping").textContent =
    formatNumber(shipping) + "đ";
  document.querySelector(".discount").textContent = discount
    ? `-${formatNumber(discount)}đ`
    : "0đ";
  document.querySelector(".total-value").textContent =
    formatNumber(total) + "đ";
}
function normalizeItem(it) {
  const qty = Number(it.qty ?? it.quantity ?? 1);
  const price = safeNumber(it.price ?? 0);
  return {
    id: it.id || "",
    name: it.name || "Unknown",
    qty,
    price,
    color: it.color || "",
    size: it.size || "",
    image: it.image || "../images/Product_images/default.png",
  };
}
function generateOrderId() {
  return "ORDER_" + Math.floor(1000 + Math.random() * 9000);
}
function pushOrderHistory(paymentData) {
  try {
    const hist = tryParse(localStorage.getItem("orders")) || [];
    hist.push({
      orderId: paymentData.orderId,
      total: paymentData.total,
      items: paymentData.cart,
      address: paymentData.address,
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem("orders", JSON.stringify(hist));
  } catch (e) {
    console.warn(e);
  }
}
