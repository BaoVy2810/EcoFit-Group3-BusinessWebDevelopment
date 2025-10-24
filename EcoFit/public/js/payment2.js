document.addEventListener('DOMContentLoaded', () => {
  // ---------------- đọc dữ liệu từ localStorage ----------------
  const paymentInfo = tryParse(localStorage.getItem('paymentInfo'));
  const checkoutOrder = tryParse(localStorage.getItem('checkoutOrder'));
  const checkoutCart = tryParse(localStorage.getItem('checkoutCart'));
  const checkoutSummary = tryParse(localStorage.getItem('checkoutSummary'));

  if (!paymentInfo) {
    alert("⚠️ Không tìm thấy dữ liệu thanh toán. Quay lại Payment 1 nhé!");
    window.location.href = "../pages/07_PAYMENT1.html";
    return;
  }

  // ---------------- chuẩn bị dữ liệu ----------------
  const items = paymentInfo.cart || [];
  const customer = (checkoutOrder && checkoutOrder.customer) || {};
  const subtotal = safeNumber(paymentInfo.subtotal) || calcSubtotal(items);
  const shipping = safeNumber(paymentInfo.shipping || 30000);
  const discount = safeNumber(paymentInfo.discount || 0);
  const total = safeNumber(paymentInfo.total) || subtotal + shipping - discount;
  const orderId = paymentInfo.orderId || generateOrderId();

  // ---------------- hiển thị thông tin đơn hàng ----------------
  // Mã đơn hàng
  const orderSpan = document.querySelector(".page-title span");
  if (orderSpan) orderSpan.textContent = `#${orderId}`;

  // Hiển thị địa chỉ giao hàng
  const deliveryBox = document.querySelector(".delivery-box .delivery-text");
  if (deliveryBox) {
    const addressText = composeAddress(customer);
    deliveryBox.innerHTML = addressText || 'No delivery address';
  }

  // Hiển thị danh sách sản phẩm
  renderOrderItems(items);

  // Hiển thị tóm tắt đơn hàng
  renderOrderSummary(subtotal, shipping, discount, total);

  // ---------------- lưu vào lịch sử đơn hàng ----------------
  pushOrderHistory({
    orderId,
    total,
    cart: items,
    address: composeAddress(customer),
  });
});


// ---------------- helper functions ----------------
function tryParse(str) {
  try { return str ? JSON.parse(str) : null; }
  catch(e) { return null; }
}

function safeNumber(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^\d\-]/g, '');
  return s === '' ? 0 : Number(s);
}

function calcSubtotal(cart) {
  return (cart || []).reduce((s, it) => s + safeNumber(it.price) * (Number(it.qty ?? it.quantity ?? 1)), 0);
}

function formatNumber(num) {
  return (Number(num) || 0).toLocaleString('vi-VN');
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function composeAddress(customerObj) {
  if (!customerObj) return '-';
  if (customerObj.address && customerObj.detail) {
    return `${customerObj.fullname ? customerObj.fullname + ' | ' : ''}${customerObj.phone ? customerObj.phone + '<br/>' : ''}${customerObj.detail}, ${customerObj.address}`;
  }
  if (customerObj.address)
    return `${customerObj.fullname ? customerObj.fullname + ' | ' : ''}${customerObj.address}`;
  return `${customerObj.fullname || '-'}${customerObj.phone ? ' | ' + customerObj.phone : ''}`;
}

function renderOrderItems(list) {
  const rd = document.querySelector('.order-detail');
  if (!rd) return;
  const normalized = list.map(normalizeItem);
  if (!normalized.length) {
    rd.innerHTML = '<p>No items</p>';
    return;
  }
  const html = normalized.map(item => `
    <div class="order-item">
      <img src="${item.image}" alt="">
      <div class="order-item-info">
        <h4>${escapeHtml(item.name)}</h4>
        <p>Color: ${escapeHtml(item.color)} | Size: ${escapeHtml(item.size)}</p>
        <span class="order-item-price">${formatNumber(item.price)}</span>
      </div>
      <span class="order-item-qty">x${item.qty}</span>
    </div>
  `).join('');
  rd.innerHTML = `<h3>ORDER DETAIL</h3>${html}<hr/>`;
}

function renderOrderSummary(subtotal, shipping, discount, total) {
  const summaryEl = document.querySelector('.order-summary');
  if (!summaryEl) return;
  summaryEl.innerHTML = `
    <h3>ORDER SUMMARY</h3>
    <div class="summary-item"><span>Subtotal Product</span><span>${formatNumber(subtotal)}</span></div>
    <div class="summary-item"><span>Shipping Cost</span><span>${formatNumber(shipping)}</span></div>
    <div class="summary-item"><span>Discount</span><span>-${formatNumber(discount)}</span></div>
    <hr/>
    <div class="total"><span>Total</span><span>${formatNumber(total)}</span></div>
  `;
}

function normalizeItem(it) {
  const qty = Number(it.qty ?? it.quantity ?? 1);
  const price = safeNumber(it.price ?? 0);
  return {
    name: it.name || "Unknown",
    qty,
    price,
    color: it.color || "",
    size: it.size || "",
    image: it.image || "../images/Product_images/default.png"
  };
}

function generateOrderId() {
  return 'ORDER_' + Math.floor(1000 + Math.random() * 9000);
}

function pushOrderHistory(paymentData) {
  try {
    const hist = tryParse(localStorage.getItem('orders')) || [];
    hist.push({
      orderId: paymentData.orderId,
      total: paymentData.total,
      items: paymentData.cart,
      address: paymentData.address,
      paidAt: new Date().toISOString()
    });
    localStorage.setItem('orders', JSON.stringify(hist));
  } catch (e) {
    console.warn(e);
  }
}
