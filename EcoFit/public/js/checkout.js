// checkout.js - Updated to save complete order data
document.addEventListener("DOMContentLoaded", function () {
  // === 0. TỰ ĐỘNG ĐIỀN THÔNG TIN NGƯỜI DÙNG ===
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    const fullname = localStorage.getItem("userName");
    const phone = localStorage.getItem("userPhone");
    const address = localStorage.getItem("userAddress");

    setTimeout(() => {
      if (fullname) document.getElementById("fullname").value = fullname;
      if (phone) document.getElementById("phone").value = phone;
      if (address) document.getElementById("address").value = address;
    }, 100);
  }

  // === 1. ĐỌC DỮ LIỆU GIỎ HÀNG ===
  let cartData = [];
  try {
    const cartRaw = localStorage.getItem("checkoutCart");
    if (cartRaw) {
      cartData = JSON.parse(cartRaw);
    }
  } catch {
    cartData = [];
  }

  const orderDetail = document.querySelector(".order-detail");
  const subtotalEl = document.querySelector(".order-summary .subtotal");
  const discountEl = document.querySelector(".order-summary .discount");
  const totalEl = document.querySelector(".order-summary .total-value");
  const shippingEl = document.querySelector(".order-summary .shipping");

  const SHIPPING_COST = 30000;
  let subtotal = 0;
  let discount = 0;
  let appliedPromo = null;

  // === 2. HIỂN THỊ SẢN PHẨM ===
  if (cartData.length === 0) {
    orderDetail.innerHTML +=
      '<p style="text-align:center;padding:20px;color:#999;">Giỏ hàng trống</p>';
  } else {
    cartData.forEach((p) => {
      const img = p.img || p.image || "../images/Product_images/organic_cotton_tee.png";
      const name = p.product_name || p.name || "Unknown Product";
      const color = p.color || "Default";
      const size = p.size || "M";
      const price = parseInt(p.price) || parseInt(p.original_price) || 0;
      const quantity = parseInt(p.quantity) || 1;

      subtotal += price * quantity;

    orderDetail.innerHTML += `
      <div class="order-item"
          style="display:flex;
                  align-items:center;
                  justify-content:space-between;
                  margin-bottom:20px;">
        <div style="display:flex;
                    align-items:center;
                    gap:12px;
                    flex:1;">
            <a href="../pages/04_PRODUCT_Detail.html?id=${p.product_id || ''}" 
              style="display:block;">
              <img src="${img}" alt="${name}" 
                  style="width:80px;
                        height:80px;
                        object-fit:cover;
                        border-radius:8px;"
                  onerror="this.src='../images/product_images/organic_cotton_tee.png'">
            </a>
          <div class="order-item-info" style="flex:1; min-width:0;">
            <h4 style="margin:0;
                        white-space:nowrap;
                        overflow:hidden;
                        text-overflow:ellipsis;
                        font-size:15px;
                        font-weight:600;
                        max-width:100%;">
              ${name}
            </h4>
            <p style="margin:4px 0; color:#666;">Color: ${color} | Size: ${size}</p>
            <span class="order-item-price"
                  style="font-weight:500;">${formatPrice(price)}đ</span>
          </div>
        </div>

        <span class="order-item-qty"
              style="min-width:45px;
                    text-align:right;
                    font-weight:600;
                    color:#333;">
          x${quantity}
        </span>
      </div>`;
  });
    orderDetail.innerHTML += '<hr/>';
  }

  // === 3. CẬP NHẬT TỔNG TIỀN ===
  updateSummary();

  // === 4. XỬ LÝ ÁP DỤNG MÃ GIẢM GIÁ ===
  const discountInput = document.querySelector(".discount-input");
  const applyBtn = document.querySelector(".apply-btn");

  applyBtn.addEventListener("click", async () => {
    const code = discountInput.value.trim().toUpperCase();
    if (!code) return alert("⚠️ Vui lòng nhập mã giảm giá.");

    let promotionsData = null;
    try {
      const response = await fetch("../../dataset/promotions.json");
      promotionsData = await response.json();
    } catch {
      const cached = localStorage.getItem("promotions");
      promotionsData = cached ? JSON.parse(cached) : { promotion: [] };
    }

    const found = promotionsData.promotion.find((p) => p.promo_code === code);

    if (!found) {
      alert(`❌ Mã "${code}" không tồn tại hoặc hết hạn.`);
      discount = 0;
      appliedPromo = null;
    } else {
      appliedPromo = found;
      discount = Math.round((subtotal * found.discount_rate) / 100);
      alert(
        `✅ Áp dụng mã "${code}" thành công! Giảm ${found.discount_rate}% (-${formatPrice(discount)}đ)`
      );
    }
    updateSummary();
  });

  // === 5. NÚT PLACE ORDER ===
  document.querySelector(".place-order").addEventListener("click", () => {
    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!fullname || !phone || !address) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    const delivery = document.querySelector("input[name='delivery']:checked");
    const payment = document.querySelector("input[name='payment']:checked");

    if (!delivery) {
      alert("⚠️ Vui lòng chọn phương thức giao hàng.");
      return;
    }
    
    if (!payment) {
      alert("⚠️ Vui lòng chọn phương thức thanh toán.");
      return;
    }

    // Tạo order ID duy nhất
    const orderId = Math.floor(1000 + Math.random() * 9000);

    // Lấy text payment method
    let paymentMethod = "Transfer via QR code";
    const paymentLabel = payment.parentElement.textContent.trim();
    if (paymentLabel.includes("Momo")) {
      paymentMethod = "Transfer via Momo";
    } else if (paymentLabel.includes("QR")) {
      paymentMethod = "Transfer via QR code";
    }

    // Tạo object order hoàn chỉnh
    const order = {
      orderId: orderId,
      customer: { 
        fullname, 
        phone, 
        address
      },
      delivery: delivery.parentElement.textContent.trim(),
      payment: paymentMethod,
      items: cartData, // Lưu toàn bộ items
      subtotal: subtotal,
      shippingCost: SHIPPING_COST,
      discount: discount,
      total: subtotal + SHIPPING_COST - discount,
      appliedPromo: appliedPromo ? appliedPromo.promo_code : null,
      orderDate: new Date().toISOString(),
    };

    // Lưu vào localStorage
    localStorage.setItem("checkoutOrder", JSON.stringify(order));
    
    console.log("Order saved:", order); // Debug
    
    // Chuyển hướng
    window.location.href = "07_PAYMENT1.html";
  });

  // === 6. HÀM HỖ TRỢ ===
  function updateSummary() {
    if (appliedPromo) {
      discount = Math.round((subtotal * appliedPromo.discount_rate) / 100);
    }

    subtotalEl.textContent = formatPrice(subtotal) + "đ";
    shippingEl.textContent = formatPrice(SHIPPING_COST) + "đ";
    discountEl.textContent = discount > 0 ? "-" + formatPrice(discount) + "đ" : "-";
    totalEl.textContent = formatPrice(subtotal + SHIPPING_COST - discount) + "đ";
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price);
  }
});