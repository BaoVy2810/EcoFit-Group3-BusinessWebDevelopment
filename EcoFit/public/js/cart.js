// ==========================================
// CART_HANDLER.JS - Quản lý giỏ hàng
// ==========================================

/**
 * Lấy cart từ localStorage
 */
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

/**
 * Lưu cart vào localStorage
 */
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
function addToCart(product) {
  const cart = getCart();
  
  // Kiểm tra sản phẩm đã tồn tại chưa (cùng id, color, size)
  const existingIndex = cart.findIndex(item => 
    item.product_id === product.product_id && 
    item.color === product.color && 
    item.size === product.size
  );
  
  if (existingIndex !== -1) {
    // Nếu đã có, tăng quantity
    cart[existingIndex].quantity += product.quantity;
  } else {
    // Nếu chưa có, thêm mới
    cart.push(product);
  }
  
  saveCart(cart);
  console.log('✅ Added to cart:', product);
  return true;
}

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

/**
 * Cập nhật số lượng sản phẩm
 */
function updateCartItemQuantity(index, quantity) {
  const cart = getCart();
  if (cart[index]) {
    cart[index].quantity = quantity;
    saveCart(cart);
  }
}

/**
 * Xóa toàn bộ giỏ hàng
 */
function clearCart() {
  localStorage.removeItem('cart');
  updateCartBadge();
}

/**
 * Cập nhật badge số lượng giỏ hàng trên header
 */
function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Cập nhật badge trong header iframe
  const headerFrame = document.getElementById('header-frame');
  if (headerFrame && headerFrame.contentWindow) {
    headerFrame.contentWindow.postMessage({
      action: 'updateCartBadge',
      count: totalItems
    }, '*');
  }
}

/**
 * Format giá tiền
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Load cart từ storage và render
 */
function loadCartFromStorage() {
  const cart = CartHandler.getCart();
  const cartContainer = document.getElementById('cart-items-container');
  
  if (!cartContainer) return;
  
  if (cart.length === 0) {
    showEmptyCart();
    return;
  }
  
  // Render cart items
  let cartHTML = '';
  cart.forEach((item, index) => {
    // Sửa lỗi undefined product name - sử dụng name hoặc product_name
    const productName = item.name || item.product_name || 'Unknown Product';
    
    cartHTML += `
      <div class="cart-item">
        <div class="cart-item__left">
          <input type="checkbox" class="cart-checkbox" checked data-index="${index}">
          <div class="cart-item__image">
            <img 
              src="${item.image || '../images/default-placeholder.png'}" 
              alt="${productName}"
              onerror="this.src='../images/default-placeholder.png'"
            >
          </div>
          <div class="cart-item__info">
            <h3 class="cart-item__name">${productName}</h3>
            <p class="cart-item__detail">Color: ${item.color}</p>
            <p class="cart-item__detail">Size: ${item.size}</p>
          </div>
        </div>
        <div class="cart-item__quantity">
          <div class="quantity-control">
            <button class="qty-btn minus" data-index="${index}">−</button>
            <input type="number" value="${item.quantity}" min="1" class="qty-input" readonly data-index="${index}">
            <button class="qty-btn plus" data-index="${index}">+</button>
          </div>
        </div>
        <div class="cart-item__subtotal">
          <!-- Sửa: Hiển thị đơn giá cố định thay vì subtotal thay đổi -->
          <span class="price">${formatPrice(item.price)}</span>
          <button class="remove-btn" data-index="${index}">×</button>
        </div>
      </div>
    `;
  });
  
  cartContainer.innerHTML = cartHTML;
  
  // Attach event listeners
  attachQuantityControls();
  attachRemoveButtons();
  attachCheckboxes();
  updateCartTotal();
}

/**
 * Quantity controls
 */
