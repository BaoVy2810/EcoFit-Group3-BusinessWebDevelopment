function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const cart = getCart();
  
  const existingIndex = cart.findIndex(item => 
    item.product_id === product.product_id && 
    item.color === product.color && 
    item.size === product.size
  );
  
  if (existingIndex !== -1) {
    cart[existingIndex].quantity += product.quantity;
  } else {
    cart.push(product);
  }
  
  saveCart(cart);
  console.log('✅ Added to cart:', product);
  return true;
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

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
function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const headerFrame = document.getElementById('header-frame');
  if (window.parent !== window) {
    window.parent.postMessage({
      action: 'updateCartBadge',
      count: totalItems
    }, 'https://ecofit-store.netlify.app');
  }
}

function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
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
    const productName = item.name || item.product_name || 'Unknown Product';
    const productId = item.product_id || 'P001';
    
    cartHTML += `
      <div class="cart-item">
        <div class="cart-item__left">
          <input type="checkbox" class="cart-checkbox" checked data-index="${index}">
          
          <a href="../pages/04_PRODUCT_Detail.html?id=${productId}" class="cart-item__image-link">
            <div class="cart-item__image">
              <img 
                src="${item.image || '../images/default-placeholder.png'}" 
                alt="${productName}"
                onerror="this.src='../images/default-placeholder.png'"
              >
            </div>
          </a>
          
          <div class="cart-item__info">
            <a href="../pages/04_PRODUCT_Detail.html?id=${productId}" class="cart-item__name-link">
              <h3 class="cart-item__name">${productName}</h3>
            </a>
            <p class="cart-item__detail">Color: ${item.color}</p>
            <p class="cart-item__detail">Size: ${item.size}</p>
          </div>
        </div>
        
        <div class="cart-item__quantity">
          <div class="quantity-control">
            <button class="qty-btn minus" data-index="${index}">-</button>
            <input type="number" value="${item.quantity}" min="1" class="qty-input" readonly data-index="${index}">
            <button class="qty-btn plus" data-index="${index}">+</button>
          </div>
        </div>
        
        <div class="cart-item__subtotal">
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

function attachQuantityControls() {
  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const input = this.previousElementSibling;
      const newValue = parseInt(input.value) + 1;
      input.value = newValue;
      
      CartHandler.updateCartItemQuantity(index, newValue);
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
        updateCartTotal();
      }
    });
  });
}

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

function attachCheckboxes() {
  document.querySelectorAll('.cart-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateCartTotal);
  });
}

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

function showEmptyCart() {
  const cartContainer = document.getElementById('cart-items-container');
  if (cartContainer) {
    cartContainer.innerHTML = `
      <div style="text-align: center;
                  color: #999;
                  ">
        <p style="font-size: 18px;
                  margin-bottom: 20px;">
                  🛒 Your cart is empty
        </p>
        <a href="02_PRODUCT_CATEGORY.html" style="display: inline-block; 
                                                  padding: 12px 30px; 
                                                  background: linear-gradient(135deg, #69BD76 0%, #3DA547 100%); 
                                                  color: white; text-decoration: none; 
                                                  border-radius: 30px; 
                                                  font-weight: 600;">
                                                  Continue Shopping</a>
      </div>
    `;
    cartContainer.style.minHeight = "300px";
    cartContainer.style.minWidth = "770px";
  }
  document.getElementById('subtotal-amount').textContent = '0';
  document.getElementById('total-amount').textContent = '0';
}
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

      const cart = CartHandler.getCart();
      const cartData = [];
      
      checkedItems.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const item = cart[index];
        if (item) {
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

function initializeCartPage() {
  loadCartFromStorage();
  attachCheckoutValidation();
}

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

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('cart-items-container')) {
    initializeCartPage();
  }
});
window.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();
});
window.addEventListener('message', function(e) {
  if (e.data.action === 'updateCartBadge') {
    const badge = document.querySelector('a[href*="05_SHOPPING_CART"] .badge');
    if (badge) {
      badge.textContent = e.data.count;
      badge.style.display = e.data.count > 0 ? 'inline-block' : 'none';
    }
  }
});