window.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header-frame");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  header.src = isLoggedIn
    ? "../template/header.html"
    : "../template/header0.html";

  header.onload = () => {
    header.contentWindow.postMessage({ activeNav: "nav-shop" }, "*");
  };
  loadPaymentData();
});

function loadPaymentData() {
  const checkoutOrder = JSON.parse(
    localStorage.getItem("checkoutOrder") || "{}"
  );

  if (!checkoutOrder.orderId) {
    alert("⚠️ Order not found! Redirecting to Checkout...");
    window.location.href = "06_CHECKOUT.html";
    return;
  }

  const paymentData = {
    orderId: checkoutOrder.orderId,
    customer: checkoutOrder.customer || {},
    items: checkoutOrder.items || [],
    subtotal: checkoutOrder.subtotal || 0,
    discount: checkoutOrder.discount || 0,
    total: checkoutOrder.total || 0,
    payment: checkoutOrder.payment || "Transfer via QR code",
  };

  const shipping = 30000;

  // === 1. UPDATE ORDER DETAILS ===
  const orderDetail = document.querySelector(".order-detail");
  paymentData.items.forEach((p) => {
    const img =
      p.img || p.image || "../images/Product_images/organic_cotton_tee.png";
    const name = p.product_name || p.name || "Unknown Product";
    const color = p.color || "Default";
    const size = p.size || "M";
    const price = parseInt(p.price) || parseInt(p.original_price) || 0;
    const quantity = parseInt(p.quantity) || 1;

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
          <a href="../pages/04_PRODUCT_Detail.html?id=${p.product_id || ""}" 
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
  orderDetail.innerHTML += "<hr/>";

  // === 2. UPDATE ORDER SUMMARY ===
  document.querySelector(".subtotal").textContent =
    formatPrice(paymentData.subtotal) + "đ";
  document.querySelector(".shipping").textContent = formatPrice(shipping) + "đ";
  document.querySelector(".discount").textContent =
    "-" + formatPrice(paymentData.discount) + "đ";
  document.querySelector(".total-value").textContent =
    formatPrice(paymentData.total) + "đ";

  // === 3. UPDATE PAYMENT DETAIL ===
  const pdValues = document.querySelectorAll(
    ".pd-value.total, .pd-value.due, .pd-value.method"
  );
  pdValues[0].textContent = formatPrice(paymentData.total) + "đ";
  pdValues[1].textContent = formatPrice(paymentData.total) + "đ";
  pdValues[2].textContent = paymentData.payment;

  // === 4. UPDATE TRANSFER INFO ===
  const statusSub = document.querySelector(".status-sub");
  statusSub.textContent = `Order #${paymentData.orderId}`;
  statusSub.style.fontWeight = "500";

  document.getElementById("note").textContent = `ORDER_${paymentData.orderId}`;
  document.getElementById("amt").textContent =
    formatPrice(paymentData.total) + "đ";

  // === 5. UPDATE DELIVERY ADDRESS ===
  const deliveryText = document.querySelector(".delivery-text");
  if (deliveryText && paymentData.customer) {
    const c = paymentData.customer;
    deliveryText.innerHTML = `
      ${c.fullname || "-"} | ${c.phone || "-"}<br>
      ${c.address || "-"}
    `;
  }

  // === 6. HANDLE COPY BUTTONS ===
  document.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const textElement = document.getElementById(targetId);
      const text = textElement.textContent.trim();

      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            const originalHTML = btn.innerHTML;

            btn.innerHTML =
              '<span style="color:#2e7d32;font-weight:600;font-size:12px;">✓</span>';
            btn.style.cursor = "default";

            setTimeout(() => {
              btn.innerHTML = originalHTML;
              btn.style.cursor = "pointer";
            }, 5000);
          })
          .catch(() => {
            alert("❌ Copy failed!");
          });
      } else {
        alert("⚠️ Copy not supported on this browser");
      }
    });
  });

  // === 7. HANDLE PROOF UPLOAD ===
  const proofInput = document.getElementById("proofImage");
  const fileNameSpan = document.getElementById("fileName");

  if (proofInput && fileNameSpan) {
    proofInput.addEventListener("change", () => {
      const file = proofInput.files[0];
      if (!file) return;

      fileNameSpan.textContent = file.name;

      // 🟢 CHANGE STATUS TO "PAYMENT SUCCESS" IMMEDIATELY
      const statusTitle = document.querySelector(".status-title");
      const statusSub = document.querySelector(".status-sub");
      const statusIcon = document.querySelector(".status-icon img");
      const statusBox = document.querySelector(".status-box");

      if (statusTitle) {
        statusTitle.textContent = "Payment Success";
        statusTitle.style.color = "#3DA547";
        statusTitle.style.fontWeight = "600";
      }

      if (statusSub) {
        statusSub.style.color = "#2e7d32";
        statusSub.style.fontWeight = "600";
      }

      if (statusIcon) {
        statusIcon.style.filter =
          "brightness(0) saturate(100%) invert(44%) sepia(96%) saturate(502%) hue-rotate(75deg) brightness(94%) contrast(88%)";
      }

      if (statusBox) {
        statusBox.style.borderColor = "#3DA547";
        statusBox.style.background ="#F0F8F0";
      }

      // Show success popup
      const popup = document.createElement("div");
      popup.textContent =
        "✅ Payment proof uploaded successfully! Verifying payment...";
      Object.assign(popup.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "white",
        padding: "20px 30px",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        fontWeight: "600",
        color: "#3DA547",
        zIndex: "9999",
        textAlign: "center",
        transition: "opacity 0.5s ease",
        fontSize: "15px",
        maxWidth: "600px",
      });
      document.body.appendChild(popup);

      // 🟢 SAVE DATA TO localStorage
      const paymentInfo = {
        orderId: paymentData.orderId,
        customer: paymentData.customer,
        cart: paymentData.items,
        subtotal: paymentData.subtotal,
        shipping: shipping,
        discount: paymentData.discount,
        total: paymentData.total,
        address: paymentData.customer
          ? `${paymentData.customer.fullname} | ${paymentData.customer.phone}<br>${paymentData.customer.address}`
          : "-",
        proofFileName: file.name,
        uploadedAt: new Date().toISOString(),
      };
      localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo));

      // Redirect after 3 seconds
      setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => {
          popup.remove();
          window.location.href = "../pages/08_PAYMENT2.html";
        }, 500);
      }, 3000);
    });
  }

  // === 8. HANDLE PAY NOW BUTTON ===
  const payBtn = document.querySelector(".btn-pay");
  if (payBtn) {
    payBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (!proofInput?.files?.[0]) {
        alert("⚠️ Please upload your payment proof first!");
        return;
      }
    });
  }
}

// === HELPER FUNCTION ===
function formatPrice(num) {
  return new Intl.NumberFormat("vi-VN").format(num);
}