function attachQuantityControls() {
  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const input = this.previousElementSibling;
      const newValue = parseInt(input.value) + 1;
      input.value = newValue;
      
      CartHandler.updateCartItemQuantity(index, newValue);
      // ĐÃ XÓA: không còn updateItemSubtotal vì subtotal không thay đổi
      updateCartTotal();
    });
  });

  document.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const input = this.nextElementSibling;
      const currentValue = parseInt(input.value);
      
      if (currentValue > 1) {
        const newValue = currentValue - 1;
        input.value = newValue;
        
        CartHandler.updateCartItemQuantity(index, newValue);
        // ĐÃ XÓA: không còn updateItemSubtotal vì subtotal không thay đổi
        updateCartTotal();
      }
    });
  });
}

/**
 * Remove buttons
 */
function attachRemoveButtons() {
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('Remove this item from cart?')) {
        const index = parseInt(this.dataset.index);
        const cartItem = this.closest('.cart-item');
        
        cartItem.style.opacity = '0';
        cartItem.style.transform = 'translateX(20px)';
        cartItem.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          CartHandler.removeFromCart(index);
          loadCartFromStorage(); // Reload cart
          
          const remainingItems = document.querySelectorAll('.cart-item');
          if (remainingItems.length === 0) {
            showEmptyCart();
          }
        }, 300);
      }
    });
  });
}

/**
 * Checkboxes
 */
function attachCheckboxes() {
  document.querySelectorAll('.cart-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateCartTotal);
  });
}

/**
 * Update cart total
 */
function updateCartTotal() {
  const cartItems = document.querySelectorAll('.cart-item');
  const cart = CartHandler.getCart();
  let subtotal = 0;
  let checkedCount = 0;

  cartItems.forEach((item, idx) => {
    const checkbox = item.querySelector('.cart-checkbox');
    
    if (checkbox && checkbox.checked && cart[idx]) {
      const quantity = cart[idx].quantity;
      const price = cart[idx].price;
      subtotal += price * quantity;
      checkedCount++;
    }
  });

  const shippingCost = 30000;
  const total = subtotal + (checkedCount > 0 ? shippingCost : 0);

  document.getElementById('subtotal-amount').textContent = formatPrice(subtotal);
  document.getElementById('total-amount').textContent = formatPrice(total);
}

/**
 * Show empty cart
 */
function showEmptyCart() {
  const cartContainer = document.getElementById('cart-items-container');
  if (cartContainer) {
    cartContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #999;">
        <p style="font-size: 18px; margin-bottom: 20px;">🛒 Your cart is empty</p>
        <a href="02_PRODUCT_CATEGORY.html" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #69BD76 0%, #3DA547 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600;">Continue Shopping</a>
      </div>
    `;
  }
  document.getElementById('subtotal-amount').textContent = '0';
  document.getElementById('total-amount').textContent = '0';
}

/**
 * Checkout validation
 */
function attachCheckoutValidation() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e) {
      const checkedItems = document.querySelectorAll('.cart-checkbox:checked');
      
      if (checkedItems.length === 0) {
        e.preventDefault();
        alert('⚠️ Please select at least one item to checkout');
        return;
      }

      // Save selected items to checkout
      const cart = CartHandler.getCart();
      const cartData = [];
      
      checkedItems.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const item = cart[index];
        if (item) {
          // Sửa lỗi undefined name trong checkout data
          const productName = item.name || item.product_name || 'Unknown Product';
          cartData.push({
            ...item,
            name: productName
          });
        }
      });

      localStorage.setItem('checkoutCart', JSON.stringify(cartData));
    });
  }
}

/**
 * Initialize cart page
 */
function initializeCartPage() {
  loadCartFromStorage();
  attachCheckoutValidation();
}

/**
 * Export functions
 */
if (typeof window !== 'undefined') {
  window.CartHandler = {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    updateCartBadge,
    loadCartFromStorage,
    attachQuantityControls,
    attachRemoveButtons,
    attachCheckboxes,
    updateCartTotal,
    formatPrice,
    showEmptyCart,
    attachCheckoutValidation,
    initializeCartPage
  };
}

// ==========================================
// SHOPPING_CART.JS - Quản lý giỏ hàng
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  // Khởi tạo trang giỏ hàng
  if (document.getElementById('cart-items-container')) {
    initializeCartPage();
  }
});