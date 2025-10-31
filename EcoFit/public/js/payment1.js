// payment1.js - Updated to load data from localStorage
document.addEventListener("DOMContentLoaded", function () {
  // === 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE ===
  let orderData = {};
  let cartData = [];
  
  try {
    const orderRaw = localStorage.getItem("checkoutOrder");
    if (orderRaw) {
      orderData = JSON.parse(orderRaw);
    }
    
    const cartRaw = localStorage.getItem("checkoutCart");
    if (cartRaw) {
      cartData = JSON.parse(cartRaw);
    }
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    cartData = [];
    orderData = {};
  }

  // === 2. HIỂN THỊ ORDER DETAIL ===
  const orderDetailContainer = document.querySelector('.order-detail');
  orderDetailContainer.innerHTML = '<h3 class="order-detail__title">ORDER DETAIL</h3>';
  
  if (cartData.length === 0) {
    orderDetailContainer.innerHTML += '<p class="empty-cart">No items in cart</p>';
  } else {
    cartData.forEach(item => {
      const img = item.img || item.image || "../images/Product_images/organic_cotton_tee.png";
      const name = item.product_name || item.name || "Unknown Product";
      const color = item.color || "Default";
      const size = item.size || "M";
      const price = parseInt(item.price) || parseInt(item.original_price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'order-detail-item';
      itemElement.innerHTML = `
        <div class="order-detail-item__info">
          <div class="order-detail-item__name">${name}</div>
          <div class="order-detail-item__variant">Color: ${color} | Size: ${size}</div>
          <div class="order-detail-item__price">${formatPrice(price)}đ x ${quantity}</div>
        </div>
        <div class="order-detail-item__total">${formatPrice(price * quantity)}đ</div>
      `;
      orderDetailContainer.appendChild(itemElement);
    });
  }

  // === 3. CẬP NHẬT ORDER SUMMARY ===
  const subtotal = orderData.subtotal || calculateSubtotal(cartData);
  const shipping = orderData.shippingCost || 30000;
  const discount = orderData.discount || 0;
  const total = orderData.total || (subtotal + shipping - discount);
  
  document.querySelector('.subtotal').textContent = formatPrice(subtotal) + 'đ';
  document.querySelector('.shipping').textContent = formatPrice(shipping) + 'đ';
  document.querySelector('.discount').textContent = formatPrice(discount) + 'đ';
  document.querySelector('.total-value').textContent = formatPrice(total) + 'đ';

  // === 4. CẬP NHẬT PAYMENT DETAILS ===
  document.querySelectorAll('.pd-value')[0].textContent = formatPrice(total) + 'đ';
  document.querySelectorAll('.pd-value')[1].textContent = formatPrice(total) + 'đ';
  
  // === 5. CẬP NHẬT TRANSFER INFORMATION ===
  const orderId = generateOrderId();
  document.querySelector('.status-sub').textContent = `Order #${orderId}`;
  document.getElementById('note').textContent = `ORDER_${orderId}`;
  document.getElementById('amt').textContent = formatPrice(total) + 'đ';

  // === 6. CẬP NHẬT DELIVERY ADDRESS ===
  if (orderData.customer) {
    const customer = orderData.customer;
    const addressText = `
      ${customer.fullname || '-'} | ${customer.phone || '-'}<br>
      ${customer.address || '-'}, ${customer.detail || ''}
    `;
    document.querySelector('.delivery-text').innerHTML = addressText;
  }

  // === 7. XỬ LÝ UPLOAD ẢNH CHỨNG TỪ THANH TOÁN ===
  const proofImageInput = document.getElementById('proofImage');
  const fileNameSpan = document.getElementById('fileName');
  
  proofImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      fileNameSpan.textContent = this.files[0].name;
    } else {
      fileNameSpan.textContent = '';
    }
  });

  // === 8. XỬ LÝ NÚT PAY NOW ===
  document.querySelector('.btn-pay').addEventListener('click', function() {
    if (!proofImageInput.files || !proofImageInput.files[0]) {
      alert('Please upload proof of transfer before proceeding.');
      return;
    }
    
    // Lưu thông tin thanh toán vào localStorage
    const paymentData = {
      orderId: orderId,
      amount: total,
      paymentDate: new Date().toISOString(),
      status: 'pending'
    };
    
    localStorage.setItem('paymentData', JSON.stringify(paymentData));
    
    // Chuyển hướng đến trang xác nhận thanh toán
    alert('Payment submitted! Redirecting to confirmation page...');
    window.location.href = '08_PAYMENT_CONFIRM.html';
  });

  // === 9. HÀM HỖ TRỢ ===
  function calculateSubtotal(cart) {
    return cart.reduce((sum, item) => {
      const price = parseInt(item.price) || parseInt(item.original_price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  }
  
  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
  }
  
  function generateOrderId() {
    // Tạo ID đơn hàng từ timestamp để đảm bảo duy nhất
    return Math.floor(1000 + Math.random() * 9000);
  }
});