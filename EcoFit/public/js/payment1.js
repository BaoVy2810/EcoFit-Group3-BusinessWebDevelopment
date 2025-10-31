    window.addEventListener("DOMContentLoaded", () => {
      const header = document.getElementById("header-frame");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      header.src = isLoggedIn
        ? "../template/header.html"
        : "../template/header0.html";

      header.onload = () => {
        header.contentWindow.postMessage({ activeNav: "nav-shop" }, "*");
      };

      // Load order data from localStorage
      loadPaymentData();
    });

    // Function to load order data from localStorage
    function loadPaymentData() {
      // Get order data from localStorage
      const paymentData = JSON.parse(localStorage.getItem("checkoutOrder") || "{}");
      //const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      

      
      const shipping = 30000; // Fixed shipping cost
      const discount = paymentData.discount || 0;
      const total = paymentData.total;
      const subtotal= paymentData.subtotal;
      
  // === 2. CẬP NHẬT ORDER DETAILS ===
        const orderDetail = document.querySelector(".order-detail");
    paymentData.items.forEach((p) => {
      const img = p.img || p.image || "../images/Product_images/organic_cotton_tee.png";
      const name = p.product_name || p.name || "Unknown Product";
      const color = p.color || "Default";
      const size = p.size || "M";
      const price = parseInt(p.price) || parseInt(p.original_price) || 0;
      const quantity = parseInt(p.quantity) || 1;


      orderDetail.innerHTML += `
        <div class="order-item">
          <img src="${img}" alt="${name}" 
              style="width:80px;height:80px;object-fit:cover;border-radius:8px;"
              onerror="this.src='../images/product_images/organic_cotton_tee.png'">
          <div class="order-item-info">
            <h4>${name}</h4>
            <p>Color: ${color} | Size: ${size}</p>
            <span class="order-item-price">${formatPrice(price)}đ</span>
          </div>
          <span class="order-item-qty">x${quantity}</span>
        </div>`;
    });
    
    // Thêm <hr/> sau items
    orderDetail.innerHTML += '<hr/>';
  
  // === 3. CẬP NHẬT ORDER SUMMARY ===
      document.querySelector('.subtotal').textContent = formatPrice(subtotal) + 'đ';
      document.querySelector('.shipping').textContent = formatPrice(shipping) + 'đ';
      document.querySelector('.discount').textContent = '-' + formatPrice(discount) + 'đ';
      document.querySelector('.total-value').textContent = formatPrice(total) + 'đ';
    


      
      // Update Transfer Amount
      document.getElementById('amt').textContent = formatPrice(total) + 'đ';
      
      // Update Order ID in multiple places
      const orderId = paymentData.orderId || '1056';
      document.querySelector('.status-sub').textContent = `Order #${orderId}`;
      document.getElementById('note').textContent = `ORDER_${orderId}`;
      

    }
    // Helper function to format price
    function formatPrice(price) {
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
      const paymentData = JSON.parse(localStorage.getItem("checkoutOrder") || "{}");
      const total = paymentData.total;

  // === 5. CẬP NHẬT PAYMENT DETAIL (BÊN TRÁI) ===
  const pdValues = document.querySelectorAll('.pd-value.total, .pd-value.due, .pd-value.method');
    pdValues[0].textContent = formatPrice(total) + 'đ'; // Total order amount
    pdValues[1].textContent = formatPrice(total) + 'đ'; // Amount due
    pdValues[2].textContent = paymentData.payment || 'Transfer via QR code';

    
  // === 6. CẬP NHẬT TRANSFER INFO ===

  const statusSub = document.querySelector('.status-sub');
  if (statusSub) statusSub.textContent = `Order #${paymentData.orderId}`;

  const noteEl = document.getElementById('note');
  if (noteEl) noteEl.textContent = `ORDER_${paymentData.orderId}`;

  const amtEl = document.getElementById('amt');
  if (amtEl) amtEl.textContent = formatPrice(total) + 'đ';

  // === 7. CẬP NHẬT DELIVERY ADDRESS ===
  if (paymentData.customer) {
    const c = paymentData.customer;
    const addrHTML = `
      ${c.fullname || '-'} | ${c.phone || '-'}<br>
      ${c.address || '-'}
    `;
    const deliveryText = document.querySelector('.delivery-text');
    if (deliveryText) deliveryText.innerHTML = addrHTML;
  }
    
  // === 8. XỬ LÝ UPLOAD ẢNH CHỨNG TỪ ===
  const proofInput = document.getElementById('proofImage');
  const fileNameSpan = document.getElementById('fileName');

  if (proofInput && fileNameSpan) {
    proofInput.addEventListener('change', () => {
      fileNameSpan.textContent = proofInput.files[0]?.name || '';
    });
  }

  // === 9. XỬ LÝ NÚT PAY NOW ===
  const payBtn = document.querySelector('.btn-pay');
  if (payBtn) {
    payBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!proofInput?.files?.[0]) {
        alert('Vui lòng upload ảnh chứng từ thanh toán!');
        return;
      }

      const paymentData = {
        orderId,
        amount: total,
        paymentDate: new Date().toISOString(),
        status: 'pending',
        proofFileName: proofInput.files[0].name
      };

      localStorage.setItem('paymentData', JSON.stringify(paymentData));
      alert('Thanh toán đã được gửi! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '08_PAYMENT_CONFIRM.html';
      }, 500);
    });
  }

  // === 10. HÀM HỖ TRỢ ===
  function formatPrice(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
  }
