document.addEventListener('DOMContentLoaded', () => {
  const paymentInfo = tryParse(localStorage.getItem('paymentInfo'));
  const checkoutOrder = tryParse(localStorage.getItem('checkoutOrder'));
  const checkoutCart = tryParse(localStorage.getItem('checkoutCart'));
  const checkoutSummary = tryParse(localStorage.getItem('checkoutSummary'));

  if (!paymentInfo) {
    alert("⚠️ Không tìm thấy dữ liệu thanh toán. Quay lại Payment 1 nhé!");
    window.location.href = "../pages/07_PAYMENT1.html";
    return;
  }

  const items = paymentInfo.cart || [];
  const customer = (checkoutOrder && checkoutOrder.customer) || {};
  const subtotal = safeNumber(paymentInfo.subtotal) || calcSubtotal(items);
  const shipping = safeNumber(paymentInfo.shipping || 30000);
  const discount = safeNumber(paymentInfo.discount || 0);
  const total = safeNumber(paymentInfo.total) || subtotal + shipping - discount;
  const orderId = paymentInfo.orderId || generateOrderId();

  const orderSpan = document.querySelector(".page-title span");
  if (orderSpan) orderSpan.textContent = `#${orderId}`;

const deliveryBox = document.querySelector(".delivery-box .delivery-text");
if (deliveryBox) {
  let fullname = "-";
  let phone = "-";
  let address = "-";

  if (customer && (customer.fullname || customer.address)) {
    fullname = customer.fullname || fullname;
    phone = customer.phone || phone;
    address = customer.address || address;
  } 
  else if (localStorage.getItem("isLoggedIn") === "true") {
    const nameLS = localStorage.getItem("userName");
    const phoneLS = localStorage.getItem("userPhone");
    const addressLS = localStorage.getItem("userAddress");
    if (nameLS || addressLS) {
      fullname = nameLS || fullname;
      phone = phoneLS || phone;
      address = addressLS || address;
    }
  }

  deliveryBox.innerHTML = `
    ${fullname} | ${phone}<br>
    ${address}
  `;
}

  renderOrderItems(items);
  renderOrderSummary(subtotal, shipping, discount, total);
  pushOrderHistory({
    orderId,
    total,
    cart: items,
    address: composeAddress(customer),
  });
});

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
    rd.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">No items</p>';
    return;
  }

  let html = '<h3 style="margin-bottom:12px;">ORDER DETAIL</h3>';

  normalized.forEach(item => {
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
          <a href="../pages/04_PRODUCT_Detail.html?id=${escapeHtml(item.id || '')}" 
             style="display:block;">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"
                 style="width:70px;
                        height:70px;
                        object-fit:cover;
                        border-radius:8px;"
                 onerror="this.src='../images/Product_images/default.png'">
          </a>

          <div class="order-item-info" style="flex:1; min-width:0;">
            <a href="../pages/04_PRODUCT_Detail.html?id=${escapeHtml(item.id || '')}"
               style="text-decoration:none;color:#222;">
              <h4 style="margin:0;
                         white-space:nowrap;
                         overflow:hidden;
                         text-overflow:ellipsis;
                         font-size:15px;
                         font-weight:600;
                         max-width:100%;">
                ${escapeHtml(item.name)}
              </h4>
            </a>
            <p style="margin:2px 0; color:#666; font-size:14px;">
              Color: ${escapeHtml(item.color)} | Size: ${escapeHtml(item.size)}
            </p>
            <span class="order-item-price"
                  style="font-weight:500; font-size:14px;">${formatNumber(item.price)}đ</span>
          </div>
        </div>

        <span class="order-item-qty"
              style="min-width:40px;
                     text-align:right;
                     font-weight:600;
                     color:#333;
                     font-size:14px;">
          x${item.qty}
        </span>
      </div>`;
  });

  rd.innerHTML = html + '<hr style="border:none;border-top:1px solid #ccc;margin-top:10px;">';
}
function renderOrderSummary(subtotal, shipping, discount, total) {
  const summaryEl = document.querySelector('.order-summary');
  if (!summaryEl) return;

  summaryEl.innerHTML = `
    <h3 style="margin-bottom:12px;">ORDER SUMMARY</h3>
    <div class="summary-item" 
         style="display:flex; 
                justify-content:space-between; 
                margin:6px 0; 
                color:#444;">
      <span>Subtotal Product</span>
      <span>${formatNumber(subtotal)}đ</span>
    </div>
    <div class="summary-item" 
         style="display:flex; 
                justify-content:space-between; 
                margin:6px 0; 
                color:#444;">
      <span>Shipping Cost</span>
      <span>${formatNumber(shipping)}đ</span>
    </div>
    <div class="summary-item" 
         style="display:flex; 
                justify-content:space-between; 
                margin:6px 0; 
                color:#444;">
      <span>Discount</span>
      <span style="color:#d33;">-${formatNumber(discount)}đ</span>
    </div>
    <hr style="margin:10px 0; 
              border:none; 
              border-top:1px solid #ccc;"/>
    <div class="total" 
         style="display:flex; 
                justify-content:space-between; 
                font-weight:700; 
                font-size:16px; 
                color:#000;">
      <span>Total</span>
      <span>${formatNumber(total)}đ</span>
    </div>
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
