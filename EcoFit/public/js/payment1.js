document.addEventListener("DOMContentLoaded", () => {
  const checkoutOrder = JSON.parse(localStorage.getItem("checkoutOrder") || "{}");

  if (!checkoutOrder || !checkoutOrder.items) {
    alert("⚠️ Không tìm thấy thông tin đơn hàng. Vui lòng quay lại trang Checkout.");
    window.location.href = "06_CHECKOUT.html";
    return;
  }

  const { customer, items, subtotal, shippingCost, discount, total, payment } = checkoutOrder;
  const orderId = "ORDER_" + Math.floor(1000 + Math.random() * 9000);

  // --- HIỂN THỊ ORDER DETAIL ---
  const orderDetailContainer = document.querySelector(".order-detail");
  orderDetailContainer.innerHTML = `<h3 class="order-detail__title">ORDER DETAIL</h3>`;
  items.forEach(p => {
    orderDetailContainer.innerHTML += `
      <div class="order-item">
        <img src="${p.image || "../images/Product_images/organic_cotton_tee.png"}" alt="">
        <div class="order-item-info">
          <h4>${p.product_name || p.name}</h4>
          <p>Color: ${p.color || "-"} | Size: ${p.size || "-"}</p>
          <span class="order-item-price">${formatPrice(p.price)}</span>
        </div>
        <span class="order-item-qty">x${p.quantity || 1}</span>
      </div>
    `;
  });

  // --- HIỂN THỊ ORDER SUMMARY ---
  const summary = document.querySelector(".order-summary");
  summary.innerHTML = `
    <h2 class="order-summary__title">ORDER SUMMARY</h2>
    <div class="order-summary__row"><span>Subtotal Product</span><span>${formatPrice(subtotal)}</span></div>
    <div class="order-summary__row"><span>Shipping Cost</span><span>${formatPrice(shippingCost)}</span></div>
    <div class="order-summary__row"><span>Discount</span><span>-${formatPrice(discount)}</span></div>
    <div class="order-summary__total"><span>Total</span><span class="total-value">${formatPrice(total)}</span></div>
  `;

  // --- HIỂN THỊ PAYMENT DETAIL ---
  const payDetail = document.querySelector(".payment-detail .pd-list");
  payDetail.innerHTML = `
    <div class="pd-row"><div class="pd-label">Total order amount</div><div class="pd-value">${formatPrice(subtotal)}</div></div>
    <div class="pd-row"><div class="pd-label">Amount due</div><div class="pd-value">${formatPrice(total)}</div></div>
    <div class="pd-row"><div class="pd-label">Payment method</div><div class="pd-value small">${payment}</div></div>
  `;

  // --- HIỂN THỊ DELIVERY ADDRESS ---
  const deliveryBox = document.querySelector(".delivery-box .delivery-text");
  deliveryBox.innerHTML = `
    ${customer.fullname || ""} | ${customer.phone || ""}<br>
    ${customer.detail || ""}, ${customer.address || ""}
  `;

  // --- HIỂN THỊ QR CODE PHÙ HỢP ---
  const qrContainer = document.querySelector(".transfer-right .qr-card");
  const qrImage = qrContainer.querySelector("img");

  if (payment.toLowerCase().includes("momo")) {
    // QR Momo với số tiền động
    const momoQR = `https://img.vietqr.io/image/970422-0966666666-MoMo.png?amount=${total}&addInfo=${orderId}`;
    qrImage.src = momoQR;
  } else {
    // QR Vietcombank mặc định
    const bankQR = `https://img.vietqr.io/image/970436-0339667803-Vietcombank.png?amount=${total}&addInfo=${orderId}`;
    qrImage.src = bankQR;
  }

  // --- GÁN MÃ ĐƠN & SỐ TIỀN VÀO PHẦN THÔNG TIN CHUYỂN KHOẢN ---
  document.querySelector(".status-sub").textContent = orderId;
  document.getElementById("note").textContent = orderId;
  document.getElementById("amt").textContent = formatPrice(total);

  // --- XỬ LÝ NÚT UPLOAD VÀ THANH TOÁN ---
  const proofInput = document.getElementById("proofImage");
  const fileNameDisplay = document.getElementById("fileName");
  const payBtn = document.querySelector(".btn-pay");

  proofInput.addEventListener("change", e => {
    const file = e.target.files[0];
    fileNameDisplay.textContent = file ? file.name : "";
  });

  payBtn.addEventListener("click", () => {
    if (!proofInput.files.length) {
      alert("⚠️ Vui lòng tải lên ảnh xác nhận thanh toán!");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const proofBase64 = e.target.result;

      // Tạo payment record
      const paymentRecord = {
        payment_id: "PAY" + Math.floor(1000 + Math.random() * 9000),
        payment_method: payment,
        payment_status: "Success",
        transaction_date: new Date().toLocaleString(),
        order_id: orderId,
        proof_image: proofBase64
      };

      // Lưu vào localStorage
      const payments = JSON.parse(localStorage.getItem("payment")) || [];
      payments.push(paymentRecord);
      localStorage.setItem("payment", JSON.stringify(payments));

      // Tạo order record
      const orders = JSON.parse(localStorage.getItem("orders")) || [];
      const orderData = {
        order_id: orderId,
        customer: customer,
        items: items,
        shipping_fee: shippingCost,
        discount: discount,
        total_amount: total,
        status: "Processing",
        order_date: new Date().toISOString(),
        payment_id: paymentRecord.payment_id
      };
      orders.push(orderData);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Cập nhật localStorage.paymentInfo cho bước xác nhận
      localStorage.setItem("paymentInfo", JSON.stringify({
        orderId,
        total,
        paymentMethod: payment,
        paymentStatus: "Success",
        proofImage: proofBase64
      }));

      alert("✅ Thanh toán thành công! Chuyển đến trang xác nhận...");
      localStorage.removeItem("checkoutCart");
      window.location.href = "08_PAYMENT2.html";
    };
    reader.readAsDataURL(proofInput.files[0]);
  });

  // --- Hàm định dạng giá ---
  function formatPrice(num) {
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  }
});
