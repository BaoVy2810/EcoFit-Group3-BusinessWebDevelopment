// checkout.js - Updated version
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
      const img =
        p.img ||
        p.image ||
        "../images/Product_images/organic_cotton_tee.png";
      const name = p.product_name || p.name || "Unknown Product";
      const color = p.color || "Default";
      const size = p.size || "M";
      const price =
        parseInt(p.price) || parseInt(p.original_price) || 0;
      const quantity = parseInt(p.quantity) || 1;

      subtotal += price * quantity;

      orderDetail.innerHTML += `
        <div class="order-item">
          <img src="${img}" alt="${name}" 
              style="width:80px;height:80px;object-fit:cover;border-radius:8px;"
              onerror="this.src='../images/Product_images/organic_cotton_tee.png'">
          <div class="order-item-info">
              <h4>${name}</h4>
              <p>Color: ${color} | Size: ${size}</p>
              <span class="order-item-price">${formatPrice(price)}</span>
          </div>
          <span class="order-item-qty">x${quantity}</span>
        </div>`;
    });
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

    const found = promotionsData.promotion.find(
      (p) => p.promo_code === code
    );

    if (!found) {
      alert(`❌ Mã "${code}" không tồn tại hoặc hết hạn.`);
      discount = 0;
      appliedPromo = null;
    } else {
      appliedPromo = found;
      discount = Math.round((subtotal * found.discount_rate) / 100);
      alert(
        `✅ Áp dụng mã "${code}" thành công! Giảm ${found.discount_rate}% (${formatPrice(
          discount
        )})`
      );
    }
    updateSummary();
  });

  // === 5. NÚT PLACE ORDER ===
  document
    .querySelector(".place-order")
    .addEventListener("click", () => {
      const fullname = document.getElementById("fullname").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const address = document.getElementById("address").value.trim();
      const detail = document.getElementById("detail").value.trim();

      if (!fullname || !phone || !address || !detail) {
        alert("⚠️ Vui lòng điền đầy đủ thông tin giao hàng.");
        return;
      }

      const delivery = document.querySelector(
        "input[name='delivery']:checked"
      );
      const payment = document.querySelector(
        "input[name='payment']:checked"
      );

      if (!delivery || !payment) {
        alert("⚠️ Vui lòng chọn phương thức giao hàng và thanh toán.");
        return;
      }

      const order = {
        customer: { fullname, phone, address, detail },
        delivery: delivery.parentElement.textContent.trim(),
        payment: payment.parentElement.textContent.trim(),
        items: cartData,
        subtotal,
        shippingCost: SHIPPING_COST,
        discount,
        total: subtotal + SHIPPING_COST - discount,
        appliedPromo: appliedPromo ? appliedPromo.promo_code : null,
        orderDate: new Date().toISOString(),
      };

      localStorage.setItem("checkoutOrder", JSON.stringify(order));
      alert("✅ Đơn hàng đã được tạo! Chuyển đến trang thanh toán...");
      window.location.href = "07_PAYMENT1.html";
    });

  // === 6. HÀM HỖ TRỢ ===
  function updateSummary() {
    if (appliedPromo) {
      discount = Math.round(
        (subtotal * appliedPromo.discount_rate) / 100
      );
    }

    subtotalEl.textContent = formatPrice(subtotal);
    shippingEl.textContent = formatPrice(SHIPPING_COST);
    discountEl.textContent =
      discount > 0 ? "-" + formatPrice(discount) : "-";
    totalEl.textContent = formatPrice(
      subtotal + SHIPPING_COST - discount
    );
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
});
