// payment1.js
document.addEventListener('DOMContentLoaded', () => {
  // Try to read order data from multiple possible keys (be robust)
  const checkoutOrder = tryParse(localStorage.getItem('checkoutOrder'));
  const paymentInfo = tryParse(localStorage.getItem('paymentInfo'));
  const checkoutCart = tryParse(localStorage.getItem('checkoutCart')); // from cart page
  const checkoutSummary = tryParse(localStorage.getItem('checkoutSummary')); // optional

  // Decide source of truth for items and summary
  let items = [];
  let customer = {};
  let summary = {};

  if (checkoutOrder && checkoutOrder.items && checkoutOrder.items.length) {
    items = checkoutOrder.items;
    customer = checkoutOrder.customer || {};
    summary = {
      subtotal: safeNumber(checkoutOrder.subtotal),
      shipping: safeNumber(checkoutOrder.shippingCost || checkoutOrder.shipping || 30000),
      discount: safeNumber(checkoutOrder.discount || 0)
    };
  } else if (paymentInfo && paymentInfo.cart && paymentInfo.cart.length) {
    items = paymentInfo.cart;
    customer = { address: paymentInfo.address || '' };
    summary = {
      subtotal: safeNumber(paymentInfo.subtotal || calcSubtotal(paymentInfo.cart)),
      shipping: safeNumber(paymentInfo.shipping || 30000),
      discount: safeNumber(paymentInfo.discount || 0)
    };
  } else if (checkoutCart && checkoutCart.length) {
    // checkoutCart items (from cart page) may use fields name/qty/price or quantity
    items = checkoutCart.map(normalizeItem);
    // load summary if any
    summary = {
      subtotal: safeNumber(checkoutSummary && checkoutSummary.subtotal) || calcSubtotal(items),
      shipping: safeNumber(checkoutSummary && checkoutSummary.shipping) || 30000,
      discount: safeNumber(checkoutSummary && checkoutSummary.discount) || 0
    };
    customer = {}; // no customer info yet
  } else {
    // No data -> redirect back to cart
    console.warn('No checkout data found in localStorage.');
    // optional: redirect to cart page
    // window.location.href = '../pages/05_SHOPPING_CART.html';
  }

  // Render order items (right panel)
  renderOrderItems(items);

  // Render order summary (right panel)
  const subtotal = summary.subtotal || calcSubtotal(items);
  const shipping = summary.shipping || 30000;
  const discount = summary.discount || 0;
  const total = subtotal + shipping - discount;
  renderOrderSummary(subtotal, shipping, discount, total);

  // Fill payment detail (left panel)
  fillPaymentDetail(subtotal, total, (checkoutOrder && checkoutOrder.payment) || (paymentInfo && paymentInfo.payment) || (checkoutSummary && checkoutSummary.paymentMethod) || 'Transfer via QR code');

  // Generate or reuse orderId
  const existingOrderId = (paymentInfo && paymentInfo.orderId) || (checkoutOrder && checkoutOrder.orderId);
  const orderId = existingOrderId || generateOrderId();
  const noteEl = document.getElementById('note');
  const amtEl = document.getElementById('amt');
  const statusSub = document.querySelector('.status-sub');
  if (statusSub) statusSub.textContent = orderId;
  if (noteEl) noteEl.textContent = orderId;
  if (amtEl) amtEl.textContent = formatNumber(total); // show without currency symbol

  // Delivery address
  const deliveryContainer = document.querySelector('.delivery-box .delivery-text');
  const addressText = composeAddress(customer);
  if (deliveryContainer) deliveryContainer.innerHTML = addressText || 'No delivery address';

  // Save paymentInfo so payment2 can read it
  const savePayment = {
    orderId,
    total,
    subtotal,
    shipping,
    discount,
    cart: items.map(normalizeItem),
    address: addressText,
    paymentMethod: (checkoutOrder && checkoutOrder.payment) || (paymentInfo && paymentInfo.payment) || null,
    paymentStatus: (paymentInfo && paymentInfo.paymentStatus) || false
  };
  localStorage.setItem('paymentInfo', JSON.stringify(savePayment));

  // Copy buttons
  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-target');
      const textEl = document.getElementById(id);
      if (!textEl) return;
      const text = textEl.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(()=> {
          const old = btn.textContent;
          btn.textContent = '✓';
          setTimeout(()=> btn.textContent = old, 900);
        }, ()=> {
          alert('Copy failed');
        });
      } else {
        // fallback
        prompt('Copy this value:', text);
      }
    });
  });

  // Pay Now button handler
  const payBtn = document.querySelector(".btn-pay");
  const proofInput = document.getElementById("proofImage");

  payBtn.addEventListener("click", (e) => {
    e.preventDefault(); // chặn nhảy trang

    if (!proofInput.files.length) {
      alert("⚠️ Please upload successful transaction image proof!");
      return;
    }

    // Đọc file ảnh và lưu vào localStorage (base64)
    const reader = new FileReader();
    reader.onload = function (event) {
      const proofBase64 = event.target.result;

      const paymentData = {
        cart,
        subtotal,
        shipping,
        discount,
        total,
        userInfo,
        proofImage: proofBase64,
        orderId: "ORDER_" + Math.floor(Math.random() * 10000),
      };

      localStorage.setItem("paymentInfo", JSON.stringify(paymentData));
      window.location.href = "../08_PAYMENT2.html";
    };
    reader.readAsDataURL(proofInput.files[0]);
  });
});

  // ---------------- helper functions ----------------
  function tryParse(str) {
    try { return str ? JSON.parse(str) : null; }
    catch(e) { return null; }
  }

  // ensure number (strip dots if string)
  function safeNumber(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[^\d\-]/g, ''); // remove dots, currency
    return s === '' ? 0 : Number(s);
  }

  function normalizeItem(it) {
    // Accept various shapes: {qty, quantity} and {price:"150.000"|"150000"}
    const qty = Number(it.qty ?? it.quantity ?? it.count ?? 1);
    const price = safeNumber(it.price ?? it.unitPrice ?? it.amount ?? 0);
    return {
      id: it.id || it.product_id || null,
      name: it.name || it.product_name || 'Unknown',
      qty,
      price,
      color: it.color || (it.variant && it.variant.color) || '',
      size: it.size || (it.variant && it.variant.size) || '',
      image: it.image || it.img || it.imageUrl || '../images/Product_images/organic_cotton_tee.png'
    };
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
    // also update small payment detail left side (pd-list)
    const pdRows = document.querySelectorAll('.pd-row');
    pdRows.forEach(row => {
      const label = row.querySelector('.pd-label')?.textContent?.trim().toLowerCase();
      if (!label) return;
      if (label.includes('total order amount')) row.querySelector('.pd-value').textContent = formatNumber(subtotal);
      if (label.includes('amount due')) row.querySelector('.pd-value').textContent = formatNumber(total);
      if (label.includes('payment method')) {
        // don't change here
      }
    });
  }

  function fillPaymentDetail(subtotal, total, paymentMethodText) {
    // small payment detail block on left
    const pd = document.querySelector('.payment-detail .pd-list');
    if (pd) {
      // update the three rows if they exist, else create
      const rows = pd.querySelectorAll('.pd-row');
      if (rows.length >= 3) {
        rows[0].querySelector('.pd-value').textContent = formatNumber(subtotal);
        rows[1].querySelector('.pd-value').textContent = formatNumber(total);
        rows[2].querySelector('.pd-value').textContent = paymentMethodText;
      } else {
        pd.innerHTML = `
          <div class="pd-row"><div class="pd-label">Total order amount</div><div class="pd-value">${formatNumber(subtotal)}</div></div>
          <div class="pd-row"><div class="pd-label">Amount due</div><div class="pd-value">${formatNumber(total)}</div></div>
          <div class="pd-row"><div class="pd-label">Payment method</div><div class="pd-value small">${escapeHtml(paymentMethodText)}</div></div>
        `;
      }
    }
  }

  function calcSubtotal(cart) {
    return normalizeItem({}).price * 0 + cart.reduce((s, it) => s + safeNumber(it.price) * (Number(it.qty ?? it.quantity ?? 1)), 0);
  }

  function formatNumber(num) {
    // returns "165.000" for 165000
    const n = Number(num) || 0;
    return n.toLocaleString('vi-VN');
  }

  function generateOrderId() {
    return 'ORDER_' + Math.floor(1000 + Math.random() * 9000);
  }

  function composeAddress(customerObj) {
    if (!customerObj) return '';
    // customer may have fullname, phone, address, detail OR address string
    if (customerObj.address && customerObj.detail) {
      return `${customerObj.fullname ? customerObj.fullname + ' | ' : ''}${customerObj.phone ? customerObj.phone + '<br/>' : ''}${customerObj.detail}, ${customerObj.address}`;
    }
    if (customerObj.address) return `${customerObj.fullname ? customerObj.fullname + ' | ' : ''}${customerObj.address}`;
    return `${customerObj.fullname || ''}${customerObj.phone ? ' | ' + customerObj.phone : ''}`;
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    } catch (e) { console.warn(e); }
  }

