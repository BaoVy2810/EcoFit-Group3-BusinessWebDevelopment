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
    updateCartBadge
  };
}

// ==========================================
// SHOPPING_CART.JS - Quản lý giỏ hàng
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // ===== PHẦN MỚI: LOAD CART TỪ LOCALSTORAGE =====
    loadCartFromStorage();
    
    // ===== PHẦN CŨ (GIỮ NGUYÊN): XỬ LÝ CART =====
    
    // === 1. Handle quantity control ===
    function attachQuantityControls() {
        const quantityControls = document.querySelectorAll('.quantity-control');
        quantityControls.forEach(control => {
            const minusBtn = control.querySelector('.minus');
            const plusBtn = control.querySelector('.plus');
            const input = control.querySelector('.qty-input');
            
            minusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                    
                    // Cập nhật localStorage
                    const index = parseInt(input.dataset.index);
                    CartHandler.updateCartItemQuantity(index, value - 1);
                    
                    updateCartTotal();
                }
            });

            plusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                input.value = value + 1;
                
                // Cập nhật localStorage
                const index = parseInt(input.dataset.index);
                CartHandler.updateCartItemQuantity(index, value + 1);
                
                updateCartTotal();
            });

            input.addEventListener('change', () => {
                if (input.value < 1) input.value = 1;
                
                // Cập nhật localStorage
                const index = parseInt(input.dataset.index);
                CartHandler.updateCartItemQuantity(index, parseInt(input.value));
                
                updateCartTotal();
            });
        });
    }

    // === 2. Remove item functionality ===
    function attachRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const cartItem = this.closest('.cart-item');
                const index = parseInt(this.dataset.index);
                
                cartItem.style.opacity = '0';
                cartItem.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    // Xóa khỏi localStorage
                    CartHandler.removeFromCart(index);
                    
                    cartItem.remove();
                    updateCartTotal();

                    const remainingItems = document.querySelectorAll('.cart-item');
                    if (remainingItems.length === 0) showEmptyCart();
                }, 300);
            });
        });
    }

    // === 3. Checkbox select/deselect ===
    function attachCheckboxes() {
        const checkboxes = document.querySelectorAll('.cart-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateCartTotal);
        });
    }

    // === 4. Checkout button ===
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const checkedItems = document.querySelectorAll('.cart-checkbox:checked');
            
            if (checkedItems.length === 0) {
                alert('⚠ Please select at least one item to checkout');
                return;
            }

            // Tạo mảng cartData chứa các item đã chọn
            const cartData = [];
            checkedItems.forEach(checkbox => {
                const item = checkbox.closest('.cart-item');
                const name = item.querySelector('.cart-item__name').textContent;
                const color = item.querySelectorAll('.cart-item__detail')[0].textContent.split(': ')[1];
                const size = item.querySelectorAll('.cart-item__detail')[1].textContent.split(': ')[1];
                const quantity = parseInt(item.querySelector('.qty-input').value);
                const priceText = item.querySelector('.cart-item__subtotal .price').textContent;
                const price = parseInt(priceText.replace(/\./g, ''));
                const image = item.querySelector('img').src;

                cartData.push({
                    name,
                    color,
                    size,
                    quantity,
                    price,
                    image
                });
            });

            // Lưu sang localStorage để checkout đọc
            localStorage.setItem('checkoutCart', JSON.stringify(cartData));

            // Chuyển sang trang checkout
            window.location.href = '06_CHECKOUT.html';
        });
    }

    // === 5. Cập nhật tổng tiền ===
    function updateCartTotal() {
        let subtotal = 0;
        const shippingCost = 30000;

        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            const checkbox = item.querySelector('.cart-checkbox');
            if (checkbox && checkbox.checked) {
                const quantity = parseInt(item.querySelector('.qty-input').value);
                const priceText = item.querySelector('.cart-item__subtotal .price').textContent;
                const price = parseInt(priceText.replace(/\./g, ''));
                subtotal += (price * quantity);
            }
        });

        const total = subtotal + shippingCost;

        // Cập nhật hiển thị
        const summaryRow = document.querySelectorAll('.order-summary__row')[0];
        if (summaryRow) {
            summaryRow.querySelector('.order-summary__value').textContent = formatPrice(subtotal);
        }
        
        const totalValue = document.querySelector('.total-value');
        if (totalValue) {
            totalValue.textContent = formatPrice(total);
        }
    }

    // === 6. Format giá tiền ===
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // === 7. Khi giỏ trống ===
    function showEmptyCart() {
        const cartTable = document.querySelector('.cart-table');
        if (cartTable) {
            cartTable.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <p style="font-size: 18px; margin-bottom: 20px;">🛒 Your cart is empty</p>
                    <a href="02_PRODUCT_CATEGORY.html" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #69BD76 0%, #3DA547 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600;">Continue Shopping</a>
                </div>
            `;
        }
    }

    // === 8. Style animation ===
    const style = document.createElement('style');
    style.textContent = `
        .cart-item { transition: all 0.3s ease; }
    `;
    document.head.appendChild(style);

    // ===== PHẦN MỚI: LOAD CART TỪ LOCALSTORAGE =====
    function loadCartFromStorage() {
        const cart = CartHandler.getCart();
        const cartTableBody = document.querySelector('.cart-table');
        
        if (!cartTableBody) return;
        
        if (cart.length === 0) {
            showEmptyCart();
            return;
        }
        
        // Hiển thị các sản phẩm trong giỏ
        let cartHTML = '';
        cart.forEach((item, index) => {
            cartHTML += `
                <div class="cart-item">
                    <input type="checkbox" class="cart-checkbox" checked data-index="${index}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item__details">
                        <h3 class="cart-item__name">${item.name}</h3>
                        <p class="cart-item__detail">Color: ${item.color}</p>
                        <p class="cart-item__detail">Size: ${item.size}</p>
                    </div>
                    <div class="cart-item__price">
                        <p class="price">${formatPrice(item.price)}</p>
                    </div>
                    <div class="quantity-control">
                        <button class="minus" data-index="${index}">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}">
                        <button class="plus" data-index="${index}">+</button>
                    </div>
                    <div class="cart-item__subtotal">
                        <p class="price">${formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <button class="remove-btn" data-index="${index}">🗑️</button>
                </div>
            `;
        });
        
        cartTableBody.innerHTML = cartHTML;
        
        // Gắn lại các sự kiện sau khi render HTML
        attachQuantityControls();
        attachRemoveButtons();
        attachCheckboxes();
        updateCartTotal();
    }
});